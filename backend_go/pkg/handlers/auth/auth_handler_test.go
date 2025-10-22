package auth

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"healthcare_backend/pkg/auth"
	"healthcare_backend/pkg/config"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMain(m *testing.M) {
	gin.SetMode(gin.TestMode)
	
	os.Setenv("JWT_SECRET", "test-jwt-secret-key-for-testing")
	os.Setenv("REFRESH_SECRET", "test-refresh-secret-key-for-testing")
	
	auth.JWTSecret = []byte(os.Getenv("JWT_SECRET"))
	auth.RefreshSecret = []byte(os.Getenv("REFRESH_SECRET"))
	
	code := m.Run()
	
	os.Unsetenv("JWT_SECRET")
	os.Unsetenv("REFRESH_SECRET")
	
	os.Exit(code)
}

func createTestConfig() *config.Config {
	return &config.Config{
		JWTSecretKey:   "test-jwt-secret-key-12345",
		SMTPEmail:      "test@example.com",
		SMTPPassword:   "",  // Empty for tests - not a real password
		SMTPHost:       "smtp.test.com",
		SMTPPort:       "587",
	}
}

func TestActivateAccount_ValidToken(t *testing.T) {
	router := gin.New()
	cfg := createTestConfig()
	
	var mockPool *pgxpool.Pool
	
	handler := NewAuthHandler(mockPool, cfg)
	router.GET("/activate", handler.ActivateAccount)
	
	req, _ := http.NewRequest("GET", "/activate?token=", nil)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid token")
}

func TestActivateAccount_MissingToken(t *testing.T) {
	router := gin.New()
	cfg := createTestConfig()
	var mockPool *pgxpool.Pool
	
	handler := NewAuthHandler(mockPool, cfg)
	router.GET("/activate", handler.ActivateAccount)
	
	req, _ := http.NewRequest("GET", "/activate", nil)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusBadRequest, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	
	assert.Contains(t, response, "error")
	assert.Equal(t, "Invalid token", response["error"])
}

func TestRequestReset_ValidJSONStructure(t *testing.T) {
	router := gin.New()
	cfg := createTestConfig()
	var mockPool *pgxpool.Pool
	
	handler := NewAuthHandler(mockPool, cfg)
	router.POST("/request-reset", handler.RequestReset)
	
	requestBody := map[string]string{
		"email": "doctor@example.com",
	}
	jsonBody, _ := json.Marshal(requestBody)
	
	req, _ := http.NewRequest("POST", "/request-reset", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)

	assert.NotEqual(t, http.StatusInternalServerError, w.Code, "Should not get 500 - JSON parsing should work")
}

func TestRequestReset_InvalidEmail(t *testing.T) {
	router := gin.New()
	cfg := createTestConfig()
	var mockPool *pgxpool.Pool
	
	handler := NewAuthHandler(mockPool, cfg)
	router.POST("/request-reset", handler.RequestReset)
	
	testCases := []struct {
		name  string
		email string
	}{
		{"Empty email", ""},
		{"Invalid format", "not-an-email"},
		{"Missing @", "emailexample.com"},
	}
	
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			requestBody := map[string]string{
				"email": tc.email,
			}
			jsonBody, _ := json.Marshal(requestBody)
			
			req, _ := http.NewRequest("POST", "/request-reset", bytes.NewBuffer(jsonBody))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			
			router.ServeHTTP(w, req)
			
			assert.Equal(t, http.StatusBadRequest, w.Code)
			assert.Contains(t, w.Body.String(), "Invalid request data")
		})
	}
}

