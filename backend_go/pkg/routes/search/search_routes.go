package search

import (
	"healthcare_backend/pkg/config"
	searchHandler "healthcare_backend/pkg/handlers/search"
	searchService "healthcare_backend/pkg/services/search"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

func SetupSearchRoutes(router *gin.RouterGroup, db *pgxpool.Pool, cfg *config.Config) {
	service := searchService.NewSearchService(db, cfg)
	handler := searchHandler.NewSearchHandler(service)

	searchGroup := router.Group("/search")
	{
		searchGroup.GET("/doctors-referral", handler.SearchDoctorsForReferral)
		searchGroup.GET("/users/:username/:userId", handler.SearchUsers)
	}
}

func SetupPublicSearchRoutes(router *gin.RouterGroup, db *pgxpool.Pool, cfg *config.Config) {
	service := searchService.NewSearchService(db, cfg)
	handler := searchHandler.NewSearchHandler(service)

	searchGroup := router.Group("/search")
	{
		searchGroup.GET("/doctors", handler.SearchDoctors)
	}
}
