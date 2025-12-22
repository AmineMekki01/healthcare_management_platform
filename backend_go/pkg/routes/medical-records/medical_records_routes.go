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
	clinicalHandler := medicalRecordsHandler.NewClinicalRecordsHandler(db, cfg)
	records := router.Group("/records")

	records.POST("/create-folder", handler.CreateFolder)
	records.GET("/folders", handler.GetFolders)
	records.GET("/folders/:folderId/subfolders", handler.GetSubFolders)
	records.GET("/folders/:folderId/breadcrumbs", handler.GetBreadcrumbs)
	records.DELETE("/delete-files/:folderId", handler.DeleteFolderAndContents)
	records.PATCH("/rename-item", handler.RenameFileOrFolder)
	records.POST("/upload-file", handler.UploadFile)
	records.GET("/download-file/:fileId", handler.DownloadFile)
	records.POST("/download-multiple-files", handler.DownloadMultipleFiles)
	records.GET("/items/:itemId/history", handler.GetFileHistory)

	records.GET("/medical-records/by-category", clinicalHandler.GetMedicalRecordsByCategory)
	records.GET("/medical-records/all-users", clinicalHandler.GetAllUsers)
	records.POST("/medical-records/upload-clinical", clinicalHandler.UploadAndShareClinicalDocument)
	records.GET("/medical-records/categories", clinicalHandler.GetCategoriesForRole)

	records.GET("/share/doctors", shareHandler.ListDoctors)
	records.POST("/share/items", shareHandler.ShareItems)
	records.GET("/share/shared-with-me", shareHandler.GetSharedWithMe)
	records.GET("/share/shared-by-me", shareHandler.GetSharedByMe)
}