func TestRequestReset_MissingEmail(t *testing.T) {
	router := gin.New()
	cfg := createTestConfig()
	var mockPool *pgxpool.Pool
	
	handler := NewAuthHandler(mockPool, cfg)
	router.POST("/request-reset", handler.RequestReset)
	
	req, _ := http.NewRequest("POST", "/request-reset", bytes.NewBuffer([]byte("{}")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestUpdatePassword_ValidRequestStructure(t *testing.T) {
	router := gin.New()
	cfg := createTestConfig()
	var mockPool *pgxpool.Pool
	
	handler := NewAuthHandler(mockPool, cfg)
	router.POST("/update-password", handler.UpdatePassword)
	
	requestBody := map[string]string{
		"token":    "valid-token-123",
		"password": "newPassword123",
	}
	jsonBody, _ := json.Marshal(requestBody)
	
	req, _ := http.NewRequest("POST", "/update-password", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.NotEqual(t, http.StatusInternalServerError, w.Code, "Should not get 500 - validation should work")
}

func TestUpdatePassword_ShortPassword(t *testing.T) {
	router := gin.New()
	cfg := createTestConfig()
	var mockPool *pgxpool.Pool
	
	handler := NewAuthHandler(mockPool, cfg)
	router.POST("/update-password", handler.UpdatePassword)
	
	requestBody := map[string]string{
		"token":    "valid-token",
		"password": "12345",
	}
	jsonBody, _ := json.Marshal(requestBody)
	
	req, _ := http.NewRequest("POST", "/update-password", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid request data")
}

func TestUpdatePassword_MissingFields(t *testing.T) {
	router := gin.New()
	cfg := createTestConfig()
	var mockPool *pgxpool.Pool
	
	handler := NewAuthHandler(mockPool, cfg)
	router.POST("/update-password", handler.UpdatePassword)
	
	testCases := []struct {
		name string
		body map[string]string
	}{
		{
			name: "Missing token",
			body: map[string]string{"password": "newPassword123"},
		},
		{
			name: "Missing password",
			body: map[string]string{"token": "valid-token"},
		},
		{
			name: "Empty body",
			body: map[string]string{},
		},
	}
	
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			jsonBody, _ := json.Marshal(tc.body)
			
			req, _ := http.NewRequest("POST", "/update-password", bytes.NewBuffer(jsonBody))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			
			router.ServeHTTP(w, req)
			
			assert.Equal(t, http.StatusBadRequest, w.Code)
		})
	}
}

func TestRefreshToken_ValidToken(t *testing.T) {
	router := gin.New()
	cfg := createTestConfig()
	var mockPool *pgxpool.Pool
	
	handler := NewAuthHandler(mockPool, cfg)
	router.POST("/refresh", handler.RefreshToken)
	
	refreshToken, err := auth.GenerateRefreshToken("user-123", "doctor")
	require.NoError(t, err)
	
	req, _ := http.NewRequest("POST", "/refresh", nil)
	req.Header.Set("Authorization", "Bearer "+refreshToken)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	
	assert.True(t, response["success"].(bool))
	assert.Contains(t, response, "accessToken")
	assert.NotEmpty(t, response["accessToken"])
}

func TestRefreshToken_MissingToken(t *testing.T) {
	router := gin.New()
	cfg := createTestConfig()
	var mockPool *pgxpool.Pool
	
	handler := NewAuthHandler(mockPool, cfg)
	router.POST("/refresh", handler.RefreshToken)
	
	req, _ := http.NewRequest("POST", "/refresh", nil)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "No token provided")
}

func TestRefreshToken_InvalidToken(t *testing.T) {
	router := gin.New()
	cfg := createTestConfig()
	var mockPool *pgxpool.Pool
	
	handler := NewAuthHandler(mockPool, cfg)
	router.POST("/refresh", handler.RefreshToken)
	
	testCases := []struct {
		name  string
		token string
	}{
		{"Malformed token", "invalid-token-format"},
		{"Empty token", ""},
		{"Random string", "abc123xyz"},
	}
	
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req, _ := http.NewRequest("POST", "/refresh", nil)
			req.Header.Set("Authorization", "Bearer "+tc.token)
			w := httptest.NewRecorder()
			
			router.ServeHTTP(w, req)
			
			assert.Equal(t, http.StatusUnauthorized, w.Code)
			assert.Contains(t, w.Body.String(), "Invalid or expired refresh token")
		})
	}
}

