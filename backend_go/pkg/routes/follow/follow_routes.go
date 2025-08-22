package follow

import (
	"healthcare_backend/pkg/config"
	followHandler "healthcare_backend/pkg/handlers/follow"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

func SetupFollowRoutes(router *gin.RouterGroup, db *pgxpool.Pool, cfg *config.Config) {
	handler := followHandler.NewFollowHandler(db, cfg)

	router.POST("/follow-doctor/:doctorId", handler.FollowDoctor)
	router.DELETE("/unfollow-doctor/:doctorId", handler.UnfollowDoctor)
	router.GET("/is-following/:doctorId", handler.IsFollowingDoctor)
	router.GET("/doctor-follow-count/:doctorId", handler.GetDoctorFollowerCount)
	router.GET("/user-followings/:patientId", handler.GetUserFollowings)
}
