package appointment

import (
	"healthcare_backend/pkg/config"
	appointmentHandler "healthcare_backend/pkg/handlers/appointment"
	appointmentService "healthcare_backend/pkg/services/appointment"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

func SetupAppointmentRoutes(router *gin.RouterGroup, db *pgxpool.Pool, cfg *config.Config) {
	service := appointmentService.NewAppointmentService(db, cfg)
	handler := appointmentHandler.NewAppointmentHandler(service)

	router.GET("/doctors/availabilities", handler.GetAvailabilities)
	router.POST("/doctors/availabilities/:userId", handler.SetDoctorAvailability)
	router.DELETE("/doctors/availabilities/:userId", handler.ClearDoctorAvailabilities)
	router.GET("/doctors/:doctorId/weekly_schedule", handler.GetWeeklySchedule)

	router.POST("/reservations", handler.CreateReservation)
	router.GET("/reservations", handler.GetReservations)
	router.GET("/reservations/count", handler.GetReservationsCount)
	router.POST("/cancel-appointment", handler.CancelAppointment)
	router.GET("/appointments/stats", handler.GetAppointmentStatistics)
	router.GET("/appointments/:appointmentId", handler.GetAppointmentByID)

	router.POST("/reports", handler.CreateReport)
	router.GET("/reports/:userId", handler.GetReports)
	router.GET("/doctor-report/:reportId", handler.GetReport)
	router.PUT("/doctor-report/:reportId", handler.UpdateReport)
	router.DELETE("/doctor-report/:reportId", handler.DeleteReport)
	router.GET("/doctors-referral-search", handler.SearchDoctorsForReferral)
}
