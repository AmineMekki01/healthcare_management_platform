package testhelpers

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
)

type LocalTestDatabase struct {
	Pool    *pgxpool.Pool
	ConnStr string
}

const localTestDBAdvisoryLockID int64 = 912345678

func (db *LocalTestDatabase) AcquireTestLock(ctx context.Context) (func(), error) {
	if db == nil || db.Pool == nil {
		return func() {}, nil
	}

	conn, err := db.Pool.Acquire(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to acquire db connection for advisory lock: %w", err)
	}

	if _, err := conn.Exec(ctx, "SELECT pg_advisory_lock($1)", localTestDBAdvisoryLockID); err != nil {
		conn.Release()
		return nil, fmt.Errorf("failed to acquire advisory lock: %w", err)
	}

	unlock := func() {
		_, _ = conn.Exec(context.Background(), "SELECT pg_advisory_unlock($1)", localTestDBAdvisoryLockID)
		conn.Release()
	}

	return unlock, nil
}

func SetupLocalTestDatabase(ctx context.Context) (*LocalTestDatabase, error) {
	connStr := "postgres://postgres:Amine-1963@localhost:5432/tbibi_app?sslmode=disable"

	config, err := pgxpool.ParseConfig(connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to parse local database config: %w", err)
	}
	if config.ConnConfig.RuntimeParams == nil {
		config.ConnConfig.RuntimeParams = map[string]string{}
	}
	config.ConnConfig.RuntimeParams["search_path"] = "tbibi_test,public"
	config.AfterConnect = func(ctx context.Context, conn *pgx.Conn) error {
		_, err := conn.Exec(ctx, "SET search_path TO tbibi_test,public")
		return err
	}

	pool, err := pgxpool.ConnectConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to local database: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	_, _ = pool.Exec(ctx, `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
	_, _ = pool.Exec(ctx, `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`)
	_, _ = pool.Exec(ctx, `CREATE SCHEMA IF NOT EXISTS tbibi_test`)
	_, _ = pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS tbibi_test.auth_sessions (
		id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
		user_id uuid NOT NULL,
		user_type VARCHAR(50) NOT NULL,
		token_hash VARCHAR(255) NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
		last_used_at TIMESTAMP WITH TIME ZONE,
		expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
		revoked_at TIMESTAMP WITH TIME ZONE,
		ip_address VARCHAR(64),
		user_agent TEXT,
		CONSTRAINT auth_sessions_token_hash_unique UNIQUE (token_hash)
	)`)

	_, _ = pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS tbibi_test.verification_tokens (
		id SERIAL PRIMARY KEY,
		email VARCHAR(255) NOT NULL,
		token TEXT NOT NULL UNIQUE,
		type VARCHAR(50) NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
	)`)

	_, _ = pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS tbibi_test.doctor_info (
		doctor_id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
		username VARCHAR(50) UNIQUE NOT NULL,
		first_name VARCHAR(50) NOT NULL,
		first_name_ar VARCHAR(100),
		last_name VARCHAR(50) NOT NULL,
		last_name_ar VARCHAR(100),
		age INTEGER NOT NULL,
		sex VARCHAR(50) NOT NULL,
		hashed_password VARCHAR(255) NOT NULL,
		salt VARCHAR(50) NOT NULL,
		specialty_code VARCHAR(100) NOT NULL,
		experience VARCHAR(50) NOT NULL,
		rating_score NUMERIC,
		rating_count INTEGER NOT NULL,
		medical_license VARCHAR(50) NOT NULL,
		is_verified BOOLEAN NOT NULL DEFAULT FALSE,
		bio TEXT,
		bio_ar TEXT,
		bio_fr TEXT,
		email VARCHAR(255) UNIQUE NOT NULL,
		phone_number VARCHAR(255) NOT NULL,
		clinic_phone_number VARCHAR(255) NOT NULL,
		show_clinic_phone BOOLEAN NOT NULL DEFAULT TRUE,
		street_address VARCHAR(255) NOT NULL,
		street_address_ar VARCHAR(255),
		street_address_fr VARCHAR(255),
		city_name VARCHAR(255) NOT NULL,
		city_name_ar VARCHAR(255),
		city_name_fr VARCHAR(255),
		state_name VARCHAR(255) NOT NULL,
		state_name_ar VARCHAR(255),
		state_name_fr VARCHAR(255),
		zip_code VARCHAR(255) NOT NULL,
		country_name VARCHAR(255) NOT NULL,
		country_name_ar VARCHAR(255),
		country_name_fr VARCHAR(255),
		latitude DOUBLE PRECISION,
		longitude DOUBLE PRECISION,
		birth_date DATE NOT NULL,
		location VARCHAR(255) NOT NULL,
		location_ar VARCHAR(255),
		location_fr VARCHAR(255),
		profile_photo_url VARCHAR(255) NOT NULL,
		is_active BOOLEAN NOT NULL DEFAULT TRUE,
		deleted_at TIMESTAMP WITH TIME ZONE,
		created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
	)`)

	_, _ = pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS tbibi_test.patient_info (
		patient_id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
		username VARCHAR(50) UNIQUE NOT NULL,
		first_name VARCHAR(50) NOT NULL,
		first_name_ar VARCHAR(50),
		last_name VARCHAR(50) NOT NULL,
		last_name_ar VARCHAR(50),
		age INTEGER NOT NULL,
		sex VARCHAR(50) NOT NULL,
		hashed_password VARCHAR(255) NOT NULL,
		salt VARCHAR(50) NOT NULL,
		is_verified BOOLEAN NOT NULL DEFAULT FALSE,
		bio TEXT,
		bio_ar TEXT,
		email VARCHAR(255) UNIQUE NOT NULL,
		phone_number VARCHAR(50) NOT NULL,
		street_address VARCHAR(255) NOT NULL,
		street_address_ar VARCHAR(255),
		street_address_fr VARCHAR(255),
		city_name VARCHAR(255) NOT NULL,
		city_name_ar VARCHAR(255),
		city_name_fr VARCHAR(255),
		state_name VARCHAR(255) NOT NULL,
		state_name_ar VARCHAR(255),
		state_name_fr VARCHAR(255),
		zip_code VARCHAR(255) NOT NULL,
		country_name VARCHAR(255) NOT NULL,
		country_name_ar VARCHAR(255),
		country_name_fr VARCHAR(255),
		birth_date DATE NOT NULL,
		location VARCHAR(255) NOT NULL,
		location_ar VARCHAR(255),
		location_fr VARCHAR(255),
		profile_photo_url VARCHAR(255) NOT NULL,
		is_active BOOLEAN NOT NULL DEFAULT TRUE,
		deleted_at TIMESTAMP WITH TIME ZONE,
		created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
	)`)

	_, _ = pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS tbibi_test.receptionists (
		receptionist_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		username VARCHAR(50) UNIQUE NOT NULL,
		first_name VARCHAR(100) NOT NULL,
		first_name_ar VARCHAR(100),
		last_name VARCHAR(100) NOT NULL,
		last_name_ar VARCHAR(100),
		sex VARCHAR(50) NOT NULL,
		hashed_password VARCHAR(255) NOT NULL,
		salt TEXT NOT NULL,
		email VARCHAR(255) UNIQUE NOT NULL,
		phone_number VARCHAR(20) NOT NULL,
		street_address TEXT,
		street_address_ar TEXT,
		street_address_fr TEXT,
		city_name VARCHAR(100) NOT NULL,
		city_name_ar VARCHAR(100),
		city_name_fr VARCHAR(100),
		state_name VARCHAR(100) NOT NULL,
		state_name_ar VARCHAR(100),
		state_name_fr VARCHAR(100),
		zip_code VARCHAR(20),
		country_name VARCHAR(100) NOT NULL,
		country_name_ar VARCHAR(100),
		country_name_fr VARCHAR(100),
		location TEXT,
		location_ar TEXT,
		location_fr TEXT,
		birth_date DATE,
		bio TEXT,
		bio_ar TEXT,
		profile_photo_url TEXT,
		assigned_doctor_id UUID REFERENCES doctor_info(doctor_id),
		is_active BOOLEAN NOT NULL DEFAULT true,
		email_verified BOOLEAN NOT NULL DEFAULT false,
		created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
	)`)

	_, _ = pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS tbibi_test.appointments (
		appointment_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
		appointment_start TIMESTAMP WITH TIME ZONE NOT NULL,
		appointment_end TIMESTAMP WITH TIME ZONE NOT NULL,
		title VARCHAR(50) NOT NULL,
		notes TEXT,
		doctor_id uuid NOT NULL REFERENCES doctor_info(doctor_id),
		patient_id uuid,
		is_doctor_patient BOOLEAN NOT NULL DEFAULT FALSE,
		canceled BOOLEAN DEFAULT FALSE,
		canceled_by VARCHAR(255),
		cancellation_reason TEXT,
		cancellation_timestamp TIMESTAMP WITH TIME ZONE,
		created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
	)`)

	_, _ = pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS tbibi_test.availabilities (
		availability_id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
		doctor_id uuid NOT NULL REFERENCES doctor_info(doctor_id),
		weekday VARCHAR(10),
		availability_start TIMESTAMP WITH TIME ZONE NOT NULL,
		availability_end TIMESTAMP WITH TIME ZONE NOT NULL,
		slot_duration INTEGER
	)`)

	_, _ = pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS tbibi_test.medical_reports (
		report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		appointment_id UUID,
		doctor_id UUID,
		patient_id UUID,
		patient_first_name VARCHAR(100),
		patient_last_name VARCHAR(100),
		doctor_first_name VARCHAR(100),
		doctor_last_name VARCHAR(100),
		report_content TEXT,
		diagnosis_made BOOLEAN DEFAULT FALSE,
		diagnosis_name VARCHAR(255),
		diagnosis_details TEXT,
		referral_needed BOOLEAN DEFAULT FALSE,
		referral_specialty VARCHAR(255),
		referral_doctor_name VARCHAR(255),
		referral_message TEXT,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
	)`)

	_, _ = pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS tbibi_test.medications (
		medication_id uuid NOT NULL DEFAULT gen_random_uuid(),
		patient_id uuid NOT NULL,
		medication_name character varying(255) NOT NULL,
		dosage character varying(100) NOT NULL,
		frequency character varying(100) NOT NULL,
		duration character varying(100) NOT NULL,
		instructions text,
		prescribing_doctor_name character varying(255),
		prescribing_doctor_id uuid,
		report_id uuid,
		created_at timestamp with time zone NOT NULL DEFAULT NOW(),
		updated_at timestamp with time zone NOT NULL DEFAULT NOW()
	)`)

	_, _ = pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS tbibi_test.medical_diagnosis_history (
		diag_history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		diagnosis_name VARCHAR(50) NOT NULL,
		diagnosis_details TEXT,
		diagnosis_doctor_name VARCHAR(50) NOT NULL,
		diagnosis_doctor_id UUID,
		diagnosis_patient_id UUID,
		created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
	)`)

	_, _ = pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS tbibi_test.medical_history (
		diagnosis_history_id UUID PRIMARY KEY,
		diagnosis_name TEXT NOT NULL,
		diagnosis_details TEXT,
		diagnosis_doctor_name TEXT NOT NULL,
		diagnosis_doctor_id UUID NOT NULL,
		patient_id UUID NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
	)`)

	_, _ = pool.Exec(ctx, `ALTER TABLE tbibi_test.receptionists ADD COLUMN IF NOT EXISTS first_name_ar VARCHAR(100)`)
	_, _ = pool.Exec(ctx, `ALTER TABLE tbibi_test.receptionists ADD COLUMN IF NOT EXISTS last_name_ar VARCHAR(100)`)
	_, _ = pool.Exec(ctx, `ALTER TABLE tbibi_test.medical_reports ADD COLUMN IF NOT EXISTS referral_doctor_id UUID`)

	_, _ = pool.Exec(ctx, `ALTER TABLE tbibi_test.doctor_info ADD COLUMN IF NOT EXISTS specialty_code VARCHAR(100)`)

	testDB := &LocalTestDatabase{
		Pool:    pool,
		ConnStr: connStr,
	}

	log.Println("Ô£à Connected to local PostgreSQL successfully")
	return testDB, nil
}

