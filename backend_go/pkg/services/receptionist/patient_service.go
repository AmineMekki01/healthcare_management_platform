package receptionist

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"strings"
	"time"

	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
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

func (s *PatientService) SearchPatientsForReceptionist(receptionistID, searchTerm string, page, limit int) (map[string]interface{}, error) {
	id, err := uuid.Parse(receptionistID)
	if err != nil {
		log.Printf("Error parsing receptionist ID: %v", err)
		return nil, fmt.Errorf("invalid receptionist ID")
	}

	var assignedDoctorID uuid.UUID
	err = s.db.QueryRow(context.Background(), "SELECT assigned_doctor_id FROM receptionists WHERE receptionist_id = $1", id).Scan(&assignedDoctorID)
	if err != nil {
		log.Printf("Error retrieving assigned doctor ID: %v", err)
		return nil, fmt.Errorf("receptionist not found or no assigned doctor: %v", err)
	}

	offset := (page - 1) * limit

	query := `
		SELECT DISTINCT 
			p.patient_id, 
			p.first_name, 
			p.last_name, 
			p.email, 
			p.phone_number,
			p.birth_date,
			p.gender,
			p.address,
			p.medical_record_number,
			p.blood_type,
			p.emergency_contact,
			p.created_at,
			-- Appointment statistics
			COUNT(a.appointment_id) as total_appointments,
			COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
			COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) as cancelled_appointments,
			COUNT(CASE WHEN a.status IN ('confirmed', 'pending') AND a.appointment_date >= CURRENT_DATE THEN 1 END) as upcoming_appointments,
			MAX(CASE WHEN a.status = 'completed' THEN a.appointment_date END) as last_appointment_date
		FROM patients p
		LEFT JOIN appointments a ON p.patient_id = a.patient_id AND a.doctor_id = $1
		WHERE (
			LOWER(p.first_name) LIKE LOWER($2) OR 
			LOWER(p.last_name) LIKE LOWER($2) OR 
			LOWER(CONCAT(p.first_name, ' ', p.last_name)) LIKE LOWER($2) OR
			LOWER(p.email) LIKE LOWER($2) OR 
			p.phone_number LIKE $2 OR
			LOWER(p.medical_record_number) LIKE LOWER($2)
		)
		AND EXISTS (
			SELECT 1 FROM appointments 
			WHERE appointments.patient_id = p.patient_id 
			AND appointments.doctor_id = $1
		)
		GROUP BY p.patient_id, p.first_name, p.last_name, p.email, p.phone_number,
				 p.birth_date, p.gender, p.address, p.medical_record_number, 
				 p.blood_type, p.emergency_contact, p.created_at
		ORDER BY p.last_name, p.first_name
		LIMIT $3 OFFSET $4`

	searchPattern := "%" + searchTerm + "%"
	rows, err := s.db.Query(context.Background(), query, assignedDoctorID, searchPattern, limit, offset)
	if err != nil {
		log.Printf("Error executing search query: %v", err)
		return nil, fmt.Errorf("failed to search patients: %v", err)
	}
	defer rows.Close()

	var patients []map[string]interface{}
	for rows.Next() {
		var patient struct {
			PatientID             uuid.UUID      `json:"patient_id"`
			FirstName             string         `json:"first_name"`
			LastName              string         `json:"last_name"`
			Email                 sql.NullString `json:"email"`
			PhoneNumber           sql.NullString `json:"phone_number"`
			BirthDate             sql.NullTime   `json:"birth_date"`
			Gender                sql.NullString `json:"gender"`
			Address               sql.NullString `json:"address"`
			MedicalRecordNumber   sql.NullString `json:"medical_record_number"`
			BloodType             sql.NullString `json:"blood_type"`
			EmergencyContact      sql.NullString `json:"emergency_contact"`
			CreatedAt             time.Time      `json:"created_at"`
			TotalAppointments     int            `json:"total_appointments"`
			CompletedAppointments int            `json:"completed_appointments"`
			CancelledAppointments int            `json:"cancelled_appointments"`
			UpcomingAppointments  int            `json:"upcoming_appointments"`
			LastAppointmentDate   sql.NullTime   `json:"last_appointment_date"`
		}

		err := rows.Scan(
			&patient.PatientID,
			&patient.FirstName,
			&patient.LastName,
			&patient.Email,
			&patient.PhoneNumber,
			&patient.BirthDate,
			&patient.Gender,
			&patient.Address,
			&patient.MedicalRecordNumber,
			&patient.BloodType,
			&patient.EmergencyContact,
			&patient.CreatedAt,
			&patient.TotalAppointments,
			&patient.CompletedAppointments,
			&patient.CancelledAppointments,
			&patient.UpcomingAppointments,
			&patient.LastAppointmentDate,
		)
		if err != nil {
			log.Printf("Error scanning patient row: %v", err)
			continue
		}

		patientMap := map[string]interface{}{
			"patient_id":             patient.PatientID,
			"first_name":             patient.FirstName,
			"last_name":              patient.LastName,
			"created_at":             patient.CreatedAt,
			"total_appointments":     patient.TotalAppointments,
			"completed_appointments": patient.CompletedAppointments,
			"cancelled_appointments": patient.CancelledAppointments,
			"upcoming_appointments":  patient.UpcomingAppointments,
		}

		if patient.Email.Valid {
			patientMap["email"] = patient.Email.String
		}
		if patient.PhoneNumber.Valid {
			patientMap["phone_number"] = patient.PhoneNumber.String
		}
		if patient.BirthDate.Valid {
			patientMap["birth_date"] = patient.BirthDate.Time
		}
		if patient.Gender.Valid {
			patientMap["gender"] = patient.Gender.String
		}
		if patient.Address.Valid {
			patientMap["address"] = patient.Address.String
		}
		if patient.MedicalRecordNumber.Valid {
			patientMap["medical_record_number"] = patient.MedicalRecordNumber.String
		}
		if patient.BloodType.Valid {
			patientMap["blood_type"] = patient.BloodType.String
		}
		if patient.EmergencyContact.Valid {
			patientMap["emergency_contact"] = patient.EmergencyContact.String
		}
		if patient.LastAppointmentDate.Valid {
			patientMap["last_appointment_date"] = patient.LastAppointmentDate.Time
		}

		patients = append(patients, patientMap)
	}

	countQuery := `
		SELECT COUNT(DISTINCT p.patient_id)
		FROM patients p
		WHERE (
			LOWER(p.first_name) LIKE LOWER($2) OR 
			LOWER(p.last_name) LIKE LOWER($2) OR 
			LOWER(CONCAT(p.first_name, ' ', p.last_name)) LIKE LOWER($2) OR
			LOWER(p.email) LIKE LOWER($2) OR 
			p.phone_number LIKE $2 OR
			LOWER(p.medical_record_number) LIKE LOWER($2)
		)
		AND EXISTS (
			SELECT 1 FROM appointments 
			WHERE appointments.patient_id = p.patient_id 
			AND appointments.doctor_id = $1
		)`

	var total int
	err = s.db.QueryRow(context.Background(), countQuery, assignedDoctorID, searchPattern).Scan(&total)
	if err != nil {
		log.Printf("Error getting patient count: %v", err)
		total = len(patients)
	}

	return map[string]interface{}{
		"patients": patients,
		"total":    total,
		"page":     page,
		"limit":    limit,
	}, nil
}

