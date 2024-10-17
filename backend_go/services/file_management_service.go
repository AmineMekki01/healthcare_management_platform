package services

import (
	"archive/zip"
	"backend_go/models"
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
)

func createS3Client() *s3.S3 {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(os.Getenv("S3_BUCKET_REGION")),
	})
	if err != nil {
		log.Fatalf("Unable to create AWS session: %v", err)
	}
	return s3.New(sess)
}

// get parent folder path
func getParentFolderPath(folderID string, pool *pgxpool.Pool) (string, error) {
	var parentFolder models.FileFolder
	row := pool.QueryRow(context.Background(), "SELECT name, parent_id FROM folder_file_info WHERE id = $1", folderID)
	err := row.Scan(&parentFolder.Name, &parentFolder.ParentID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return "", nil
		}
		log.Println("Error getting parent folder:", err)
		return "", err
	}
	if parentFolder.ParentID == nil {
		return parentFolder.Name, nil
	}
	parentPath, err := getParentFolderPath(*parentFolder.ParentID, pool)
	if err != nil {
		log.Println("Error getting parent folder path:", err)
		return "", err
	}
	return filepath.Join(parentPath, parentFolder.Name), nil
}

// Creating a folder
func CreateFolder(c *gin.Context, pool *pgxpool.Pool) {
	var fileFolder models.FileFolder
	if err := c.ShouldBind(&fileFolder); err != nil {
		log.Println("Error parsing form:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	folderUUID, err := uuid.NewRandom()
	if err != nil {
		log.Println("Error generating folder UUID:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate folder UUID"})
		return
	}
	fileFolder.ID = folderUUID.String()
	fileFolder.CreatedAt = time.Now()
	fileFolder.UpdatedAt = time.Now()

	var size int64
	fileFolder.Size = size
	var ext *string
	fileFolder.Ext = ext

	folderPath := filepath.Join(fileFolder.UserID)
	if fileFolder.ParentID != nil && *fileFolder.ParentID != "" {
		parentFolderPath, err := getParentFolderPath(*fileFolder.ParentID, pool)
		if err != nil {
			log.Println("Error retrieving parent folder path:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		folderPath = fmt.Sprintf("%s/%s", folderPath, parentFolderPath)
	}
	folderPath = fmt.Sprintf("records/%s/%s/%s", folderPath, fileFolder.Name, "/marker.txt")
	folderPath = filepath.ToSlash(folderPath)
	s3Client := createS3Client()
	bucket := os.Getenv("S3_BUCKET_NAME")

	emptyFile := bytes.NewReader([]byte{})

	_, err = s3Client.PutObject(&s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(folderPath),
		Body:   emptyFile,
	})
	if err != nil {
		log.Printf("Error uploading file to S3: %s\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload file to S3"})
		return
	}

	conn, err := pool.Acquire(c.Request.Context())
	if err != nil {
		log.Println("Error acquiring connection:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not acquire database connection"})
		return
	}
	defer conn.Release()

	tx, err := conn.Begin(c.Request.Context())
	if err != nil {
		log.Println("Error beginning transaction:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not begin transaction"})
		return
	}

	_, err = tx.Exec(c.Request.Context(),
		"INSERT INTO folder_file_info (id, name, created_at, updated_at, type, user_id, user_type, parent_id, size, extension, path) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
		fileFolder.ID, fileFolder.Name, fileFolder.CreatedAt, fileFolder.UpdatedAt, fileFolder.Type, fileFolder.UserID, fileFolder.UserType, fileFolder.ParentID, fileFolder.Size, fileFolder.Ext, folderPath)
	if err != nil {
		log.Println("Error inserting folder info:", err)
		tx.Rollback(c.Request.Context())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not insert folder info"})
		return
	}

	if err := tx.Commit(c.Request.Context()); err != nil {
		log.Println("Error committing transaction:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not commit transaction"})
		return
	}

	c.JSON(http.StatusOK, fileFolder)
}

