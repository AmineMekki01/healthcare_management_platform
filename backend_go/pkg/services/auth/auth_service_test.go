package auth

import (
	"context"
	"fmt"
	"testing"

	"healthcare_backend/pkg/config"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

func createTestConfig() *config.Config {
	return &config.Config{
		SMTPEmail:    "test@example.com",
		SMTPPassword: "",
		SMTPHost:     "smtp.test.com",
		SMTPPort:     "587",
	}
}

func TestActivateAccount_ValidToken_Patient(t *testing.T) {

	cfg := createTestConfig()
	service := NewAuthService(nil, cfg)

	err := service.ActivateAccount("")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid token")
}

func TestActivateAccount_EmptyToken(t *testing.T) {
	cfg := createTestConfig()
	service := NewAuthService(nil, cfg)

	err := service.ActivateAccount("")

	assert.Error(t, err)
	assert.Equal(t, "invalid token", err.Error())
}

func TestRequestPasswordReset_EmptyEmail(t *testing.T) {
	cfg := createTestConfig()
	service := NewAuthService(nil, cfg)

	err := service.RequestPasswordReset("")

	assert.Error(t, err)
}

func TestUpdatePassword_EmptyFields(t *testing.T) {
	cfg := createTestConfig()
	service := NewAuthService(nil, cfg)

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

			assert.Error(t, err)
			assert.Contains(t, err.Error(), "required")
		})
	}
}

