package auth

import (
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMain(m *testing.M) {
	os.Setenv("JWT_SECRET", "test-jwt-secret-key-for-testing")
	os.Setenv("REFRESH_SECRET", "test-refresh-secret-key-for-testing")
	
	JWTSecret = []byte(os.Getenv("JWT_SECRET"))
	RefreshSecret = []byte(os.Getenv("REFRESH_SECRET"))
	
	code := m.Run()
	
	os.Unsetenv("JWT_SECRET")
	os.Unsetenv("REFRESH_SECRET")
	
	os.Exit(code)
}

func TestGenerateTokenPair_Success(t *testing.T) {
	testUserID := "test-user-123"
	testUserType := "doctor"
	
	accessToken, refreshToken, err := GenerateTokenPair(testUserID, testUserType)
	
	assert.NoError(t, err, "GenerateTokenPair should not return error")
	assert.NotEmpty(t, accessToken, "Access token should not be empty")
	assert.NotEmpty(t, refreshToken, "Refresh token should not be empty")
	assert.NotEqual(t, accessToken, refreshToken, "Access and refresh tokens should be different")
	
	parsedAccessToken, err := jwt.Parse(accessToken, func(token *jwt.Token) (interface{}, error) {
		return JWTSecret, nil
	})
	assert.NoError(t, err, "Access token should be valid JWT")
	assert.True(t, parsedAccessToken.Valid, "Access token should be valid")
	
	parsedRefreshToken, err := jwt.Parse(refreshToken, func(token *jwt.Token) (interface{}, error) {
		return RefreshSecret, nil
	})
	assert.NoError(t, err, "Refresh token should be valid JWT")
	assert.True(t, parsedRefreshToken.Valid, "Refresh token should be valid")
}

func TestGenerateAccessToken_ValidClaims(t *testing.T) {
	testCases := []struct {
		name        string
		userID      string
		userType    string
		expectError bool
	}{
		{
			name:        "Doctor user",
			userID:      "doctor-123",
			userType:    "doctor",
			expectError: false,
		},
		{
			name:        "Patient user",
			userID:      "patient-456",
			userType:    "patient",
			expectError: false,
		},
		{
			name:        "Receptionist user",
			userID:      "receptionist-789",
			userType:    "receptionist",
			expectError: false,
		},
	}
	
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			token, err := GenerateAccessToken(tc.userID, tc.userType)
			
			if tc.expectError {
				assert.Error(t, err)
				return
			}
			
			require.NoError(t, err, "Should not return error")
			require.NotEmpty(t, token, "Token should not be empty")
			
			parsedToken, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
				return JWTSecret, nil
			})
			require.NoError(t, err, "Should parse token successfully")
			require.True(t, parsedToken.Valid, "Token should be valid")
			
			claims, ok := parsedToken.Claims.(jwt.MapClaims)
			require.True(t, ok, "Should extract claims")
			
			assert.Equal(t, tc.userID, claims["userId"], "userId claim should match")
			assert.Equal(t, tc.userType, claims["userType"], "userType claim should match")
			
			exp, ok := claims["exp"].(float64)
			require.True(t, ok, "exp claim should exist")
			
			expectedExpiry := time.Now().Add(AccessTokenExpiry).Unix()
			actualExpiry := int64(exp)
			
			assert.InDelta(t, expectedExpiry, actualExpiry, 5, 
				"Token expiry should be approximately 15 minutes from now")
		})
	}
}

func TestGenerateRefreshToken_ValidClaims(t *testing.T) {
	testUserID := "user-123"
	testUserType := "patient"
	
	token, err := GenerateRefreshToken(testUserID, testUserType)
	
	require.NoError(t, err, "Should not return error")
	require.NotEmpty(t, token, "Token should not be empty")
	
	parsedToken, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
		return RefreshSecret, nil
	})
	require.NoError(t, err, "Should parse token successfully")
	require.True(t, parsedToken.Valid, "Token should be valid")
	
	claims, ok := parsedToken.Claims.(jwt.MapClaims)
	require.True(t, ok, "Should extract claims")
	
	assert.Equal(t, testUserID, claims["userId"], "userId claim should match")
	assert.Equal(t, testUserType, claims["userType"], "userType claim should match")
	
	exp, ok := claims["exp"].(float64)
	require.True(t, ok, "exp claim should exist")
	
	expectedExpiry := time.Now().Add(RefreshTokenExpiry).Unix()
	actualExpiry := int64(exp)
	
	assert.InDelta(t, expectedExpiry, actualExpiry, 5, 
		"Token expiry should be approximately 7 days from now")
}

