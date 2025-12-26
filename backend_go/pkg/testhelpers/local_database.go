package testhelpers

import (
	"context"
	"fmt"
	"log"

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

	pool, err := pgxpool.Connect(ctx, connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to local database: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	_, _ = pool.Exec(ctx, `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
	_, _ = pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS auth_sessions (
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

	testDB := &LocalTestDatabase{
		Pool:    pool,
		ConnStr: connStr,
	}

	log.Println("Ô£à Connected to local PostgreSQL successfully")
	return testDB, nil
}

func (db *LocalTestDatabase) CleanupTables(ctx context.Context) error {
	_, err := db.Pool.Exec(ctx, "TRUNCATE TABLE auth_sessions CASCADE")
	if err != nil {
		return fmt.Errorf("failed to truncate auth_sessions: %w", err)
	}

	_, err = db.Pool.Exec(ctx, "TRUNCATE TABLE verification_tokens RESTART IDENTITY CASCADE")
	if err != nil {
		return fmt.Errorf("failed to truncate verification_tokens: %w", err)
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
	_, _ = db.Pool.Exec(ctx, "DELETE FROM doctor_info WHERE email = $1", email)

	_, err := db.Pool.Exec(ctx, `
		INSERT INTO doctor_info (
			username, first_name, last_name, age, sex, hashed_password, salt,
			specialty, experience, rating_count, medical_license, is_verified,
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
	_, _ = db.Pool.Exec(ctx, "DELETE FROM patient_info WHERE email = $1", email)

	_, err := db.Pool.Exec(ctx, `
		INSERT INTO patient_info (
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
		INSERT INTO verification_tokens (email, token, type)
		VALUES ($1, $2, $3)
	`, email, token, tokenType)
	return err
}

func (db *LocalTestDatabase) CleanupTestUser(ctx context.Context, emailPrefix string) error {
	tables := []string{"doctor_info", "patient_info", "receptionist_info"}

	for _, table := range tables {
		query := fmt.Sprintf("DELETE FROM %s WHERE email LIKE $1", table)
		_, err := db.Pool.Exec(ctx, query, emailPrefix+"%")
		if err != nil {
			return fmt.Errorf("failed to cleanup %s: %w", table, err)
		}
	}

	_, err := db.Pool.Exec(ctx, "DELETE FROM verification_tokens WHERE email LIKE $1", emailPrefix+"%")
	if err != nil {
		return fmt.Errorf("failed to cleanup verification_tokens: %w", err)
	}

	return nil
}
