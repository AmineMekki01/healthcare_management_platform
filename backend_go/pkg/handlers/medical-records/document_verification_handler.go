package medicalrecords

import (
	"log"
	"net/http"
	"strconv"

	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/models"
	medicalRecordsService "healthcare_backend/pkg/services/medical-records"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

type DocumentVerificationHandler struct {
	docVerificationService *medicalRecordsService.DocumentVerificationService
	config                 *config.Config
}

func NewDocumentVerificationHandler(db *pgxpool.Pool, cfg *config.Config) *DocumentVerificationHandler {
	return &DocumentVerificationHandler{
		docVerificationService: medicalRecordsService.NewDocumentVerificationService(db, cfg),
		config:                 cfg,
	}
}

func (h *DocumentVerificationHandler) GetDocumentVerificationQueue(c *gin.Context) {
	receptionistID := c.Param("id")
	status := c.DefaultQuery("status", "pending")
	page := c.DefaultQuery("page", "1")
	limit := c.DefaultQuery("limit", "20")

	pageInt, _ := strconv.Atoi(page)
	limitInt, _ := strconv.Atoi(limit)

	result, err := h.docVerificationService.GetDocumentVerificationQueue(receptionistID, status, pageInt, limitInt)
	if err != nil {
		log.Printf("Error getting document verification queue: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *DocumentVerificationHandler) VerifyDocument(c *gin.Context) {
	documentID := c.Param("document_id")
	docID, err := strconv.Atoi(documentID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document ID"})
		return
	}

	var req models.DocumentVerificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	receptionistIDStr, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	err = h.docVerificationService.VerifyDocument(docID, req, receptionistIDStr.(string))
	if err != nil {
		log.Printf("Error verifying document: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Document verification updated successfully",
		"status":  req.Status,
	})
}

func (h *DocumentVerificationHandler) GetDocumentVerificationHistory(c *gin.Context) {
	receptionistID := c.Param("id")
	page := c.DefaultQuery("page", "1")
	limit := c.DefaultQuery("limit", "20")

	pageInt, _ := strconv.Atoi(page)
	limitInt, _ := strconv.Atoi(limit)

	filters := map[string]string{
		"status":    c.Query("status"),
		"date_from": c.Query("date_from"),
		"date_to":   c.Query("date_to"),
	}

	result, err := h.docVerificationService.GetDocumentVerificationHistory(receptionistID, filters, pageInt, limitInt)
	if err != nil {
		log.Printf("Error getting document verification history: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *DocumentVerificationHandler) GetPendingDocumentsCount(c *gin.Context) {
	receptionistID := c.Param("id")

	count, err := h.docVerificationService.GetPendingDocumentsCount(receptionistID)
	if err != nil {
		log.Printf("Error getting pending documents count: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"count": count})
}