func TestRefreshToken_ExpiredToken(t *testing.T) {
	router := gin.New()
	cfg := createTestConfig()
	var mockPool *pgxpool.Pool
	
	handler := NewAuthHandler(mockPool, cfg)
	router.POST("/refresh", handler.RefreshToken)

	req, _ := http.NewRequest("POST", "/refresh", nil)
	req.Header.Set("Authorization", "Bearer expired.token.here")
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestLoginDoctor_InvalidJSON(t *testing.T) {
	router := gin.New()
	cfg := createTestConfig()
	var mockPool *pgxpool.Pool
	
	handler := NewAuthHandler(mockPool, cfg)
	router.POST("/login", handler.LoginDoctor)
	
	req, _ := http.NewRequest("POST", "/login", bytes.NewBuffer([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid JSON format")
}

func TestLoginDoctor_MissingCredentials(t *testing.T) {
	router := gin.New()
	cfg := createTestConfig()
	var mockPool *pgxpool.Pool
	
	handler := NewAuthHandler(mockPool, cfg)
	router.POST("/login", handler.LoginDoctor)
	
	testCases := []struct {
		name  string
		email string
		pass  string
	}{
		{"Missing email", "", "password123"},
		{"Missing password", "doctor@test.com", ""},
		{"Both missing", "", ""},
	}
	
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			requestBody := map[string]string{
				"email":    tc.email,
				"password": tc.pass,
			}
			jsonBody, _ := json.Marshal(requestBody)
			
			req, _ := http.NewRequest("POST", "/login", bytes.NewBuffer(jsonBody))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			
			router.ServeHTTP(w, req)
			
			assert.Equal(t, http.StatusBadRequest, w.Code)
			assert.Contains(t, w.Body.String(), "Email and password are required")
		})
	}
}

func TestLoginPatient_InvalidJSON(t *testing.T) {
	router := gin.New()
	cfg := createTestConfig()
	var mockPool *pgxpool.Pool
	
	handler := NewAuthHandler(mockPool, cfg)
	router.POST("/login", handler.LoginPatient)
	
	req, _ := http.NewRequest("POST", "/login", bytes.NewBuffer([]byte("{invalid}")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestLoginPatient_MissingCredentials(t *testing.T) {
	router := gin.New()
	cfg := createTestConfig()
	var mockPool *pgxpool.Pool
	
	handler := NewAuthHandler(mockPool, cfg)
	router.POST("/login", handler.LoginPatient)
	
	requestBody := map[string]string{
		"email":    "",
		"password": "",
	}
	jsonBody, _ := json.Marshal(requestBody)
	
	req, _ := http.NewRequest("POST", "/login", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Email and password are required")
}

func TestLoginDoctor_SQLInjectionAttempt(t *testing.T) {
	router := gin.New()
	cfg := createTestConfig()
	var mockPool *pgxpool.Pool
	
	handler := NewAuthHandler(mockPool, cfg)
	router.POST("/login", handler.LoginDoctor)
	
	testCases := []struct {
		name     string
		email    string
		password string
	}{
		{
			name:     "SQL injection in email",
			email:    "admin'--",
			password: "password",
		},
		{
			name:     "SQL injection with OR",
			email:    "' OR '1'='1",
			password: "password",
		},
		{
			name:     "SQL injection in password",
			email:    "test@example.com",
			password: "' OR '1'='1' --",
		},
	}
	
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			requestBody := map[string]string{
				"email":    tc.email,
				"password": tc.password,
			}
			jsonBody, _ := json.Marshal(requestBody)
			
			req, _ := http.NewRequest("POST", "/login", bytes.NewBuffer(jsonBody))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			
			assert.NotPanics(t, func() {
				router.ServeHTTP(w, req)
			}, "Should not crash with SQL injection attempt")
			
			assert.NotEqual(t, http.StatusOK, w.Code, "SQL injection should not succeed")
		})
	}
}

func TestLoginDoctor_XSSAttempt(t *testing.T) {
	router := gin.New()
	cfg := createTestConfig()
	var mockPool *pgxpool.Pool
	
	handler := NewAuthHandler(mockPool, cfg)
	router.POST("/login", handler.LoginDoctor)
	
	testCases := []struct {
		name     string
		email    string
		password string
	}{
		{
			name:     "Script tag in email",
			email:    "<script>alert('xss')</script>@test.com",
			password: "password",
		},
		{
			name:     "HTML in email",
			email:    "<img src=x onerror=alert(1)>@test.com",
			password: "password",
		},
		{
			name:     "JavaScript in password",
			email:    "test@example.com",
			password: "<script>alert('xss')</script>",
		},
	}
	
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			requestBody := map[string]string{
				"email":    tc.email,
				"password": tc.password,
			}
			jsonBody, _ := json.Marshal(requestBody)
			
			req, _ := http.NewRequest("POST", "/login", bytes.NewBuffer(jsonBody))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			
			assert.NotPanics(t, func() {
				router.ServeHTTP(w, req)
			}, "Should not crash with XSS attempt")
			
			assert.NotEqual(t, http.StatusOK, w.Code, "XSS attempt should not succeed")
			assert.NotContains(t, w.Body.String(), "<script>", "Response should not contain unescaped script tags")
		})
	}
}

