package receptionist

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"log"
	"strings"
	"time"

	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

func stringPointer(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func intPointer(i int) *int {
	if i == 0 {
		return nil
	}
	return &i
}

type ReceptionistPatientService struct {
	db  *pgxpool.Pool
	cfg *config.Config
}

func NewReceptionistPatientService(db *pgxpool.Pool, cfg *config.Config) *ReceptionistPatientService {
	return &ReceptionistPatientService{
		db:  db,
		cfg: cfg,
	}
}

func (s *ReceptionistPatientService) SearchPatients(receptionistID string, req models.PatientSearchRequest) ([]models.PatientSearchResult, int, error) {
	ctx := context.Background()

	if req.DoctorID != "" {
		var assignedDoctorID sql.NullString
		err := s.db.QueryRow(ctx, "SELECT assigned_doctor_id FROM receptionists WHERE receptionist_id = $1", receptionistID).Scan(&assignedDoctorID)

		if err != nil {
			log.Printf("SearchPatients: failed to verify receptionist assignment: %v", err)
			return nil, 0, fmt.Errorf("failed to verify receptionist assignment: %v", err)
		}

		if !assignedDoctorID.Valid {
			log.Printf("SearchPatients: receptionist %s has no assigned doctor", receptionistID)
			return nil, 0, fmt.Errorf("receptionist has no assigned doctor")
		}

		if assignedDoctorID.String != req.DoctorID {
			log.Printf("SearchPatients: receptionist %s is assigned to doctor %s, but requested doctor %s", receptionistID, assignedDoctorID.String, req.DoctorID)
			return nil, 0, fmt.Errorf("receptionist is not assigned to this doctor")
		}

	} else {
		var assignedDoctorID sql.NullString
		err := s.db.QueryRow(ctx, "SELECT assigned_doctor_id FROM receptionists WHERE receptionist_id = $1", receptionistID).Scan(&assignedDoctorID)
		if err != nil {
			log.Printf("SearchPatients: failed to get receptionist assignment: %v", err)
			return nil, 0, fmt.Errorf("failed to get receptionist assignment: %v", err)
		}

		if !assignedDoctorID.Valid {
			log.Printf("SearchPatients: receptionist %s has no assigned doctor", receptionistID)
			return nil, 0, fmt.Errorf("receptionist has no assigned doctor")
		}

		req.DoctorID = assignedDoctorID.String
	}

	baseQuery := `
		SELECT DISTINCT
			p.patient_id,
			p.first_name,
			p.last_name,
			p.email,
			p.phone_number,
			p.age,
			p.sex,
			p.profile_photo_url,
			MAX(a.appointment_start) as last_appointment_date,
			COUNT(a.appointment_id) as total_appointments,
			COUNT(CASE WHEN NOT a.canceled AND a.appointment_end < NOW() THEN 1 END) as completed_appointments,
			COUNT(CASE WHEN a.canceled THEN 1 END) as canceled_appointments,
			CASE WHEN COUNT(CASE WHEN NOT a.canceled AND a.appointment_start > NOW() THEN 1 END) > 0 THEN true ELSE false END as has_active_appointments
		FROM patient_info p
		INNER JOIN appointments a ON p.patient_id = a.patient_id
		WHERE 1=1`

	countQuery := `
		SELECT COUNT(DISTINCT p.patient_id)
		FROM patient_info p
		INNER JOIN appointments a ON p.patient_id = a.patient_id
		WHERE 1=1`

	args := []interface{}{}
	argCount := 1

	baseQuery += fmt.Sprintf(" AND a.doctor_id = $%d", argCount)
	countQuery += fmt.Sprintf(" AND a.doctor_id = $%d", argCount)
	args = append(args, req.DoctorID)
	argCount++

	if req.SearchQuery != "" {
		searchPattern := "%" + strings.ToLower(req.SearchQuery) + "%"
		baseQuery += fmt.Sprintf(" AND (LOWER(p.first_name || ' ' || p.last_name) LIKE $%d OR LOWER(p.email) LIKE $%d)", argCount, argCount)
		countQuery += fmt.Sprintf(" AND (LOWER(p.first_name || ' ' || p.last_name) LIKE $%d OR LOWER(p.email) LIKE $%d)", argCount, argCount)
		args = append(args, searchPattern)
		argCount++
	}

	if req.DateFrom != "" {
		baseQuery += fmt.Sprintf(" AND a.appointment_start >= $%d", argCount)
		countQuery += fmt.Sprintf(" AND a.appointment_start >= $%d", argCount)
		args = append(args, req.DateFrom)
		argCount++
	}

	if req.DateTo != "" {
		baseQuery += fmt.Sprintf(" AND a.appointment_start <= $%d", argCount)
		countQuery += fmt.Sprintf(" AND a.appointment_start <= $%d", argCount)
		args = append(args, req.DateTo)
		argCount++
	}

	baseQuery += `
		GROUP BY p.patient_id, p.first_name, p.last_name, p.email, p.phone_number, p.age, p.sex, p.profile_photo_url
		ORDER BY last_appointment_date DESC NULLS LAST`

	countArgsCount := argCount

	if req.Limit > 0 {
		baseQuery += fmt.Sprintf(" LIMIT $%d", argCount)
		args = append(args, req.Limit)
		argCount++
	}

	if req.Offset > 0 {
		baseQuery += fmt.Sprintf(" OFFSET $%d", argCount)
		args = append(args, req.Offset)
		argCount++
	}

	var totalCount int
	countArgs := args[:countArgsCount-1]
	err := s.db.QueryRow(ctx, countQuery, countArgs...).Scan(&totalCount)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get total count: %v", err)
	}

	rows, err := s.db.Query(ctx, baseQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to search patients: %v", err)
	}
	defer rows.Close()

	var patients []models.PatientSearchResult
	for rows.Next() {
		var patient models.PatientSearchResult
		var lastAppointmentDate sql.NullTime
		var phoneNumber, sex, profilePictureURL sql.NullString
		var age sql.NullInt32

		err := rows.Scan(
			&patient.PatientID,
			&patient.FirstName,
			&patient.LastName,
			&patient.Email,
			&phoneNumber,
			&age,
			&sex,
			&profilePictureURL,
			&lastAppointmentDate,
			&patient.TotalAppointments,
			&patient.CompletedAppointments,
			&patient.CanceledAppointments,
			&patient.HasActiveAppointments,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan patient: %v", err)
		}

		if phoneNumber.Valid {
			patient.PhoneNumber = &phoneNumber.String
		}
		if age.Valid {
			ageInt := int(age.Int32)
			patient.Age = &ageInt
		}
		if sex.Valid {
			patient.Sex = &sex.String
		}
		if profilePictureURL.Valid {
			patient.ProfilePictureURL = &profilePictureURL.String
		}
		if lastAppointmentDate.Valid {
			patient.LastAppointmentDate = &lastAppointmentDate.Time
		}

		patients = append(patients, patient)
	}

	return patients, totalCount, nil
}

