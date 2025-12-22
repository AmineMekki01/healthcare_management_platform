package medicalrecords

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/models"
	medicalRecordsService "healthcare_backend/pkg/services/medical-records"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v4/pgxpool"
)

type MedicalRecordsHandler struct {
	medicalRecordsService *medicalRecordsService.MedicalRecordsService
	historyService        *medicalRecordsService.HistoryService
	config                *config.Config
}

func NewMedicalRecordsHandler(db *pgxpool.Pool, cfg *config.Config) *MedicalRecordsHandler {
	return &MedicalRecordsHandler{
		medicalRecordsService: medicalRecordsService.NewMedicalRecordsService(db, cfg),
		historyService:        medicalRecordsService.NewHistoryService(db),
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

	fileInfo.Type = c.Request.FormValue("file_type")
	ext := c.Request.FormValue("file_ext")
	fileInfo.Ext = &ext
	fileInfo.UserID = c.Request.FormValue("user_id")
	fileInfo.UserType = c.Request.FormValue("user_type")
	fileInfo.Name = handler.Filename

	folderTypeStr := c.Request.FormValue("folder_type")
	if folderTypeStr != "" {
		fileInfo.FolderType = models.FolderType(folderTypeStr)
	} else {
		fileInfo.FolderType = models.FolderTypePersonal
	}

	categoryStr := c.Request.FormValue("category")
	if categoryStr != "" {
		category := models.Category(categoryStr)
		fileInfo.Category = &category
	}

	ownerUserID := c.Request.FormValue("owner_user_Id")
	if ownerUserID != "" {
		fileInfo.OwnerUserID = &ownerUserID
	}

	patientID := c.Request.FormValue("patient_id")
	if patientID != "" {
		fileInfo.PatientID = &patientID
	}

	uploadedByUserID := c.Request.FormValue("uploaded_by_user_id")
	if uploadedByUserID != "" {
		fileInfo.UploadedByUserID = &uploadedByUserID
	}

	uploadedByRole := c.Request.FormValue("uploaded_by_role")
	if uploadedByRole != "" {
		fileInfo.UploadedByRole = &uploadedByRole
	}

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
		log.Printf("Download request missing file ID")
		c.JSON(http.StatusBadRequest, gin.H{"error": "File ID is required"})
		return
	}

	file, fileReader, err := h.medicalRecordsService.DownloadFile(fileID)
	if err != nil {
		log.Printf("Error downloading file ID %s: %v", fileID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not download file"})
		return
	}
	defer fileReader.Close()

	if file.Name == "" {
		log.Printf("Warning: File name is empty for ID %s", fileID)
		file.Name = "download"
	}

	var contentType string
	var filename string

	if file.Type == "folder" {
		filename = fmt.Sprintf("%s.zip", file.Name)
		contentType = "application/zip"
	} else {
		filename = file.Name
		contentType = getContentTypeFromExtension(file.Ext)
	}

	origin := c.Request.Header.Get("Origin")
	if origin != "" {
		c.Header("Access-Control-Allow-Origin", origin)
		c.Header("Vary", "Origin")
		c.Header("Access-Control-Allow-Credentials", "true")
	}

	c.Header("Access-Control-Expose-Headers", "Content-Disposition, Content-Type")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	c.Header("Content-Type", contentType)
	c.Header("Cache-Control", "no-cache")

	c.DataFromReader(http.StatusOK, -1, contentType, fileReader, nil)
}

func (h *MedicalRecordsHandler) DownloadMultipleFiles(c *gin.Context) {
	var request struct {
		FileIDs    []string `json:"file_ids" binding:"required"`
		FolderName string   `json:"folder_name,omitempty"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		log.Printf("Error parsing JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if len(request.FileIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least one file ID is required"})
		return
	}

	zipReader, err := h.medicalRecordsService.DownloadMultipleFiles(request.FileIDs)
	if err != nil {
		log.Printf("Error downloading multiple files: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not download files"})
		return
	}
	defer zipReader.Close()

	var filename string
	if request.FolderName != "" {
		filename = fmt.Sprintf("%s.zip", request.FolderName)
	} else {
		filename = fmt.Sprintf("selected_files_%d.zip", len(request.FileIDs))
	}
	contentType := "application/zip"

	origin := c.Request.Header.Get("Origin")
	if origin != "" {
		c.Header("Access-Control-Allow-Origin", origin)
		c.Header("Vary", "Origin")
		c.Header("Access-Control-Allow-Credentials", "true")
	}

	c.Header("Access-Control-Expose-Headers", "Content-Disposition, Content-Type")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	c.Header("Content-Type", contentType)
	c.Header("Cache-Control", "no-cache")

	c.DataFromReader(http.StatusOK, -1, contentType, zipReader, nil)
}

func getContentTypeFromExtension(ext *string) string {
	if ext == nil {
		return "application/octet-stream"
	}

	extension := strings.ToLower(*ext)
	switch extension {
	case "pdf":
		return "application/pdf"
	case "jpg", "jpeg":
		return "image/jpeg"
	case "png":
		return "image/png"
	case "gif":
		return "image/gif"
	case "bmp":
		return "image/bmp"
	case "webp":
		return "image/webp"
	case "svg":
		return "image/svg+xml"
	case "doc":
		return "application/msword"
	case "docx":
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	case "xls":
		return "application/vnd.ms-excel"
	case "xlsx":
		return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	case "ppt":
		return "application/vnd.ms-powerpoint"
	case "pptx":
		return "application/vnd.openxmlformats-officedocument.presentationml.presentation"
	case "txt":
		return "text/plain"
	case "html", "htm":
		return "text/html"
	case "css":
		return "text/css"
	case "js":
		return "application/javascript"
	case "json":
		return "application/json"
	case "xml":
		return "application/xml"
	case "zip":
		return "application/zip"
	case "rar":
		return "application/vnd.rar"
	case "7z":
		return "application/x-7z-compressed"
	case "mp3":
		return "audio/mpeg"
	case "wav":
		return "audio/wav"
	case "mp4":
		return "video/mp4"
	case "avi":
		return "video/x-msvideo"
	case "mov":
		return "video/quicktime"
	default:
		return "application/octet-stream"
	}
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

func (h *MedicalRecordsHandler) GetFileHistory(c *gin.Context) {
	itemID := c.Param("itemId")
	if itemID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Item ID is required"})
		return
	}

	history, err := h.historyService.GetHistory(itemID)
	if err != nil {
		log.Printf("Error getting file history: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, history)
}
