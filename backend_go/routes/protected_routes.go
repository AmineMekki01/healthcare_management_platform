// routes/protected_routes.go
package routes

import (
	"backend_go/services"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

func SetupProtectedRoutes(r *gin.RouterGroup, pool *pgxpool.Pool) {
	// Appointments
	r.GET("/api/v1/availabilities", func(c *gin.Context) {
		services.GetAvailabilities(c, pool)
	})
	r.POST("/api/v1/reservations", func(c *gin.Context) {
		services.CreateReservation(c, pool)
	})
	r.GET("/api/v1/reservations", func(c *gin.Context) {
		services.GetReservations(c, pool)
	})

	// Chat
	r.GET("/api/v1/search/:username/:userId", func(c *gin.Context) {
		services.SearchUsers(c, pool)
	})
	r.GET("/api/v1/messages/:chatId", func(c *gin.Context) {
		services.GetMessagesForChat(c, pool)
	})
	r.GET("/api/findOrCreateChat", func(c *gin.Context) {
		services.FindOrCreateChatWithUser(c, pool)
	})
	r.GET("/api/v1/chats", func(c *gin.Context) {
		services.ListChatsForUser(c, pool)
	})
	r.POST("/api/v1/SendMessage", func(c *gin.Context) {
		services.SendMessage(c, pool)
	})

	// User Profiles
	r.GET("/api/v1/users/:userID/image", func(c *gin.Context) {
		services.GetUserImage(c, pool)
	})
	r.GET("/api/v1/patients/:patientId", func(c *gin.Context) {
		services.GetPatientById(c, pool)
	})

	// Doctor Information
	r.GET("/api/v1/doctors", func(c *gin.Context) {
		services.GetAllDoctors(c, pool)
	})
	r.GET("/api/v1/doctors/:doctorId", func(c *gin.Context) {
		services.GetDoctorById(c, pool)
	})

	// File Management
	r.POST("/create-folder", func(c *gin.Context) {
		services.CreateFolder(c, pool)
	})
	r.GET("/folders", func(c *gin.Context) {
		services.GetFolders(c, pool)
	})
	r.GET("/folders/:folderId/subfolders", func(c *gin.Context) {
		services.GetSubfolders(c, pool)
	})
	r.GET("/folders/:folderId/breadcrumbs", func(c *gin.Context) {
		services.GetBreadcrumbs(c, pool)
	})
	r.DELETE("/delete-files/:folderId", func(c *gin.Context) {
		services.DeleteFolderAndContents(c, pool)
	})
	r.PATCH("/rename-item", func(c *gin.Context) {
		services.RenameFileOrFolder(c, pool)
	})
	r.POST("/upload-file", func(c *gin.Context) {
		services.UploadFile(c, pool)
	})
	r.GET("/download-file/:fileId", func(c *gin.Context) {
		services.DownloadFile(c, pool)
	})

	// Feed and Posts
	r.GET("/api/v1/feed", services.GetFeed(pool))
	r.POST("/feed/posts/:postID/like", services.LikePost(pool))
	r.POST("/feed/posts/:postID/unlike", services.UnlikePost(pool))
	r.POST("/feed/posts/:postID/add-comment", services.AddComment(pool))
	r.GET("/feed/posts/:postID/comments", services.GetComments(pool))

	// Following Doctors
	r.POST("/api/v1/follow-doctor", func(c *gin.Context) {
		services.FollowDoctor(pool, c)
	})
	r.GET("/api/v1/is-following/:doctorId", func(c *gin.Context) {
		services.IsFollowingDoctor(pool, c)
	})
	r.GET("/api/v1/doctor-follow-count/:doctorId", func(c *gin.Context) {
		services.GetDoctorFollowerCount(pool, c)
	})

	// Sharing
	r.POST("/api/v1/share", func(c *gin.Context) {
		services.ShareItem(c, pool)
	})
	r.GET("/api/v1/shared-with-me", func(c *gin.Context) {
		services.GetSharedWithMe(c, pool)
	})
	r.GET("/api/v1/shared-by-me", func(c *gin.Context) {
		services.GetSharedByMe(c, pool)
	})
	r.GET("/api/v1/doctors-to-share-with", func(c *gin.Context) {
		services.ListDoctors(c, pool)
	})
}
