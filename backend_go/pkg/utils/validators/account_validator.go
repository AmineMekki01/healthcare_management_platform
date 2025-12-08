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
	subject := "Verify Your Email At TBIBI."
	body := "Please verify your email by clicking on the link below:\n" + verificationLink

	message := []byte("From: " + from + "\n" +
		"To: " + recipientEmail + "\n" +
		"Subject: " + subject + "\n\n" +
		body)

	auth := smtp.PlainAuth("", from, password, smtpHost)

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
	return nil
}

func IsUserAccountVerified(email string, table_name string, pool *pgxpool.Pool) (bool, error) {
	if pool == nil {
		log.Println("IsUserAccountVerified called with nil pool")
		return false, fmt.Errorf("database not configured")
	}

	var isVerified bool
	err := pool.QueryRow(context.Background(), fmt.Sprintf("SELECT is_verified FROM %s WHERE email = $1", table_name), email).Scan(&isVerified)
	if err != nil {
		log.Println("Error checking account verification status: ", err)
		return false, fmt.Errorf("failed to check account verification status: %v", err)
	}
	return isVerified, nil
}

func VerifyToken(token string, pool *pgxpool.Pool) (string, error) {
	var email string
	var tokenType string

	query := `SELECT email, type FROM verification_tokens WHERE token = $1 AND type = 'Account Validation'`
	err := pool.QueryRow(context.Background(), query, token).Scan(&email, &tokenType)
	if err != nil {
		log.Printf("Error verifying token: %v", err)
		return "", fmt.Errorf("invalid or expired token")
	}

	_, err = pool.Exec(context.Background(), "DELETE FROM verification_tokens WHERE token = $1", token)
	if err != nil {
		log.Printf("Error deleting token: %v", err)
	}

	return email, nil
}
