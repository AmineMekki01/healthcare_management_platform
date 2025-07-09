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
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

func emailExists(conn *pgxpool.Conn, email string, c *gin.Context) (bool, error) {
	var existingEmail string
	err := conn.QueryRow(c, "SELECT email FROM doctor_info WHERE email = $1", email).Scan(&existingEmail)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

// RegisterDoctor registers a new doctor
func RegisterDoctor(c *gin.Context, pool *pgxpool.Pool) {
	var doctor models.Doctor

	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		log.Println("Failed to parse form : ", err)
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

	doctor.Bio = c.PostForm("DoctorBio")
	doctor.Specialty = c.PostForm("Specialty")
	doctor.Experience = c.PostForm("Experience")
	doctor.Sex = c.PostForm("Sex")

	lat := c.PostForm("Latitude")
	lon := c.PostForm("Longitude")
	doctor.Latitude, _ = strconv.ParseFloat(lat, 64)
	doctor.Longitude, _ = strconv.ParseFloat(lon, 64)

	file, handler, err := c.Request.FormFile("file")
	if err != nil {
		log.Println("Failed to upload file : ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to upload file"})
		return
	}
	defer file.Close()

	fileName := fmt.Sprintf("images/profile_photos/%s.jpg", doctor.DoctorID)
	err = UploadToS3(file, handler, fileName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload profile photo"})
		return
	}
	doctor.ProfilePictureURL = fileName

	conn, err := pool.Acquire(c)
	if err != nil {
		log.Println("Could not acquire database connection : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not acquire database connection"})
		return
	}
	defer conn.Release()

	exists, err := emailExists(conn, doctor.Email, c)
	if err != nil {
		log.Printf("Error checking email: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	if exists {
		log.Printf("Email already exists : %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email already exists"})
		return
	}

	var username string
	err = conn.QueryRow(c, "SELECT username FROM doctor_info WHERE username = $1", doctor.Username).Scan(&username)
	if err != nil {
		log.Printf("username already exists : %v", err)

		if err.Error() != "no rows in result set" {
			log.Printf("username already exists : %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}

	} else {
		log.Printf("username already exists : %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username already exists"})
		return
	}

	// Generating Salt and Hash Password
	saltBytes := make([]byte, 16)
	_, err = rand.Read(saltBytes)
	if err != nil {
		log.Printf("Generating Salt error : %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}
	salt := hex.EncodeToString(saltBytes)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(doctor.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Generating hashedPassword error : %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	birthDate, err := time.Parse("2006-01-02", doctor.BirthDate)
	if err != nil {
		log.Printf("Generating birthDate error : %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad Request"})
		return
	}
	doctor.Age = time.Now().Year() - birthDate.Year()

	// Location
	doctor.Location = fmt.Sprintf("%s, %s, %s, %s, %s", doctor.StreetAddress, doctor.ZipCode, doctor.CityName, doctor.StateName, doctor.CountryName)

	_, err = conn.Exec(c, `
	INSERT INTO doctor_info (
		doctor_id, 
		username, 
		first_name, 
		last_name, 
		age, 
		sex, 
		hashed_password, 
		salt, 
		specialty, 
		experience, 
		rating_score, 
		rating_count, 
		create_at, 
		update_at, 
		medical_license, 
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
		profile_photo_url,
		latitude,
        longitude
	) 
	VALUES (
		$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
		$14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
	)`,
		doctor.DoctorID,
		doctor.Username,
		doctor.FirstName,
		doctor.LastName,
		doctor.Age,
		doctor.Sex,
		hashedPassword,
		salt,
		doctor.Specialty,
		doctor.Experience,
		nil,
		0,
		time.Now(),
		time.Now(),
		doctor.MedicalLicense,
		doctor.Bio,
		doctor.Email,
		doctor.PhoneNumber,
		doctor.StreetAddress,
		doctor.CityName,
		doctor.StateName,
		doctor.ZipCode,
		doctor.CountryName,
		doctor.BirthDate,
		doctor.Location,
		doctor.ProfilePictureURL,
		doctor.Latitude,
		doctor.Longitude,
	)

	if err != nil {
		log.Printf("Generating birthDate error : %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}
	if err = generateDoctorAvailability(conn,
		doctor.DoctorID, c); err != nil {
		log.Printf("Failed to generating doctor availability : %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generating doctor availability"})
		return
	}

	verificationLink := validators.GenerateVerificationLink(doctor.Email, c, pool)
	if verificationLink == "" {
		if err != nil {
			log.Printf("Failed to generate verification link : %v", err)
		}
	}

	// Send the verification email
	err = validators.SendVerificationEmail(doctor.Email, verificationLink)
	if err != nil {
		log.Printf("Failed to send verification email: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send verification email"})
		return
	}

	// Respond to the user
	c.JSON(http.StatusCreated, gin.H{
		"success": "true",
		"message": "Doctor created successfully. Please check your email to verify your account.",
	})
}

func generateDoctorAvailability(conn *pgxpool.Conn, doctorID uuid.UUID, c *gin.Context) error {
	availabilityStartTime := time.Date(time.Now().Year(), time.Now().Month(), time.Now().Day(), 7, 0, 0, 0, time.Local)
	availabilityEndTime := time.Date(time.Now().Year(), time.Now().Month(), time.Now().Day(), 20, 0, 0, 0, time.Local)

	for currentTime := availabilityStartTime; currentTime.Before(availabilityEndTime); currentTime = currentTime.Add(30 * time.Minute) {
		endTime := currentTime.Add(30 * time.Minute)

		_, err := conn.Exec(c, `
			INSERT INTO availabilities (availability_start, availability_end, doctor_id) VALUES ($1, $2, $3)
		`, currentTime, endTime, doctorID)

		if err != nil {
			return fmt.Errorf("error inserting availability: %v", err)
		}
	}
	return nil
}

func doctorToAuthUser(d *models.Doctor) auth.User {
	return auth.User{ID: d.Email}
}

func LoginDoctor(c *gin.Context, pool *pgxpool.Pool) {
	var loginReq models.LoginRequest

	if err := c.ShouldBindJSON(&loginReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// check if the account is verified
	var isVerified bool
	ctx := context.Background()
	err := pool.QueryRow(ctx, "SELECT is_verified FROM doctor_info WHERE email = $1", loginReq.Email).Scan(&isVerified)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Account Not Verified"})
		return
	}

	if !isVerified {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Account Not Verified, Please check your email to verify your account."})
		return
	}

	// Fetch the doctor from the database based on the email
	var doctor models.Doctor
	ctx = context.Background()
	err = pool.QueryRow(ctx, "SELECT email, hashed_password FROM doctor_info WHERE email = $1", loginReq.Email).Scan(
		&doctor.Email,
		&doctor.Password,
	)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Invalid email or password"})
		return
	}
	// Comparing the stored hashed password, with the hashed version of the password that was received
	err = bcrypt.CompareHashAndPassword([]byte(doctor.Password), []byte(loginReq.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Invalid email or password"})
		return
	}

	// generating a session token
	user := doctorToAuthUser(&doctor)
	token, err := auth.GenerateAccessToken(user, "doctor")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
		return
	}
	refreshToken, err := auth.GenerateRefreshToken(user, "doctor")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
		return
	}

	// get user id
	err = pool.QueryRow(ctx, "SELECT doctor_id, first_name, last_name, profile_photo_url FROM doctor_info WHERE email = $1", loginReq.Email).Scan(
		&doctor.DoctorID,
		&doctor.FirstName,
		&doctor.LastName,
		&doctor.ProfilePictureURL,
	)
	if err != nil {
		log.Println("Error getting doctor data :", err)
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": err})
		return
	}

	_, presignClient := InitS3Client()
	bucket := os.Getenv("S3_BUCKET_NAME")
	presignedURL, err := GeneratePresignedURL(presignClient, bucket, doctor.ProfilePictureURL)

	response := gin.H{
		"success":             true,
		"accessToken":         token,
		"refreshToken":        refreshToken,
		"doctor_id":           doctor.DoctorID,
		"first_name":          doctor.FirstName,
		"last_name":           doctor.LastName,
		"profile_picture_url": presignedURL,
	}

	c.JSON(http.StatusOK, response)

}

