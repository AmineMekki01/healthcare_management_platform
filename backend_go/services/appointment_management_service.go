package services

import (
	"backend_go/models"
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v4/pgxpool"
)

func GetAvailabilities(c *gin.Context, pool *pgxpool.Pool) {
	doctorId := c.DefaultQuery("doctorId", "")
	day := c.DefaultQuery("day", "")
	currentTime := c.DefaultQuery("currentTime", "")
	timeZone := c.DefaultQuery("timeZone", "")

	const customDateFormat = "2006-01-02"
	dayStart, err := time.Parse(customDateFormat, day)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid day format"})
		return
	}

	dayEnd := dayStart.AddDate(0, 0, 1)
	location, err := time.LoadLocation(timeZone)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid time zone"})
		return
	}

	localCurrentTime, err := time.ParseInLocation(time.RFC3339, currentTime, location)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid current time format"})
		return
	}

	rows, err := pool.Query(context.Background(),
		"SELECT availability_id, availability_start, availability_end, doctor_id FROM availabilities WHERE doctor_id = $1 AND availability_start >= $2 AND availability_end < $3 AND availability_start >= $4",
		doctorId, dayStart, dayEnd, localCurrentTime)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var availabilities []models.Availability
	berlinLocation, _ := time.LoadLocation("Europe/Berlin")
	for rows.Next() {
		var availability models.Availability
		err := rows.Scan(&availability.AvailabilityID, &availability.AvailabilityStart, &availability.AvailabilityEnd, &availability.DoctorID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		availability.AvailabilityStart = availability.AvailabilityStart.In(berlinLocation)
		availability.AvailabilityEnd = availability.AvailabilityEnd.In(berlinLocation)
		availabilities = append(availabilities, availability)
	}

	c.JSON(http.StatusOK, availabilities)
}

