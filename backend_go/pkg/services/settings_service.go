package services

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"mime/multipart"
	"time"

	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/models"
	"healthcare_backend/pkg/utils"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
)

type SettingsService struct {
	db  *pgxpool.Pool
	cfg *config.Config
}

func NewSettingsService(db *pgxpool.Pool, cfg *config.Config) *SettingsService {
	return &SettingsService{
		db:  db,
		cfg: cfg,
	}
}

func (s *SettingsService) GetUserByID(userID, userType string) (*models.StandardUserProfile, error) {
	id, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID")
	}

	switch userType {
	case "patient":
		patient, err := s.getPatientProfile(id)
		if err != nil {
			return nil, err
		}
		return models.ToStandardProfile(*patient, "patient"), nil

	case "doctor":
		doctor, err := s.getDoctorProfile(id)
		if err != nil {
			return nil, err
		}
		return models.ToStandardProfile(*doctor, "doctor"), nil

	case "receptionist":
		receptionist, err := s.getReceptionistProfile(id)
		if err != nil {
			return nil, err
		}
		return models.ToStandardProfile(*receptionist, "receptionist"), nil

	default:
		return nil, fmt.Errorf("invalid user type")
	}
}

func (s *SettingsService) getPatientProfile(id uuid.UUID) (*models.Patient, error) {
	var patient models.Patient
	query := `SELECT email, phone_number, first_name, last_name, TO_CHAR(birth_date, 'YYYY-MM-DD'),
		bio, sex, location, profile_photo_url, street_address, city_name, zip_code,
		country_name, age, COALESCE(state_name, '') as state_name
		FROM patient_info WHERE patient_id = $1`

	err := s.db.QueryRow(context.Background(), query, id).Scan(
		&patient.Email,
		&patient.PhoneNumber,
		&patient.FirstName,
		&patient.LastName,
		&patient.BirthDate,
		&patient.Bio,
		&patient.Sex,
		&patient.Location,
		&patient.ProfilePictureURL,
		&patient.StreetAddress,
		&patient.CityName,
		&patient.ZipCode,
		&patient.CountryName,
		&patient.Age,
		&patient.StateName,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("patient not found")
		}
		return nil, fmt.Errorf("error retrieving patient: %v", err)
	}

	patient.PatientID = id

	if patient.ProfilePictureURL != "" {
		if presignedURL, err := utils.GeneratePresignedObjectURL(patient.ProfilePictureURL); err == nil {
			patient.ProfilePictureURL = presignedURL
		} else {
			log.Printf("Warning: failed to generate presigned URL for patient profile picture: %v", err)
		}
	}

	return &patient, nil
}

func (s *SettingsService) getDoctorProfile(id uuid.UUID) (*models.Doctor, error) {
	var doctor models.Doctor
	query := `SELECT email, phone_number, first_name, last_name, TO_CHAR(birth_date, 'YYYY-MM-DD'),
		bio, sex, location, profile_photo_url, street_address, city_name, zip_code,
		country_name, age, COALESCE(state_name, '') as state_name, specialty, experience, 
		rating_score, rating_count, medical_license, COALESCE(latitude, 0), COALESCE(longitude, 0)
		FROM doctor_info WHERE doctor_id = $1`

	var ratingScore sql.NullFloat64
	err := s.db.QueryRow(context.Background(), query, id).Scan(
		&doctor.Email,
		&doctor.PhoneNumber,
		&doctor.FirstName,
		&doctor.LastName,
		&doctor.BirthDate,
		&doctor.Bio,
		&doctor.Sex,
		&doctor.Location,
		&doctor.ProfilePictureURL,
		&doctor.StreetAddress,
		&doctor.CityName,
		&doctor.ZipCode,
		&doctor.CountryName,
		&doctor.Age,
		&doctor.StateName,
		&doctor.Specialty,
		&doctor.Experience,
		&ratingScore,
		&doctor.RatingCount,
		&doctor.MedicalLicense,
		&doctor.Latitude,
		&doctor.Longitude,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("doctor not found")
		}
		return nil, fmt.Errorf("error retrieving doctor: %v", err)
	}

	doctor.DoctorID = id

	if ratingScore.Valid {
		rating := float32(ratingScore.Float64)
		doctor.RatingScore = &rating
	}

	if doctor.ProfilePictureURL != "" {
		if presignedURL, err := utils.GeneratePresignedObjectURL(doctor.ProfilePictureURL); err == nil {
			doctor.ProfilePictureURL = presignedURL
		} else {
			log.Printf("Warning: failed to generate presigned URL for doctor profile picture: %v", err)
		}
	}

	doctor.Hospitals, _ = s.getDoctorHospitals(id)
	doctor.Organizations, _ = s.getDoctorOrganizations(id)
	doctor.Awards, _ = s.getDoctorAwards(id)
	doctor.Certifications, _ = s.getDoctorCertifications(id)
	doctor.Languages, _ = s.getDoctorLanguages(id)

	return &doctor, nil
}

