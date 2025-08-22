package handlers

import (
	"log"
	"net/http"
	"strconv"

	"healthcare_backend/pkg/models"
	receptionistService "healthcare_backend/pkg/services/receptionist"

	"github.com/gin-gonic/gin"
)

type ReceptionistPatientHandler struct {
	receptionistPatientService *receptionistService.ReceptionistPatientService
}

func NewReceptionistPatientHandler(
	receptionistPatientService *receptionistService.ReceptionistPatientService,
) *ReceptionistPatientHandler {
	return &ReceptionistPatientHandler{
		receptionistPatientService: receptionistPatientService,
	}
}

func (h *ReceptionistPatientHandler) SearchPatients(c *gin.Context) {
	receptionistID, exists := c.Get("userId")
	if !exists {
		log.Println("SearchPatients: userID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	req := models.PatientSearchRequest{
		DoctorID:    c.Query("doctor_id"),
		SearchQuery: c.Query("search_query"),
		Status:      c.Query("status"),
		DateFrom:    c.Query("date_from"),
		DateTo:      c.Query("date_to"),
	}

	if limitStr := c.Query("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil {
			req.Limit = limit
		} else {
			req.Limit = 20
		}
	} else {
		req.Limit = 20
	}

	if offsetStr := c.Query("offset"); offsetStr != "" {
		if offset, err := strconv.Atoi(offsetStr); err == nil {
			req.Offset = offset
		}
	}

	patients, totalCount, err := h.receptionistPatientService.SearchPatients(receptionistID.(string), req)
	if err != nil {
		log.Printf("SearchPatients: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"patients":    patients,
		"total_count": totalCount,
		"limit":       req.Limit,
		"offset":      req.Offset,
	})
}

func (h *ReceptionistPatientHandler) GetPatientDetails(c *gin.Context) {
	receptionistID, exists := c.Get("userId")
	if !exists {
		log.Println("GetPatientDetails: userID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	patientID := c.Param("patientId")
	if patientID == "" {
		log.Println("GetPatientDetails: patientId not found in path")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Patient ID is required"})
		return
	}

	doctorID := c.Query("doctor_id")

	patient, appointments, err := h.receptionistPatientService.GetPatientDetailedInfo(receptionistID.(string), patientID, doctorID)
	if err != nil {
		log.Printf("GetPatientDetails: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"patient":      patient,
		"appointments": appointments,
	})
}

func (h *ReceptionistPatientHandler) CreatePatient(c *gin.Context) {
	receptionistID, exists := c.Get("userId")
	if !exists {
		log.Println("CreatePatient: userID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req models.CreatePatientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("CreatePatient: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	patient, err := h.receptionistPatientService.CreatePatient(receptionistID.(string), req)
	if err != nil {
		log.Printf("CreatePatient: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"patient": patient,
	})
}

func (h *ReceptionistPatientHandler) CreateAppointment(c *gin.Context) {
	receptionistID, exists := c.Get("userId")
	if !exists {
		log.Println("CreateAppointment: userID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req models.CreateAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("CreateAppointment: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	req.CreatedBy = receptionistID.(string)

	appointment, err := h.receptionistPatientService.CreateAppointment(receptionistID.(string), req)
	if err != nil {
		log.Printf("CreateAppointment: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"appointment": appointment,
	})
}

func (h *ReceptionistPatientHandler) GetAppointmentStats(c *gin.Context) {
	receptionistID, exists := c.Get("userId")
	if !exists {
		log.Println("GetAppointmentStats: userID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	doctorID := c.Query("doctor_id")
	if doctorID == "" {
		log.Println("GetAppointmentStats: doctor_id not found in query")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Doctor ID is required"})
		return
	}

	stats, err := h.receptionistPatientService.GetAppointmentStats(receptionistID.(string), doctorID)
	if err != nil {
		log.Printf("GetAppointmentStats: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stats": stats,
	})
}

func (h *ReceptionistPatientHandler) GetPatientStats(c *gin.Context) {
	receptionistID, exists := c.Get("userId")
	if !exists {
		log.Println("GetPatientStats: userID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	doctorID := c.Query("doctor_id")
	if doctorID == "" {
		log.Println("GetPatientStats: doctor_id not found in query")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Doctor ID is required"})
		return
	}

	stats, err := h.receptionistPatientService.GetPatientStats(receptionistID.(string), doctorID)
	if err != nil {
		log.Printf("GetPatientStats: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stats": stats,
	})
}

func (h *ReceptionistPatientHandler) CheckAppointmentConflict(c *gin.Context) {
	receptionistID, exists := c.Get("userId")
	if !exists {
		log.Println("CheckAppointmentConflict: userID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	doctorID := c.Query("doctorId")
	startTime := c.Query("startTime")
	endTime := c.Query("endTime")

	if doctorID == "" || startTime == "" || endTime == "" {
		log.Println("CheckAppointmentConflict: missing required parameters")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Doctor ID, start time, and end time are required"})
		return
	}

	conflicts, err := h.receptionistPatientService.CheckAppointmentConflict(receptionistID.(string), doctorID, startTime, endTime)
	if err != nil {
		log.Printf("CheckAppointmentConflict: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"conflicts":   conflicts,
		"hasConflict": len(conflicts) > 0,
	})
}
