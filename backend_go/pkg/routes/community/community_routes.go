package community

import (
	"healthcare_backend/pkg/config"
	communityHandler "healthcare_backend/pkg/handlers/community"
	communityService "healthcare_backend/pkg/services/community"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

func SetupCommunityRoutes(router *gin.RouterGroup, db *pgxpool.Pool, cfg *config.Config) {
	service := communityService.NewCommunityService(db, cfg)
	handler := communityHandler.NewCommunityHandler(service)

	router.GET("/community/stats", handler.GetCommunityStats)
}
