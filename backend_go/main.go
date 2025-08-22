package main

import (
	"log"
	"net/http"

	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/database"
	"healthcare_backend/pkg/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	db, err := database.Initialize(cfg)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	router := gin.Default()

	routes.SetupRoutes(router, db, cfg)

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})

	if err := router.Run(":" + cfg.ServerPort); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
