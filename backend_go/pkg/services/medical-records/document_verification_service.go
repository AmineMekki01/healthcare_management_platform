package medicalrecords

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v4/pgxpool"
)

type DocumentVerificationService struct {
	db  *pgxpool.Pool
	cfg *config.Config
}

func NewDocumentVerificationService(db *pgxpool.Pool, cfg *config.Config) *DocumentVerificationService {
	return &DocumentVerificationService{
		db:  db,
		cfg: cfg,
	}
}

func (s *DocumentVerificationService) GetDocumentVerificationQueue(receptionistID string, status string, page, limit int) (map[string]interface{}, error) {
	id, err := uuid.Parse(receptionistID)
	if err != nil {
		return nil, fmt.Errorf("invalid receptionist ID: %v", err)
	}

	var assignedDoctorID uuid.UUID
	err = s.db.QueryRow(context.Background(), "SELECT assigned_doctor_id FROM receptionists WHERE receptionist_id = $1", id).Scan(&assignedDoctorID)
	if err != nil {
		return nil, fmt.Errorf("error retrieving assigned doctor: %v", err)
	}

	offset := (page - 1) * limit

	query := `SELECT dv.id, dv.patient_id, dv.document_type, dv.document_url, dv.status, 
		dv.notes, dv.verified_at, dv.created_at, dv.updated_at,
		p.first_name, p.last_name, p.email, p.phone_number
		FROM document_verifications dv
		JOIN patients p ON dv.patient_id = p.patient_id
		WHERE p.doctor_id = $1 AND dv.status = $2
		ORDER BY dv.created_at DESC
		LIMIT $3 OFFSET $4`

	rows, err := s.db.Query(context.Background(), query, assignedDoctorID, status, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("error retrieving documents: %v", err)
	}
	defer rows.Close()

	var documents []models.DocumentVerification
	for rows.Next() {
		var doc models.DocumentVerification
		var patientFirstName, patientLastName, patientEmail, patientPhone string

		err := rows.Scan(&doc.ID, &doc.PatientID, &doc.DocumentType, &doc.DocumentURL,
			&doc.Status, &doc.Notes, &doc.VerifiedAt, &doc.CreatedAt, &doc.UpdatedAt,
			&patientFirstName, &patientLastName, &patientEmail, &patientPhone)
		if err != nil {
			continue
		}

		doc.PatientName = patientFirstName + " " + patientLastName
		doc.ReceptionistID = id
		documents = append(documents, doc)
	}

	var totalCount int
	countQuery := `SELECT COUNT(*) FROM document_verifications dv
		JOIN patients p ON dv.patient_id = p.patient_id
		WHERE p.doctor_id = $1 AND dv.status = $2`

	err = s.db.QueryRow(context.Background(), countQuery, assignedDoctorID, status).Scan(&totalCount)
	if err != nil {
		totalCount = 0
	}

	response := map[string]interface{}{
		"documents":    documents,
		"total_count":  totalCount,
		"current_page": page,
		"total_pages":  (totalCount + limit - 1) / limit,
	}

	return response, nil
}

func (s *DocumentVerificationService) VerifyDocument(documentID int, req models.DocumentVerificationRequest, receptionistID string) error {
	receptionistUUID, err := uuid.Parse(receptionistID)
	if err != nil {
		return fmt.Errorf("invalid receptionist ID: %v", err)
	}

	tx, err := s.db.Begin(context.Background())
	if err != nil {
		return fmt.Errorf("database transaction error: %v", err)
	}
	defer tx.Rollback(context.Background())

	var verifiedAt *time.Time
	now := time.Now()
	if req.Status == "approved" || req.Status == "rejected" {
		verifiedAt = &now
	}

	_, err = tx.Exec(context.Background(),
		"UPDATE document_verifications SET status = $1, notes = $2, receptionist_id = $3, verified_at = $4, updated_at = $5 WHERE id = $6",
		req.Status, req.Notes, receptionistUUID, verifiedAt, now, documentID)
	if err != nil {
		return fmt.Errorf("error updating document: %v", err)
	}

	activityDesc := fmt.Sprintf("Document verification %s for document ID %d", req.Status, documentID)
	_, err = tx.Exec(context.Background(),
		"INSERT INTO receptionist_activities (receptionist_id, activity_type, description, related_id, created_at) VALUES ($1, $2, $3, $4, $5)",
		receptionistUUID, "document_verified", activityDesc, strconv.Itoa(documentID), now)
	if err != nil {
		return fmt.Errorf("error recording activity: %v", err)
	}

	if err = tx.Commit(context.Background()); err != nil {
		return fmt.Errorf("error completing verification: %v", err)
	}

	return nil
}