// Uploading a file to ss3
func UploadFile(c *gin.Context, pool *pgxpool.Pool) {
	var fileInfo models.FileFolder

	err := c.Request.ParseMultipartForm(10 << 20)
	if err != nil {
		log.Println("Error parsing multipart form:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Could not parse multipart form"})
		return
	}

	file, handler, err := c.Request.FormFile("file")
	if err != nil {
		log.Println("Error retrieving file from request:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Could not get file from request"})
		return
	}
	defer file.Close()
	parentFolderID := c.Request.FormValue("parentFolderId")
	if parentFolderID != "" {
		if _, err := uuid.Parse(parentFolderID); err != nil {
			log.Printf("Invalid parentFolderId: %s\n", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parentFolderId"})
			return
		}
		fileInfo.ParentID = &parentFolderID
	} else {
		fileInfo.ParentID = nil
	}
	fileInfo.CreatedAt = time.Now()
	fileInfo.UpdatedAt = time.Now()
	fileInfo.Type = c.Request.FormValue("fileType")
	ext := c.Request.FormValue("fileExt")
	fileInfo.Ext = &ext
	fileInfo.UserID = c.Request.FormValue("userId")
	fileInfo.UserType = c.Request.FormValue("userType")
	fileInfo.Size = handler.Size
	fileInfo.Name = handler.Filename
	id, _ := uuid.NewRandom()
	fileInfo.ID = id.String()

	if fileInfo.ParentID != nil && *fileInfo.ParentID != "" {
		parentFolderPath, err := getParentFolderPath(*fileInfo.ParentID, pool)
		if err != nil {
			log.Println("Error retrieving parent folder path:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		fileInfo.Path = fmt.Sprintf("records/%s/%s/%s", fileInfo.UserID, parentFolderPath, fileInfo.Name)
	} else {
		fileInfo.Path = fmt.Sprintf("records/%s/%s", fileInfo.UserID, fileInfo.Name)
	}
	s3Client := createS3Client()
	bucket := os.Getenv("S3_BUCKET_NAME")
	fileInfo.Path = filepath.ToSlash(fileInfo.Path)
	_, err = s3Client.PutObject(&s3.PutObjectInput{
		Bucket:        aws.String(bucket),
		Key:           aws.String(fileInfo.Path),
		Body:          file,
		ContentLength: aws.Int64(fileInfo.Size),
		ContentType:   aws.String(handler.Header.Get("Content-Type")),
	})
	if err != nil {
		log.Printf("Error uploading file to S3: %s\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload file to S3"})
		return
	}

	_, err = pool.Exec(c.Request.Context(), "INSERT INTO folder_file_info (id, name, created_at, updated_at, type, size, extension, user_id, user_type, parent_id, path) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
		fileInfo.ID, fileInfo.Name, fileInfo.CreatedAt, fileInfo.UpdatedAt, fileInfo.Type, fileInfo.Size, fileInfo.Ext, fileInfo.UserID, fileInfo.UserType, fileInfo.ParentID, fileInfo.Path)
	if err != nil {
		log.Printf("Error inserting file info: %s\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert file info"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "File uploaded successfully"})
}

// Dowanloding a file to s3
func DownloadFile(c *gin.Context, pool *pgxpool.Pool) {
	fileId := c.Param("fileId")
	log.Printf("Requested file ID: %s", fileId)

	conn, err := pool.Acquire(c.Request.Context())
	if err != nil {
		log.Printf("Error acquiring connection: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not acquire database connection"})
		return
	}
	defer conn.Release()

	var file models.FileFolder
	err = conn.QueryRow(c.Request.Context(), "SELECT id, name, path, type FROM folder_file_info WHERE id = $1", fileId).Scan(&file.ID, &file.Name, &file.Path, &file.Type)
	if err != nil {
		log.Printf("Error retrieving file information: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve file information"})
		return
	}

	s3Client := createS3Client()
	bucket := os.Getenv("S3_BUCKET_NAME")

	if file.Type == "folder" {
		zipFilePath, err := createZipFromFolder(file.Path)
		if err != nil {
			log.Printf("Error creating zip file: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create zip file"})
			return
		}
		log.Printf("Zip file created: %s", zipFilePath)
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s.zip", file.Name))
		c.Header("Content-Type", "application/zip")
		c.File(zipFilePath)
	} else {
		s3Object, err := s3Client.GetObject(&s3.GetObjectInput{
			Bucket: aws.String(bucket),
			Key:    aws.String(file.Path),
		})
		if err != nil {
			log.Printf("Error retrieving file from S3: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve file from S3"})
			return
		}
		defer s3Object.Body.Close()

		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", file.Name))
		c.Header("Content-Type", *s3Object.ContentType)
		c.Header("Content-Length", fmt.Sprintf("%d", *s3Object.ContentLength))
		io.Copy(c.Writer, s3Object.Body)
	}
}