func (s *PatientService) CreatePatient(patientData map[string]interface{}) (map[string]interface{}, error) {
	patientID := uuid.New()

	query := `
		INSERT INTO patients (
			patient_id, first_name, last_name, email, phone_number, 
			birth_date, gender, address, medical_record_number, 
			blood_type, emergency_contact, allergies, medical_conditions, 
			current_medications, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
		RETURNING patient_id, created_at`

	var createdAt time.Time
	err := s.db.QueryRow(context.Background(), query,
		patientID,
		patientData["first_name"],
		patientData["last_name"],
		patientData["email"],
		patientData["phone_number"],
		patientData["birth_date"],
		patientData["gender"],
		patientData["address"],
		patientData["medical_record_number"],
		patientData["blood_type"],
		patientData["emergency_contact"],
		patientData["allergies"],
		patientData["medical_conditions"],
		patientData["current_medications"],
	).Scan(&patientID, &createdAt)

	if err != nil {
		log.Printf("Error creating patient: %v", err)
		return nil, fmt.Errorf("failed to create patient: %v", err)
	}

	return map[string]interface{}{
		"patient_id": patientID,
		"created_at": createdAt,
		"message":    "Patient created successfully",
	}, nil
}

func (s *PatientService) GetPatientsForDoctor(doctorID string, page, limit int, sortBy, sortOrder string) (map[string]interface{}, error) {
	id, err := uuid.Parse(doctorID)
	if err != nil {
		return nil, fmt.Errorf("invalid doctor ID")
	}

	offset := (page - 1) * limit

	validSortFields := map[string]bool{
		"first_name": true, "last_name": true, "email": true,
		"created_at": true, "birth_date": true,
	}
	if !validSortFields[sortBy] {
		sortBy = "first_name"
	}
	if sortOrder != "ASC" && sortOrder != "DESC" {
		sortOrder = "ASC"
	}

	query := fmt.Sprintf(`SELECT DISTINCT p.patient_id, p.first_name, p.last_name, p.email, p.phone_number,
		p.street_address, p.city_name, p.state_name, p.birth_date
		FROM patient_info p
		INNER JOIN appointments a ON p.patient_id = a.patient_id
		WHERE a.doctor_id = $1
		ORDER BY p.%s %s
		LIMIT $2 OFFSET $3`, sortBy, sortOrder)

	rows, err := s.db.Query(context.Background(), query, id, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("error retrieving patients: %v", err)
	}
	defer rows.Close()

	var patients []models.Patient
	for rows.Next() {
		var patient models.Patient
		var birthDate sql.NullTime
		err := rows.Scan(&patient.PatientID, &patient.FirstName, &patient.LastName, &patient.Email,
			&patient.PhoneNumber, &patient.StreetAddress, &patient.CityName, &patient.StateName, &birthDate)
		if err != nil {
			return nil, fmt.Errorf("error scanning patient: %v", err)
		}
		if birthDate.Valid {
			patient.BirthDate = birthDate.Time.Format("2006-01-02")
		}
		patients = append(patients, patient)
	}

	var totalCount int
	countQuery := "SELECT COUNT(DISTINCT p.patient_id) FROM patient_info p INNER JOIN appointments a ON p.patient_id = a.patient_id WHERE a.doctor_id = $1"
	err = s.db.QueryRow(context.Background(), countQuery, id).Scan(&totalCount)
	if err != nil {
		return nil, fmt.Errorf("error getting total count: %v", err)
	}

	response := map[string]interface{}{
		"patients":     patients,
		"total_count":  totalCount,
		"current_page": page,
		"total_pages":  (totalCount + limit - 1) / limit,
	}

	return response, nil
}

