package handlers

import (
	"log"
	"net/http"

	"healthcare_backend/pkg/models"
	"healthcare_backend/pkg/services"

	"github.com/gin-gonic/gin"
)

type SettingsHandler struct {
	settingsService *services.SettingsService
}

func NewSettingsHandler(settingsService *services.SettingsService) *SettingsHandler {
	return &SettingsHandler{
		settingsService: settingsService,
	}
}

func (h *SettingsHandler) GetUserByID(c *gin.Context) {
	userID := c.Param("userId")
	userType := c.Query("userType")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	if userType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User type is required"})
		return
	}

	user, err := h.settingsService.GetUserByID(userID, userType)
	if err != nil {
		if err.Error() == "patient not found" || err.Error() == "doctor not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "invalid user type" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		log.Printf("Error getting user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *SettingsHandler) UpdateUserInfo(c *gin.Context) {
	userID := c.Param("userId")
	userType := c.Query("userType")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	if userType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User type is required"})
		return
	}

	if err := c.Request.ParseMultipartForm(50 << 20); err != nil {
		log.Println("Failed to parse multipart form:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	var updateData services.UserUpdateData
	if err := c.Bind(&updateData); err != nil {
		log.Println("Error binding form data:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form data"})
		return
	}

	file, handler, err := c.Request.FormFile("profilePhoto")

	var updatedProfile *models.StandardUserProfile

	if err == nil {
		defer file.Close()
		updatedProfile, err = h.settingsService.UpdateUserInfo(userID, userType, updateData, file, handler)
	} else {
		updatedProfile, err = h.settingsService.UpdateUserInfo(userID, userType, updateData, nil, nil)
	}

	if err != nil {
		if err.Error() == "invalid user type" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		log.Printf("Error updating user info: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user information"})
		return
	}

	c.JSON(http.StatusOK, updatedProfile)
}

func (h *SettingsHandler) GetDoctorAdditionalInfo(c *gin.Context) {
	doctorID := c.Param("doctorId")

	if doctorID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Doctor ID is required"})
		return
	}

	info, err := h.settingsService.GetDoctorAdditionalInfo(doctorID)
	if err != nil {
		if err.Error() == "invalid doctor ID" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		log.Printf("Error getting doctor additional info: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, info)
}

func (h *SettingsHandler) UpdateDoctorAdditionalInfo(c *gin.Context) {
	doctorID := c.Param("doctorId")

	if doctorID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Doctor ID is required"})
		return
	}

	var data services.DoctorAdditionalInfoData
	if err := c.ShouldBindJSON(&data); err != nil {
		log.Println("Invalid input:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	err := h.settingsService.UpdateDoctorAdditionalInfo(doctorID, data)
	if err != nil {
		if err.Error() == "invalid doctor ID" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		log.Printf("Error updating doctor additional info: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update doctor additional information"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Doctor additional info updated successfully"})
}
