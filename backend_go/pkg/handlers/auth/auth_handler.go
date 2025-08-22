package auth

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"healthcare_backend/pkg/auth"
	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/models"
	authService "healthcare_backend/pkg/services/auth"
	"healthcare_backend/pkg/services/doctor"
	"healthcare_backend/pkg/services/patient"
	"healthcare_backend/pkg/services/receptionist"
	"healthcare_backend/pkg/utils"
	"healthcare_backend/pkg/utils/validators"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v4/pgxpool"
)

type AuthHandler struct {
	authService         *authService.AuthService
	doctorService       *doctor.DoctorService
	patientService      *patient.PatientService
	receptionistService *receptionist.ReceptionistService
}

func NewAuthHandler(db *pgxpool.Pool, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		authService:         authService.NewAuthService(db, cfg),
		doctorService:       doctor.NewDoctorService(db, cfg),
		patientService:      patient.NewPatientService(db, cfg),
		receptionistService: receptionist.NewReceptionistService(db, cfg),
	}
}

func (h *AuthHandler) ActivateAccount(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid token"})
		return
	}

	err := h.authService.ActivateAccount(token)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Account activated successfully"})
}

func (h *AuthHandler) RequestReset(c *gin.Context) {
	var request struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	err := h.authService.RequestPasswordReset(request.Email)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password reset email sent"})
}

func (h *AuthHandler) UpdatePassword(c *gin.Context) {
	var request struct {
		Token    string `json:"token" binding:"required"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	err := h.authService.UpdatePassword(request.Token, request.Password)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	refreshToken := c.GetHeader("Authorization")
	if refreshToken == "" {
		log.Println("No token provided.")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No token provided"})
		return
	}

	refreshToken = strings.TrimPrefix(refreshToken, "Bearer ")

	token, err := auth.ValidateRefreshToken(refreshToken)
	if err != nil || !token.Valid {
		log.Println("Invalid or expired refresh token : ", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired refresh token"})
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		log.Println("Invalid token claims")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		return
	}

	userID, ok := claims["userId"].(string)
	if !ok {
		log.Println("UserID not found in token claims")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		return
	}

	userType, ok := claims["userType"].(string)
	if !ok {
		log.Println("UserType not found in token claims")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		return
	}

	newAccessToken, err := auth.GenerateAccessToken(userID, userType)
	if err != nil {
		log.Println("Failed to generate new access token : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate new access token"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"accessToken": newAccessToken,
	})
}

func (h *AuthHandler) RegisterDoctor(c *gin.Context) {
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

func (h *AuthHandler) LoginDoctor(c *gin.Context) {
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

func (h *AuthHandler) RegisterPatient(c *gin.Context) {
	var patient models.Patient

	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	patient.PatientID = uuid.New()

	patient.Username = c.PostForm("Username")
	patient.Password = c.PostForm("Password")
	patient.Email = c.PostForm("Email")
	patient.PhoneNumber = c.PostForm("PhoneNumber")
	patient.FirstName = c.PostForm("FirstName")
	patient.LastName = c.PostForm("LastName")
	patient.BirthDate = c.PostForm("BirthDate")
	patient.StreetAddress = c.PostForm("StreetAddress")
	patient.CityName = c.PostForm("CityName")
	patient.StateName = c.PostForm("StateName")
	patient.ZipCode = c.PostForm("ZipCode")
	patient.CountryName = c.PostForm("CountryName")
	patient.Sex = c.PostForm("Sex")
	patient.Bio = c.PostForm("PatientBio")

	file, handler, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to upload file"})
		return
	}
	defer file.Close()

	fileName := fmt.Sprintf("images/profile_photos/%s.jpg", patient.PatientID.String())
	err = utils.UploadToS3(file, handler, fileName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload profile photo"})
		return
	}
	patient.ProfilePictureURL = fileName

	err = h.patientService.RegisterPatient(patient)
	if err != nil {
		if err.Error() == "email already exists" || err.Error() == "username already exists" {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration failed: " + err.Error()})
		return
	}

	verificationLink := validators.GenerateVerificationLink(patient.Email, c, h.patientService.GetDBPool())
	if verificationLink == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate verification link"})
		return
	}

	err = validators.SendVerificationEmail(patient.Email, verificationLink)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send verification email: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": "true",
		"message": "Patient created successfully. Please check your email to verify your account.",
	})
}

func (h *AuthHandler) LoginPatient(c *gin.Context) {
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

	patient, accessToken, refreshToken, err := h.patientService.LoginPatient(loginRequest.Email, loginRequest.Password)
	if err != nil {
		if err.Error() == "account not verified" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Account Not Verified, Please check your email to verify your account.",
			})
			return
		}
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Invalid email or password",
		})
		return
	}

	response := gin.H{
		"success":           true,
		"accessToken":       accessToken,
		"refreshToken":      refreshToken,
		"userId":            patient.PatientID.String(),
		"firstName":         patient.FirstName,
		"lastName":          patient.LastName,
		"profilePictureUrl": patient.ProfilePictureURL,
	}

	c.JSON(http.StatusOK, response)
}

func (h *AuthHandler) RegisterReceptionist(c *gin.Context) {
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

func (h *AuthHandler) LoginReceptionist(c *gin.Context) {
	var req models.ReceptionistLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Login failed for email: %s - %v", req.Email, err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	receptionist, accessToken, refreshToken, err := h.receptionistService.LoginReceptionist(req.Email, req.Password)
	if err != nil {
		log.Printf("Login failed for email: %s - %v", req.Email, err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	log.Println("recep : ", receptionist)

	c.JSON(http.StatusOK, gin.H{
		"receptionist": receptionist,
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
	})
}

func (h *AuthHandler) ServeWS(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "WebSocket to be implemented"})
}