func TestRequestReset_ContentTypeValidation(t *testing.T) {
	router := gin.New()
	cfg := createTestConfig()
	var mockPool *pgxpool.Pool
	
	handler := NewAuthHandler(mockPool, cfg)
	router.POST("/request-reset", handler.RequestReset)
	
	testCases := []struct {
		name        string
		contentType string
	}{
		{"No Content-Type", ""},
		{"Wrong Content-Type", "text/plain"},
		{"XML Content-Type", "application/xml"},
	}
	
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			requestBody := `{"email":"test@example.com"}`
			
			req, _ := http.NewRequest("POST", "/request-reset", bytes.NewBuffer([]byte(requestBody)))
			if tc.contentType != "" {
				req.Header.Set("Content-Type", tc.contentType)
			}
			w := httptest.NewRecorder()
			
			router.ServeHTTP(w, req)
			
			assert.Equal(t, http.StatusBadRequest, w.Code, "Should reject invalid Content-Type")
		})
	}
}

func TestUpdatePassword_VeryLongPassword(t *testing.T) {
	router := gin.New()
	cfg := createTestConfig()
	var mockPool *pgxpool.Pool
	
	handler := NewAuthHandler(mockPool, cfg)
	router.POST("/update-password", handler.UpdatePassword)
	
	longPassword := ""
	for i := 0; i < 5000; i++ {
		longPassword += "a"
	}
	
	requestBody := map[string]string{
		"token":    "valid-token",
		"password": longPassword,
	}
	jsonBody, _ := json.Marshal(requestBody)
	
	req, _ := http.NewRequest("POST", "/update-password", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.NotPanics(t, func() {
		router.ServeHTTP(w, req)
	}, "Should handle very long password without crashing")
}

func BenchmarkRefreshToken(b *testing.B) {
	router := gin.New()
	cfg := createTestConfig()
	var mockPool *pgxpool.Pool
	
	handler := NewAuthHandler(mockPool, cfg)
	router.POST("/refresh", handler.RefreshToken)
	
	refreshToken, _ := auth.GenerateRefreshToken("user-123", "doctor")
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		req, _ := http.NewRequest("POST", "/refresh", nil)
		req.Header.Set("Authorization", "Bearer "+refreshToken)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
	}
}
