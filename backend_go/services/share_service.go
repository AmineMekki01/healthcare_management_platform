// File: services/share.go

package services

import (
	"backend_go/models"
	"bytes"
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
)

// i already have a GetAllDoctors function in doctor_service.go but this one is going to be different in the futur. it will be used to get all the doctors that the patient has followed (or have gave him access to his files. don't know yet which one i will sue) I will include getting the doctors photo as well.
func ListDoctors(c *gin.Context, db *pgxpool.Pool) {
	rows, err := db.Query(context.Background(), "SELECT doctor_id, first_name , last_name, specialty FROM users WHERE user_type = 'doctor'")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve doctors list"})
		return
	}

	defer rows.Close()

	var doctors []models.Doctor
	for rows.Next() {
		var doctor models.Doctor
		if err := rows.Scan(&doctor.DoctorID, &doctor.FirstName, &doctor.LastName, &doctor.Specialty); err != nil {
			continue
		}
		doctors = append(doctors, doctor)
	}

	c.JSON(http.StatusOK, doctors)
}

func ShareItem(c *gin.Context, pool *pgxpool.Pool) {
	var req models.ShareRequest

	if err := c.BindJSON(&req); err != nil {
		log.Printf("Error binding JSON: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	for _, itemID := range req.ItemIDs {
		// Retrieve the item details
		var item models.FileFolder
		err := pool.QueryRow(context.Background(),
			"SELECT id, name, type, path, size, extension FROM folder_file_info WHERE id = $1", itemID).
			Scan(&item.ID, &item.Name, &item.Type, &item.Path, &item.Size, &item.Ext)
		if err != nil {
			log.Printf("Error retrieving item: %v\n", err)
			continue
		}

		// Copy the item
		err = CopyFileOrFolder(item, req, pool)
		if err != nil {
			log.Printf("Error copying item: %v\n", err)
			continue
		}

		sharedItem := models.SharedItem{
			ItemID:     itemID,
			SharedBy:   req.UserID,
			SharedWith: req.SharedWithID,
			SharedAt:   time.Now(),
		}
		sql := `INSERT INTO shared_items (item_id, shared_by_id, shared_with_id, shared_at) VALUES ($1, $2, $3, $4)`
		_, err = pool.Exec(context.Background(), sql, sharedItem.ItemID, sharedItem.SharedBy, sharedItem.SharedWith, sharedItem.SharedAt)
		if err != nil {
			log.Printf("Unable to insert the new shared item record into the database: %v\n", err)
			continue
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Items shared successfully"})
}

func CopyFileOrFolder(item models.FileFolder, req models.ShareRequest, db *pgxpool.Pool) error {

	// Fetch the sharer's name (e.g., User A's name)
	var sharerName string
	var query string
	if req.UserType == "patient" {
		query = "SELECT CONCAT(first_name, ' ', last_name) as sharer_name FROM patient_info WHERE patient_id = $1"
	} else {
		query = "SELECT CONCAT(first_name, ' ', last_name) as sharer_name FROM doctor_info WHERE doctor_id = $1"
	}

	err := db.QueryRow(context.Background(), query, req.UserID).Scan(&sharerName)
	if err != nil {
		log.Printf("Error fetching sharer's name : ", err)
		return fmt.Errorf("Error fetching sharer's name: %v", err)
	}

	var sharerFolderID string
	err = db.QueryRow(context.Background(),
		"SELECT id FROM folder_file_info WHERE user_id = $1 AND name = $2 AND parent_id IS NULL AND shared_by_id = $3",
		req.SharedWithID, sharerName, req.UserID).Scan(&sharerFolderID)

	if err != nil {
		if err == pgx.ErrNoRows {
			sharerFolderID = uuid.New().String()
			sharerFolderPath := filepath.Join("records", "shared-with-me", req.SharedWithID, sharerName)
			sharerFolderPath = filepath.ToSlash(sharerFolderPath)
			_, err = db.Exec(context.Background(),
				"INSERT INTO folder_file_info (id, name, created_at, updated_at, type, size, path, user_id, user_type, shared_by_id) "+
					"VALUES ($1, $2, $3, $4, 'folder', $5, $6, $7, $8, $9)",
				sharerFolderID, sharerName, time.Now(), time.Now(), item.Size, sharerFolderPath, req.SharedWithID, item.UserType, req.UserID)
			if err != nil {
				log.Printf("Error creating sharer's folder: %v", err)
				return fmt.Errorf("Error creating sharer's folder: %v", err)
			}

			s3Client := createS3Client()
			bucket := os.Getenv("S3_BUCKET_NAME")
			markerKey := filepath.Join(sharerFolderPath, "marker.txt")
			emptyFile := bytes.NewReader([]byte{})
			_, err = s3Client.PutObject(&s3.PutObjectInput{
				Bucket: aws.String(bucket),
				Key:    aws.String(markerKey),
				Body:   emptyFile,
			})
			if err != nil {
				log.Printf("Error creating sharer's folder in S3: %v", err)
				return fmt.Errorf("Error creating sharer's folder in S3: %v", err)
			}
		} else {
			log.Printf("Error checking sharer's folder: %v", err)
			return fmt.Errorf("Error checking sharer's folder: %v", err)
		}
	}

	baseNewPath := fmt.Sprintf("records/shared-with-me/%s/%s", req.SharedWithID, sharerName)
	baseNewPath = filepath.ToSlash(baseNewPath)

	// Start the recursive copy process
	return copyItemRecursively(item, req.SharedWithID, req.UserID, db, baseNewPath, &sharerFolderID)
}

func copyItemRecursively(item models.FileFolder, recipientID string, sharedByID string, db *pgxpool.Pool, newParentPath string, newParentID *string) error {
	s3Client := createS3Client()
	bucket := os.Getenv("S3_BUCKET_NAME")

	newItemID := uuid.New().String()

	newItemPath := filepath.Join(newParentPath, item.Name)
	newItemPath = filepath.ToSlash(newItemPath)

	if item.Type == "folder" {
		// Insert new folder entry into folder_file_info
		_, err := db.Exec(context.Background(),
			"INSERT INTO folder_file_info (id, name, created_at, updated_at, type, size, extension, path, user_id, user_type, parent_id, shared_by_id) "+
				"VALUES ($1, $2, $3, $4, 'folder', $5, $6, $7, $8, $9, $10, $11)",
			newItemID, item.Name, time.Now(), time.Now(), item.Size, item.Ext, newItemPath, recipientID, item.UserType, newParentID, sharedByID)
		if err != nil {
			log.Printf("Error inserting folder info into database:", err)
			return fmt.Errorf("Error inserting folder info into database: %v", err)
		}

		// Recursively copy all child items
		rows, err := db.Query(context.Background(),
			"SELECT id, name, type, size, extension, path FROM folder_file_info WHERE parent_id = $1", item.ID)
		if err != nil {
			log.Printf("Error querying folder contents: ", err)
			return fmt.Errorf("Error querying folder contents: %v", err)
		}
		defer rows.Close()

		for rows.Next() {
			var childItem models.FileFolder
			err := rows.Scan(&childItem.ID, &childItem.Name, &childItem.Type, &childItem.Size, &childItem.Ext, &childItem.Path)
			if err != nil {
				log.Printf("Error scanning child item: ", err)
				return fmt.Errorf("Error scanning child item: %v", err)
			}
			err = copyItemRecursively(childItem, recipientID, sharedByID, db, newItemPath, &newItemID)
			if err != nil {
				return err
			}
		}
	} else {
		// Copy the file in S3
		normalizedItemPath := filepath.ToSlash(item.Path)

		_, err := s3Client.CopyObject(&s3.CopyObjectInput{
			Bucket:     aws.String(bucket),
			CopySource: aws.String(bucket + "/" + normalizedItemPath),
			Key:        aws.String(newItemPath),
		})
		if err != nil {
			log.Printf("Error copying file in S3 : ", err)
			return fmt.Errorf("Error copying file in S3: %v", err)
		}

		// Insert new file entry into folder_file_info
		_, err = db.Exec(context.Background(),
			"INSERT INTO folder_file_info (id, name, created_at, updated_at, type, size, extension, path, user_id, user_type, parent_id, shared_by_id) "+
				"VALUES ($1, $2, $3, $4, 'file', $5, $6, $7, $8, $9, $10, $11)",
			newItemID, item.Name, time.Now(), time.Now(), item.Size, item.Ext, newItemPath, recipientID, item.UserType, newParentID, sharedByID)
		if err != nil {
			log.Printf("Error inserting file info into database : ", err)
			return fmt.Errorf("Error inserting file info into database: %v", err)
		}
	}
	return nil
}

// Retrieve items shared with the user
func GetSharedWithMe(c *gin.Context, db *pgxpool.Pool) {
	userID := c.Query("userId")
	var items []models.FileFolder
	// SQL query to retrieve the items shared with the user
	sql := `SELECT 
    f.id, 
    f.name, 
    f.created_at, 
    f.updated_at, 
    f.type, 
    f.size, 
    f.extension, 
    f.user_id, 
    f.user_type, 
    f.parent_id, 
    f.path 
	FROM shared_items s 
	JOIN folder_file_info f ON s.item_id = f.id 
	WHERE s.shared_with_id = $1`

	rows, err := db.Query(context.Background(), sql, userID)
	if err != nil {
		log.Printf("Unable to execute the select query: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve shared items"})
		return
	}

	defer rows.Close()

	for rows.Next() {
		var item models.FileFolder
		if err := rows.Scan(
			&item.ID,
			&item.Name,
			&item.CreatedAt,
			&item.UpdatedAt,
			&item.Type,
			&item.Size,
			&item.Ext,
			&item.UserID,
			&item.UserType,
			&item.ParentID,
			&item.Path,
		); err != nil {
			log.Printf("Unable to scan the row. %v\n", err)
			return
		}
		items = append(items, item)
	}

	if len(items) == 0 {
		// If no items, return an empty array instead of null
		c.JSON(http.StatusOK, []models.FileFolder{})
	} else {
		c.JSON(http.StatusOK, gin.H{"items": items})
	}
}

// Retrieve items shared by the user
func GetSharedByMe(c *gin.Context, db *pgxpool.Pool) {
	userID := c.Query("userId")
	var items []models.FileFolder
	// SQL query to retrieve the items shared with the user
	sql := `SELECT 
    f.id, 
    f.name, 
    f.created_at, 
    f.updated_at, 
    f.type, 
    f.size, 
    f.extension, 
    f.user_id, 
    f.user_type, 
    f.parent_id, 
    f.path 
	FROM shared_items s 
	JOIN folder_file_info f ON s.item_id = f.id 
	WHERE s.shared_by_id = $1`

	rows, err := db.Query(context.Background(), sql, userID)
	if err != nil {
		log.Printf("Unable to execute the select query: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve shared items"})
		return
	}

	defer rows.Close()

	for rows.Next() {
		var item models.FileFolder
		if err := rows.Scan(
			&item.ID,
			&item.Name,
			&item.CreatedAt,
			&item.UpdatedAt,
			&item.Type,
			&item.Size,
			&item.Ext,
			&item.UserID,
			&item.UserType,
			&item.ParentID,
			&item.Path,
		); err != nil {
			log.Printf("Unable to scan the row. %v\n", err)
			return
		}
		items = append(items, item)
	}
	if len(items) == 0 {
		// If no items, return an empty array instead of null
		c.JSON(http.StatusOK, []models.FileFolder{})
	} else {
		c.JSON(http.StatusOK, gin.H{"items": items})
	}
}
