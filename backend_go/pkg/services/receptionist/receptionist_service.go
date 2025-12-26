package receptionist

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"log"
	"time"

	"healthcare_backend/pkg/auth"
	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/models"
	"healthcare_backend/pkg/utils"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type ReceptionistService struct {
	db  *pgxpool.Pool
	cfg *config.Config
}

func NewReceptionistService(db *pgxpool.Pool, cfg *config.Config) *ReceptionistService {
	return &ReceptionistService{
		db:  db,
		cfg: cfg,
	}
}

func (s *ReceptionistService) RegisterReceptionist(req models.ReceptionistRegisterRequest) (*models.Receptionist, error) {
	var assignedDoctorID *uuid.UUID
	if req.AssignedDoctorID != "" {
		doctorID, err := uuid.Parse(req.AssignedDoctorID)
		if err != nil {
			return nil, fmt.Errorf("invalid assigned doctor ID")
		}

		var doctorExists bool
		err = s.db.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM doctor_info WHERE doctor_id = $1)", doctorID).Scan(&doctorExists)
		if err != nil || !doctorExists {
			return nil, fmt.Errorf("assigned doctor not found")
		}
		assignedDoctorID = &doctorID
	}

	var emailExists bool
	err := s.db.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM receptionists WHERE email = $1)", req.Email).Scan(&emailExists)
	if err != nil {
		return nil, fmt.Errorf("database error checking email: %v", err)
	}
	if emailExists {
		return nil, fmt.Errorf("email already registered")
	}

	saltBytes := make([]byte, 16)
	_, err = rand.Read(saltBytes)
	if err != nil {
		return nil, fmt.Errorf("error generating salt: %v", err)
	}
	salt := hex.EncodeToString(saltBytes)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("error hashing password: %v", err)
	}

	var birthDate *time.Time
	if req.BirthDate != "" {
		parsedDate, err := time.Parse("2006-01-02", req.BirthDate)
		if err != nil {
			return nil, fmt.Errorf("invalid birth date format. Use YYYY-MM-DD")
		}
		birthDate = &parsedDate
	}

	tx, err := s.db.Begin(context.Background())
	if err != nil {
		return nil, fmt.Errorf("database transaction error: %v", err)
	}
	defer tx.Rollback(context.Background())

	receptionistID := uuid.New()

	query := `INSERT INTO receptionists 
		(receptionist_id, username, first_name, last_name, sex, hashed_password, salt, email, phone_number, street_address, city_name, state_name, zip_code, country_name, birth_date, bio, profile_photo_url, assigned_doctor_id, is_active, email_verified, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`

	_, err = tx.Exec(context.Background(), query,
		receptionistID, req.Username, req.FirstName, req.LastName, req.Sex, hashedPassword, salt,
		req.Email, req.PhoneNumber, req.StreetAddress, req.CityName, req.StateName,
		req.ZipCode, req.CountryName, birthDate, req.Bio, req.ProfilePictureURL, assignedDoctorID,
		true, false, time.Now(), time.Now())

	if err != nil {
		return nil, fmt.Errorf("error creating receptionist account: %v", err)
	}

	if err = tx.Commit(context.Background()); err != nil {
		return nil, fmt.Errorf("error completing registration: %v", err)
	}

	receptionist := &models.Receptionist{
		ReceptionistID:    receptionistID,
		Username:          req.Username,
		FirstName:         req.FirstName,
		LastName:          req.LastName,
		Email:             req.Email,
		ProfilePictureURL: req.ProfilePictureURL,
		AssignedDoctorID:  assignedDoctorID,
		IsActive:          true,
		EmailVerified:     false,
	}

	return receptionist, nil
}

