package calendar

import (
	"healthcare_backend/pkg/config"
	calendarHandler "healthcare_backend/pkg/handlers/calendar"
	calendarService "healthcare_backend/pkg/services/calendar"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

func SetupCalendarRoutes(router *gin.RouterGroup, db *pgxpool.Pool, cfg *config.Config) {
	service := calendarService.NewCalendarService(db, cfg)
	holidayService := calendarService.NewHolidayService(db)
	handler := calendarHandler.NewCalendarHandler(service, holidayService)

	router.GET("/doctors/:doctorId/availability/check", handler.CheckAvailability)
	router.GET("/doctors/:doctorId/availability/slots", handler.FindAvailableSlots)

	router.POST("/doctors/:doctorId/calendar/events", handler.CreateCalendarEvent)
	router.GET("/doctors/:doctorId/calendar/events", handler.GetCalendarEvents)
	router.PUT("/doctors/:doctorId/calendar/events/:eventId", handler.UpdateCalendarEvent)
	router.DELETE("/doctors/:doctorId/calendar/events/:eventId", handler.DeleteCalendarEvent)
}
