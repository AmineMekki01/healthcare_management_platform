package handlers

import (
	"log"
	"net/http"

	"healthcare_backend/pkg/models"
	receptionistService "healthcare_backend/pkg/services/receptionist"

	"github.com/gin-gonic/gin"
)

type ReceptionistHandler struct {
	receptionistService *receptionistService.ReceptionistService
}

func NewReceptionistHandler(
	receptionistService *receptionistService.ReceptionistService,
) *ReceptionistHandler {
	return &ReceptionistHandler{
		receptionistService: receptionistService,
	}
}

func (h *ReceptionistHandler) RegisterReceptionist(c *gin.Context) {
	var req models.ReceptionistRegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	receptionist, err := h.receptionistService.RegisterReceptionist(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"receptionist": receptionist,
	})
}

func (h *ReceptionistHandler) LoginReceptionist(c *gin.Context) {
	var req models.ReceptionistLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	receptionist, accessToken, refreshToken, err := h.receptionistService.LoginReceptionist(req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	log.Println("LoginReceptionist rece handeler: ", receptionist)

	c.JSON(http.StatusOK, gin.H{
		"receptionist": receptionist,
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
	})
}

func (h *ReceptionistHandler) GetReceptionistProfile(c *gin.Context) {
	receptionistID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	receptionist, err := h.receptionistService.GetReceptionistProfile(receptionistID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"receptionist": receptionist,
	})
}

func (h *ReceptionistHandler) UpdateReceptionistProfile(c *gin.Context) {
	receptionistID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req models.ReceptionistProfileUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	err := h.receptionistService.UpdateReceptionistProfile(receptionistID.(string), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}
