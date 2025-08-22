package appointment

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"healthcare_backend/pkg/models"
	"healthcare_backend/pkg/services/appointment"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AppointmentHandler struct {
	appointmentService *appointment.AppointmentService
}

func NewAppointmentHandler(appointmentService *appointment.AppointmentService) *AppointmentHandler {
	return &AppointmentHandler{
		appointmentService: appointmentService,
	}
}

func (h *AppointmentHandler) GetAvailabilities(c *gin.Context) {
	doctorId := c.Query("doctorId")
	day := c.Query("day")
	currentTime := c.Query("currentTime")

	if doctorId == "" || day == "" || currentTime == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "doctorId, day, and currentTime are required"})
		return
	}

	availabilities, err := h.appointmentService.GetAvailabilities(doctorId, day, currentTime)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"availabilities": availabilities})
}

func (h *AppointmentHandler) SetDoctorAvailability(c *gin.Context) {
	userId := c.GetString("userId")
	if userId == "" {
		log.Printf("User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	bodyBytes, err := c.GetRawData()
	if err != nil {
		log.Printf("Failed to read request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	startStr := c.Query("start")
	endStr := c.Query("end")

	if startStr == "" || endStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "start and end are required as query params"})
		return
	}

	var weeklySchedule []models.WeeklyScheduleEntry
	if err := json.Unmarshal(bodyBytes, &weeklySchedule); err == nil && len(weeklySchedule) > 0 {
		availabilities, err := h.convertWeeklyScheduleToAvailabilities(weeklySchedule, startStr, endStr)
		if err != nil {
			log.Printf("Error converting weekly schedule: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err = h.appointmentService.SetDoctorAvailability(userId, startStr, endStr, availabilities)
		if err != nil {
			log.Printf("Error setting doctor availability: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Weekly schedule set successfully"})
		return
	}

	var availabilities []models.Availability
	var obj struct {
		Start          string                `json:"start"`
		End            string                `json:"end"`
		Availabilities []models.Availability `json:"availabilities"`
	}

	if err := json.Unmarshal(bodyBytes, &obj); err == nil {
		availabilities = obj.Availabilities
		if obj.Start != "" {
			startStr = obj.Start
		}
		if obj.End != "" {
			endStr = obj.End
		}
	} else {
		if err := json.Unmarshal(bodyBytes, &availabilities); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body format"})
			return
		}
	}

	err = h.appointmentService.SetDoctorAvailability(userId, startStr, endStr, availabilities)
	if err != nil {
		log.Printf("Error setting doctor availability: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Availability set successfully"})
}

func (h *AppointmentHandler) convertWeeklyScheduleToAvailabilities(weeklySchedule []models.WeeklyScheduleEntry, startStr, endStr string) ([]models.Availability, error) {
	const dateFormat = "2006-01-02"
	const timeFormat = "15:04"

	rangeStart, err := time.Parse(dateFormat, startStr)
	if err != nil {
		return nil, fmt.Errorf("invalid start date format: %v", err)
	}

	rangeEnd, err := time.Parse(dateFormat, endStr)
	if err != nil {
		return nil, fmt.Errorf("invalid end date format: %v", err)
	}

	var availabilities []models.Availability

	for d := rangeStart; !d.After(rangeEnd); d = d.AddDate(0, 0, 1) {
		weekdayName := d.Weekday().String()

		var scheduleEntry *models.WeeklyScheduleEntry
		for i := range weeklySchedule {
			if weeklySchedule[i].Weekday == weekdayName && weeklySchedule[i].Enabled {
				scheduleEntry = &weeklySchedule[i]
				break
			}
		}

		if scheduleEntry == nil {
			continue
		}
		startTime, err := time.Parse(timeFormat, scheduleEntry.Start)
		if err != nil {
			log.Printf("Invalid start time format for %s: %v", scheduleEntry.Weekday, err)
			continue
		}

		endTime, err := time.Parse(timeFormat, scheduleEntry.End)
		if err != nil {
			log.Printf("Invalid end time format for %s: %v", scheduleEntry.Weekday, err)
			continue
		}

		dayStart := time.Date(d.Year(), d.Month(), d.Day(), startTime.Hour(), startTime.Minute(), 0, 0, time.UTC)
		dayEnd := time.Date(d.Year(), d.Month(), d.Day(), endTime.Hour(), endTime.Minute(), 0, 0, time.UTC)

		slotDuration := time.Duration(scheduleEntry.SlotDuration) * time.Minute
		for slotStart := dayStart; slotStart.Before(dayEnd); slotStart = slotStart.Add(slotDuration) {
			slotEnd := slotStart.Add(slotDuration)
			if slotEnd.After(dayEnd) {
				break
			}

			availability := models.Availability{
				AvailabilityID:    uuid.New().String(),
				AvailabilityStart: slotStart,
				AvailabilityEnd:   slotEnd,
				DoctorID:          "",
				Weekday:           scheduleEntry.Weekday,
				SlotDuration:      scheduleEntry.SlotDuration,
			}

			availabilities = append(availabilities, availability)
		}
	}

	return availabilities, nil
}

func (h *AppointmentHandler) GetDoctorWeeklySchedule(c *gin.Context) {
	doctorId := c.Param("doctorId")
	startStr := c.Query("start")
	endStr := c.Query("end")

	if doctorId == "" || startStr == "" || endStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "doctorId, start, and end are required"})
		return
	}

	rangeStart, err := time.Parse("2006-01-02", startStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start date format"})
		return
	}

	rangeEnd, err := time.Parse("2006-01-02", endStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end date format"})
		return
	}

	reservations, err := h.appointmentService.GetDoctorWeeklySchedule(doctorId, rangeStart, rangeEnd)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"reservations": reservations})
}

