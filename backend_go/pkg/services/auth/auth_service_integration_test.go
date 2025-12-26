package auth

import (
	"context"
	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/testhelpers"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

var testDB *testhelpers.LocalTestDatabase

func setupIntegrationTest(t *testing.T) (*AuthService, context.Context, func()) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()

	if testDB == nil {
		var err error
		testDB, err = testhelpers.SetupLocalTestDatabase(ctx)
		if err != nil {
			t.Fatalf("Failed to setup test database: %v", err)
		}
	}

	unlock, err := testDB.AcquireTestLock(ctx)
	require.NoError(t, err)

	if err := testDB.CleanupTables(ctx); err != nil {
		unlock()
		t.Fatalf("Failed to cleanup tables: %v", err)
	}

	cfg := &config.Config{
		SMTPEmail:    "test@example.com",
		SMTPPassword: "",
		SMTPHost:     "smtp.example.com",
		SMTPPort:     "587",
	}

	service := NewAuthService(testDB.Pool, cfg)

	cleanup := func() {
		testDB.CleanupTestUser(ctx, "test.")
		testDB.CleanupTestUser(ctx, "doctor.")
		testDB.CleanupTestUser(ctx, "patient.")
		testDB.CleanupTestUser(ctx, "fullflow@")
		unlock()
	}

	return service, ctx, cleanup
}

func TestActivateAccount_Integration_DoctorSuccess(t *testing.T) {
	service, ctx, cleanup := setupIntegrationTest(t)
	defer cleanup()

	email := "doctor.integration@test.com"
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

	err := testDB.CreateTestDoctor(ctx, email, string(hashedPassword), "John", "Doe", false)
	require.NoError(t, err)

	token := "test-verification-token-123"
	err = testDB.CreateVerificationToken(ctx, email, token, "Account Validation")
	require.NoError(t, err)

	err = service.ActivateAccount(token)
	assert.NoError(t, err, "Should activate account successfully")

	var isVerified bool
	err = testDB.Pool.QueryRow(ctx,
		"SELECT is_verified FROM doctor_info WHERE email = $1", email).Scan(&isVerified)
	require.NoError(t, err)
	assert.True(t, isVerified, "Doctor should be verified")

	var tokenCount int
	err = testDB.Pool.QueryRow(ctx,
		"SELECT COUNT(*) FROM verification_tokens WHERE token = $1", token).Scan(&tokenCount)
	require.NoError(t, err)
	assert.Equal(t, 0, tokenCount, "Token should be deleted")
}

func TestActivateAccount_Integration_PatientSuccess(t *testing.T) {
	service, ctx, cleanup := setupIntegrationTest(t)
	defer cleanup()

	email := "patient.integration@test.com"
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

	err := testDB.CreateTestPatient(ctx, email, string(hashedPassword), "Jane", "Smith", false)
	require.NoError(t, err)

	token := "test-patient-token-456"
	err = testDB.CreateVerificationToken(ctx, email, token, "Account Validation")
	require.NoError(t, err)

	err = service.ActivateAccount(token)
	assert.NoError(t, err, "Should activate patient account successfully")

	var isVerified bool
	err = testDB.Pool.QueryRow(ctx,
		"SELECT is_verified FROM patient_info WHERE email = $1", email).Scan(&isVerified)
	require.NoError(t, err)
	assert.True(t, isVerified, "Patient should be verified")

	var tokenCount int
	err = testDB.Pool.QueryRow(ctx,
		"SELECT COUNT(*) FROM verification_tokens WHERE token = $1", token).Scan(&tokenCount)
	require.NoError(t, err)
	assert.Equal(t, 0, tokenCount, "Token should be deleted")
}

func TestActivateAccount_Integration_InvalidToken(t *testing.T) {
	service, ctx, cleanup := setupIntegrationTest(t)
	defer cleanup()
	_ = ctx

	err := service.ActivateAccount("non-existent-token")
	assert.Error(t, err, "Should fail with invalid token")
	assert.Contains(t, err.Error(), "no longer valid", "Error should mention token is invalid")
}

func TestActivateAccount_Integration_EmptyToken(t *testing.T) {
	service, ctx, cleanup := setupIntegrationTest(t)
	defer cleanup()
	_ = ctx

	err := service.ActivateAccount("")
	assert.Error(t, err, "Should fail with empty token")
	assert.Contains(t, err.Error(), "invalid token", "Error should mention invalid token")
}

