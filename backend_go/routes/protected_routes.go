// routes/protected_routes.go
package routes

import (
	"backend_go/middlewares"
	"backend_go/services"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

func SetupProtectedRoutes(r *gin.RouterGroup, pool *pgxpool.Pool) {

	// token refresh for inactivity
	r.POST("/api/v1/refresh-token", func(c *gin.Context) {
		middlewares.RefreshToken(c)
	})

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
	r.POST("/api/v1/cancel-appointment", func(c *gin.Context) {
		services.CancelAppointment(c, pool)
	})
	r.GET("/api/v1/appointments/stats", func(c *gin.Context) {
		services.GetReservationsCount(c, pool)
	})
	r.GET("/api/v1/appointments/:appointmentId", func(c *gin.Context) {
		services.GetAnAppointment(c, pool)
	})
	r.POST("/api/v1/reports", func(c *gin.Context) {
		services.CreateReport(c, pool)
	})

	r.POST("/api/v1/reports/notify", func(c *gin.Context) {
		services.SendReportNotification(c, pool)
	})

	r.GET("/api/v1/doctor-report/:reportId", func(c *gin.Context) {
		services.GetReport(c, pool)
	})
	r.GET("/api/v1/reports/:userId", func(c *gin.Context) {
		services.GetReports(c, pool)
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
	r.POST("/api/v1/upload-image", func(c *gin.Context) {
		services.UploadImage(c, pool)
	})

	// User Profiles
	r.GET("/api/v1/users/image/:userId", func(c *gin.Context) {
		services.GetUserImage(c, pool)
	})

	r.GET("/api/v1/user/:userId", func(c *gin.Context) {
		services.GetUserById(c, pool)
	})
	r.PUT("/api/v1/user/profile/:userId", func(c *gin.Context) {
		services.UpdateUserInfo(c, pool)
	})

	// Doctor Information
	r.GET("/api/v1/doctors", func(c *gin.Context) {
		services.SearchForDoctors(c, pool)
	})
	r.GET("/api/v1/doctors/:doctorId", func(c *gin.Context) {
		services.GetDoctorById(c, pool)
	})

	// File Management
	r.POST("/api/v1/create-folder", func(c *gin.Context) {
		services.CreateFolder(c, pool)
	})
	r.GET("/api/v1/folders", func(c *gin.Context) {
		services.GetFolders(c, pool)
	})
	r.GET("/api/v1/folders/:folderId/subfolders", func(c *gin.Context) {
		services.GetSubFolders(c, pool)
	})
	r.GET("/api/v1/folders/:folderId/breadcrumbs", func(c *gin.Context) {
		services.GetBreadcrumbs(c, pool)
	})
	r.DELETE("/api/v1/delete-files/:folderId", func(c *gin.Context) {
		services.DeleteFolderAndContents(c, pool)
	})
	r.PATCH("/api/v1/rename-item", func(c *gin.Context) {
		services.RenameFileOrFolder(c, pool)
	})
	r.POST("/api/v1/upload-file", func(c *gin.Context) {
		services.UploadFile(c, pool)
	})
	r.GET("/api/v1/download-file/:fileId", func(c *gin.Context) {
		services.DownloadFile(c, pool)
	})

	// Feed and Posts
	r.GET("/api/v1/feed", services.GetFeed(pool))
	r.POST("/api/v1/feed/posts/:postID/like", services.LikePost(pool))
	r.POST("/api/v1/feed/posts/:postID/unlike", services.UnlikePost(pool))
	r.POST("/api/v1/feed/posts/:postID/add-comment", services.AddComment(pool))
	r.GET("/api/v1/feed/posts/:postID/comments", services.GetComments(pool))
	r.GET("/api/v1/feed/posts/:postID", func(c *gin.Context) {
		services.GetPostByID(c, pool)
	})
	r.GET("/api/v1/doctor/posts/:userId", services.GetDoctorPosts(pool))
	r.PUT("/api/v1/posts/:postID/edit", services.EditDoctorPost(pool))
	r.DELETE("/api/v1/posts/:postID", services.DeleteDoctorPost(pool))

	// Following Doctors
	r.POST("/api/v1/follow-doctor", func(c *gin.Context) {
		services.FollowDoctor(pool, c)
	})
	r.DELETE("/api/v1/unfollow-doctor", func(c *gin.Context) {
		services.UnFollowDoctor(pool, c)
	})
	r.GET("/api/v1/is-following/:doctorId", func(c *gin.Context) {
		services.IsFollowingDoctor(pool, c)
	})
	r.GET("/api/v1/doctor-follow-count/:doctorId", func(c *gin.Context) {
		services.GetDoctorFollowerCount(pool, c)
	})
	r.GET("/api/v1/patient-followings/:patientId", func(c *gin.Context) {
		services.GetUserFollowings(c, pool)
	})

	// diag
	r.GET("/api/v1/patients/medical-history/:patientId", func(c *gin.Context) {
		services.GetPatientMedicalHistory(c, pool)
	})
	r.GET("/api/v1/patients/medications/:patientId", func(c *gin.Context) {
		services.GetPatientMedications(c, pool)
	})
	r.GET("/api/v1/patients/diagnosis-info/:diagnosisId", func(c *gin.Context) {
		services.GetDiagnosisPage(c, pool)
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
