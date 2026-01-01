package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

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
	cfg                 *config.Config
	db                  *pgxpool.Pool
}

func NewAuthHandler(db *pgxpool.Pool, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		authService:         authService.NewAuthService(db, cfg),
		doctorService:       doctor.NewDoctorService(db, cfg),
		patientService:      patient.NewPatientService(db, cfg),
		receptionistService: receptionist.NewReceptionistService(db, cfg),
		cfg:                 cfg,
		db:                  db,
	}
}

func (h *AuthHandler) setAuthCookies(c *gin.Context, accessToken, refreshToken string) {
	isProd := strings.EqualFold(h.cfg.AppEnv, "production")
	csrfToken := uuid.NewString()

	accessCookie := &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   isProd,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(auth.AccessTokenExpiry),
	}

	refreshCookie := &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   isProd,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(auth.RefreshTokenExpiry),
	}

	csrfCookie := &http.Cookie{
		Name:     "csrf_token",
		Value:    csrfToken,
		Path:     "/",
		HttpOnly: false,
		Secure:   isProd,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(auth.RefreshTokenExpiry),
	}

	http.SetCookie(c.Writer, accessCookie)
	http.SetCookie(c.Writer, refreshCookie)
	http.SetCookie(c.Writer, csrfCookie)
}

func (h *AuthHandler) clearAuthCookies(c *gin.Context) {
	isProd := strings.EqualFold(h.cfg.AppEnv, "production")

	accessCookie := &http.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   isProd,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
	}

	refreshCookie := &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   isProd,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
	}

	csrfCookie := &http.Cookie{
		Name:     "csrf_token",
		Value:    "",
		Path:     "/",
		HttpOnly: false,
		Secure:   isProd,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
	}

	http.SetCookie(c.Writer, accessCookie)
	http.SetCookie(c.Writer, refreshCookie)
	http.SetCookie(c.Writer, csrfCookie)
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID := c.GetString("userId")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userType := c.GetString("userType")
	if userType == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var assignedDoctorID *uuid.UUID
	if userType == "receptionist" {
		_ = h.db.QueryRow(context.Background(), "SELECT assigned_doctor_id FROM receptionists WHERE receptionist_id = $1", userID).Scan(&assignedDoctorID)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":          true,
		"userId":           userID,
		"userType":         userType,
		"assignedDoctorId": assignedDoctorID,
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	if refreshToken, err := c.Cookie("refresh_token"); err == nil && refreshToken != "" {
		_ = h.authService.RevokeAuthSession(c.Request.Context(), refreshToken)
	}
	h.clearAuthCookies(c)
	c.JSON(http.StatusOK, gin.H{"success": true})
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
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil || refreshToken == "" {
		refreshToken = c.GetHeader("Authorization")
		if refreshToken != "" {
			if strings.HasPrefix(refreshToken, "Bearer ") {
				refreshToken = strings.TrimPrefix(refreshToken, "Bearer ")
				if refreshToken == "" {
					c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired refresh token"})
					return
				}
			}
		}
	}
	if refreshToken == "" {
		log.Println("No token provided.")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No token provided"})
		return
	}

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

	newRefreshToken, err := auth.GenerateRefreshToken(userID, userType)
	if err != nil {
		log.Println("Failed to generate new refresh token : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate new refresh token"})
		return
	}

	rotated, err := h.authService.RotateAuthSession(
		c.Request.Context(),
		refreshToken,
		newRefreshToken,
		c.ClientIP(),
		c.Request.UserAgent(),
		time.Now().Add(auth.RefreshTokenExpiry),
	)
	if err != nil {
		log.Println("Failed to rotate auth session : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to rotate auth session"})
		return
	}
	if !rotated {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired refresh token"})
		return
	}

	h.setAuthCookies(c, newAccessToken, newRefreshToken)
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
	doctor.ClinicPhoneNumber = c.PostForm("ClinicPhoneNumber")
	showClinicPhoneRaw := strings.ToLower(strings.TrimSpace(c.PostForm("ShowClinicPhone")))
	if showClinicPhoneRaw == "" {
		doctor.ShowClinicPhone = true
	} else {
		doctor.ShowClinicPhone = showClinicPhoneRaw == "true" || showClinicPhoneRaw == "1" || showClinicPhoneRaw == "yes" || showClinicPhoneRaw == "on"
	}
	doctor.FirstName = c.PostForm("FirstName")
	doctor.FirstNameAr = c.PostForm("FirstNameAr")
	doctor.LastName = c.PostForm("LastName")
	doctor.LastNameAr = c.PostForm("LastNameAr")
	doctor.BirthDate = c.PostForm("BirthDate")
	doctor.MedicalLicense = c.PostForm("MedicalLicense")
	doctor.StreetAddress = c.PostForm("StreetAddress")
	doctor.StreetAddressAr = c.PostForm("StreetAddressAr")
	doctor.StreetAddressFr = c.PostForm("StreetAddressFr")
	doctor.CityName = c.PostForm("CityName")
	doctor.CityNameAr = c.PostForm("CityNameAr")
	doctor.CityNameFr = c.PostForm("CityNameFr")
	doctor.StateName = c.PostForm("StateName")
	doctor.StateNameAr = c.PostForm("StateNameAr")
	doctor.StateNameFr = c.PostForm("StateNameFr")
	doctor.ZipCode = c.PostForm("ZipCode")
	doctor.CountryName = c.PostForm("CountryName")
	doctor.CountryNameAr = c.PostForm("CountryNameAr")
	doctor.CountryNameFr = c.PostForm("CountryNameFr")
	doctor.Bio = c.PostForm("Bio")
	doctor.BioAr = c.PostForm("BioAr")
	doctor.BioFr = c.PostForm("BioFr")
	doctor.SpecialtyCode = c.PostForm("SpecialtyCode")
	if doctor.SpecialtyCode == "" {
		doctor.SpecialtyCode = c.PostForm("Specialty")
	}
	doctor.Specialty = doctor.SpecialtyCode
	doctor.Experience = c.PostForm("Experience")
	doctor.Sex = c.PostForm("Sex")
	doctor.ProfilePictureURL = fmt.Sprintf("images/profile_photos/%s.jpg", doctor.DoctorID)

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
		err = utils.UploadToS3(file, handler, doctor.ProfilePictureURL)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload profile photo"})
			return
		}
	}

	if doctor.Username == "" || doctor.Email == "" || doctor.Password == "" || doctor.FirstName == "" || doctor.LastName == "" || doctor.SpecialtyCode == "" || doctor.Experience == "" || doctor.ClinicPhoneNumber == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username, email, password, first name, last name, specialtyCode, experience, and clinic phone number are required"})
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
		"success":   true,
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

	_ = h.authService.CreateAuthSession(
		c.Request.Context(),
		doctor.DoctorID.String(),
		"doctor",
		refreshToken,
		c.ClientIP(),
		c.Request.UserAgent(),
		time.Now().Add(auth.RefreshTokenExpiry),
	)

	h.setAuthCookies(c, accessToken, refreshToken)

	c.JSON(http.StatusOK, gin.H{
		"success":           true,
		"accessToken":       accessToken,
		"refreshToken":      refreshToken,
		"userId":            doctor.DoctorID,
		"firstName":         doctor.FirstName,
		"firstNameAr":       doctor.FirstNameAr,
		"email":             doctor.Email,
		"lastName":          doctor.LastName,
		"lastNameAr":        doctor.LastNameAr,
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
	patient.FirstNameAr = c.PostForm("FirstNameAr")
	patient.LastName = c.PostForm("LastName")
	patient.LastNameAr = c.PostForm("LastNameAr")
	patient.BirthDate = c.PostForm("BirthDate")
	patient.StreetAddress = c.PostForm("StreetAddress")
	patient.StreetAddressAr = c.PostForm("StreetAddressAr")
	patient.StreetAddressFr = c.PostForm("StreetAddressFr")
	patient.CityName = c.PostForm("CityName")
	patient.CityNameAr = c.PostForm("CityNameAr")
	patient.CityNameFr = c.PostForm("CityNameFr")
	patient.StateName = c.PostForm("StateName")
	patient.StateNameAr = c.PostForm("StateNameAr")
	patient.StateNameFr = c.PostForm("StateNameFr")
	patient.ZipCode = c.PostForm("ZipCode")
	patient.CountryName = c.PostForm("CountryName")
	patient.CountryNameAr = c.PostForm("CountryNameAr")
	patient.CountryNameFr = c.PostForm("CountryNameFr")
	patient.Sex = c.PostForm("Sex")
	patient.Bio = c.PostForm("PatientBio")
	patient.BioAr = c.PostForm("PatientBioAr")

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
		log.Println("Invalid JSON format")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON format"})
		return
	}

	if loginRequest.Email == "" || loginRequest.Password == "" {
		log.Println("Email and password are required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email and password are required"})
		return
	}

	patient, accessToken, refreshToken, err := h.patientService.LoginPatient(loginRequest.Email, loginRequest.Password)
	if err != nil {
		if err.Error() == "account not verified" {
			log.Println("Account not verified")
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Account Not Verified, Please check your email to verify your account.",
			})
			return
		}
		log.Println("Invalid email or password")
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Invalid email or password",
		})
		return
	}

	_ = h.authService.CreateAuthSession(
		c.Request.Context(),
		patient.PatientID.String(),
		"patient",
		refreshToken,
		c.ClientIP(),
		c.Request.UserAgent(),
		time.Now().Add(auth.RefreshTokenExpiry),
	)

	h.setAuthCookies(c, accessToken, refreshToken)

	response := gin.H{
		"success":           true,
		"accessToken":       accessToken,
		"refreshToken":      refreshToken,
		"userId":            patient.PatientID.String(),
		"firstName":         patient.FirstName,
		"firstNameAr":       patient.FirstNameAr,
		"lastName":          patient.LastName,
		"lastNameAr":        patient.LastNameAr,
		"profilePictureUrl": patient.ProfilePictureURL,
	}

	c.JSON(http.StatusOK, response)
}

