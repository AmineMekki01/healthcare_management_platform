package doctor

import (
	"log"
	"net/http"
	"strconv"

	"healthcare_backend/pkg/services/doctor"
	"healthcare_backend/pkg/utils/validators"

	"github.com/gin-gonic/gin"
)

type DoctorHandler struct {
	doctorService *doctor.DoctorService
}

func NewDoctorHandler(doctorService *doctor.DoctorService) *DoctorHandler {
	return &DoctorHandler{
		doctorService: doctorService,
	}
}

func (h *DoctorHandler) GetDoctorProfile(c *gin.Context) {
	doctorID := c.Param("id")

	if doctorID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Doctor ID is required"})
		return
	}

	doctor, err := h.doctorService.GetDoctorByID(doctorID)
	if err != nil {
		if err.Error() == "doctor not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Doctor not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error retrieving doctor profile: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, doctor)
}

func (h *DoctorHandler) GetDoctorByID(c *gin.Context) {
	doctorID := c.Param("doctorId")

	if doctorID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Doctor ID is required"})
		return
	}

	doctor, err := h.doctorService.GetDoctorByID(doctorID)
	if err != nil {
		if err.Error() == "doctor not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Doctor not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error retrieving doctor profile: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, doctor)
}

func (h *DoctorHandler) SearchDoctors(c *gin.Context) {
	searchQuery := c.Query("query")
	specialty := c.Query("specialty")
	specialtyCode := c.Query("specialtyCode")
	if specialty == "" {
		specialty = specialtyCode
	}
	location := c.Query("location")

	var userLatitude, userLongitude float64
	var err error

	if latStr := c.Query("latitude"); latStr != "" {
		userLatitude, err = strconv.ParseFloat(latStr, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid latitude format"})
			return
		}
	}

	if lngStr := c.Query("longitude"); lngStr != "" {
		userLongitude, err = strconv.ParseFloat(lngStr, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid longitude format"})
			return
		}
	}

	doctors, err := h.doctorService.SearchDoctors(searchQuery, specialty, location, userLatitude, userLongitude)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error searching doctors: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, doctors)
}

func (h *DoctorHandler) VerifyAccount(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Verification token is required"})
		return
	}

	email, err := validators.VerifyToken(token, h.doctorService.GetDBPool())
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired verification token"})
		return
	}

	err = h.doctorService.MarkAccountAsVerified(email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Account verified successfully",
		"email":   email,
	})
}

func (h *DoctorHandler) ResendVerificationEmail(c *gin.Context) {
	var request struct {
		Email string `json:"email"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON format"})
		return
	}

	if request.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email is required"})
		return
	}

	exists, err := h.doctorService.EmailExists(request.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error checking email"})
		return
	}

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Email not found"})
		return
	}

	isVerified, err := validators.IsUserAccountVerified(request.Email, "doctor_info", h.doctorService.GetDBPool())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error checking verification status"})
		return
	}

	if isVerified {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Account is already verified"})
		return
	}

	verificationLink := validators.GenerateVerificationLink(request.Email, c, h.doctorService.GetDBPool())
	if verificationLink == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate verification link"})
		return
	}

	err = validators.SendVerificationEmail(request.Email, verificationLink)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send verification email: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Verification email sent successfully",
		"email":   request.Email,
	})
}

func (h *DoctorHandler) GetDoctorPatients(c *gin.Context) {
	doctorID := c.Param("doctorId")

	if doctorID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Doctor ID is required"})
		return
	}

	patients, err := h.doctorService.GetDoctorPatients(doctorID)
	if err != nil {
		log.Printf("Error fetching doctor patients: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch patients"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"patients": patients})
}
