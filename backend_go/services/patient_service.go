package services

import (
	"backend_go/auth"
	"backend_go/models"
	"backend_go/validators"
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

func GetPatientById(c *gin.Context, pool *pgxpool.Pool) {

	patientId := c.Param("patientId")
	var patient models.Patient
	var location string

	// Fetching the patient from the database based on the email
	err := pool.QueryRow(context.Background(), "SELECT email, phone_number, first_name, last_name, TO_CHAR(birth_date, 'YYYY-MM-DD'), patient_bio, sex, location  FROM patient_info WHERE patient_id = $1", patientId).Scan(
		&patient.Email,
		&patient.PhoneNumber,
		&patient.FirstName,
		&patient.LastName,
		&patient.BirthDate,
		&patient.PatientBio,
		&patient.Sex,
		&location,
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

func RegisterPatient(c *gin.Context, pool *pgxpool.Pool) {
	// Registering a new patient
	var patient models.Patient
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		log.Println("Failed to parse form : ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

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

	file, _, err := c.Request.FormFile("file")
	if err != nil {
		log.Println("Failed to upload file : ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to upload file"})
		return
	}
	defer file.Close()

	fileName := fmt.Sprintf("%s_%d", patient.Username, time.Now().Unix())
	filePath := fmt.Sprintf("user_photos/%s.jpg", fileName)

	if _, err := os.Stat("user_photos"); os.IsNotExist(err) {
		if err := os.MkdirAll("user_photos", os.ModePerm); err != nil {
			log.Println("Could not create directory : ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create directory"})
			return
		}
	}

	out, err := os.Create(filePath)
	if err != nil {
		log.Println("Failed to create file : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}
	defer out.Close()

	_, err = io.Copy(out, file)
	if err != nil {
		log.Println("Failed to save file : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	conn, err := pool.Acquire(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not acquire database connection"})
		return
	}
	defer conn.Release()

	// checking if the gmail already exists
	var email string
	queryString := "SELECT email FROM patient_info WHERE email = $1"
	log.Printf("Executing query: %s with email: %s", queryString, patient.Email)
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

	log.Printf("Executing query: %s with username: %s", queryStringUsername, patient.Username)
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
	var age = time.Now().Year() - birthDate.Year()

	// Location
	var location = fmt.Sprintf("%s, %s, %s, %s, %s", patient.StreetAddress, patient.ZipCode, patient.CityName, patient.StateName, patient.CountryName)
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
        patient_bio, 
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
        uuid_generate_v4(), 
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
    )`,
		patient.Username,
		patient.FirstName,
		patient.LastName,
		age,
		patient.Sex,
		hashedPassword,
		salt,
		time.Now(),
		time.Now(),
		patient.PatientBio,
		patient.Email,
		patient.PhoneNumber,
		patient.StreetAddress,
		patient.CityName,
		patient.StateName,
		patient.ZipCode,
		patient.CountryName,
		patient.BirthDate,
		location,
		filePath,
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

	response := gin.H{
		"success":             true,
		"accessToken":         token,
		"refreshToken":        refreshToken,
		"patient_id":          patientId,
		"first_name":          patient.FirstName,
		"last_name":           patient.LastName,
		"profile_picture_url": patient.ProfilePictureURL,
	}

	c.JSON(http.StatusOK, response)
}
