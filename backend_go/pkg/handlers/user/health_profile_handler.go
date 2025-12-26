package user

import (
	"log"
	"net/http"

	"healthcare_backend/pkg/models"
	userService "healthcare_backend/pkg/services/user"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type HealthProfileHandler struct {
	service *userService.HealthProfileService
}

func NewHealthProfileHandler(service *userService.HealthProfileService) *HealthProfileHandler {
	return &HealthProfileHandler{service: service}
}

func (h *HealthProfileHandler) GetHealthProfile(c *gin.Context) {
	userIDStr := c.Param("userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	userType := c.Query("userType")
	if userType == "" {
		if val, exists := c.Get("userType"); exists {
			userType = val.(string)
		} else {
			userType = "patient"
		}
	}

	profile, err := h.service.GetHealthProfile(userID, userType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, profile)
}

func (h *HealthProfileHandler) UpdateHealthProfile(c *gin.Context) {
	userIDStr := c.Param("userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	userType := c.Query("userType")
	if userType == "" {
		if val, exists := c.Get("userType"); exists {
			userType = val.(string)
		} else {
			userType = "patient"
		}
	}

	var req models.UpdateHealthProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	profile, err := h.service.UpdateHealthProfile(userID, userType, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, profile)
}

func (h *HealthProfileHandler) GetVaccinations(c *gin.Context) {
	userIDStr := c.Param("userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	userType := c.Query("userType")
	if userType == "" {
		if val, exists := c.Get("userType"); exists {
			userType = val.(string)
		} else {
			userType = "patient"
		}
	}

	vaccinations, err := h.service.GetVaccinations(userID, userType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, vaccinations)
}

func (h *HealthProfileHandler) CreateVaccination(c *gin.Context) {
	userIDStr := c.Param("userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		log.Println("Invalid user ID: ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	userType := c.Query("userType")
	if userType == "" {
		if val, exists := c.Get("userType"); exists {
			userType = val.(string)
		} else {
			userType = "patient"
		}
	}

	var req models.CreateVaccinationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Println("Invalid request body: ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	vaccination, err := h.service.CreateVaccination(userID, userType, req)
	if err != nil {
		log.Println("Failed to create vaccination: ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, vaccination)
}

func (h *HealthProfileHandler) UpdateVaccination(c *gin.Context) {
	userIDStr := c.Param("userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	vaccinationIDStr := c.Param("vaccinationId")
	vaccinationID, err := uuid.Parse(vaccinationIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vaccination ID"})
		return
	}

	userType := c.Query("userType")
	if userType == "" {
		if val, exists := c.Get("userType"); exists {
			userType = val.(string)
		} else {
			userType = "patient"
		}
	}

	var req models.UpdateVaccinationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	vaccination, err := h.service.UpdateVaccination(vaccinationID, userID, userType, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, vaccination)
}

func (h *HealthProfileHandler) DeleteVaccination(c *gin.Context) {
	userIDStr := c.Param("userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	vaccinationIDStr := c.Param("vaccinationId")
	vaccinationID, err := uuid.Parse(vaccinationIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vaccination ID"})
		return
	}

	userType := c.Query("userType")
	if userType == "" {
		if val, exists := c.Get("userType"); exists {
			userType = val.(string)
		} else {
			userType = "patient"
		}
	}

	err = h.service.DeleteVaccination(vaccinationID, userID, userType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Vaccination deleted successfully"})
}
