package medicalrecords

import (
	"archive/zip"
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
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
	fileFolder.FolderType = models.FolderTypePersonal
	fileFolder.Category = nil
	fileFolder.OwnerUserID = &fileFolder.UserID
	fileFolder.PatientID = &fileFolder.UserID
	fileFolder.UploadedByUserID = &fileFolder.UserID
	patientRole := "patient"
	fileFolder.UploadedByRole = &patientRole
	fileFolder.IncludedInRAG = false

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
	folderPath = filepath.ToSlash(folderPath)

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
		"INSERT INTO folder_file_info (id, name, created_at, updated_at, type, user_id, user_type, parent_id, size, extension, path, folder_type, category, owner_user_id, patient_id, uploaded_by_user_id, uploaded_by_role, included_in_rag) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)",
		fileFolder.ID, fileFolder.Name, fileFolder.CreatedAt, fileFolder.UpdatedAt, fileFolder.Type, fileFolder.UserID, fileFolder.UserType, fileFolder.ParentID, fileFolder.Size, fileFolder.Ext, folderPath, fileFolder.FolderType, fileFolder.Category, fileFolder.OwnerUserID, fileFolder.PatientID, fileFolder.UploadedByUserID, fileFolder.UploadedByRole, fileFolder.IncludedInRAG)
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

	if fileInfo.FolderType == "" {
		fileInfo.FolderType = models.FolderTypePersonal
	}

	if fileInfo.OwnerUserID == nil {
		fileInfo.OwnerUserID = &fileInfo.UserID
	}
	if fileInfo.FolderType == models.FolderTypeClinical && fileInfo.PatientID == nil {
		fileInfo.PatientID = &fileInfo.UserID
	}

	fileInfo.IncludedInRAG = (fileInfo.FolderType == models.FolderTypeClinical)

	_, err := s.db.Exec(context.Background(),
		"INSERT INTO folder_file_info (id, name, created_at, updated_at, type, size, extension, user_id, user_type, parent_id, path, folder_type, category, owner_user_id, patient_id, uploaded_by_user_id, uploaded_by_role, included_in_rag) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)",
		fileInfo.ID, fileInfo.Name, fileInfo.CreatedAt, fileInfo.UpdatedAt, fileInfo.Type, fileInfo.Size, fileInfo.Ext, fileInfo.UserID, fileInfo.UserType, fileInfo.ParentID, fileInfo.Path, fileInfo.FolderType, fileInfo.Category, fileInfo.OwnerUserID, fileInfo.PatientID, fileInfo.UploadedByUserID, fileInfo.UploadedByRole, fileInfo.IncludedInRAG)
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
	var ext *string
	err = conn.QueryRow(context.Background(),
		"SELECT id, name, path, type, extension FROM folder_file_info WHERE id = $1", fileID).Scan(&file.ID, &file.Name, &file.Path, &file.Type, &ext)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil, fmt.Errorf("file not found with ID: %s", fileID)
		}
		return nil, nil, fmt.Errorf("could not retrieve file information: %v", err)
	}

	file.Ext = ext

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

