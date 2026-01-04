package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseHost        string
	DatabasePort        string
	DatabaseUser        string
	DatabasePassword    string
	DatabaseName        string
	DatabaseSSLMode     string
	DatabaseAutoMigrate bool

	ServerPort string

	S3BucketName string
	AWSRegion    string
	AWSAccessKey string
	AWSSecretKey string

	SMTPEmail    string
	SMTPPassword string
	SMTPHost     string
	SMTPPort     string

	JWTSecretKey string

	AppEnv string

	PythonAPIBaseURL string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Printf("No .env file found, using environment variables")
	}

	return &Config{
		DatabaseHost:        getEnv("DATABASE_HOST", ""),
		DatabasePort:        getEnv("DATABASE_PORT", ""),
		DatabaseUser:        getEnv("DATABASE_USER", ""),
		DatabasePassword:    getEnv("DATABASE_PASSWORD", ""),
		DatabaseName:        getEnv("DATABASE_NAME", ""),
		DatabaseSSLMode:     getEnv("DATABASE_SSLMODE", ""),
		DatabaseAutoMigrate: getEnvBool("DATABASE_AUTO_MIGRATE", false),

		ServerPort: getEnv("SERVER_PORT", ""),

		S3BucketName: getEnv("S3_BUCKET_NAME", ""),
		AWSRegion:    getEnv("AWS_REGION", ""),
		AWSAccessKey: getEnv("AWS_ACCESS_KEY", ""),
		AWSSecretKey: getEnv("AWS_SECRET_KEY", ""),

		SMTPEmail:    getEnv("SMTP_EMAIL", ""),
		SMTPPassword: getEnv("SMTP_EMAIL_PASSWORD", ""),
		SMTPHost:     getEnv("SMTP_HOST", ""),
		SMTPPort:     getEnv("SMTP_PORT", ""),

		JWTSecretKey: getEnv("JWT_SECRET_KEY", ""),

		AppEnv: getEnv("APP_ENV", ""),

		PythonAPIBaseURL: getEnv("PYTHON_API_BASE_URL", "http://localhost:8000"),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func getEnvBool(key string, fallback bool) bool {
	if value := os.Getenv(key); value != "" {
		switch value {
		case "1", "true", "TRUE", "True", "yes", "YES", "Yes", "y", "Y":
			return true
		case "0", "false", "FALSE", "False", "no", "NO", "No", "n", "N":
			return false
		default:
			return fallback
		}
	}
	return fallback
}
