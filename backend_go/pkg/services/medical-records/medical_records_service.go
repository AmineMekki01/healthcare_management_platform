package medicalrecords

import (
	"archive/zip"
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/models"
	"healthcare_backend/pkg/utils"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
)

type MedicalRecordsService struct {
	db  *pgxpool.Pool
	cfg *config.Config
}

func NewMedicalRecordsService(db *pgxpool.Pool, cfg *config.Config) *MedicalRecordsService {
	return &MedicalRecordsService{
		db:  db,
		cfg: cfg,
	}
}

func (s *MedicalRecordsService) CreateFolder(fileFolder *models.FileFolder) error {
	folderUUID, err := uuid.NewRandom()
	if err != nil {
		return fmt.Errorf("could not generate folder UUID: %v", err)
	}

	fileFolder.ID = folderUUID.String()
	fileFolder.CreatedAt = time.Now()
	fileFolder.UpdatedAt = time.Now()
	fileFolder.Size = 0
	fileFolder.Ext = nil

	var folderPath string
	if fileFolder.ParentID != nil && *fileFolder.ParentID != "" {
		parentFolderPath, err := s.getParentFolderPath(*fileFolder.ParentID)
		if err != nil {
			return fmt.Errorf("error retrieving parent folder path: %v", err)
		}
		folderPath = path.Join(fileFolder.UserID, parentFolderPath, fileFolder.Name, "marker.txt")
	} else {
		folderPath = path.Join(fileFolder.UserID, fileFolder.Name, "marker.txt")
	}
	folderPath = path.Join("records", "my-records", folderPath)

	if err := s.uploadMarkerFile(folderPath); err != nil {
		return fmt.Errorf("failed to upload marker file to S3: %v", err)
	}

	conn, err := s.db.Acquire(context.Background())
	if err != nil {
		return fmt.Errorf("could not acquire database connection: %v", err)
	}
	defer conn.Release()

	tx, err := conn.Begin(context.Background())
	if err != nil {
		return fmt.Errorf("could not begin transaction: %v", err)
	}
	defer tx.Rollback(context.Background())

	_, err = tx.Exec(context.Background(),
		"INSERT INTO folder_file_info (id, name, created_at, updated_at, type, user_id, user_type, parent_id, size, extension, path) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
		fileFolder.ID, fileFolder.Name, fileFolder.CreatedAt, fileFolder.UpdatedAt, fileFolder.Type, fileFolder.UserID, fileFolder.UserType, fileFolder.ParentID, fileFolder.Size, fileFolder.Ext, folderPath)
	if err != nil {
		return fmt.Errorf("could not insert folder info: %v", err)
	}

	if err := tx.Commit(context.Background()); err != nil {
		return fmt.Errorf("could not commit transaction: %v", err)
	}

	return nil
}

func (s *MedicalRecordsService) UploadFile(fileInfo *models.FileFolder, file io.Reader, fileSize int64, contentType string) error {
	id, _ := uuid.NewRandom()
	fileInfo.ID = id.String()
	fileInfo.CreatedAt = time.Now()
	fileInfo.UpdatedAt = time.Now()
	fileInfo.Size = fileSize

	if fileInfo.ParentID != nil && *fileInfo.ParentID != "" {
		parentFolderPath, err := s.getParentFolderPath(*fileInfo.ParentID)
		if err != nil {
			return fmt.Errorf("error retrieving parent folder path: %v", err)
		}
		fileInfo.Path = fmt.Sprintf("records/my-records/%s/%s/%s", fileInfo.UserID, parentFolderPath, fileInfo.Name)
	} else {
		fileInfo.Path = fmt.Sprintf("records/my-records/%s/%s", fileInfo.UserID, fileInfo.Name)
	}

	fileInfo.Path = filepath.ToSlash(fileInfo.Path)

	if err := s.uploadFileToS3(fileInfo.Path, file, fileSize, contentType); err != nil {
		return fmt.Errorf("failed to upload file to S3: %v", err)
	}

	_, err := s.db.Exec(context.Background(),
		"INSERT INTO folder_file_info (id, name, created_at, updated_at, type, size, extension, user_id, user_type, parent_id, path) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
		fileInfo.ID, fileInfo.Name, fileInfo.CreatedAt, fileInfo.UpdatedAt, fileInfo.Type, fileInfo.Size, fileInfo.Ext, fileInfo.UserID, fileInfo.UserType, fileInfo.ParentID, fileInfo.Path)
	if err != nil {
		return fmt.Errorf("failed to insert file info: %v", err)
	}

	return nil
}

