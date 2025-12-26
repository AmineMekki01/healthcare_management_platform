package testhelpers

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
)

type TestDatabase struct {
	Container *postgres.PostgresContainer
	Pool      *pgxpool.Pool
	ConnStr   string
}

func SetupTestDatabase(ctx context.Context) (*TestDatabase, error) {
	postgresContainer, err := postgres.Run(ctx,
		"postgres:15-alpine",
		postgres.WithDatabase("test_healthcare"),
		postgres.WithUsername("test_user"),
		postgres.WithPassword("test_password"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2).
				WithStartupTimeout(60*time.Second)),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to start postgres container: %w", err)
	}

	connStr, err := postgresContainer.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		postgresContainer.Terminate(ctx)
		return nil, fmt.Errorf("failed to get connection string: %w", err)
	}

	pool, err := pgxpool.Connect(ctx, connStr)
	if err != nil {
		postgresContainer.Terminate(ctx)
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	testDB := &TestDatabase{
		Container: postgresContainer,
		Pool:      pool,
		ConnStr:   connStr,
	}

	if err := testDB.CreateSchema(ctx); err != nil {
		testDB.Cleanup(ctx)
		return nil, fmt.Errorf("failed to create schema: %w", err)
	}

	return testDB, nil
}

func (db *TestDatabase) CreateSchema(ctx context.Context) error {
	schema := `
		-- Create verification_tokens table
		CREATE TABLE IF NOT EXISTS verification_tokens (
			id SERIAL PRIMARY KEY,
			email VARCHAR(255) NOT NULL,
			token TEXT NOT NULL UNIQUE,
			type VARCHAR(50) NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
		);

		-- Create auth_sessions table
		CREATE TABLE IF NOT EXISTS auth_sessions (
			id SERIAL PRIMARY KEY,
			user_id TEXT NOT NULL,
			user_type VARCHAR(50) NOT NULL,
			token_hash TEXT NOT NULL UNIQUE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			last_used_at TIMESTAMP,
			expires_at TIMESTAMP NOT NULL,
			revoked_at TIMESTAMP,
			ip_address VARCHAR(64),
			user_agent TEXT
		);

		-- Create doctor_info table
		CREATE TABLE IF NOT EXISTS doctor_info (
			doctor_id SERIAL PRIMARY KEY,
			email VARCHAR(255) UNIQUE NOT NULL,
			hashed_password TEXT NOT NULL,
			first_name VARCHAR(100) NOT NULL,
			last_name VARCHAR(100) NOT NULL,
			specialization VARCHAR(100),
			license_number VARCHAR(50) UNIQUE,
			phone VARCHAR(20),
			is_verified BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);

		-- Create patient_info table
		CREATE TABLE IF NOT EXISTS patient_info (
			patient_id SERIAL PRIMARY KEY,
			email VARCHAR(255) UNIQUE NOT NULL,
			hashed_password TEXT NOT NULL,
			first_name VARCHAR(100) NOT NULL,
			last_name VARCHAR(100) NOT NULL,
			date_of_birth DATE,
			gender VARCHAR(20),
			phone VARCHAR(20),
			address TEXT,
			is_verified BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);

		-- Create receptionist_info table
		CREATE TABLE IF NOT EXISTS receptionist_info (
			receptionist_id SERIAL PRIMARY KEY,
			email VARCHAR(255) UNIQUE NOT NULL,
			hashed_password TEXT NOT NULL,
			first_name VARCHAR(100) NOT NULL,
			last_name VARCHAR(100) NOT NULL,
			phone VARCHAR(20),
			is_verified BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);

		-- Create indexes for performance
		CREATE INDEX IF NOT EXISTS idx_verification_tokens_email ON verification_tokens(email);
		CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);
		CREATE INDEX IF NOT EXISTS idx_doctor_info_email ON doctor_info(email);
		CREATE INDEX IF NOT EXISTS idx_patient_info_email ON patient_info(email);
	`

	_, err := db.Pool.Exec(ctx, schema)
	if err != nil {
		return fmt.Errorf("failed to execute schema: %w", err)
	}

	log.Println("Ô£à Database schema created successfully")
	return nil
}

func (db *TestDatabase) CleanupTables(ctx context.Context) error {
	tables := []string{
		"auth_sessions",
		"verification_tokens",
		"doctor_info",
		"patient_info",
		"receptionist_info",
	}

	for _, table := range tables {
		query := fmt.Sprintf("TRUNCATE TABLE %s RESTART IDENTITY CASCADE", table)
		if _, err := db.Pool.Exec(ctx, query); err != nil {
			return fmt.Errorf("failed to truncate table %s: %w", table, err)
		}
	}

	return nil
}

func (db *TestDatabase) Cleanup(ctx context.Context) error {
	if db.Pool != nil {
		db.Pool.Close()
	}

	if db.Container != nil {
		if err := db.Container.Terminate(ctx); err != nil {
			return fmt.Errorf("failed to terminate container: %w", err)
		}
	}

	return nil
}

func (db *TestDatabase) SeedTestData(ctx context.Context) error {
	_, err := db.Pool.Exec(ctx, `
		INSERT INTO doctor_info (email, hashed_password, first_name, last_name, specialization, license_number, is_verified)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (email) DO NOTHING
	`, "test.doctor@hospital.com", "$2a$10$YourHashedPasswordHere", "Test", "Doctor", "Cardiology", "LIC-TEST-001", true)

	if err != nil {
		return fmt.Errorf("failed to seed doctor data: %w", err)
	}

	_, err = db.Pool.Exec(ctx, `
		INSERT INTO patient_info (email, hashed_password, first_name, last_name, date_of_birth, gender, is_verified)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (email) DO NOTHING
	`, "test.patient@email.com", "$2a$10$YourHashedPasswordHere", "Test", "Patient", "1990-01-01", "Male", true)

	if err != nil {
		return fmt.Errorf("failed to seed patient data: %w", err)
	}

	log.Println("Ô£à Test data seeded successfully")
	return nil
}
