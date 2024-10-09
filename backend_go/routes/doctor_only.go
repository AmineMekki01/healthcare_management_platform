// routes/doctor_routes.go
package routes

import (
	"backend_go/services"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

func SetupDoctorOnlyRoutes(r *gin.RouterGroup, pool *pgxpool.Pool) {
	r.POST("/api/v1/blog-posts", services.CreateBlogPost(pool))
}
