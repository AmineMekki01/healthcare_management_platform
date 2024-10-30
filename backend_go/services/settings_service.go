package services

import (
	"backend_go/models"
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v4/pgxpool"
)

func GetUserById(c *gin.Context, pool *pgxpool.Pool) {
	userId := c.Param("userId")
	userType := c.Query("userType")

	if userType == "patient" {
		var patient models.Patient

		err := pool.QueryRow(context.Background(),
			`SELECT email, phone_number, first_name, last_name, TO_CHAR(birth_date, 'YYYY-MM-DD'),
                    bio, sex, location, profile_photo_url, street_address, city_name, zip_code,
                    country_name, age
             FROM patient_info WHERE patient_id = $1`, userId).Scan(
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
				log.Printf("Patient not found: %v", err)
				c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
			} else {
				log.Println("Database Patient error:", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
			}
			return
		}
		c.JSON(http.StatusOK, patient)
	} else if userType == "doctor" {
		var doctor models.Doctor

		err := pool.QueryRow(context.Background(),
			`SELECT email, phone_number, first_name, last_name, TO_CHAR(birth_date, 'YYYY-MM-DD'),
                    bio, sex, location, profile_photo_url, street_address, city_name, zip_code,
                    country_name, age
             FROM doctor_info WHERE doctor_id = $1`, userId).Scan(
			&doctor.Email,
			&doctor.PhoneNumber,
			&doctor.FirstName,
			&doctor.LastName,
			&doctor.BirthDate,
			&doctor.Bio,
			&doctor.Sex,
			&doctor.Location,
			&doctor.ProfilePictureURL,
			&doctor.StreetAddress,
			&doctor.CityName,
			&doctor.ZipCode,
			&doctor.CountryName,
			&doctor.Age,
		)
		if err != nil {
			if err.Error() == "no rows in result set" {
				log.Printf("Doctor not found: %v", err)
				c.JSON(http.StatusNotFound, gin.H{"error": "Doctor not found"})
			} else {
				log.Println("Database Doctor error:", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
			}
			return
		}
		c.JSON(http.StatusOK, doctor)
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user type"})
	}
}

func UpdateUserInfo(c *gin.Context, pool *pgxpool.Pool) {
	userId := c.Param("userId")
	userType := c.Query("userType")

	if err := c.Request.ParseMultipartForm(50 << 20); err != nil {
		log.Println("Failed to parse multipart form:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	var userUpdateData struct {
		FirstName     string `form:"FirstName"`
		LastName      string `form:"LastName"`
		Email         string `form:"Email"`
		PhoneNumber   string `form:"PhoneNumber"`
		StreetAddress string `form:"StreetAddress"`
		CityName      string `form:"CityName"`
		ZipCode       string `form:"ZipCode"`
		CountryName   string `form:"CountryName"`
		Bio           string `form:"Bio"`
	}

	if err := c.Bind(&userUpdateData); err != nil {
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
			return
		}
	}

	var query string
	var args []interface{}

	if userType == "patient" {
		query = `
            UPDATE patient_info 
            SET first_name = $1, last_name = $2, email = $3, phone_number = $4, 
                street_address = $5, city_name = $6, zip_code = $7, country_name = $8, 
                bio = $9, update_at = NOW()
            WHERE patient_id = $11
        `
		args = []interface{}{
			userUpdateData.FirstName,
			userUpdateData.LastName,
			userUpdateData.Email,
			userUpdateData.PhoneNumber,
			userUpdateData.StreetAddress,
			userUpdateData.CityName,
			userUpdateData.ZipCode,
			userUpdateData.CountryName,
			userUpdateData.Bio,
			userId,
		}
	} else if userType == "doctor" {
		query = `
            UPDATE doctor_info 
            SET first_name = $1, last_name = $2, email = $3, phone_number = $4, 
                street_address = $5, city_name = $6, zip_code = $7, country_name = $8, 
                bio = $9, update_at = NOW()
            WHERE doctor_id = $11
        `
		args = []interface{}{
			userUpdateData.FirstName,
			userUpdateData.LastName,
			userUpdateData.Email,
			userUpdateData.PhoneNumber,
			userUpdateData.StreetAddress,
			userUpdateData.CityName,
			userUpdateData.ZipCode,
			userUpdateData.CountryName,
			userUpdateData.Bio,
			userId,
		}
	} else {
		log.Println("Invalid user type")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user type"})
		return
	}

	_, err = pool.Exec(context.Background(), query, args...)

	if err != nil {
		log.Printf("Error updating user info: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user information"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":             "User information updated successfully",
		"userProfilePhotoUrl": presignedURL,
	})
}

func GetDoctorAdditionalInfo(c *gin.Context, pool *pgxpool.Pool) {
	docUUID := c.Param("doctorId")

	hospitals := []models.DoctorHospital{}
	rows, err := pool.Query(context.Background(), `
        SELECT id, hospital_name, position, start_date, end_date, description
        FROM doctor_hospitals WHERE doctor_id = $1
    `, docUUID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var hospital models.DoctorHospital
			var startDate, endDate *time.Time
			err = rows.Scan(&hospital.ID, &hospital.HospitalName, &hospital.Position, &startDate, &endDate, &hospital.Description)
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
	}

	organizations := []models.DoctorOrganization{}
	rows, err = pool.Query(context.Background(), `
        SELECT id, organization_name, role, start_date, end_date, description
        FROM doctor_organizations WHERE doctor_id = $1
    `, docUUID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var organization models.DoctorOrganization
			var startDate, endDate *time.Time
			err = rows.Scan(&organization.ID, &organization.OrganizationName, &organization.Role, &startDate, &endDate, &organization.Description)
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
	}

	awards := []models.DoctorAward{}
	rows, err = pool.Query(context.Background(), `
        SELECT id, award_name, date_awarded, issuing_organization, description
        FROM doctor_awards  WHERE doctor_id = $1
    `, docUUID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var award models.DoctorAward
			var dateAwarded *time.Time
			err = rows.Scan(&award.ID, &award.AwardName, &dateAwarded, &award.IssuingOrganization, &award.Description)
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
	}

	certifications := []models.DoctorCertification{}
	rows, err = pool.Query(context.Background(), `
        SELECT id, certification_name, issued_by, issue_date, expiration_date, description
        FROM doctor_certifications  WHERE doctor_id = $1
    `, docUUID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var certification models.DoctorCertification
			var issueDate, expirationDate *time.Time
			err = rows.Scan(&certification.ID, &certification.CertificationName, &certification.IssuedBy, &issueDate, &expirationDate, &certification.Description)
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
	}

	languages := []models.DoctorLanguage{}
	rows, err = pool.Query(context.Background(), `
        SELECT id, language_name, proficiency_level
        FROM doctor_languages  WHERE doctor_id = $1
    `, docUUID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var language models.DoctorLanguage
			err = rows.Scan(&language.ID, &language.LanguageName, &language.ProficiencyLevel)
			if err != nil {
				log.Printf("Error scanning language row: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error retrieving languages"})
				return
			}
			languages = append(languages, language)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"hospitals":      hospitals,
		"organizations":  organizations,
		"awards":         awards,
		"certifications": certifications,
		"languages":      languages,
	})
}