func (s *ReceptionistPatientService) GetPatientDetailedInfo(receptionistID, patientID, doctorID string) (*models.PatientDetailedInfo, []models.PatientAppointmentDetail, error) {
	ctx := context.Background()

	var assignedDoctorID sql.NullString
	err := s.db.QueryRow(ctx, "SELECT assigned_doctor_id FROM receptionists WHERE receptionist_id = $1", receptionistID).Scan(&assignedDoctorID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to verify receptionist assignment: %v", err)
	}

	if !assignedDoctorID.Valid {
		return nil, nil, fmt.Errorf("receptionist has no assigned doctor")
	}

	if doctorID == "" {
		doctorID = assignedDoctorID.String
	} else if assignedDoctorID.String != doctorID {
		return nil, nil, fmt.Errorf("receptionist is not assigned to this doctor")
	}

	patientQuery := `
		SELECT 
			patient_id, username, first_name, last_name, email, phone_number, 
			age, sex, birth_date, street_address, city_name, state_name, 
			zip_code, country_name, bio, location, profile_photo_url,
			created_at, updated_at
		FROM patient_info 
		WHERE patient_id = $1`

	var patient models.PatientDetailedInfo
	var phoneNumber, sex, birthDate, streetAddress, cityName, stateName sql.NullString
	var zipCode, countryName, bio, location, profilePictureURL sql.NullString
	var age sql.NullInt32

	err = s.db.QueryRow(ctx, patientQuery, patientID).Scan(
		&patient.PatientID,
		&patient.Username,
		&patient.FirstName,
		&patient.LastName,
		&patient.Email,
		&phoneNumber,
		&age,
		&sex,
		&birthDate,
		&streetAddress,
		&cityName,
		&stateName,
		&zipCode,
		&countryName,
		&bio,
		&location,
		&profilePictureURL,
		&patient.CreatedAt,
		&patient.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			log.Printf("Patient not found: %v", err)
			return nil, nil, fmt.Errorf("patient not found")
		}
		log.Printf("Failed to get patient info: %v", err)
		return nil, nil, fmt.Errorf("failed to get patient info: %v", err)
	}

	if phoneNumber.Valid {
		patient.PhoneNumber = &phoneNumber.String
	}
	if age.Valid {
		ageInt := int(age.Int32)
		patient.Age = &ageInt
	}
	if sex.Valid {
		patient.Sex = &sex.String
	}
	if birthDate.Valid {
		patient.BirthDate = &birthDate.String
	}
	if streetAddress.Valid {
		patient.StreetAddress = &streetAddress.String
	}
	if cityName.Valid {
		patient.CityName = &cityName.String
	}
	if stateName.Valid {
		patient.StateName = &stateName.String
	}
	if zipCode.Valid {
		patient.ZipCode = &zipCode.String
	}
	if countryName.Valid {
		patient.CountryName = &countryName.String
	}
	if bio.Valid {
		patient.Bio = &bio.String
	}
	if location.Valid {
		patient.Location = &location.String
	}
	if profilePictureURL.Valid {
		patient.ProfilePictureURL = &profilePictureURL.String
	}

	appointmentsQuery := `
		SELECT 
			a.appointment_id,
			a.appointment_start,
			a.appointment_end,
			COALESCE(a.appointment_type, 'regular') as appointment_type,
			CASE 
				WHEN a.canceled THEN 'canceled'
				WHEN a.appointment_end < NOW() THEN 'completed'
				ELSE 'scheduled'
			END as status,
			d.first_name as doctor_first_name,
			d.last_name as doctor_last_name,
			d.specialty as doctor_specialty,
			a.canceled,
			a.canceled_by,
			a.cancellation_reason,
			a.cancellation_timestamp,
			a.created_at,
			CASE WHEN mr.report_id IS NOT NULL THEN true ELSE false END as has_medical_report
		FROM appointments a
		INNER JOIN doctor_info d ON a.doctor_id = d.doctor_id
		LEFT JOIN medical_reports mr ON a.appointment_id = mr.appointment_id
		WHERE a.patient_id = $1 AND a.doctor_id = $2
		ORDER BY a.appointment_start DESC`

	rows, err := s.db.Query(ctx, appointmentsQuery, patientID, doctorID)
	if err != nil {
		log.Printf("Failed to get patient appointments: %v", err)
		return nil, nil, fmt.Errorf("failed to get patient appointments: %v", err)
	}
	defer rows.Close()

	var appointments []models.PatientAppointmentDetail
	for rows.Next() {
		var apt models.PatientAppointmentDetail
		err := rows.Scan(
			&apt.AppointmentID,
			&apt.AppointmentStart,
			&apt.AppointmentEnd,
			&apt.AppointmentType,
			&apt.Status,
			&apt.DoctorFirstName,
			&apt.DoctorLastName,
			&apt.DoctorSpecialty,
			&apt.Canceled,
			&apt.CanceledBy,
			&apt.CancellationReason,
			&apt.CancellationTimestamp,
			&apt.CreatedAt,
			&apt.HasMedicalReport,
		)
		if err != nil {
			log.Printf("Failed to scan appointment: %v", err)
			return nil, nil, fmt.Errorf("failed to scan appointment: %v", err)
		}

		if apt.HasMedicalReport {
			medicalReport, err := s.getMedicalReportForAppointment(ctx, apt.AppointmentID)
			if err != nil {
				log.Printf("Failed to get medical report for appointment %s: %v", apt.AppointmentID, err)
			} else {
				apt.MedicalReport = medicalReport
			}

			diagnosisHistory, err := s.getDiagnosisHistoryForAppointment(ctx, apt.AppointmentID)
			if err != nil {
				log.Printf("Failed to get diagnosis history for appointment %s: %v", apt.AppointmentID, err)
			} else {
				apt.DiagnosisHistory = diagnosisHistory
			}

			medicines, err := s.getPrescribedMedicinesForAppointment(ctx, apt.AppointmentID)
			if err != nil {
				log.Printf("Failed to get prescribed medicines for appointment %s: %v", apt.AppointmentID, err)
			} else {
				apt.PrescribedMedicines = medicines
			}
		}

		appointments = append(appointments, apt)
	}

	return &patient, appointments, nil
}