func (s *PatientService) GetPatientDetailsForReceptionist(patientID string) (map[string]interface{}, error) {
	id, err := uuid.Parse(patientID)
	if err != nil {
		return nil, fmt.Errorf("invalid patient ID")
	}

	var patient models.Patient
	query := `SELECT patient_id, first_name, last_name, email, phone_number,
		street_address, city_name, state_name, zip_code, country_name,
		birth_date, sex, bio
		FROM patient_info WHERE patient_id = $1`

	var birthDate sql.NullTime
	err = s.db.QueryRow(context.Background(), query, id).Scan(
		&patient.PatientID, &patient.FirstName, &patient.LastName, &patient.Email,
		&patient.PhoneNumber, &patient.StreetAddress, &patient.CityName, &patient.StateName,
		&patient.ZipCode, &patient.CountryName, &birthDate, &patient.Sex,
		&patient.Bio)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("patient not found")
		}
		return nil, fmt.Errorf("error retrieving patient: %v", err)
	}

	if birthDate.Valid {
		patient.BirthDate = birthDate.Time.Format("2006-01-02")
	}

	appointmentQuery := `SELECT appointment_id, appointment_start, appointment_end,
		appointment_type, status, notes
		FROM appointments 
		WHERE patient_id = $1 
		ORDER BY appointment_start DESC 
		LIMIT 5`

	rows, err := s.db.Query(context.Background(), appointmentQuery, id)
	var recentAppointments []map[string]interface{}
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var appointmentID uuid.UUID
			var start, end time.Time
			var appointmentType string
			var status, notes sql.NullString

			err := rows.Scan(&appointmentID, &start, &end, &appointmentType, &status, &notes)
			if err == nil {
				appointment := map[string]interface{}{
					"appointment_id":    appointmentID,
					"appointment_start": start,
					"appointment_end":   end,
					"appointment_type":  appointmentType,
				}
				if status.Valid {
					appointment["status"] = status.String
				}
				if notes.Valid {
					appointment["notes"] = notes.String
				}
				recentAppointments = append(recentAppointments, appointment)
			}
		}
	}

	response := map[string]interface{}{
		"patient":             patient,
		"recent_appointments": recentAppointments,
	}

	return response, nil
}