func (s *SettingsService) getReceptionistProfile(id uuid.UUID) (*models.Receptionist, error) {
	var receptionist models.Receptionist
	var birthDateStr *string
	query := `SELECT email, phone_number, first_name, last_name, TO_CHAR(birth_date, 'YYYY-MM-DD'),
		bio, sex, profile_photo_url, street_address, city_name, zip_code,
		country_name, COALESCE(state_name, '') as state_name, is_active, email_verified, 
		assigned_doctor_id, created_at, updated_at
		FROM receptionists WHERE receptionist_id = $1`

	err := s.db.QueryRow(context.Background(), query, id).Scan(
		&receptionist.Email,
		&receptionist.PhoneNumber,
		&receptionist.FirstName,
		&receptionist.LastName,
		&birthDateStr,
		&receptionist.Bio,
		&receptionist.Sex,
		&receptionist.ProfilePictureURL,
		&receptionist.StreetAddress,
		&receptionist.CityName,
		&receptionist.ZipCode,
		&receptionist.CountryName,
		&receptionist.StateName,
		&receptionist.IsActive,
		&receptionist.EmailVerified,
		&receptionist.AssignedDoctorID,
		&receptionist.CreatedAt,
		&receptionist.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("receptionist not found")
		}
		return nil, fmt.Errorf("error retrieving receptionist: %v", err)
	}

	receptionist.ReceptionistID = id

	if birthDateStr != nil && *birthDateStr != "" {
		if parsedTime, parseErr := time.Parse("2006-01-02", *birthDateStr); parseErr == nil {
			receptionist.BirthDate = &parsedTime
		}
	}

	if receptionist.ProfilePictureURL != "" {
		if presignedURL, err := utils.GeneratePresignedObjectURL(receptionist.ProfilePictureURL); err == nil {
			receptionist.ProfilePictureURL = presignedURL
		} else {
			log.Printf("Warning: failed to generate presigned URL for receptionist profile picture: %v", err)
		}
	}

	return &receptionist, nil
}

type UserUpdateData struct {
	FirstName         string `form:"firstName"`
	LastName          string `form:"lastName"`
	Email             string `form:"email"`
	PhoneNumber       string `form:"phoneNumber"`
	StreetAddress     string `form:"streetAddress"`
	CityName          string `form:"cityName"`
	ZipCode           string `form:"zipCode"`
	CountryName       string `form:"countryName"`
	Bio               string `form:"bio"`
	ProfilePictureUrl string `form:"profilePictureUrl"`
}