func (s *MedicalRecordsService) DownloadMultipleFiles(fileIDs []string) (io.ReadCloser, error) {
	conn, err := s.db.Acquire(context.Background())
	if err != nil {
		return nil, fmt.Errorf("could not acquire database connection: %v", err)
	}
	defer conn.Release()

	var files []models.FileFolder
	for _, fileID := range fileIDs {
		var file models.FileFolder
		var ext *string

		err = conn.QueryRow(context.Background(),
			"SELECT id, name, path, type, extension FROM folder_file_info WHERE id = $1", fileID).Scan(&file.ID, &file.Name, &file.Path, &file.Type, &ext)
		if err != nil {
			if err == pgx.ErrNoRows {
				log.Printf("File not found with ID: %s, skipping", fileID)
				continue
			}
			return nil, fmt.Errorf("could not retrieve file information for ID %s: %v", fileID, err)
		}
		file.Ext = ext
		files = append(files, file)
	}

	if len(files) == 0 {
		return nil, fmt.Errorf("no valid files found")
	}

	zipFilePath, err := s.createZipFromMultipleFiles(files)
	if err != nil {
		return nil, fmt.Errorf("could not create zip file: %v", err)
	}

	zipFile, err := os.Open(zipFilePath)
	if err != nil {
		return nil, fmt.Errorf("could not open zip file: %v", err)
	}

	return zipFile, nil
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
		if parentID != "" {
			baseQuery = `
			SELECT 
				id, name, created_at, updated_at, type, extension, path,
				folder_type, category, owner_user_id, patient_id, 
				uploaded_by_user_id, uploaded_by_role, included_in_rag
			FROM 
				folder_file_info 
			WHERE 
				parent_id = $1
			AND
				folder_type = 'PERSONAL'
			`
			args = []interface{}{parentID}
		} else {
			baseQuery = `
			SELECT 
				id, name, created_at, updated_at, type, extension, path,
				folder_type, category, owner_user_id, patient_id, 
				uploaded_by_user_id, uploaded_by_role, included_in_rag
			FROM 
				folder_file_info 
			WHERE 
				user_id = $1 
			AND 
				shared_by_id IS NOT NULL 
			AND
				parent_id IS NULL
			AND
				folder_type = 'PERSONAL'
			`
			args = []interface{}{userID}
		}
	} else {
		baseQuery = `
		SELECT 
			id, name, created_at, updated_at, type, extension, path,
			folder_type, category, owner_user_id, patient_id, 
			uploaded_by_user_id, uploaded_by_role, included_in_rag
		FROM 
			folder_file_info 
		WHERE 
			user_id = $1  
		AND
			folder_type = 'PERSONAL'
		AND
			shared_by_id IS NULL
		`
		args = []interface{}{userID}

		if parentID != "" {
			baseQuery += " AND parent_id = $2"
			args = append(args, parentID)
		} else {
			baseQuery += " AND parent_id IS NULL"
		}
	}

	rows, err := conn.Query(context.Background(), baseQuery, args...)
	if err != nil {
		log.Printf("Query execution error: %v", err)
		return nil, fmt.Errorf("error executing query: %v", err)
	}
	defer rows.Close()

	var folders []models.FileFolder
	rowCount := 0
	for rows.Next() {
		rowCount++
		var folder models.FileFolder
		var path *string
		var folderTypeStr *string
		var categoryStr *string

		err := rows.Scan(
			&folder.ID, &folder.Name, &folder.CreatedAt, &folder.UpdatedAt,
			&folder.Type, &folder.Ext, &path, &folderTypeStr, &categoryStr,
			&folder.OwnerUserID, &folder.PatientID, &folder.UploadedByUserID,
			&folder.UploadedByRole, &folder.IncludedInRAG)
		if err != nil {
			return nil, fmt.Errorf("error scanning row: %v", err)
		}

		if path != nil {
			folder.Path = *path
		} else {
			folder.Path = ""
		}

		if folderTypeStr != nil {
			folder.FolderType = models.FolderType(*folderTypeStr)
		} else {
			folder.FolderType = models.FolderTypePersonal
		}

		if categoryStr != nil {
			category := models.Category(*categoryStr)
			folder.Category = &category
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

func (s *MedicalRecordsService) GetAllUsers() ([]models.User, error) {
	conn, err := s.db.Acquire(context.Background())
	if err != nil {
		return nil, fmt.Errorf("could not acquire database connection: %v", err)
	}
	defer conn.Release()

	var users []models.User

	doctorQuery := `
		SELECT 
			doctor_id as id,
			first_name,
			last_name,
			email,
			'doctor' as role
		FROM doctor_info
	`
	docRows, err := conn.Query(context.Background(), doctorQuery)
	if err != nil {
		return nil, fmt.Errorf("error fetching doctors: %v", err)
	}
	defer docRows.Close()

	for docRows.Next() {
		var user models.User
		var firstName, lastName string
		err := docRows.Scan(&user.ID, &firstName, &lastName, &user.Email, &user.Role)
		if err != nil {
			return nil, fmt.Errorf("error scanning doctor row: %v", err)
		}
		user.Name = fmt.Sprintf("%s %s", firstName, lastName)
		users = append(users, user)
	}

	if err = docRows.Err(); err != nil {
		return nil, fmt.Errorf("error processing doctor rows: %v", err)
	}

	patientQuery := `
		SELECT 
			patient_id as id,
			first_name,
			last_name,
			email,
			'patient' as role
		FROM patient_info
	`

	patientRows, err := conn.Query(context.Background(), patientQuery)
	if err != nil {
		return nil, fmt.Errorf("error fetching patients: %v", err)
	}
	defer patientRows.Close()

	for patientRows.Next() {
		var user models.User
		var firstName, lastName string
		err := patientRows.Scan(&user.ID, &firstName, &lastName, &user.Email, &user.Role)
		if err != nil {
			return nil, fmt.Errorf("error scanning patient row: %v", err)
		}
		user.Name = fmt.Sprintf("%s %s", firstName, lastName)
		users = append(users, user)
	}

	if err = patientRows.Err(); err != nil {
		return nil, fmt.Errorf("error processing patient rows: %v", err)
	}

	receptionistQuery := `
		SELECT 
			receptionist_id as id,
			first_name,
			last_name,
			email,
			'receptionist' as role
		FROM receptionists
	`

	receptionistRows, err := conn.Query(context.Background(), receptionistQuery)

	defer receptionistRows.Close()

	for receptionistRows.Next() {
		var user models.User
		var firstName, lastName string
		err := receptionistRows.Scan(&user.ID, &firstName, &lastName, &user.Email, &user.Role)
		if err != nil {
			log.Printf("Error scanning receptionist row: %v", err)
			continue
		}
		user.Name = fmt.Sprintf("%s %s", firstName, lastName)
		users = append(users, user)
	}

	if err = receptionistRows.Err(); err != nil {
		log.Printf("Error processing receptionist rows: %v", err)
	}

	return users, nil
}

func (s *MedicalRecordsService) GetMedicalRecordsByCategory(userID, userType, category, patientID string) ([]models.FileFolder, error) {
	conn, err := s.db.Acquire(context.Background())
	if err != nil {
		return nil, fmt.Errorf("could not acquire database connection: %v", err)
	}
	defer conn.Release()

	var baseQuery string
	var args []interface{}

	baseQuery = `
	SELECT 
		id, name, created_at, updated_at, type, size, extension, path,
		folder_type, category, owner_user_id, patient_id, 
		uploaded_by_user_id, uploaded_by_role, included_in_rag
	FROM 
		folder_file_info 
	WHERE 
		(patient_id = $1 AND folder_type = 'CLINICAL')
	`
	args = []interface{}{userID}

	if category != "" {
		baseQuery += " AND category = $" + fmt.Sprintf("%d", len(args)+1)
		args = append(args, category)
	}

	baseQuery += " ORDER BY created_at DESC"

	rows, err := conn.Query(context.Background(), baseQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("error executing query: %v", err)
	}
	defer rows.Close()

	var records []models.FileFolder
	for rows.Next() {
		var record models.FileFolder
		var path *string
		var folderTypeStr *string
		var categoryStr *string

		err := rows.Scan(
			&record.ID, &record.Name, &record.CreatedAt, &record.UpdatedAt,
			&record.Type, &record.Size, &record.Ext, &path, &folderTypeStr, &categoryStr, &record.OwnerUserID, &record.PatientID, &record.UploadedByUserID, &record.UploadedByRole, &record.IncludedInRAG)
		if err != nil {
			return nil, fmt.Errorf("error scanning row: %v", err)
		}

		if path != nil {
			record.Path = *path
		}

		if folderTypeStr != nil {
			record.FolderType = models.FolderType(*folderTypeStr)
		}

		if categoryStr != nil {
			category := models.Category(*categoryStr)
			record.Category = &category
		}

		records = append(records, record)
	}

	return records, nil
}

func (s *MedicalRecordsService) ShareDocumentToPatient(fileInfo *models.FileFolder, file io.Reader, folderName string, fileSize int64, contentType string) error {
	id, _ := uuid.NewRandom()
	fileInfo.ID = id.String()
	fileInfo.CreatedAt = time.Now()
	fileInfo.UpdatedAt = time.Now()
	fileInfo.Size = fileSize

	fileInfo.Path = fmt.Sprintf("records/medical-records/%s/%s/%s", fileInfo.UserID, folderName, fileInfo.Name)
	fileInfo.Path = filepath.ToSlash(fileInfo.Path)

	if err := s.uploadFileToS3(fileInfo.Path, file, fileSize, contentType); err != nil {
		return fmt.Errorf("failed to upload file to S3: %v", err)
	}

	if fileInfo.FolderType == "" {
		fileInfo.FolderType = models.FolderTypePersonal
	}

	if fileInfo.OwnerUserID == nil {
		fileInfo.OwnerUserID = &fileInfo.UserID
	}
	if fileInfo.FolderType == models.FolderTypeClinical && fileInfo.PatientID == nil {
		fileInfo.PatientID = &fileInfo.UserID
	}

	fileInfo.IncludedInRAG = (fileInfo.FolderType == models.FolderTypeClinical)

	_, err := s.db.Exec(context.Background(),
		"INSERT INTO folder_file_info (id, name, created_at, updated_at, type, size, extension, user_id, user_type, parent_id, path, folder_type, category, owner_user_id, patient_id, uploaded_by_user_id, uploaded_by_role, included_in_rag) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)",
		fileInfo.ID, fileInfo.Name, fileInfo.CreatedAt, fileInfo.UpdatedAt, fileInfo.Type, fileInfo.Size, fileInfo.Ext, fileInfo.UserID, fileInfo.UserType, fileInfo.ParentID, fileInfo.Path, fileInfo.FolderType, fileInfo.Category, fileInfo.OwnerUserID, fileInfo.PatientID, fileInfo.UploadedByUserID, fileInfo.UploadedByRole, fileInfo.IncludedInRAG)
	if err != nil {
		return fmt.Errorf("failed to insert file info: %v", err)
	}

	_, err = s.db.Exec(context.Background(),
		`INSERT INTO shared_items (shared_by_id, shared_with_id, shared_at, item_id) 
		 VALUES ($1, $2, $3, $4)`,
		fileInfo.UploadedByUserID, fileInfo.PatientID, time.Now(), fileInfo.ID)
	if err != nil {
		return fmt.Errorf("could not insert shared item: %v", err)
	}
	return nil
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

func (s *MedicalRecordsService) createZipFromMultipleFiles(files []models.FileFolder) (string, error) {
	zipFileName := fmt.Sprintf("multiple_files_%s.zip", uuid.New().String())
	zipFilePath := filepath.Join(os.TempDir(), zipFileName)

	newZipFile, err := os.Create(zipFilePath)
	if err != nil {
		return "", err
	}
	defer newZipFile.Close()

	zipWriter := zip.NewWriter(newZipFile)
	defer zipWriter.Close()

	for _, file := range files {

		if file.Type == "folder" {
			err = s.addFilesToZip(zipWriter, file.Path, file.Name)
			if err != nil {
				log.Printf("Error adding folder %s to zip: %v", file.Name, err)
				continue
			}
		} else {
			fileReader, err := s.downloadFileFromS3(file.Path)
			if err != nil {
				log.Printf("Error downloading file %s from S3: %v", file.Name, err)
				continue
			}

			f, err := zipWriter.Create(file.Name)
			if err != nil {
				fileReader.Close()
				log.Printf("Error creating zip entry for %s: %v", file.Name, err)
				continue
			}

			_, err = io.Copy(f, fileReader)
			fileReader.Close()

			if err != nil {
				log.Printf("Error writing file %s to zip: %v", file.Name, err)
				continue
			}
		}
	}

	return zipFilePath, nil
}

func (s *MedicalRecordsService) addFilesToZip(zipWriter *zip.Writer, basePath, baseInZip string) error {
	bucket := os.Getenv("S3_BUCKET_NAME")
	normalizedBasePath := filepath.ToSlash(basePath)
	prefix := strings.TrimSuffix(normalizedBasePath, "/marker.txt")

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

	filesAdded := 0
	for _, item := range resp.Contents {
		key := *item.Key

		if strings.HasSuffix(key, "/marker.txt") || strings.HasSuffix(key, "marker.txt") {
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

			f, err := zipWriter.Create(filepath.Join(baseInZip, relativePath))
			if err != nil {
				fileReader.Close()
				return fmt.Errorf("error creating zip entry: %v", err)
			}

			_, err = io.Copy(f, fileReader)
			fileReader.Close()

			if err != nil {
				return fmt.Errorf("error writing to zip entry: %v", err)
			}
			filesAdded++
		}
	}
	return nil
}
