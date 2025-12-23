package user

import (
	userHandler "healthcare_backend/pkg/handlers/user"
	userService "healthcare_backend/pkg/services/user"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

func SetupUserRoutes(router *gin.RouterGroup, db *pgxpool.Pool) {
	healthProfileService := userService.NewHealthProfileService(db)
	healthProfileHandler := userHandler.NewHealthProfileHandler(healthProfileService)

	userRoutes := router.Group("/user")
	{
		userRoutes.GET("/:userId/health-profile", healthProfileHandler.GetHealthProfile)
		userRoutes.PUT("/:userId/health-profile", healthProfileHandler.UpdateHealthProfile)

		userRoutes.GET("/:userId/vaccinations", healthProfileHandler.GetVaccinations)
		userRoutes.POST("/:userId/vaccinations", healthProfileHandler.CreateVaccination)
		userRoutes.PUT("/:userId/vaccinations/:vaccinationId", healthProfileHandler.UpdateVaccination)
		userRoutes.DELETE("/:userId/vaccinations/:vaccinationId", healthProfileHandler.DeleteVaccination)
	}
}
