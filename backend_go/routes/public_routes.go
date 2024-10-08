package routes

import (
	"backend_go/services"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

func SetupPublicRoutes(r *gin.RouterGroup, pool *pgxpool.Pool) {
	// Account activation and password reset routes
	r.GET("/activate_account", func(c *gin.Context) {
		services.ActivateAccount(c, pool)
	})
	r.POST("/api/v1/request-reset", func(c *gin.Context) {
		services.RequestReset(c, pool)
	})
	r.POST("/api/v1/reset-password", func(c *gin.Context) {
		services.UpdatePassword(c, pool)
	})

	// Authentication routes
	r.POST("/api/v1/doctors/register", func(c *gin.Context) {
		services.RegisterDoctor(c, pool)
	})
	r.POST("/api/v1/doctors/login", func(c *gin.Context) {
		services.LoginDoctor(c, pool)
	})
	r.POST("/api/v1/patients/register", func(c *gin.Context) {
		services.RegisterPatient(c, pool)
	})
	r.POST("/api/v1/patients/login", func(c *gin.Context) {
		services.LoginPatient(c, pool)
	})

	r.GET("/ws", services.ServeWs)
}
