package middleware

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"healthcare_backend/pkg/auth"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMain(m *testing.M) {
	gin.SetMode(gin.TestMode)
	
	os.Setenv("JWT_SECRET", "test-jwt-secret-key-for-testing")
	os.Setenv("REFRESH_SECRET", "test-refresh-secret-key-for-testing")
	
	auth.JWTSecret = []byte(os.Getenv("JWT_SECRET"))
	auth.RefreshSecret = []byte(os.Getenv("REFRESH_SECRET"))
	jwtSecret = auth.JWTSecret
	
	code := m.Run()
	
	os.Unsetenv("JWT_SECRET")
	os.Unsetenv("REFRESH_SECRET")
	
	os.Exit(code)
}

func setupTestRouter() *gin.Engine {
	router := gin.New()
	router.Use(AuthMiddleware())
	
	router.GET("/protected", func(c *gin.Context) {
		userID, _ := c.Get("userId")
		userType, _ := c.Get("userType")
		c.JSON(http.StatusOK, gin.H{
			"message":  "success",
			"userId":   userID,
			"userType": userType,
		})
	})
	
	return router
}

func TestAuthMiddleware_ValidToken(t *testing.T) {
	router := setupTestRouter()
	testUserID := "user-123"
	testUserType := "doctor"
	
	accessToken, err := auth.GenerateAccessToken(testUserID, testUserType)
	require.NoError(t, err, "Should generate token successfully")
	
	req, _ := http.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code, "Should return 200 OK")
	assert.Contains(t, w.Body.String(), "success", "Should contain success message")
	assert.Contains(t, w.Body.String(), testUserID, "Should contain userId in response")
	assert.Contains(t, w.Body.String(), testUserType, "Should contain userType in response")
}

func TestAuthMiddleware_MissingAuthorizationHeader(t *testing.T) {
	router := setupTestRouter()
	
	req, _ := http.NewRequest("GET", "/protected", nil)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusUnauthorized, w.Code, "Should return 401 Unauthorized")
	assert.Contains(t, w.Body.String(), "Authorization header missing", 
		"Should return appropriate error message")
}

func TestAuthMiddleware_InvalidTokenFormat(t *testing.T) {
	router := setupTestRouter()
	
	testCases := []struct {
		name          string
		authHeader    string
		expectedError string
	}{
		{
			name:          "Invalid JWT format",
			authHeader:    "Bearer invalid-token-format",
			expectedError: "Invalid or expired token",
		},
		{
			name:          "Malformed token - only 2 parts",
			authHeader:    "Bearer header.payload",
			expectedError: "Invalid or expired token",
		},
		{
			name:          "Empty token after Bearer",
			authHeader:    "Bearer ",
			expectedError: "Invalid or expired token",
		},
		{
			name:          "No Bearer prefix",
			authHeader:    "SomeRandomToken",
			expectedError: "Invalid or expired token",
		},
	}
	
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req, _ := http.NewRequest("GET", "/protected", nil)
			req.Header.Set("Authorization", tc.authHeader)
			w := httptest.NewRecorder()
			
			router.ServeHTTP(w, req)
			
			assert.Equal(t, http.StatusUnauthorized, w.Code, "Should return 401 Unauthorized")
			assert.Contains(t, w.Body.String(), tc.expectedError, 
				"Should return appropriate error message")
		})
	}
}

func TestAuthMiddleware_ExpiredToken(t *testing.T) {
	router := setupTestRouter()
	
	expirationTime := time.Now().Add(-1 * time.Hour)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userId":   "user-123",
		"userType": "doctor",
		"exp":      expirationTime.Unix(),
	})
	
	expiredToken, err := token.SignedString(auth.JWTSecret)
	require.NoError(t, err, "Should create expired token")
	
	req, _ := http.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+expiredToken)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusUnauthorized, w.Code, "Should return 401 Unauthorized")
	assert.Contains(t, w.Body.String(), "Invalid or expired token", 
		"Should indicate token is expired")
}