func TestActivateAccount_Integration_UserNotFound(t *testing.T) {
	service, ctx, cleanup := setupIntegrationTest(t)
	defer cleanup()

	token := "token-for-ghost-user"
	_, err := testDB.Pool.Exec(ctx, `
		INSERT INTO verification_tokens (email, token, type)
		VALUES ($1, $2, $3)
	`, "ghost@test.com", token, "Account Validation")
	require.NoError(t, err)

	err = service.ActivateAccount(token)
	assert.Error(t, err, "Should fail when user not found")
	assert.Contains(t, err.Error(), "user not found", "Error should mention user not found")
}

func TestRequestPasswordReset_Integration_ExistingDoctor(t *testing.T) {
	service, ctx, cleanup := setupIntegrationTest(t)
	defer cleanup()

	email := "doctor.reset@test.com"
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

	err := testDB.CreateTestDoctor(ctx, email, string(hashedPassword), "John", "Reset", true)
	require.NoError(t, err)

	err = service.RequestPasswordReset(email)

	var tokenCount int
	err = testDB.Pool.QueryRow(ctx,
		"SELECT COUNT(*) FROM verification_tokens WHERE email = $1 AND type = $2",
		email, "Password Reset").Scan(&tokenCount)
	require.NoError(t, err)
	assert.Equal(t, 1, tokenCount, "Password reset token should be created")
}

func TestRequestPasswordReset_Integration_ExistingPatient(t *testing.T) {
	service, ctx, cleanup := setupIntegrationTest(t)
	defer cleanup()

	email := "patient.reset@test.com"
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

	err := testDB.CreateTestPatient(ctx, email, string(hashedPassword), "Jane", "Reset", true)
	require.NoError(t, err)

	err = service.RequestPasswordReset(email)

	var tokenCount int
	err = testDB.Pool.QueryRow(ctx,
		"SELECT COUNT(*) FROM verification_tokens WHERE email = $1 AND type = $2",
		email, "Password Reset").Scan(&tokenCount)
	require.NoError(t, err)
	assert.Equal(t, 1, tokenCount, "Password reset token should be created")
}

func TestRequestPasswordReset_Integration_NonExistentUser(t *testing.T) {
	service, _, cleanup := setupIntegrationTest(t)
	defer cleanup()

	err := service.RequestPasswordReset("nonexistent@test.com")
	assert.Error(t, err, "Should fail for non-existent user")
	assert.Contains(t, err.Error(), "user not found", "Error should mention user not found")
}

func TestUpdatePassword_Integration_ValidTokenDoctor(t *testing.T) {
	service, ctx, cleanup := setupIntegrationTest(t)
	defer cleanup()

	email := "doctor.update@test.com"
	oldPassword := "oldPassword123"
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(oldPassword), bcrypt.DefaultCost)

	err := testDB.CreateTestDoctor(ctx, email, string(hashedPassword), "John", "Update", true)
	require.NoError(t, err)

	token := "password-reset-token-789"
	err = testDB.CreateVerificationToken(ctx, email, token, "Password Reset")
	require.NoError(t, err)

	newPassword := "newSecurePassword456"
	err = service.UpdatePassword(token, newPassword)
	assert.NoError(t, err, "Should update password successfully")

	var updatedHashedPassword string
	err = testDB.Pool.QueryRow(ctx,
		"SELECT hashed_password FROM doctor_info WHERE email = $1", email).Scan(&updatedHashedPassword)
	require.NoError(t, err)

	err = bcrypt.CompareHashAndPassword([]byte(updatedHashedPassword), []byte(newPassword))
	assert.NoError(t, err, "New password should match")

	err = bcrypt.CompareHashAndPassword([]byte(updatedHashedPassword), []byte(oldPassword))
	assert.Error(t, err, "Old password should not match")

	var tokenCount int
	err = testDB.Pool.QueryRow(ctx,
		"SELECT COUNT(*) FROM verification_tokens WHERE token = $1", token).Scan(&tokenCount)
	require.NoError(t, err)
	assert.Equal(t, 0, tokenCount, "Token should be deleted after use")
}

