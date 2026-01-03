package doctor

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"healthcare_backend/pkg/models"
	"healthcare_backend/pkg/utils"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v4"
)

type HiringProposalAlreadyExistsError struct {
	Proposal *models.ReceptionistHiringProposal
}

func (e *HiringProposalAlreadyExistsError) Error() string {
	return "hiring proposal already sent"
}

func (s *DoctorService) GetDoctorStaff(doctorID string) ([]models.Receptionist, error) {
	var staff []models.Receptionist

	query := `
	SELECT
		receptionist_id,
		username,
		first_name,
		COALESCE(first_name_ar, '') as first_name_ar,
		last_name,
		COALESCE(last_name_ar, '') as last_name_ar,
		email,
		phone_number,
		COALESCE(bio, '') as bio,
		COALESCE(bio_ar, '') as bio_ar,
		COALESCE(profile_photo_url, '') as profile_photo_url,
		assigned_doctor_id,
		is_active,
		email_verified,
		created_at,
		updated_at,
		COALESCE(location, '') as location,
		COALESCE(location_ar, '') as location_ar,
		COALESCE(location_fr, '') as location_fr
	FROM
		receptionists
	WHERE
		assigned_doctor_id = $1
	ORDER BY
		updated_at DESC
	`
	rows, err := s.db.Query(context.Background(), query, doctorID)
	if err != nil {
		log.Printf("Error fetching doctor staff: %v", err)
		return nil, err
	}
	defer rows.Close()

	log.Printf("Executing query to fetch staff for doctor ID: %s", doctorID)
	for rows.Next() {
		var r models.Receptionist
		var assignedDoctorID *uuid.UUID

		if err := rows.Scan(
			&r.ReceptionistID,
			&r.Username,
			&r.FirstName,
			&r.FirstNameAr,
			&r.LastName,
			&r.LastNameAr,
			&r.Email,
			&r.PhoneNumber,
			&r.Bio,
			&r.BioAr,
			&r.ProfilePictureURL,
			&assignedDoctorID,
			&r.IsActive,
			&r.EmailVerified,
			&r.CreatedAt,
			&r.UpdatedAt,
			&r.Location,
			&r.LocationAr,
			&r.LocationFr,
		); err != nil {
			return nil, err
		}

		r.AssignedDoctorID = assignedDoctorID

		if r.ProfilePictureURL != "" {
			presignedURL, err := utils.GeneratePresignedObjectURL(r.ProfilePictureURL)
			if err != nil {
				log.Printf("Warning: failed to generate presigned URL for profile picture: %v", err)
			} else {
				r.ProfilePictureURL = presignedURL
			}
		}

		log.Printf("Fetched receptionist: %+v", r)
		years, err := s.getReceptionistExperienceYears(r.ReceptionistID)
		if err != nil {
			log.Printf("Warning: failed to compute receptionist experience years: %v", err)
		} else {
			r.ExperienceYears = years
		}

		staff = append(staff, r)
	}

	return staff, nil
}