func (db *LocalTestDatabase) CleanupTables(ctx context.Context) error {
	tables := []string{
		"medical_history",
		"medical_diagnosis_history",
		"medications",
		"medical_reports",
		"appointments",
		"availabilities",
		"receptionists",
		"patient_info",
		"doctor_info",
		"auth_sessions",
		"verification_tokens",
	}

	for _, table := range tables {
		query := fmt.Sprintf("TRUNCATE TABLE tbibi_test.%s RESTART IDENTITY CASCADE", table)
		if _, err := db.Pool.Exec(ctx, query); err != nil {
			if strings.Contains(err.Error(), "does not exist") {
				continue
			}
			return fmt.Errorf("failed to truncate table %s: %w", table, err)
		}
	}

	return nil
}

func (db *LocalTestDatabase) Cleanup(ctx context.Context) error {
	if db.Pool != nil {
		db.Pool.Close()
	}
	return nil
}

func (db *LocalTestDatabase) CreateTestDoctor(ctx context.Context, email, password, firstName, lastName string, isVerified bool) error {
	_, _ = db.Pool.Exec(ctx, "DELETE FROM tbibi_test.doctor_info WHERE email = $1 OR username = $1", email)

	_, err := db.Pool.Exec(ctx, `
		INSERT INTO tbibi_test.doctor_info (
			username, first_name, last_name, age, sex, hashed_password, salt,
			specialty_code, experience, rating_count, medical_license, is_verified,
			bio, email, phone_number, street_address, city_name, state_name, zip_code,
			country_name, birth_date, location, profile_photo_url
		)
		VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
		)
	`,
		email,
		firstName, lastName,
		35,
		"Male",
		password,
		"test-salt",
		"Cardiology",
		"5 years",
		0,
		"TEST-LIC-"+email,
		isVerified,
		"Test doctor bio",
		email,
		"+212-600-000-000",
		"123 Test Street",
		"Casablanca",
		"Casablanca-Settat",
		"20000",
		"Morocco",
		"1990-01-01",
		"Casablanca, Morocco",
		"https://example.com/photo.jpg",
	)
	return err
}

