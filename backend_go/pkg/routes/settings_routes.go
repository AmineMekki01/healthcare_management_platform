package routes

import (
	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/handlers"
	"healthcare_backend/pkg/services"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

func SetupSettingsRoutes(router *gin.RouterGroup, db *pgxpool.Pool, cfg *config.Config) {
	settingsService := services.NewSettingsService(db, cfg)

	settingsHandler := handlers.NewSettingsHandler(settingsService)

	settings := router.Group("/settings")
	{
		settings.GET("/user/:userId", settingsHandler.GetUserByID)
		settings.PUT("/user/:userId", settingsHandler.UpdateUserInfo)

		settings.GET("/doctor/:doctorId/additional", settingsHandler.GetDoctorAdditionalInfo)
		settings.PUT("/doctor/:doctorId/additional", settingsHandler.UpdateDoctorAdditionalInfo)
	}
}