func (h *AppointmentHandler) GetWeeklySchedule(c *gin.Context) {
	doctorId := c.Param("doctorId")
	startStr := c.Query("start")
	endStr := c.Query("end")

	if doctorId == "" || startStr == "" || endStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "doctorId, start, and end are required"})
		return
	}

	rangeStart, err := time.Parse("2006-01-02", startStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start date format"})
		return
	}

	rangeEnd, err := time.Parse("2006-01-02", endStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end date format"})
		return
	}

	schedule, err := h.appointmentService.GetWeeklySchedule(doctorId, rangeStart, rangeEnd)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, schedule)
}

func (h *AppointmentHandler) CreateReservation(c *gin.Context) {
	var reservation models.Reservation

	if err := c.ShouldBindJSON(&reservation); err != nil {
		log.Printf("Invalid request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	userType, exists := c.Get("userType")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User type not found"})
		return
	}

	err := h.appointmentService.CreateReservation(reservation, userType.(string))
	if err != nil {
		log.Printf("Error creating reservation: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Reservation created successfully", "appointment_id": reservation.AppointmentID})
}

func (h *AppointmentHandler) GetAppointmentStatistics(c *gin.Context) {
	userID := c.DefaultQuery("user_id", "")
	userType := c.DefaultQuery("user_type", "")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}
	if userType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_type is required"})
		return
	}

	stats, err := h.appointmentService.GetAppointmentStatistics(userID, userType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func (h *AppointmentHandler) GetPatientAppointments(c *gin.Context) {
	patientID := c.Param("id")
	if patientID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Patient ID is required"})
		return
	}

	limitStr := c.DefaultQuery("limit", "10")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit parameter"})
		return
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid offset parameter"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"appointments": []interface{}{}, "limit": limit, "offset": offset})
}

func (h *AppointmentHandler) UpdateAppointmentStatus(c *gin.Context) {
	appointmentID := c.Param("id")
	if appointmentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Appointment ID is required"})
		return
	}

	var statusUpdate struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&statusUpdate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Appointment status updated successfully"})
}