func GetDoctorById(c *gin.Context, pool *pgxpool.Pool) {
	doctorId := c.Param("doctorId")
	log.Printf("Getting doctor by ID: %s", doctorId)

	var doctor models.Doctor
	var err error
	doctor.DoctorID, err = uuid.Parse(doctorId)
	if err != nil {
		log.Printf("Invalid doctor ID format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid doctor ID format"})
		return
	}

	// Fetch basic doctor info
	err = pool.QueryRow(context.Background(), `
        SELECT email, phone_number, first_name, last_name, TO_CHAR(birth_date, 'YYYY-MM-DD'), bio, sex, location, specialty, experience, rating_score, rating_count, profile_photo_url, city_name, country_name, COALESCE(latitude, 0), COALESCE(longitude, 0)
        FROM doctor_info WHERE doctor_id = $1
    `, doctor.DoctorID).Scan(
		&doctor.Email,
		&doctor.PhoneNumber,
		&doctor.FirstName,
		&doctor.LastName,
		&doctor.BirthDate,
		&doctor.Bio,
		&doctor.Sex,
		&doctor.Location,
		&doctor.Specialty,
		&doctor.Experience,
		&doctor.RatingScore,
		&doctor.RatingCount,
		&doctor.ProfilePictureURL,
		&doctor.CityName,
		&doctor.CountryName,
		&doctor.Latitude,
		&doctor.Longitude,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			log.Printf("Doctor not found with ID: %s", doctorId)
			c.JSON(http.StatusNotFound, gin.H{"error": "Doctor not found"})
		} else {
			log.Printf("Database error when fetching doctor: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		}
		return
	}

	log.Printf("Successfully fetched basic doctor info for: %s %s", doctor.FirstName, doctor.LastName)

	// Get the presigned URL for the profile picture
	if doctor.ProfilePictureURL != "" {
		doctor.ProfilePictureURL, err = GetImageURL(c, doctor.ProfilePictureURL)
		if err != nil {
			log.Printf("Error getting profile picture URL: %v", err)
			// Don't fail the entire request for profile picture issues
			doctor.ProfilePictureURL = ""
		}
	}

	// Fetch hospitals
	hospitals := []models.DoctorHospital{}
	rows, err := pool.Query(context.Background(), `
        SELECT hospital_name, position, start_date, end_date, description
        FROM doctor_hospitals WHERE doctor_id = $1
    `, doctor.DoctorID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var hospital models.DoctorHospital
			var startDate, endDate *time.Time
			err = rows.Scan(
				&hospital.HospitalName,
				&hospital.Position,
				&startDate,
				&endDate,
				&hospital.Description,
			)
			if err != nil {
				log.Printf("Error scanning hospital row: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error retrieving hospitals"})
				return
			}
			layout := "2006-01-02"
			if startDate != nil {
				str := startDate.Format(layout)
				hospital.StartDate = &str
			}
			if endDate != nil {
				str := endDate.Format(layout)
				hospital.EndDate = &str
			}
			hospitals = append(hospitals, hospital)
		}
	} else {
		log.Printf("Error querying hospitals: %v", err)
	}
	doctor.Hospitals = hospitals

	// Fetch organizations
	organizations := []models.DoctorOrganization{}
	rows, err = pool.Query(context.Background(), `
        SELECT organization_name, role, start_date, end_date, description
        FROM doctor_organizations WHERE doctor_id = $1
    `, doctor.DoctorID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var organization models.DoctorOrganization
			var startDate, endDate *time.Time
			err = rows.Scan(
				&organization.OrganizationName,
				&organization.Role,
				&startDate,
				&endDate,
				&organization.Description,
			)
			if err != nil {
				log.Printf("Error scanning organization row: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error retrieving organizations"})
				return
			}
			layout := "2006-01-02"
			if startDate != nil {
				str := startDate.Format(layout)
				organization.StartDate = &str
			}
			if endDate != nil {
				str := endDate.Format(layout)
				organization.EndDate = &str
			}
			organizations = append(organizations, organization)
		}
	} else {
		log.Printf("Error querying organizations: %v", err)
	}
	doctor.Organizations = organizations

	// Fetch awards
	awards := []models.DoctorAward{}
	rows, err = pool.Query(context.Background(), `
        SELECT award_name, date_awarded, issuing_organization, description
        FROM doctor_awards WHERE doctor_id = $1
    `, doctor.DoctorID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var award models.DoctorAward
			var dateAwarded *time.Time
			err = rows.Scan(
				&award.AwardName,
				&dateAwarded,
				&award.IssuingOrganization,
				&award.Description,
			)
			if err != nil {
				log.Printf("Error scanning award row: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error retrieving awards"})
				return
			}
			layout := "2006-01-02"
			if dateAwarded != nil {
				str := dateAwarded.Format(layout)
				award.DateAwarded = &str
			}
			awards = append(awards, award)
		}
	} else {
		log.Printf("Error querying awards: %v", err)
	}
	doctor.Awards = awards

	// Fetch certifications
	certifications := []models.DoctorCertification{}
	rows, err = pool.Query(context.Background(), `
        SELECT certification_name, issued_by, issue_date, expiration_date, description
        FROM doctor_certifications WHERE doctor_id = $1
    `, doctor.DoctorID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var certification models.DoctorCertification
			var issueDate, expirationDate *time.Time
			err = rows.Scan(
				&certification.CertificationName,
				&certification.IssuedBy,
				&issueDate,
				&expirationDate,
				&certification.Description,
			)
			if err != nil {
				log.Printf("Error scanning certification row: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error retrieving certifications"})
				return
			}
			layout := "2006-01-02"
			if issueDate != nil {
				str := issueDate.Format(layout)
				certification.IssueDate = &str
			}
			if expirationDate != nil {
				str := expirationDate.Format(layout)
				certification.ExpirationDate = &str
			}
			certifications = append(certifications, certification)
		}
	} else {
		log.Printf("Error querying certifications: %v", err)
	}
	doctor.Certifications = certifications

	// Fetch languages
	languages := []models.DoctorLanguage{}
	rows, err = pool.Query(context.Background(), `
        SELECT language_name, proficiency_level
        FROM doctor_languages WHERE doctor_id = $1
    `, doctor.DoctorID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var language models.DoctorLanguage
			err = rows.Scan(
				&language.LanguageName,
				&language.ProficiencyLevel,
			)
			if err != nil {
				log.Printf("Error scanning language row: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error retrieving languages"})
				return
			}
			languages = append(languages, language)
		}
	} else {
		log.Printf("Error querying languages: %v", err)
	}
	doctor.Languages = languages

	c.JSON(http.StatusOK, doctor)
}
