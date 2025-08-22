package patient

import (
	"fmt"
	"log"
	"net/http"
	"strconv"

	"healthcare_backend/pkg/models"
	"healthcare_backend/pkg/services/patient"
	"healthcare_backend/pkg/utils"
	"healthcare_backend/pkg/utils/validators"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PatientHandler struct {
	patientService *patient.PatientService
}

func NewPatientHandler(patientService *patient.PatientService) *PatientHandler {
	return &PatientHandler{
		patientService: patientService,
	}
}

func (h *PatientHandler) RegisterPatient(c *gin.Context) {
	var patient models.Patient

	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		log.Println("Failed to parse form : ", err)
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
		log.Println("Failed to upload file : ", err)
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

func (h *PatientHandler) LoginPatient(c *gin.Context) {
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

func (h *PatientHandler) GetPatientProfile(c *gin.Context) {
	patientID := c.Param("patientId")
	if patientID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Patient ID is required"})
		return
	}

	patient, err := h.patientService.GetPatientProfile(patientID)
	if err != nil {
		if err.Error() == "patient not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return
	}

	c.JSON(http.StatusOK, patient)
}

func (h *PatientHandler) UpdatePatientProfile(c *gin.Context) {
	userID := c.Param("patientId")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Patient ID is required"})
		return
	}

	if err := c.Request.ParseMultipartForm(50 << 20); err != nil {
		log.Println("Failed to parse multipart form:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	var patientUpdateData struct {
		FirstName     string `json:"FirstName"`
		LastName      string `json:"LastName"`
		Email         string `json:"Email"`
		PhoneNumber   string `json:"PhoneNumber"`
		StreetAddress string `json:"StreetAddress"`
		CityName      string `json:"CityName"`
		ZipCode       string `json:"ZipCode"`
		CountryName   string `json:"CountryName"`
		PatientBio    string `json:"PatientBio"`
	}

	if err := c.Bind(&patientUpdateData); err != nil {
		log.Println("Error binding form data:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form data"})
		return
	}

	updateData := map[string]interface{}{
		"FirstName":     patientUpdateData.FirstName,
		"LastName":      patientUpdateData.LastName,
		"Email":         patientUpdateData.Email,
		"PhoneNumber":   patientUpdateData.PhoneNumber,
		"StreetAddress": patientUpdateData.StreetAddress,
		"CityName":      patientUpdateData.CityName,
		"ZipCode":       patientUpdateData.ZipCode,
		"CountryName":   patientUpdateData.CountryName,
		"PatientBio":    patientUpdateData.PatientBio,
	}

	var presignedURL string
	fileName := fmt.Sprintf("images/profile_photos/%s.jpg", userID)

	file, handler, err := c.Request.FormFile("profilePhoto")
	if err == nil {
		err = utils.DeleteFromS3(fileName)
		if err != nil {
			log.Printf("Error deleting old profile photo: %v", err)
		}

		err = utils.UploadToS3(file, handler, fileName)
		if err != nil {
			log.Printf("Failed to upload new profile photo: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload new profile photo"})
			return
		}

		updateData["ProfilePictureURL"] = fileName
	}

	presignedURL, err = h.patientService.UpdatePatientProfile(userID, updateData)
	if err != nil {
		log.Printf("Error updating patient info: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update patient information"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":             "Patient information updated successfully",
		"userProfilePhotoUrl": presignedURL,
	})
}

func (h *PatientHandler) SearchPatients(c *gin.Context) {
	name := c.Query("name")
	location := c.Query("location")
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		offset = 0
	}

	patients, err := h.patientService.SearchPatients(name, location, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"patients": patients})
}

func (h *PatientHandler) VerifyPatient(c *gin.Context) {
	var request struct {
		Token string `json:"token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	err := h.patientService.VerifyPatient(request.Token)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Patient verified successfully"})
}

func (h *PatientHandler) GetPatientAppointments(c *gin.Context) {
	patientID := c.Param("patientId")
	if patientID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Patient ID is required"})
		return
	}

	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		offset = 0
	}

	appointments, err := h.patientService.GetPatientAppointments(patientID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"appointments": appointments})
}

func (h *PatientHandler) GetPatientMedicalHistory(c *gin.Context) {
	patientID := c.Param("patientId")
	if patientID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Patient ID is required"})
		return
	}

	medicalHistories, err := h.patientService.GetPatientMedicalHistory(patientID)
	if err != nil {
		if err.Error() == "database error: no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Diagnosis for patient was not found"})
			return
		}
		log.Println("Database error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return
	}

	c.JSON(http.StatusOK, medicalHistories)
}

func (h *PatientHandler) GetPatientMedications(c *gin.Context) {
	patientID := c.Param("patientId")
	if patientID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Patient ID is required"})
		return
	}

	medications, err := h.patientService.GetPatientMedications(patientID)
	if err != nil {
		if err.Error() == "database error: no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Medications for patient was not found"})
			return
		}
		log.Println("Database error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return
	}

	c.JSON(http.StatusOK, medications)
}

func (h *PatientHandler) GetDiagnosisDetails(c *gin.Context) {
	diagnosisID := c.Param("diagnosisId")
	if diagnosisID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Diagnosis ID is required"})
		return
	}

	diagnosis, err := h.patientService.GetDiagnosisDetails(diagnosisID)
	if err != nil {
		if err.Error() == "diagnosis not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Diagnosis Information Not Found"})
			return
		}
		log.Println("Failed to get diagnosis info: ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get diagnosis info"})
		return
	}

	c.JSON(http.StatusOK, diagnosis)
}

func (h *PatientHandler) GetDoctorPatients(c *gin.Context) {
	doctorIDStr := c.Param("doctorId")
	doctorID, err := uuid.Parse(doctorIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid doctor ID"})
		return
	}

	patients, err := h.patientService.GetDoctorPatients(doctorID)
	if err != nil {
		log.Printf("Database error fetching doctor patients: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching patients"})
		return
	}

	c.JSON(http.StatusOK, patients)
}
