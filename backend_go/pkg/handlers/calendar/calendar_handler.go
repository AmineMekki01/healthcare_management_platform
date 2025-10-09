package calendar

import (
	"log"
	"net/http"
	"strconv"
	"time"

	"healthcare_backend/pkg/models"
	"healthcare_backend/pkg/services/calendar"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CalendarHandler struct {
	calendarService *calendar.CalendarService
	holidayService  *calendar.HolidayService
}

func NewCalendarHandler(calendarService *calendar.CalendarService, holidayService *calendar.HolidayService) *CalendarHandler {
	return &CalendarHandler{
		calendarService: calendarService,
		holidayService:  holidayService,
	}
}

func (h *CalendarHandler) CheckAvailability(c *gin.Context) {
	doctorIDStr := c.Param("doctorId")
	doctorID, err := uuid.Parse(doctorIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid doctor ID"})
		return
	}

	startTimeStr := c.Query("startTime")
	if startTimeStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "startTime is required"})
		return
	}

	startTime, err := time.Parse(time.RFC3339, startTimeStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid startTime format"})
		return
	}

	durationStr := c.DefaultQuery("duration", "30")
	duration, err := strconv.Atoi(durationStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid duration"})
		return
	}

	result, err := h.calendarService.CheckAvailability(doctorID, startTime, duration)
	if err != nil {
		log.Printf("Error checking availability: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check availability"})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *CalendarHandler) FindAvailableSlots(c *gin.Context) {
	doctorIDStr := c.Param("doctorId")
	doctorID, err := uuid.Parse(doctorIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid doctor ID"})
		return
	}

	startDateStr := c.Query("startDate")
	endDateStr := c.Query("endDate")
	durationStr := c.DefaultQuery("duration", "30")
	limitStr := c.DefaultQuery("limit", "10")

	if startDateStr == "" || endDateStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "startDate and endDate are required"})
		return
	}

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid startDate format"})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid endDate format"})
		return
	}

	duration, _ := strconv.Atoi(durationStr)
	limit, _ := strconv.Atoi(limitStr)

	slots, err := h.calendarService.FindAvailableSlots(doctorID, startDate, endDate, duration, limit)
	if err != nil {
		log.Printf("Error finding available slots: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find available slots"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"slots": slots})
}

func (h *CalendarHandler) CreateCalendarEvent(c *gin.Context) {
	doctorIDStr := c.Param("doctorId")
	doctorID, err := uuid.Parse(doctorIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid doctor ID"})
		return
	}

	var req models.CreateCalendarEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Invalid request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	event, err := h.calendarService.CreateCalendarEvent(doctorID, req)
	if err != nil {
		log.Printf("Error creating calendar event: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create calendar event"})
		return
	}

	c.JSON(http.StatusCreated, event)
}

func (h *CalendarHandler) GetCalendarEvents(c *gin.Context) {
	doctorIDStr := c.Param("doctorId")
	doctorID, err := uuid.Parse(doctorIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid doctor ID"})
		return
	}

	startDateStr := c.Query("startDate")
	endDateStr := c.Query("endDate")

	if startDateStr == "" || endDateStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "startDate and endDate are required"})
		return
	}

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid startDate format"})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid endDate format"})
		return
	}

	events, err := h.calendarService.GetCalendarEvents(doctorID, startDate, endDate)
	if err != nil {
		log.Printf("Error getting calendar events: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get calendar events"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"events": events})
}

func (h *CalendarHandler) UpdateCalendarEvent(c *gin.Context) {
	eventIDStr := c.Param("eventId")
	eventID, err := uuid.Parse(eventIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}

	var req models.UpdateCalendarEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Invalid request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	err = h.calendarService.UpdateCalendarEvent(eventID, req)
	if err != nil {
		log.Printf("Error updating calendar event: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update calendar event"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Calendar event updated successfully"})
}

func (h *CalendarHandler) DeleteCalendarEvent(c *gin.Context) {
	eventIDStr := c.Param("eventId")
	eventID, err := uuid.Parse(eventIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}

	deleteAllStr := c.DefaultQuery("deleteAll", "false")
	deleteAll := deleteAllStr == "true"

	err = h.calendarService.DeleteCalendarEvent(eventID, deleteAll)
	if err != nil {
		log.Printf("Error deleting calendar event: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete calendar event"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Calendar event deleted successfully"})
}
