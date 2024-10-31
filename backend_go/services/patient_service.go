package services

import (
	"backend_go/auth"
	"backend_go/models"
	"backend_go/validators"
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v4/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

func GetPatientById(c *gin.Context, pool *pgxpool.Pool) {

	patientId := c.Param("patientId")
	var patient models.Patient

	// Fetching the patient from the database based on the email
	err := pool.QueryRow(context.Background(), "SELECT email, phone_number, first_name, last_name, TO_CHAR(birth_date, 'YYYY-MM-DD'), bio, sex, location, profile_photo_url, street_address, city_name, zip_code, country_name, age FROM patient_info WHERE patient_id = $1", patientId).Scan(
		&patient.Email,
		&patient.PhoneNumber,
		&patient.FirstName,
		&patient.LastName,
		&patient.BirthDate,
		&patient.Bio,
		&patient.Sex,
		&patient.Location,
		&patient.ProfilePictureURL,
		&patient.StreetAddress,
		&patient.CityName,
		&patient.ZipCode,
		&patient.CountryName,
		&patient.Age,
	)
	if err != nil {
		if err.Error() == "no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
		} else {
			log.Println("Database error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		}
		return
	}
	c.JSON(http.StatusOK, patient)
}

func UpdatePatientInfo(c *gin.Context, pool *pgxpool.Pool) {
	userId := c.Param("userId")
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

	var presignedURL string
	FileName := fmt.Sprintf("images/profile_photos/%s.jpg", userId)

	file, handler, err := c.Request.FormFile("profilePhoto")
	if err == nil {
		err = DeleteFromS3(FileName)
		if err != nil {
			log.Printf("Error deleting old profile photo: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete old profile photo"})
			return
		}

		err = UploadToS3(file, handler, FileName)
		if err != nil {
			log.Printf("Failed to upload new profile photo: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload new profile photo"})
			return
		}
		_, presignClient := InitS3Client()
		bucket := os.Getenv("S3_BUCKET_NAME")
		presignedURL, err = GeneratePresignedURL(presignClient, bucket, FileName)
		if err != nil {
			log.Println("Failed to generate presigned URL.")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate presigned URL."})
		}
	}

	query := `
        UPDATE patient_info 
        SET first_name = $1, last_name = $2, email = $3, phone_number = $4, 
            street_address = $5, city_name = $6, zip_code = $7, country_name = $8, 
            bio = $9, update_at = NOW()
        WHERE patient_id = $10
    `
	_, err = pool.Exec(context.Background(), query,
		patientUpdateData.FirstName,
		patientUpdateData.LastName,
		patientUpdateData.Email,
		patientUpdateData.PhoneNumber,
		patientUpdateData.StreetAddress,
		patientUpdateData.CityName,
		patientUpdateData.ZipCode,
		patientUpdateData.CountryName,
		patientUpdateData.PatientBio,
		userId,
	)

	if err != nil {
		log.Printf("Error updating patient info: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update patient information"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Patient information updated successfully", "userProfilePhotoUrl": presignedURL})
}

func RegisterPatient(c *gin.Context, pool *pgxpool.Pool) {
	// Registering a new patient
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
	fileName = filepath.ToSlash(fileName)
	err = UploadToS3(file, handler, fileName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload profile photo"})
		return
	}
	patient.ProfilePictureURL = fileName

	conn, err := pool.Acquire(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not acquire database connection"})
		return
	}
	defer conn.Release()

	// checking if the gmail already exists
	var email string
	queryString := "SELECT email FROM patient_info WHERE email = $1"
	err = conn.QueryRow(c, queryString, patient.Email).Scan(&email)
	if err != nil {
		log.Printf("Query error: %v", err)
		if err.Error() != "no rows in result set" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email already exists"})
		return
	}

	// checking if username already exists
	var username string
	queryStringUsername := "SELECT username FROM patient_info WHERE username = $1"

	err = conn.QueryRow(c, queryStringUsername, patient.Username).Scan(&username)
	if err != nil {
		if err.Error() != "no rows in result set" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}

	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username already exists"})
		return
	}

	// Generating Salt and Hash Password
	saltBytes := make([]byte, 16)
	_, err = rand.Read(saltBytes)
	if err != nil {
		log.Printf("Generating Salt error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}
	salt := hex.EncodeToString(saltBytes)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(patient.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Generating hashedPassword error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	//  Age
	birthDate, err := time.Parse("2006-01-02", patient.BirthDate)
	if err != nil {
		log.Printf("Parse birthDate error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad Request"})
		return
	}
	patient.Age = time.Now().Year() - birthDate.Year()

	// Location
	patient.Location = fmt.Sprintf("%s, %s, %s, %s, %s", patient.StreetAddress, patient.ZipCode, patient.CityName, patient.StateName, patient.CountryName)
	_, err = conn.Exec(c, `
    INSERT INTO patient_info (
        patient_id, 
        username, 
        first_name, 
        last_name, 
        age, 
        sex, 
        hashed_password, 
        salt, 
        create_at, 
        update_at, 
        bio, 
        email, 
        phone_number, 
        street_address, 
        city_name, 
        state_name, 
        zip_code, 
        country_name, 
        birth_date, 
        location,
		profile_photo_url
    ) 
    VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
    )`,
		patient.PatientID,
		patient.Username,
		patient.FirstName,
		patient.LastName,
		patient.Age,
		patient.Sex,
		hashedPassword,
		salt,
		time.Now(),
		time.Now(),
		patient.Bio,
		patient.Email,
		patient.PhoneNumber,
		patient.StreetAddress,
		patient.CityName,
		patient.StateName,
		patient.ZipCode,
		patient.CountryName,
		patient.BirthDate,
		patient.Location,
		patient.ProfilePictureURL,
	)
	if err != nil {
		log.Printf("inserting Patient Info to database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}
	verificationLink := validators.GenerateVerificationLink(patient.Email, c, pool)
	if verificationLink == "" {
		log.Printf("Generating verification Link error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate verification link"})
		return
	}

	// Sending the verification email
	err = validators.SendVerificationEmail(patient.Email, verificationLink)
	if err != nil {
		log.Printf("Failed to send verification email: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send verification email"})
		return
	}

	// Respond to the user
	c.JSON(http.StatusCreated, gin.H{
		"success": "true",
		"message": "Patient created successfully. Please check your email to verify your account.",
	})

}

func patientToAuthUser(p *models.Patient) auth.User {
	return auth.User{ID: p.Email}
}

func LoginPatient(c *gin.Context, pool *pgxpool.Pool) {
	var loginReq models.LoginRequest

	if err := c.ShouldBindJSON(&loginReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// checking if the account is verified
	var isVerified bool
	ctx := context.Background()
	err := pool.QueryRow(ctx, "SELECT is_verified FROM patient_info WHERE email = $1", loginReq.Email).Scan(&isVerified)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Account Not Verified"})
		return
	}

	// if isVerified == false then tell him to verify his account.
	if !isVerified {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Account Not Verified, Please check your email to verify your account."})
		return
	}

	// Fetching the patient from the database based on the email
	var patient models.Patient
	ctx = context.Background()
	err = pool.QueryRow(ctx, "SELECT email, hashed_password FROM patient_info WHERE email = $1", loginReq.Email).Scan(
		&patient.Email,
		&patient.Password,
	)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Invalid email or password"})
		return
	}

	// Comparing the stored hashed password, with the hashed version of the password that was received
	err = bcrypt.CompareHashAndPassword([]byte(patient.Password), []byte(loginReq.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "ssInvalid email or password"})
		return
	}

	// generating a session token
	user := patientToAuthUser(&patient)
	token, err := auth.GenerateAccessToken(user, "patient")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
		return
	}
	refreshToken, err := auth.GenerateRefreshToken(user, "patient")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
		return
	}

	// get user id
	var patientId string
	err = pool.QueryRow(ctx, "SELECT patient_id, first_name, last_name, profile_photo_url FROM patient_info WHERE email = $1", loginReq.Email).Scan(
		&patientId,
		&patient.FirstName,
		&patient.LastName,
		&patient.ProfilePictureURL,
	)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Invalid email or password"})
		return
	}

	_, presignClient := InitS3Client()
	bucket := os.Getenv("S3_BUCKET_NAME")
	presignedURL, err := GeneratePresignedURL(presignClient, bucket, patient.ProfilePictureURL)

	response := gin.H{
		"success":             true,
		"accessToken":         token,
		"refreshToken":        refreshToken,
		"patient_id":          patientId,
		"first_name":          patient.FirstName,
		"last_name":           patient.LastName,
		"profile_picture_url": presignedURL,
	}

	c.JSON(http.StatusOK, response)
}