func (s *ReceptionistService) LoginReceptionist(email, password string) (*models.Receptionist, string, string, error) {
	var receptionist models.Receptionist
	var profilePhotoURL sql.NullString
	var phoneNumber sql.NullString

	query := `SELECT receptionist_id, username, first_name, last_name, sex, hashed_password, email, phone_number, assigned_doctor_id, is_active, email_verified, profile_photo_url
		FROM receptionists WHERE email = $1`

	err := s.db.QueryRow(context.Background(), query, email).Scan(
		&receptionist.ReceptionistID, &receptionist.Username, &receptionist.FirstName,
		&receptionist.LastName, &receptionist.Sex, &receptionist.Password, &receptionist.Email,
		&phoneNumber, &receptionist.AssignedDoctorID, &receptionist.IsActive,
		&receptionist.EmailVerified, &profilePhotoURL)

	if err != nil {
		if err == pgx.ErrNoRows {
			log.Printf("Login failed for email: %s - user not found", email)
			return nil, "", "", fmt.Errorf("invalid email or password")
		}
		log.Printf("Login failed for email: %s - database error: %v", email, err)
		return nil, "", "", fmt.Errorf("database error: %v", err)
	}

	err = bcrypt.CompareHashAndPassword([]byte(receptionist.Password), []byte(password))
	if err != nil {
		log.Printf("Login failed for email: %s - invalid password", email)
		return nil, "", "", fmt.Errorf("invalid email or password")
	}

	if !receptionist.IsActive {
		log.Printf("Login failed for email: %s - account is deactivated", email)
		return nil, "", "", fmt.Errorf("account is deactivated")
	}

	accessToken, refreshToken, err := auth.GenerateTokenPair(receptionist.ReceptionistID.String(), "receptionist")
	if err != nil {
		log.Printf("Login failed for email: %s - error generating authentication token: %v", email, err)
		return nil, "", "", fmt.Errorf("error generating authentication token: %v", err)
	}

	if phoneNumber.Valid {
		receptionist.PhoneNumber = phoneNumber.String
	}
	if profilePhotoURL.Valid {
		receptionist.ProfilePictureURL = profilePhotoURL.String
	}

	presignedURL, err := utils.GeneratePresignedObjectURL(receptionist.ProfilePictureURL)
	if err != nil {
		log.Printf("Warning: failed to generate presigned URL for profile picture: %v", err)
	} else {
		receptionist.ProfilePictureURL = presignedURL
	}

	receptionist.Password = ""

	return &receptionist, accessToken, refreshToken, nil
}

func (s *ReceptionistService) GetReceptionistProfile(receptionistID string) (*models.Receptionist, error) {
	id, err := uuid.Parse(receptionistID)
	if err != nil {
		return nil, fmt.Errorf("invalid receptionist ID")
	}

	var receptionist models.Receptionist
	var streetAddress sql.NullString
	var zipCode sql.NullString
	var bio sql.NullString
	var profilePhotoURL sql.NullString
	query := `SELECT receptionist_id, username, first_name, last_name, sex, email, phone_number,
		street_address, city_name, state_name, zip_code, country_name, birth_date, bio,
		profile_photo_url, assigned_doctor_id, is_active, email_verified, created_at, updated_at
		FROM receptionists WHERE receptionist_id = $1`

	err = s.db.QueryRow(context.Background(), query, id).Scan(
		&receptionist.ReceptionistID, &receptionist.Username, &receptionist.FirstName,
		&receptionist.LastName, &receptionist.Sex, &receptionist.Email,
		&receptionist.PhoneNumber, &streetAddress, &receptionist.CityName, &receptionist.StateName,
		&zipCode, &receptionist.CountryName, &receptionist.BirthDate,
		&bio, &profilePhotoURL, &receptionist.AssignedDoctorID,
		&receptionist.IsActive, &receptionist.EmailVerified, &receptionist.CreatedAt,
		&receptionist.UpdatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("receptionist not found")
		}
		return nil, fmt.Errorf("database error: %v", err)
	}

	if streetAddress.Valid {
		receptionist.StreetAddress = streetAddress.String
	}
	if zipCode.Valid {
		receptionist.ZipCode = zipCode.String
	}
	if bio.Valid {
		receptionist.Bio = bio.String
	}
	if profilePhotoURL.Valid {
		receptionist.ProfilePictureURL = profilePhotoURL.String
		presignedURL, presignErr := utils.GeneratePresignedObjectURL(receptionist.ProfilePictureURL)
		if presignErr != nil {
			log.Printf("Warning: failed to generate presigned URL for profile picture: %v", presignErr)
		} else {
			receptionist.ProfilePictureURL = presignedURL
		}
	}

	experiences, err := s.ListReceptionistExperiences(receptionistID)
	if err != nil {
		log.Printf("Warning: failed to load receptionist experiences: %v", err)
	} else {
		receptionist.Experiences = experiences
	}

	years, err := s.getReceptionistExperienceYears(id)
	if err != nil {
		log.Printf("Warning: failed to compute receptionist experience years: %v", err)
	} else {
		receptionist.ExperienceYears = years
	}

	return &receptionist, nil
}

