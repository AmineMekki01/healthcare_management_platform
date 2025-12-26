package doctor

import (
	"context"
	"database/sql"
	"fmt"
	"log"

	"healthcare_backend/pkg/models"

	"github.com/google/uuid"
)

func (s *DoctorService) GetDoctorStaff(doctorID string) ([]models.Receptionist, error) {
	var staff []models.Receptionist

	query := `
	SELECT
		receptionist_id, username, first_name, last_name, email, phone_number,
		bio, profile_photo_url, is_active, email_verified, created_at, updated_at
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
		var phoneNumber sql.NullString
		var bio sql.NullString
		var profilePhotoURL sql.NullString

		if err := rows.Scan(
			&r.ReceptionistID, &r.Username, &r.FirstName, &r.LastName, &r.Email, &phoneNumber, &bio, &profilePhotoURL, &r.IsActive, &r.EmailVerified, &r.CreatedAt, &r.UpdatedAt,
		); err != nil {
			return nil, err
		}

		if phoneNumber.Valid {
			r.PhoneNumber = phoneNumber.String
		}
		if bio.Valid {
			r.Bio = bio.String
		}
		if profilePhotoURL.Valid {
			r.ProfilePictureURL = profilePhotoURL.String
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

func (s *DoctorService) GetTalentPool() ([]models.Receptionist, error) {
	var receptionists []models.Receptionist
	query := `SELECT receptionist_id, username, first_name, last_name, email, phone_number,
		bio, profile_photo_url, is_active, email_verified, created_at, updated_at
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
		var phoneNumber sql.NullString
		var bio sql.NullString
		var profilePhotoURL sql.NullString
		if err := rows.Scan(
			&r.ReceptionistID, &r.Username, &r.FirstName, &r.LastName, &r.Email, &phoneNumber, &bio, &profilePhotoURL, &r.IsActive, &r.EmailVerified, &r.CreatedAt, &r.UpdatedAt,
		); err != nil {
			return nil, err
		}
		if phoneNumber.Valid {
			r.PhoneNumber = phoneNumber.String
		}
		if bio.Valid {
			r.Bio = bio.String
		}
		if profilePhotoURL.Valid {
			r.ProfilePictureURL = profilePhotoURL.String
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

func (s *DoctorService) HireReceptionist(doctorID, receptionistID string) error {

	query := `
	UPDATE receptionists
	SET assigned_doctor_id = $1, updated_at = NOW()
	WHERE receptionist_id = $2
	`
	result, err := s.db.Exec(context.Background(), query, doctorID, receptionistID)
	if err != nil {
		log.Printf("Error hiring receptionist: %v", err)
		return err
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		log.Printf("No receptionist found with ID: %s", receptionistID)
		return sql.ErrNoRows
	}
	return nil
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
		last_name,
		email,
		phone_number,
		bio,
		profile_photo_url,
		assigned_doctor_id,
		is_active,
		email_verified,
		created_at,
		updated_at
	FROM receptionists
	WHERE receptionist_id = $1
	`

	var r models.Receptionist
	var phoneNumber sql.NullString
	var bio sql.NullString
	var profilePhotoURL sql.NullString
	var assignedDoctorID *uuid.UUID

	err = s.db.QueryRow(context.Background(), query, receptionistUUID).Scan(
		&r.ReceptionistID,
		&r.Username,
		&r.FirstName,
		&r.LastName,
		&r.Email,
		&phoneNumber,
		&bio,
		&profilePhotoURL,
		&assignedDoctorID,
		&r.IsActive,
		&r.EmailVerified,
		&r.CreatedAt,
		&r.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	if phoneNumber.Valid {
		r.PhoneNumber = phoneNumber.String
	}
	if bio.Valid {
		r.Bio = bio.String
	}
	if profilePhotoURL.Valid {
		r.ProfilePictureURL = profilePhotoURL.String
	}
	r.AssignedDoctorID = assignedDoctorID
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

func (s *DoctorService) SetReceptionistActiveStatus(doctorID, receptionistID string, isActive bool) error {
	query := `
	UPDATE receptionists
	SET is_active = $1, updated_at = NOW()
	WHERE receptionist_id = $2 AND assigned_doctor_id = $3
	`

	result, err := s.db.Exec(context.Background(), query, isActive, receptionistID, doctorID)
	if err != nil {
		return err
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func (s *DoctorService) DismissReceptionist(receptionistID string) error {
	query := `
	UPDATE receptionists
	SET assigned_doctor_id = NULL, is_active = false, updated_at = NOW()
	WHERE receptionist_id = $1
	`
	result, err := s.db.Exec(context.Background(), query, receptionistID)
	if err != nil {
		log.Printf("Error dismissing receptionist: %v", err)
		return err
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		log.Printf("No receptionist found with ID: %s", receptionistID)
		return sql.ErrNoRows
	}
	return nil
}