func (s *PatientService) GetPatientMedicalHistoryForReceptionist(patientID, receptionistID string) (map[string]interface{}, error) {
	id, err := uuid.Parse(patientID)
	if err != nil {
		return nil, fmt.Errorf("invalid patient ID")
	}

	receptionistUUID, err := uuid.Parse(receptionistID)
	if err != nil {
		return nil, fmt.Errorf("invalid receptionist ID")
	}

	var assignedDoctorID uuid.UUID
	err = s.db.QueryRow(context.Background(), "SELECT assigned_doctor_id FROM receptionists WHERE receptionist_id = $1",
		receptionistUUID).Scan(&assignedDoctorID)
	if err != nil {
		return nil, fmt.Errorf("receptionist not found or no assigned doctor: %v", err)
	}

	var patientExists bool
	err = s.db.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM appointments WHERE patient_id = $1 AND doctor_id = $2)",
		id, assignedDoctorID).Scan(&patientExists)
	if err != nil || !patientExists {
		return nil, fmt.Errorf("patient not found for this doctor")
	}

	return map[string]interface{}{"history": []map[string]interface{}{}}, nil
}

func (s *PatientService) GetPatientDocumentsForReceptionist(patientID, receptionistID string) (map[string]interface{}, error) {
	id, err := uuid.Parse(patientID)
	if err != nil {
		return nil, fmt.Errorf("invalid patient ID")
	}

	receptionistUUID, err := uuid.Parse(receptionistID)
	if err != nil {
		return nil, fmt.Errorf("invalid receptionist ID")
	}

	var assignedDoctorID uuid.UUID
	err = s.db.QueryRow(context.Background(), "SELECT assigned_doctor_id FROM receptionists WHERE receptionist_id = $1",
		receptionistUUID).Scan(&assignedDoctorID)
	if err != nil {
		return nil, fmt.Errorf("receptionist not found or no assigned doctor: %v", err)
	}

	var patientExists bool
	err = s.db.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM appointments WHERE patient_id = $1 AND doctor_id = $2)",
		id, assignedDoctorID).Scan(&patientExists)
	if err != nil || !patientExists {
		return nil, fmt.Errorf("patient not found for this doctor")
	}

	return map[string]interface{}{"documents": []map[string]interface{}{}}, nil
}

