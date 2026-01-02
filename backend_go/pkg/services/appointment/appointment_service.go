package appointment

import (
	"context"
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

type AppointmentService struct {
	db  *pgxpool.Pool
	cfg *config.Config
}

type resolvedReferralDoctor struct {
	DoctorID    uuid.UUID
	FirstName   string
	FirstNameAr string
	LastName    string
	LastNameAr  string
}

func NewAppointmentService(db *pgxpool.Pool, cfg *config.Config) *AppointmentService {
	return &AppointmentService{
		db:  db,
		cfg: cfg,
	}
}

func normalizeReferralDoctorNameForMatch(name string) string {
	trimmed := strings.TrimSpace(name)
	if trimmed == "" {
		return ""
	}

	collapsed := strings.Join(strings.Fields(trimmed), " ")
	lower := strings.ToLower(collapsed)

	if strings.HasPrefix(lower, "dr. ") {
		return strings.TrimSpace(collapsed[4:])
	}
	if strings.HasPrefix(lower, "dr ") {
		return strings.TrimSpace(collapsed[3:])
	}
	if lower == "dr" || lower == "dr." {
		return ""
	}

	if strings.HasPrefix(collapsed, "د. ") {
		return strings.TrimSpace(collapsed[3:])
	}
	if strings.HasPrefix(collapsed, "د.") {
		return strings.TrimSpace(collapsed[2:])
	}
	if strings.HasPrefix(collapsed, "د ") {
		return strings.TrimSpace(collapsed[2:])
	}
	if collapsed == "د" || collapsed == "د." {
		return ""
	}

	return collapsed
}

func (s *AppointmentService) resolveReferralDoctorByName(ctx context.Context, name string) (*resolvedReferralDoctor, error) {
	normalized := normalizeReferralDoctorNameForMatch(name)
	if normalized == "" {
		return nil, nil
	}

	query := `
		SELECT
			doctor_id,
			first_name,
			COALESCE(first_name_ar, ''),
			last_name,
			COALESCE(last_name_ar, '')
		FROM doctor_info
		WHERE LOWER(TRIM(first_name || ' ' || last_name)) = LOWER($1)
		LIMIT 2
	`

	rows, err := s.db.Query(ctx, query, normalized)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var matches []resolvedReferralDoctor
	for rows.Next() {
		var m resolvedReferralDoctor
		if err := rows.Scan(&m.DoctorID, &m.FirstName, &m.FirstNameAr, &m.LastName, &m.LastNameAr); err != nil {
			return nil, err
		}
		matches = append(matches, m)
	}

	if len(matches) != 1 {
		return nil, nil
	}
	return &matches[0], nil
}

func (s *AppointmentService) resolveReferralDoctorByNameTx(ctx context.Context, tx pgx.Tx, name string) (*resolvedReferralDoctor, error) {
	normalized := normalizeReferralDoctorNameForMatch(name)
	if normalized == "" {
		return nil, nil
	}

	query := `
		SELECT
			doctor_id,
			first_name,
			COALESCE(first_name_ar, ''),
			last_name,
			COALESCE(last_name_ar, '')
		FROM doctor_info
		WHERE LOWER(TRIM(first_name || ' ' || last_name)) = LOWER($1)
		LIMIT 2
	`

	rows, err := tx.Query(ctx, query, normalized)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var matches []resolvedReferralDoctor
	for rows.Next() {
		var m resolvedReferralDoctor
		if err := rows.Scan(&m.DoctorID, &m.FirstName, &m.FirstNameAr, &m.LastName, &m.LastNameAr); err != nil {
			return nil, err
		}
		matches = append(matches, m)
	}

	if len(matches) != 1 {
		return nil, nil
	}
	return &matches[0], nil
}

func (s *AppointmentService) GetAvailabilities(doctorId, day, currentTime string) ([]models.Availability, error) {
	if doctorId == "" || day == "" || currentTime == "" {
		return nil, fmt.Errorf("doctorId, day, and currentTime are required")
	}

	const customDateFormat = "2006-01-02"
	dayStart, err := time.Parse(customDateFormat, day)
	if err != nil {
		log.Println("Invalid day format:", err)
		return nil, fmt.Errorf("invalid day format")
	}

	dayEnd := dayStart.AddDate(0, 0, 1)

	rows, err := s.db.Query(context.Background(),
		"SELECT availability_id, availability_start, availability_end, doctor_id, weekday, slot_duration FROM availabilities WHERE doctor_id = $1 AND availability_start >= $2 AND availability_end < $3 AND availability_start >= $4",
		doctorId, dayStart, dayEnd, currentTime)
	if err != nil {
		log.Println("Query Error:", err)
		return nil, fmt.Errorf("database error: %v", err)
	}
	defer rows.Close()

	var availabilities []models.Availability
	for rows.Next() {
		log.Println("Processing row for availability")
		var availability models.Availability
		err := rows.Scan(&availability.AvailabilityID, &availability.AvailabilityStart, &availability.AvailabilityEnd, &availability.DoctorID, &availability.Weekday, &availability.SlotDuration)
		if err != nil {
			log.Println("Row Scan Error:", err)
			return nil, fmt.Errorf("scan error: %v", err)
		}
		availabilities = append(availabilities, availability)
	}
	return availabilities, nil
}

func (s *AppointmentService) SetDoctorAvailability(userId, startStr, endStr string, availabilities []models.Availability) error {
	const dFmt = "2006-01-02"
	var rangeStart, rangeEnd time.Time
	limitToRange := false

	if startStr != "" && endStr != "" {
		var err error
		rangeStart, err = time.Parse(dFmt, startStr)
		if err != nil {
			log.Println("Invalid start date format:", err)
			return fmt.Errorf("bad start date")
		}
		rangeEnd, err = time.Parse(dFmt, endStr)
		if err != nil {
			log.Println("Invalid end date format:", err)
			return fmt.Errorf("bad end date")
		}
		limitToRange = true
	}

	if limitToRange {
		_, err := s.db.Exec(context.Background(),
			"DELETE FROM availabilities WHERE doctor_id = $1 AND DATE(availability_start) >= $2 AND DATE(availability_start) <= $3",
			userId, rangeStart, rangeEnd)
		if err != nil {
			log.Println("Error deleting existing availabilities:", err)
			return fmt.Errorf("failed to delete existing availabilities")
		}
	} else {
		_, err := s.db.Exec(context.Background(),
			"DELETE FROM availabilities WHERE doctor_id = $1",
			userId)
		if err != nil {
			log.Println("Error deleting existing availabilities:", err)
			return fmt.Errorf("failed to delete existing availabilities")
		}
	}

	for _, availability := range availabilities {
		availabilityId := uuid.New().String()
		availability.AvailabilityID = availabilityId

		if limitToRange {
			availabilityDate := availability.AvailabilityStart.Truncate(24 * time.Hour)
			if availabilityDate.Before(rangeStart) || availabilityDate.After(rangeEnd) {
				continue
			}
		}

		_, err := s.db.Exec(context.Background(),
			"INSERT INTO availabilities (availability_id, doctor_id, weekday, availability_start, availability_end, slot_duration) VALUES ($1, $2, $3, $4, $5, $6)",
			availability.AvailabilityID, userId, availability.Weekday, availability.AvailabilityStart, availability.AvailabilityEnd, availability.SlotDuration)
		if err != nil {
			log.Println("Error inserting availability:", err)
			return fmt.Errorf("failed to insert availability")
		}
	}

	return nil
}

func (s *AppointmentService) ClearDoctorAvailabilities(doctorID string) error {
	_, err := s.db.Exec(context.Background(),
		"DELETE FROM availabilities WHERE doctor_id = $1",
		doctorID)
	if err != nil {
		log.Printf("Error clearing doctor availabilities: %v", err)
		return fmt.Errorf("failed to clear availabilities")
	}
	log.Printf("Cleared all availabilities for doctor: %s", doctorID)
	return nil
}

func (s *AppointmentService) GetWeeklySchedule(doctorId string, rangeStart, rangeEnd time.Time) (map[string]interface{}, error) {
	query := `
		SELECT weekday, slot_duration, 
		       MIN(availability_start) as earliest_start,
		       MAX(availability_end) as latest_end,
		       CASE weekday 
		           WHEN 'Monday' THEN 1 
		           WHEN 'Tuesday' THEN 2 
		           WHEN 'Wednesday' THEN 3 
		           WHEN 'Thursday' THEN 4 
		           WHEN 'Friday' THEN 5 
		           WHEN 'Saturday' THEN 6 
		           WHEN 'Sunday' THEN 7 
		       END as day_order
		FROM availabilities 
		WHERE doctor_id = $1 AND availability_start >= $2 AND availability_start < $3
		GROUP BY weekday, slot_duration
		ORDER BY day_order`

	rows, err := s.db.Query(context.Background(), query, doctorId, rangeStart, rangeEnd.AddDate(0, 0, 1))
	if err != nil {
		log.Printf("Error fetching weekly schedule: %v", err)
		return nil, fmt.Errorf("failed to fetch weekly schedule")
	}
	defer rows.Close()

	scheduleMap := make(map[string]map[string]interface{})

	for rows.Next() {
		var weekday string
		var slotDuration int
		var earliestStart, latestEnd time.Time
		var dayOrder int

		err := rows.Scan(&weekday, &slotDuration, &earliestStart, &latestEnd, &dayOrder)
		if err != nil {
			log.Printf("Error scanning weekly schedule: %v", err)
			continue
		}

		startTime := earliestStart.Format("15:04")
		endTime := latestEnd.Format("15:04")

		scheduleMap[weekday] = map[string]interface{}{
			"weekday":      weekday,
			"enabled":      true,
			"start":        startTime,
			"end":          endTime,
			"slotDuration": slotDuration,
		}
	}

	weekdays := []string{"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"}
	var weeklySchedule []map[string]interface{}

	for _, day := range weekdays {
		if schedule, exists := scheduleMap[day]; exists {
			weeklySchedule = append(weeklySchedule, schedule)
		} else {
			weeklySchedule = append(weeklySchedule, map[string]interface{}{
				"weekday":      day,
				"enabled":      false,
				"start":        "09:00",
				"end":          "17:00",
				"slotDuration": 30,
			})
		}
	}

	return map[string]interface{}{
		"weeklySchedule": weeklySchedule,
	}, nil
}

func (s *AppointmentService) GetDoctorWeeklySchedule(doctorId string, rangeStart, rangeEnd time.Time) ([]models.Reservation, error) {
	query := `
		SELECT 
			a.appointment_id, 
			a.appointment_start, 
			a.appointment_end, 
			a.doctor_id, 
			a.patient_id,
			COALESCE(p.first_name, r.first_name, dp.first_name, '') as patient_first_name,
			COALESCE(p.first_name_ar, r.first_name_ar, dp.first_name_ar, '') as patient_first_name_ar,
			COALESCE(p.last_name, r.last_name, dp.last_name, '') as patient_last_name,
			COALESCE(p.last_name_ar, r.last_name_ar, dp.last_name_ar, '') as patient_last_name_ar,
			CASE 
				WHEN p.age IS NOT NULL THEN p.age
				WHEN dp.age IS NOT NULL THEN dp.age
				ELSE NULL
			END AS age,
			COALESCE(d.first_name, '') as doctor_first_name,
			COALESCE(d.first_name_ar, '') as doctor_first_name_ar,
			COALESCE(d.last_name, '') as doctor_last_name,
			COALESCE(d.last_name_ar, '') as doctor_last_name_ar,
			COALESCE(d.specialty_code, '') as specialty
		FROM appointments a
		LEFT JOIN patient_info p ON a.patient_id = p.patient_id
		LEFT JOIN receptionists r ON a.patient_id = r.receptionist_id
		LEFT JOIN doctor_info dp ON a.patient_id = dp.doctor_id
		LEFT JOIN doctor_info d ON a.doctor_id = d.doctor_id
		WHERE a.doctor_id = $1 
		AND a.appointment_start >= $2 
		AND a.appointment_start < $3
		ORDER BY a.appointment_start ASC`

	rows, err := s.db.Query(context.Background(), query, doctorId, rangeStart, rangeEnd.AddDate(0, 0, 1))
	if err != nil {
		log.Printf("Error fetching weekly schedule: %v", err)
		return nil, fmt.Errorf("failed to fetch weekly schedule")
	}
	defer rows.Close()

	var reservations []models.Reservation
	for rows.Next() {
		var reservation models.Reservation

		err := rows.Scan(
			&reservation.AppointmentID,
			&reservation.AppointmentStart,
			&reservation.AppointmentEnd,
			&reservation.DoctorID,
			&reservation.PatientID,
			&reservation.PatientFirstName,
			&reservation.PatientFirstNameAr,
			&reservation.PatientLastName,
			&reservation.PatientLastNameAr,
			&reservation.Age,
			&reservation.DoctorFirstName,
			&reservation.DoctorFirstNameAr,
			&reservation.DoctorLastName,
			&reservation.DoctorLastNameAr,
			&reservation.Specialty,
		)
		if err != nil {
			log.Printf("Error scanning reservation: %v", err)
			continue
		}

		reservations = append(reservations, reservation)
	}

	return reservations, nil
}

func (s *AppointmentService) CreateReservation(reservation models.Reservation) error {
	appointmentID := uuid.New()
	reservation.AppointmentID = appointmentID

	tx, err := s.db.Begin(context.Background())
	if err != nil {
		log.Printf("Error starting transaction: %v", err)
		return fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback(context.Background())

	_, err = tx.Exec(context.Background(),
		"INSERT INTO appointments (appointment_id, appointment_start, appointment_end, doctor_id, patient_id, title, notes, is_doctor_patient) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
		reservation.AppointmentID,
		reservation.AppointmentStart,
		reservation.AppointmentEnd,
		reservation.DoctorID,
		reservation.PatientID,
		reservation.Title,
		reservation.Notes,
		reservation.IsDoctorPatient,
	)
	if err != nil {
		return fmt.Errorf("failed to insert appointment: %v", err)
	}

	_, err = tx.Exec(context.Background(),
		"DELETE FROM availabilities WHERE doctor_id = $1 AND availability_start = $2",
		reservation.DoctorID, reservation.AppointmentStart)
	if err != nil {
		log.Printf("Warning: failed to delete availability: %v", err)
	}

	err = tx.Commit(context.Background())
	if err != nil {
		log.Printf("Error committing transaction: %v", err)
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	return nil
}

func (s *AppointmentService) GetAppointmentStatistics(userID string, userType string) (map[string]int, error) {
	var asDoctorCount, asPatientCount int

	if userType == "patient" {
		err := s.db.QueryRow(context.Background(),
			`SELECT COUNT(*) FROM appointments WHERE patient_id = $1 AND NOT canceled`,
			userID).Scan(&asPatientCount)
		if err != nil {
			log.Printf("Error fetching patient appointment statistics: %v", err)
			return nil, fmt.Errorf("error fetching patient statistics")
		}
		asDoctorCount = 0
	} else if userType == "doctor" {
		err := s.db.QueryRow(context.Background(),
			`SELECT COUNT(*) FROM appointments WHERE doctor_id = $1 AND NOT canceled`,
			userID).Scan(&asDoctorCount)
		if err != nil {
			log.Printf("Error fetching doctor appointment statistics: %v", err)
			return nil, fmt.Errorf("error fetching doctor statistics")
		}

		err = s.db.QueryRow(context.Background(),
			`SELECT COUNT(*) FROM appointments WHERE patient_id = $1 AND NOT canceled`,
			userID).Scan(&asPatientCount)
		if err != nil {
			log.Printf("Error fetching doctor-as-patient appointment statistics: %v", err)
			return nil, fmt.Errorf("error fetching doctor-as-patient statistics")
		}
	}

	stats := map[string]int{
		"as_doctor":  asDoctorCount,
		"as_patient": asPatientCount,
	}

	return stats, nil
}

func (s *AppointmentService) GetReservations(userID, userType, timezone string) ([]models.Reservation, error) {
	return s.GetReservationsWithViewAs(userID, userType, timezone, "")
}

func (s *AppointmentService) GetReservationsWithViewAs(userID, userType, timezone, viewAs string) ([]models.Reservation, error) {
	if userID == "" || userType == "" {
		log.Println("Bad Request: userID and userType are required")
		return nil, fmt.Errorf("userID and userType are required")
	}

	var reservations []models.Reservation

	if userType == "patient" {
		reservations = s.getPatientReservations(userID, timezone)
	} else if userType == "receptionist" {
		if viewAs == "patient" {
			reservations = s.getReceptionistReservationsAsPatient(userID, timezone)
		} else {
			reservations = s.getReceptionistReservationsAsReceptionist(userID, timezone)
		}
	} else if userType == "doctor" {
		if viewAs == "patient" {
			reservations = s.getDoctorReservationsAsPatient(userID, timezone)
		} else if viewAs == "doctor" {
			reservations = s.getDoctorReservationsAsDoctor(userID, timezone)
		} else {
			doctorReservations := s.getDoctorReservationsAsDoctor(userID, timezone)
			patientReservations := s.getDoctorReservationsAsPatient(userID, timezone)
			reservations = append(doctorReservations, patientReservations...)
		}
	}

	return reservations, nil
}

func (s *AppointmentService) getReceptionistReservationsAsPatient(userID, timezone string) []models.Reservation {
	query := `
		SELECT 
			appointments.appointment_id,
			appointments.appointment_start,
			appointments.appointment_end,
			doctor_info.first_name AS doctor_first_name,
			COALESCE(doctor_info.first_name_ar, '') AS doctor_first_name_ar,
			doctor_info.last_name AS doctor_last_name,
			COALESCE(doctor_info.last_name_ar, '') AS doctor_last_name_ar,
			doctor_info.specialty_code,
			receptionists.first_name AS patient_first_name,
			COALESCE(receptionists.first_name_ar, '') AS patient_first_name_ar,
			receptionists.last_name AS patient_last_name,
			COALESCE(receptionists.last_name_ar, '') AS patient_last_name_ar,
			NULL::int AS age,
			receptionists.receptionist_id AS patient_id,
			doctor_info.doctor_id,
			appointments.is_doctor_patient,
			appointments.canceled,
			appointments.canceled_by,
			appointments.cancellation_reason,
			appointments.cancellation_timestamp,
			CASE WHEN medical_reports.report_id IS NOT NULL THEN true ELSE false END AS report_exists
		FROM 
			appointments
		JOIN
			doctor_info ON appointments.doctor_id = doctor_info.doctor_id
		JOIN
			receptionists ON appointments.patient_id = receptionists.receptionist_id
		LEFT JOIN
			medical_reports ON appointments.appointment_id = medical_reports.appointment_id
		WHERE
			appointments.patient_id = $1;
	`

	rows, err := s.db.Query(context.Background(), query, userID)
	if err != nil {
		log.Println("Query Error:", err)
		return []models.Reservation{}
	}
	defer rows.Close()

	var reservations []models.Reservation
	for rows.Next() {
		var r models.Reservation
		err := rows.Scan(
			&r.AppointmentID,
			&r.AppointmentStart,
			&r.AppointmentEnd,
			&r.DoctorFirstName,
			&r.DoctorFirstNameAr,
			&r.DoctorLastName,
			&r.DoctorLastNameAr,
			&r.Specialty,
			&r.PatientFirstName,
			&r.PatientFirstNameAr,
			&r.PatientLastName,
			&r.PatientLastNameAr,
			&r.Age,
			&r.PatientID,
			&r.DoctorID,
			&r.IsDoctorPatient,
			&r.Canceled,
			&r.CanceledBy,
			&r.CancellationReason,
			&r.CancellationTimestamp,
			&r.ReportExists,
		)
		if err != nil {
			log.Println("Row Scan Error:", err)
			continue
		}

		if timezone != "UTC" {
			location, err := time.LoadLocation(timezone)
			if err == nil {
				r.AppointmentStart = r.AppointmentStart.In(location)
				r.AppointmentEnd = r.AppointmentEnd.In(location)
			}
		}

		reservations = append(reservations, r)
	}
	return reservations
}

func (s *AppointmentService) getReceptionistReservationsAsReceptionist(receptionistID, timezone string) []models.Reservation {
	var assignedDoctorID string
	err := s.db.QueryRow(context.Background(),
		"SELECT COALESCE(assigned_doctor_id::text, '') FROM receptionists WHERE receptionist_id = $1",
		receptionistID,
	).Scan(&assignedDoctorID)
	if err != nil {
		log.Println("Query Error:", err)
		return []models.Reservation{}
	}
	if assignedDoctorID == "" {
		return []models.Reservation{}
	}

	query := `
		SELECT 
			appointments.appointment_id,
			appointments.appointment_start,
			appointments.appointment_end,
			doctor_info.first_name AS doctor_first_name,
			COALESCE(doctor_info.first_name_ar, '') AS doctor_first_name_ar,
			doctor_info.last_name AS doctor_last_name,
			COALESCE(doctor_info.last_name_ar, '') AS doctor_last_name_ar,
			doctor_info.specialty_code,
			COALESCE(patient_info.first_name, receptionists.first_name, doctor_patient.first_name, '') AS patient_first_name,
			COALESCE(patient_info.first_name_ar, receptionists.first_name_ar, doctor_patient.first_name_ar, '') AS patient_first_name_ar,
			COALESCE(patient_info.last_name, receptionists.last_name, doctor_patient.last_name, '') AS patient_last_name,
			COALESCE(patient_info.last_name_ar, receptionists.last_name_ar, doctor_patient.last_name_ar, '') AS patient_last_name_ar,
			CASE 
				WHEN patient_info.age IS NOT NULL THEN patient_info.age
				WHEN doctor_patient.age IS NOT NULL THEN doctor_patient.age
				ELSE NULL
			END AS age,
			appointments.patient_id,
			doctor_info.doctor_id,
			appointments.is_doctor_patient,
			appointments.canceled,
			appointments.canceled_by,
			appointments.cancellation_reason,
			appointments.cancellation_timestamp,
			CASE WHEN medical_reports.report_id IS NOT NULL THEN true ELSE false END AS report_exists
		FROM 
			appointments
		JOIN
			doctor_info ON appointments.doctor_id = doctor_info.doctor_id
		LEFT JOIN
			patient_info ON appointments.patient_id = patient_info.patient_id
		LEFT JOIN
			receptionists ON appointments.patient_id = receptionists.receptionist_id
		LEFT JOIN
			doctor_info AS doctor_patient ON appointments.patient_id = doctor_patient.doctor_id
		LEFT JOIN
			medical_reports ON appointments.appointment_id = medical_reports.appointment_id
		WHERE
			appointments.doctor_id = $1;
	`

	rows, err := s.db.Query(context.Background(), query, assignedDoctorID)
	if err != nil {
		log.Println("Query Error:", err)
		return []models.Reservation{}
	}
	defer rows.Close()

	var reservations []models.Reservation
	for rows.Next() {
		var r models.Reservation
		err := rows.Scan(
			&r.AppointmentID,
			&r.AppointmentStart,
			&r.AppointmentEnd,
			&r.DoctorFirstName,
			&r.DoctorFirstNameAr,
			&r.DoctorLastName,
			&r.DoctorLastNameAr,
			&r.Specialty,
			&r.PatientFirstName,
			&r.PatientFirstNameAr,
			&r.PatientLastName,
			&r.PatientLastNameAr,
			&r.Age,
			&r.PatientID,
			&r.DoctorID,
			&r.IsDoctorPatient,
			&r.Canceled,
			&r.CanceledBy,
			&r.CancellationReason,
			&r.CancellationTimestamp,
			&r.ReportExists,
		)
		if err != nil {
			log.Println("Row Scan Error:", err)
			continue
		}

		if timezone != "UTC" {
			location, err := time.LoadLocation(timezone)
			if err == nil {
				r.AppointmentStart = r.AppointmentStart.In(location)
				r.AppointmentEnd = r.AppointmentEnd.In(location)
			}
		}

		reservations = append(reservations, r)
	}
	return reservations
}

func (s *AppointmentService) getPatientReservations(userID, timezone string) []models.Reservation {
	query := `
		SELECT 
			appointments.appointment_id,
			appointments.appointment_start,
			appointments.appointment_end,
			doctor_info.first_name,
			COALESCE(doctor_info.first_name_ar, '') AS doctor_first_name_ar,
			doctor_info.last_name,
			COALESCE(doctor_info.last_name_ar, '') AS doctor_last_name_ar,
			doctor_info.specialty_code,
			patient_info.first_name AS patient_first_name,
			COALESCE(patient_info.first_name_ar, '') AS patient_first_name_ar,
			patient_info.last_name AS patient_last_name,
			COALESCE(patient_info.last_name_ar, '') AS patient_last_name_ar,
			patient_info.age,
			patient_info.patient_id,
			doctor_info.doctor_id,
			appointments.is_doctor_patient,
			appointments.canceled,
			appointments.canceled_by,
			appointments.cancellation_reason,
			appointments.cancellation_timestamp,
			CASE WHEN medical_reports.report_id IS NOT NULL THEN true ELSE false END AS report_exists
		FROM 
			appointments
		JOIN
			doctor_info ON appointments.doctor_id = doctor_info.doctor_id
		JOIN
			patient_info ON appointments.patient_id = patient_info.patient_id
		LEFT JOIN
			medical_reports ON appointments.appointment_id = medical_reports.appointment_id
		WHERE
			appointments.patient_id = $1;
	`

	rows, err := s.db.Query(context.Background(), query, userID)
	if err != nil {
		log.Println("Query Error:", err)
		return []models.Reservation{}
	}
	defer rows.Close()

	var reservations []models.Reservation
	for rows.Next() {
		var r models.Reservation
		err := rows.Scan(
			&r.AppointmentID,
			&r.AppointmentStart,
			&r.AppointmentEnd,
			&r.DoctorFirstName,
			&r.DoctorFirstNameAr,
			&r.DoctorLastName,
			&r.DoctorLastNameAr,
			&r.Specialty,
			&r.PatientFirstName,
			&r.PatientFirstNameAr,
			&r.PatientLastName,
			&r.PatientLastNameAr,
			&r.Age,
			&r.PatientID,
			&r.DoctorID,
			&r.IsDoctorPatient,
			&r.Canceled,
			&r.CanceledBy,
			&r.CancellationReason,
			&r.CancellationTimestamp,
			&r.ReportExists,
		)
		if err != nil {
			log.Println("Row Scan Error:", err)
			continue
		}

		if timezone != "UTC" {
			location, err := time.LoadLocation(timezone)
			if err == nil {
				r.AppointmentStart = r.AppointmentStart.In(location)
				r.AppointmentEnd = r.AppointmentEnd.In(location)
			}
		}

		reservations = append(reservations, r)
	}
	return reservations
}

func (s *AppointmentService) getDoctorReservationsAsDoctor(userID, timezone string) []models.Reservation {
	query := `
		SELECT 
			appointments.appointment_id,
			appointments.appointment_start,
			appointments.appointment_end,
			doctor_info.first_name AS doctor_first_name,
			COALESCE(doctor_info.first_name_ar, '') AS doctor_first_name_ar,
			doctor_info.last_name AS doctor_last_name,
			COALESCE(doctor_info.last_name_ar, '') AS doctor_last_name_ar,
			doctor_info.specialty_code,
			COALESCE(patient_info.first_name, receptionists.first_name, doctor_patient.first_name, '') AS patient_first_name,
			COALESCE(patient_info.first_name_ar, receptionists.first_name_ar, doctor_patient.first_name_ar, '') AS patient_first_name_ar,
			COALESCE(patient_info.last_name, receptionists.last_name, doctor_patient.last_name, '') AS patient_last_name,
			COALESCE(patient_info.last_name_ar, receptionists.last_name_ar, doctor_patient.last_name_ar, '') AS patient_last_name_ar,
			CASE 
				WHEN patient_info.age IS NOT NULL THEN patient_info.age
				WHEN doctor_patient.age IS NOT NULL THEN doctor_patient.age
				ELSE NULL
			END AS age,
			appointments.patient_id,
			doctor_info.doctor_id,
			appointments.is_doctor_patient,
			appointments.canceled,
			appointments.canceled_by,
			appointments.cancellation_reason,
			appointments.cancellation_timestamp,
			CASE WHEN medical_reports.report_id IS NOT NULL THEN true ELSE false END AS report_exists
		FROM 
			appointments
		JOIN
			doctor_info ON appointments.doctor_id = doctor_info.doctor_id
		LEFT JOIN
			patient_info ON appointments.patient_id = patient_info.patient_id
		LEFT JOIN
			receptionists ON appointments.patient_id = receptionists.receptionist_id
		LEFT JOIN
			doctor_info AS doctor_patient ON appointments.patient_id = doctor_patient.doctor_id
		LEFT JOIN
			medical_reports ON appointments.appointment_id = medical_reports.appointment_id
		WHERE
			appointments.doctor_id = $1;
	`

	rows, err := s.db.Query(context.Background(), query, userID)
	if err != nil {
		log.Println("Query Error:", err)
		return []models.Reservation{}
	}
	defer rows.Close()

	var reservations []models.Reservation
	for rows.Next() {
		var r models.Reservation
		err := rows.Scan(
			&r.AppointmentID,
			&r.AppointmentStart,
			&r.AppointmentEnd,
			&r.DoctorFirstName,
			&r.DoctorFirstNameAr,
			&r.DoctorLastName,
			&r.DoctorLastNameAr,
			&r.Specialty,
			&r.PatientFirstName,
			&r.PatientFirstNameAr,
			&r.PatientLastName,
			&r.PatientLastNameAr,
			&r.Age,
			&r.PatientID,
			&r.DoctorID,
			&r.IsDoctorPatient,
			&r.Canceled,
			&r.CanceledBy,
			&r.CancellationReason,
			&r.CancellationTimestamp,
			&r.ReportExists,
		)
		if err != nil {
			log.Println("Row Scan Error:", err)
			continue
		}

		if timezone != "UTC" {
			location, err := time.LoadLocation(timezone)
			if err == nil {
				r.AppointmentStart = r.AppointmentStart.In(location)
				r.AppointmentEnd = r.AppointmentEnd.In(location)
			}
		}

		reservations = append(reservations, r)
	}
	return reservations
}

func (s *AppointmentService) getDoctorReservationsAsPatient(userID, timezone string) []models.Reservation {
	query := `
		SELECT 
			appointments.appointment_id,
			appointments.appointment_start,
			appointments.appointment_end,
			treating_doctor.first_name AS doctor_first_name,
			COALESCE(treating_doctor.first_name_ar, '') AS doctor_first_name_ar,
			treating_doctor.last_name AS doctor_last_name,
			COALESCE(treating_doctor.last_name_ar, '') AS doctor_last_name_ar,
			treating_doctor.specialty_code,
			patient_doctor.first_name AS patient_first_name,
			COALESCE(patient_doctor.first_name_ar, '') AS patient_first_name_ar,
			patient_doctor.last_name AS patient_last_name,
			COALESCE(patient_doctor.last_name_ar, '') AS patient_last_name_ar,
			patient_doctor.age,
			appointments.patient_id,
			appointments.doctor_id,
			appointments.is_doctor_patient,
			appointments.canceled,
			appointments.canceled_by,
			appointments.cancellation_reason,
			appointments.cancellation_timestamp,
			CASE WHEN medical_reports.report_id IS NOT NULL THEN true ELSE false END AS report_exists
		FROM 
			appointments
		JOIN doctor_info AS treating_doctor ON appointments.doctor_id = treating_doctor.doctor_id
		JOIN doctor_info AS patient_doctor ON appointments.patient_id = patient_doctor.doctor_id
		LEFT JOIN medical_reports ON appointments.appointment_id = medical_reports.appointment_id
		WHERE 
			appointments.patient_id = $1;
	`

	rows, err := s.db.Query(context.Background(), query, userID)
	if err != nil {
		log.Println("Query Error:", err)
		return []models.Reservation{}
	}
	defer rows.Close()

	var reservations []models.Reservation
	for rows.Next() {
		var r models.Reservation
		err := rows.Scan(
			&r.AppointmentID,
			&r.AppointmentStart,
			&r.AppointmentEnd,
			&r.DoctorFirstName,
			&r.DoctorFirstNameAr,
			&r.DoctorLastName,
			&r.DoctorLastNameAr,
			&r.Specialty,
			&r.PatientFirstName,
			&r.PatientFirstNameAr,
			&r.PatientLastName,
			&r.PatientLastNameAr,
			&r.Age,
			&r.PatientID,
			&r.DoctorID,
			&r.IsDoctorPatient,
			&r.Canceled,
			&r.CanceledBy,
			&r.CancellationReason,
			&r.CancellationTimestamp,
			&r.ReportExists,
		)
		if err != nil {
			log.Println("Row Scan Error:", err)
			continue
		}

		if timezone != "UTC" {
			location, err := time.LoadLocation(timezone)
			if err == nil {
				r.AppointmentStart = r.AppointmentStart.In(location)
				r.AppointmentEnd = r.AppointmentEnd.In(location)
			}
		}

		reservations = append(reservations, r)
	}
	return reservations
}

func (s *AppointmentService) CancelAppointment(appointmentID uuid.UUID, canceledBy, cancellationReason string) error {
	sqlQuery := `
		UPDATE appointments
		SET canceled = TRUE,
			canceled_by = $1,
			cancellation_reason = $2,
			cancellation_timestamp = NOW()
		WHERE appointment_id = $3;
	`

	tx, err := s.db.Begin(context.Background())
	if err != nil {
		log.Println("Transaction Error:", err)
		return fmt.Errorf("failed to begin transaction")
	}
	defer tx.Rollback(context.Background())

	_, err = tx.Exec(context.Background(), sqlQuery, canceledBy, cancellationReason, appointmentID)
	if err != nil {
		log.Println("Update Error:", err)
		return fmt.Errorf("failed to cancel appointment")
	}

	if err := tx.Commit(context.Background()); err != nil {
		log.Println("Commit Error:", err)
		return fmt.Errorf("failed to commit transaction")
	}

	return nil
}

func (s *AppointmentService) GetAppointmentByID(appointmentID string) (*models.Reservation, error) {
	var appointment models.Reservation

	query := `
		SELECT 
			apt.appointment_id,
			apt.appointment_start,
			apt.appointment_end,
			apt.doctor_id::text,
			apt.patient_id::text,
			di.first_name as doctor_first_name,
			COALESCE(di.first_name_ar, '') as doctor_first_name_ar,
			di.last_name as doctor_last_name,
			COALESCE(di.last_name_ar, '') as doctor_last_name_ar,
			di.specialty_code,
			COALESCE(pi.first_name, r.first_name, dp.first_name, '') as patient_first_name,
			COALESCE(pi.first_name_ar, r.first_name_ar, dp.first_name_ar, '') as patient_first_name_ar,
			COALESCE(pi.last_name, r.last_name, dp.last_name, '') as patient_last_name,
			COALESCE(pi.last_name_ar, r.last_name_ar, dp.last_name_ar, '') as patient_last_name_ar,
			CASE WHEN mr.report_id IS NOT NULL THEN true ELSE false END AS report_exists
		FROM 
			appointments apt
		JOIN 
			doctor_info di on di.doctor_id = apt.doctor_id
		LEFT JOIN 
			patient_info pi on pi.patient_id = apt.patient_id
		LEFT JOIN
			receptionists r ON r.receptionist_id = apt.patient_id
		LEFT JOIN
			doctor_info dp ON dp.doctor_id = apt.patient_id
		LEFT JOIN
			medical_reports mr ON mr.appointment_id = apt.appointment_id
		WHERE
			apt.appointment_id = $1;
	`

	err := s.db.QueryRow(context.Background(), query, appointmentID).Scan(
		&appointment.AppointmentID,
		&appointment.AppointmentStart,
		&appointment.AppointmentEnd,
		&appointment.DoctorID,
		&appointment.PatientID,
		&appointment.DoctorFirstName,
		&appointment.DoctorFirstNameAr,
		&appointment.DoctorLastName,
		&appointment.DoctorLastNameAr,
		&appointment.Specialty,
		&appointment.PatientFirstName,
		&appointment.PatientFirstNameAr,
		&appointment.PatientLastName,
		&appointment.PatientLastNameAr,
		&appointment.ReportExists,
	)
	if err != nil {
		log.Println("Query Error:", err)
		return nil, fmt.Errorf("appointment not found")
	}

	return &appointment, nil
}

func (s *AppointmentService) CreateReport(report models.MedicalReport) (*models.MedicalReport, error) {
	reportID := uuid.New()
	report.ReportID = reportID

	tx, err := s.db.Begin(context.Background())
	if err != nil {
		log.Println("Failed to begin transaction:", err)
		return nil, fmt.Errorf("failed to begin transaction")
	}
	defer tx.Rollback(context.Background())

	if report.ReferralDoctorID == nil && strings.TrimSpace(report.ReferralDoctorName) != "" {
		resolved, err := s.resolveReferralDoctorByNameTx(context.Background(), tx, report.ReferralDoctorName)
		if err != nil {
			log.Printf("Failed to resolve referral doctor by name: %v", err)
		} else if resolved != nil {
			report.ReferralDoctorID = &resolved.DoctorID
		}
	}

	query := `
		INSERT INTO medical_reports (
			report_id, appointment_id, doctor_id, patient_id, 
			patient_first_name, patient_last_name, doctor_first_name, doctor_last_name,
			report_content, diagnosis_made, diagnosis_name, diagnosis_details,
			referral_needed, referral_specialty, referral_doctor_name, referral_message,
			referral_doctor_id,
			created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
		RETURNING report_id
	`

	err = tx.QueryRow(context.Background(), query,
		report.ReportID,
		report.AppointmentID,
		report.DoctorID,
		report.PatientID,
		report.PatientFirstName,
		report.PatientLastName,
		report.DoctorFirstName,
		report.DoctorLastName,
		report.ReportContent,
		report.DiagnosisMade,
		report.DiagnosisName,
		report.DiagnosisDetails,
		report.ReferralNeeded,
		report.ReferralSpecialty,
		report.ReferralDoctorName,
		report.ReferralMessage,
		report.ReferralDoctorID,
	).Scan(&report.ReportID)

	if err != nil {
		log.Println("Failed to create report:", err)
		return nil, fmt.Errorf("failed to create report")
	}

	if len(report.Medications) > 0 {
		err = s.saveMedications(tx, report.ReportID, report.PatientID, report.DoctorID,
			fmt.Sprintf("%s %s", report.DoctorFirstName, report.DoctorLastName), report.Medications)
		if err != nil {
			log.Println("Failed to save medications:", err)
			return nil, fmt.Errorf("failed to save medications")
		}
	}

	if report.DiagnosisMade && report.DiagnosisName != nil && *report.DiagnosisName != "" {
		err = s.saveDiagnosisToHistory(tx, report.PatientID, report.DoctorID,
			fmt.Sprintf("%s %s", report.DoctorFirstName, report.DoctorLastName),
			*report.DiagnosisName, report.DiagnosisDetails)
		if err != nil {
			log.Println("Failed to save diagnosis to medical history:", err)
			return nil, fmt.Errorf("failed to save diagnosis to medical history")
		}
	}

	err = tx.Commit(context.Background())
	if err != nil {
		log.Println("Failed to commit transaction:", err)
		return nil, fmt.Errorf("failed to commit transaction")
	}

	return &report, nil
}

func (s *AppointmentService) saveMedications(tx pgx.Tx, reportID uuid.UUID, patientID string, doctorID uuid.UUID, doctorName string, medications []models.ReportMedication) error {
	if len(medications) == 0 {
		return nil
	}

	for i, med := range medications {
		if err := s.validateMedication(med); err != nil {
			log.Printf("Invalid medication at index %d: %v", i, err)
			return fmt.Errorf("invalid medication at index %d: %v", i, err)
		}

		medicationID := uuid.New()

		patientUUID, err := uuid.Parse(patientID)
		if err != nil {
			log.Printf("Failed to parse patient ID: %v", err)
			return fmt.Errorf("invalid patient ID")
		}

		query := `
			INSERT INTO medications (
				medication_id, patient_id, medication_name, dosage, frequency, 
				duration, instructions, prescribing_doctor_name, prescribing_doctor_id, 
				report_id, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
		`

		_, err = tx.Exec(context.Background(), query,
			medicationID,
			patientUUID,
			med.MedicationName,
			med.Dosage,
			med.Frequency,
			med.Duration,
			med.Instructions,
			doctorName,
			doctorID,
			reportID,
		)

		if err != nil {
			log.Printf("Failed to insert medication '%s': %v", med.MedicationName, err)
			return fmt.Errorf("failed to insert medication '%s': %v", med.MedicationName, err)
		}
	}

	return nil
}

func (s *AppointmentService) validateMedication(med models.ReportMedication) error {
	if strings.TrimSpace(med.MedicationName) == "" {
		return fmt.Errorf("medication name is required")
	}
	if strings.TrimSpace(med.Dosage) == "" {
		return fmt.Errorf("medication dosage is required")
	}
	if strings.TrimSpace(med.Frequency) == "" {
		return fmt.Errorf("medication frequency is required")
	}
	if strings.TrimSpace(med.Duration) == "" {
		return fmt.Errorf("medication duration is required")
	}
	return nil
}

func (s *AppointmentService) saveDiagnosisToHistory(tx pgx.Tx, patientID string, doctorID uuid.UUID, doctorName string, diagnosisName string, diagnosisDetails *string) error {
	historyID := uuid.New()

	patientUUID, err := uuid.Parse(patientID)
	if err != nil {
		log.Printf("Failed to parse patient ID: %v", err)
		return fmt.Errorf("invalid patient ID")
	}

	query := `
		INSERT INTO medical_diagnosis_history (
			diag_history_id, diagnosis_name, diagnosis_details, 
			diagnosis_doctor_name, diagnosis_doctor_id, diagnosis_patient_id, 
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
	`

	_, err = tx.Exec(context.Background(), query,
		historyID,
		diagnosisName,
		diagnosisDetails,
		doctorName,
		doctorID,
		patientUUID,
	)

	if err != nil {
		log.Printf("Failed to insert medical history: %v", err)
		return fmt.Errorf("failed to insert medical history")
	}

	return nil
}

func (s *AppointmentService) GetReports(userID, year, month, day, patientName, diagnosisName, referralDoctor string) ([]models.MedicalReport, error) {
	query := `
		SELECT 
			mr.report_id, 
			mr.appointment_id, 
			mr.doctor_id, 
			mr.patient_id, 
			mr.patient_first_name, 
			COALESCE(pi.first_name_ar, r.first_name_ar, dp.first_name_ar, '') as patient_first_name_ar,
			mr.patient_last_name, 
			COALESCE(pi.last_name_ar, r.last_name_ar, dp.last_name_ar, '') as patient_last_name_ar,
			mr.doctor_first_name, 
			COALESCE(di.first_name_ar, '') as doctor_first_name_ar,
			mr.doctor_last_name, 
			COALESCE(di.last_name_ar, '') as doctor_last_name_ar,
			mr.report_content, 
			mr.diagnosis_made, 
			mr.diagnosis_name, 
			mr.diagnosis_details, 
			mr.referral_needed, 
			mr.referral_specialty, 
			mr.referral_doctor_id,
			mr.referral_doctor_name, 
			COALESCE(rdi.first_name, '') as referral_doctor_first_name,
			COALESCE(rdi.first_name_ar, '') as referral_doctor_first_name_ar,
			COALESCE(rdi.last_name, '') as referral_doctor_last_name,
			COALESCE(rdi.last_name_ar, '') as referral_doctor_last_name_ar,
			mr.referral_message, 
			mr.created_at
		FROM 
			medical_reports mr
		JOIN
			doctor_info di ON di.doctor_id = mr.doctor_id
		LEFT JOIN
			doctor_info rdi ON rdi.doctor_id = mr.referral_doctor_id
		LEFT JOIN
			patient_info pi ON pi.patient_id = mr.patient_id
		LEFT JOIN
			receptionists r ON r.receptionist_id = mr.patient_id
		LEFT JOIN
			doctor_info dp ON dp.doctor_id = mr.patient_id
		WHERE 
			mr.doctor_id = $1::uuid`

	args := []interface{}{userID}
	argCount := 2

	if year != "" {
		query += fmt.Sprintf(" AND EXTRACT(YEAR FROM mr.created_at) = $%d", argCount)
		args = append(args, year)
		argCount++

		if month != "" {
			query += fmt.Sprintf(" AND EXTRACT(MONTH FROM mr.created_at) = $%d", argCount)
			args = append(args, month)
			argCount++

			if day != "" {
				query += fmt.Sprintf(" AND EXTRACT(DAY FROM mr.created_at) = $%d", argCount)
				args = append(args, day)
				argCount++
			}
		}
	}

	if patientName != "" {
		query += fmt.Sprintf(" AND LOWER(patient_first_name || ' ' || patient_last_name) LIKE $%d", argCount)
		args = append(args, "%"+strings.ToLower(patientName)+"%")
		argCount++
	}
	if diagnosisName != "" {
		query += fmt.Sprintf(" AND LOWER(diagnosis_name) LIKE $%d", argCount)
		args = append(args, "%"+strings.ToLower(diagnosisName)+"%")
		argCount++
	}
	if referralDoctor != "" {
		query += fmt.Sprintf(" AND LOWER(referral_doctor_name) LIKE $%d", argCount)
		args = append(args, "%"+strings.ToLower(referralDoctor)+"%")
		argCount++
	}

	query += " ORDER BY mr.created_at DESC"

	rows, err := s.db.Query(context.Background(), query, args...)
	if err != nil {
		log.Println("Query Error:", err)
		return nil, fmt.Errorf("failed to fetch reports")
	}
	defer rows.Close()

	var reports []models.MedicalReport
	resolvedByName := map[string]*resolvedReferralDoctor{}
	for rows.Next() {
		var report models.MedicalReport
		err := rows.Scan(
			&report.ReportID,
			&report.AppointmentID,
			&report.DoctorID,
			&report.PatientID,
			&report.PatientFirstName,
			&report.PatientFirstNameAr,
			&report.PatientLastName,
			&report.PatientLastNameAr,
			&report.DoctorFirstName,
			&report.DoctorFirstNameAr,
			&report.DoctorLastName,
			&report.DoctorLastNameAr,
			&report.ReportContent,
			&report.DiagnosisMade,
			&report.DiagnosisName,
			&report.DiagnosisDetails,
			&report.ReferralNeeded,
			&report.ReferralSpecialty,
			&report.ReferralDoctorID,
			&report.ReferralDoctorName,
			&report.ReferralDoctorFirstName,
			&report.ReferralDoctorFirstNameAr,
			&report.ReferralDoctorLastName,
			&report.ReferralDoctorLastNameAr,
			&report.ReferralMessage,
			&report.CreatedAt,
		)
		if err != nil {
			log.Println("Failed to scan report:", err)
			continue
		}

		medications, err := s.getMedicationsForReport(report.ReportID)
		if err != nil {
			log.Printf("Failed to fetch medications for report %s: %v", report.ReportID, err)
			report.Medications = []models.ReportMedication{}
		} else {
			report.Medications = medications
		}

		reports = append(reports, report)
	}

	for i := range reports {
		if reports[i].ReferralDoctorID != nil {
			continue
		}
		if strings.TrimSpace(reports[i].ReferralDoctorName) == "" {
			continue
		}

		key := strings.ToLower(normalizeReferralDoctorNameForMatch(reports[i].ReferralDoctorName))
		if key == "" {
			continue
		}

		var resolved *resolvedReferralDoctor
		if cached, ok := resolvedByName[key]; ok {
			resolved = cached
		} else {
			found, err := s.resolveReferralDoctorByName(context.Background(), reports[i].ReferralDoctorName)
			if err != nil {
				log.Printf("Failed to resolve referral doctor by name: %v", err)
				resolvedByName[key] = nil
				continue
			}
			resolvedByName[key] = found
			resolved = found
		}

		if resolved == nil {
			continue
		}

		reports[i].ReferralDoctorID = &resolved.DoctorID
		reports[i].ReferralDoctorFirstName = resolved.FirstName
		reports[i].ReferralDoctorFirstNameAr = resolved.FirstNameAr
		reports[i].ReferralDoctorLastName = resolved.LastName
		reports[i].ReferralDoctorLastNameAr = resolved.LastNameAr

		_, err := s.db.Exec(
			context.Background(),
			"UPDATE medical_reports SET referral_doctor_id = $1 WHERE report_id = $2 AND referral_doctor_id IS NULL",
			resolved.DoctorID,
			reports[i].ReportID,
		)
		if err != nil {
			log.Printf("Failed to backfill referral_doctor_id for report %s: %v", reports[i].ReportID, err)
		}
	}

	return reports, nil
}

func (s *AppointmentService) getMedicationsForReport(reportID uuid.UUID) ([]models.ReportMedication, error) {
	query := `
		SELECT medication_name, dosage, frequency, duration, instructions
		FROM medications
		WHERE report_id = $1
		ORDER BY medication_name ASC, created_at ASC
	`

	rows, err := s.db.Query(context.Background(), query, reportID)
	if err != nil {
		log.Printf("Failed to query medications for report %s: %v", reportID, err)
		return nil, fmt.Errorf("failed to query medications")
	}
	defer rows.Close()

	var medications []models.ReportMedication
	for rows.Next() {
		var med models.ReportMedication
		err := rows.Scan(&med.MedicationName, &med.Dosage, &med.Frequency, &med.Duration, &med.Instructions)
		if err != nil {
			log.Printf("Failed to scan medication: %v", err)
			continue
		}
		medications = append(medications, med)
	}

	return medications, nil
}

func (s *AppointmentService) GetPatientMedications(patientID string) ([]models.Medications, error) {
	patientUUID, err := uuid.Parse(patientID)
	if err != nil {
		log.Printf("Failed to parse patient ID: %v", err)
		return nil, fmt.Errorf("invalid patient ID")
	}

	query := `
		SELECT 
			medication_id, patient_id, medication_name, dosage, frequency, 
			duration, instructions, prescribing_doctor_name, prescribing_doctor_id, 
			report_id, created_at, updated_at
		FROM medications
		WHERE patient_id = $1
		ORDER BY created_at DESC
	`

	rows, err := s.db.Query(context.Background(), query, patientUUID)
	if err != nil {
		log.Printf("Failed to query patient medications: %v", err)
		return nil, fmt.Errorf("failed to query patient medications")
	}
	defer rows.Close()

	var medications []models.Medications
	for rows.Next() {
		var med models.Medications
		err := rows.Scan(
			&med.MedicationID,
			&med.PatientID,
			&med.MedicationName,
			&med.Dosage,
			&med.Frequency,
			&med.Duration,
			&med.Instructions,
			&med.PrescribingDoctorName,
			&med.PrescribingDoctorID,
			&med.ReportID,
			&med.CreatedAt,
			&med.UpdatedAt,
		)
		if err != nil {
			log.Printf("Failed to scan patient medication: %v", err)
			continue
		}
		medications = append(medications, med)
	}

	return medications, nil
}

func (s *AppointmentService) SearchDoctorsForReferral(searchQuery, specialty string, limit int) ([]models.Doctor, error) {
	query := `
		SELECT 
			doctor_id,
			first_name,
			COALESCE(first_name_ar, '') as first_name_ar,
			last_name,
			COALESCE(last_name_ar, '') as last_name_ar,
			specialty_code,
			experience,
			rating_score,
			rating_count
		FROM 
			doctor_info 
		WHERE 
			1=1`

	args := []interface{}{}
	argCount := 1

	if searchQuery != "" {
		q := strings.TrimSpace(searchQuery)
		qLower := strings.ToLower(q)
		if strings.HasPrefix(qLower, "dr. ") {
			q = strings.TrimSpace(q[4:])
		} else if strings.HasPrefix(qLower, "dr ") {
			q = strings.TrimSpace(q[3:])
		} else if qLower == "dr" || qLower == "dr." {
			q = ""
		}

		q = strings.TrimSpace(q)
		if strings.HasPrefix(q, "د. ") {
			q = strings.TrimSpace(q[3:])
		} else if strings.HasPrefix(q, "د.") {
			q = strings.TrimSpace(q[2:])
		} else if strings.HasPrefix(q, "د ") {
			q = strings.TrimSpace(q[2:])
		} else if q == "د" || q == "د." {
			q = ""
		}

		arabicNorm := strings.NewReplacer(
			"أ", "ا",
			"إ", "ا",
			"آ", "ا",
			"ى", "ي",
			"ة", "ه",
			"ؤ", "و",
			"ئ", "ي",
		).Replace(strings.ToLower(strings.TrimSpace(q)))

		query += fmt.Sprintf(
			" AND ("+
				"LOWER(first_name || ' ' || last_name) LIKE $%d "+
				"OR translate(LOWER(COALESCE(first_name_ar, '') || ' ' || COALESCE(last_name_ar, '')), 'أإآىةؤئ', 'ااايهوي') LIKE $%d "+
				"OR translate(LOWER(COALESCE(last_name_ar, '') || ' ' || COALESCE(first_name_ar, '')), 'أإآىةؤئ', 'ااايهوي') LIKE $%d "+
				"OR LOWER(specialty_code) LIKE $%d"+
				")",
			argCount, argCount, argCount, argCount,
		)
		args = append(args, "%"+arabicNorm+"%")
		argCount++
	}

	if specialty != "" {
		norm := strings.ToLower(strings.TrimSpace(specialty))
		norm = strings.ReplaceAll(norm, " ", "")
		norm = strings.ReplaceAll(norm, "_", "")
		norm = strings.ReplaceAll(norm, "-", "")
		query += fmt.Sprintf(" AND regexp_replace(LOWER(specialty_code), '[^a-z0-9]+', '', 'g') LIKE $%d", argCount)
		args = append(args, "%"+norm+"%")
		argCount++
	}

	query += " ORDER BY rating_score DESC, experience DESC"

	query += fmt.Sprintf(" LIMIT $%d", argCount)
	args = append(args, limit)

	rows, err := s.db.Query(context.Background(), query, args...)
	if err != nil {
		log.Printf("Failed to search doctors for referral: %v", err)
		return nil, fmt.Errorf("error searching doctors for referral: %v", err)
	}
	defer rows.Close()

	var doctors []models.Doctor
	for rows.Next() {
		var doctor models.Doctor
		err := rows.Scan(
			&doctor.DoctorID,
			&doctor.FirstName,
			&doctor.FirstNameAr,
			&doctor.LastName,
			&doctor.LastNameAr,
			&doctor.Specialty,
			&doctor.Experience,
			&doctor.RatingScore,
			&doctor.RatingCount,
		)
		if err != nil {
			continue
		}

		doctors = append(doctors, doctor)
	}
	return doctors, nil
}

func (s *AppointmentService) AddDoctorException(doctorID string, exception models.DoctorException) error {
	_, err := s.db.Exec(context.Background(),
		`INSERT INTO doctor_exception (doctor_id, date, start_time, end_time, type)
		 VALUES ($1, $2, $3, $4, $5)`,
		doctorID, exception.Date, exception.StartTime, exception.EndTime, exception.Type)
	if err != nil {
		log.Printf("Failed to add doctor exception: %v", err)
		return fmt.Errorf("failed to add exception")
	}
	return nil
}

func (s *AppointmentService) GetReservationsCount(userID, userType, appointmentType string) (map[string]int, error) {
	var asDoctorCount, asPatientCount int

	if userType == "patient" {
		asPatientCount = s.getPatientReservationsCount(userID, appointmentType)
	} else if userType == "doctor" {
		asDoctorCount = s.getDoctorReservationsAsDoctorCount(userID, appointmentType)
		asPatientCount = s.getDoctorReservationsAsPatientCount(userID, appointmentType)
	}

	return map[string]int{
		"as_patient": asPatientCount,
		"as_doctor":  asDoctorCount,
	}, nil
}

func (s *AppointmentService) getPatientReservationsCount(userID, appointmentType string) int {
	var query string
	var count int

	currentTime := time.Now().UTC()
	if appointmentType == "canceled" {
		query = `
			SELECT COUNT(*)
			FROM appointments
			JOIN doctor_info ON appointments.doctor_id = doctor_info.doctor_id
			JOIN patient_info ON appointments.patient_id = patient_info.patient_id
			WHERE appointments.patient_id = $1 AND appointments.canceled = true;`
		err := s.db.QueryRow(context.Background(), query, userID).Scan(&count)
		if err != nil {
			log.Printf("Error fetching canceled appointments for patient: %v", err)
			return 0
		}
	} else {
		query = `
			SELECT COUNT(*)
			FROM appointments
			JOIN doctor_info ON appointments.doctor_id = doctor_info.doctor_id
			JOIN patient_info ON appointments.patient_id = patient_info.patient_id
			WHERE appointments.patient_id = $1 AND appointments.canceled = false
			AND appointments.appointment_end < $2;`
		err := s.db.QueryRow(context.Background(), query, userID, currentTime).Scan(&count)
		if err != nil {
			log.Printf("Error fetching completed appointments for patient: %v", err)
			return 0
		}
	}

	return count
}

func (s *AppointmentService) getDoctorReservationsAsDoctorCount(userID, appointmentType string) int {
	var query string
	var count int

	currentTime := time.Now().UTC()
	if appointmentType == "canceled" {
		query = `
			SELECT COUNT(*)
			FROM appointments
			WHERE appointments.doctor_id = $1 AND appointments.canceled = true;`
		err := s.db.QueryRow(context.Background(), query, userID).Scan(&count)
		if err != nil {
			log.Printf("Error fetching canceled appointments for doctor: %v", err)
			return 0
		}
	} else {
		query = `
			SELECT COUNT(*)
			FROM appointments
			WHERE appointments.doctor_id = $1 AND appointments.canceled = false
			AND appointments.appointment_end < $2;`
		err := s.db.QueryRow(context.Background(), query, userID, currentTime).Scan(&count)
		if err != nil {
			log.Printf("Error fetching completed appointments for doctor: %v", err)
			return 0
		}
	}

	return count
}

func (s *AppointmentService) getDoctorReservationsAsPatientCount(userID, appointmentType string) int {
	var query string
	var count int

	currentTime := time.Now().UTC()
	if appointmentType == "canceled" {
		query = `
			SELECT COUNT(*)
			FROM appointments
			WHERE appointments.patient_id = $1 AND appointments.canceled = true;`
		err := s.db.QueryRow(context.Background(), query, userID).Scan(&count)
		if err != nil {
			log.Printf("Error fetching canceled appointments for doctor as patient: %v", err)
			return 0
		}
	} else {
		query = `
			SELECT COUNT(*)
			FROM appointments
			WHERE appointments.patient_id = $1 AND appointments.canceled = false
			AND appointments.appointment_end < $2;`
		err := s.db.QueryRow(context.Background(), query, userID, currentTime).Scan(&count)
		if err != nil {
			log.Printf("Error fetching completed appointments for doctor as patient: %v", err)
			return 0
		}
	}

	return count
}

func (s *AppointmentService) GetReport(reportID string) (*models.MedicalReport, error) {
	var report models.MedicalReport
	err := s.db.QueryRow(context.Background(),
		`SELECT 
			mr.report_id,
			mr.appointment_id,
			mr.doctor_id,
			mr.patient_id,
			mr.patient_first_name,
			COALESCE(pi.first_name_ar, r.first_name_ar, dp.first_name_ar, '') as patient_first_name_ar,
			mr.patient_last_name,
			COALESCE(pi.last_name_ar, r.last_name_ar, dp.last_name_ar, '') as patient_last_name_ar,
			mr.doctor_first_name,
			COALESCE(di.first_name_ar, '') as doctor_first_name_ar,
			mr.doctor_last_name,
			COALESCE(di.last_name_ar, '') as doctor_last_name_ar,
			mr.report_content,
			mr.diagnosis_made,
			mr.diagnosis_name,
			mr.diagnosis_details,
			mr.referral_needed,
			mr.referral_specialty,
			mr.referral_doctor_id,
			mr.referral_doctor_name,
			COALESCE(rdi.first_name, '') as referral_doctor_first_name,
			COALESCE(rdi.first_name_ar, '') as referral_doctor_first_name_ar,
			COALESCE(rdi.last_name, '') as referral_doctor_last_name,
			COALESCE(rdi.last_name_ar, '') as referral_doctor_last_name_ar,
			mr.referral_message,
			mr.created_at
		FROM medical_reports mr
		JOIN doctor_info di ON di.doctor_id = mr.doctor_id
		LEFT JOIN doctor_info rdi ON rdi.doctor_id = mr.referral_doctor_id
		LEFT JOIN patient_info pi ON pi.patient_id = mr.patient_id
		LEFT JOIN receptionists r ON r.receptionist_id = mr.patient_id
		LEFT JOIN doctor_info dp ON dp.doctor_id = mr.patient_id
		WHERE mr.report_id = $1::uuid`, reportID,
	).Scan(
		&report.ReportID,
		&report.AppointmentID,
		&report.DoctorID,
		&report.PatientID,
		&report.PatientFirstName,
		&report.PatientFirstNameAr,
		&report.PatientLastName,
		&report.PatientLastNameAr,
		&report.DoctorFirstName,
		&report.DoctorFirstNameAr,
		&report.DoctorLastName,
		&report.DoctorLastNameAr,
		&report.ReportContent,
		&report.DiagnosisMade,
		&report.DiagnosisName,
		&report.DiagnosisDetails,
		&report.ReferralNeeded,
		&report.ReferralSpecialty,
		&report.ReferralDoctorID,
		&report.ReferralDoctorName,
		&report.ReferralDoctorFirstName,
		&report.ReferralDoctorFirstNameAr,
		&report.ReferralDoctorLastName,
		&report.ReferralDoctorLastNameAr,
		&report.ReferralMessage,
		&report.CreatedAt,
	)

	if err != nil {
		log.Printf("Failed to retrieve report: %v", err)
		return nil, fmt.Errorf("failed to retrieve report")
	}

	if report.ReferralDoctorID == nil && strings.TrimSpace(report.ReferralDoctorName) != "" {
		resolved, err := s.resolveReferralDoctorByName(context.Background(), report.ReferralDoctorName)
		if err != nil {
			log.Printf("Failed to resolve referral doctor by name: %v", err)
		} else if resolved != nil {
			report.ReferralDoctorID = &resolved.DoctorID
			report.ReferralDoctorFirstName = resolved.FirstName
			report.ReferralDoctorFirstNameAr = resolved.FirstNameAr
			report.ReferralDoctorLastName = resolved.LastName
			report.ReferralDoctorLastNameAr = resolved.LastNameAr

			_, backfillErr := s.db.Exec(
				context.Background(),
				"UPDATE medical_reports SET referral_doctor_id = $1 WHERE report_id = $2::uuid AND referral_doctor_id IS NULL",
				resolved.DoctorID,
				reportID,
			)
			if backfillErr != nil {
				log.Printf("Failed to backfill referral_doctor_id for report %s: %v", reportID, backfillErr)
			}
		}
	}

	medications, err := s.getMedicationsForReport(report.ReportID)
	if err != nil {
		log.Printf("Failed to fetch medications for report %s: %v", report.ReportID, err)
		return nil, fmt.Errorf("failed to fetch medications for report %s: %v", report.ReportID, err)
	}
	report.Medications = medications

	return &report, nil
}

func (s *AppointmentService) UpdateReport(reportID string, updateData models.MedicalReport) error {
	tx, err := s.db.Begin(context.Background())
	if err != nil {
		log.Printf("Failed to begin transaction: %v", err)
		return fmt.Errorf("failed to begin transaction")
	}
	defer tx.Rollback(context.Background())

	if updateData.ReferralDoctorID == nil && strings.TrimSpace(updateData.ReferralDoctorName) != "" {
		resolved, err := s.resolveReferralDoctorByNameTx(context.Background(), tx, updateData.ReferralDoctorName)
		if err != nil {
			log.Printf("Failed to resolve referral doctor by name: %v", err)
		} else if resolved != nil {
			updateData.ReferralDoctorID = &resolved.DoctorID
		}
	}

	var currentDiagnosisMade bool
	var currentDiagnosisName *string
	err = tx.QueryRow(context.Background(),
		"SELECT diagnosis_made, diagnosis_name FROM medical_reports WHERE report_id = $1::uuid",
		reportID).Scan(&currentDiagnosisMade, &currentDiagnosisName)

	if err != nil {
		log.Printf("Failed to fetch current report data: %v", err)
		return fmt.Errorf("failed to fetch current report data")
	}

	_, err = tx.Exec(
		context.Background(),
		`UPDATE medical_reports 
		SET 
			diagnosis_made = $1, diagnosis_name = $2, diagnosis_details = $3, report_content = $4,
			referral_needed = $5, referral_specialty = $6, referral_doctor_name = $7,
			referral_message = $8, referral_doctor_id = $9
		WHERE report_id = $10::uuid`,
		updateData.DiagnosisMade, updateData.DiagnosisName, updateData.DiagnosisDetails, updateData.ReportContent,
		updateData.ReferralNeeded, updateData.ReferralSpecialty, updateData.ReferralDoctorName,
		updateData.ReferralMessage, updateData.ReferralDoctorID, reportID,
	)

	if err != nil {
		log.Printf("Failed to update report: %v", err)
		return fmt.Errorf("failed to update report")
	}

	reportUUID, err := uuid.Parse(reportID)
	if err != nil {
		log.Printf("Failed to parse report ID: %v", err)
		return fmt.Errorf("invalid report ID")
	}

	_, err = tx.Exec(context.Background(), "DELETE FROM medications WHERE report_id = $1", reportUUID)
	if err != nil {
		log.Printf("Failed to delete existing medications: %v", err)
		return fmt.Errorf("failed to delete existing medications")
	}

	if len(updateData.Medications) > 0 {
		doctorName := fmt.Sprintf("%s %s", updateData.DoctorFirstName, updateData.DoctorLastName)
		err = s.saveMedications(tx, reportUUID, updateData.PatientID, updateData.DoctorID, doctorName, updateData.Medications)
		if err != nil {
			log.Printf("Failed to save updated medications: %v", err)
			return fmt.Errorf("failed to save updated medications")
		}
	}

	diagnosisChanged := false
	if !currentDiagnosisMade && updateData.DiagnosisMade {
		diagnosisChanged = true
	} else if currentDiagnosisMade && updateData.DiagnosisMade {
		if (currentDiagnosisName == nil && updateData.DiagnosisName != nil) ||
			(currentDiagnosisName != nil && updateData.DiagnosisName != nil && *currentDiagnosisName != *updateData.DiagnosisName) {
			diagnosisChanged = true
		}
	}

	if diagnosisChanged && updateData.DiagnosisMade && updateData.DiagnosisName != nil && *updateData.DiagnosisName != "" {
		doctorName := fmt.Sprintf("%s %s", updateData.DoctorFirstName, updateData.DoctorLastName)
		err = s.saveDiagnosisToHistory(tx, updateData.PatientID, updateData.DoctorID, doctorName,
			*updateData.DiagnosisName, updateData.DiagnosisDetails)
		if err != nil {
			log.Printf("Failed to save diagnosis to medical history: %v", err)
			return fmt.Errorf("failed to save diagnosis to medical history")
		}
	}

	err = tx.Commit(context.Background())
	if err != nil {
		log.Printf("Failed to commit transaction: %v", err)
		return fmt.Errorf("failed to commit transaction")
	}

	return nil
}

func (s *AppointmentService) DeleteReport(reportID string) error {
	var exists bool
	err := s.db.QueryRow(context.Background(),
		"SELECT EXISTS(SELECT 1 FROM medical_reports WHERE report_id = $1::uuid)", reportID).Scan(&exists)
	if err != nil {
		log.Printf("Failed to check report existence: %v", err)
		return fmt.Errorf("failed to check report existence")
	}

	if !exists {
		return fmt.Errorf("report not found")
	}

	_, err = s.db.Exec(context.Background(), "DELETE FROM medical_reports WHERE report_id = $1::uuid", reportID)
	if err != nil {
		log.Printf("Failed to delete report: %v", err)
		return fmt.Errorf("failed to delete report")
	}

	return nil
}
