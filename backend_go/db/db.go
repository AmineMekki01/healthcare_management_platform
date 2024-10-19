package db

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/joho/godotenv"
)

func InitDatabase() (*pgxpool.Pool, error) {

	if err := godotenv.Load(); err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}
	host := os.Getenv("DATABASE_HOST")
	port := os.Getenv("DATABASE_PORT")
	user := os.Getenv("DATABASE_USER")
	password := os.Getenv("DATABASE_PASSWORD")
	database_name := os.Getenv("DATABASE_NAME")

	config, err := pgxpool.ParseConfig(" host=" + host + " port=" + port + " user=" + user + " password=" + password + " database=" + database_name)
	if err != nil {
		return nil, fmt.Errorf("failed to parse config: %v", err)
	}

	conn, err := pgxpool.ConnectConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %v", err)
	}

	// Create tables
	sqlQueries := []string{
		`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,

		`CREATE TABLE IF NOT EXISTS doctor_info (
			doctor_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
			username VARCHAR(50) NOT NULL,
			first_name VARCHAR(50) NOT NULL,	
			last_name VARCHAR(50) NOT NULL,
			age INTEGER NOT NULL,
			sex VARCHAR(50) NOT NULL,
			hashed_password VARCHAR(255) NOT NULL,
			salt VARCHAR(50) NOT NULL,
			specialty VARCHAR(50) NOT NULL,
			experience VARCHAR(50) NOT NULL,
			rating_score NUMERIC ,
			rating_count INTEGER NOT NULL,
			create_at TIMESTAMP NOT NULL DEFAULT NOW(),
			update_at TIMESTAMP NOT NULL DEFAULT NOW(),
			medical_license VARCHAR(50) NOT NULL,
			is_verified BOOLEAN NOT NULL DEFAULT FALSE,
			doctor_bio TEXT,
			email VARCHAR(255) NOT NULL,
			phone_number VARCHAR(255) NOT NULL,
			street_address VARCHAR(255) NOT NULL,
			city_name VARCHAR(255) NOT NULL,
			state_name VARCHAR(255) NOT NULL,
			zip_code VARCHAR(255) NOT NULL,
			country_name VARCHAR(255) NOT NULL,
			latitude DOUBLE PRECISION,
        	longitude DOUBLE PRECISION,
			birth_date DATE NOT NULL,
			location VARCHAR(255) NOT NULL,
			profile_photo_url VARCHAR(255) NOT NULL,
			hospitals TEXT[],
			organizations TEXT[],
			awards TEXT[],
			certifications TEXT[],
			languages TEXT[]
		)`,

		`CREATE TABLE IF NOT EXISTS patient_info (
			patient_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
			username VARCHAR(50) NOT NULL,
			first_name VARCHAR(50) NOT NULL,	
			last_name VARCHAR(50) NOT NULL,
			age INTEGER NOT NULL,
			sex VARCHAR(50) NOT NULL,
			hashed_password VARCHAR(255) NOT NULL,
			salt VARCHAR(50) NOT NULL,
			create_at TIMESTAMP NOT NULL DEFAULT NOW(),
			update_at TIMESTAMP NOT NULL DEFAULT NOW(),
			is_verified BOOLEAN NOT NULL DEFAULT FALSE,
			patient_bio TEXT NOT NULL,
			email VARCHAR(255) NOT NULL,
			phone_number VARCHAR(50) NOT NULL,
			street_address VARCHAR(255) NOT NULL,
			city_name VARCHAR(255) NOT NULL,
			state_name VARCHAR(255) NOT NULL,
			zip_code VARCHAR(255) NOT NULL,
			country_name VARCHAR(255) NOT NULL,
			birth_date DATE NOT NULL,
			location VARCHAR(255) NOT NULL,
			profile_photo_url VARCHAR(255) NOT NULL
		)`,

		`CREATE TABLE IF NOT EXISTS availabilities (
			availability_id SERIAL PRIMARY KEY,
			availability_start TIMESTAMP NOT NULL,
			availability_end TIMESTAMP NOT NULL,
			doctor_id uuid REFERENCES doctor_info(doctor_id)
		)`,

		`CREATE TABLE IF NOT EXISTS appointments (
			appointment_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
			appointment_start TIMESTAMP NOT NULL,
			appointment_end TIMESTAMP NOT NULL,
			title VARCHAR(50) NOT NULL,
			doctor_id uuid REFERENCES doctor_info(doctor_id),
			patient_id uuid,
			is_doctor_patient BOOLEAN NOT NULL DEFAULT FALSE,
			canceled BOOLEAN DEFAULT FALSE,
			canceled_by VARCHAR(10),
			cancellation_reason TEXT,
			cancellation_timestamp TIMESTAMP
		);`,

		`CREATE TABLE IF NOT EXISTS folder_file_info (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
			name VARCHAR(255) NOT NULL,
			created_at TIMESTAMP NOT NULL,
			updated_at TIMESTAMP NOT NULL,
			type VARCHAR(50) NOT NULL,
			size INTEGER NOT NULL,
			extension VARCHAR(50),
			path VARCHAR(255),
			user_id uuid NOT NULL,
			user_type VARCHAR(50) NOT NULL,
			parent_id uuid REFERENCES folder_file_info(id)
		)`,

		`CREATE TABLE IF NOT EXISTS shared_items (
			id SERIAL PRIMARY KEY,
			shared_by_id VARCHAR(255) NOT NULL, 
			shared_with_id VARCHAR(255) NOT NULL, 
			shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			item_id uuid REFERENCES folder_file_info(id)
		)`,

		`CREATE TABLE IF NOT EXISTS chats (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
			created_at TIMESTAMP NOT NULL,
			updated_at TIMESTAMP NOT NULL,
			deleted_at TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS participants (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
			chat_id uuid NOT NULL,
			user_id uuid NOT NULL,
			joined_at TIMESTAMP NOT NULL,
			created_at TIMESTAMP NOT NULL,
			updated_at TIMESTAMP NOT NULL,
			deleted_at TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS messages (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
			chat_id uuid NOT NULL,
			sender_id uuid NOT NULL,
			content TEXT,
			key TEXT,
			created_at TIMESTAMP NOT NULL,
			updated_at TIMESTAMP NOT NULL,
			deleted_at TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS verification_tokens (
			id SERIAL PRIMARY KEY,
			email VARCHAR(255) NOT NULL,
			token VARCHAR(255) NOT NULL,
			type VARCHAR(255) NOT NULL
		)`,

		`CREATE TABLE IF NOT EXISTS followers (
			id SERIAL PRIMARY KEY,
			doctor_id UUID NOT NULL REFERENCES doctor_info(doctor_id),
			follower_id UUID NOT NULL,
			follower_type VARCHAR(50) NOT NULL CHECK (follower_type IN ('patient' , 'doctor')),
			followed_at TIMESTAMP NOT NULL DEFAULT NOW(),
			UNIQUE (doctor_id, follower_id, follower_type)
		)`,

		`CREATE TABLE IF NOT EXISTS blog_posts (
            post_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            doctor_id UUID NOT NULL REFERENCES doctor_info(doctor_id),
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            specialty VARCHAR(100) NOT NULL,
            keywords TEXT[] NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );`,

		`CREATE TABLE IF NOT EXISTS comments (
			comment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			post_id UUID NOT NULL REFERENCES blog_posts(post_id) ON DELETE CASCADE,
			user_id UUID NOT NULL,
			user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('patient', 'doctor')),
			content TEXT NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT NOW()
		);`,

		`CREATE TABLE IF NOT EXISTS likes (
			like_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			post_id UUID NOT NULL REFERENCES blog_posts(post_id) ON DELETE CASCADE,
			user_id UUID NOT NULL,
			user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('patient', 'doctor')),
			liked_at TIMESTAMP NOT NULL DEFAULT NOW(),
			UNIQUE (post_id, user_id, user_type)
		);`,
	}

	for _, query := range sqlQueries {
		_, err = conn.Exec(context.Background(), query)
		if err != nil {
			return nil, fmt.Errorf("failed to create table: %v", err)
		}
	}

	return conn, nil
}