func (s *SettingsService) UpdateUserInfo(userID, userType string, updateData UserUpdateData, file multipart.File, handler *multipart.FileHeader) (*models.StandardUserProfile, error) {
	fileName := fmt.Sprintf("images/profile_photos/%s.jpg", userID)

	var newProfilePictureURL string
	if file != nil && handler != nil {
		err := utils.DeleteFromS3(fileName)
		if err != nil {
			log.Printf("Warning: failed to delete old profile photo: %v", err)
		}

		err = utils.UploadToS3(file, handler, fileName)
		if err != nil {
			return nil, fmt.Errorf("failed to upload new profile photo: %v", err)
		}

		newProfilePictureURL, err = utils.GeneratePresignedObjectURL(fileName)
		if err != nil {
			return nil, fmt.Errorf("failed to generate presigned URL: %v", err)
		}
	}

	err := s.updateUserInDatabase(userID, userType, updateData, fileName)
	if err != nil {
		return nil, err
	}

	updatedProfile, err := s.GetUserByID(userID, userType)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch updated profile: %v", err)
	}

	if newProfilePictureURL != "" {
		updatedProfile.ProfilePictureURL = newProfilePictureURL
	}

	return updatedProfile, nil
}

func (s *SettingsService) updateUserInDatabase(userID, userType string, updateData UserUpdateData, photoFileName string) error {
	id, err := uuid.Parse(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID")
	}

	var query string
	var args []interface{}

	switch userType {
	case "patient":
		if photoFileName != "" {
			query = `UPDATE patient_info 
				SET first_name = $1, last_name = $2, email = $3, phone_number = $4, 
					street_address = $5, city_name = $6, zip_code = $7, country_name = $8, 
					bio = $9, profile_photo_url = $10, updated_at = NOW()
				WHERE patient_id = $11`
			args = []interface{}{
				updateData.FirstName, updateData.LastName, updateData.Email, updateData.PhoneNumber,
				updateData.StreetAddress, updateData.CityName, updateData.ZipCode, updateData.CountryName,
				updateData.Bio, photoFileName, id,
			}
		} else {
			query = `UPDATE patient_info 
				SET first_name = $1, last_name = $2, email = $3, phone_number = $4, 
					street_address = $5, city_name = $6, zip_code = $7, country_name = $8, 
					bio = $9, updated_at = NOW()
				WHERE patient_id = $10`
			args = []interface{}{
				updateData.FirstName, updateData.LastName, updateData.Email, updateData.PhoneNumber,
				updateData.StreetAddress, updateData.CityName, updateData.ZipCode, updateData.CountryName,
				updateData.Bio, id,
			}
		}

	case "doctor":
		if photoFileName != "" {
			query = `UPDATE doctor_info 
				SET first_name = $1, last_name = $2, email = $3, phone_number = $4, 
					street_address = $5, city_name = $6, zip_code = $7, country_name = $8, 
					bio = $9, profile_photo_url = $10, updated_at = NOW()
				WHERE doctor_id = $11`
			args = []interface{}{
				updateData.FirstName, updateData.LastName, updateData.Email, updateData.PhoneNumber,
				updateData.StreetAddress, updateData.CityName, updateData.ZipCode, updateData.CountryName,
				updateData.Bio, photoFileName, id,
			}
		} else {
			query = `UPDATE doctor_info 
				SET first_name = $1, last_name = $2, email = $3, phone_number = $4, 
					street_address = $5, city_name = $6, zip_code = $7, country_name = $8, 
					bio = $9, updated_at = NOW()
				WHERE doctor_id = $10`
			args = []interface{}{
				updateData.FirstName, updateData.LastName, updateData.Email, updateData.PhoneNumber,
				updateData.StreetAddress, updateData.CityName, updateData.ZipCode, updateData.CountryName,
				updateData.Bio, id,
			}
		}

	case "receptionist":
		if photoFileName != "" {
			query = `UPDATE receptionists 
				SET first_name = $1, last_name = $2, email = $3, phone_number = $4, 
					street_address = $5, city_name = $6, zip_code = $7, country_name = $8, 
					bio = $9, profile_photo_url = $10, updated_at = NOW()
				WHERE receptionist_id = $11`
			args = []interface{}{
				updateData.FirstName, updateData.LastName, updateData.Email, updateData.PhoneNumber,
				updateData.StreetAddress, updateData.CityName, updateData.ZipCode, updateData.CountryName,
				updateData.Bio, photoFileName, id,
			}
		} else {
			query = `UPDATE receptionists 
				SET first_name = $1, last_name = $2, email = $3, phone_number = $4, 
					street_address = $5, city_name = $6, zip_code = $7, country_name = $8, 
					bio = $9, updated_at = NOW()
				WHERE receptionist_id = $10`
			args = []interface{}{
				updateData.FirstName, updateData.LastName, updateData.Email, updateData.PhoneNumber,
				updateData.StreetAddress, updateData.CityName, updateData.ZipCode, updateData.CountryName,
				updateData.Bio, id,
			}
		}

	default:
		return fmt.Errorf("invalid user type")
	}

	_, err = s.db.Exec(context.Background(), query, args...)
	if err != nil {
		return fmt.Errorf("failed to update user information: %v", err)
	}

	return nil
}

