package auth

import (
	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/handlers/auth"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

func SetupPublicAuthRoutes(router *gin.RouterGroup, db *pgxpool.Pool, cfg *config.Config) {
	authHandler := auth.NewAuthHandler(db, cfg)

	router.GET("/activate_account", authHandler.ActivateAccount)
	router.POST("/request-reset", authHandler.RequestReset)
	router.POST("/reset-password", authHandler.UpdatePassword)

	router.POST("/doctors/register", authHandler.RegisterDoctor)
	router.POST("/doctors/login", authHandler.LoginDoctor)
	router.POST("/patients/register", authHandler.RegisterPatient)
	router.POST("/patients/login", authHandler.LoginPatient)

	router.POST("/auth/register/receptionist", authHandler.RegisterReceptionist)
	router.POST("/auth/login/receptionist", authHandler.LoginReceptionist)

	router.GET("/ws", authHandler.ServeWS)
}

func SetupProtectedAuthRoutes(router *gin.RouterGroup, db *pgxpool.Pool, cfg *config.Config) {
	authHandler := auth.NewAuthHandler(db, cfg)

	router.POST("/refresh-token", authHandler.RefreshToken)
}