// Implement POST /api/v1/reservations
func CreateReservation(c *gin.Context, pool *pgxpool.Pool) {
	var appointment models.Appointments

	if err := c.ShouldBindJSON(&appointment); err != nil {
		log.Println("Bind Error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	userType, exists := c.Get("userType")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User type not found"})
		return
	}

	isDoctorPatient := false
	if userType == "doctor" {
		isDoctorPatient = true
	}

	conn, err := pool.Acquire(context.Background())
	if err != nil {
		log.Println("Connection Error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return
	}
	defer conn.Release()

	tx, err := conn.Begin(context.Background())
	if err != nil {
		log.Println("Transaction Error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return
	}

	_, err = tx.Exec(context.Background(),
		"INSERT INTO appointments (appointment_start, appointment_end, title, doctor_id, patient_id, is_doctor_patient) VALUES ($1, $2, $3, $4, $5, $6)",
		appointment.AppointmentStart, appointment.AppointmentEnd, appointment.AppointmentTitle, appointment.DoctorID, appointment.PatientID, isDoctorPatient)

	if err != nil {
		log.Println("Insert Error:", err)
		tx.Rollback(context.Background())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return
	}
	// Delete availability
	_, err = tx.Exec(context.Background(), "DELETE FROM availabilities WHERE availability_id = $1", appointment.AvailabilityID)
	if err != nil {
		log.Println("Delete Error:", err)
		tx.Rollback(context.Background())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return
	}

	tx.Commit(context.Background())
	c.JSON(http.StatusCreated, gin.H{"message": "Appointment booked and availability removed successfully"})
}

func GetPatientReservations(c *gin.Context, pool *pgxpool.Pool, userID string, userType string, timezone string) []models.Reservation {

	query := `
		SELECT 
			appointments.appointment_id,
			appointments.appointment_start,
			appointments.appointment_end,
			doctor_info.first_name,
			doctor_info.last_name,
			doctor_info.specialty,
			patient_info.first_name AS patient_first_name,
			patient_info.last_name AS patient_last_name,
			patient_info.age,
			patient_info.patient_id,
			doctor_info.doctor_id,
			appointments.is_doctor_patient,
			appointments.canceled,
			appointments.canceled_by,
			appointments.cancellation_reason,
			appointments.cancellation_timestamp
		FROM 
			appointments
		JOIN
			doctor_info ON appointments.doctor_id = doctor_info.doctor_id
		JOIN
			patient_info ON appointments.patient_id = patient_info.patient_id
		WHERE
			appointments.patient_id = $1;
	`
	rows, err := pool.Query(context.Background(), query, userID)
	if err != nil {
		log.Println("Query Error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return []models.Reservation{}
	}
	defer rows.Close()

	var reservations []models.Reservation
	for rows.Next() {
		var r models.Reservation
		err := rows.Scan(
			&r.ReservationID,
			&r.ReservationStart,
			&r.ReservationEnd,
			&r.DoctorFirstName,
			&r.DoctorLastName,
			&r.Specialty,
			&r.PatientFirstName,
			&r.PatientLastName,
			&r.Age,
			&r.PatientID,
			&r.DoctorID,
			&r.IsDoctorPatient,
			&r.Canceled,
			&r.CanceledBy,
			&r.CancellationReason,
			&r.CancellationTimestamp,
		)
		if err != nil {
			log.Println("Row Scan Error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
			return []models.Reservation{}
		}
		location, err := time.LoadLocation(timezone)
		if err != nil {
			log.Println("Timezone Error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
			return []models.Reservation{}
		}

		r.ReservationStart = r.ReservationStart.In(location)
		r.ReservationEnd = r.ReservationEnd.In(location)

		reservations = append(reservations, r)

	}
	return reservations
}

func GetDoctorReservationsAsDoctor(c *gin.Context, pool *pgxpool.Pool, userID string, userType string, timezone string) []models.Reservation {

	query := `
		SELECT 
			appointments.appointment_id,
			appointments.appointment_start,
			appointments.appointment_end,
			doctor_info.first_name,
			doctor_info.last_name,
			doctor_info.specialty,
			patient_info.first_name AS patient_first_name,
			patient_info.last_name AS patient_last_name,
			patient_info.age,
			patient_info.patient_id,
			doctor_info.doctor_id,
			appointments.is_doctor_patient,
			appointments.canceled,
			appointments.canceled_by,
			appointments.cancellation_reason,
			appointments.cancellation_timestamp,
			COALESCE(medical_reports.report_id IS NOT NULL, false) AS report_exists
		FROM 
			appointments
		JOIN
			doctor_info ON appointments.doctor_id = doctor_info.doctor_id
		JOIN
			patient_info ON appointments.patient_id = patient_info.patient_id
		LEFT JOIN 
			medical_reports ON appointments.appointment_id = medical_reports.appointment_id
		WHERE
			appointments.doctor_id = $1;
	`
	rows, err := pool.Query(context.Background(), query, userID)
	if err != nil {
		log.Println("Query Error in GetDoctorReservationsAsDoctor:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return []models.Reservation{}
	}
	defer rows.Close()

	var reservations []models.Reservation
	for rows.Next() {
		var r models.Reservation
		err := rows.Scan(
			&r.ReservationID,
			&r.ReservationStart,
			&r.ReservationEnd,
			&r.DoctorFirstName,
			&r.DoctorLastName,
			&r.Specialty,
			&r.PatientFirstName,
			&r.PatientLastName,
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
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
			return []models.Reservation{}
		}
		location, err := time.LoadLocation(timezone)
		if err != nil {
			log.Println("Timezone Error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
			return []models.Reservation{}
		}

		r.ReservationStart = r.ReservationStart.In(location)
		r.ReservationEnd = r.ReservationEnd.In(location)

		reservations = append(reservations, r)

	}
	return reservations
}

func GetDoctorReservationsAsPatient(c *gin.Context, pool *pgxpool.Pool, userID string, userType string, timezone string) []models.Reservation {
	checkQuery := `
		SELECT EXISTS (
			SELECT 1 
			FROM appointments
			WHERE appointments.patient_id = $1 AND appointments.is_doctor_patient = true
		)
	`
	var exist bool
	err := pool.QueryRow(context.Background(), checkQuery, userID).Scan(&exist)
	if err != nil {
		log.Println("Query Error in GetDoctorReservationsAsPatient : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return []models.Reservation{}
	}

	if !exist {
		log.Println("No reservations found for the patient")
		return []models.Reservation{}
	}

	query := `
        SELECT 
            appointments.appointment_id,
            appointments.appointment_start,
            appointments.appointment_end,
            doctor_info.first_name AS doctor_first_name,
            doctor_info.last_name AS doctor_last_name,
            doctor_info.specialty,
            CASE 
				WHEN appointments.is_doctor_patient = true THEN doctor_patient.first_name
				ELSE NULL
			END AS patient_first_name,
			CASE 
				WHEN appointments.is_doctor_patient = true THEN doctor_patient.last_name
				ELSE NULL
			END AS patient_last_name,
			CASE
				WHEN appointments.is_doctor_patient = true THEN doctor_patient.age
				ELSE NULL
			END AS age,
			appointments.patient_id,
			appointments.doctor_id,
			appointments.is_doctor_patient,
			appointments.canceled,
			appointments.canceled_by,
			appointments.cancellation_reason,
			appointments.cancellation_timestamp
        FROM 
            appointments
         JOIN
        doctor_info ON appointments.doctor_id = doctor_info.doctor_id
		LEFT JOIN
			doctor_info AS doctor_patient ON appointments.patient_id = doctor_patient.doctor_id
		WHERE 
        	appointments.patient_id = $1 AND appointments.is_doctor_patient = true;
    `

	rows, err := pool.Query(context.Background(), query, userID)
	if err != nil {
		log.Println("Query Error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return []models.Reservation{}
	}
	defer rows.Close()

	var reservations []models.Reservation
	for rows.Next() {
		var r models.Reservation
		err := rows.Scan(
			&r.ReservationID,
			&r.ReservationStart,
			&r.ReservationEnd,
			&r.DoctorFirstName,
			&r.DoctorLastName,
			&r.Specialty,
			&r.PatientFirstName,
			&r.PatientLastName,
			&r.Age,
			&r.PatientID,
			&r.DoctorID,
			&r.IsDoctorPatient,
			&r.Canceled,
			&r.CanceledBy,
			&r.CancellationReason,
			&r.CancellationTimestamp,
		)
		if err != nil {
			log.Println("Row Scan Error in GetDoctorReservationsAsPatient :", err)
			continue
		}

		reservations = append(reservations, r)

	}

	return reservations
}

// Implement GET /api/v1/reservations
func GetReservations(c *gin.Context, pool *pgxpool.Pool) {
	userID := c.DefaultQuery("user_id", "")
	userType := c.DefaultQuery("user_type", "")
	timezone := c.DefaultQuery("timezone", "UTC")

	if userID == "" {
		log.Println("Bad Request: user_id required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad Request: doctor_id or patient_id required"})
		return
	}
	if userType == "" {
		log.Println("Bad Request: user_type required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad Request: user_type required"})
		return
	}

	var reservations []models.Reservation

	if userType == "patient" {
		reservations = GetPatientReservations(c, pool, userID, userType, timezone)

	} else if userType == "doctor" {
		regularReservations := GetDoctorReservationsAsDoctor(c, pool, userID, userType, timezone)
		doctorPatientReservations := GetDoctorReservationsAsPatient(c, pool, userID, userType, timezone)
		log.Println("regularReservations :", regularReservations)
		log.Println("doctorPatientReservations :", doctorPatientReservations)

		reservations = append(regularReservations, doctorPatientReservations...)
	}
	log.Println("reservations :", reservations)
	c.JSON(http.StatusOK, reservations)
}

type CancelInfo struct {
	CanceledBy         string `json:"canceled_by"`
	CancellationReason string `json:"cancellation_reason"`
	AppointmentIdStr   string `json:"appointment_id"`
}

func CancelAppointment(c *gin.Context, pool *pgxpool.Pool) {
	var cancelInfo CancelInfo
	if err := c.ShouldBindJSON(&cancelInfo); err != nil {
		log.Println("Bind Error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	log.Println("canceledBy : ", cancelInfo.CanceledBy)
	log.Println("cancellationReason : ", cancelInfo.CancellationReason)
	log.Println("appointmentIdStr : ", cancelInfo.AppointmentIdStr)
	appointmentID, err := uuid.Parse(cancelInfo.AppointmentIdStr)
	if err != nil {
		log.Println("Invalid Appointment ID : ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}
	sqlQuery := `
	UPDATE appointments
	SET canceled = TRUE, 
		canceled_by = $1,
		cancellation_reason = $2,
		cancellation_timestamp = NOW()
	WHERE appointment_id = $3;
	`
	conn, err := pool.Acquire(context.Background())
	if err != nil {
		log.Println("Connection Error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error While Connection to db."})
		return
	}
	defer conn.Release()

	tx, err := conn.Begin(context.Background())
	if err != nil {
		log.Println("Transaction Error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error While Transaction."})
		return
	}

	_, err = tx.Exec(context.Background(), sqlQuery,
		cancelInfo.CanceledBy, cancelInfo.CancellationReason, appointmentID)
	if err != nil {
		log.Println("Insert Error:", err)
		tx.Rollback(context.Background())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error When Executing The Query."})
		return
	}
	tx.Commit(context.Background())
	c.JSON(http.StatusCreated, gin.H{"message": "Appointment Canceled Successfully"})
}

func GetPatientReservationsCount(c *gin.Context, pool *pgxpool.Pool, userID string, userType string, timezone string, appointmentType string) int {
	var query string
	var canceledCount int

	currentTime := time.Now().UTC()
	if appointmentType == "canceled" {
		query = `
			SELECT 
				count(*)
			FROM 
				appointments
			JOIN
				doctor_info ON appointments.doctor_id = doctor_info.doctor_id
			JOIN
				patient_info ON appointments.patient_id = patient_info.patient_id
			WHERE
				appointments.patient_id = $1 
				AND 
				appointments.canceled = true;
		`
		err := pool.QueryRow(context.Background(), query, userID).Scan(&canceledCount)

		if err != nil {
			log.Printf("Error fetching canceled appointments for patient: %v", err)
			return 0
		}
	} else {
		query = `
			SELECT 
				count(*)
			FROM 
				appointments
			JOIN
				doctor_info ON appointments.doctor_id = doctor_info.doctor_id
			JOIN
				patient_info ON appointments.patient_id = patient_info.patient_id
			WHERE
				appointments.patient_id = $1 
				AND 
				appointments.canceled = false
				AND 
				appointments.appointment_end < $2;
		`
		err := pool.QueryRow(context.Background(), query, userID, currentTime).Scan(&canceledCount)

		if err != nil {
			log.Printf("Error fetching canceled appointments for patient: %v", err)
			return 0
		}
	}

	return canceledCount
}

func GetDoctorReservationsAsDoctorCount(c *gin.Context, pool *pgxpool.Pool, userID string, userType string, timezone string, appointmentType string) int {
	var query string
	var canceledCount int
	currentTime := time.Now().UTC()
	if appointmentType == "canceled" {
		query = `
			SELECT 
				count(*)
			FROM 
				appointments
			JOIN
				doctor_info ON appointments.doctor_id = doctor_info.doctor_id
			JOIN
				patient_info ON appointments.patient_id = patient_info.patient_id
			WHERE
				appointments.doctor_id = $1 
				AND 
				appointments.canceled = true;
		`
		err := pool.QueryRow(context.Background(), query, userID).Scan(&canceledCount)

		if err != nil {
			log.Printf("Error fetching canceled appointments for patient: %v", err)
			return 0
		}
	} else {
		query = `
			SELECT 
				count(*)
			FROM 
				appointments
			JOIN
				doctor_info ON appointments.doctor_id = doctor_info.doctor_id
			JOIN
				patient_info ON appointments.patient_id = patient_info.patient_id
			WHERE
				appointments.doctor_id = $1 
				AND 
				appointments.canceled = false
				AND 
				appointments.appointment_end < $2;
		`
		err := pool.QueryRow(context.Background(), query, userID, currentTime).Scan(&canceledCount)

		if err != nil {
			log.Printf("Error fetching canceled appointments for patient: %v", err)
			return 0
		}
	}

	return canceledCount
}

func GetDoctorReservationsAsPatientCount(c *gin.Context, pool *pgxpool.Pool, userID string, userType string, timezone string, appointmentType string) int {

	checkQuery := `
		SELECT EXISTS (
			SELECT 1 
			FROM appointments
			WHERE appointments.patient_id = $1 AND appointments.is_doctor_patient = true
		)
	`
	var exist bool
	err := pool.QueryRow(context.Background(), checkQuery, userID).Scan(&exist)
	if err != nil {
		log.Println("Query Error in GetDoctorReservationsAsPatient : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return 0
	}

	if !exist {
		log.Println("No reservations found for the patient")
		return 0
	}
	var query string
	var canceledCount int
	currentTime := time.Now().UTC()
	if appointmentType == "canceled" {
		query = `
			SELECT 
				count(*)
			FROM 
				appointments
			JOIN
			doctor_info ON appointments.doctor_id = doctor_info.doctor_id
			LEFT JOIN
				doctor_info AS doctor_patient ON appointments.patient_id = doctor_patient.doctor_id
			WHERE 
				appointments.patient_id = $1 
				AND 
				appointments.canceled = true
				AND 
				appointments.is_doctor_patient = true;
		`
		err = pool.QueryRow(context.Background(), query, userID).Scan(&canceledCount)
		if err != nil {
			log.Printf("Error fetching canceled appointments for patient: %v", err)
			return 0
		}
	} else {
		query = `
			SELECT 
				count(*)
			FROM 
				appointments
			JOIN
			doctor_info ON appointments.doctor_id = doctor_info.doctor_id
			LEFT JOIN
				doctor_info AS doctor_patient ON appointments.patient_id = doctor_patient.doctor_id
			WHERE 
				appointments.patient_id = $1 
				AND 
				appointments.canceled = false
				AND 
				appointments.appointment_end < $2
				AND 
				appointments.is_doctor_patient = true;
		`
		err = pool.QueryRow(context.Background(), query, userID, currentTime).Scan(&canceledCount)
		if err != nil {
			log.Printf("Error fetching canceled appointments for patient: %v", err)
			return 0
		}
	}

	return canceledCount

}

func GetReservationsCount(c *gin.Context, pool *pgxpool.Pool) {
	userID := c.DefaultQuery("user_id", "")
	userType := c.DefaultQuery("user_type", "")
	appointmentType := c.DefaultQuery("appointment_type", "")

	if userID == "" {
		log.Println("Bad Request: user_id required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad Request: doctor_id or patient_id required"})
		return
	}
	if userType == "" {
		log.Println("Bad Request: user_type required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad Request: user_type required"})
		return
	}

	var asDoctorReservationsCount int = 0
	var asPatientReservationsCount int = 0
	if userType == "patient" {
		asPatientReservationsCount = GetPatientReservationsCount(c, pool, userID, userType, "UTC", appointmentType)

	} else if userType == "doctor" {
		asDoctorReservationsCount = GetDoctorReservationsAsDoctorCount(c, pool, userID, userType, "UTC", appointmentType)
		asPatientReservationsCount = GetDoctorReservationsAsPatientCount(c, pool, userID, userType, "UTC", appointmentType)
	}

	c.JSON(http.StatusOK, gin.H{
		"as_patient": asPatientReservationsCount,
		"as_doctor":  asDoctorReservationsCount,
	})
}

func CreateReport(c *gin.Context, pool *pgxpool.Pool) {
	var report models.MedicalReport

	if err := c.ShouldBindJSON(&report); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	reportID := uuid.New()
	report.ReportID = reportID
	report.CreatedAt = time.Now()

	_, err := pool.Exec(
		context.Background(),
		`INSERT INTO medical_reports (report_id, appointment_id, doctor_id, patient_id, patient_first_name, patient_last_name, doctor_first_name, doctor_last_name, report_content, diagnosis_made, diagnosis_name, diagnosis_details, referral_needed, referral_specialty, referral_doctor_name, referral_message, created_at) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
		reportID, report.AppointmentID, report.DoctorID, report.PatientID, report.PatientFirstName, report.PatientLastName, report.DoctorFirstName, report.DoctorLastName, report.ReportContent, report.DiagnosisMade, report.DiagnosisName, report.DiagnosisDetails, report.ReferralNeeded, report.ReferralSpecialty, report.ReferralDoctorName, report.ReferralMessage, report.CreatedAt,
	)
	if err != nil {
		log.Println("Failed to create report : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create report"})
		return
	}

	if report.DiagnosisMade {
		AddDiagnosis(c, pool, report)
	}

	if report.ReferralNeeded {
		AddReferral(c, pool, report)
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Report created successfully", "report_id": reportID})
}

func GetDoctorName(c *gin.Context, pool *pgxpool.Pool, DoctorID uuid.UUID) string {

	var FirstName, LastName string
	err := pool.QueryRow(context.Background(),
		`SELECT 
			first_name, last_name 
		FROM 
			doctor_info
		WHERE
			doctor_id = $1
		`, DoctorID,
	).Scan(&FirstName, &LastName)
	if err != nil {
		log.Println("Failed to scan doctor First Name and Last Name :", err)
		return ""
	}
	DoctorFullName := FirstName + LastName
	return DoctorFullName
}

func AddDiagnosis(c *gin.Context, pool *pgxpool.Pool, report models.MedicalReport) {

	DoctorFullName := GetDoctorName(c, pool, report.DoctorID)

	_, err := pool.Exec(
		context.Background(),
		`INSERT INTO medical_diagnosis_history ( diagnosis_name, diagnosis_details, diagnosis_doctor_name, diagnosis_doctor_id, diagnosis_patient_id) 
		VALUES ($1, $2, $3, $4, $5)`,
		report.DiagnosisName, report.DiagnosisDetails, DoctorFullName, report.DoctorID, report.PatientID,
	)
	if err != nil {
		log.Println("Failed to insert medical diagnosis history info : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert medical diagnosis history info."})
		return
	}
	log.Println("Data was successfully inserted into medical diagnosis history table.")
}

func AddReferral(c *gin.Context, pool *pgxpool.Pool, report models.MedicalReport) {
	_, err := pool.Exec(
		context.Background(),
		`INSERT INTO medical_referrals ( referring_doctor_id, referred_patient_id)
		VALUES ($1, $2)`,
		report.DoctorID, report.PatientID,
	)
	if err != nil {
		log.Println("Failed to insert referral info : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert referral info."})
		return
	}
	log.Println("Data was successfully inserted into referral info.")
}

func SendReportNotification(c *gin.Context, pool *pgxpool.Pool) {
	var emailData struct {
		ReportID  uuid.UUID `json:"report_id"`
		PatientID string    `json:"patient_id"`
	}

	if err := c.ShouldBindJSON(&emailData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Fetch patient email and report details
	var patientEmail, reportContent string
	err := pool.QueryRow(context.Background(),
		`SELECT email, report_content 
		FROM patient_info JOIN medical_reports ON patient_info.patient_id = medical_reports.patient_id 
		WHERE medical_reports.report_id = $1`, emailData.ReportID,
	).Scan(&patientEmail, &reportContent)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve report details"})
		return
	}

	// (Pseudo code) Send email
	// email.SendEmail(patientEmail, "Your Medical Report", reportContent)

	c.JSON(http.StatusOK, gin.H{"message": "Report notification sent successfully"})
}

func GetReports(c *gin.Context, pool *pgxpool.Pool) {
	userID := c.Param("userId")

	// Get optional query parameters for filtering
	year := c.DefaultQuery("year", "")
	month := c.DefaultQuery("month", "")
	day := c.DefaultQuery("day", "")
	patientName := c.DefaultQuery("patientName", "")
	diagnosisName := c.DefaultQuery("diagnosisName", "")
	referralDoctor := c.DefaultQuery("referralDoctor", "")

	// Construct the base query
	query := `
		SELECT 
			report_id, 
			appointment_id, 
			doctor_id, 
			patient_id, 
			patient_first_name, 
			patient_last_name, 
			doctor_first_name, 
			doctor_last_name, 
			report_content, 
			diagnosis_made, 
			diagnosis_name, 
			diagnosis_details, 
			referral_needed, 
			referral_specialty, 
			referral_doctor_name, 
			referral_message, 
			created_at
		FROM 
			medical_reports
		WHERE 
			doctor_id = $1`

	// Prepare a slice for query arguments
	args := []interface{}{userID}
	argCount := 2

	// Apply filters based on user input while ensuring correct hierarchy
	if year != "" {
		query += fmt.Sprintf(" AND EXTRACT(YEAR FROM created_at) = $%d", argCount)
		args = append(args, year)
		argCount++

		if month != "" {
			query += fmt.Sprintf(" AND EXTRACT(MONTH FROM created_at) = $%d", argCount)
			args = append(args, month)
			argCount++

			if day != "" {
				query += fmt.Sprintf(" AND EXTRACT(DAY FROM created_at) = $%d", argCount)
				args = append(args, day)
				argCount++
			}
		}
	}

	// Apply additional filters if they are provided
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

	// Order by creation date in descending order
	query += " ORDER BY created_at DESC"

	// Execute the query
	rows, err := pool.Query(context.Background(), query, args...)
	if err != nil {
		log.Println("Failed To Query Reports : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed To Query Reports."})
		return
	}
	defer rows.Close()

	var reports []models.MedicalReport
	for rows.Next() {
		var report models.MedicalReport

		err := rows.Scan(
			&report.ReportID,
			&report.AppointmentID,
			&report.DoctorID,
			&report.PatientID,
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
			log.Println("Failed to scan report information : ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan report information."})
			return
		}

		reports = append(reports, report)
	}

	c.JSON(http.StatusOK, reports)
}

func GetReport(c *gin.Context, pool *pgxpool.Pool) {
	reportID := c.Param("reportId")

	var report models.MedicalReport
	err := pool.QueryRow(context.Background(),
		`SELECT 
			report_id, 
			appointment_id, 
			doctor_id, 
			patient_id, 
			patient_first_name, 
			patient_last_name, 
			doctor_first_name, 
			doctor_last_name, 
			report_content,
			diagnosis_made, 
			diagnosis_name, 
			diagnosis_details, 
			referral_needed,
			referral_specialty, 
			referral_doctor_name, 
			referral_message, 
			created_at
		FROM 
			medical_reports 
		WHERE 
			report_id = $1`, reportID,
	).Scan(
		&report.ReportID,
		&report.AppointmentID,
		&report.DoctorID,
		&report.PatientID,
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve report"})
		return
	}

	c.JSON(http.StatusOK, report)
}

func GetAnAppointment(c *gin.Context, pool *pgxpool.Pool) {
	AppointmentID := c.Param("appointmentId")
	var appointment models.Reservation
	if AppointmentID == "" {
		log.Println("Bad Request: appointmentId required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad Request: doctor_id or appointmentId required"})
		return
	}

	query := `
		SELECT 
			apt.appointment_id,
			apt.appointment_start,
			apt.appointment_end,
			apt.doctor_id,
			apt.patient_id,
			di.first_name as doctor_first_name,
			di.last_name as doctor_last_name,
			pi.first_name as patient_first_name,
			pi.last_name as patient_last_name		
		FROM 
			appointments apt
		JOIN 
			doctor_info di on di.doctor_id = apt.doctor_id
		JOIN 
			patient_info pi on pi.patient_id = apt.patient_id
		WHERE
			apt.appointment_id = $1;
	`
	err := pool.QueryRow(context.Background(), query, AppointmentID).Scan(
		&appointment.ReservationID,
		&appointment.ReservationStart,
		&appointment.ReservationEnd,
		&appointment.DoctorID,
		&appointment.PatientID,
		&appointment.DoctorFirstName,
		&appointment.DoctorLastName,
		&appointment.PatientFirstName,
		&appointment.PatientLastName,
	)
	if err != nil {
		log.Println("Query Error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return

	}
	c.JSON(http.StatusOK, appointment)
}
