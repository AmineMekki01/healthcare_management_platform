package patient

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"time"

	"healthcare_backend/pkg/auth"
	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/models"
	"healthcare_backend/pkg/utils"
	"healthcare_backend/pkg/utils/validators"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v4/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type PatientService struct {
	db  *pgxpool.Pool
	cfg *config.Config
}

func NewPatientService(db *pgxpool.Pool, cfg *config.Config) *PatientService {
	return &PatientService{
		db:  db,
		cfg: cfg,
	}
}

func (s *PatientService) GetDBPool() *pgxpool.Pool {
	return s.db
}

func (s *PatientService) EmailExists(email string) (bool, error) {
	var existingEmail string
	err := s.db.QueryRow(context.Background(), "SELECT email FROM patient_info WHERE email = $1", email).Scan(&existingEmail)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (s *PatientService) UsernameExists(username string) (bool, error) {
	var existingUsername string
	err := s.db.QueryRow(context.Background(), "SELECT username FROM patient_info WHERE username = $1", username).Scan(&existingUsername)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (s *PatientService) RegisterPatient(patient models.Patient) error {
	exists, err := s.EmailExists(patient.Email)
	if err != nil {
		return fmt.Errorf("error checking email: %v", err)
	}
	if exists {
		return fmt.Errorf("email already exists")
	}

	exists, err = s.UsernameExists(patient.Username)
	if err != nil {
		return fmt.Errorf("error checking username: %v", err)
	}
	if exists {
		return fmt.Errorf("username already exists")
	}

	saltBytes := make([]byte, 16)
	_, err = rand.Read(saltBytes)
	if err != nil {
		return fmt.Errorf("error generating salt: %v", err)
	}
	salt := hex.EncodeToString(saltBytes)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(patient.Password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("error hashing password: %v", err)
	}

	birthDate, err := time.Parse("2006-01-02", patient.BirthDate)
	if err != nil {
		return fmt.Errorf("invalid birth date format: %v", err)
	}
	patient.Age = time.Now().Year() - birthDate.Year()

	patient.Location = fmt.Sprintf("%s, %s, %s, %s, %s",
		patient.StreetAddress, patient.ZipCode, patient.CityName, patient.StateName, patient.CountryName)

	query := `
		INSERT INTO patient_info (
			patient_id, username, first_name, last_name, age, sex, hashed_password, salt,
			created_at, updated_at, bio, email, phone_number, street_address, city_name,
			state_name, zip_code, country_name, birth_date, location, profile_photo_url
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
		)`

	_, err = s.db.Exec(context.Background(), query,
		patient.PatientID, patient.Username, patient.FirstName, patient.LastName, patient.Age,
		patient.Sex, string(hashedPassword), salt, time.Now(), time.Now(), patient.Bio,
		patient.Email, patient.PhoneNumber, patient.StreetAddress, patient.CityName,
		patient.StateName, patient.ZipCode, patient.CountryName, patient.BirthDate,
		patient.Location, patient.ProfilePictureURL)

	if err != nil {
		return fmt.Errorf("error inserting patient: %v", err)
	}

	return nil
}

func (s *PatientService) LoginPatient(email, password string) (*models.Patient, string, string, error) {
	var isVerified bool
	err := s.db.QueryRow(context.Background(), "SELECT is_verified FROM patient_info WHERE email = $1", email).Scan(&isVerified)
	if err != nil {
		return nil, "", "", fmt.Errorf("account not found")
	}

	if !isVerified {
		return nil, "", "", fmt.Errorf("account not verified")
	}

	var patient models.Patient
	var hashedPassword string
	err = s.db.QueryRow(context.Background(),
		"SELECT patient_id, email, hashed_password, first_name, last_name, profile_photo_url FROM patient_info WHERE email = $1",
		email).Scan(&patient.PatientID, &patient.Email, &hashedPassword, &patient.FirstName, &patient.LastName, &patient.ProfilePictureURL)

	if err != nil {
		return nil, "", "", fmt.Errorf("invalid credentials")
	}

	err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	if err != nil {
		return nil, "", "", fmt.Errorf("invalid credentials")
	}

	if patient.ProfilePictureURL != "" {
		presignedURL, err := utils.GeneratePresignedObjectURL(patient.ProfilePictureURL)
		if err != nil {
			log.Printf("Warning: failed to generate presigned URL for profile picture: %v", err)
		} else {
			patient.ProfilePictureURL = presignedURL
		}
	}

	userIdString := patient.PatientID.String()
	accessToken, refreshToken, err := auth.GenerateTokenPair(userIdString, "patient")
	if err != nil {
		return nil, "", "", fmt.Errorf("failed to generate token: %v", err)
	}

	return &patient, accessToken, refreshToken, nil
}

func (s *PatientService) GetPatientProfile(patientID string) (*models.Patient, error) {
	var patient models.Patient

	query := `
		SELECT email, phone_number, first_name, last_name, TO_CHAR(birth_date, 'YYYY-MM-DD'), bio, sex, location, profile_photo_url, street_address, city_name, zip_code, country_name, age
		FROM patient_info WHERE patient_id = $1`

	err := s.db.QueryRow(context.Background(), query, patientID).Scan(
		&patient.Email, &patient.PhoneNumber, &patient.FirstName, &patient.LastName,
		&patient.BirthDate, &patient.Bio, &patient.Sex, &patient.Location,
		&patient.ProfilePictureURL, &patient.StreetAddress, &patient.CityName,
		&patient.ZipCode, &patient.CountryName, &patient.Age)

	if err != nil {
		if err.Error() == "no rows in result set" {
			return nil, fmt.Errorf("patient not found")
		}
		return nil, fmt.Errorf("database error: %v", err)
	}

	patient.ProfilePictureURL, err = utils.GeneratePresignedObjectURL(patient.ProfilePictureURL)

	return &patient, nil
}

func (s *PatientService) UpdatePatientProfile(patientID string, updateData map[string]interface{}) (string, error) {
	query := `
		UPDATE patient_info 
		SET first_name = $1, last_name = $2, email = $3, phone_number = $4, 
			street_address = $5, city_name = $6, zip_code = $7, country_name = $8, 
			bio = $9, updated_at = NOW()
		WHERE patient_id = $10
	`

	_, err := s.db.Exec(context.Background(), query,
		updateData["FirstName"],
		updateData["LastName"],
		updateData["Email"],
		updateData["PhoneNumber"],
		updateData["StreetAddress"],
		updateData["CityName"],
		updateData["ZipCode"],
		updateData["CountryName"],
		updateData["PatientBio"],
		patientID,
	)

	if err != nil {
		return "", fmt.Errorf("error updating patient profile: %v", err)
	}

	if photoURL, exists := updateData["ProfilePictureURL"]; exists && photoURL != "" {
		presignedURL, err := utils.GeneratePresignedObjectURL(photoURL.(string))
		if err != nil {
			log.Printf("Warning: failed to generate presigned URL: %v", err)
			return "", nil
		}
		return presignedURL, nil
	}

	return "", nil
}

func (s *PatientService) SearchPatients(name, location string, limit, offset int) ([]models.Patient, error) {
	var patients []models.Patient
	var query string
	var args []interface{}
	argIndex := 1

	query = `
		SELECT patient_id, first_name, last_name, email, phone_number,
			   city_name, location, profile_photo_url, age
		FROM patient_info 
		WHERE is_verified = true`

	if name != "" {
		query += ` AND (LOWER(first_name) LIKE LOWER($` + fmt.Sprintf("%d", argIndex) + `) 
				   OR LOWER(last_name) LIKE LOWER($` + fmt.Sprintf("%d", argIndex) + `))`
		args = append(args, "%"+name+"%")
		argIndex++
	}

	if location != "" {
		query += ` AND (LOWER(city_name) LIKE LOWER($` + fmt.Sprintf("%d", argIndex) + `) 
				   OR LOWER(location) LIKE LOWER($` + fmt.Sprintf("%d", argIndex) + `))`
		args = append(args, "%"+location+"%")
		argIndex++
	}

	query += ` ORDER BY first_name, last_name LIMIT $` + fmt.Sprintf("%d", argIndex) +
		` OFFSET $` + fmt.Sprintf("%d", argIndex+1)
	args = append(args, limit, offset)

	rows, err := s.db.Query(context.Background(), query, args...)
	if err != nil {
		return nil, fmt.Errorf("error searching patients: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var patient models.Patient
		err := rows.Scan(
			&patient.PatientID, &patient.FirstName, &patient.LastName,
			&patient.Email, &patient.PhoneNumber, &patient.CityName,
			&patient.Location, &patient.ProfilePictureURL, &patient.Age)
		if err != nil {
			log.Printf("Error scanning patient: %v", err)
			continue
		}
		patients = append(patients, patient)
	}

	return patients, nil
}

func (s *PatientService) VerifyPatient(token string) error {
	email, err := validators.VerifyToken(token, s.db)
	if err != nil {
		return fmt.Errorf("invalid or expired verification token")
	}

	query := "UPDATE patient_info SET is_verified = true WHERE email = $1"
	result, err := s.db.Exec(context.Background(), query, email)
	if err != nil {
		return fmt.Errorf("error verifying patient: %v", err)
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("patient not found")
	}

	return nil
}

func (s *PatientService) GetPatientAppointments(patientID string, limit, offset int) ([]models.Reservation, error) {
	var reservations []models.Reservation
	query := `
		SELECT 
			a.appointment_id, a.appointment_start, a.appointment_end,
			a.doctor_id, a.patient_id,
			d.first_name as doctor_first_name, d.last_name as doctor_last_name,
			d.specialty, p.first_name as patient_first_name,
			p.last_name as patient_last_name, p.age,
			a.is_doctor_patient, a.canceled, a.canceled_by,
			a.cancellation_reason, a.cancellation_timestamp,
			COALESCE(mr.report_id IS NOT NULL, false) AS report_exists
		FROM appointments a
		JOIN doctor_info d ON a.doctor_id = d.doctor_id
		JOIN patient_info p ON a.patient_id = p.patient_id
		LEFT JOIN medical_reports mr ON a.appointment_id = mr.appointment_id
		WHERE a.patient_id = $1
		ORDER BY a.appointment_start DESC
		LIMIT $2 OFFSET $3`

	rows, err := s.db.Query(context.Background(), query, patientID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("error fetching patient appointments: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var r models.Reservation
		err := rows.Scan(
			&r.AppointmentID, &r.AppointmentStart, &r.AppointmentEnd,
			&r.DoctorID, &r.PatientID, &r.DoctorFirstName, &r.DoctorLastName,
			&r.Specialty, &r.PatientFirstName, &r.PatientLastName, &r.Age,
			&r.IsDoctorPatient, &r.Canceled, &r.CanceledBy,
			&r.CancellationReason, &r.CancellationTimestamp, &r.ReportExists)
		if err != nil {
			log.Printf("Error scanning reservation: %v", err)
			continue
		}
		reservations = append(reservations, r)
	}

	return reservations, nil
}

func (s *PatientService) GetPatientMedicalHistory(patientID string) ([]models.MedicalHistory, error) {
	var medicalHistories []models.MedicalHistory

	rows, err := s.db.Query(context.Background(),
		"SELECT diag_history_id, diagnosis_name, created_at FROM medical_diagnosis_history WHERE patient_id = $1 ORDER BY created_at DESC",
		patientID)

	if err != nil {
		if err.Error() == "no rows in result set" {
			return []models.MedicalHistory{}, nil
		}
		return nil, fmt.Errorf("database error: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var medHist models.MedicalHistory
		err := rows.Scan(&medHist.DiagnosisHistoryID, &medHist.DiagnosisName, &medHist.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan medical history: %v", err)
		}
		medicalHistories = append(medicalHistories, medHist)
	}

	return medicalHistories, nil
}

func (s *PatientService) GetPatientMedications(patientID string) ([]models.Medications, error) {
	var medications []models.Medications

	rows, err := s.db.Query(context.Background(),
		"SELECT medication_name, created_at FROM prescribed_medications WHERE patient_id = $1 ORDER BY created_at DESC",
		patientID)

	if err != nil {
		if err.Error() == "no rows in result set" {
			return []models.Medications{}, nil
		}
		return nil, fmt.Errorf("database error: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var medication models.Medications
		err := rows.Scan(&medication.MedicationName, &medication.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan medication: %v", err)
		}
		medications = append(medications, medication)
	}

	return medications, nil
}

func (s *PatientService) GetDiagnosisDetails(diagnosisID string) (*models.MedicalHistory, error) {
	var medHist models.MedicalHistory

	query := `
		SELECT diag_history_id, diagnosis_name, diagnosis_details, diagnosis_doctor_name,
			   diagnosis_doctor_id, created_at, updated_at, diagnosis_patient_id
		FROM medical_diagnosis_history WHERE diag_history_id = $1`

	err := s.db.QueryRow(context.Background(), query, diagnosisID).Scan(
		&medHist.DiagnosisHistoryID, &medHist.DiagnosisName, &medHist.DiagnosisDetails,
		&medHist.DiagnosisDoctorName, &medHist.DiagnosisDoctorID, &medHist.CreatedAt,
		&medHist.UpdatedAt, &medHist.PatientID)

	if err != nil {
		if err.Error() == "no rows in result set" {
			return nil, fmt.Errorf("diagnosis not found")
		}
		return nil, fmt.Errorf("database error: %v", err)
	}

	return &medHist, nil
}

func (s *PatientService) GetDoctorPatients(doctorID uuid.UUID) ([]map[string]interface{}, error) {
	query := `SELECT DISTINCT p.patient_id, p.username, p.first_name, p.last_name, 
		p.email, p.phone_number, p.profile_photo_url, p.created_at, p.updated_at
		FROM patient_info p
		INNER JOIN appointments a ON p.patient_id = a.patient_id
		WHERE a.doctor_id = $1
		ORDER BY p.last_name, p.first_name`

	rows, err := s.db.Query(context.Background(), query, doctorID)
	if err != nil {
		return nil, fmt.Errorf("error fetching doctor patients: %v", err)
	}
	defer rows.Close()

	var patients []map[string]interface{}
	for rows.Next() {
		var patientID uuid.UUID
		var username, firstName, lastName, email string
		var phoneNumber, profilePictureURL *string
		var createdAt, updatedAt time.Time

		err := rows.Scan(&patientID, &username, &firstName, &lastName,
			&email, &phoneNumber, &profilePictureURL, &createdAt, &updatedAt)

		if err != nil {
			log.Printf("Error scanning patient: %v", err)
			continue
		}

		patient := map[string]interface{}{
			"patient_id":          patientID,
			"username":            username,
			"first_name":          firstName,
			"last_name":           lastName,
			"email":               email,
			"phone_number":        "",
			"profile_picture_url": "",
			"created_at":          createdAt,
			"updated_at":          updatedAt,
		}

		if phoneNumber != nil {
			patient["phone_number"] = *phoneNumber
		}
		if profilePictureURL != nil {
			patient["profile_picture_url"] = *profilePictureURL
		}

		patients = append(patients, patient)
	}

	return patients, nil
}
