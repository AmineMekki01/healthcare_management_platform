package feed

import (
	"healthcare_backend/pkg/config"
	feedHandler "healthcare_backend/pkg/handlers/feed"
	feedService "healthcare_backend/pkg/services/feed"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

func SetupFeedRoutes(router *gin.RouterGroup, db *pgxpool.Pool, cfg *config.Config) {
	service := feedService.NewFeedService(db, cfg)
	handler := feedHandler.NewFeedHandler(service)

	feed := router.Group("/feed")
	{
		feed.GET("", handler.GetFeed)

		posts := feed.Group("/posts")
		{
			posts.POST("", handler.CreateBlogPost)

			posts.GET("/:postID", handler.GetPostByID)

			posts.PUT("/:postID", handler.EditDoctorPost)

			posts.DELETE("/:postID", handler.DeleteDoctorPost)

			posts.POST("/:postID/like", handler.LikePost)
			posts.DELETE("/:postID/like", handler.UnlikePost)

			posts.POST("/:postID/comments", handler.AddComment)
			posts.GET("/:postID/comments", handler.GetComments)
		}

		feed.GET("/doctor/:userId/posts", handler.GetDoctorPosts)
	}
}
