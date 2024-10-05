package routes

import (
	"backend_go/services"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

func SetupFollowServiceRoutes(r *gin.Engine, db *pgxpool.Pool) {

	r.POST("api/v1/follow-doctor", func(c *gin.Context) {
		services.FollowDoctor(db, c)
	})

	r.GET("api/v1/doctor-follow-count/:doctorId", func(c *gin.Context) {
		services.GetDoctorFollowerCount(db, c)
	})

	r.GET("/api/v1/is-following/:doctorId", func(c *gin.Context) {
		services.IsFollowingDoctor(db, c)
	})
}
