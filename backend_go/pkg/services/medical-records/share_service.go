package medicalrecords

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"path/filepath"
	"time"

	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/models"
	"healthcare_backend/pkg/utils"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
)

type ShareService struct {
	db  *pgxpool.Pool
	cfg *config.Config
}

func NewShareService(db *pgxpool.Pool, cfg *config.Config) *ShareService {
	return &ShareService{
		db:  db,
		cfg: cfg,
	}
}

func (s *ShareService) ListDoctors() ([]models.Doctor, error) {
	rows, err := s.db.Query(context.Background(),
		"SELECT doctor_id, first_name, last_name, specialty FROM doctor_info")
	if err != nil {
		return nil, fmt.Errorf("could not retrieve doctors list: %v", err)
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

	return doctors, nil
}

func (s *ShareService) ShareItems(req models.ShareRequest) error {
	for _, itemID := range req.ItemIDs {
		var item models.FileFolder
		err := s.db.QueryRow(context.Background(), "SELECT id, name, type, path, size, extension, user_id, user_type, parent_id, shared_by_id, created_at, updated_at, folder_type, category, owner_user_id, patient_id, uploaded_by_user_id, uploaded_by_role, included_in_rag FROM folder_file_info WHERE id = $1", itemID).
			Scan(&item.ID, &item.Name, &item.Type, &item.Path, &item.Size, &item.Ext, &item.UserID, &item.UserType, &item.ParentID, &item.SharedByID, &item.CreatedAt, &item.UpdatedAt, &item.FolderType, &item.Category, &item.OwnerUserID, &item.PatientID, &item.UploadedByUserID, &item.UploadedByRole, &item.IncludedInRAG)
		if err != nil {
			log.Println("Error retrieving item", itemID, err)
			return fmt.Errorf("error retrieving item %s: %v", itemID, err)
		}

		err = s.copyFileOrFolder(item, req)
		if err != nil {
			log.Println("Error copying item", itemID, err)
			return fmt.Errorf("error copying item %s: %v", itemID, err)
		}

		sharedItem := models.SharedItem{
			ItemID:     itemID,
			SharedBy:   req.UserID,
			SharedWith: req.SharedWithID,
			SharedAt:   time.Now(),
		}
		log.Println("req", req)
		sql := `INSERT INTO shared_items (item_id, shared_by_id, shared_with_id, shared_at) VALUES ($1, $2, $3, $4)`
		_, err = s.db.Exec(context.Background(), sql, sharedItem.ItemID, sharedItem.SharedBy, sharedItem.SharedWith, sharedItem.SharedAt)
		if err != nil {
			log.Println("Error inserting shared item record", itemID, err)
			return fmt.Errorf("unable to insert shared item record: %v", err)
		}
	}

	return nil
}

func (s *ShareService) copyFileOrFolder(item models.FileFolder, req models.ShareRequest) error {
	var sharerName string
	var query string
	if req.UserType == "patient" {
		query = "SELECT CONCAT(first_name, ' ', last_name) as sharer_name FROM patient_info WHERE patient_id = $1"
	} else {
		query = "SELECT CONCAT(first_name, ' ', last_name) as sharer_name FROM doctor_info WHERE doctor_id = $1"
	}

	err := s.db.QueryRow(context.Background(), query, req.UserID).Scan(&sharerName)
	if err != nil {
		return fmt.Errorf("error fetching sharer's name: %v", err)
	}

	var sharerFolderID string
	err = s.db.QueryRow(context.Background(),
		"SELECT id FROM folder_file_info WHERE user_id = $1 AND name = $2 AND parent_id IS NULL AND shared_by_id = $3",
		req.SharedWithID, sharerName, req.UserID).Scan(&sharerFolderID)

	if err != nil {
		if err == pgx.ErrNoRows {
			sharerFolderID = uuid.New().String()
			sharerFolderPath := filepath.Join("records", "shared-with-me", req.SharedWithID, sharerName)
			sharerFolderPath = filepath.ToSlash(sharerFolderPath)

			_, err = s.db.Exec(context.Background(),
				"INSERT INTO folder_file_info (id, name, created_at, updated_at, type, size, path, user_id, user_type, shared_by_id) "+
					"VALUES ($1, $2, $3, $4, 'folder', $5, $6, $7, $8, $9)",
				sharerFolderID, sharerName, time.Now(), time.Now(), item.Size, sharerFolderPath, req.SharedWithID, item.UserType, req.UserID)
			if err != nil {
				return fmt.Errorf("error creating sharer's folder: %v", err)
			}

			markerKey := filepath.Join(sharerFolderPath, "marker.txt")
			emptyFile := bytes.NewReader([]byte{})
			err = utils.UploadToS3WithReader(markerKey, emptyFile, 0, "text/plain")
			if err != nil {
				return fmt.Errorf("error creating sharer's folder in S3: %v", err)
			}
		} else {
			return fmt.Errorf("error checking sharer's folder: %v", err)
		}
	}

	baseNewPath := fmt.Sprintf("records/shared-with-me/%s/%s", req.SharedWithID, sharerName)
	baseNewPath = filepath.ToSlash(baseNewPath)

	return s.copyItemRecursively(item, req.SharedWithID, req.UserID, baseNewPath, &sharerFolderID)
}

func (s *ShareService) copyItemRecursively(item models.FileFolder, recipientID string, sharedByID string, newParentPath string, newParentID *string) error {
	newItemID := uuid.New().String()
	newItemPath := filepath.Join(newParentPath, item.Name)
	newItemPath = filepath.ToSlash(newItemPath)

	if item.Type == "folder" {
		_, err := s.db.Exec(context.Background(),
			"INSERT INTO folder_file_info (id, name, created_at, updated_at, type, size, extension, path, user_id, user_type, parent_id, shared_by_id) "+
				"VALUES ($1, $2, $3, $4, 'folder', $5, $6, $7, $8, $9, $10, $11)",
			newItemID, item.Name, time.Now(), time.Now(), item.Size, item.Ext, newItemPath, recipientID, item.UserType, newParentID, sharedByID)
		if err != nil {
			return fmt.Errorf("error inserting folder info into database: %v", err)
		}

		rows, err := s.db.Query(context.Background(),
			"SELECT id, name, type, size, extension, path FROM folder_file_info WHERE parent_id = $1", item.ID)
		if err != nil {
			return fmt.Errorf("error querying folder contents: %v", err)
		}
		defer rows.Close()

		for rows.Next() {
			var childItem models.FileFolder
			err := rows.Scan(&childItem.ID, &childItem.Name, &childItem.Type, &childItem.Size, &childItem.Ext, &childItem.Path)
			if err != nil {
				return fmt.Errorf("error scanning child item: %v", err)
			}
			err = s.copyItemRecursively(childItem, recipientID, sharedByID, newItemPath, &newItemID)
			if err != nil {
				return err
			}
		}
	} else {
		normalizedItemPath := filepath.ToSlash(item.Path)

		err := utils.CopyS3Object(normalizedItemPath, newItemPath)
		if err != nil {
			return fmt.Errorf("error copying file in S3: %v", err)
		}

		_, err = s.db.Exec(context.Background(),
			"INSERT INTO folder_file_info (id, name, created_at, updated_at, type, size, extension, path, user_id, user_type, parent_id, shared_by_id) "+
				"VALUES ($1, $2, $3, $4, 'file', $5, $6, $7, $8, $9, $10, $11)",
			newItemID, item.Name, time.Now(), time.Now(), item.Size, item.Ext, newItemPath, recipientID, item.UserType, newParentID, sharedByID)
		if err != nil {
			return fmt.Errorf("error inserting file info into database: %v", err)
		}
	}
	return nil
}

func (s *ShareService) GetSharedWithMe(userID string) ([]models.FileFolder, error) {
	sql := `
	SELECT
		f_copy.id,
		f_copy.name,
		f_copy.created_at,
		f_copy.updated_at,
		f_copy.type,
		f_copy.size,
		f_copy.extension,
		f_copy.user_id,
		f_copy.user_type,
		f_copy.parent_id,
		f_copy.path,
		s.shared_by_id,
		CASE 
			WHEN s.shared_by_id IN (SELECT doctor_id::text FROM doctor_info) THEN 
				(SELECT CONCAT(first_name, ' ', last_name) FROM doctor_info WHERE doctor_id::text = s.shared_by_id)
			WHEN s.shared_by_id IN (SELECT patient_id::text FROM patient_info) THEN 
				(SELECT CONCAT(first_name, ' ', last_name) FROM patient_info WHERE patient_id::text = s.shared_by_id)
			WHEN s.shared_by_id IN (SELECT receptionist_id::text FROM receptionists) THEN 
				(SELECT CONCAT(first_name, ' ', last_name) FROM receptionists WHERE receptionist_id::text = s.shared_by_id)
			ELSE 'Unknown User'
		END as shared_by_name,
		CASE 
			WHEN s.shared_by_id IN (SELECT doctor_id::text FROM doctor_info) THEN 'doctor'
			WHEN s.shared_by_id IN (SELECT patient_id::text FROM patient_info) THEN 'patient'
			WHEN s.shared_by_id IN (SELECT receptionist_id::text FROM receptionists) THEN 'receptionist'
			ELSE 'unknown'
		END as shared_by_type
	FROM shared_items s
	JOIN folder_file_info f_original ON s.item_id = f_original.id
	JOIN folder_file_info f_sharer_folder ON f_sharer_folder.user_id::text = s.shared_with_id 
		AND f_sharer_folder.shared_by_id::text = s.shared_by_id
		AND f_sharer_folder.path LIKE 'records/shared-with-me/%'
		AND f_sharer_folder.parent_id IS NULL
		AND f_sharer_folder.type = 'folder'
	JOIN folder_file_info f_copy ON f_copy.parent_id = f_sharer_folder.id
		AND f_copy.shared_by_id::text = s.shared_by_id
		AND f_copy.size = f_original.size
	WHERE s.shared_with_id = $1
	AND f_original.folder_type = 'PERSONAL';`

	rows, err := s.db.Query(context.Background(), sql, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve shared items: %v", err)
	}
	defer rows.Close()

	var items []models.FileFolder
	for rows.Next() {
		var item models.FileFolder
		var sharedByID, sharedByName, sharedByType string
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
			&sharedByID,
			&sharedByName,
			&sharedByType,
		); err != nil {
			return nil, fmt.Errorf("unable to scan row: %v", err)
		}

		item.SharedByID = &sharedByID
		item.SharedByName = sharedByName
		item.SharedByType = sharedByType
		items = append(items, item)
	}

	return items, nil
}