func (s *PatientService) GetPatientWithAppointmentHistory(patientID, receptionistID string) (map[string]interface{}, error) {
	id, err := uuid.Parse(patientID)
	if err != nil {
		return nil, fmt.Errorf("invalid patient ID")
	}

	receptionistUUID, err := uuid.Parse(receptionistID)
	if err != nil {
		return nil, fmt.Errorf("invalid receptionist ID")
	}

	var assignedDoctorID uuid.UUID
	err = s.db.QueryRow(context.Background(), "SELECT assigned_doctor_id FROM receptionists WHERE receptionist_id = $1",
		receptionistUUID).Scan(&assignedDoctorID)
	if err != nil {
		return nil, fmt.Errorf("receptionist not found or no assigned doctor: %v", err)
	}

	var patient struct {
		PatientID           uuid.UUID      `json:"patient_id"`
		FirstName           string         `json:"first_name"`
		LastName            string         `json:"last_name"`
		Email               sql.NullString `json:"email"`
		PhoneNumber         sql.NullString `json:"phone_number"`
		BirthDate           sql.NullTime   `json:"birth_date"`
		Gender              sql.NullString `json:"gender"`
		Address             sql.NullString `json:"address"`
		MedicalRecordNumber sql.NullString `json:"medical_record_number"`
		BloodType           sql.NullString `json:"blood_type"`
		EmergencyContact    sql.NullString `json:"emergency_contact"`
		Allergies           sql.NullString `json:"allergies"`
		MedicalConditions   sql.NullString `json:"medical_conditions"`
		CurrentMedications  sql.NullString `json:"current_medications"`
		CreatedAt           time.Time      `json:"created_at"`
	}

	patientQuery := `
		SELECT patient_id, first_name, last_name, email, phone_number, 
			   birth_date, gender, address, medical_record_number, blood_type, 
			   emergency_contact, allergies, medical_conditions, current_medications, created_at
		FROM patients 
		WHERE patient_id = $1`

	err = s.db.QueryRow(context.Background(), patientQuery, id).Scan(
		&patient.PatientID, &patient.FirstName, &patient.LastName, &patient.Email, &patient.PhoneNumber,
		&patient.BirthDate, &patient.Gender, &patient.Address, &patient.MedicalRecordNumber, &patient.BloodType,
		&patient.EmergencyContact, &patient.Allergies, &patient.MedicalConditions, &patient.CurrentMedications, &patient.CreatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("patient not found")
		}
		return nil, fmt.Errorf("error retrieving patient: %v", err)
	}

	patientMap := map[string]interface{}{
		"patient_id": patient.PatientID,
		"first_name": patient.FirstName,
		"last_name":  patient.LastName,
		"created_at": patient.CreatedAt,
	}

	if patient.Email.Valid {
		patientMap["email"] = patient.Email.String
	}
	if patient.PhoneNumber.Valid {
		patientMap["phone_number"] = patient.PhoneNumber.String
	}
	if patient.BirthDate.Valid {
		patientMap["birth_date"] = patient.BirthDate.Time
	}
	if patient.Gender.Valid {
		patientMap["gender"] = patient.Gender.String
	}
	if patient.Address.Valid {
		patientMap["address"] = patient.Address.String
	}
	if patient.MedicalRecordNumber.Valid {
		patientMap["medical_record_number"] = patient.MedicalRecordNumber.String
	}
	if patient.BloodType.Valid {
		patientMap["blood_type"] = patient.BloodType.String
	}
	if patient.EmergencyContact.Valid {
		patientMap["emergency_contact"] = patient.EmergencyContact.String
	}
	if patient.Allergies.Valid {
		patientMap["allergies"] = patient.Allergies.String
	}
	if patient.MedicalConditions.Valid {
		patientMap["medical_conditions"] = patient.MedicalConditions.String
	}
	if patient.CurrentMedications.Valid {
		patientMap["current_medications"] = patient.CurrentMedications.String
	}

	appointmentQuery := `
		SELECT a.appointment_id, a.appointment_date, a.appointment_time, a.status, 
			   a.appointment_type, a.notes, a.diagnosis, a.prescription, a.created_at,
			   d.first_name as doctor_first_name, d.last_name as doctor_last_name
		FROM appointments a
		LEFT JOIN doctors d ON a.doctor_id = d.doctor_id
		WHERE a.patient_id = $1 AND a.doctor_id = $2
		ORDER BY a.appointment_date DESC, a.appointment_time DESC`

	rows, err := s.db.Query(context.Background(), appointmentQuery, id, assignedDoctorID)
	if err != nil {
		log.Printf("Error retrieving appointments: %v", err)
		return nil, fmt.Errorf("error retrieving appointments: %v", err)
	}
	defer rows.Close()

	var appointments []map[string]interface{}
	for rows.Next() {
		var appointment struct {
			AppointmentID   uuid.UUID      `json:"appointment_id"`
			AppointmentDate sql.NullTime   `json:"appointment_date"`
			AppointmentTime sql.NullString `json:"appointment_time"`
			Status          sql.NullString `json:"status"`
			AppointmentType sql.NullString `json:"appointment_type"`
			Notes           sql.NullString `json:"notes"`
			Diagnosis       sql.NullString `json:"diagnosis"`
			Prescription    sql.NullString `json:"prescription"`
			CreatedAt       time.Time      `json:"created_at"`
			DoctorFirstName sql.NullString `json:"doctor_first_name"`
			DoctorLastName  sql.NullString `json:"doctor_last_name"`
		}

		err := rows.Scan(
			&appointment.AppointmentID, &appointment.AppointmentDate, &appointment.AppointmentTime,
			&appointment.Status, &appointment.AppointmentType, &appointment.Notes,
			&appointment.Diagnosis, &appointment.Prescription, &appointment.CreatedAt,
			&appointment.DoctorFirstName, &appointment.DoctorLastName,
		)

		if err != nil {
			log.Printf("Error scanning appointment: %v", err)
			continue
		}

		appointmentMap := map[string]interface{}{
			"appointment_id": appointment.AppointmentID,
			"created_at":     appointment.CreatedAt,
		}

		if appointment.AppointmentDate.Valid {
			appointmentMap["appointment_date"] = appointment.AppointmentDate.Time
		}
		if appointment.AppointmentTime.Valid {
			appointmentMap["appointment_time"] = appointment.AppointmentTime.String
		}
		if appointment.Status.Valid {
			appointmentMap["status"] = appointment.Status.String
		}
		if appointment.AppointmentType.Valid {
			appointmentMap["appointment_type"] = appointment.AppointmentType.String
		}
		if appointment.Notes.Valid {
			appointmentMap["notes"] = appointment.Notes.String
		}
		if appointment.Diagnosis.Valid {
			appointmentMap["diagnosis"] = appointment.Diagnosis.String
		}
		if appointment.Prescription.Valid {
			appointmentMap["prescription"] = appointment.Prescription.String
		}
		if appointment.DoctorFirstName.Valid && appointment.DoctorLastName.Valid {
			appointmentMap["doctor_name"] = appointment.DoctorFirstName.String + " " + appointment.DoctorLastName.String
		}

		appointments = append(appointments, appointmentMap)
	}

	return map[string]interface{}{
		"patient":      patientMap,
		"appointments": appointments,
	}, nil
}

