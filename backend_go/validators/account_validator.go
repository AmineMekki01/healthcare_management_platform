package validators

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log"
	"net/http"
	"net/smtp"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/joho/godotenv"
)

func SendVerificationEmail(recipientEmail, verificationLink string) error {

	err := godotenv.Load("./.env")
	if err != nil {
		log.Println("Error loading .env file")
		log.Fatal("Error loading .env file")
	}

	from := os.Getenv("SMTP_EMAIL")
	password := os.Getenv("SMTP_EMAIL_PASSWORD")
	to := []string{recipientEmail}
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	log.Println("email : ", from)
	subject := "Verify Your Email At TBIBI."
	body := "Please verify your email by clicking on the link below:\n" + verificationLink

	message := []byte("From: " + from + "\n" +
		"To: " + recipientEmail + "\n" +
		"Subject: " + subject + "\n\n" +
		body)

	auth := smtp.PlainAuth("", from, password, smtpHost)

	// Sending email.
	err = smtp.SendMail(smtpHost+":"+smtpPort, auth, from, to, message)
	if err != nil {
		log.Printf("Error sending email: %v", err)
		return fmt.Errorf("failed to send verification email: %v", err)
	}
	return nil
}

func GenerateSecureToken() string {
	token := make([]byte, 32)
	_, err := rand.Read(token)
	if err != nil {
		log.Println("Error generating token: ", err)
		panic(err)
	}
	encodedToken := base64.URLEncoding.EncodeToString(token)
	return encodedToken
}

func GenerateVerificationLink(email string, c *gin.Context, pool *pgxpool.Pool) string {
	token := GenerateSecureToken()
	verificationLink := "http://localhost:3000/activate_account?token=" + token
	err := SaveVerificationToken(email, token, pool)
	if err != nil {
		log.Println("Error saving verification token: ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Could not save verification token"})
		return ""
	}
	return verificationLink
}

func SaveVerificationToken(email, token string, pool *pgxpool.Pool) error {
	_, err := pool.Exec(context.Background(), "INSERT INTO verification_tokens (email, token, type) VALUES ($1, $2, $3)", email, token, "Account Validation")
	if err != nil {
		log.Println("Error saving verification token: ", err)
		return fmt.Errorf("failed to save verification token: %v", err)
	}
	log.Printf("Saving token: %s for email: %s\n", token, email)
	return nil
}