func (h *AuthHandler) RegisterReceptionist(c *gin.Context) {
	var req models.ReceptionistRegisterRequest

	if strings.HasPrefix(c.ContentType(), "multipart/form-data") {
		if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
			return
		}

		receptionistID := uuid.New()
		req.ReceptionistID = receptionistID.String()

		req.Username = c.PostForm("Username")
		if req.Username == "" {
			req.Username = c.PostForm("username")
		}
		req.Password = c.PostForm("Password")
		if req.Password == "" {
			req.Password = c.PostForm("password")
		}
		req.Email = c.PostForm("Email")
		if req.Email == "" {
			req.Email = c.PostForm("email")
		}
		req.PhoneNumber = c.PostForm("PhoneNumber")
		if req.PhoneNumber == "" {
			req.PhoneNumber = c.PostForm("phoneNumber")
		}
		req.FirstName = c.PostForm("FirstName")
		if req.FirstName == "" {
			req.FirstName = c.PostForm("firstName")
		}
		req.FirstNameAr = c.PostForm("FirstNameAr")
		if req.FirstNameAr == "" {
			req.FirstNameAr = c.PostForm("firstNameAr")
		}
		req.LastName = c.PostForm("LastName")
		if req.LastName == "" {
			req.LastName = c.PostForm("lastName")
		}
		req.LastNameAr = c.PostForm("LastNameAr")
		if req.LastNameAr == "" {
			req.LastNameAr = c.PostForm("lastNameAr")
		}
		req.BirthDate = c.PostForm("BirthDate")
		if req.BirthDate == "" {
			req.BirthDate = c.PostForm("birthDate")
		}
		req.StreetAddress = c.PostForm("StreetAddress")
		if req.StreetAddress == "" {
			req.StreetAddress = c.PostForm("streetAddress")
		}
		req.StreetAddressAr = c.PostForm("StreetAddressAr")
		if req.StreetAddressAr == "" {
			req.StreetAddressAr = c.PostForm("streetAddressAr")
		}
		req.StreetAddressFr = c.PostForm("StreetAddressFr")
		if req.StreetAddressFr == "" {
			req.StreetAddressFr = c.PostForm("streetAddressFr")
		}
		req.CityName = c.PostForm("CityName")
		if req.CityName == "" {
			req.CityName = c.PostForm("cityName")
		}
		req.CityNameAr = c.PostForm("CityNameAr")
		if req.CityNameAr == "" {
			req.CityNameAr = c.PostForm("cityNameAr")
		}
		req.CityNameFr = c.PostForm("CityNameFr")
		if req.CityNameFr == "" {
			req.CityNameFr = c.PostForm("cityNameFr")
		}
		req.StateName = c.PostForm("StateName")
		if req.StateName == "" {
			req.StateName = c.PostForm("stateName")
		}
		req.StateNameAr = c.PostForm("StateNameAr")
		if req.StateNameAr == "" {
			req.StateNameAr = c.PostForm("stateNameAr")
		}
		req.StateNameFr = c.PostForm("StateNameFr")
		if req.StateNameFr == "" {
			req.StateNameFr = c.PostForm("stateNameFr")
		}
		req.ZipCode = c.PostForm("ZipCode")
		if req.ZipCode == "" {
			req.ZipCode = c.PostForm("zipCode")
		}
		req.CountryName = c.PostForm("CountryName")
		if req.CountryName == "" {
			req.CountryName = c.PostForm("countryName")
		}
		req.CountryNameAr = c.PostForm("CountryNameAr")
		if req.CountryNameAr == "" {
			req.CountryNameAr = c.PostForm("countryNameAr")
		}
		req.CountryNameFr = c.PostForm("CountryNameFr")
		if req.CountryNameFr == "" {
			req.CountryNameFr = c.PostForm("countryNameFr")
		}
		req.Sex = c.PostForm("Sex")
		if req.Sex == "" {
			req.Sex = c.PostForm("sex")
		}
		req.Bio = c.PostForm("Bio")
		if req.Bio == "" {
			req.Bio = c.PostForm("bio")
		}
		req.BioAr = c.PostForm("BioAr")
		if req.BioAr == "" {
			req.BioAr = c.PostForm("bioAr")
		}

		experiencesRaw := c.PostForm("Experiences")
		if experiencesRaw == "" {
			experiencesRaw = c.PostForm("experiences")
		}
		if experiencesRaw != "" {
			if err := json.Unmarshal([]byte(experiencesRaw), &req.Experiences); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid experiences data"})
				return
			}
		}

		file, handler, err := c.Request.FormFile("file")
		if err == nil {
			defer file.Close()
			req.ProfilePictureURL = fmt.Sprintf("images/profile_photos/%s.jpg", receptionistID.String())
			err = utils.UploadToS3(file, handler, req.ProfilePictureURL)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload profile photo"})
				return
			}
		}
	} else {
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
			return
		}
	}

	receptionist, err := h.receptionistService.RegisterReceptionist(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success":        true,
		"receptionistId": receptionist.ReceptionistID,
		"receptionist":   receptionist,
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

	_ = h.authService.CreateAuthSession(
		c.Request.Context(),
		receptionist.ReceptionistID.String(),
		"receptionist",
		refreshToken,
		c.ClientIP(),
		c.Request.UserAgent(),
		time.Now().Add(auth.RefreshTokenExpiry),
	)

	h.setAuthCookies(c, accessToken, refreshToken)

	c.JSON(http.StatusOK, gin.H{
		"receptionist": receptionist,
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
	})
}

func (h *AuthHandler) ServeWS(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "WebSocket to be implemented"})
}
