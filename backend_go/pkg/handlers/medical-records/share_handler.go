package medicalrecords

import (
	"log"
	"net/http"

	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/models"
	shareService "healthcare_backend/pkg/services/medical-records"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

type ShareHandler struct {
	shareService *shareService.ShareService
	config       *config.Config
}

func NewShareHandler(db *pgxpool.Pool, cfg *config.Config) *ShareHandler {
	return &ShareHandler{
		shareService: shareService.NewShareService(db, cfg),
		config:       cfg,
	}
}

func (h *ShareHandler) ListDoctors(c *gin.Context) {
	doctors, err := h.shareService.ListDoctors()
	if err != nil {
		log.Printf("Error retrieving doctors list: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve doctors list"})
		return
	}

	c.JSON(http.StatusOK, doctors)
}

func (h *ShareHandler) ShareItems(c *gin.Context) {
	var req models.ShareRequest

	if err := c.BindJSON(&req); err != nil {
		log.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	err := h.shareService.ShareItems(req)
	if err != nil {
		log.Printf("Error sharing items: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Items shared successfully"})
}

func (h *ShareHandler) GetSharedWithMe(c *gin.Context) {
	userID := c.Query("userId")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId parameter is required"})
		return
	}

	items, err := h.shareService.GetSharedWithMe(userID)
	if err != nil {
		log.Printf("Error retrieving shared items: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve shared items"})
		return
	}

	if len(items) == 0 {
		c.JSON(http.StatusOK, []models.FileFolder{})
	} else {
		c.JSON(http.StatusOK, gin.H{"items": items})
	}
}

func (h *ShareHandler) GetSharedByMe(c *gin.Context) {
	userID := c.Query("userId")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId parameter is required"})
		return
	}

	items, err := h.shareService.GetSharedByMe(userID)
	if err != nil {
		log.Printf("Error retrieving shared items: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve shared items"})
		return
	}

	if len(items) == 0 {
		c.JSON(http.StatusOK, []models.FileFolder{})
	} else {
		c.JSON(http.StatusOK, gin.H{"items": items})
	}
}