func (s *MedicalRecordsService) DownloadFile(fileID string) (*models.FileFolder, io.ReadCloser, error) {
	conn, err := s.db.Acquire(context.Background())
	if err != nil {
		return nil, nil, fmt.Errorf("could not acquire database connection: %v", err)
	}
	defer conn.Release()

	var file models.FileFolder
	err = conn.QueryRow(context.Background(),
		"SELECT id, name, path, type FROM folder_file_info WHERE id = $1", fileID).Scan(&file.ID, &file.Name, &file.Path, &file.Type)
	if err != nil {
		return nil, nil, fmt.Errorf("could not retrieve file information: %v", err)
	}

	if file.Type == "folder" {
		zipFilePath, err := s.createZipFromFolder(file.Path)
		if err != nil {
			return nil, nil, fmt.Errorf("could not create zip file: %v", err)
		}

		zipFile, err := os.Open(zipFilePath)
		if err != nil {
			return nil, nil, fmt.Errorf("could not open zip file: %v", err)
		}

		return &file, zipFile, nil
	} else {
		fileReader, err := s.downloadFileFromS3(file.Path)
		if err != nil {
			return nil, nil, fmt.Errorf("could not retrieve file from S3: %v", err)
		}
		return &file, fileReader, nil
	}
}

func (s *MedicalRecordsService) DeleteFolderAndContents(folderID string) error {
	tx, err := s.db.Begin(context.Background())
	if err != nil {
		return fmt.Errorf("could not begin transaction: %v", err)
	}
	defer tx.Rollback(context.Background())

	cteQuery := `
		WITH RECURSIVE subfolders AS (
			SELECT id, path, type FROM folder_file_info WHERE id = $1
			UNION ALL
			SELECT fi.id, fi.path, fi.type FROM folder_file_info fi
			INNER JOIN subfolders s ON s.id = fi.parent_id
		)
		SELECT id, path FROM subfolders;
	`
	rows, err := tx.Query(context.Background(), cteQuery, folderID)
	if err != nil {
		return fmt.Errorf("could not retrieve folder contents: %v", err)
	}
	defer rows.Close()

	var paths []string
	for rows.Next() {
		var id, path string
		if err := rows.Scan(&id, &path); err != nil {
			return fmt.Errorf("could not retrieve folder contents: %v", err)
		}
		if strings.TrimSpace(path) != "" {
			paths = append(paths, path)
		}
	}

	for _, path := range paths {
		if err := s.deleteFileFromS3(path); err != nil {
			return fmt.Errorf("failed to delete file from S3: %v", err)
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
	_, err = tx.Exec(context.Background(), deleteQuery, folderID)
	if err != nil {
		return fmt.Errorf("could not delete folder contents: %v", err)
	}

	if err := tx.Commit(context.Background()); err != nil {
		return fmt.Errorf("could not commit transaction: %v", err)
	}

	return nil
}

func (s *MedicalRecordsService) RenameFileOrFolder(id, newName string) error {
	tx, err := s.db.Begin(context.Background())
	if err != nil {
		return fmt.Errorf("could not begin transaction: %v", err)
	}
	defer tx.Rollback(context.Background())

	var oldPath, itemType string
	err = tx.QueryRow(context.Background(),
		"SELECT path, type FROM folder_file_info WHERE id = $1", id).Scan(&oldPath, &itemType)
	if err != nil {
		return fmt.Errorf("could not fetch item details: %v", err)
	}

	var newPath string
	if itemType == "folder" {
		oldFolderPath := strings.TrimSuffix(oldPath, "/marker.txt")
		parentPath := path.Dir(oldFolderPath)
		newFolderPath := path.Join(parentPath, newName)
		newPath = path.Join(newFolderPath, "marker.txt")
	} else {
		newPath = path.Join(path.Dir(oldPath), newName)
	}

	_, err = tx.Exec(context.Background(),
		"UPDATE folder_file_info SET name = $1, path = $2, updated_at = $3 WHERE id = $4",
		newName, newPath, time.Now(), id)
	if err != nil {
		return fmt.Errorf("could not update item: %v", err)
	}

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
		oldPathPattern := "^" + regexp.QuoteMeta(path.Dir(oldPath)) + "/"
		newPathPattern := path.Dir(newPath) + "/"
		_, err = tx.Exec(context.Background(), cteQuery, id, oldPathPattern, newPathPattern)
		if err != nil {
			return fmt.Errorf("could not update nested paths: %v", err)
		}

		err = s.renameS3Folder(path.Dir(oldPath), path.Dir(newPath))
		if err != nil {
			return fmt.Errorf("could not rename folder in S3: %v", err)
		}
	} else {
		err = s.renameFileInS3(oldPath, newPath)
		if err != nil {
			return fmt.Errorf("could not rename file in S3: %v", err)
		}
	}

	if err := tx.Commit(context.Background()); err != nil {
		return fmt.Errorf("could not commit transaction: %v", err)
	}

	return nil
}

func (s *MedicalRecordsService) GetBreadcrumbs(folderID string) ([]models.FileFolder, error) {
	return s.getParentFolders(folderID)
}

func (s *MedicalRecordsService) GetFolders(userID, parentID string, isSharedWithMe bool) ([]models.FileFolder, error) {
	conn, err := s.db.Acquire(context.Background())
	if err != nil {
		return nil, fmt.Errorf("could not acquire database connection: %v", err)
	}
	defer conn.Release()

	var baseQuery string
	var args []interface{}

	if isSharedWithMe {
		baseQuery = `
		SELECT 
			id, name, created_at, updated_at, type, extension, path 
		FROM 
			folder_file_info 
		WHERE 
			user_id = $1 
		AND 
			shared_by_id IS NOT NULL
		`
		args = []interface{}{userID}
	} else {
		baseQuery = `
		SELECT 
			id, name, created_at, updated_at, type, extension, path 
		FROM 
			folder_file_info 
		WHERE 
			user_id = $1 
		`
		args = []interface{}{userID}
	}

	if parentID != "" {
		baseQuery += " AND parent_id = $2"
		args = append(args, parentID)
	} else {
		baseQuery += " AND parent_id IS NULL"
	}

	rows, err := conn.Query(context.Background(), baseQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("error executing query: %v", err)
	}
	defer rows.Close()

	var folders []models.FileFolder
	for rows.Next() {
		var folder models.FileFolder
		var path *string
		err := rows.Scan(&folder.ID, &folder.Name, &folder.CreatedAt, &folder.UpdatedAt, &folder.Type, &folder.Ext, &path)
		if err != nil {
			return nil, fmt.Errorf("error scanning row: %v", err)
		}
		if path != nil {
			folder.Path = *path
		} else {
			folder.Path = ""
		}
		folders = append(folders, folder)
	}

	return folders, nil
}

func (s *MedicalRecordsService) GetSubFolders(parentID string) ([]models.FileFolder, error) {
	conn, err := s.db.Acquire(context.Background())
	if err != nil {
		return nil, fmt.Errorf("could not acquire database connection: %v", err)
	}
	defer conn.Release()

	query := "SELECT id, name, created_at, updated_at FROM folder_file_info WHERE parent_id = $1"
	rows, err := conn.Query(context.Background(), query, parentID)
	if err != nil {
		return nil, fmt.Errorf("error executing query: %v", err)
	}
	defer rows.Close()

	var subfolders []models.FileFolder
	for rows.Next() {
		var folder models.FileFolder
		err := rows.Scan(&folder.ID, &folder.Name, &folder.CreatedAt, &folder.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("error scanning row: %v", err)
		}
		subfolders = append(subfolders, folder)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error scanning rows: %v", err)
	}

	return subfolders, nil
}

func (s *MedicalRecordsService) getParentFolderPath(folderID string) (string, error) {
	var parentFolder models.FileFolder
	row := s.db.QueryRow(context.Background(), "SELECT name, parent_id FROM folder_file_info WHERE id = $1", folderID)
	err := row.Scan(&parentFolder.Name, &parentFolder.ParentID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return "", nil
		}
		return "", err
	}
	if parentFolder.ParentID == nil {
		return parentFolder.Name, nil
	}
	parentPath, err := s.getParentFolderPath(*parentFolder.ParentID)
	if err != nil {
		return "", err
	}
	return filepath.Join(parentPath, parentFolder.Name), nil
}