func GetPatientMedicalHistory(c *gin.Context, pool *pgxpool.Pool) {

	patientId := c.Param("patientId")

	rows, err := pool.Query(context.Background(), "SELECT diag_history_id, diagnosis_name, created_at FROM medical_diagnosis_history WHERE diagnosis_patient_id = $1 ORDER BY created_at DESC ", patientId)
	if err != nil {
		if err.Error() == "no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Diagnosis for patient was not found"})
		} else {
			log.Println("Database error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		}
		return
	}
	defer rows.Close()

	var MedHists []models.MedicalHistory
	for rows.Next() {
		var MedHist models.MedicalHistory
		err := rows.Scan(
			&MedHist.DiagnosisHistoryID,
			&MedHist.DiagnosisName,
			&MedHist.CreatedAt,
		)
		if err != nil {
			log.Println("Failed To Patient's Medical History : ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed To Patient's Medical History : "})
			return
		}
		MedHists = append(MedHists, MedHist)
	}
	log.Println("MedHists : ", MedHists)
	c.JSON(http.StatusOK, MedHists)
}

func GetPatientMedications(c *gin.Context, pool *pgxpool.Pool) {

	patientId := c.Param("patientId")

	rows, err := pool.Query(context.Background(), "SELECT medication_name, created_at FROM prescribed_medications WHERE patient_id = $1 ORDER BY created_at DESC ", patientId)
	if err != nil {
		if err.Error() == "no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Diagnosis for patient was not found"})
		} else {
			log.Println("Database error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		}
		return
	}
	defer rows.Close()

	var Medications []models.Medications
	for rows.Next() {
		var Medication models.Medications
		err := rows.Scan(
			&Medication.MedicationName,
			&Medication.CreatedAt,
		)
		if err != nil {
			log.Println("Failed To Patient's Medications : ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed To Patient's Medications : "})
			return
		}
		Medications = append(Medications, Medication)
	}

	c.JSON(http.StatusOK, Medications)
}

