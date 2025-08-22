package patient

import (
	"healthcare_backend/pkg/config"
	patientHandler "healthcare_backend/pkg/handlers/patient"
	patientService "healthcare_backend/pkg/services/patient"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

func SetupPatientRoutes(router *gin.RouterGroup, db *pgxpool.Pool, cfg *config.Config) {
	service := patientService.NewPatientService(db, cfg)
	handler := patientHandler.NewPatientHandler(service)

	patientRoutes := router.Group("/patient")
	{
		patientRoutes.POST("/register", handler.RegisterPatient)
		patientRoutes.POST("/login", handler.LoginPatient)
		patientRoutes.POST("/verify", handler.VerifyPatient)

		patientRoutes.GET("/search", handler.SearchPatients)
		patientRoutes.GET("/:patientId", handler.GetPatientProfile)
		patientRoutes.PUT("/:patientId", handler.UpdatePatientProfile)
		patientRoutes.GET("/:patientId/medical-history", handler.GetPatientMedicalHistory)
		patientRoutes.GET("/:patientId/medications", handler.GetPatientMedications)
		patientRoutes.GET("/diagnosis/:diagnosisId", handler.GetDiagnosisDetails)
		patientRoutes.GET("/doctor/:doctorId/patients", handler.GetDoctorPatients)
	}
}
