package medicalrecords

import (
	"fmt"
	"log"
	"net/http"

	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/models"
	medicalRecordsService "healthcare_backend/pkg/services/medical-records"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v4/pgxpool"
)

type MedicalRecordsHandler struct {
	medicalRecordsService *medicalRecordsService.MedicalRecordsService
	config                *config.Config
}

func NewMedicalRecordsHandler(db *pgxpool.Pool, cfg *config.Config) *MedicalRecordsHandler {
	return &MedicalRecordsHandler{
		medicalRecordsService: medicalRecordsService.NewMedicalRecordsService(db, cfg),
		config:                cfg,
	}
}

func (h *MedicalRecordsHandler) CreateFolder(c *gin.Context) {
	var fileFolder models.FileFolder
	if err := c.ShouldBind(&fileFolder); err != nil {
		log.Printf("Error parsing form: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	if err := h.medicalRecordsService.CreateFolder(&fileFolder); err != nil {
		log.Printf("Error creating folder: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, fileFolder)
}

func (h *MedicalRecordsHandler) UploadFile(c *gin.Context) {
	var fileInfo models.FileFolder

	err := c.Request.ParseMultipartForm(10 << 20)
	if err != nil {
		log.Printf("Error parsing multipart form: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Could not parse multipart form"})
		return
	}

	file, handler, err := c.Request.FormFile("file")
	if err != nil {
		log.Printf("Error retrieving file from request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Could not get file from request"})
		return
	}
	defer file.Close()

	parentFolderID := c.Request.FormValue("parentFolderId")
	if parentFolderID != "" {
		if _, err := uuid.Parse(parentFolderID); err != nil {
			log.Printf("Invalid parentFolderId: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parentFolderId"})
			return
		}
		fileInfo.ParentID = &parentFolderID
	}

	fileInfo.Type = c.Request.FormValue("fileType")
	ext := c.Request.FormValue("fileExt")
	fileInfo.Ext = &ext
	fileInfo.UserID = c.Request.FormValue("userId")
	fileInfo.UserType = c.Request.FormValue("userType")
	fileInfo.Name = handler.Filename

	if err := h.medicalRecordsService.UploadFile(&fileInfo, file, handler.Size, handler.Header.Get("Content-Type")); err != nil {
		log.Printf("Error uploading file: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "File uploaded successfully"})
}

func (h *MedicalRecordsHandler) DownloadFile(c *gin.Context) {
	fileID := c.Param("fileId")
	if fileID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File ID is required"})
		return
	}

	file, fileReader, err := h.medicalRecordsService.DownloadFile(fileID)
	if err != nil {
		log.Printf("Error downloading file: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not download file"})
		return
	}
	defer fileReader.Close()

	if file.Type == "folder" {
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s.zip", file.Name))
		c.Header("Content-Type", "application/zip")
	} else {
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", file.Name))
		c.Header("Content-Type", "application/octet-stream")
	}

	c.DataFromReader(http.StatusOK, -1, "application/octet-stream", fileReader, nil)
}

func (h *MedicalRecordsHandler) DeleteFolderAndContents(c *gin.Context) {
	var request struct {
		FolderID string `json:"folderId"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		log.Printf("Error parsing JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if err := h.medicalRecordsService.DeleteFolderAndContents(request.FolderID); err != nil {
		log.Printf("Error deleting folder: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Folder and contents deleted successfully"})
}

func (h *MedicalRecordsHandler) RenameFileOrFolder(c *gin.Context) {
	var request struct {
		ID   string `json:"id" binding:"required"`
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		log.Printf("Error parsing JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if err := h.medicalRecordsService.RenameFileOrFolder(request.ID, request.Name); err != nil {
		log.Printf("Error renaming item: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item renamed successfully"})
}

func (h *MedicalRecordsHandler) GetBreadcrumbs(c *gin.Context) {
	folderID := c.Param("folderId")
	if folderID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Folder ID is required"})
		return
	}

	breadcrumbs, err := h.medicalRecordsService.GetBreadcrumbs(folderID)
	if err != nil {
		log.Printf("Error getting breadcrumbs: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, breadcrumbs)
}

func (h *MedicalRecordsHandler) GetFolders(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	parentID := c.Query("parent_id")
	isSharedWithMe := c.Query("shared_with_me") == "true"

	folders, err := h.medicalRecordsService.GetFolders(userID, parentID, isSharedWithMe)
	if err != nil {
		log.Printf("Error getting folders: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, folders)
}

func (h *MedicalRecordsHandler) GetSubFolders(c *gin.Context) {
	parentID := c.Param("folderId")
	if parentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Folder ID is required"})
		return
	}

	subfolders, err := h.medicalRecordsService.GetSubFolders(parentID)
	if err != nil {
		log.Printf("Error getting subfolders: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, subfolders)
}
