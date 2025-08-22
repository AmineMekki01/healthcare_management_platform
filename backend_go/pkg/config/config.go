package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseHost     string
	DatabasePort     string
	DatabaseUser     string
	DatabasePassword string
	DatabaseName     string

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
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Printf("No .env file found, using environment variables")
	}

	return &Config{
		DatabaseHost:     getEnv("DATABASE_HOST", ""),
		DatabasePort:     getEnv("DATABASE_PORT", ""),
		DatabaseUser:     getEnv("DATABASE_USER", ""),
		DatabasePassword: getEnv("DATABASE_PASSWORD", ""),
		DatabaseName:     getEnv("DATABASE_NAME", ""),

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
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