func (s *SettingsService) GetDoctorAdditionalInfo(doctorID string) (map[string]interface{}, error) {
	docUUID, err := uuid.Parse(doctorID)
	if err != nil {
		log.Printf("Error parsing doctor ID: %v", err)
		return nil, fmt.Errorf("invalid doctor ID")
	}

	result := make(map[string]interface{})

	hospitals := []models.DoctorHospital{}
	hospitalQuery := `SELECT id, hospital_name, position, start_date, end_date, description
		FROM doctor_hospitals WHERE doctor_id = $1`

	rows, err := s.db.Query(context.Background(), hospitalQuery, docUUID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var hospital models.DoctorHospital
			var startDate, endDate *time.Time

			err = rows.Scan(&hospital.ID, &hospital.HospitalName, &hospital.Position,
				&startDate, &endDate, &hospital.Description)
			if err != nil {
				log.Printf("Error scanning hospital row: %v", err)
				return nil, fmt.Errorf("error scanning hospital row: %v", err)
			}

			layout := "2006-01-02"
			if startDate != nil {
				str := startDate.Format(layout)
				hospital.StartDate = &str
			}
			if endDate != nil {
				str := endDate.Format(layout)
				hospital.EndDate = &str
			}
			hospitals = append(hospitals, hospital)
		}
	}
	result["hospitals"] = hospitals

	organizations := []models.DoctorOrganization{}
	orgQuery := `SELECT id, organization_name, role, start_date, end_date, description
		FROM doctor_organizations WHERE doctor_id = $1`

	rows, err = s.db.Query(context.Background(), orgQuery, docUUID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var organization models.DoctorOrganization
			var startDate, endDate *time.Time

			err = rows.Scan(&organization.ID, &organization.OrganizationName, &organization.Role,
				&startDate, &endDate, &organization.Description)
			if err != nil {
				log.Printf("Error scanning organization row: %v", err)
				return nil, fmt.Errorf("error scanning organization row: %v", err)
			}

			layout := "2006-01-02"
			if startDate != nil {
				str := startDate.Format(layout)
				organization.StartDate = &str
			}
			if endDate != nil {
				str := endDate.Format(layout)
				organization.EndDate = &str
			}
			organizations = append(organizations, organization)
		}
	}
	result["organizations"] = organizations

	awards := []models.DoctorAward{}
	awardQuery := `SELECT id, award_name, date_awarded, issuing_organization, description
		FROM doctor_awards WHERE doctor_id = $1`

	rows, err = s.db.Query(context.Background(), awardQuery, docUUID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var award models.DoctorAward
			var dateAwarded *time.Time

			err = rows.Scan(&award.ID, &award.AwardName, &dateAwarded,
				&award.IssuingOrganization, &award.Description)
			if err != nil {
				log.Printf("Error scanning award row: %v", err)
				return nil, fmt.Errorf("error scanning award row: %v", err)
			}

			layout := "2006-01-02"
			if dateAwarded != nil {
				str := dateAwarded.Format(layout)
				award.DateAwarded = &str
			}
			awards = append(awards, award)
		}
	}
	result["awards"] = awards

	certifications := []models.DoctorCertification{}
	certQuery := `SELECT id, certification_name, issued_by, issue_date, expiration_date, description
		FROM doctor_certifications WHERE doctor_id = $1`

	rows, err = s.db.Query(context.Background(), certQuery, docUUID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var certification models.DoctorCertification
			var issueDate, expirationDate *time.Time

			err = rows.Scan(&certification.ID, &certification.CertificationName, &certification.IssuedBy,
				&issueDate, &expirationDate, &certification.Description)
			if err != nil {
				log.Printf("Error scanning certification row: %v", err)
				return nil, fmt.Errorf("error scanning certification row: %v", err)
			}

			layout := "2006-01-02"
			if issueDate != nil {
				str := issueDate.Format(layout)
				certification.IssueDate = &str
			}
			if expirationDate != nil {
				str := expirationDate.Format(layout)
				certification.ExpirationDate = &str
			}
			certifications = append(certifications, certification)
		}
	}
	result["certifications"] = certifications

	languages := []models.DoctorLanguage{}
	langQuery := `SELECT id, language_name, proficiency_level
		FROM doctor_languages WHERE doctor_id = $1`

	rows, err = s.db.Query(context.Background(), langQuery, docUUID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var language models.DoctorLanguage

			err = rows.Scan(&language.ID, &language.LanguageName, &language.ProficiencyLevel)
			if err != nil {
				log.Printf("Error scanning language row: %v", err)
				return nil, fmt.Errorf("error scanning language row: %v", err)
			}
			languages = append(languages, language)
		}
	}
	result["languages"] = languages

	return result, nil
}

