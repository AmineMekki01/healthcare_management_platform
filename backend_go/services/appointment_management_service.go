package services

import (
	"backend_go/models"
	"context"
	"log"
	"net/http"
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
			appointments.cancellation_timestamp
		FROM 
			appointments
		JOIN
			doctor_info ON appointments.doctor_id = doctor_info.doctor_id
		JOIN
			patient_info ON appointments.patient_id = patient_info.patient_id
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