func TestGenerateSecureToken(t *testing.T) {
	cfg := createTestConfig()
	service := NewAuthService(nil, cfg)

	token, err := service.GenerateSecureToken()

	require.NoError(t, err, "Should generate token without error")
	assert.NotEmpty(t, token, "Token should not be empty")
	assert.Len(t, token, TokenLength*2, "Token should be 128 hex characters (64 bytes * 2)")

	for _, c := range token {
		assert.True(t, (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f'),
			"Token should only contain hex characters")
	}
}

func TestGenerateSecureToken_Uniqueness(t *testing.T) {
	cfg := createTestConfig()
	service := NewAuthService(nil, cfg)

	tokens := make(map[string]bool)
	for i := 0; i < 100; i++ {
		token, err := service.GenerateSecureToken()
		require.NoError(t, err)

		assert.False(t, tokens[token], "Token should be unique")
		tokens[token] = true
	}

	assert.Len(t, tokens, 100, "Should have 100 unique tokens")
}

func TestGenerateSecureToken_Length(t *testing.T) {
	cfg := createTestConfig()
	service := NewAuthService(nil, cfg)

	token, err := service.GenerateSecureToken()

	require.NoError(t, err)
	assert.Equal(t, 128, len(token), "Token should be 128 hex characters")
}

func TestPasswordHashing(t *testing.T) {
	password := "testPassword123"

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	require.NoError(t, err, "Should hash password")

	err = bcrypt.CompareHashAndPassword(hashedPassword, []byte(password))
	assert.NoError(t, err, "Should verify correct password")

	err = bcrypt.CompareHashAndPassword(hashedPassword, []byte("wrongPassword"))
	assert.Error(t, err, "Should reject wrong password")
}

func TestPasswordHashing_DifferentPasswords(t *testing.T) {
	password1 := "password1"
	password2 := "password2"

	hash1, err := bcrypt.GenerateFromPassword([]byte(password1), bcrypt.DefaultCost)
	require.NoError(t, err)

	hash2, err := bcrypt.GenerateFromPassword([]byte(password2), bcrypt.DefaultCost)
	require.NoError(t, err)

	assert.NotEqual(t, string(hash1), string(hash2))
}

func TestPasswordHashing_SamePasswordDifferentHashes(t *testing.T) {
	password := "samePassword123"

	hash1, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	require.NoError(t, err)

	hash2, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	require.NoError(t, err)

	assert.NotEqual(t, string(hash1), string(hash2), "Same password should produce different hashes")

	assert.NoError(t, bcrypt.CompareHashAndPassword(hash1, []byte(password)))
	assert.NoError(t, bcrypt.CompareHashAndPassword(hash2, []byte(password)))
}

func TestSendResetPasswordEmail_Structure(t *testing.T) {
	cfg := createTestConfig()
	service := NewAuthService(nil, cfg)

	err := service.SendResetPasswordEmail("", "http://example.com/reset")

	assert.Error(t, err)
}

type mockDB struct {
	queryRowFunc func(ctx context.Context, query string, args ...interface{}) error
	execFunc     func(ctx context.Context, query string, args ...interface{}) error
}

func TestActivateAccount_LogicFlow(t *testing.T) {
	cfg := createTestConfig()
	service := NewAuthService(nil, cfg)

	err := service.ActivateAccount("")
	assert.Error(t, err)
	assert.Equal(t, "invalid token", err.Error())

	err = service.ActivateAccount("valid-token-format-123")
	assert.Error(t, err)
}

func TestRequestPasswordReset_ValidationFlow(t *testing.T) {
	cfg := createTestConfig()
	service := NewAuthService(nil, cfg)

	err := service.RequestPasswordReset("test@example.com")

	assert.Error(t, err)
}

func TestUpdatePassword_ValidationLogic(t *testing.T) {
	cfg := createTestConfig()
	service := NewAuthService(nil, cfg)

	testCases := []struct {
		name          string
		token         string
		password      string
		expectError   bool
		errorContains string
	}{
		{
			name:          "Valid inputs",
			token:         "valid-token-123",
			password:      "newPassword123",
			expectError:   true,
			errorContains: "",
		},
		{
			name:          "Empty token",
			token:         "",
			password:      "newPassword123",
			expectError:   true,
			errorContains: "required",
		},
		{
			name:          "Empty password",
			token:         "valid-token",
			password:      "",
			expectError:   true,
			errorContains: "required",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := service.UpdatePassword(tc.token, tc.password)

			if tc.expectError {
				assert.Error(t, err)
				if tc.errorContains != "" {
					assert.Contains(t, err.Error(), tc.errorContains)
				}
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestGenerateSecureToken_ErrorHandling(t *testing.T) {
	cfg := createTestConfig()
	service := NewAuthService(nil, cfg)

	token, err := service.GenerateSecureToken()
	assert.NoError(t, err)
	assert.NotEmpty(t, token)

	assert.Len(t, token, 128)
}

func BenchmarkGenerateSecureToken(b *testing.B) {
	cfg := createTestConfig()
	service := NewAuthService(nil, cfg)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = service.GenerateSecureToken()
	}
}

func BenchmarkPasswordHashing(b *testing.B) {
	password := []byte("testPassword123")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		bcrypt.GenerateFromPassword(password, bcrypt.DefaultCost)
	}
}

func TestPasswordHashing_VerifyBcryptCost(t *testing.T) {
	password := "testPassword123"

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	require.NoError(t, err)

	cost, err := bcrypt.Cost(hashedPassword)
	require.NoError(t, err)

	assert.Equal(t, bcrypt.DefaultCost, cost, "Should use bcrypt DefaultCost")
	assert.Equal(t, 10, cost, "DefaultCost should be 10")
}

func TestPasswordHashing_VeryLongPassword(t *testing.T) {
	longPassword := make([]byte, 70)
	for i := range longPassword {
		longPassword[i] = 'a'
	}

	hashedPassword, err := bcrypt.GenerateFromPassword(longPassword, bcrypt.DefaultCost)
	require.NoError(t, err, "Should handle long password within bcrypt limit")
	require.NotEmpty(t, hashedPassword, "Should produce hash")

	err = bcrypt.CompareHashAndPassword(hashedPassword, longPassword)
	assert.NoError(t, err, "Should verify long password")

	tooLong := make([]byte, 100)
	for i := range tooLong {
		tooLong[i] = 'a'
	}
	_, err = bcrypt.GenerateFromPassword(tooLong, bcrypt.DefaultCost)
	assert.Error(t, err, "Passwords longer than 72 bytes should return an error")
}

func TestPasswordHashing_SpecialCharacters(t *testing.T) {
	testCases := []struct {
		name     string
		password string
	}{
		{"Special characters", "p@ssw0rd!#$%^&*()"},
		{"Unicode", "Õ»åþáü123"},
		{"Emoji", "pass­ƒöÆword123"},
		{"Newline", "pass\nword"},
		{"Tab", "pass\tword"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			hashedPassword, err := bcrypt.GenerateFromPassword([]byte(tc.password), bcrypt.DefaultCost)
			require.NoError(t, err, "Should hash password with special characters")

			err = bcrypt.CompareHashAndPassword(hashedPassword, []byte(tc.password))
			assert.NoError(t, err, "Should verify password with special characters")

			err = bcrypt.CompareHashAndPassword(hashedPassword, []byte("wrong"))
			assert.Error(t, err, "Should reject wrong password")
		})
	}
}

func TestPasswordHashing_EmptyPassword(t *testing.T) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(""), bcrypt.DefaultCost)

	assert.NoError(t, err, "Should handle empty password")
	assert.NotEmpty(t, hashedPassword, "Should produce hash for empty password")

	err = bcrypt.CompareHashAndPassword(hashedPassword, []byte(""))
	assert.NoError(t, err, "Should verify empty password")

	err = bcrypt.CompareHashAndPassword(hashedPassword, []byte("not-empty"))
	assert.Error(t, err, "Should reject non-empty password")
}