// delete folder and content from ss3
func DeleteFolderAndContents(c *gin.Context, pool *pgxpool.Pool) {
	var request struct {
		FolderID string `json:"folderId"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		log.Println("Error parsing JSON:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	tx, err := pool.Begin(c.Request.Context())
	if err != nil {
		log.Println("Error beginning transaction:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not begin transaction"})
		return
	}
	defer tx.Rollback(c.Request.Context())

	cteQuery := `
        WITH RECURSIVE subfolders AS (
            SELECT id, path, type FROM folder_file_info WHERE id = $1
            UNION ALL
            SELECT fi.id, fi.path, fi.type FROM folder_file_info fi
            INNER JOIN subfolders s ON s.id = fi.parent_id
        )
        SELECT id, path FROM subfolders;
    `
	rows, err := tx.Query(c.Request.Context(), cteQuery, request.FolderID)
	if err != nil {
		log.Println("Error querying subfolders:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve folder contents"})
		return
	}
	defer rows.Close()

	var paths []string
	for rows.Next() {
		var id, path string
		if err := rows.Scan(&id, &path); err != nil {
			log.Println("Error scanning row:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve folder contents"})
			return
		}
		if strings.TrimSpace(path) != "" {
			paths = append(paths, path)
		}
	}

	s3Client := createS3Client()
	bucket := os.Getenv("S3_BUCKET_NAME")
	for _, path := range paths {
		log.Printf("path: %s", path)
		_, err := s3Client.DeleteObject(&s3.DeleteObjectInput{
			Bucket: aws.String(bucket),
			Key:    aws.String(path),
		})
		if err != nil {
			log.Printf("Error deleting file from S3: %s\n", err)
			log.Printf("Error deleting file : %s\n", path)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete folder contents from S3"})
			return
		}
	}

	deleteQuery := `
        WITH RECURSIVE subfolders AS (
            SELECT id FROM folder_file_info WHERE id = $1
            UNION ALL
            SELECT fi.id FROM folder_file_info fi
            INNER JOIN subfolders s ON fi.parent_id = s.id
        )
        DELETE FROM folder_file_info WHERE id IN (SELECT id FROM subfolders);
    `
	_, err = tx.Exec(c.Request.Context(), deleteQuery, request.FolderID)
	if err != nil {
		log.Println("Error deleting folder contents from database:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not delete folder contents"})
		return
	}

	if err := tx.Commit(c.Request.Context()); err != nil {
		log.Println("Error committing transaction:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not commit transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Folder and contents deleted successfully"})
}

// create the zip file from the folder
func createZipFromFolder(folderPath string) (string, error) {
	log.Printf("Creating ZIP from folder: %s", folderPath)
	zipFileName := fmt.Sprintf("%s.zip", uuid.New().String())
	zipFilePath := filepath.Join(os.TempDir(), zipFileName)

	newZipFile, err := os.Create(zipFilePath)
	if err != nil {
		log.Printf("Error creating zip file: %v", err)
		return "", err
	}
	defer newZipFile.Close()
	zipWriter := zip.NewWriter(newZipFile)
	defer zipWriter.Close()

	err = addFilesToZip(zipWriter, folderPath, "")
	if err != nil {
		log.Printf("Error adding files to zip: %v", err)
		return "", err
	}

	return zipFilePath, nil
}

// recursively adding files to the zip archive
func addFilesToZip(zipWriter *zip.Writer, basePath, baseInZip string) error {
	log.Printf("Adding files to ZIP: BasePath: %s, BaseInZip: %s", basePath, baseInZip)

	s3Client := createS3Client()
	bucket := os.Getenv("S3_BUCKET_NAME")

	prefix := strings.TrimSuffix(basePath, "/marker.txt")
	resp, err := s3Client.ListObjectsV2(&s3.ListObjectsV2Input{
		Bucket: aws.String(bucket),
		Prefix: aws.String(prefix),
	})
	if err != nil {
		log.Printf("Error listing S3 objects: %v", err)
		return err
	}

	for _, item := range resp.Contents {
		key := *item.Key
		if key == prefix+"/marker.txt" {
			continue
		}
		log.Printf("Processing S3 object: %s", key)

		relativePath := strings.TrimPrefix(key, prefix+"/")
		if strings.HasSuffix(key, "/") {
			// Recursive call for directories
			newBaseInZip := filepath.Join(baseInZip, relativePath)
			err = addFilesToZip(zipWriter, key, newBaseInZip)
			if err != nil {
				log.Printf("Error adding directory to zip: %v", err)
				return err
			}
		} else {
			// Retrieve the file from S3
			obj, err := s3Client.GetObject(&s3.GetObjectInput{
				Bucket: aws.String(bucket),
				Key:    aws.String(key),
			})
			if err != nil {
				log.Printf("Error getting S3 object: %v", err)
				return err
			}
			defer obj.Body.Close()

			// Create a new file inside the zip
			f, err := zipWriter.Create(filepath.Join(baseInZip, relativePath))
			if err != nil {
				log.Printf("Error creating zip entry: %v", err)
				return err
			}

			// Copy the file content to the zip file
			_, err = io.Copy(f, obj.Body)
			if err != nil {
				log.Printf("Error writing to zip entry: %v", err)
				return err
			}
		}
	}

	return nil
}

// Rename a file or folder in s3 and ui related db
func RenameFileOrFolder(c *gin.Context, pool *pgxpool.Pool) {
	var request struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		log.Println("Error parsing JSON:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	tx, err := pool.Begin(c.Request.Context())
	if err != nil {
		log.Println("Error beginning transaction:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not begin transaction"})
		return
	}
	defer tx.Rollback(c.Request.Context())

	var oldPath, itemType string
	err = tx.QueryRow(c.Request.Context(), "SELECT path, type FROM folder_file_info WHERE id = $1", request.ID).Scan(&oldPath, &itemType)
	if err != nil {
		log.Println("Error fetching item details:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch item details"})
		return
	}

	oldPath = url.PathEscape(filepath.ToSlash(oldPath))

	var newPath string

	if itemType == "folder" {
		newPath = strings.Replace(oldPath, "/marker.txt", "", 1)
		newPath = filepath.Dir(newPath)
		newPath = filepath.Join(newPath, request.Name) + "/marker.txt"
	} else {
		newPath = filepath.Join(filepath.Dir(oldPath), request.Name)
	}
	newPath = url.PathEscape(filepath.ToSlash(newPath))
	log.Println("oldPath file:", oldPath)
	log.Println("newPath file:", newPath)

	_, err = tx.Exec(c.Request.Context(), "UPDATE folder_file_info SET name = $1, path = $2, updated_at = $3 WHERE id = $4", request.Name, newPath, time.Now(), request.ID)
	if err != nil {
		log.Println("Error updating item:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not update item"})
		return
	}

	s3Client := createS3Client()
	bucket := os.Getenv("S3_BUCKET_NAME")

	if itemType == "folder" {
		cteQuery := `
			WITH RECURSIVE subfolders AS (
				SELECT id, path FROM folder_file_info WHERE parent_id = $1
				UNION ALL
				SELECT fi.id, fi.path FROM folder_file_info fi
				INNER JOIN subfolders s ON s.id = fi.parent_id
			)
			UPDATE folder_file_info
			SET path = regexp_replace(path, $2, $3)
			WHERE id IN (SELECT id FROM subfolders);
		`
		oldPathPattern := "^" + strings.Replace(filepath.Dir(oldPath), "/", "\\/", -1) + "\\/"
		newPathPattern := strings.Replace(filepath.Dir(newPath), "/", "\\/", -1) + "/"
		_, err = tx.Exec(c.Request.Context(), cteQuery, request.ID, oldPathPattern, newPathPattern)
		if err != nil {
			log.Println("Error updating nested paths:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not update nested paths"})
			return
		}

		err = renameS3Folder(s3Client, bucket, filepath.Dir(oldPath), filepath.Dir(newPath))
		if err != nil {
			log.Println("Error renaming folder in S3:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not rename folder in S3"})
			return
		}
	} else {
		_, err = s3Client.CopyObject(&s3.CopyObjectInput{
			Bucket:     aws.String(bucket),
			CopySource: aws.String(bucket + "/" + oldPath),
			Key:        aws.String(newPath),
		})
		if err != nil {
			log.Println("final oldPath : ", oldPath)
			log.Println("final newPath : ", newPath)
			log.Println("Error renaming file in S3:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not rename file in S3"})
			return
		}

		_, err = s3Client.DeleteObject(&s3.DeleteObjectInput{
			Bucket: aws.String(bucket),
			Key:    aws.String(oldPath),
		})
		if err != nil {
			log.Println("Error deleting old file in S3:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not delete old file in S3"})
			return
		}
	}

	if err := tx.Commit(c.Request.Context()); err != nil {
		log.Println("Error committing transaction:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not commit transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item renamed successfully"})
}

// rename the folder in s3
func renameS3Folder(s3Client *s3.S3, bucket, oldPath, newPath string) error {
	resp, err := s3Client.ListObjectsV2(&s3.ListObjectsV2Input{
		Bucket: aws.String(bucket),
		Prefix: aws.String(oldPath + "/"),
	})
	if err != nil {
		return fmt.Errorf("error listing S3 objects: %w", err)
	}

	for _, item := range resp.Contents {
		oldKey := *item.Key
		newKey := strings.Replace(oldKey, oldPath, newPath, 1)
		_, err = s3Client.CopyObject(&s3.CopyObjectInput{
			Bucket:     aws.String(bucket),
			CopySource: aws.String(bucket + "/" + oldKey),
			Key:        aws.String(newKey),
		})
		if err != nil {
			return fmt.Errorf("error copying S3 object: %w", err)
		}

		_, err = s3Client.DeleteObject(&s3.DeleteObjectInput{
			Bucket: aws.String(bucket),
			Key:    aws.String(oldKey),
		})
		if err != nil {
			return fmt.Errorf("error deleting old S3 object: %w", err)
		}
	}

	return nil
}

// get breadcrumbs
func GetBreadcrumbs(c *gin.Context, pool *pgxpool.Pool) {
	folderID := c.Param("folderId")
	breadcrumbs, err := getParentFolders(folderID, pool)
	if err != nil {
		log.Println("Error getting parent folders:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, breadcrumbs)
}

// get parent folder
func getParentFolders(folderID string, pool *pgxpool.Pool) ([]models.FileFolder, error) {
	var breadcrumbs []models.FileFolder
	for folderID != "" {
		var folder models.FileFolder
		row := pool.QueryRow(context.Background(), "SELECT id, name, parent_id FROM folder_file_info WHERE id = $1", folderID)
		err := row.Scan(&folder.ID, &folder.Name, &folder.ParentID)
		if err != nil {
			log.Println("Error getting parent folder:", err)
			return nil, err
		}
		breadcrumbs = append([]models.FileFolder{folder}, breadcrumbs...)
		folderID = ""
		if folder.ParentID != nil {
			folderID = *folder.ParentID
		}
	}
	return breadcrumbs, nil
}

// get folders
func GetFolders(c *gin.Context, pool *pgxpool.Pool) {
	conn, err := pool.Acquire(c.Request.Context())
	if err != nil {
		log.Println("Error acquiring connection:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not acquire database connection"})
		return
	}
	defer conn.Release()

	userID := c.DefaultQuery("user_id", "")
	userType := c.DefaultQuery("user_type", "")
	parentID := c.Query("parent_id")

	baseQuery := "SELECT id, name, created_at, updated_at, type, extension, path FROM folder_file_info WHERE user_id = $1 AND user_type = $2"
	args := []interface{}{userID, userType}

	if parentID != "" {
		baseQuery += " AND parent_id = $3"
		args = append(args, parentID)
	} else {
		baseQuery += " AND parent_id IS NULL"
	}

	rows, err := conn.Query(c.Request.Context(), baseQuery, args...)
	if err != nil {
		log.Println("Error executing query:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var folders []models.FileFolder

	for rows.Next() {
		var folder models.FileFolder
		var path *string
		err := rows.Scan(&folder.ID, &folder.Name, &folder.CreatedAt, &folder.UpdatedAt, &folder.Type, &folder.Ext, &path)

		if err != nil {
			log.Println("Error scanning row:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if path != nil {
			folder.Path = *path
		} else {
			folder.Path = ""
		}
		folders = append(folders, folder)
	}

	c.JSON(http.StatusOK, folders)
}

// get subfolders
func GetSubfolders(c *gin.Context, pool *pgxpool.Pool) {
	parentID := c.Param("folderId")

	conn, err := pool.Acquire(c.Request.Context())
	if err != nil {
		log.Println("Error acquiring connection:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not acquire database connection"})
		return
	}
	defer conn.Release()

	query := "SELECT id, name, created_at, updated_at FROM folder_file_info WHERE parent_id = $1"

	rows, err := conn.Query(c.Request.Context(), query, parentID)
	if err != nil {
		log.Println("Error executing query:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var subfolders []models.FileFolder

	for rows.Next() {
		var folder models.FileFolder
		err := rows.Scan(&folder.ID, &folder.Name, &folder.CreatedAt, &folder.UpdatedAt)
		if err != nil {
			log.Println("Error scanning row:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		subfolders = append(subfolders, folder)
	}
	if err = rows.Err(); err != nil {
		log.Println("Error scanning row:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, subfolders)
}