func (s *ReceptionistPatientService) CreatePatient(receptionistID string, req models.CreatePatientRequest) (*models.PatientDetailedInfo, error) {
	ctx := context.Background()

	var emailExists bool
	err := s.db.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM patient_info WHERE email = $1)", req.Email).Scan(&emailExists)
	if err != nil {
		return nil, fmt.Errorf("failed to check email existence: %v", err)
	}
	if emailExists {
		return nil, fmt.Errorf("email already exists")
	}

	saltBytes := make([]byte, 16)
	_, err = rand.Read(saltBytes)
	if err != nil {
		return nil, fmt.Errorf("failed to generate salt: %v", err)
	}
	salt := hex.EncodeToString(saltBytes)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %v", err)
	}

	patientID := uuid.New()

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback(ctx)

	insertQuery := `
		INSERT INTO patient_info 
		(patient_id, username, first_name, last_name, email, hashed_password, salt, 
		 phone_number, age, sex, birth_date, street_address, city_name, state_name, 
		 zip_code, country_name, bio, location, profile_photo_url, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`

	now := time.Now()
	_, err = tx.Exec(ctx, insertQuery,
		patientID, req.Username, req.FirstName, req.LastName, req.Email,
		string(hashedPassword), salt, req.PhoneNumber, req.Age, req.Sex,
		req.BirthDate, req.StreetAddress, req.CityName, req.StateName,
		req.ZipCode, req.CountryName, req.Bio, req.Location, req.ProfilePictureURL,
		now, now)

	if err != nil {
		return nil, fmt.Errorf("failed to insert patient: %v", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	patient := &models.PatientDetailedInfo{
		PatientID:         patientID,
		Username:          req.Username,
		FirstName:         req.FirstName,
		LastName:          req.LastName,
		Email:             req.Email,
		PhoneNumber:       stringPointer(req.PhoneNumber),
		Age:               intPointer(req.Age),
		Sex:               stringPointer(req.Sex),
		BirthDate:         stringPointer(req.BirthDate),
		StreetAddress:     stringPointer(req.StreetAddress),
		CityName:          stringPointer(req.CityName),
		StateName:         stringPointer(req.StateName),
		ZipCode:           stringPointer(req.ZipCode),
		CountryName:       stringPointer(req.CountryName),
		Bio:               stringPointer(req.Bio),
		Location:          stringPointer(req.Location),
		ProfilePictureURL: stringPointer(req.ProfilePictureURL),
		CreatedAt:         now,
		UpdatedAt:         now,
	}

	return patient, nil
}

func (s *ReceptionistPatientService) CreateAppointment(receptionistID string, req models.CreateAppointmentRequest) (*models.PatientAppointmentDetail, error) {
	ctx := context.Background()

	var assignedDoctorID sql.NullString
	err := s.db.QueryRow(ctx, "SELECT assigned_doctor_id FROM receptionists WHERE receptionist_id = $1", receptionistID).Scan(&assignedDoctorID)
	if err != nil {
		log.Printf("CreateAppointment: failed to verify receptionist assignment: %v", err)
		return nil, fmt.Errorf("failed to verify receptionist assignment: %v", err)
	}

	if !assignedDoctorID.Valid || assignedDoctorID.String != req.DoctorID {
		log.Printf("CreateAppointment: receptionist is not assigned to this doctor")
		return nil, fmt.Errorf("receptionist is not assigned to this doctor")
	}

	appointmentStart, err := time.Parse("2006-01-02T15:04:05Z", req.AppointmentStart)
	if err != nil {
		log.Printf("CreateAppointment: invalid appointment start time: %v", err)
		return nil, fmt.Errorf("invalid appointment start time: %v", err)
	}

	appointmentEnd, err := time.Parse("2006-01-02T15:04:05Z", req.AppointmentEnd)
	if err != nil {
		log.Printf("CreateAppointment: invalid appointment end time: %v", err)
		return nil, fmt.Errorf("invalid appointment end time: %v", err)
	}

	var conflictCount int
	err = s.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM appointments 
		WHERE doctor_id = $1 
		AND NOT canceled 
		AND (
			(appointment_start <= $2 AND appointment_end > $2) OR
			(appointment_start < $3 AND appointment_end >= $3) OR
			(appointment_start >= $2 AND appointment_end <= $3)
		)`,
		req.DoctorID, appointmentStart, appointmentEnd).Scan(&conflictCount)

	if err != nil {
		log.Printf("CreateAppointment: failed to check for conflicts: %v", err)
		return nil, fmt.Errorf("failed to check for conflicts: %v", err)
	}

	if conflictCount > 0 {
		log.Printf("CreateAppointment: appointment time conflicts with existing appointment")
		return nil, fmt.Errorf("appointment time conflicts with existing appointment")
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		log.Printf("CreateAppointment: failed to begin transaction: %v", err)
		return nil, fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback(ctx)

	appointmentID := uuid.New()

	insertQuery := `
		INSERT INTO appointments 
		(appointment_id, patient_id, doctor_id, appointment_start, appointment_end, 
		 appointment_type, title, notes, created_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`

	now := time.Now()
	_, err = tx.Exec(ctx, insertQuery,
		appointmentID, req.PatientID, req.DoctorID, appointmentStart, appointmentEnd,
		req.AppointmentType, req.Title, req.Notes, receptionistID, now, now)

	if err != nil {
		log.Printf("CreateAppointment: failed to insert appointment: %v", err)
		return nil, fmt.Errorf("failed to insert appointment: %v", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		log.Printf("CreateAppointment: failed to commit transaction: %v", err)
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	var doctorFirstName, doctorLastName, doctorSpecialty string
	err = s.db.QueryRow(ctx, "SELECT first_name, last_name, specialty FROM doctor_info WHERE doctor_id = $1", req.DoctorID).Scan(&doctorFirstName, &doctorLastName, &doctorSpecialty)
	if err != nil {
		log.Printf("CreateAppointment: failed to get doctor info: %v", err)
		return nil, fmt.Errorf("failed to get doctor info: %v", err)
	}

	appointment := &models.PatientAppointmentDetail{
		AppointmentID:    appointmentID,
		AppointmentStart: appointmentStart,
		AppointmentEnd:   appointmentEnd,
		AppointmentType:  req.AppointmentType,
		Status:           "scheduled",
		DoctorFirstName:  doctorFirstName,
		DoctorLastName:   doctorLastName,
		DoctorSpecialty:  doctorSpecialty,
		Canceled:         false,
		CreatedAt:        now,
		HasMedicalReport: false,
	}

	return appointment, nil
}

func (s *ReceptionistPatientService) getMedicalReportForAppointment(ctx context.Context, appointmentID uuid.UUID) (*models.MedicalReport, error) {
	query := `
		SELECT 
			report_id, patient_id, doctor_id, appointment_id, patient_first_name,
			patient_last_name, doctor_first_name, doctor_last_name, report_content,
			diagnosis_made, diagnosis_name, diagnosis_details, referral_needed,
			referral_specialty, referral_doctor_name, referral_message, created_at
		FROM medical_reports 
		WHERE appointment_id = $1`

	var report models.MedicalReport
	err := s.db.QueryRow(ctx, query, appointmentID).Scan(
		&report.ReportID,
		&report.PatientID,
		&report.DoctorID,
		&report.AppointmentID,
		&report.PatientFirstName,
		&report.PatientLastName,
		&report.DoctorFirstName,
		&report.DoctorLastName,
		&report.ReportContent,
		&report.DiagnosisMade,
		&report.DiagnosisName,
		&report.DiagnosisDetails,
		&report.ReferralNeeded,
		&report.ReferralSpecialty,
		&report.ReferralDoctorName,
		&report.ReferralMessage,
		&report.CreatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &report, nil
}

func (s *ReceptionistPatientService) getDiagnosisHistoryForAppointment(ctx context.Context, appointmentID uuid.UUID) ([]models.DiagnosisHistory, error) {
	query := `
		SELECT 
			id, appointment_id, diagnosis_name, diagnosis_details, diagnosis_date,
			doctor_name, severity, status, notes, created_at
		FROM diagnosis_history 
		WHERE appointment_id = $1 
		ORDER BY diagnosis_date DESC`

	rows, err := s.db.Query(ctx, query, appointmentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var history []models.DiagnosisHistory
	for rows.Next() {
		var diag models.DiagnosisHistory
		err := rows.Scan(
			&diag.ID,
			&diag.AppointmentID,
			&diag.DiagnosisName,
			&diag.DiagnosisDetails,
			&diag.DiagnosisDate,
			&diag.DoctorName,
			&diag.Severity,
			&diag.Status,
			&diag.Notes,
			&diag.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		history = append(history, diag)
	}

	return history, nil
}

func (s *ReceptionistPatientService) getPrescribedMedicinesForAppointment(ctx context.Context, appointmentID uuid.UUID) ([]models.PrescribedMedicine, error) {
	query := `
		SELECT 
			id, appointment_id, medicine_name, dosage, frequency, duration,
			instructions, prescribed_date, doctor_name, is_active, created_at
		FROM prescribed_medicines 
		WHERE appointment_id = $1 
		ORDER BY prescribed_date DESC`

	rows, err := s.db.Query(ctx, query, appointmentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var medicines []models.PrescribedMedicine
	for rows.Next() {
		var med models.PrescribedMedicine
		err := rows.Scan(
			&med.ID,
			&med.AppointmentID,
			&med.MedicineName,
			&med.Dosage,
			&med.Frequency,
			&med.Duration,
			&med.Instructions,
			&med.PrescribedDate,
			&med.DoctorName,
			&med.IsActive,
			&med.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		medicines = append(medicines, med)
	}

	return medicines, nil
}

func (s *ReceptionistPatientService) GetAppointmentStats(receptionistID, doctorID string) (*models.AppointmentStats, error) {
	ctx := context.Background()

	if doctorID != "" {
		var assignedDoctorID sql.NullString
		err := s.db.QueryRow(ctx, "SELECT assigned_doctor_id FROM receptionists WHERE receptionist_id = $1", receptionistID).Scan(&assignedDoctorID)
		if err != nil {
			return nil, fmt.Errorf("failed to verify receptionist assignment: %v", err)
		}

		if !assignedDoctorID.Valid || assignedDoctorID.String != doctorID {
			return nil, fmt.Errorf("receptionist is not assigned to this doctor")
		}
	}

	var hasNoShowColumn bool
	err := s.db.QueryRow(
		ctx,
		`SELECT EXISTS(
			SELECT 1
			FROM information_schema.columns
			WHERE table_name = 'appointments' AND column_name = 'no_show'
		)`,
	).Scan(&hasNoShowColumn)
	if err != nil {
		log.Printf("GetAppointmentStats: failed to detect appointments.no_show column: %v", err)
		hasNoShowColumn = false
	}

	query := `
		SELECT 
			COUNT(*) as total_appointments,
			COUNT(CASE WHEN DATE(appointment_start) = CURRENT_DATE THEN 1 END) as today_appointments,
			COUNT(CASE WHEN appointment_start > NOW() AND NOT canceled THEN 1 END) as upcoming_appointments,
			COUNT(CASE WHEN appointment_end < NOW() AND NOT canceled THEN 1 END) as completed_appointments,
			COUNT(CASE WHEN canceled THEN 1 END) as canceled_appointments,`
	if hasNoShowColumn {
		query += `
			COUNT(CASE WHEN appointment_end < NOW() AND NOT canceled AND no_show THEN 1 END) as no_show_appointments
		FROM appointments 
		WHERE doctor_id = $1`
	} else {
		query += `
			0 as no_show_appointments
		FROM appointments 
		WHERE doctor_id = $1`
	}

	var stats models.AppointmentStats
	err = s.db.QueryRow(ctx, query, doctorID).Scan(
		&stats.TotalAppointments,
		&stats.TodayAppointments,
		&stats.UpcomingAppointments,
		&stats.CompletedAppointments,
		&stats.CanceledAppointments,
		&stats.NoShowAppointments,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get appointment stats: %v", err)
	}

	return &stats, nil
}

func (s *ReceptionistPatientService) GetPatientStats(receptionistID, doctorID string) (*models.PatientStats, error) {
	ctx := context.Background()

	if doctorID != "" {
		var assignedDoctorID sql.NullString
		err := s.db.QueryRow(ctx, "SELECT assigned_doctor_id FROM receptionists WHERE receptionist_id = $1", receptionistID).Scan(&assignedDoctorID)
		if err != nil {
			return nil, fmt.Errorf("failed to verify receptionist assignment: %v", err)
		}

		if !assignedDoctorID.Valid || assignedDoctorID.String != doctorID {
			return nil, fmt.Errorf("receptionist is not assigned to this doctor")
		}
	}

	query := `
		WITH doctor_patients AS (
			SELECT DISTINCT p.patient_id, p.created_at
			FROM patient_info p
			JOIN appointments a ON a.patient_id = p.patient_id
			WHERE a.doctor_id = $1 AND COALESCE(a.is_doctor_patient, false) = false
		),
		appt AS (
			SELECT
				patient_id,
				MAX(CASE WHEN NOT canceled THEN appointment_start ELSE NULL END) AS last_appointment_start
			FROM appointments
			WHERE doctor_id = $1 AND COALESCE(is_doctor_patient, false) = false
			GROUP BY patient_id
		)
		SELECT
			COUNT(*) as total_patients,
			COUNT(CASE WHEN DATE(dp.created_at) = CURRENT_DATE THEN 1 END) as new_patients_today,
			COUNT(CASE WHEN dp.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as new_patients_week,
			COUNT(CASE WHEN dp.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_patients_month,
			COUNT(CASE WHEN ap.last_appointment_start > NOW() - INTERVAL '30 days' THEN 1 END) as active_patients,
			COUNT(CASE WHEN ap.last_appointment_start <= NOW() - INTERVAL '30 days' OR ap.last_appointment_start IS NULL THEN 1 END) as inactive_patients
		FROM doctor_patients dp
		LEFT JOIN appt ap ON ap.patient_id = dp.patient_id`

	var stats models.PatientStats
	err := s.db.QueryRow(ctx, query, doctorID).Scan(
		&stats.TotalPatients,
		&stats.NewPatientsToday,
		&stats.NewPatientsWeek,
		&stats.NewPatientsMonth,
		&stats.ActivePatients,
		&stats.InactivePatients,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get patient stats: %v", err)
	}

	return &stats, nil
}

func (s *ReceptionistPatientService) CheckAppointmentConflict(receptionistID, doctorID, startTime, endTime string) ([]map[string]interface{}, error) {
	ctx := context.Background()

	var assignedDoctorID sql.NullString
	err := s.db.QueryRow(ctx, "SELECT assigned_doctor_id FROM receptionists WHERE receptionist_id = $1", receptionistID).Scan(&assignedDoctorID)
	if err != nil {
		return nil, fmt.Errorf("failed to verify receptionist assignment: %v", err)
	}

	if !assignedDoctorID.Valid || assignedDoctorID.String != doctorID {
		return nil, fmt.Errorf("receptionist is not assigned to this doctor")
	}

	appointmentStart, err := time.Parse("2006-01-02T15:04:05Z", startTime)
	if err != nil {
		appointmentStart, err = time.Parse(time.RFC3339, startTime)
		if err != nil {
			return nil, fmt.Errorf("invalid appointment start time: %v", err)
		}
	}

	appointmentEnd, err := time.Parse("2006-01-02T15:04:05Z", endTime)
	if err != nil {
		appointmentEnd, err = time.Parse(time.RFC3339, endTime)
		if err != nil {
			return nil, fmt.Errorf("invalid appointment end time: %v", err)
		}
	}

	query := `
		SELECT 
			a.appointment_id,
			a.appointment_start,
			a.appointment_end,
			a.appointment_type,
			p.first_name as patient_first_name,
			p.last_name as patient_last_name,
			p.email as patient_email
		FROM appointments a
		INNER JOIN patient_info p ON a.patient_id = p.patient_id
		WHERE a.doctor_id = $1 
		AND NOT a.canceled 
		AND (
			(a.appointment_start <= $2 AND a.appointment_end > $2) OR
			(a.appointment_start < $3 AND a.appointment_end >= $3) OR
			(a.appointment_start >= $2 AND a.appointment_end <= $3)
		)
		ORDER BY a.appointment_start`

	rows, err := s.db.Query(ctx, query, doctorID, appointmentStart, appointmentEnd)
	if err != nil {
		return nil, fmt.Errorf("failed to check for conflicts: %v", err)
	}
	defer rows.Close()

	var conflicts []map[string]interface{}
	for rows.Next() {
		var appointmentID uuid.UUID
		var appointmentStart, appointmentEnd time.Time
		var appointmentType, patientFirstName, patientLastName, patientEmail string

		err := rows.Scan(&appointmentID, &appointmentStart, &appointmentEnd, &appointmentType,
			&patientFirstName, &patientLastName, &patientEmail)
		if err != nil {
			continue
		}

		conflict := map[string]interface{}{
			"appointmentId":    appointmentID.String(),
			"appointmentStart": appointmentStart,
			"appointmentEnd":   appointmentEnd,
			"appointmentType":  appointmentType,
			"patientFirstName": patientFirstName,
			"patientLastName":  patientLastName,
			"patientEmail":     patientEmail,
		}
		conflicts = append(conflicts, conflict)
	}

	return conflicts, nil
}
