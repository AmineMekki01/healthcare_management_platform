package medicalrecords

import (
	"healthcare_backend/pkg/config"
	medicalRecordsHandler "healthcare_backend/pkg/handlers/medical-records"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

func SetupMedicalRecordsRoutes(router *gin.RouterGroup, db *pgxpool.Pool, cfg *config.Config) {
	handler := medicalRecordsHandler.NewMedicalRecordsHandler(db, cfg)
	shareHandler := medicalRecordsHandler.NewShareHandler(db, cfg)
	docVerificationHandler := medicalRecordsHandler.NewDocumentVerificationHandler(db, cfg)

	router.POST("/create-folder", handler.CreateFolder)
	router.GET("/folders", handler.GetFolders)
	router.GET("/folders/:folderId/subfolders", handler.GetSubFolders)
	router.GET("/folders/:folderId/breadcrumbs", handler.GetBreadcrumbs)
	router.DELETE("/delete-files/:folderId", handler.DeleteFolderAndContents)
	router.PATCH("/rename-item", handler.RenameFileOrFolder)
	router.POST("/upload-file", handler.UploadFile)
	router.GET("/download-file/:fileId", handler.DownloadFile)

	router.GET("/share/doctors", shareHandler.ListDoctors)
	router.POST("/share/items", shareHandler.ShareItems)
	router.GET("/share/shared-with-me", shareHandler.GetSharedWithMe)
	router.GET("/share/shared-by-me", shareHandler.GetSharedByMe)

	router.GET("/documents/queue/:id", docVerificationHandler.GetDocumentVerificationQueue)
	router.PUT("/documents/verify/:document_id", docVerificationHandler.VerifyDocument)
	router.GET("/documents/history/:id", docVerificationHandler.GetDocumentVerificationHistory)
	router.GET("/documents/pending-count/:id", docVerificationHandler.GetPendingDocumentsCount)
}
