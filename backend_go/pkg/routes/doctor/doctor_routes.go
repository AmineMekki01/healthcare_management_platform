package doctor

import (
	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/handlers/doctor"
	doctorService "healthcare_backend/pkg/services/doctor"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

func SetupPublicDoctorRoutes(router *gin.RouterGroup, db *pgxpool.Pool, cfg *config.Config) {
	doctorSvc := doctorService.NewDoctorService(db, cfg)
	doctorHandler := doctor.NewDoctorHandler(doctorSvc)

	router.GET("/doctors", doctorHandler.SearchDoctors)
	router.GET("/doctors/:doctorId", doctorHandler.GetDoctorByID)
}

func SetupDoctorOnlyRoutes(router *gin.RouterGroup, db *pgxpool.Pool, cfg *config.Config) {
	doctorSvc := doctorService.NewDoctorService(db, cfg)
	doctorHandler := doctor.NewDoctorHandler(doctorSvc)

	router.POST("/register", doctorHandler.RegisterDoctor)
	router.POST("/login", doctorHandler.LoginDoctor)
	router.GET("/profile", doctorHandler.GetDoctorProfile)
	router.GET("/receptionist/talent-pool", doctorHandler.GetTalentPool)
	router.POST("/receptionist/hire/:receptionistId", doctorHandler.HireReceptionist)
	router.GET("/doctor/staff/:doctorId", doctorHandler.GetDoctorStaff)
	router.POST("/doctor/staff/dismiss/:receptionistId", doctorHandler.DismissReceptionist)
}