func (s *ReceptionistService) ListReceptionistExperiences(receptionistID string) ([]models.ReceptionistExperience, error) {
	id, err := uuid.Parse(receptionistID)
	if err != nil {
		return nil, fmt.Errorf("invalid receptionist ID")
	}

	query := `
	SELECT
		experience_id,
		receptionist_id,
		organization_name,
		position_title,
		location,
		start_date,
		end_date,
		description,
		created_at,
		updated_at
	FROM receptionist_experiences
	WHERE receptionist_id = $1
	ORDER BY start_date DESC
	`

	rows, err := s.db.Query(context.Background(), query, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var experiences []models.ReceptionistExperience
	for rows.Next() {
		var exp models.ReceptionistExperience
		var location sql.NullString
		var endDate sql.NullTime
		var description sql.NullString

		if err := rows.Scan(
			&exp.ExperienceID,
			&exp.ReceptionistID,
			&exp.OrganizationName,
			&exp.PositionTitle,
			&location,
			&exp.StartDate,
			&endDate,
			&description,
			&exp.CreatedAt,
			&exp.UpdatedAt,
		); err != nil {
			return nil, err
		}
		if location.Valid {
			loc := location.String
			exp.Location = &loc
		}
		if endDate.Valid {
			ed := endDate.Time
			exp.EndDate = &ed
		}
		if description.Valid {
			desc := description.String
			exp.Description = &desc
		}
		experiences = append(experiences, exp)
	}

	return experiences, nil
}

func (s *ReceptionistService) CreateReceptionistExperience(receptionistID string, req models.ReceptionistExperienceCreateRequest) (*models.ReceptionistExperience, error) {
	receptionistUUID, err := uuid.Parse(receptionistID)
	if err != nil {
		return nil, fmt.Errorf("invalid receptionist ID")
	}

	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		return nil, fmt.Errorf("invalid startDate format. Use YYYY-MM-DD")
	}

	var endDate *time.Time
	if req.EndDate != nil && *req.EndDate != "" {
		parsedEndDate, err := time.Parse("2006-01-02", *req.EndDate)
		if err != nil {
			return nil, fmt.Errorf("invalid endDate format. Use YYYY-MM-DD")
		}
		endDate = &parsedEndDate
	}

	query := `
	INSERT INTO receptionist_experiences
		(receptionist_id, organization_name, position_title, location, start_date, end_date, description)
	VALUES ($1, $2, $3, $4, $5, $6, $7)
	RETURNING experience_id, receptionist_id, organization_name, position_title, location, start_date, end_date, description, created_at, updated_at
	`

	var exp models.ReceptionistExperience
	var location sql.NullString
	var endDateNull sql.NullTime
	var description sql.NullString

	err = s.db.QueryRow(context.Background(), query,
		receptionistUUID,
		req.OrganizationName,
		req.PositionTitle,
		req.Location,
		startDate,
		endDate,
		req.Description,
	).Scan(
		&exp.ExperienceID,
		&exp.ReceptionistID,
		&exp.OrganizationName,
		&exp.PositionTitle,
		&location,
		&exp.StartDate,
		&endDateNull,
		&description,
		&exp.CreatedAt,
		&exp.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	if location.Valid {
		loc := location.String
		exp.Location = &loc
	}
	if endDateNull.Valid {
		ed := endDateNull.Time
		exp.EndDate = &ed
	}
	if description.Valid {
		desc := description.String
		exp.Description = &desc
	}

	return &exp, nil
}

func (s *ReceptionistService) DeleteReceptionistExperience(receptionistID, experienceID string) error {
	receptionistUUID, err := uuid.Parse(receptionistID)
	if err != nil {
		return fmt.Errorf("invalid receptionist ID")
	}
	experienceUUID, err := uuid.Parse(experienceID)
	if err != nil {
		return fmt.Errorf("invalid experience ID")
	}

	query := `DELETE FROM receptionist_experiences WHERE experience_id = $1 AND receptionist_id = $2`
	result, err := s.db.Exec(context.Background(), query, experienceUUID, receptionistUUID)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (s *ReceptionistService) getReceptionistExperienceYears(receptionistID uuid.UUID) (float64, error) {
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

func (s *ReceptionistService) UpdateReceptionistProfile(receptionistID string, req models.ReceptionistProfileUpdateRequest) error {
	id, err := uuid.Parse(receptionistID)
	if err != nil {
		return fmt.Errorf("invalid receptionist ID")
	}

	query := `UPDATE receptionists SET 
		first_name = $1, last_name = $2, phone_number = $3, street_address = $4,
		city_name = $5, state_name = $6, zip_code = $7, country_name = $8, bio = $9, updated_at = $10
		WHERE receptionist_id = $11`

	_, err = s.db.Exec(context.Background(), query,
		req.FirstName, req.LastName, req.PhoneNumber, req.StreetAddress,
		req.CityName, req.StateName, req.ZipCode, req.CountryName,
		req.Bio, time.Now(), id)

	if err != nil {
		return fmt.Errorf("error updating profile: %v", err)
	}

	return nil
}