func (s *PatientService) AddPatientNoteForReceptionist(patientID, receptionistID, note string) error {
	id, err := uuid.Parse(patientID)
	if err != nil {
		return fmt.Errorf("invalid patient ID")
	}

	receptionistUUID, err := uuid.Parse(receptionistID)
	if err != nil {
		return fmt.Errorf("invalid receptionist ID")
	}

	var assignedDoctorID uuid.UUID
	err = s.db.QueryRow(context.Background(), "SELECT assigned_doctor_id FROM receptionists WHERE receptionist_id = $1",
		receptionistUUID).Scan(&assignedDoctorID)
	if err != nil {
		return fmt.Errorf("receptionist not found or no assigned doctor: %v", err)
	}

	var patientExists bool
	err = s.db.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM appointments WHERE patient_id = $1 AND doctor_id = $2)",
		id, assignedDoctorID).Scan(&patientExists)
	if err != nil || !patientExists {
		return fmt.Errorf("patient not found for this doctor")
	}

	return nil
}

func (s *PatientService) GetPatientsListForReceptionist(doctorID string) ([]map[string]interface{}, error) {
	id, err := uuid.Parse(doctorID)
	if err != nil {
		return nil, fmt.Errorf("invalid doctor ID")
	}

	query := `SELECT DISTINCT p.patient_id, p.first_name, p.last_name, p.email
		FROM patient_info p
		INNER JOIN appointments a ON p.patient_id = a.patient_id
		WHERE a.doctor_id = $1
		ORDER BY p.first_name, p.last_name`

	rows, err := s.db.Query(context.Background(), query, id)
	if err != nil {
		return nil, fmt.Errorf("error retrieving patients list: %v", err)
	}
	defer rows.Close()

	var patients []map[string]interface{}
	for rows.Next() {
		var patientID uuid.UUID
		var firstName, lastName, email string
		err := rows.Scan(&patientID, &firstName, &lastName, &email)
		if err != nil {
			return nil, fmt.Errorf("error scanning patient: %v", err)
		}

		patient := map[string]interface{}{
			"patient_id": patientID,
			"first_name": firstName,
			"last_name":  lastName,
			"email":      email,
			"full_name":  firstName + " " + lastName,
		}
		patients = append(patients, patient)
	}

	return patients, nil
}

