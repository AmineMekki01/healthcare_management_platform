package receptionist

import (
	"healthcare_backend/pkg/config"
	receptionistHandlers "healthcare_backend/pkg/handlers/receptionist"
	"healthcare_backend/pkg/middleware"
	receptionistService "healthcare_backend/pkg/services/receptionist"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

func SetupReceptionistRoutes(router *gin.Engine, db *pgxpool.Pool, cfg *config.Config) {
	receptionistSvc := receptionistService.NewReceptionistService(db, cfg)
	receptionistPatientSvc := receptionistService.NewReceptionistPatientService(db, cfg)

	receptionistHandler := receptionistHandlers.NewReceptionistHandler(receptionistSvc)
	receptionistPatientHandler := receptionistHandlers.NewReceptionistPatientHandler(receptionistPatientSvc)

	protected := router.Group("/api/v1/receptionist")
	protected.Use(middleware.AuthMiddleware())
	{
		protected.GET("/:userID", receptionistHandler.GetReceptionistProfile)
		protected.PUT("/:userID", receptionistHandler.UpdateReceptionistProfile)

		protected.GET("/patients/search", receptionistPatientHandler.SearchPatients)
		protected.GET("/patients/:patientId", receptionistPatientHandler.GetPatientDetails)
		protected.POST("/patients", receptionistPatientHandler.CreatePatient)

		protected.POST("/appointments", receptionistPatientHandler.CreateAppointment)
		protected.GET("/appointments/conflicts", receptionistPatientHandler.CheckAppointmentConflict)

		protected.GET("/stats/appointments", receptionistPatientHandler.GetAppointmentStats)
		protected.GET("/stats/patients", receptionistPatientHandler.GetPatientStats)
	}
}