type DoctorAdditionalInfoData struct {
	Hospitals      []models.DoctorHospital      `json:"hospitals"`
	Organizations  []models.DoctorOrganization  `json:"organizations"`
	Awards         []models.DoctorAward         `json:"awards"`
	Certifications []models.DoctorCertification `json:"certifications"`
	Languages      []models.DoctorLanguage      `json:"languages"`
}

func (s *SettingsService) UpdateDoctorAdditionalInfo(doctorID string, data DoctorAdditionalInfoData) error {
	docUUID, err := uuid.Parse(doctorID)
	if err != nil {
		return fmt.Errorf("invalid doctor ID")
	}

	tx, err := s.db.Begin(context.Background())
	if err != nil {
		return fmt.Errorf("transaction start failed: %v", err)
	}
	defer tx.Rollback(context.Background())

	tables := []string{"doctor_hospitals", "doctor_organizations", "doctor_awards", "doctor_certifications", "doctor_languages"}
	for _, table := range tables {
		_, err = tx.Exec(context.Background(), fmt.Sprintf("DELETE FROM %s WHERE doctor_id = $1", table), docUUID)
		if err != nil {
			return fmt.Errorf("failed to delete existing %s: %v", table, err)
		}
	}

	for _, hospital := range data.Hospitals {
		var startDate, endDate *time.Time
		layout := "2006-01-02"

		if hospital.StartDate != nil && *hospital.StartDate != "" {
			t, err := time.Parse(layout, *hospital.StartDate)
			if err != nil {
				return fmt.Errorf("invalid start_date for hospital: %v", err)
			}
			startDate = &t
		}

		if hospital.EndDate != nil && *hospital.EndDate != "" {
			t, err := time.Parse(layout, *hospital.EndDate)
			if err != nil {
				return fmt.Errorf("invalid end_date for hospital: %v", err)
			}
			endDate = &t
		}

		_, err := tx.Exec(context.Background(), `
			INSERT INTO doctor_hospitals (doctor_id, hospital_name, position, start_date, end_date, description)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, docUUID, hospital.HospitalName, hospital.Position, startDate, endDate, hospital.Description)
		if err != nil {
			return fmt.Errorf("failed to insert hospital: %v", err)
		}
	}

	for _, organization := range data.Organizations {
		var startDate, endDate *time.Time
		layout := "2006-01-02"

		if organization.StartDate != nil && *organization.StartDate != "" {
			t, err := time.Parse(layout, *organization.StartDate)
			if err != nil {
				return fmt.Errorf("invalid start_date for organization: %v", err)
			}
			startDate = &t
		}

		if organization.EndDate != nil && *organization.EndDate != "" {
			t, err := time.Parse(layout, *organization.EndDate)
			if err != nil {
				return fmt.Errorf("invalid end_date for organization: %v", err)
			}
			endDate = &t
		}

		_, err := tx.Exec(context.Background(), `
			INSERT INTO doctor_organizations (doctor_id, organization_name, role, start_date, end_date, description)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, docUUID, organization.OrganizationName, organization.Role, startDate, endDate, organization.Description)
		if err != nil {
			return fmt.Errorf("failed to insert organization: %v", err)
		}
	}

	for _, award := range data.Awards {
		var dateAwarded *time.Time
		layout := "2006-01-02"

		if award.DateAwarded != nil && *award.DateAwarded != "" {
			t, err := time.Parse(layout, *award.DateAwarded)
			if err != nil {
				return fmt.Errorf("invalid date_awarded for award: %v", err)
			}
			dateAwarded = &t
		}

		_, err := tx.Exec(context.Background(), `
			INSERT INTO doctor_awards (doctor_id, award_name, date_awarded, issuing_organization, description)
			VALUES ($1, $2, $3, $4, $5)
		`, docUUID, award.AwardName, dateAwarded, award.IssuingOrganization, award.Description)
		if err != nil {
			return fmt.Errorf("failed to insert award: %v", err)
		}
	}

	for _, certification := range data.Certifications {
		var issueDate, expirationDate *time.Time
		layout := "2006-01-02"

		if certification.IssueDate != nil && *certification.IssueDate != "" {
			t, err := time.Parse(layout, *certification.IssueDate)
			if err != nil {
				return fmt.Errorf("invalid issue_date for certification: %v", err)
			}
			issueDate = &t
		}

		if certification.ExpirationDate != nil && *certification.ExpirationDate != "" {
			t, err := time.Parse(layout, *certification.ExpirationDate)
			if err != nil {
				return fmt.Errorf("invalid expiration_date for certification: %v", err)
			}
			expirationDate = &t
		}

		_, err := tx.Exec(context.Background(), `
			INSERT INTO doctor_certifications (doctor_id, certification_name, issued_by, issue_date, expiration_date, description)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, docUUID, certification.CertificationName, certification.IssuedBy, issueDate, expirationDate, certification.Description)
		if err != nil {
			return fmt.Errorf("failed to insert certification: %v", err)
		}
	}

	for _, language := range data.Languages {
		_, err := tx.Exec(context.Background(), `
			INSERT INTO doctor_languages (doctor_id, language_name, proficiency_level)
			VALUES ($1, $2, $3)
		`, docUUID, language.LanguageName, language.ProficiencyLevel)
		if err != nil {
			return fmt.Errorf("failed to insert language: %v", err)
		}
	}

	err = tx.Commit(context.Background())
	if err != nil {
		return fmt.Errorf("transaction commit failed: %v", err)
	}

	return nil
}

func (s *SettingsService) getDoctorHospitals(doctorID uuid.UUID) ([]models.DoctorHospital, error) {
	var hospitals []models.DoctorHospital
	rows, err := s.db.Query(context.Background(),
		"SELECT id, hospital_name, position, start_date, end_date, description FROM doctor_hospitals WHERE doctor_id = $1",
		doctorID)
	if err != nil {
		return hospitals, err
	}
	defer rows.Close()

	for rows.Next() {
		var hospital models.DoctorHospital
		var startDate, endDate *time.Time
		err = rows.Scan(&hospital.ID, &hospital.HospitalName, &hospital.Position, &startDate, &endDate, &hospital.Description)
		if err != nil {
			continue
		}
		if startDate != nil {
			str := startDate.Format("2006-01-02")
			hospital.StartDate = &str
		}
		if endDate != nil {
			str := endDate.Format("2006-01-02")
			hospital.EndDate = &str
		}
		hospitals = append(hospitals, hospital)
	}
	return hospitals, nil
}

func (s *SettingsService) getDoctorOrganizations(doctorID uuid.UUID) ([]models.DoctorOrganization, error) {
	var organizations []models.DoctorOrganization
	rows, err := s.db.Query(context.Background(),
		"SELECT id, organization_name, role, start_date, end_date, description FROM doctor_organizations WHERE doctor_id = $1",
		doctorID)
	if err != nil {
		return organizations, err
	}
	defer rows.Close()

	for rows.Next() {
		var org models.DoctorOrganization
		var startDate, endDate *time.Time
		err = rows.Scan(&org.ID, &org.OrganizationName, &org.Role, &startDate, &endDate, &org.Description)
		if err != nil {
			continue
		}
		if startDate != nil {
			str := startDate.Format("2006-01-02")
			org.StartDate = &str
		}
		if endDate != nil {
			str := endDate.Format("2006-01-02")
			org.EndDate = &str
		}
		organizations = append(organizations, org)
	}
	return organizations, nil
}

func (s *SettingsService) getDoctorAwards(doctorID uuid.UUID) ([]models.DoctorAward, error) {
	var awards []models.DoctorAward
	rows, err := s.db.Query(context.Background(),
		"SELECT id, award_name, date_awarded, issuing_organization, description FROM doctor_awards WHERE doctor_id = $1",
		doctorID)
	if err != nil {
		return awards, err
	}
	defer rows.Close()

	for rows.Next() {
		var award models.DoctorAward
		var dateAwarded *time.Time
		err = rows.Scan(&award.ID, &award.AwardName, &dateAwarded, &award.IssuingOrganization, &award.Description)
		if err != nil {
			continue
		}
		if dateAwarded != nil {
			str := dateAwarded.Format("2006-01-02")
			award.DateAwarded = &str
		}
		awards = append(awards, award)
	}
	return awards, nil
}

func (s *SettingsService) getDoctorCertifications(doctorID uuid.UUID) ([]models.DoctorCertification, error) {
	var certifications []models.DoctorCertification
	rows, err := s.db.Query(context.Background(),
		"SELECT id, certification_name, issued_by, issue_date, expiration_date, description FROM doctor_certifications WHERE doctor_id = $1",
		doctorID)
	if err != nil {
		return certifications, err
	}
	defer rows.Close()

	for rows.Next() {
		var cert models.DoctorCertification
		var issueDate, expirationDate *time.Time
		err = rows.Scan(&cert.ID, &cert.CertificationName, &cert.IssuedBy, &issueDate, &expirationDate, &cert.Description)
		if err != nil {
			continue
		}
		if issueDate != nil {
			str := issueDate.Format("2006-01-02")
			cert.IssueDate = &str
		}
		if expirationDate != nil {
			str := expirationDate.Format("2006-01-02")
			cert.ExpirationDate = &str
		}
		certifications = append(certifications, cert)
	}
	return certifications, nil
}

func (s *SettingsService) getDoctorLanguages(doctorID uuid.UUID) ([]models.DoctorLanguage, error) {
	var languages []models.DoctorLanguage
	rows, err := s.db.Query(context.Background(),
		"SELECT id, language_name, proficiency_level FROM doctor_languages WHERE doctor_id = $1",
		doctorID)
	if err != nil {
		return languages, err
	}
	defer rows.Close()

	for rows.Next() {
		var lang models.DoctorLanguage
		err = rows.Scan(&lang.ID, &lang.LanguageName, &lang.ProficiencyLevel)
		if err != nil {
			continue
		}
		languages = append(languages, lang)
	}
	return languages, nil
}
