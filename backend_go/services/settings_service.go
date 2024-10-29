package services

import (
	"backend_go/models"
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
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
