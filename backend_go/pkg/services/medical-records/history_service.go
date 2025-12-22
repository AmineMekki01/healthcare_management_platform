package medicalrecords

import (
	"context"
	"fmt"
	"time"

	"healthcare_backend/pkg/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v4/pgxpool"
)

type HistoryService struct {
	db *pgxpool.Pool
}

func NewHistoryService(db *pgxpool.Pool) *HistoryService {
	return &HistoryService{
		db: db,
	}
}

func (s *HistoryService) AddHistoryEntry(entry models.FileFolderHistory) error {
	if entry.ID == "" {
		entry.ID = uuid.New().String()
	}
	if entry.CreatedAt.IsZero() {
		entry.CreatedAt = time.Now()
	}

	sql := `
		INSERT INTO file_folder_history 
		(id, item_id, action_type, performed_by_id, performed_by_type, old_value, new_value, 
		 shared_with_id, shared_with_type, metadata, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`

	_, err := s.db.Exec(context.Background(), sql,
		entry.ID,
		entry.ItemID,
		entry.ActionType,
		entry.PerformedByID,
		entry.PerformedByType,
		entry.OldValue,
		entry.NewValue,
		entry.SharedWithID,
		entry.SharedWithType,
		entry.Metadata,
		entry.CreatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to add history entry: %v", err)
	}

	return nil
}

func (s *HistoryService) GetHistory(itemID string) ([]models.FileFolderHistory, error) {
	sql := `
		SELECT 
			h.id,
			h.item_id,
			h.action_type,
			h.performed_by_id,
			h.performed_by_type,
			CASE 
				WHEN h.performed_by_type = 'doctor' THEN 
					(SELECT CONCAT(first_name, ' ', last_name) FROM doctor_info WHERE doctor_id::text = h.performed_by_id::text)
				WHEN h.performed_by_type = 'patient' THEN 
					(SELECT CONCAT(first_name, ' ', last_name) FROM patient_info WHERE patient_id::text = h.performed_by_id::text)
				WHEN h.performed_by_type = 'receptionist' THEN 
					(SELECT CONCAT(first_name, ' ', last_name) FROM receptionists WHERE receptionist_id::text = h.performed_by_id::text)
				ELSE 'Unknown User'
			END as performed_by_name,
			h.old_value,
			h.new_value,
			h.shared_with_id,
			h.shared_with_type,
			CASE 
				WHEN h.shared_with_id IS NOT NULL AND h.shared_with_type = 'doctor' THEN 
					(SELECT CONCAT(first_name, ' ', last_name) FROM doctor_info WHERE doctor_id::text = h.shared_with_id::text)
				WHEN h.shared_with_id IS NOT NULL AND h.shared_with_type = 'patient' THEN 
					(SELECT CONCAT(first_name, ' ', last_name) FROM patient_info WHERE patient_id::text = h.shared_with_id::text)
				WHEN h.shared_with_id IS NOT NULL AND h.shared_with_type = 'receptionist' THEN 
					(SELECT CONCAT(first_name, ' ', last_name) FROM receptionists WHERE receptionist_id::text = h.shared_with_id::text)
				ELSE NULL
			END as shared_with_name,
			h.metadata,
			h.created_at
		FROM file_folder_history h
		WHERE h.item_id::text = $1
		ORDER BY h.created_at DESC
	`

	rows, err := s.db.Query(context.Background(), sql, itemID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve history: %v", err)
	}
	defer rows.Close()

	var history []models.FileFolderHistory
	for rows.Next() {
		var entry models.FileFolderHistory
		err := rows.Scan(
			&entry.ID,
			&entry.ItemID,
			&entry.ActionType,
			&entry.PerformedByID,
			&entry.PerformedByType,
			&entry.PerformedByName,
			&entry.OldValue,
			&entry.NewValue,
			&entry.SharedWithID,
			&entry.SharedWithType,
			&entry.SharedWithName,
			&entry.Metadata,
			&entry.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan history entry: %v", err)
		}
		history = append(history, entry)
	}

	return history, nil
}