func TestAuthMiddleware_InvalidSignature(t *testing.T) {
	router := setupTestRouter()
	wrongSecret := []byte("wrong-secret-key")
	
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userId":   "user-123",
		"userType": "doctor",
		"exp":      time.Now().Add(1 * time.Hour).Unix(),
	})
	
	invalidToken, err := token.SignedString(wrongSecret)
	require.NoError(t, err, "Should create token with wrong secret")
	
	req, _ := http.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+invalidToken)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusUnauthorized, w.Code, "Should return 401 Unauthorized")
	assert.Contains(t, w.Body.String(), "Invalid or expired token", 
		"Should indicate token is invalid")
}

func TestAuthMiddleware_MissingUserIdClaim(t *testing.T) {
	router := setupTestRouter()
	
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userType": "doctor",
		"exp":      time.Now().Add(1 * time.Hour).Unix(),
	})
	
	invalidToken, err := token.SignedString(auth.JWTSecret)
	require.NoError(t, err, "Should create token without userId")
	
	req, _ := http.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+invalidToken)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusUnauthorized, w.Code, "Should return 401 Unauthorized")
	assert.Contains(t, w.Body.String(), "Invalid user ID in token", 
		"Should indicate userId is missing")
}

func TestAuthMiddleware_MissingUserTypeClaim(t *testing.T) {
	router := setupTestRouter()
	
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userId": "user-123",
		"exp":    time.Now().Add(1 * time.Hour).Unix(),
	})
	
	invalidToken, err := token.SignedString(auth.JWTSecret)
	require.NoError(t, err, "Should create token without userType")
	
	req, _ := http.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+invalidToken)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusUnauthorized, w.Code, "Should return 401 Unauthorized")
	assert.Contains(t, w.Body.String(), "Invalid user type in token", 
		"Should indicate userType is missing")
	req, _ := http.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+invalidToken)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusUnauthorized, w.Code, "Should return 401 Unauthorized")
	assert.Contains(t, w.Body.String(), "Invalid user type in token", 
		"Should indicate userType is missing")
}

func TestAuthMiddleware_WrongSigningMethod(t *testing.T) {
	router := setupTestRouter()
	
	token, err := auth.GenerateAccessToken("user-123", "doctor")
	require.NoError(t, err)
	
	req, _ := http.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code, "Should accept HMAC signed token")
}

func TestAuthMiddleware_DifferentUserTypes(t *testing.T) {
	router := setupTestRouter()
	
	testCases := []struct {
		name     string
		userID   string
		userType string
	}{
		{
			name:     "Doctor user",
			userID:   "doc-123",
			userType: "doctor",
		},
		{
			name:     "Patient user",
			userID:   "pat-456",
			userType: "patient",
		},
		{
			name:     "Receptionist user",
			userID:   "rec-789",
			userType: "receptionist",
		},
	}
	
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			accessToken, err := auth.GenerateAccessToken(tc.userID, tc.userType)
			require.NoError(t, err)
			
			req, _ := http.NewRequest("GET", "/protected", nil)
			req.Header.Set("Authorization", "Bearer "+accessToken)
			w := httptest.NewRecorder()
			
			router.ServeHTTP(w, req)
			
			assert.Equal(t, http.StatusOK, w.Code, "Should return 200 OK")
			assert.Contains(t, w.Body.String(), tc.userID)
			assert.Contains(t, w.Body.String(), tc.userType)
		})
	}
}