// Update additional info with details
func UpdateDoctorAdditionalInfo(c *gin.Context, pool *pgxpool.Pool) {
	doctorId := c.Param("doctorId")

	// Convert doctorId to UUID
	docUUID, err := uuid.Parse(doctorId)
	if err != nil {
		log.Println("Invalid doctor ID : ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid doctor ID"})
		return
	}

	var data struct {
		Hospitals      []models.DoctorHospital      `json:"hospitals"`
		Organizations  []models.DoctorOrganization  `json:"organizations"`
		Awards         []models.DoctorAward         `json:"awards"`
		Certifications []models.DoctorCertification `json:"certifications"`
		Languages      []models.DoctorLanguage      `json:"languages"`
	}

	if err := c.ShouldBindJSON(&data); err != nil {
		log.Println("Invalid input : ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	tx, err := pool.Begin(context.Background())
	if err != nil {
		log.Println("Transaction start failed : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Transaction start failed"})
		return
	}
	defer tx.Rollback(context.Background())

	// Delete existing entries
	_, err = tx.Exec(context.Background(), "DELETE FROM doctor_hospitals WHERE doctor_id = $1", docUUID)
	if err != nil {
		log.Println("Failed to update hospitals : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update hospitals"})
		return
	}

	_, err = tx.Exec(context.Background(), "DELETE FROM doctor_organizations WHERE doctor_id = $1", docUUID)
	if err != nil {
		log.Println("Failed to update organizations : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update organizations"})
		return
	}

	_, err = tx.Exec(context.Background(), "DELETE FROM doctor_awards WHERE doctor_id = $1", docUUID)
	if err != nil {
		log.Println("Failed to update awards : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update awards"})
		return
	}

	_, err = tx.Exec(context.Background(), "DELETE FROM doctor_certifications WHERE doctor_id = $1", docUUID)
	if err != nil {
		log.Println("Failed to update certifications : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update certifications"})
		return
	}

	_, err = tx.Exec(context.Background(), "DELETE FROM doctor_languages WHERE doctor_id = $1", docUUID)
	if err != nil {
		log.Println("Failed to update languages : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update languages"})
		return
	}

	// Insert new entries
	for _, hospital := range data.Hospitals {
		var startDate, endDate *time.Time
		layout := "2006-01-02"

		if hospital.StartDate != nil && *hospital.StartDate != "" {
			t, err := time.Parse(layout, *hospital.StartDate)
			if err != nil {
				log.Printf("Invalid start_date for hospital: %v", err)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_date format for hospital"})
				return
			}
			startDate = &t
		}

		if hospital.EndDate != nil && *hospital.EndDate != "" {
			t, err := time.Parse(layout, *hospital.EndDate)
			if err != nil {
				log.Printf("Invalid end_date for hospital: %v", err)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_date format for hospital"})
				return
			}
			endDate = &t
		}
		_, err := tx.Exec(context.Background(), `
            INSERT INTO doctor_hospitals (doctor_id, hospital_name, position, start_date, end_date, description)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, docUUID, hospital.HospitalName, hospital.Position, startDate, endDate, hospital.Description)
		if err != nil {
			log.Println("Failed to insert hospital : ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert hospital"})
			return
		}
	}

	for _, organization := range data.Organizations {
		var startDate, endDate *time.Time
		layout := "2006-01-02"

		if organization.StartDate != nil && *organization.StartDate != "" {
			t, err := time.Parse(layout, *organization.StartDate)
			if err != nil {
				log.Printf("Invalid start_date for organization: %v", err)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_date format for organization"})
				return
			}
			startDate = &t
		}

		if organization.EndDate != nil && *organization.EndDate != "" {
			t, err := time.Parse(layout, *organization.EndDate)
			if err != nil {
				log.Printf("Invalid end_date for organization: %v", err)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_date format for organization"})
				return
			}
			endDate = &t
		}

		_, err := tx.Exec(context.Background(), `
			INSERT INTO doctor_organizations (doctor_id, organization_name, role, start_date, end_date, description)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, docUUID, organization.OrganizationName, organization.Role, startDate, endDate, organization.Description)
		if err != nil {
			log.Println("Failed to insert organization : ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert organization"})
			return
		}
	}

	for _, award := range data.Awards {
		var dateAwarded *time.Time
		layout := "2006-01-02"

		if award.DateAwarded != nil && *award.DateAwarded != "" {
			t, err := time.Parse(layout, *award.DateAwarded)
			if err != nil {
				log.Printf("Invalid date_awarded for award: %v", err)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date_awarded format for award"})
				return
			}
			dateAwarded = &t
		}

		_, err := tx.Exec(context.Background(), `
			INSERT INTO doctor_awards (doctor_id, award_name, date_awarded, issuing_organization, description)
			VALUES ($1, $2, $3, $4, $5)
		`, docUUID, award.AwardName, dateAwarded, award.IssuingOrganization, award.Description)
		if err != nil {
			log.Println("Failed to insert award : ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert award"})
			return
		}
	}

	for _, certification := range data.Certifications {
		var issueDate, expirationDate *time.Time
		layout := "2006-01-02"

		if certification.IssueDate != nil && *certification.IssueDate != "" {
			t, err := time.Parse(layout, *certification.IssueDate)
			if err != nil {
				log.Printf("Invalid issue_date for certification: %v", err)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid issue_date format for certification"})
				return
			}
			issueDate = &t
		}

		if certification.ExpirationDate != nil && *certification.ExpirationDate != "" {
			t, err := time.Parse(layout, *certification.ExpirationDate)
			if err != nil {
				log.Printf("Invalid expiration_date for certification: %v", err)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid expiration_date format for certification"})
				return
			}
			expirationDate = &t
		}

		_, err := tx.Exec(context.Background(), `
			INSERT INTO doctor_certifications (doctor_id, certification_name, issued_by, issue_date, expiration_date, description)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, docUUID, certification.CertificationName, certification.IssuedBy, issueDate, expirationDate, certification.Description)
		if err != nil {
			log.Println("Failed to insert certification : ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert certification"})
			return
		}
	}

	for _, language := range data.Languages {
		_, err := tx.Exec(context.Background(), `
			INSERT INTO doctor_languages (doctor_id, language_name, proficiency_level)
			VALUES ($1, $2, $3)
		`, docUUID, language.LanguageName, language.ProficiencyLevel)
		if err != nil {
			log.Println("Failed to insert language : ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert language"})
			return
		}
	}

	err = tx.Commit(context.Background())
	if err != nil {
		log.Println("Transaction commit failed : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Transaction commit failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Doctor additional info updated successfully"})
}
