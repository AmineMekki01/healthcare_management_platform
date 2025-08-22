package doctor

import (
	"context"
	"database/sql"
	"log"

	"healthcare_backend/pkg/models"
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
			&r.ReceptionistID, &r.Username, &r.FirstName, &r.LastName, &r.Email, &r.PhoneNumber, &r.Bio, &r.ProfilePictureURL, &r.IsActive, &r.EmailVerified, &r.CreatedAt, &r.UpdatedAt,
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
			&r.ReceptionistID, &r.Username, &r.FirstName, &r.LastName, &r.Email, &r.PhoneNumber, &r.Bio, &r.ProfilePictureURL, &r.IsActive, &r.EmailVerified, &r.CreatedAt, &r.UpdatedAt,
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