func (h *AppointmentHandler) GetReservations(c *gin.Context) {
	userID := c.DefaultQuery("userId", "")
	userType := c.DefaultQuery("userType", "")
	timezone := c.DefaultQuery("timezone", "UTC")

	if userID == "" {
		log.Println("Bad Request: userId required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId is required"})
		return
	}
	if userType == "" {
		log.Println("Bad Request: userType required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "userType is required"})
		return
	}

	reservations, err := h.appointmentService.GetReservations(userID, userType, timezone)
	if err != nil {
		log.Println("Error fetching reservations:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reservations)
}

func (h *AppointmentHandler) CancelAppointment(c *gin.Context) {
	var cancelInfo struct {
		CanceledBy         string `json:"canceled_by"`
		CancellationReason string `json:"cancellation_reason"`
		AppointmentIdStr   string `json:"appointment_id"`
	}

	if err := c.ShouldBindJSON(&cancelInfo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	appointmentID, err := uuid.Parse(cancelInfo.AppointmentIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	err = h.appointmentService.CancelAppointment(appointmentID, cancelInfo.CanceledBy, cancelInfo.CancellationReason)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Appointment canceled successfully"})
}

func (h *AppointmentHandler) GetAppointmentByID(c *gin.Context) {
	appointmentID := c.Param("appointmentId")
	if appointmentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "appointmentId is required"})
		return
	}

	appointment, err := h.appointmentService.GetAppointmentByID(appointmentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, appointment)
}

func (h *AppointmentHandler) CreateReport(c *gin.Context) {
	var report models.MedicalReport

	if err := c.ShouldBindJSON(&report); err != nil {
		log.Printf("Failed to bind JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if report.AppointmentID == uuid.Nil {
		log.Printf("Invalid or missing AppointmentID")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Valid appointment ID is required"})
		return
	}

	if report.DoctorID == uuid.Nil {
		log.Printf("Invalid or missing DoctorID")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Valid doctor ID is required"})
		return
	}

	if report.PatientID == "" {
		log.Printf("Missing PatientID")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Patient ID is required"})
		return
	}

	if report.PatientFirstName == "" {
		report.PatientFirstName = "Unknown"
	}
	if report.PatientLastName == "" {
		report.PatientLastName = "Patient"
	}
	if report.DoctorFirstName == "" {
		report.DoctorFirstName = "Dr."
	}
	if report.DoctorLastName == "" {
		report.DoctorLastName = "Unknown"
	}

	createdReport, err := h.appointmentService.CreateReport(report)
	if err != nil {
		log.Printf("Failed to create report: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Report created successfully", "report": createdReport})
}

func (h *AppointmentHandler) GetReports(c *gin.Context) {
	userID := c.Param("userId")
	year := c.DefaultQuery("year", "")
	month := c.DefaultQuery("month", "")
	day := c.DefaultQuery("day", "")
	patientName := c.DefaultQuery("patientName", "")
	diagnosisName := c.DefaultQuery("diagnosisName", "")
	referralDoctor := c.DefaultQuery("referralDoctor", "")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId is required"})
		return
	}

	reports, err := h.appointmentService.GetReports(userID, year, month, day, patientName, diagnosisName, referralDoctor)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reports)
}

func (h *AppointmentHandler) AddDoctorException(c *gin.Context) {
	doctorID := c.Param("id")
	var exception models.DoctorException

	if err := c.ShouldBindJSON(&exception); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	if err := h.appointmentService.AddDoctorException(doctorID, exception); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add exception"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Exception added successfully"})
}

func (h *AppointmentHandler) GetReport(c *gin.Context) {
	reportID := c.Param("reportId")

	report, err := h.appointmentService.GetReport(reportID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve report"})
		return
	}

	c.JSON(http.StatusOK, report)
}

func (h *AppointmentHandler) UpdateReport(c *gin.Context) {
	reportID := c.Param("reportId")
	var updateData models.MedicalReport

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	if err := h.appointmentService.UpdateReport(reportID, updateData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update report"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Report updated successfully"})
}

func (h *AppointmentHandler) DeleteReport(c *gin.Context) {
	reportID := c.Param("reportId")

	if err := h.appointmentService.DeleteReport(reportID); err != nil {
		if err.Error() == "report not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Report not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete report"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Report deleted successfully"})
}

func (h *AppointmentHandler) GetReservationsCount(c *gin.Context) {
	userID := c.DefaultQuery("user_id", "")
	userType := c.DefaultQuery("user_type", "")
	appointmentType := c.DefaultQuery("appointment_type", "")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id required"})
		return
	}
	if userType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_type required"})
		return
	}

	counts, err := h.appointmentService.GetReservationsCount(userID, userType, appointmentType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get reservations count"})
		return
	}

	c.JSON(http.StatusOK, counts)
}

func (h *AppointmentHandler) SearchDoctorsForReferral(c *gin.Context) {
	searchQuery := c.DefaultQuery("q", "")
	specialty := c.DefaultQuery("specialty", "")
	limit := c.DefaultQuery("limit", "10")

	limitInt := 10
	if limit != "" {
		if parsedLimit, err := strconv.Atoi(limit); err == nil {
			limitInt = parsedLimit
		}
	}

	doctors, err := h.appointmentService.SearchDoctorsForReferral(searchQuery, specialty, limitInt)
	if err != nil {
		log.Printf("Error searching doctors for referral: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search doctors"})
		return
	}

	c.JSON(http.StatusOK, doctors)
}

func (h *AppointmentHandler) ClearDoctorAvailabilities(c *gin.Context) {
	userId := c.GetString("userId")
	if userId == "" {
		log.Printf("User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	err := h.appointmentService.ClearDoctorAvailabilities(userId)
	if err != nil {
		log.Printf("Error clearing doctor availabilities: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "All availabilities cleared successfully"})
}