func TestUpdatePassword_Integration_ValidTokenPatient(t *testing.T) {
	service, ctx, cleanup := setupIntegrationTest(t)
	defer cleanup()

	email := "patient.update@test.com"
	oldPassword := "oldPatientPass123"
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(oldPassword), bcrypt.DefaultCost)

	err := testDB.CreateTestPatient(ctx, email, string(hashedPassword), "Jane", "UpdatePatient", true)
	require.NoError(t, err)

	token := "patient-reset-token-999"
	err = testDB.CreateVerificationToken(ctx, email, token, "Password Reset")
	require.NoError(t, err)

	newPassword := "newPatientPassword789"
	err = service.UpdatePassword(token, newPassword)
	assert.NoError(t, err, "Should update patient password successfully")

	var updatedHashedPassword string
	err = testDB.Pool.QueryRow(ctx,
		"SELECT hashed_password FROM patient_info WHERE email = $1", email).Scan(&updatedHashedPassword)
	require.NoError(t, err)

	err = bcrypt.CompareHashAndPassword([]byte(updatedHashedPassword), []byte(newPassword))
	assert.NoError(t, err, "New password should match")
}

func TestUpdatePassword_Integration_InvalidToken(t *testing.T) {
	service, _, cleanup := setupIntegrationTest(t)
	defer cleanup()

	err := service.UpdatePassword("invalid-token", "newPassword123")
	assert.Error(t, err, "Should fail with invalid token")
	assert.Contains(t, err.Error(), "invalid or expired token", "Error should mention invalid token")
}

func TestUpdatePassword_Integration_EmptyFields(t *testing.T) {
	service, _, cleanup := setupIntegrationTest(t)
	defer cleanup()

	testCases := []struct {
		name     string
		token    string
		password string
	}{
		{"Empty token", "", "password123"},
		{"Empty password", "token123", ""},
		{"Both empty", "", ""},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := service.UpdatePassword(tc.token, tc.password)
			assert.Error(t, err, "Should fail with empty fields")
			assert.Contains(t, err.Error(), "required", "Error should mention required fields")
		})
	}
}

func TestGenerateSecureToken_Integration(t *testing.T) {
	service, _, cleanup := setupIntegrationTest(t)
	defer cleanup()

	tokens := make(map[string]bool)
	for i := 0; i < 100; i++ {
		token, err := service.GenerateSecureToken()
		require.NoError(t, err, "Should generate token successfully")
		require.NotEmpty(t, token, "Token should not be empty")
		require.Len(t, token, 128, "Token should be 128 characters (64 bytes hex encoded)")

		assert.False(t, tokens[token], "Token should be unique")
		tokens[token] = true
	}

	assert.Len(t, tokens, 100, "All tokens should be unique")
}

func TestFullPasswordResetFlow_Integration(t *testing.T) {
	service, ctx, cleanup := setupIntegrationTest(t)
	defer cleanup()

	email := "fullflow@test.com"
	originalPassword := "originalPassword123"
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(originalPassword), bcrypt.DefaultCost)

	err := testDB.CreateTestDoctor(ctx, email, string(hashedPassword), "Full", "Flow", true)
	require.NoError(t, err)

	service.RequestPasswordReset(email)

	var token string
	err = testDB.Pool.QueryRow(ctx,
		"SELECT token FROM verification_tokens WHERE email = $1 AND type = $2",
		email, "Password Reset").Scan(&token)
	require.NoError(t, err, "Token should be created")
	require.NotEmpty(t, token, "Token should not be empty")

	newPassword := "brandNewPassword456"
	err = service.UpdatePassword(token, newPassword)
	assert.NoError(t, err, "Should update password successfully")

	var finalHashedPassword string
	err = testDB.Pool.QueryRow(ctx,
		"SELECT hashed_password FROM doctor_info WHERE email = $1", email).Scan(&finalHashedPassword)
	require.NoError(t, err)

	err = bcrypt.CompareHashAndPassword([]byte(finalHashedPassword), []byte(newPassword))
	assert.NoError(t, err, "New password should work")

	err = bcrypt.CompareHashAndPassword([]byte(finalHashedPassword), []byte(originalPassword))
	assert.Error(t, err, "Old password should not work")

	var tokenCount int
	err = testDB.Pool.QueryRow(ctx,
		"SELECT COUNT(*) FROM verification_tokens WHERE token = $1", token).Scan(&tokenCount)
	require.NoError(t, err)
	assert.Equal(t, 0, tokenCount, "Token should be deleted")

	err = service.UpdatePassword(token, "anotherPassword")
	assert.Error(t, err, "Should not allow token reuse")
}
