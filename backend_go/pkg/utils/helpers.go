package utils

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
)

func GenerateSecureToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate secure token: %w", err)
	}
	return hex.EncodeToString(bytes), nil
}

func GetUserImageRoute(c *gin.Context, db *pgxpool.Pool) {
	conn, err := db.Acquire(c.Request.Context())
	if err != nil {
		log.Printf("Failed to acquire database connection: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to acquire database connection"})
		return
	}
	defer conn.Release()

	userID := c.Param("userId")
	userType := c.Param("userType")

	if userID == "" || userType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID and user type are required"})
		return
	}

	var imageURL string

	if userType == "doctor" {
		err = conn.QueryRow(c.Request.Context(),
			`SELECT profile_photo_url FROM doctor_info WHERE doctor_id = $1`, userID).Scan(&imageURL)
	} else if userType == "patient" {
		err = conn.QueryRow(c.Request.Context(),
			`SELECT profile_photo_url FROM patient_info WHERE patient_id = $1`, userID).Scan(&imageURL)
	} else if userType == "receptionist" {
		err = conn.QueryRow(c.Request.Context(),
			`SELECT profile_photo_url FROM receptionists WHERE receptionist_id = $1`, userID).Scan(&imageURL)
	} else {
		log.Printf("Invalid userType: %s", userType)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user type"})
		return
	}

	if err != nil {
		if err == pgx.ErrNoRows {
			log.Printf("User not found: %s", userID)
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			log.Printf("Error fetching user image: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		}
		return
	}

	if imageURL == "" {
		c.JSON(http.StatusOK, gin.H{"imageUrl": ""})
		return
	}

	presignedURL, err := GeneratePresignedObjectURL(imageURL)
	if err != nil {
		log.Printf("Failed to generate presigned URL for image %s: %v", imageURL, err)
		c.JSON(http.StatusOK, gin.H{"imageUrl": ""})
		return
	}

	c.JSON(http.StatusOK, gin.H{"imageUrl": presignedURL})
}

func GetUserImage(userID, userType string, ctx context.Context, db *pgxpool.Pool) (string, error) {
	conn, err := db.Acquire(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to acquire database connection: %v", err)
	}
	defer conn.Release()

	var imageURL string

	if userType == "doctor" {
		err = conn.QueryRow(ctx,
			`SELECT profile_photo_url FROM doctor_info WHERE doctor_id = $1`, userID).Scan(&imageURL)
	} else if userType == "patient" {
		err = conn.QueryRow(ctx,
			`SELECT profile_photo_url FROM patient_info WHERE patient_id = $1`, userID).Scan(&imageURL)
	} else if userType == "receptionist" {
		err = conn.QueryRow(ctx,
			`SELECT profile_photo_url FROM receptionists WHERE receptionist_id = $1`, userID).Scan(&imageURL)
	} else {
		return "", fmt.Errorf("invalid user type: %s", userType)
	}

	if err != nil {
		if err == pgx.ErrNoRows {
			return "", fmt.Errorf("user not found")
		}
		return "", fmt.Errorf("error fetching user image: %v", err)
	}

	presignedURL, err := GeneratePresignedObjectURL(imageURL)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %v", err)
	}

	return presignedURL, nil
}