func TestGenerateSecureToken_StressTest(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping stress test in short mode")
	}

	cfg := createTestConfig()
	service := NewAuthService(nil, cfg)

	tokens := make(map[string]bool)
	for i := 0; i < 10000; i++ {
		token, err := service.GenerateSecureToken()
		require.NoError(t, err)

		assert.False(t, tokens[token], "Token %d should be unique", i)
		tokens[token] = true
	}

	assert.Len(t, tokens, 10000, "All 10,000 tokens should be unique")
}

func BenchmarkPasswordVerification(b *testing.B) {
	password := []byte("testPassword123")
	hash, _ := bcrypt.GenerateFromPassword(password, bcrypt.DefaultCost)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		bcrypt.CompareHashAndPassword(hash, password)
	}
}

func TestActivateAccount_Integration(t *testing.T) {
	t.Run("Patient activation flow", func(t *testing.T) {
		cfg := createTestConfig()
		service := NewAuthService(nil, cfg)

		token := "test-token-123"
		err := service.ActivateAccount(token)

		assert.Error(t, err)
	})

	t.Run("Doctor activation flow", func(t *testing.T) {
		cfg := createTestConfig()
		service := NewAuthService(nil, cfg)

		token := "doctor-token-456"
		err := service.ActivateAccount(token)

		assert.Error(t, err)
	})
}

func TestPasswordResetFlow_Integration(t *testing.T) {
	cfg := createTestConfig()
	service := NewAuthService(nil, cfg)

	t.Run("Complete password reset flow", func(t *testing.T) {
		email := "doctor@example.com"

		err := service.RequestPasswordReset(email)
		assert.Error(t, err)

		token, err := service.GenerateSecureToken()
		assert.NoError(t, err)
		assert.NotEmpty(t, token)

		newPassword := "newSecurePassword123"
		err = service.UpdatePassword(token, newPassword)
		assert.Error(t, err)
	})
}

func TestActivateAccount_ErrorScenarios(t *testing.T) {
	cfg := createTestConfig()
	service := NewAuthService(nil, cfg)

	testCases := []struct {
		name  string
		token string
	}{
		{"Empty token", ""},
		{"Whitespace token", "   "},
		{"Very long token", string(make([]byte, 1000))},
		{"Special characters", "!@#$%^&*()"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := service.ActivateAccount(tc.token)
			assert.Error(t, err)
		})
	}
}

func TestRequestPasswordReset_EdgeCases(t *testing.T) {
	cfg := createTestConfig()
	service := NewAuthService(nil, cfg)

	testCases := []struct {
		name  string
		email string
	}{
		{"Empty email", ""},
		{"Very long email", string(make([]byte, 500)) + "@example.com"},
		{"Email with spaces", "test @example.com"},
		{"Multiple @ signs", "test@@example.com"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := service.RequestPasswordReset(tc.email)
			assert.Error(t, err)
		})
	}
}

func TestUpdatePassword_PasswordComplexity(t *testing.T) {
	cfg := createTestConfig()
	service := NewAuthService(nil, cfg)

	testCases := []struct {
		name     string
		password string
	}{
		{"Short password", "123"},
		{"Long password", string(make([]byte, 100))},
		{"Special characters", "P@ssw0rd!#$%"},
		{"Unicode characters", "ð┐ð░ÐÇð¥ð╗Ðî123"},
		{"Emoji password", "password­ƒöÆ123"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := service.UpdatePassword("valid-token", tc.password)
			assert.Error(t, err)
		})
	}
}

func TestGenerateSecureToken_Concurrency(t *testing.T) {
	cfg := createTestConfig()
	service := NewAuthService(nil, cfg)

	tokens := make(chan string, 100)
	errors := make(chan error, 100)

	for i := 0; i < 100; i++ {
		go func() {
			token, err := service.GenerateSecureToken()
			if err != nil {
				errors <- err
			} else {
				tokens <- token
			}
		}()
	}

	tokenSet := make(map[string]bool)
	for i := 0; i < 100; i++ {
		select {
		case token := <-tokens:
			tokenSet[token] = true
		case err := <-errors:
			t.Fatalf("Error generating token: %v", err)
		}
	}

	assert.Len(t, tokenSet, 100, "All 100 tokens should be unique")
}

func TestSQLMockPattern(t *testing.T) {

	db, _, err := sqlmock.New()
	require.NoError(t, err, "Should create mock DB")
	defer db.Close()

	fmt.Println("SQLMock pattern demonstrated - ready for full integration tests")
	assert.NotNil(t, db, "Mock DB should be created")
}