func TestValidateRefreshToken_ValidToken(t *testing.T) {
	testUserID := "user-123"
	testUserType := "doctor"
	refreshToken, err := GenerateRefreshToken(testUserID, testUserType)
	require.NoError(t, err, "Should generate token successfully")
	
	parsedToken, err := ValidateRefreshToken(refreshToken)
	
	assert.NoError(t, err, "Should validate token successfully")
	require.NotNil(t, parsedToken, "Parsed token should not be nil")
	assert.True(t, parsedToken.Valid, "Token should be valid")
	
	claims, ok := parsedToken.Claims.(jwt.MapClaims)
	require.True(t, ok, "Should extract claims")
	assert.Equal(t, testUserID, claims["userId"])
	assert.Equal(t, testUserType, claims["userType"])
}

func TestValidateRefreshToken_ExpiredToken(t *testing.T) {
	expirationTime := time.Now().Add(-1 * time.Hour)
	
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userId":   "user-123",
		"userType": "doctor",
		"exp":      expirationTime.Unix(),
	})
	
	expiredToken, err := token.SignedString(RefreshSecret)
	require.NoError(t, err, "Should create expired token")
	
	parsedToken, err := ValidateRefreshToken(expiredToken)
	
	assert.Error(t, err, "Should return error for expired token")
	assert.Contains(t, err.Error(), "expired", "Error should mention expiration")
	
	if parsedToken != nil {
		assert.False(t, parsedToken.Valid, "Token should not be valid")
	}
}

func TestValidateRefreshToken_InvalidSignature(t *testing.T) {
	wrongSecret := []byte("wrong-secret-key")
	
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userId":   "user-123",
		"userType": "doctor",
		"exp":      time.Now().Add(1 * time.Hour).Unix(),
	})
	
	invalidToken, err := token.SignedString(wrongSecret)
	require.NoError(t, err, "Should create token with wrong secret")
	
	parsedToken, err := ValidateRefreshToken(invalidToken)
	
	assert.Error(t, err, "Should return error for invalid signature")
	assert.Contains(t, err.Error(), "signature", "Error should mention signature")
	
	if parsedToken != nil {
		assert.False(t, parsedToken.Valid, "Token should not be valid")
	}
}

func TestValidateRefreshToken_MalformedToken(t *testing.T) {
	malformedTokens := []string{
		"",
		"not-a-jwt-token",
		"header.payload",
		"a.b.c.d",
	}
	
	for _, malformedToken := range malformedTokens {
		t.Run("Token: "+malformedToken, func(t *testing.T) {
			parsedToken, err := ValidateRefreshToken(malformedToken)

			assert.Error(t, err, "Should return error for malformed token")
			
			if parsedToken != nil {
				assert.False(t, parsedToken.Valid, "Token should not be valid")
			}
		})
	}
}

func TestGenerateTokenPair_ConsistentFormat(t *testing.T) {
	testUserID := "user-123"
	testUserType := "patient"
	
	for i := 0; i < 10; i++ {
		accessToken, refreshToken, err := GenerateTokenPair(testUserID, testUserType)
		
		require.NoError(t, err)
		
		assert.Regexp(t, `^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$`, 
			accessToken, "Access token should match JWT format")
		assert.Regexp(t, `^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$`, 
			refreshToken, "Refresh token should match JWT format")
	}
}

func BenchmarkGenerateTokenPair(b *testing.B) {
	testUserID := "user-123"
	testUserType := "doctor"
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _, _ = GenerateTokenPair(testUserID, testUserType)
	}
}

func TestGenerateAccessToken_EmptyInputs(t *testing.T) {
	testCases := []struct {
		name     string
		userID   string
		userType string
	}{
		{
			name:     "Empty userId",
			userID:   "",
			userType: "doctor",
		},
		{
			name:     "Empty userType",
			userID:   "user-123",
			userType: "",
		},
		{
			name:     "Both empty",
			userID:   "",
			userType: "",
		},
	}
	
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			token, err := GenerateAccessToken(tc.userID, tc.userType)
			
			assert.NoError(t, err, "Should generate token even with empty inputs")
			assert.NotEmpty(t, token, "Token should be generated")
			
			parsedToken, _ := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
				return JWTSecret, nil
			})
			claims, _ := parsedToken.Claims.(jwt.MapClaims)
			assert.Equal(t, tc.userID, claims["userId"])
			assert.Equal(t, tc.userType, claims["userType"])
		})
	}
}