func (s *DoctorService) SearchStaff(doctorID, query string, filters map[string]string) ([]models.Receptionist, error) {
	role := strings.ToLower(strings.TrimSpace(filters["role"]))
	if role != "" && role != "receptionist" {
		return []models.Receptionist{}, nil
	}

	limitInt := 20
	if rawLimit := strings.TrimSpace(filters["limit"]); rawLimit != "" {
		if parsed, err := strconv.Atoi(rawLimit); err == nil {
			limitInt = parsed
		}
	}
	if limitInt <= 0 {
		limitInt = 20
	}
	if limitInt > 100 {
		limitInt = 100
	}

	status := strings.ToLower(strings.TrimSpace(filters["status"]))
	isActiveFilter := (*bool)(nil)
	if status == "active" || status == "available" {
		v := true
		isActiveFilter = &v
	}
	if status == "inactive" {
		v := false
		isActiveFilter = &v
	}

	q := strings.TrimSpace(query)
	querySQL := `
		SELECT
			receptionist_id,
			username,
			first_name,
			COALESCE(first_name_ar, '') as first_name_ar,
			last_name,
			COALESCE(last_name_ar, '') as last_name_ar,
			email,
			phone_number,
			COALESCE(bio, '') as bio,
			COALESCE(bio_ar, '') as bio_ar,
			COALESCE(profile_photo_url, '') as profile_photo_url,
			assigned_doctor_id,
			is_active,
			email_verified,
			created_at,
			updated_at,
			COALESCE(location, '') as location,
			COALESCE(location_ar, '') as location_ar,
			COALESCE(location_fr, '') as location_fr
		FROM
			receptionists
		WHERE
			assigned_doctor_id = $1
		`

	args := []interface{}{doctorID}
	paramIdx := 2

	if q != "" {
		querySQL += fmt.Sprintf(`
			AND (
				username ILIKE $%d
				OR email ILIKE $%d
				OR phone_number ILIKE $%d
				OR first_name ILIKE $%d
				OR last_name ILIKE $%d
				OR COALESCE(first_name_ar, '') ILIKE $%d
				OR COALESCE(last_name_ar, '') ILIKE $%d
			)
		`, paramIdx, paramIdx, paramIdx, paramIdx, paramIdx, paramIdx, paramIdx)
		args = append(args, "%"+q+"%")
		paramIdx++
	}

	if isActiveFilter != nil {
		querySQL += fmt.Sprintf("\n\t\t\tAND is_active = $%d\n\t\t", paramIdx)
		args = append(args, *isActiveFilter)
		paramIdx++
	}

	querySQL += fmt.Sprintf("\n\t\tORDER BY updated_at DESC\n\t\tLIMIT $%d\n\t", paramIdx)
	args = append(args, limitInt)

	rows, err := s.db.Query(context.Background(), querySQL, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []models.Receptionist
	for rows.Next() {
		var r models.Receptionist
		var assignedDoctorID *uuid.UUID

		if err := rows.Scan(
			&r.ReceptionistID,
			&r.Username,
			&r.FirstName,
			&r.FirstNameAr,
			&r.LastName,
			&r.LastNameAr,
			&r.Email,
			&r.PhoneNumber,
			&r.Bio,
			&r.BioAr,
			&r.ProfilePictureURL,
			&assignedDoctorID,
			&r.IsActive,
			&r.EmailVerified,
			&r.CreatedAt,
			&r.UpdatedAt,
			&r.Location,
			&r.LocationAr,
			&r.LocationFr,
		); err != nil {
			return nil, err
		}

		r.AssignedDoctorID = assignedDoctorID

		if r.ProfilePictureURL != "" {
			presignedURL, err := utils.GeneratePresignedObjectURL(r.ProfilePictureURL)
			if err != nil {
				log.Printf("Warning: failed to generate presigned URL for profile picture: %v", err)
			} else {
				r.ProfilePictureURL = presignedURL
			}
		}

		years, yearsErr := s.getReceptionistExperienceYears(r.ReceptionistID)
		if yearsErr == nil {
			r.ExperienceYears = years
		}

		results = append(results, r)
	}

	return results, nil
}

func (s *DoctorService) GetDoctorStaffEmploymentHistory(doctorID string) ([]map[string]interface{}, error) {
	query := `
		SELECT
			e.employment_id,
			e.receptionist_id,
			r.first_name,
			COALESCE(r.first_name_ar, '') as first_name_ar,
			r.last_name,
			COALESCE(r.last_name_ar, '') as last_name_ar,
			r.profile_photo_url,
			e.started_at,
			e.ended_at,
			e.dismissed_reason,
			e.dismissed_by
		FROM receptionist_employments e
		JOIN receptionists r ON r.receptionist_id = e.receptionist_id
		WHERE e.doctor_id = $1
		ORDER BY e.started_at DESC
	`

	rows, err := s.db.Query(context.Background(), query, doctorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var history []map[string]interface{}
	for rows.Next() {
		var employmentID uuid.UUID
		var receptionistID uuid.UUID
		var firstName string
		var firstNameAr string
		var lastName string
		var lastNameAr string
		var profilePhotoURL sql.NullString
		var startedAt time.Time
		var endedAt sql.NullTime
		var dismissedReason sql.NullString
		var dismissedBy sql.NullString

		if err := rows.Scan(
			&employmentID,
			&receptionistID,
			&firstName,
			&firstNameAr,
			&lastName,
			&lastNameAr,
			&profilePhotoURL,
			&startedAt,
			&endedAt,
			&dismissedReason,
			&dismissedBy,
		); err != nil {
			return nil, err
		}

		var profilePicURL interface{} = nil
		if profilePhotoURL.Valid && profilePhotoURL.String != "" {
			presignedURL, err := utils.GeneratePresignedObjectURL(profilePhotoURL.String)
			if err != nil {
				log.Printf("Warning: failed to generate presigned URL for profile picture: %v", err)
				profilePicURL = profilePhotoURL.String
			} else {
				profilePicURL = presignedURL
			}
		}

		item := map[string]interface{}{
			"employmentId":     employmentID.String(),
			"receptionistId":   receptionistID.String(),
			"receptionistName": fmt.Sprintf("%s %s", firstName, lastName),
			"receptionistNameAr": func() string {
				name := strings.TrimSpace(fmt.Sprintf("%s %s", firstNameAr, lastNameAr))
				return name
			}(),
			"startedAt":         startedAt,
			"endedAt":           nil,
			"dismissedReason":   nil,
			"dismissedBy":       nil,
			"profilePictureUrl": profilePicURL,
		}
		if endedAt.Valid {
			item["endedAt"] = endedAt.Time
		}
		if dismissedReason.Valid {
			item["dismissedReason"] = dismissedReason.String
		}
		if dismissedBy.Valid {
			item["dismissedBy"] = dismissedBy.String
		}
		history = append(history, item)
	}

	if err := rows.Err(); err != nil {
		log.Printf("Error iterating employment history rows: %v", err)
		return nil, err
	}

	return history, nil
}

func (s *DoctorService) GetTalentPool() ([]models.Receptionist, error) {
	var receptionists []models.Receptionist
	query := `SELECT receptionist_id,
		username,
		first_name,
		COALESCE(first_name_ar, '') as first_name_ar,
		last_name,
		COALESCE(last_name_ar, '') as last_name_ar,
		email,
		phone_number,
		COALESCE(bio, '') as bio,
		COALESCE(bio_ar, '') as bio_ar,
		COALESCE(profile_photo_url, '') as profile_photo_url,
		assigned_doctor_id,
		is_active,
		email_verified,
		created_at,
		updated_at,
		COALESCE(location, '') as location,
		COALESCE(location_ar, '') as location_ar,
		COALESCE(location_fr, '') as location_fr
		FROM receptionists 
		WHERE assigned_doctor_id IS NULL
		ORDER BY created_at DESC
	`
	rows, err := s.db.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	for rows.Next() {
		var r models.Receptionist
		var assignedDoctorID *uuid.UUID
		if err := rows.Scan(
			&r.ReceptionistID,
			&r.Username,
			&r.FirstName,
			&r.FirstNameAr,
			&r.LastName,
			&r.LastNameAr,
			&r.Email,
			&r.PhoneNumber,
			&r.Bio,
			&r.BioAr,
			&r.ProfilePictureURL,
			&assignedDoctorID,
			&r.IsActive,
			&r.EmailVerified,
			&r.CreatedAt,
			&r.UpdatedAt,
			&r.Location,
			&r.LocationAr,
			&r.LocationFr,
		); err != nil {
			return nil, err
		}
		r.AssignedDoctorID = assignedDoctorID

		if r.ProfilePictureURL != "" {
			presignedURL, err := utils.GeneratePresignedObjectURL(r.ProfilePictureURL)
			if err != nil {
				log.Printf("Warning: failed to generate presigned URL for profile picture: %v", err)
			} else {
				r.ProfilePictureURL = presignedURL
			}
		}

		years, err := s.getReceptionistExperienceYears(r.ReceptionistID)
		if err != nil {
			log.Printf("Warning: failed to compute receptionist experience years: %v", err)
		} else {
			r.ExperienceYears = years
		}
		log.Printf("Fetched receptionist: %+v", r)
		receptionists = append(receptionists, r)
	}
	return receptionists, nil
}

func (s *DoctorService) HireReceptionist(doctorID, receptionistID string, message *string) (*models.ReceptionistHiringProposal, error) {
	doctorUUID, err := uuid.Parse(doctorID)
	if err != nil {
		return nil, fmt.Errorf("invalid doctor ID")
	}
	receptionistUUID, err := uuid.Parse(receptionistID)
	if err != nil {
		return nil, fmt.Errorf("invalid receptionist ID")
	}

	ctx := context.Background()

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	lockKey := fmt.Sprintf("hire:%s:%s", doctorUUID.String(), receptionistUUID.String())
	if _, err := tx.Exec(ctx, "SELECT pg_advisory_xact_lock(hashtext($1))", lockKey); err != nil {
		return nil, err
	}

	var existingProposal models.ReceptionistHiringProposal
	existingErr := tx.QueryRow(
		ctx,
		`SELECT proposal_id, doctor_id, receptionist_id, status, initial_message, created_at, updated_at
		 FROM receptionist_hiring_proposals
		 WHERE doctor_id = $1 AND receptionist_id = $2 AND status = 'sent'
		 ORDER BY created_at DESC
		 LIMIT 1`,
		doctorUUID,
		receptionistUUID,
	).Scan(
		&existingProposal.ProposalID,
		&existingProposal.DoctorID,
		&existingProposal.ReceptionistID,
		&existingProposal.Status,
		&existingProposal.InitialMessage,
		&existingProposal.CreatedAt,
		&existingProposal.UpdatedAt,
	)
	if existingErr == nil {
		return nil, &HiringProposalAlreadyExistsError{Proposal: &existingProposal}
	}
	if existingErr != pgx.ErrNoRows {
		log.Printf("Error checking existing hiring proposal: %v", existingErr)
		return nil, existingErr
	}

	var assignedDoctorID *uuid.UUID
	err = tx.QueryRow(
		ctx,
		"SELECT assigned_doctor_id FROM receptionists WHERE receptionist_id = $1",
		receptionistUUID,
	).Scan(&assignedDoctorID)
	if err != nil {
		log.Printf("Error checking receptionist availability: %v", err)
		return nil, err
	}
	if assignedDoctorID != nil {
		return nil, fmt.Errorf("receptionist already assigned")
	}

	insertProposal := `
		INSERT INTO receptionist_hiring_proposals (doctor_id, receptionist_id, initial_message)
		VALUES ($1, $2, $3)
		RETURNING proposal_id, doctor_id, receptionist_id, status, initial_message, created_at, updated_at
	`

	var proposal models.ReceptionistHiringProposal
	err = tx.QueryRow(ctx, insertProposal, doctorUUID, receptionistUUID, message).Scan(
		&proposal.ProposalID,
		&proposal.DoctorID,
		&proposal.ReceptionistID,
		&proposal.Status,
		&proposal.InitialMessage,
		&proposal.CreatedAt,
		&proposal.UpdatedAt,
	)
	if err != nil {
		log.Printf("Error creating hiring proposal: %v", err)
		return nil, err
	}

	if message != nil && *message != "" {
		_, msgErr := tx.Exec(
			ctx,
			`INSERT INTO receptionist_hiring_messages (proposal_id, sender_type, sender_id, message) VALUES ($1, 'doctor', $2, $3)`,
			proposal.ProposalID,
			doctorUUID,
			*message,
		)
		if msgErr != nil {
			log.Printf("Warning: failed to create hiring proposal message: %v", msgErr)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &proposal, nil
}

func (s *DoctorService) ListHiringProposalsForDoctor(doctorID string) ([]map[string]interface{}, error) {
	query := `
		SELECT
			p.proposal_id,
			p.receptionist_id,
			r.first_name,
			COALESCE(r.first_name_ar, '') as first_name_ar,
			r.last_name,
			COALESCE(r.last_name_ar, '') as last_name_ar,
			r.profile_photo_url,
			p.status,
			p.initial_message,
			p.created_at,
			p.updated_at
		FROM receptionist_hiring_proposals p
		JOIN receptionists r ON r.receptionist_id = p.receptionist_id
		WHERE p.doctor_id = $1
		ORDER BY p.created_at DESC
	`

	rows, err := s.db.Query(context.Background(), query, doctorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var proposals []map[string]interface{}
	for rows.Next() {
		var proposalID uuid.UUID
		var receptionistID uuid.UUID
		var firstName string
		var firstNameAr string
		var lastName string
		var lastNameAr string
		var profilePhotoURL sql.NullString
		var status string
		var initialMessage sql.NullString
		var createdAt time.Time
		var updatedAt time.Time

		if err := rows.Scan(
			&proposalID,
			&receptionistID,
			&firstName,
			&firstNameAr,
			&lastName,
			&lastNameAr,
			&profilePhotoURL,
			&status,
			&initialMessage,
			&createdAt,
			&updatedAt,
		); err != nil {
			return nil, err
		}

		var profilePicURL interface{} = nil
		if profilePhotoURL.Valid && profilePhotoURL.String != "" {
			presignedURL, err := utils.GeneratePresignedObjectURL(profilePhotoURL.String)
			if err != nil {
				log.Printf("Warning: failed to generate presigned URL for profile picture: %v", err)
				profilePicURL = profilePhotoURL.String
			} else {
				profilePicURL = presignedURL
			}
		}

		item := map[string]interface{}{
			"proposalId":       proposalID.String(),
			"receptionistId":   receptionistID.String(),
			"receptionistName": fmt.Sprintf("%s %s", firstName, lastName),
			"receptionistNameAr": func() string {
				name := strings.TrimSpace(fmt.Sprintf("%s %s", firstNameAr, lastNameAr))
				return name
			}(),
			"status":            status,
			"initialMessage":    nil,
			"createdAt":         createdAt,
			"updatedAt":         updatedAt,
			"profilePictureUrl": profilePicURL,
		}
		if initialMessage.Valid {
			item["initialMessage"] = initialMessage.String
		}

		proposals = append(proposals, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return proposals, nil
}

func (s *DoctorService) GetReceptionistByID(receptionistID string) (*models.Receptionist, error) {
	receptionistUUID, err := uuid.Parse(receptionistID)
	if err != nil {
		return nil, fmt.Errorf("invalid receptionist ID")
	}

	query := `
	SELECT
		receptionist_id,
		username,
		first_name,
		COALESCE(first_name_ar, '') as first_name_ar,
		last_name,
		COALESCE(last_name_ar, '') as last_name_ar,
		email,
		phone_number,
		COALESCE(bio, '') as bio,
		COALESCE(bio_ar, '') as bio_ar,
		COALESCE(profile_photo_url, '') as profile_photo_url,
		assigned_doctor_id,
		is_active,
		email_verified,
		created_at,
		updated_at,
		COALESCE(location, '') as location,
		COALESCE(location_ar, '') as location_ar,
		COALESCE(location_fr, '') as location_fr
	FROM receptionists
	WHERE receptionist_id = $1
	`

	var r models.Receptionist
	var assignedDoctorID *uuid.UUID

	err = s.db.QueryRow(context.Background(), query, receptionistUUID).Scan(
		&r.ReceptionistID,
		&r.Username,
		&r.FirstName,
		&r.FirstNameAr,
		&r.LastName,
		&r.LastNameAr,
		&r.Email,
		&r.PhoneNumber,
		&r.Bio,
		&r.BioAr,
		&r.ProfilePictureURL,
		&assignedDoctorID,
		&r.IsActive,
		&r.EmailVerified,
		&r.CreatedAt,
		&r.UpdatedAt,
		&r.Location,
		&r.LocationAr,
		&r.LocationFr,
	)
	if err != nil {
		return nil, err
	}
	r.AssignedDoctorID = assignedDoctorID

	if r.ProfilePictureURL != "" {
		presignedURL, err := utils.GeneratePresignedObjectURL(r.ProfilePictureURL)
		if err != nil {
			log.Printf("Warning: failed to generate presigned URL for profile picture: %v", err)
		} else {
			r.ProfilePictureURL = presignedURL
		}
	}

	years, err := s.getReceptionistExperienceYears(r.ReceptionistID)
	if err != nil {
		log.Printf("Warning: failed to compute receptionist experience years: %v", err)
	} else {
		r.ExperienceYears = years
	}

	return &r, nil
}

func (s *DoctorService) getReceptionistExperienceYears(receptionistID uuid.UUID) (float64, error) {
	var years float64
	query := `
		SELECT COALESCE(SUM((COALESCE(end_date, CURRENT_DATE) - start_date)), 0)::float8 / 365.25
		FROM receptionist_experiences
		WHERE receptionist_id = $1
	`

	err := s.db.QueryRow(context.Background(), query, receptionistID).Scan(&years)
	if err != nil {
		return 0, err
	}
	return years, nil
}

func (s *DoctorService) DismissReceptionist(doctorID, receptionistID, reason string) error {
	if reason == "" {
		return fmt.Errorf("dismissal reason is required")
	}

	doctorUUID, err := uuid.Parse(doctorID)
	if err != nil {
		return fmt.Errorf("invalid doctor ID")
	}
	receptionistUUID, err := uuid.Parse(receptionistID)
	if err != nil {
		return fmt.Errorf("invalid receptionist ID")
	}

	tx, err := s.db.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	result, err := tx.Exec(
		context.Background(),
		`UPDATE receptionists
		 SET assigned_doctor_id = NULL, updated_at = NOW()
		 WHERE receptionist_id = $1 AND assigned_doctor_id = $2`,
		receptionistUUID,
		doctorUUID,
	)
	if err != nil {
		log.Printf("Error dismissing receptionist: %v", err)
		return err
	}
	if result.RowsAffected() == 0 {
		return sql.ErrNoRows
	}

	result, err = tx.Exec(
		context.Background(),
		`UPDATE receptionist_employments
		 SET ended_at = NOW(), dismissed_reason = $1, dismissed_by = $2, updated_at = NOW()
		 WHERE receptionist_id = $3 AND doctor_id = $2 AND ended_at IS NULL`,
		reason,
		doctorUUID,
		receptionistUUID,
	)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		log.Printf("Warning: no active employment row found for receptionist %s and doctor %s", receptionistID, doctorID)
	}

	if err := tx.Commit(context.Background()); err != nil {
		return err
	}

	return nil
}