func (s *PatientService) GetPatientAppointmentHistoryForReceptionist(receptionistID string, filters models.PatientAppointmentHistoryFilters, page, limit int) (map[string]interface{}, error) {
	id, err := uuid.Parse(receptionistID)
	if err != nil {
		return nil, fmt.Errorf("invalid receptionist ID")
	}

	var assignedDoctorID uuid.UUID
	err = s.db.QueryRow(context.Background(), "SELECT assigned_doctor_id FROM receptionists WHERE receptionist_id = $1", id).Scan(&assignedDoctorID)
	if err != nil {
		return nil, fmt.Errorf("error retrieving assigned doctor: %v", err)
	}

	offset := (page - 1) * limit

	baseQuery := `SELECT a.appointment_id, a.appointment_start, a.appointment_end,
		a.appointment_type, a.status, a.notes, a.created_at,
		p.patient_id, p.first_name, p.last_name, p.phone_number, p.email,
		d.first_name as doctor_first_name, d.last_name as doctor_last_name
		FROM appointments a
		JOIN patient_info p ON a.patient_id = p.patient_id
		JOIN doctor_info d ON a.doctor_id = d.doctor_id
		WHERE a.doctor_id = $1`

	var conditions []string
	var args []interface{}
	argCount := 1
	args = append(args, assignedDoctorID)

	if filters.PatientName != "" {
		argCount++
		conditions = append(conditions, fmt.Sprintf("(LOWER(p.first_name) LIKE LOWER($%d) OR LOWER(p.last_name) LIKE LOWER($%d))", argCount, argCount))
		args = append(args, "%"+filters.PatientName+"%")
	}

	if filters.DoctorID != "" {
		doctorUUID, err := uuid.Parse(filters.DoctorID)
		if err == nil {
			argCount++
			conditions = append(conditions, fmt.Sprintf("a.doctor_id = $%d", argCount))
			args = append(args, doctorUUID)
		}
	}

	if filters.Status != "" {
		argCount++
		conditions = append(conditions, fmt.Sprintf("a.status = $%d", argCount))
		args = append(args, filters.Status)
	}

	if filters.AppointmentType != "" {
		argCount++
		conditions = append(conditions, fmt.Sprintf("a.appointment_type = $%d", argCount))
		args = append(args, filters.AppointmentType)
	}

	if filters.DateFrom != "" {
		argCount++
		conditions = append(conditions, fmt.Sprintf("DATE(a.appointment_start) >= $%d", argCount))
		args = append(args, filters.DateFrom)
	}

	if filters.DateTo != "" {
		argCount++
		conditions = append(conditions, fmt.Sprintf("DATE(a.appointment_start) <= $%d", argCount))
		args = append(args, filters.DateTo)
	}

	if len(conditions) > 0 {
		baseQuery += " AND " + strings.Join(conditions, " AND ")
	}

	query := baseQuery + fmt.Sprintf(" ORDER BY a.appointment_start DESC LIMIT $%d OFFSET $%d", argCount+1, argCount+2)
	args = append(args, limit, offset)

	rows, err := s.db.Query(context.Background(), query, args...)
	if err != nil {
		return nil, fmt.Errorf("error retrieving appointment history: %v", err)
	}
	defer rows.Close()

	var appointments []map[string]interface{}
	for rows.Next() {
		var appointmentID, patientID uuid.UUID
		var start, end, createdAt time.Time
		var appointmentType, status, notes, patientFirstName, patientLastName, phone, email, doctorFirstName, doctorLastName string

		err := rows.Scan(&appointmentID, &start, &end, &appointmentType, &status, &notes, &createdAt,
			&patientID, &patientFirstName, &patientLastName, &phone, &email,
			&doctorFirstName, &doctorLastName)
		if err != nil {
			return nil, fmt.Errorf("error scanning appointment: %v", err)
		}

		appointment := map[string]interface{}{
			"appointment_id":    appointmentID,
			"appointment_start": start,
			"appointment_end":   end,
			"appointment_type":  appointmentType,
			"status":            status,
			"notes":             notes,
			"created_at":        createdAt,
			"patient": map[string]interface{}{
				"patient_id":   patientID,
				"first_name":   patientFirstName,
				"last_name":    patientLastName,
				"full_name":    patientFirstName + " " + patientLastName,
				"phone_number": phone,
				"email":        email,
			},
			"doctor": map[string]interface{}{
				"first_name": doctorFirstName,
				"last_name":  doctorLastName,
				"full_name":  doctorFirstName + " " + doctorLastName,
			},
		}
		appointments = append(appointments, appointment)
	}

	countQuery := `SELECT COUNT(*) FROM appointments a
		JOIN patient_info p ON a.patient_id = p.patient_id
		WHERE a.doctor_id = $1`
	countArgs := []interface{}{assignedDoctorID}
	argCount = 1

	if filters.PatientName != "" {
		argCount++
		countQuery += fmt.Sprintf(" AND (LOWER(p.first_name) LIKE LOWER($%d) OR LOWER(p.last_name) LIKE LOWER($%d))", argCount, argCount)
		countArgs = append(countArgs, "%"+filters.PatientName+"%")
	}

	if filters.DoctorID != "" {
		doctorUUID, err := uuid.Parse(filters.DoctorID)
		if err == nil {
			argCount++
			countQuery += fmt.Sprintf(" AND a.doctor_id = $%d", argCount)
			countArgs = append(countArgs, doctorUUID)
		}
	}

	if filters.Status != "" {
		argCount++
		countQuery += fmt.Sprintf(" AND a.status = $%d", argCount)
		countArgs = append(countArgs, filters.Status)
	}

	if filters.AppointmentType != "" {
		argCount++
		countQuery += fmt.Sprintf(" AND a.appointment_type = $%d", argCount)
		countArgs = append(countArgs, filters.AppointmentType)
	}

	if filters.DateFrom != "" {
		argCount++
		countQuery += fmt.Sprintf(" AND DATE(a.appointment_start) >= $%d", argCount)
		countArgs = append(countArgs, filters.DateFrom)
	}

	if filters.DateTo != "" {
		argCount++
		countQuery += fmt.Sprintf(" AND DATE(a.appointment_start) <= $%d", argCount)
		countArgs = append(countArgs, filters.DateTo)
	}

	var totalCount int
	err = s.db.QueryRow(context.Background(), countQuery, countArgs...).Scan(&totalCount)
	if err != nil {
		return nil, fmt.Errorf("error getting total count: %v", err)
	}

	response := map[string]interface{}{
		"appointments": appointments,
		"total_count":  totalCount,
		"current_page": page,
		"total_pages":  (totalCount + limit - 1) / limit,
	}

	return response, nil
}
