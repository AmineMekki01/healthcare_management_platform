package doctor

import (
	"fmt"
	"log"
	"net/http"
	"strconv"

	"healthcare_backend/pkg/models"
	"healthcare_backend/pkg/services/doctor"
	"healthcare_backend/pkg/utils"
	"healthcare_backend/pkg/utils/validators"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type DoctorHandler struct {
	doctorService *doctor.DoctorService
}

func NewDoctorHandler(doctorService *doctor.DoctorService) *DoctorHandler {
	return &DoctorHandler{
		doctorService: doctorService,
	}
}

func (h *DoctorHandler) RegisterDoctor(c *gin.Context) {
	var doctor models.Doctor

	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	doctor.DoctorID = uuid.New()

	doctor.Username = c.PostForm("Username")
	doctor.Password = c.PostForm("Password")
	doctor.Email = c.PostForm("Email")
	doctor.PhoneNumber = c.PostForm("PhoneNumber")
	doctor.FirstName = c.PostForm("FirstName")
	doctor.LastName = c.PostForm("LastName")
	doctor.BirthDate = c.PostForm("BirthDate")
	doctor.MedicalLicense = c.PostForm("MedicalLicense")
	doctor.StreetAddress = c.PostForm("StreetAddress")
	doctor.CityName = c.PostForm("CityName")
	doctor.StateName = c.PostForm("StateName")
	doctor.ZipCode = c.PostForm("ZipCode")
	doctor.CountryName = c.PostForm("CountryName")
	doctor.Bio = c.PostForm("Bio")
	doctor.Specialty = c.PostForm("Specialty")
	doctor.Experience = c.PostForm("Experience")
	doctor.Sex = c.PostForm("Sex")

	if latitude := c.PostForm("Latitude"); latitude != "" {
		if lat, err := strconv.ParseFloat(latitude, 64); err == nil {
			doctor.Latitude = lat
		}
	}

	if longitude := c.PostForm("Longitude"); longitude != "" {
		if lng, err := strconv.ParseFloat(longitude, 64); err == nil {
			doctor.Longitude = lng
		}
	}

	file, handler, err := c.Request.FormFile("file")
	if err == nil {
		defer file.Close()
		doctor.ProfilePictureURL = fmt.Sprintf("images/profile_photos/%s.jpg", doctor.DoctorID)
		err = utils.UploadToS3(file, handler, doctor.ProfilePictureURL)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload profile photo"})
			return
		}
	}

	if doctor.Email == "" || doctor.Password == "" || doctor.FirstName == "" || doctor.LastName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email, password, first name, and last name are required"})
		return
	}

	registeredDoctor, err := h.doctorService.RegisterDoctor(doctor)
	if err != nil {
		if err.Error() == "email already exists" || err.Error() == "username already exists" {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration failed: " + err.Error()})
		return
	}

	verificationLink := validators.GenerateVerificationLink(registeredDoctor.Email, c, h.doctorService.GetDBPool())
	if verificationLink == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate verification link"})
		return
	}

	err = validators.SendVerificationEmail(registeredDoctor.Email, verificationLink)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send verification email: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":   "Doctor registered successfully",
		"doctor_id": registeredDoctor.DoctorID,
		"email":     registeredDoctor.Email,
		"name":      registeredDoctor.FirstName + " " + registeredDoctor.LastName,
	})
}

func (h *DoctorHandler) LoginDoctor(c *gin.Context) {
	var loginRequest struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&loginRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON format"})
		return
	}

	if loginRequest.Email == "" || loginRequest.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email and password are required"})
		return
	}

	isVerified, err := validators.IsUserAccountVerified(loginRequest.Email, "doctor_info", h.doctorService.GetDBPool())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error checking account verification status"})
		return
	}

	if !isVerified {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Account not verified. Please check your email for verification link.",
			"code":  "ACCOUNT_NOT_VERIFIED",
		})
		return
	}

	doctor, accessToken, refreshToken, err := h.doctorService.LoginDoctor(loginRequest.Email, loginRequest.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":           true,
		"accessToken":       accessToken,
		"refreshToken":      refreshToken,
		"userId":            doctor.DoctorID,
		"firstName":         doctor.FirstName,
		"email":             doctor.Email,
		"lastName":          doctor.LastName,
		"profilePictureUrl": doctor.ProfilePictureURL,
	})
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
