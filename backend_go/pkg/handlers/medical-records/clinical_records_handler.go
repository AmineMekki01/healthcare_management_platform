package medicalrecords

import (
	"log"
	"net/http"

	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/models"
	medicalRecordsService "healthcare_backend/pkg/services/medical-records"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

type ClinicalRecordsHandler struct {
	medicalRecordsService *medicalRecordsService.MedicalRecordsService
	config                *config.Config
}

func NewClinicalRecordsHandler(db *pgxpool.Pool, cfg *config.Config) *ClinicalRecordsHandler {
	return &ClinicalRecordsHandler{
		medicalRecordsService: medicalRecordsService.NewMedicalRecordsService(db, cfg),
		config:                cfg,
	}
}

func (h *ClinicalRecordsHandler) GetMedicalRecordsByCategory(c *gin.Context) {
	userID := c.Query("user_id")
	userType := c.Query("user_type")
	category := c.Query("category")
	patientID := c.Query("patient_id")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	if userType == "patient" && patientID != "" && patientID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Patients can only access their own medical records"})
		return
	}

	records, err := h.medicalRecordsService.GetMedicalRecordsByCategory(userID, userType, category, patientID)
	if err != nil {
		log.Printf("Error getting medical records by category: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, records)
}

func (h *ClinicalRecordsHandler) GetAllUsers(c *gin.Context) {
	users, err := h.medicalRecordsService.GetAllUsers()
	if err != nil {
		log.Printf("Error getting all users: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, users)
}

func (h *ClinicalRecordsHandler) UploadAndShareClinicalDocument(c *gin.Context) {
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

	patientID := c.Request.FormValue("patient_id")
	category := c.Request.FormValue("category")
	uploadedByUserID := c.Request.FormValue("uploaded_by_user_id")
	uploadedByRole := c.Request.FormValue("uploaded_by_role")
	folderName := c.Request.FormValue("folder_name")

	if patientID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Patient ID is required for clinical documents"})
		return
	}

	if category == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Category is required for clinical documents"})
		return
	}

	if uploadedByRole != "doctor" && uploadedByRole != "receptionist" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only doctors and receptionists can upload clinical documents"})
		return
	}

	fileInfo.Name = handler.Filename
	fileInfo.Type = "file"
	ext := c.Request.FormValue("fileExt")
	if ext == "" {
		if dotIndex := len(handler.Filename) - 1; dotIndex > 0 {
			for i := dotIndex; i >= 0; i-- {
				if handler.Filename[i] == '.' {
					ext = handler.Filename[i+1:]
					break
				}
			}
		}
	}
	fileInfo.Ext = &ext

	fileInfo.FolderType = models.FolderTypeClinical
	categoryEnum := models.Category(category)
	fileInfo.Category = &categoryEnum
	fileInfo.PatientID = &patientID
	fileInfo.OwnerUserID = &patientID
	fileInfo.UploadedByUserID = &uploadedByUserID
	fileInfo.UploadedByRole = &uploadedByRole
	fileInfo.UserID = patientID
	fileInfo.UserType = "patient"

	if err := h.medicalRecordsService.ShareDocumentToPatient(&fileInfo, file, folderName, handler.Size, handler.Header.Get("Content-Type")); err != nil {
		log.Printf("Error uploading clinical document: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload clinical document"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Clinical document uploaded successfully",
		"documentId": fileInfo.ID,
		"category":   category,
		"patientId":  patientID,
	})
}

func (h *ClinicalRecordsHandler) GetCategoriesForRole(c *gin.Context) {
	userType := c.Query("user_type")

	categories := []map[string]string{
		{"value": string(models.CategoryLabResults), "label": models.CategoryLabResults.GetDisplayName()},
		{"value": string(models.CategoryImagingCT), "label": models.CategoryImagingCT.GetDisplayName()},
		{"value": string(models.CategoryImagingXray), "label": models.CategoryImagingXray.GetDisplayName()},
		{"value": string(models.CategoryImagingUS), "label": models.CategoryImagingUS.GetDisplayName()},
		{"value": string(models.CategoryImagingMammo), "label": models.CategoryImagingMammo.GetDisplayName()},
		{"value": string(models.CategoryImagingMRI), "label": models.CategoryImagingMRI.GetDisplayName()},
		{"value": string(models.CategoryImagingPET), "label": models.CategoryImagingPET.GetDisplayName()},
		{"value": string(models.CategoryClinicalReport), "label": models.CategoryClinicalReport.GetDisplayName()},
		{"value": string(models.CategoryDischarge), "label": models.CategoryDischarge.GetDisplayName()},
		{"value": string(models.CategoryOther), "label": models.CategoryOther.GetDisplayName()},
	}

	c.JSON(http.StatusOK, gin.H{
		"categories": categories,
		"userType":   userType,
	})
}