func (s *MedicalRecordsService) getParentFolders(folderID string) ([]models.FileFolder, error) {
	var breadcrumbs []models.FileFolder
	for folderID != "" {
		var folder models.FileFolder
		row := s.db.QueryRow(context.Background(), "SELECT id, name, parent_id FROM folder_file_info WHERE id = $1", folderID)
		err := row.Scan(&folder.ID, &folder.Name, &folder.ParentID)
		if err != nil {
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

func (s *MedicalRecordsService) uploadMarkerFile(folderPath string) error {
	emptyFile := bytes.NewReader([]byte{})
	return utils.UploadToS3WithReader(folderPath, emptyFile, 0, "text/plain")
}

func (s *MedicalRecordsService) uploadFileToS3(filePath string, file io.Reader, fileSize int64, contentType string) error {
	return utils.UploadToS3WithReader(filePath, file, fileSize, contentType)
}

func (s *MedicalRecordsService) downloadFileFromS3(filePath string) (io.ReadCloser, error) {
	return utils.DownloadFromS3(filePath)
}

func (s *MedicalRecordsService) deleteFileFromS3(filePath string) error {
	return utils.DeleteFromS3(filePath)
}

func (s *MedicalRecordsService) renameFileInS3(oldPath, newPath string) error {
	if err := utils.CopyS3Object(oldPath, newPath); err != nil {
		return err
	}
	return utils.DeleteFromS3(oldPath)
}

func (s *MedicalRecordsService) renameS3Folder(oldPath, newPath string) error {
	bucket := os.Getenv("S3_BUCKET_NAME")
	prefix := oldPath + "/"

	cfg, err := utils.GetAWSConfig()
	if err != nil {
		return fmt.Errorf("error getting AWS config: %w", err)
	}

	client := s3.NewFromConfig(cfg)

	resp, err := client.ListObjectsV2(context.TODO(), &s3.ListObjectsV2Input{
		Bucket: aws.String(bucket),
		Prefix: aws.String(prefix),
	})
	if err != nil {
		return fmt.Errorf("error listing S3 objects: %w", err)
	}

	for _, item := range resp.Contents {
		oldKey := *item.Key
		newKey := strings.Replace(oldKey, oldPath, newPath, 1)

		if err := utils.CopyS3Object(oldKey, newKey); err != nil {
			return fmt.Errorf("error copying S3 object: %w", err)
		}

		if err := utils.DeleteFromS3(oldKey); err != nil {
			return fmt.Errorf("error deleting old S3 object: %w", err)
		}
	}

	return nil
}

func (s *MedicalRecordsService) createZipFromFolder(folderPath string) (string, error) {
	zipFileName := fmt.Sprintf("%s.zip", uuid.New().String())
	zipFilePath := filepath.Join(os.TempDir(), zipFileName)

	newZipFile, err := os.Create(zipFilePath)
	if err != nil {
		return "", err
	}
	defer newZipFile.Close()

	zipWriter := zip.NewWriter(newZipFile)
	defer zipWriter.Close()

	err = s.addFilesToZip(zipWriter, folderPath, "")
	if err != nil {
		return "", err
	}

	return zipFilePath, nil
}

func (s *MedicalRecordsService) addFilesToZip(zipWriter *zip.Writer, basePath, baseInZip string) error {
	bucket := os.Getenv("S3_BUCKET_NAME")
	prefix := strings.TrimSuffix(basePath, "/marker.txt")

	cfg, err := utils.GetAWSConfig()
	if err != nil {
		return fmt.Errorf("error getting AWS config: %w", err)
	}

	client := s3.NewFromConfig(cfg)

	resp, err := client.ListObjectsV2(context.TODO(), &s3.ListObjectsV2Input{
		Bucket: aws.String(bucket),
		Prefix: aws.String(prefix),
	})
	if err != nil {
		return fmt.Errorf("error listing S3 objects: %v", err)
	}

	for _, item := range resp.Contents {
		key := *item.Key
		if key == prefix+"/marker.txt" {
			continue
		}

		relativePath := strings.TrimPrefix(key, prefix+"/")
		if strings.HasSuffix(key, "/") {
			newBaseInZip := filepath.Join(baseInZip, relativePath)
			err = s.addFilesToZip(zipWriter, key, newBaseInZip)
			if err != nil {
				return err
			}
		} else {
			fileReader, err := utils.DownloadFromS3(key)
			if err != nil {
				return fmt.Errorf("error getting S3 object: %v", err)
			}
			defer fileReader.Close()

			f, err := zipWriter.Create(filepath.Join(baseInZip, relativePath))
			if err != nil {
				return fmt.Errorf("error creating zip entry: %v", err)
			}

			_, err = io.Copy(f, fileReader)
			if err != nil {
				return fmt.Errorf("error writing to zip entry: %v", err)
			}
		}
	}

	return nil
}