func (s *ShareService) GetSharedByMe(userID string) ([]models.FileFolder, error) {
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
    f.path,
    s.shared_with_id,
    CASE 
        WHEN s.shared_with_id IN (SELECT doctor_id::text FROM doctor_info) THEN 
            (SELECT CONCAT(first_name, ' ', last_name) FROM doctor_info WHERE doctor_id::text = s.shared_with_id)
        WHEN s.shared_with_id IN (SELECT patient_id::text FROM patient_info) THEN 
            (SELECT CONCAT(first_name, ' ', last_name) FROM patient_info WHERE patient_id::text = s.shared_with_id)
        WHEN s.shared_with_id IN (SELECT receptionist_id::text FROM receptionists) THEN 
            (SELECT CONCAT(first_name, ' ', last_name) FROM receptionists WHERE receptionist_id::text = s.shared_with_id)
        ELSE 'Unknown User'
    END as shared_with_name,
    CASE 
        WHEN s.shared_with_id IN (SELECT doctor_id::text FROM doctor_info) THEN 'doctor'
        WHEN s.shared_with_id IN (SELECT patient_id::text FROM patient_info) THEN 'patient'
        WHEN s.shared_with_id IN (SELECT receptionist_id::text FROM receptionists) THEN 'receptionist'
        ELSE 'unknown'
    END as shared_with_type
	FROM shared_items s 
	JOIN folder_file_info f ON s.item_id = f.id 
	WHERE s.shared_by_id = $1`

	rows, err := s.db.Query(context.Background(), sql, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve shared items: %v", err)
	}
	defer rows.Close()

	var items []models.FileFolder
	for rows.Next() {
		var item models.FileFolder
		var sharedWithID, sharedWithName, sharedWithType string
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
			&sharedWithID,
			&sharedWithName,
			&sharedWithType,
		); err != nil {
			return nil, fmt.Errorf("unable to scan row: %v", err)
		}

		item.SharedWithID = sharedWithID
		item.SharedWithName = sharedWithName
		item.SharedWithType = sharedWithType
		items = append(items, item)
	}

	return items, nil
}