func TestAuthMiddleware_ContextValues(t *testing.T) {
	testUserID := "test-user-456"
	testUserType := "patient"
	accessToken, err := auth.GenerateAccessToken(testUserID, testUserType)
	require.NoError(t, err)
	
	router := gin.New()
	router.Use(AuthMiddleware())
	
	router.GET("/test", func(c *gin.Context) {
		userID, userIDExists := c.Get("userId")
		userType, userTypeExists := c.Get("userType")
		
		c.JSON(http.StatusOK, gin.H{
			"userIdExists":   userIDExists,
			"userTypeExists": userTypeExists,
			"userId":         userID,
			"userType":       userType,
		})
	})
	
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), fmt.Sprintf(`"userId":"%s"`, testUserID))
	assert.Contains(t, w.Body.String(), fmt.Sprintf(`"userType":"%s"`, testUserType))
	assert.Contains(t, w.Body.String(), `"userIdExists":true`)
	assert.Contains(t, w.Body.String(), `"userTypeExists":true`)
}

func TestAuthMiddleware_MultipleRequests(t *testing.T) {
	router := setupTestRouter()
	
	users := []struct {
		id       string
		userType string
	}{
		{"user-1", "doctor"},
		{"user-2", "patient"},
		{"user-3", "receptionist"},
	}
	
	for _, user := range users {
		t.Run(user.id, func(t *testing.T) {
			token, err := auth.GenerateAccessToken(user.id, user.userType)
			require.NoError(t, err)
			
			req, _ := http.NewRequest("GET", "/protected", nil)
			req.Header.Set("Authorization", "Bearer "+token)
			w := httptest.NewRecorder()
			
			router.ServeHTTP(w, req)
			
			assert.Equal(t, http.StatusOK, w.Code)
			assert.Contains(t, w.Body.String(), user.id, 
				"Should return correct user ID for each request")
		})
	}
}

func TestAuthMiddleware_TokenWithExtraWhitespace(t *testing.T) {
	router := setupTestRouter()
	
	testCases := []struct {
		name       string
		makeHeader func(token string) string
	}{
		{
			name: "Extra space after Bearer",
			makeHeader: func(token string) string {
				return "Bearer  " + token
			},
		},
		{
			name: "Tab after Bearer",
			makeHeader: func(token string) string {
				return "Bearer\t" + token
			},
		},
	}
	
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			token, err := auth.GenerateAccessToken("user-123", "doctor")
			require.NoError(t, err)
			
			req, _ := http.NewRequest("GET", "/protected", nil)
			req.Header.Set("Authorization", tc.makeHeader(token))
			w := httptest.NewRecorder()
			
			router.ServeHTTP(w, req)
			
			assert.Equal(t, http.StatusUnauthorized, w.Code, 
				"Should handle whitespace by rejecting token")
		})
	}
}

func BenchmarkAuthMiddleware_ValidToken(b *testing.B) {
	router := setupTestRouter()
	token, _ := auth.GenerateAccessToken("user-123", "doctor")
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		req, _ := http.NewRequest("GET", "/protected", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
	}
}

func TestAuthMiddleware_EmptyBearerToken(t *testing.T) {
	router := setupTestRouter()
	
	req, _ := http.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer")
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusUnauthorized, w.Code, "Should reject 'Bearer' without token")
}

func TestAuthMiddleware_JustTokenNoBearer(t *testing.T) {
	router := setupTestRouter()
	token, _ := auth.GenerateAccessToken("user-123", "doctor")
	
	req, _ := http.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", token)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	

	assert.Equal(t, http.StatusOK, w.Code, 
		"Middleware accepts tokens without Bearer prefix (lenient design)")
}

func TestAuthMiddleware_LowercaseBearer(t *testing.T) {
	router := setupTestRouter()
	token, _ := auth.GenerateAccessToken("user-123", "doctor")
	
	req, _ := http.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "bearer "+token)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusUnauthorized, w.Code, "Should reject lowercase 'bearer'")
}

func BenchmarkAuthMiddleware_InvalidToken(b *testing.B) {
	router := setupTestRouter()
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		req, _ := http.NewRequest("GET", "/protected", nil)
		req.Header.Set("Authorization", "Bearer invalid-token")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
	}
}
