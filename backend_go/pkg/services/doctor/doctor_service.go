package doctor

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"strings"
	"time"

	"healthcare_backend/pkg/auth"
	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/models"
	"healthcare_backend/pkg/utils"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v4/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type DoctorService struct {
	db  *pgxpool.Pool
	cfg *config.Config
}

func NewDoctorService(db *pgxpool.Pool, cfg *config.Config) *DoctorService {
	return &DoctorService{
		db:  db,
		cfg: cfg,
	}
}

func (s *DoctorService) GetDBPool() *pgxpool.Pool {
	return s.db
}

func (s *DoctorService) EmailExists(email string) (bool, error) {
	var existingEmail string
	err := s.db.QueryRow(context.Background(), "SELECT email FROM doctor_info WHERE email = $1", email).Scan(&existingEmail)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (s *DoctorService) UsernameExists(username string) (bool, error) {
	var existingUsername string
	err := s.db.QueryRow(context.Background(), "SELECT username FROM doctor_info WHERE username = $1", username).Scan(&existingUsername)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (s *DoctorService) RegisterDoctor(doctor models.Doctor) (*models.Doctor, error) {
	exists, err := s.EmailExists(doctor.Email)
	if err != nil {
		return nil, fmt.Errorf("error checking email: %v", err)
	}
	if exists {
		return nil, fmt.Errorf("email already exists")
	}

	exists, err = s.UsernameExists(doctor.Username)
	if err != nil {
		return nil, fmt.Errorf("error checking username: %v", err)
	}
	if exists {
		return nil, fmt.Errorf("username already exists")
	}

	if doctor.DoctorID == uuid.Nil {
		doctor.DoctorID = uuid.New()
	}

	saltBytes := make([]byte, 16)
	_, err = rand.Read(saltBytes)
	if err != nil {
		return nil, fmt.Errorf("error generating salt: %v", err)
	}
	salt := hex.EncodeToString(saltBytes)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(doctor.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("error hashing password: %v", err)
	}

	birthDate, err := time.Parse("2006-01-02", doctor.BirthDate)
	if err != nil {
		return nil, fmt.Errorf("invalid birth date format: %v", err)
	}
	doctor.Age = time.Now().Year() - birthDate.Year()

	doctor.Location = fmt.Sprintf("%s, %s, %s, %s, %s",
		doctor.StreetAddress, doctor.ZipCode, doctor.CityName, doctor.StateName, doctor.CountryName)

	query := `
		INSERT INTO doctor_info (
			doctor_id, username, first_name, last_name, age, sex, hashed_password, salt,
			specialty, experience, rating_score, rating_count, created_at, updated_at,
			medical_license, bio, email, phone_number, street_address, city_name,
			state_name, zip_code, country_name, birth_date, location, profile_photo_url,
			latitude, longitude
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
			$19, $20, $21, $22, $23, $24, $25, $26, $27, $28
		)`

	_, err = s.db.Exec(context.Background(), query,
		doctor.DoctorID, doctor.Username, doctor.FirstName, doctor.LastName, doctor.Age,
		doctor.Sex, string(hashedPassword), salt, doctor.Specialty, doctor.Experience,
		nil, 0, time.Now(), time.Now(), doctor.MedicalLicense, doctor.Bio, doctor.Email,
		doctor.PhoneNumber, doctor.StreetAddress, doctor.CityName, doctor.StateName,
		doctor.ZipCode, doctor.CountryName, birthDate, doctor.Location, doctor.ProfilePictureURL,
		doctor.Latitude, doctor.Longitude)

	if err != nil {
		return nil, fmt.Errorf("error inserting doctor: %v", err)
	}

	err = s.generateDoctorAvailability(doctor.DoctorID)
	if err != nil {
		log.Printf("Warning: Failed to generate default availability: %v", err)
	}

	return &doctor, nil
}

func (s *DoctorService) generateDoctorAvailability(doctorID uuid.UUID) error {
	weekdays := []string{"Monday", "Tuesday", "Wednesday", "Thursday", "Friday"}
	startTime := "09:00:00"
	endTime := "17:00:00"
	slotDuration := 30

	now := time.Now()
	endDate := now.AddDate(0, 3, 0)

	for _, weekday := range weekdays {
		for d := now; d.Before(endDate); d = d.AddDate(0, 0, 1) {
			if d.Weekday().String() == weekday {
				start, _ := time.Parse("2006-01-02 15:04:05", d.Format("2006-01-02")+" "+startTime)
				end, _ := time.Parse("2006-01-02 15:04:05", d.Format("2006-01-02")+" "+endTime)

				for slot := start; slot.Add(time.Duration(slotDuration)*time.Minute).Before(end) || slot.Add(time.Duration(slotDuration)*time.Minute).Equal(end); slot = slot.Add(time.Duration(slotDuration) * time.Minute) {
					_, err := s.db.Exec(context.Background(),
						"INSERT INTO availabilities (doctor_id, weekday, availability_start, availability_end, slot_duration) VALUES ($1, $2, $3, $4, $5)",
						doctorID, weekday, slot, slot.Add(time.Duration(slotDuration)*time.Minute), slotDuration)
					if err != nil {
						log.Printf("Error inserting availability slot: %v", err)
					}
				}
			}
		}
	}
	return nil
}

func (s *DoctorService) LoginDoctor(email, password string) (*models.Doctor, string, string, error) {
	var doctor models.Doctor
	var hashedPassword, salt string

	query := `
		SELECT doctor_id, username, first_name, last_name, email, hashed_password, salt, profile_photo_url
		FROM doctor_info WHERE email = $1`

	err := s.db.QueryRow(context.Background(), query, email).Scan(
		&doctor.DoctorID, &doctor.Username, &doctor.FirstName, &doctor.LastName,
		&doctor.Email, &hashedPassword, &salt, &doctor.ProfilePictureURL)

	if err != nil {
		return nil, "", "", fmt.Errorf("invalid credentials")
	}

	err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	if err != nil {
		return nil, "", "", fmt.Errorf("invalid credentials")
	}

	doctor.ProfilePictureURL, err = utils.GeneratePresignedObjectURL(doctor.ProfilePictureURL)
	if err != nil {
		log.Printf("Warning: failed to generate presigned URL for profile picture: %v", err)
	}

	userIdString := doctor.DoctorID.String()
	accessToken, refreshToken, err := auth.GenerateTokenPair(userIdString, "doctor")
	if err != nil {
		return nil, "", "", fmt.Errorf("failed to generate token: %v", err)
	}

	return &doctor, accessToken, refreshToken, nil
}

func (s *DoctorService) GetDoctorByID(doctorID string) (*models.Doctor, error) {
	doctorUUID, err := uuid.Parse(doctorID)
	if err != nil {
		return nil, fmt.Errorf("invalid doctor ID format")
	}

	var doctor models.Doctor

	query := `
		SELECT email, phone_number, first_name, last_name, TO_CHAR(birth_date, 'YYYY-MM-DD'), bio, sex, location, specialty, experience, rating_score, rating_count, profile_photo_url, city_name, country_name, COALESCE(latitude, 0), COALESCE(longitude, 0)
		FROM doctor_info WHERE doctor_id = $1`

	err = s.db.QueryRow(context.Background(), query, doctorUUID).Scan(
		&doctor.Email, &doctor.PhoneNumber, &doctor.FirstName, &doctor.LastName,
		&doctor.BirthDate, &doctor.Bio, &doctor.Sex, &doctor.Location, &doctor.Specialty,
		&doctor.Experience, &doctor.RatingScore, &doctor.RatingCount, &doctor.ProfilePictureURL,
		&doctor.CityName, &doctor.CountryName, &doctor.Latitude, &doctor.Longitude)

	if err != nil {
		return nil, fmt.Errorf("doctor not found: %v", err)
	}

	doctor.DoctorID = doctorUUID

	doctor.Hospitals, _ = s.getDoctorHospitals(doctorUUID)
	doctor.Organizations, _ = s.getDoctorOrganizations(doctorUUID)
	doctor.Awards, _ = s.getDoctorAwards(doctorUUID)
	doctor.Certifications, _ = s.getDoctorCertifications(doctorUUID)
	doctor.Languages, _ = s.getDoctorLanguages(doctorUUID)

	var doctorIDStr string
	doctorIDStr = doctor.DoctorID.String()
	doctor.ProfilePictureURL, _ = utils.GetUserImage(doctorIDStr, "doctor", context.Background(), s.db)

	return &doctor, nil
}

func (s *DoctorService) SearchDoctors(query, specialty, location string, userLatitude, userLongitude float64) ([]models.Doctor, error) {
	var doctors []models.Doctor

	sqlSelect := `
		SELECT doctor_id, username, first_name, last_name, specialty, experience, rating_score, rating_count, location, profile_photo_url, COALESCE(latitude, 0) as latitude, COALESCE(longitude, 0) as longitude,
		CASE 
			WHEN $1::float8 IS NOT NULL AND $2::float8 IS NOT NULL
		AND 
			latitude IS NOT NULL 
		AND 
			longitude IS NOT NULL THEN (6371 * acos(cos(radians($1::float8)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2::float8)) + sin(radians($1::float8)) * sin(radians(latitude))))
		ELSE NULL
		END AS distance
		FROM doctor_info`

	queryParams := []interface{}{userLatitude, userLongitude}
	paramIndex := 3
	var conditions []string

	if specialty == "undefined" {
		specialty = ""
	}
	if query != "" {
		conditions = append(conditions, fmt.Sprintf("(first_name ILIKE $%d OR last_name ILIKE $%d)", paramIndex, paramIndex))
		queryParams = append(queryParams, "%"+query+"%")
		paramIndex++
	}
	if specialty != "" {
		conditions = append(conditions, fmt.Sprintf("specialty ILIKE $%d", paramIndex))
		queryParams = append(queryParams, "%"+specialty+"%")
		paramIndex++
	}
	if location != "" {
		conditions = append(conditions, fmt.Sprintf("location ILIKE $%d", paramIndex))
		queryParams = append(queryParams, "%"+location+"%")
		paramIndex++
	}

	if len(conditions) > 0 {
		sqlSelect += " WHERE " + strings.Join(conditions, " AND ")
	}
	if userLatitude != 0 && userLongitude != 0 {
		sqlSelect += " ORDER BY distance"
	}

	rows, err := s.db.Query(context.Background(), sqlSelect, queryParams...)
	if err != nil {
		return nil, fmt.Errorf("error executing search query: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var doctor models.Doctor
		var distance *float64
		err := rows.Scan(
			&doctor.DoctorID, &doctor.Username, &doctor.FirstName, &doctor.LastName,
			&doctor.Specialty, &doctor.Experience, &doctor.RatingScore, &doctor.RatingCount,
			&doctor.Location, &doctor.ProfilePictureURL, &doctor.Latitude, &doctor.Longitude,
			&distance)
		if err != nil {
			log.Printf("Error scanning doctor row: %v", err)
			continue
		}
		if distance != nil {
			doctor.DoctorDistance = *distance
		}
		var doctorIDStr string
		doctorIDStr = doctor.DoctorID.String()
		doctor.ProfilePictureURL, _ = utils.GetUserImage(doctorIDStr, "doctor", context.Background(), s.db)
		doctors = append(doctors, doctor)
	}

	return doctors, nil
}

func (s *DoctorService) getDoctorHospitals(doctorID uuid.UUID) ([]models.DoctorHospital, error) {
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

func (s *DoctorService) getDoctorOrganizations(doctorID uuid.UUID) ([]models.DoctorOrganization, error) {
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

func (s *DoctorService) getDoctorAwards(doctorID uuid.UUID) ([]models.DoctorAward, error) {
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

func (s *DoctorService) getDoctorCertifications(doctorID uuid.UUID) ([]models.DoctorCertification, error) {
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

func (s *DoctorService) getDoctorLanguages(doctorID uuid.UUID) ([]models.DoctorLanguage, error) {
	var languages []models.DoctorLanguage
	rows, err := s.db.Query(context.Background(),
		"SELECT language_name, proficiency_level FROM doctor_languages WHERE doctor_id = $1",
		doctorID)
	if err != nil {
		return languages, err
	}
	defer rows.Close()

	for rows.Next() {
		var lang models.DoctorLanguage
		err = rows.Scan(&lang.LanguageName, &lang.ProficiencyLevel)
		if err != nil {
			continue
		}
		languages = append(languages, lang)
	}
	return languages, nil
}

func (s *DoctorService) MarkAccountAsVerified(email string) error {
	query := `UPDATE doctor_info SET is_verified = true WHERE email = $1`
	result, err := s.db.Exec(context.Background(), query, email)
	if err != nil {
		return fmt.Errorf("failed to update verification status: %v", err)
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("doctor not found with email: %s", email)
	}

	return nil
}

// GetDoctorPatients retrieves all patients who have had appointments with this doctor
func (s *DoctorService) GetDoctorPatients(doctorID string) ([]map[string]interface{}, error) {
	// parse doctorID to uuid
	doctorIDUUID, err := uuid.Parse(doctorID)
	if err != nil {
		return nil, fmt.Errorf("failed to parse doctor ID: %v", err)
	}
	query := `
		SELECT DISTINCT 
			p.patient_id,
			p.first_name,
			p.last_name,
			p.email,
			p.phone_number,
			p.age,
			p.sex,
			p.profile_photo_url
		FROM patient_info p
		INNER JOIN appointments a ON p.patient_id = a.patient_id::uuid
		WHERE a.doctor_id = $1
		ORDER BY p.first_name, p.last_name
	`

	rows, err := s.db.Query(context.Background(), query, doctorIDUUID)
	if err != nil {
		log.Printf("Error querying doctor patients: %v", err)
		return nil, fmt.Errorf("failed to query patients: %v", err)
	}
	defer rows.Close()

	var patients []map[string]interface{}
	for rows.Next() {
		var patientID, firstName, lastName, email, phoneNumber, sex string
		var profilePhotoURL *string
		var age *int

		err := rows.Scan(
			&patientID, &firstName, &lastName, &email, &phoneNumber,
			&age, &sex, &profilePhotoURL,
		)
		if err != nil {
			log.Printf("Error scanning patient row: %v", err)
			continue
		}

		patient := map[string]interface{}{
			"patientId":       patientID,
			"patient_id":      patientID, // Both formats for compatibility
			"firstName":       firstName,
			"first_name":      firstName, // Both formats for compatibility
			"lastName":        lastName,
			"last_name":       lastName, // Both formats for compatibility
			"email":           email,
			"phoneNumber":     phoneNumber,
			"phone_number":    phoneNumber, // Both formats for compatibility
			"sex":             sex,
			"profilePhotoUrl": profilePhotoURL,
		}

		if age != nil {
			patient["age"] = *age
		}

		patients = append(patients, patient)
	}

	if err := rows.Err(); err != nil {
		log.Printf("Error iterating patient rows: %v", err)
		return nil, fmt.Errorf("error reading patients: %v", err)
	}

	return patients, nil
}