func GetDiagnosisPage(c *gin.Context, pool *pgxpool.Pool) {

	diagnosisId := c.Param("diagnosisId")
	var MedHist models.MedicalHistory

	err := pool.QueryRow(context.Background(), "SELECT diag_history_id, diagnosis_name, diagnosis_details, diagnosis_doctor_name, diagnosis_doctor_id, created_at, updated_at, diagnosis_patient_id FROM medical_diagnosis_history WHERE diag_history_id = $1", diagnosisId).Scan(
		&MedHist.DiagnosisHistoryID,
		&MedHist.DiagnosisName,
		&MedHist.DiagnosisDetails,
		&MedHist.DiagnosisDoctorName,
		&MedHist.DiagnosisDoctorID,
		&MedHist.CreatedAt,
		&MedHist.UpdatedAt,
		&MedHist.PatientID,
	)
	if err != nil {
		if err.Error() == "no rows in result set" {
			log.Println("Diagnosis Information Not Found : ", err)
			c.JSON(http.StatusNotFound, gin.H{"error": "Diagnosis Information Not Found"})
		} else {
			log.Println("Failed to get diagnosis info: ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get diagnosis info"})
		}
		return
	}
	log.Println("MedHist : ", MedHist)
	c.JSON(http.StatusOK, MedHist)
}