func TestGenerateAccessToken_SpecialCharacters(t *testing.T) {
	testCases := []struct {
		name     string
		userID   string
		userType string
	}{
		{
			name:     "SQL injection attempt",
			userID:   "1' OR '1'='1",
			userType: "doctor",
		},
		{
			name:     "Special characters",
			userID:   "user@#$%^&*()",
			userType: "patient",
		},
		{
			name:     "Unicode characters",
			userID:   "þö¿µêÀ123",
			userType: "doctor",
		},
		{
			name:     "Emoji",
			userID:   "user­ƒöÆ123",
			userType: "patient",
		},
	}
	
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			token, err := GenerateAccessToken(tc.userID, tc.userType)
			
			assert.NoError(t, err, "Should generate token with special characters")
			assert.NotEmpty(t, token, "Token should be generated")
			
			parsedToken, _ := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
				return JWTSecret, nil
			})
			claims, _ := parsedToken.Claims.(jwt.MapClaims)
			assert.Equal(t, tc.userID, claims["userId"], "Special characters should be preserved")
		})
	}
}

func TestGenerateAccessToken_VeryLongInputs(t *testing.T) {
	veryLongUserID := ""
	for i := 0; i < 1000; i++ {
		veryLongUserID += "a"
	}
	
	token, err := GenerateAccessToken(veryLongUserID, "doctor")
	
	assert.NoError(t, err, "Should handle long userId")
	assert.NotEmpty(t, token)
}

func TestTokenPair_DifferentSecrets(t *testing.T) {
	accessToken, refreshToken, err := GenerateTokenPair("user-123", "doctor")
	require.NoError(t, err)
	
	_, err = jwt.Parse(accessToken, func(token *jwt.Token) (interface{}, error) {
		return RefreshSecret, nil
	})
	assert.Error(t, err, "Access token should not validate with refresh secret")
	
	_, err = jwt.Parse(refreshToken, func(token *jwt.Token) (interface{}, error) {
		return JWTSecret, nil
	})
	assert.Error(t, err, "Refresh token should not validate with access secret")
}

func TestValidateAccessToken_ValidToken(t *testing.T) {
	testUserID := "user-789"
	testUserType := "patient"
	accessToken, err := GenerateAccessToken(testUserID, testUserType)
	require.NoError(t, err)
	
	parsedToken, err := jwt.Parse(accessToken, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return JWTSecret, nil
	})
	
	assert.NoError(t, err, "Should validate access token")
	assert.True(t, parsedToken.Valid, "Token should be valid")
	
	claims, ok := parsedToken.Claims.(jwt.MapClaims)
	require.True(t, ok)
	assert.Equal(t, testUserID, claims["userId"])
	assert.Equal(t, testUserType, claims["userType"])
}

func TestTokenClaims_ExtractionAndValidation(t *testing.T) {
	testCases := []struct {
		name     string
		userID   string
		userType string
	}{
		{"Numeric ID", "123456", "doctor"},
		{"UUID format", "550e8400-e29b-41d4-a716-446655440000", "patient"},
		{"Short ID", "1", "receptionist"},
		{"Long ID", "user-with-very-long-identifier-123456789", "doctor"},
	}
	
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			token, err := GenerateAccessToken(tc.userID, tc.userType)
			require.NoError(t, err)
			
			parsedToken, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
				return JWTSecret, nil
			})
			require.NoError(t, err)
			
			claims := parsedToken.Claims.(jwt.MapClaims)
			
			assert.Contains(t, claims, "userId", "Should have userId claim")
			assert.Contains(t, claims, "userType", "Should have userType claim")
			assert.Contains(t, claims, "exp", "Should have exp claim")
			
			assert.Equal(t, tc.userID, claims["userId"])
			assert.Equal(t, tc.userType, claims["userType"])
		})
	}
}

