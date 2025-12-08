package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/smtp"

	"healthcare_backend/pkg/config"

	"github.com/jackc/pgx/v4/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	db  *pgxpool.Pool
	cfg *config.Config
}

func NewAuthService(db *pgxpool.Pool, cfg *config.Config) *AuthService {
	return &AuthService{
		db:  db,
		cfg: cfg,
	}
}

func (s *AuthService) ActivateAccount(token string) error {
	if token == "" {
		return fmt.Errorf("invalid token")
	}

	if s.db == nil {
		return fmt.Errorf("database not configured")
	}

	var email string
	err := s.db.QueryRow(context.Background(), "SELECT email FROM verification_tokens WHERE token = $1 AND type = $2", token, "Account Validation").Scan(&email)
	if err != nil {
		log.Println("Token is no longer valid")
		return fmt.Errorf("token is no longer valid")
	}

	var patientId string
	err = s.db.QueryRow(context.Background(), "SELECT patient_id FROM patient_info WHERE email = $1", email).Scan(&patientId)
	if err != nil {
		log.Println("Error retrieving patient ID:", err)
		if err.Error() != "no rows in result set" {
			return fmt.Errorf("internal server error")
		}
		log.Println("User is not a patient.")
	} else {
		log.Println("Got the patient id:", patientId)
	}

	var doctorId string
	err = s.db.QueryRow(context.Background(), "SELECT doctor_id FROM doctor_info WHERE email = $1", email).Scan(&doctorId)
	if err != nil {
		log.Println("Error retrieving doctor ID:", err)
		if err.Error() != "no rows in result set" {
			return fmt.Errorf("internal server error")
		}
		log.Println("User is not a doctor.")
	} else {
		log.Println("Got the doctor id:", doctorId)
	}

	if patientId != "" {
		_, err = s.db.Exec(context.Background(), "UPDATE patient_info SET is_verified = true WHERE email = $1", email)
		if err != nil {
			log.Println("Error updating patient verification status:", err)
			return fmt.Errorf("failed to verify account")
		}
	} else if doctorId != "" {
		_, err = s.db.Exec(context.Background(), "UPDATE doctor_info SET is_verified = true WHERE email = $1", email)
		if err != nil {
			log.Println("Error updating doctor verification status:", err)
			return fmt.Errorf("failed to verify account")
		}
	} else {
		return fmt.Errorf("user not found")
	}

	_, err = s.db.Exec(context.Background(), "DELETE FROM verification_tokens WHERE token = $1", token)
	if err != nil {
		log.Println("Error deleting verification token:", err)
		return fmt.Errorf("failed to cleanup verification token")
	}

	return nil
}

func (s *AuthService) RequestPasswordReset(email string) error {
	if email == "" {
		return fmt.Errorf("email is required")
	}

	if s.db == nil {
		return fmt.Errorf("database not configured")
	}

	var userExists bool
	err := s.db.QueryRow(context.Background(),
		"SELECT EXISTS(SELECT 1 FROM patient_info WHERE email = $1) OR EXISTS(SELECT 1 FROM doctor_info WHERE email = $1)",
		email).Scan(&userExists)
	if err != nil {
		log.Printf("Error checking user existence: %v", err)
		return fmt.Errorf("internal server error")
	}

	if !userExists {
		return fmt.Errorf("user not found")
	}

	token, err := s.GenerateSecureToken()
	if err != nil {
		return fmt.Errorf("failed to generate reset token")
	}

	_, err = s.db.Exec(context.Background(),
		"INSERT INTO verification_tokens (email, token, type) VALUES ($1, $2, $3)",
		email, token, "Password Reset")
	if err != nil {
		log.Printf("Error storing reset token: %v", err)
		return fmt.Errorf("failed to store reset token")
	}

	resetLink := fmt.Sprintf("http://localhost:3000/reset-password?token=%s", token)
	if err := s.SendResetPasswordEmail(email, resetLink); err != nil {
		log.Printf("Error sending reset email: %v", err)
	}

	return nil
}

func (s *AuthService) UpdatePassword(token, newPassword string) error {
	if token == "" || newPassword == "" {
		return fmt.Errorf("token and password are required")
	}

	if s.db == nil {
		return fmt.Errorf("database not configured")
	}

	var email string
	err := s.db.QueryRow(context.Background(),
		"SELECT email FROM verification_tokens WHERE token = $1 AND type = $2",
		token, "Password Reset").Scan(&email)
	if err != nil {
		return fmt.Errorf("invalid or expired token")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password")
	}

	_, err = s.db.Exec(context.Background(),
		"UPDATE patient_info SET hashed_password = $1 WHERE email = $2",
		string(hashedPassword), email)
	if err != nil {
		log.Printf("Error updating patient password: %v", err)
	}

	_, err = s.db.Exec(context.Background(),
		"UPDATE doctor_info SET hashed_password = $1 WHERE email = $2",
		string(hashedPassword), email)
	if err != nil {
		log.Printf("Error updating doctor password: %v", err)
	}

	_, err = s.db.Exec(context.Background(),
		"DELETE FROM verification_tokens WHERE token = $1",
		token)
	if err != nil {
		log.Printf("Error deleting used token: %v", err)
	}

	return nil
}

const TokenLength = 64

func (s *AuthService) GenerateSecureToken() (string, error) {
	token := make([]byte, TokenLength)
	_, err := rand.Read(token)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(token), nil
}

func (s *AuthService) SendResetPasswordEmail(recipientEmail, verificationLink string) error {
	from := s.cfg.SMTPEmail
	password := s.cfg.SMTPPassword
	to := []string{recipientEmail}
	smtpHost := s.cfg.SMTPHost
	smtpPort := s.cfg.SMTPPort

	subject := "Password Reset Request"
	body := fmt.Sprintf("Click the link below to reset your password:\n%s", verificationLink)

	message := []byte("From: " + from + "\n" +
		"To: " + recipientEmail + "\n" +
		"Subject: " + subject + "\n\n" +
		body)

	auth := smtp.PlainAuth("", from, password, smtpHost)
	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, from, to, message)
	if err != nil {
		log.Printf("Error sending email: %v", err)
		return fmt.Errorf("failed to send reset email")
	}

	return nil
}