func (db *LocalTestDatabase) CreateTestPatient(ctx context.Context, email, password, firstName, lastName string, isVerified bool) error {
	_, _ = db.Pool.Exec(ctx, "DELETE FROM tbibi_test.patient_info WHERE email = $1 OR username = $1", email)

	_, err := db.Pool.Exec(ctx, `
		INSERT INTO tbibi_test.patient_info (
			username, first_name, last_name, age, sex, hashed_password, salt, is_verified,
			bio, email, phone_number, street_address, city_name, state_name, zip_code,
			country_name, birth_date, location, profile_photo_url
		)
		VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
		)
	`,
		email,
		firstName, lastName,
		30,
		"Female",
		password,
		"test-salt",
		isVerified,
		"Test patient bio",
		email,
		"+212-600-000-001",
		"456 Patient Street",
		"Rabat",
		"Rabat-Sal├®-K├®nitra",
		"10000",
		"Morocco",
		"1995-05-15",
		"Rabat, Morocco",
		"https://example.com/patient.jpg",
	)
	return err
}

func (db *LocalTestDatabase) CreateVerificationToken(ctx context.Context, email, token, tokenType string) error {
	_, err := db.Pool.Exec(ctx, `
		INSERT INTO tbibi_test.verification_tokens (email, token, type)
		VALUES ($1, $2, $3)
	`, email, token, tokenType)
	return err
}

func (db *LocalTestDatabase) CleanupTestUser(ctx context.Context, emailPrefix string) error {
	tables := []string{"doctor_info", "patient_info", "receptionists"}

	for _, table := range tables {
		query := fmt.Sprintf("DELETE FROM tbibi_test.%s WHERE email LIKE $1", table)
		_, err := db.Pool.Exec(ctx, query, emailPrefix+"%")
		if err != nil {
			return fmt.Errorf("failed to cleanup %s: %w", table, err)
		}
	}

	_, err := db.Pool.Exec(ctx, "DELETE FROM tbibi_test.verification_tokens WHERE email LIKE $1", emailPrefix+"%")
	if err != nil {
		return fmt.Errorf("failed to cleanup verification_tokens: %w", err)
	}

	return nil
}
