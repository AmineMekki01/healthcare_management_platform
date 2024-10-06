// routes/feed_routes.go
package routes

import (
	"backend_go/services"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

func SetupFeedRoutes(r *gin.Engine, db *pgxpool.Pool) {
	feedGroup := r.Group("/api/v1")

	feedGroup.GET("/feed", services.GetFeed(db))

	feedGroup.POST("/blog-posts", services.CreateBlogPost(db))

	feedGroup.POST("/feed/posts/:postID/like", services.LikePost(db))
	feedGroup.POST("/feed/posts/:postID/unlike", services.UnlikePost(db))

	feedGroup.POST("/feed/posts/:postID/add-comment", services.AddComment(db))
	feedGroup.GET("/feed/posts/:postID/comments", services.GetComments(db))

}