func TestTokenExpiry_Comprehensive(t *testing.T) {
	testCases := []struct {
		name         string
		expiryOffset time.Duration
		shouldBeValid bool
	}{
		{"Just created", 0, true},
		{"14 minutes old", -14 * time.Minute, true},
		{"Exactly 15 minutes", -15 * time.Minute, false},
		{"16 minutes old", -16 * time.Minute, false},
		{"1 hour old", -1 * time.Hour, false},
		{"Future token (clock skew)", 1 * time.Minute, true},
	}
	
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			expirationTime := time.Now().Add(AccessTokenExpiry + tc.expiryOffset)
			token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
				"userId":   "user-123",
				"userType": "doctor",
				"exp":      expirationTime.Unix(),
			})
			
			tokenString, err := token.SignedString(JWTSecret)
			require.NoError(t, err)
			
			parsedToken, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				return JWTSecret, nil
			})
			
			if tc.shouldBeValid {
				assert.NoError(t, err, "Token should be valid")
				if parsedToken != nil {
					assert.True(t, parsedToken.Valid)
				}
			} else {
				if err == nil && parsedToken != nil {
					assert.False(t, parsedToken.Valid, "Token should be invalid")
				}
			}
		})
	}
}

func TestGenerateTokenPair_Uniqueness(t *testing.T) {
	testUserID := "user-unique-test"
	testUserType := "doctor"
	
	token1Access, token1Refresh, err := GenerateTokenPair(testUserID, testUserType)
	require.NoError(t, err)
	
	time.Sleep(1 * time.Second)

	token2Access, token2Refresh, err := GenerateTokenPair(testUserID, testUserType)
	require.NoError(t, err)
	
	assert.NotEqual(t, token1Access, token2Access, "Access tokens should be unique with time difference")
	assert.NotEqual(t, token1Refresh, token2Refresh, "Refresh tokens should be unique with time difference")
	
	_, err = jwt.Parse(token1Access, func(token *jwt.Token) (interface{}, error) {
		return JWTSecret, nil
	})
	assert.NoError(t, err, "First access token should be valid")
	
	_, err = jwt.Parse(token2Access, func(token *jwt.Token) (interface{}, error) {
		return JWTSecret, nil
	})
	assert.NoError(t, err, "Second access token should be valid")
}

func TestRefreshToken_Expiry(t *testing.T) {
	testUserID := "user-456"
	testUserType := "patient"
	
	refreshToken, err := GenerateRefreshToken(testUserID, testUserType)
	require.NoError(t, err)
	
	parsedToken, err := jwt.Parse(refreshToken, func(token *jwt.Token) (interface{}, error) {
		return RefreshSecret, nil
	})
	require.NoError(t, err)
	
	claims := parsedToken.Claims.(jwt.MapClaims)
	exp, ok := claims["exp"].(float64)
	require.True(t, ok, "Should have exp claim")
	
	expectedExpiry := time.Now().Add(RefreshTokenExpiry).Unix()
	actualExpiry := int64(exp)
	
	assert.InDelta(t, expectedExpiry, actualExpiry, 5,
		"Refresh token should expire in 7 days")
}

func TestTokenSigning_MethodValidation(t *testing.T) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS512, jwt.MapClaims{
		"userId":   "user-123",
		"userType": "doctor",
		"exp":      time.Now().Add(1 * time.Hour).Unix(),
	})
	
	tokenString, err := token.SignedString(JWTSecret)
	require.NoError(t, err)
	
	parsedToken, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return JWTSecret, nil
	})
	
	assert.NoError(t, err, "HMAC method validation should pass")
	assert.True(t, parsedToken.Valid)
}

func TestTokenGeneration_ConcurrentSafety(t *testing.T) {
	const goroutines = 100
	const tokensPerGoroutine = 10
	
	results := make(chan string, goroutines*tokensPerGoroutine)
	errors := make(chan error, goroutines*tokensPerGoroutine)
	
	for i := 0; i < goroutines; i++ {
		go func(id int) {
			for j := 0; j < tokensPerGoroutine; j++ {
				token, err := GenerateAccessToken(fmt.Sprintf("user-%d-%d", id, j), "doctor")
				if err != nil {
					errors <- err
				} else {
					results <- token
				}
			}
		}(i)
	}
	
	tokens := make(map[string]bool)
	for i := 0; i < goroutines*tokensPerGoroutine; i++ {
		select {
		case token := <-results:
			tokens[token] = true
		case err := <-errors:
			t.Errorf("Error generating token: %v", err)
		}
	}
	
	assert.Len(t, tokens, goroutines*tokensPerGoroutine,
		"All concurrently generated tokens should be unique")
}

func BenchmarkValidateRefreshToken(b *testing.B) {
	testUserID := "user-123"
	testUserType := "doctor"
	refreshToken, _ := GenerateRefreshToken(testUserID, testUserType)
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = ValidateRefreshToken(refreshToken)
	}
}