func (s *DocumentVerificationService) GetDocumentVerificationHistory(receptionistID string, filters map[string]string, page, limit int) (map[string]interface{}, error) {
	id, err := uuid.Parse(receptionistID)
	if err != nil {
		return nil, fmt.Errorf("invalid receptionist ID: %v", err)
	}

	var assignedDoctorID uuid.UUID
	err = s.db.QueryRow(context.Background(), "SELECT assigned_doctor_id FROM receptionists WHERE receptionist_id = $1", id).Scan(&assignedDoctorID)
	if err != nil {
		return nil, fmt.Errorf("error retrieving assigned doctor: %v", err)
	}

	offset := (page - 1) * limit

	baseQuery := `SELECT dv.id, dv.patient_id, dv.document_type, dv.document_url, dv.status, 
		dv.notes, dv.verified_at, dv.created_at, dv.updated_at,
		p.first_name, p.last_name, p.email, p.phone_number
		FROM document_verifications dv
		JOIN patients p ON dv.patient_id = p.patient_id
		WHERE p.doctor_id = $1`

	var conditions []string
	var args []interface{}
	argCount := 1
	args = append(args, assignedDoctorID)

	if status := filters["status"]; status != "" {
		argCount++
		conditions = append(conditions, fmt.Sprintf("dv.status = $%d", argCount))
		args = append(args, status)
	}

	if dateFrom := filters["date_from"]; dateFrom != "" {
		argCount++
		conditions = append(conditions, fmt.Sprintf("DATE(dv.created_at) >= $%d", argCount))
		args = append(args, dateFrom)
	}

	if dateTo := filters["date_to"]; dateTo != "" {
		argCount++
		conditions = append(conditions, fmt.Sprintf("DATE(dv.created_at) <= $%d", argCount))
		args = append(args, dateTo)
	}

	if len(conditions) > 0 {
		baseQuery += " AND " + strings.Join(conditions, " AND ")
	}

	query := baseQuery + " ORDER BY dv.updated_at DESC LIMIT $" + strconv.Itoa(argCount+1) + " OFFSET $" + strconv.Itoa(argCount+2)
	args = append(args, limit, offset)

	rows, err := s.db.Query(context.Background(), query, args...)
	if err != nil {
		return nil, fmt.Errorf("error retrieving history: %v", err)
	}
	defer rows.Close()

	var documents []models.DocumentVerification
	for rows.Next() {
		var doc models.DocumentVerification
		var patientFirstName, patientLastName, patientEmail, patientPhone string

		err := rows.Scan(&doc.ID, &doc.PatientID, &doc.DocumentType, &doc.DocumentURL,
			&doc.Status, &doc.Notes, &doc.VerifiedAt, &doc.CreatedAt, &doc.UpdatedAt,
			&patientFirstName, &patientLastName, &patientEmail, &patientPhone)
		if err != nil {
			continue
		}

		doc.PatientName = patientFirstName + " " + patientLastName
		doc.ReceptionistID = id
		documents = append(documents, doc)
	}

	countQuery := strings.Replace(baseQuery,
		"SELECT dv.id, dv.patient_id, dv.document_type, dv.document_url, dv.status, dv.notes, dv.verified_at, dv.created_at, dv.updated_at, p.first_name, p.last_name, p.email, p.phone_number",
		"SELECT COUNT(*)", 1)

	var totalCount int
	countArgs := args[:len(args)-2]
	err = s.db.QueryRow(context.Background(), countQuery, countArgs...).Scan(&totalCount)
	if err != nil {
		totalCount = 0
	}

	response := map[string]interface{}{
		"documents":    documents,
		"total_count":  totalCount,
		"current_page": page,
		"total_pages":  (totalCount + limit - 1) / limit,
	}

	return response, nil
}

func (s *DocumentVerificationService) GetPendingDocumentsCount(receptionistID string) (int, error) {
	id, err := uuid.Parse(receptionistID)
	if err != nil {
		return 0, fmt.Errorf("invalid receptionist ID: %v", err)
	}

	var assignedDoctorID uuid.UUID
	err = s.db.QueryRow(context.Background(), "SELECT assigned_doctor_id FROM receptionists WHERE receptionist_id = $1", id).Scan(&assignedDoctorID)
	if err != nil {
		return 0, fmt.Errorf("error retrieving assigned doctor: %v", err)
	}

	var count int
	query := `SELECT COUNT(*) FROM document_verifications dv
		JOIN patients p ON dv.patient_id = p.patient_id
		WHERE p.doctor_id = $1 AND dv.status = 'pending'`

	err = s.db.QueryRow(context.Background(), query, assignedDoctorID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("error retrieving count: %v", err)
	}

	return count, nil
}
