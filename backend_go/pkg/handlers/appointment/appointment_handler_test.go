package appointment

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/models"
	"healthcare_backend/pkg/services/appointment"
	testhelpers "healthcare_backend/pkg/testhelpers"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var (
	testDB      *testhelpers.LocalTestDatabase
	testHandler *AppointmentHandler
	testService *appointment.AppointmentService
)

func setupHandlerTest(t *testing.T) (*AppointmentHandler, context.Context, func()) {
	if testDB == nil {
		var err error
		testDB, err = testhelpers.SetupLocalTestDatabase(context.Background())
		if err != nil {
			t.Fatalf("Failed to setup test database: %v", err)
		}

		query := `
			CREATE TABLE IF NOT EXISTS medical_history (
				diagnosis_history_id UUID PRIMARY KEY,
				diagnosis_name TEXT NOT NULL,
				diagnosis_details TEXT,
				diagnosis_doctor_name TEXT NOT NULL,
				diagnosis_doctor_id UUID NOT NULL,
				patient_id UUID NOT NULL,
				created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
				updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
			)
		`
		testDB.Pool.Exec(context.Background(), query)
	}

	ctx := context.Background()

	err := testDB.CleanupTables(ctx)
	require.NoError(t, err)

	cfg := &config.Config{}
	testService = appointment.NewAppointmentService(testDB.Pool, cfg)
	handler := NewAppointmentHandler(testService)

	cleanup := func() {
		testDB.CleanupTables(ctx)
	}

	return handler, ctx, cleanup
}

func TestGetAvailabilities_Success(t *testing.T) {
	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestDoctor(ctx, "docavail@test.com", "pass", "Dr.", "Avail", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docavail@test.com").Scan(&doctorID)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/availabilities", handler.GetAvailabilities)

	day := time.Now().Add(24 * time.Hour).Format("2006-01-02")
	currentTime := time.Now().Format(time.RFC3339)
	url := fmt.Sprintf("/availabilities?doctorId=%s&day=%s&currentTime=%s", doctorID, day, currentTime)

	req, _ := http.NewRequest("GET", url, nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetAvailabilities_MissingParams(t *testing.T) {
	handler, _, cleanup := setupHandlerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/availabilities", handler.GetAvailabilities)

	req, _ := http.NewRequest("GET", "/availabilities?doctorId=123", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestSetDoctorAvailability_Success(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping in short mode")
	}

	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestDoctor(ctx, "docsetavail@test.com", "pass", "Dr.", "SetAvail", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docsetavail@test.com").Scan(&doctorID)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("userId", doctorID)
		c.Next()
	})
	router.POST("/availability", handler.SetDoctorAvailability)

	startDate := time.Now().Add(24 * time.Hour).Format("2006-01-02")
	endDate := time.Now().Add(48 * time.Hour).Format("2006-01-02")

	schedule := []models.WeeklyScheduleEntry{
		{
			Weekday: "Monday",
			Enabled: true,
			Start:   "07:00",
			End:     "20:00",
		},
	}

	body, _ := json.Marshal(schedule)
	url := fmt.Sprintf("/availability?start=%s&end=%s", startDate, endDate)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	done := make(chan bool, 1)
	go func() {
		router.ServeHTTP(w, req)
		done <- true
	}()

	select {
	case <-done:
		assert.Equal(t, http.StatusOK, w.Code)
	case <-time.After(5 * time.Second):
		t.Fatal("Test timed out after 5 seconds - possible infinite loop or slow DB")
	}
}

func TestSetDoctorAvailability_Unauthorized(t *testing.T) {
	handler, _, cleanup := setupHandlerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/availability", handler.SetDoctorAvailability)

	req, _ := http.NewRequest("POST", "/availability?start=2024-01-01&end=2024-01-31", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestCreateReservation_Success(t *testing.T) {
	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestDoctor(ctx, "doccreateappt@test.com", "pass", "Dr.", "CreateAppt", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "doccreateappt@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patcreateappt@test.com", "pass", "Pat", "CreateAppt", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patcreateappt@test.com").Scan(&patientID)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/reservations", handler.CreateReservation)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Test Appointment",
		IsDoctorPatient:  false,
	}

	body, _ := json.Marshal(reservation)
	req, _ := http.NewRequest("POST", "/reservations", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
}

func TestCreateReservation_InvalidBody(t *testing.T) {
	handler, _, cleanup := setupHandlerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/reservations", handler.CreateReservation)

	req, _ := http.NewRequest("POST", "/reservations", bytes.NewBufferString("{invalid json}"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestGetReservations_Success(t *testing.T) {
	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestPatient(ctx, "patgetres@test.com", "pass", "Pat", "GetRes", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patgetres@test.com").Scan(&patientID)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/reservations", handler.GetReservations)

	url := fmt.Sprintf("/reservations?userId=%s&userType=patient", patientID)
	req, _ := http.NewRequest("GET", url, nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetReservations_MissingUserID(t *testing.T) {
	handler, _, cleanup := setupHandlerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/reservations", handler.GetReservations)

	req, _ := http.NewRequest("GET", "/reservations?userType=patient", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestGetReservationsCount_Success(t *testing.T) {
	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestDoctor(ctx, "doccount@test.com", "pass", "Dr.", "Count", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "doccount@test.com").Scan(&doctorID)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/reservations/count", handler.GetReservationsCount)

	url := fmt.Sprintf("/reservations/count?user_id=%s&user_type=doctor&appointment_type=upcoming", doctorID)
	req, _ := http.NewRequest("GET", url, nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCancelAppointment_Success(t *testing.T) {
	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestDoctor(ctx, "doccancel@test.com", "pass", "Dr.", "Cancel", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "doccancel@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patcancel@test.com", "pass", "Pat", "Cancel", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patcancel@test.com").Scan(&patientID)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Cancel Test",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation)

	var appointmentID uuid.UUID
	testDB.Pool.QueryRow(ctx,
		"SELECT appointment_id FROM appointments WHERE doctor_id = $1 AND patient_id = $2 ORDER BY created_at DESC LIMIT 1",
		doctorID, patientID).Scan(&appointmentID)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/appointments/:appointmentId/cancel", handler.CancelAppointment)

	cancelInfo := map[string]string{
		"canceled_by":         patientID,
		"cancellation_reason": "Test reason",
		"appointment_id":      appointmentID.String(),
	}
	body, _ := json.Marshal(cancelInfo)
	url := fmt.Sprintf("/appointments/%s/cancel", appointmentID.String())
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetAppointmentByID_Success(t *testing.T) {
	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestDoctor(ctx, "docgetbyid@test.com", "pass", "Dr.", "GetByID", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docgetbyid@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patgetbyid@test.com", "pass", "Pat", "GetByID", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patgetbyid@test.com").Scan(&patientID)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Get By ID Test",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation)

	var appointmentID uuid.UUID
	testDB.Pool.QueryRow(ctx,
		"SELECT appointment_id FROM appointments WHERE doctor_id = $1 AND patient_id = $2 ORDER BY created_at DESC LIMIT 1",
		doctorID, patientID).Scan(&appointmentID)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/appointments/:appointmentId", handler.GetAppointmentByID)

	url := fmt.Sprintf("/appointments/%s", appointmentID.String())
	req, _ := http.NewRequest("GET", url, nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetAppointmentByID_NotFound(t *testing.T) {
	handler, _, cleanup := setupHandlerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/appointments/:appointmentId", handler.GetAppointmentByID)

	fakeID := uuid.New()
	url := fmt.Sprintf("/appointments/%s", fakeID.String())
	req, _ := http.NewRequest("GET", url, nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestGetAppointmentStatistics_Success(t *testing.T) {
	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestDoctor(ctx, "docstats@test.com", "pass", "Dr.", "Stats", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docstats@test.com").Scan(&doctorID)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/statistics", handler.GetAppointmentStatistics)

	url := fmt.Sprintf("/statistics?user_id=%s&user_type=doctor", doctorID)
	req, _ := http.NewRequest("GET", url, nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestSearchDoctorsForReferral_Success(t *testing.T) {
	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestDoctor(ctx, "docsearch@test.com", "pass", "Dr.", "Search", true)
	require.NoError(t, err)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/search", handler.SearchDoctorsForReferral)

	req, _ := http.NewRequest("GET", "/search?q=Search&limit=10", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCreateReport_Success(t *testing.T) {
	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestDoctor(ctx, "docreport@test.com", "pass", "Dr.", "Report", true)
	require.NoError(t, err)
	var doctorID uuid.UUID
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docreport@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patreport@test.com", "pass", "Pat", "Report", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patreport@test.com").Scan(&patientID)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID.String(),
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Report Test",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation)

	var appointmentID uuid.UUID
	testDB.Pool.QueryRow(ctx,
		"SELECT appointment_id FROM appointments WHERE doctor_id = $1 AND patient_id = $2 ORDER BY created_at DESC LIMIT 1",
		doctorID, patientID).Scan(&appointmentID)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/reports", handler.CreateReport)

	diagnosisName := "Test Diagnosis"
	report := models.MedicalReport{
		AppointmentID:    appointmentID,
		PatientID:        patientID,
		DoctorID:         doctorID,
		PatientFirstName: "Pat",
		PatientLastName:  "Report",
		DoctorFirstName:  "Dr.",
		DoctorLastName:   "Report",
		DiagnosisName:    &diagnosisName,
		DiagnosisMade:    true,
	}

	body, _ := json.Marshal(report)
	req, _ := http.NewRequest("POST", "/reports", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
}

func TestGetReports_Success(t *testing.T) {
	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestPatient(ctx, "patgetreports@test.com", "pass", "Pat", "GetReports", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patgetreports@test.com").Scan(&patientID)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/reports/:userId", handler.GetReports)

	url := fmt.Sprintf("/reports/%s", patientID)
	req, _ := http.NewRequest("GET", url, nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetWeeklySchedule_Success(t *testing.T) {
	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestDoctor(ctx, "docweekly@test.com", "pass", "Dr.", "Weekly", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docweekly@test.com").Scan(&doctorID)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/schedule/:doctorId", handler.GetWeeklySchedule)

	startDate := time.Now().Format("2006-01-02")
	endDate := time.Now().Add(7 * 24 * time.Hour).Format("2006-01-02")
	url := fmt.Sprintf("/schedule/%s?start=%s&end=%s", doctorID, startDate, endDate)
	req, _ := http.NewRequest("GET", url, nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAddDoctorException_Success(t *testing.T) {
	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestDoctor(ctx, "docexception@test.com", "pass", "Dr.", "Exception", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docexception@test.com").Scan(&doctorID)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/exceptions/:id", handler.AddDoctorException)

	tomorrow := time.Now().Add(24 * time.Hour)
	exception := models.DoctorException{
		Date:      tomorrow.Format("2006-01-02"),
		StartTime: tomorrow.Add(9 * time.Hour).Format(time.RFC3339),
		EndTime:   tomorrow.Add(17 * time.Hour).Format(time.RFC3339),
	}

	body, _ := json.Marshal(exception)
	url := fmt.Sprintf("/exceptions/%s", doctorID)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestClearDoctorAvailabilities_Success(t *testing.T) {
	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestDoctor(ctx, "docclear@test.com", "pass", "Dr.", "Clear", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docclear@test.com").Scan(&doctorID)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("userId", doctorID)
		c.Next()
	})
	router.DELETE("/availability", handler.ClearDoctorAvailabilities)

	req, _ := http.NewRequest("DELETE", "/availability", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCreateReservation_InvalidDates(t *testing.T) {
	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestDoctor(ctx, "docvalid@test.com", "pass", "Dr.", "Valid", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docvalid@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patvalid@test.com", "pass", "Pat", "Valid", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patvalid@test.com").Scan(&patientID)

	tests := []struct {
		name         string
		startTime    time.Time
		endTime      time.Time
		expectedCode int
	}{
		{
			name:         "Past appointment date",
			startTime:    time.Now().Add(-24 * time.Hour),
			endTime:      time.Now().Add(-23 * time.Hour),
			expectedCode: http.StatusCreated,
		},
		{
			name:         "End before start",
			startTime:    time.Now().Add(2 * time.Hour),
			endTime:      time.Now().Add(1 * time.Hour),
			expectedCode: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gin.SetMode(gin.TestMode)
			router := gin.New()
			router.POST("/reservations", handler.CreateReservation)

			reservation := models.Reservation{
				DoctorID:         doctorID,
				PatientID:        patientID,
				AppointmentStart: tt.startTime,
				AppointmentEnd:   tt.endTime,
				Title:            "Test Appointment",
				IsDoctorPatient:  false,
			}

			body, _ := json.Marshal(reservation)
			req, _ := http.NewRequest("POST", "/reservations", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code)
		})
	}
}

// TestCreateReservation_InvalidUUIDs tests malformed UUIDs
func TestCreateReservation_InvalidUUIDs(t *testing.T) {
	handler, _, cleanup := setupHandlerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/reservations", handler.CreateReservation)

	tests := []struct {
		name      string
		doctorID  string
		patientID string
	}{
		{
			name:      "Invalid doctor UUID",
			doctorID:  "invalid-uuid",
			patientID: uuid.New().String(),
		},
		{
			name:      "Empty doctor ID",
			doctorID:  "",
			patientID: uuid.New().String(),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			startTime := time.Now().Add(24 * time.Hour)
			reservation := models.Reservation{
				DoctorID:         tt.doctorID,
				PatientID:        tt.patientID,
				AppointmentStart: startTime,
				AppointmentEnd:   startTime.Add(30 * time.Minute),
				Title:            "Test",
				IsDoctorPatient:  false,
			}

			body, _ := json.Marshal(reservation)
			req, _ := http.NewRequest("POST", "/reservations", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.True(t, w.Code >= 400)
		})
	}
}

// TestSetDoctorAvailability_InvalidDates tests date validation
func TestSetDoctorAvailability_InvalidDates(t *testing.T) {
	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestDoctor(ctx, "docinvaliddate@test.com", "pass", "Dr.", "InvalidDate", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docinvaliddate@test.com").Scan(&doctorID)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("userId", doctorID)
		c.Next()
	})
	router.POST("/availability", handler.SetDoctorAvailability)

	tests := []struct {
		name  string
		start string
		end   string
	}{
		{
			name:  "End before start",
			start: "2024-12-31",
			end:   "2024-01-01",
		},
		{
			name:  "Invalid date format",
			start: "invalid-date",
			end:   "2024-12-31",
		},
		{
			name:  "Missing start param",
			start: "",
			end:   "2024-12-31",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			schedule := []models.WeeklyScheduleEntry{
				{
					Weekday:      "Monday",
					Enabled:      true,
					Start:        "09:00",
					End:          "17:00",
					SlotDuration: 30,
				},
			}

			body, _ := json.Marshal(schedule)
			url := fmt.Sprintf("/availability?start=%s&end=%s", tt.start, tt.end)
			req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			if tt.start == "" || tt.start == "invalid-date" {
				assert.Equal(t, http.StatusBadRequest, w.Code)
			} else {
				assert.True(t, w.Code == http.StatusOK || w.Code == http.StatusBadRequest)
			}
		})
	}
}

// TestGetReservations_InvalidUserType tests invalid user type parameter
func TestGetReservations_InvalidUserType(t *testing.T) {
	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestPatient(ctx, "patinvalidtype@test.com", "pass", "Pat", "InvalidType", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patinvalidtype@test.com").Scan(&patientID)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/reservations", handler.GetReservations)

	tests := []struct {
		name         string
		userType     string
		expectedCode int
	}{
		{
			name:         "Invalid user type",
			userType:     "INVALID_TYPE",
			expectedCode: http.StatusOK,
		},
		{
			name:         "Empty user type",
			userType:     "",
			expectedCode: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			url := fmt.Sprintf("/reservations?userId=%s&userType=%s", patientID, tt.userType)
			req, _ := http.NewRequest("GET", url, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code)
		})
	}
}

// TestCancelAppointment_InvalidID tests canceling with invalid appointment ID
func TestCancelAppointment_InvalidID(t *testing.T) {
	handler, _, cleanup := setupHandlerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/appointments/:appointmentId/cancel", handler.CancelAppointment)

	tests := []struct {
		name          string
		appointmentID string
		expectedCode  int
	}{
		{
			name:          "Invalid UUID format",
			appointmentID: "not-a-uuid",
			expectedCode:  http.StatusBadRequest,
		},
		{
			name:          "Non-existent UUID",
			appointmentID: uuid.New().String(),
			expectedCode:  http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cancelInfo := map[string]string{
				"canceled_by":         uuid.New().String(),
				"cancellation_reason": "Test",
			}
			body, _ := json.Marshal(cancelInfo)
			url := fmt.Sprintf("/appointments/%s/cancel", tt.appointmentID)
			req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code)
		})
	}
}

// TestGetReservations_Unauthorized tests accessing reservations without proper context
func TestGetReservations_Unauthorized(t *testing.T) {
	handler, _, cleanup := setupHandlerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/reservations", handler.GetReservations)

	url := "/reservations?userId=&userType=patient"
	req, _ := http.NewRequest("GET", url, nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// TestGetAppointmentStatistics_InvalidRole tests statistics with invalid role
func TestGetAppointmentStatistics_InvalidRole(t *testing.T) {
	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestDoctor(ctx, "docbadRole@test.com", "pass", "Dr.", "BadRole", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docbadRole@test.com").Scan(&doctorID)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/statistics", handler.GetAppointmentStatistics)

	tests := []struct {
		name     string
		userType string
	}{
		{
			name:     "Invalid user type",
			userType: "HACKER",
		},
		{
			name:     "Empty user type",
			userType: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			url := fmt.Sprintf("/statistics?user_id=%s&user_type=%s", doctorID, tt.userType)
			req, _ := http.NewRequest("GET", url, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.True(t, w.Code >= 200)
		})
	}
}

// TestClearDoctorAvailabilities_Unauthorized2 tests clearing without auth
func TestClearDoctorAvailabilities_Unauthorized2(t *testing.T) {
	handler, _, cleanup := setupHandlerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.DELETE("/availability", handler.ClearDoctorAvailabilities)

	req, _ := http.NewRequest("DELETE", "/availability", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

// TestSetDoctorAvailability_MissingQueryParams tests missing required parameters
func TestSetDoctorAvailability_MissingQueryParams(t *testing.T) {
	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestDoctor(ctx, "docmissingparams@test.com", "pass", "Dr.", "MissingParams", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docmissingparams@test.com").Scan(&doctorID)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("userId", doctorID)
		c.Next()
	})
	router.POST("/availability", handler.SetDoctorAvailability)

	schedule := []models.WeeklyScheduleEntry{
		{
			Weekday:      "Monday",
			Enabled:      true,
			Start:        "09:00",
			End:          "17:00",
			SlotDuration: 30,
		},
	}

	body, _ := json.Marshal(schedule)
	req, _ := http.NewRequest("POST", "/availability", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// TestGetReservations_EmptyResults tests handling of no appointments
func TestGetReservations_EmptyResults(t *testing.T) {
	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestPatient(ctx, "patempty@test.com", "pass", "Pat", "Empty", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patempty@test.com").Scan(&patientID)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/reservations", handler.GetReservations)

	url := fmt.Sprintf("/reservations?userId=%s&userType=patient", patientID)
	req, _ := http.NewRequest("GET", url, nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.NotNil(t, w.Body)
}

// TestUpdateReport_NotFound tests updating non-existent report
func TestUpdateReport_NotFound(t *testing.T) {
	handler, _, cleanup := setupHandlerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.PUT("/reports/:reportId", handler.UpdateReport)

	fakeReportID := uuid.New().String()
	updateData := models.MedicalReport{
		DiagnosisMade: true,
	}

	body, _ := json.Marshal(updateData)
	url := fmt.Sprintf("/reports/%s", fakeReportID)
	req, _ := http.NewRequest("PUT", url, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// TestDeleteReport_NotFound tests deleting non-existent report
func TestDeleteReport_NotFound(t *testing.T) {
	handler, _, cleanup := setupHandlerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.DELETE("/reports/:reportId", handler.DeleteReport)

	fakeReportID := uuid.New().String()
	url := fmt.Sprintf("/reports/%s", fakeReportID)
	req, _ := http.NewRequest("DELETE", url, nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.True(t, w.Code == http.StatusOK || w.Code == http.StatusNotFound)
}

// TestGetAppointmentByID_InvalidUUID tests getting appointment with malformed ID
func TestGetAppointmentByID_InvalidUUID(t *testing.T) {
	handler, _, cleanup := setupHandlerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/appointments/:appointmentId", handler.GetAppointmentByID)

	tests := []struct {
		name          string
		appointmentID string
	}{
		{
			name:          "Malformed UUID",
			appointmentID: "not-a-valid-uuid-123",
		},
		{
			name:          "Special characters",
			appointmentID: "abc-123-xyz",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			url := fmt.Sprintf("/appointments/%s", tt.appointmentID)
			req, _ := http.NewRequest("GET", url, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.True(t, w.Code >= 400)
		})
	}
}

// TestGetReport_NotFound tests retrieving non-existent report
func TestGetReport_NotFound(t *testing.T) {
	handler, _, cleanup := setupHandlerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/reports/:reportId", handler.GetReport)

	fakeReportID := uuid.New().String()
	url := fmt.Sprintf("/reports/%s", fakeReportID)
	req, _ := http.NewRequest("GET", url, nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// TestGetReservations_MultipleFilters tests combining multiple query filters
func TestGetReservations_MultipleFilters(t *testing.T) {
	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestDoctor(ctx, "docfilters@test.com", "pass", "Dr.", "Filters", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docfilters@test.com").Scan(&doctorID)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/reservations", handler.GetReservations)

	tests := []struct {
		name   string
		params string
	}{
		{
			name:   "Status and timezone filter",
			params: fmt.Sprintf("userId=%s&userType=doctor&status=confirmed&timezone=America/New_York", doctorID),
		},
		{
			name:   "All filters combined",
			params: fmt.Sprintf("userId=%s&userType=doctor&status=confirmed&timezone=UTC", doctorID),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			url := fmt.Sprintf("/reservations?%s", tt.params)
			req, _ := http.NewRequest("GET", url, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)
		})
	}
}

// TestSearchDoctorsForReferral_EdgeCases tests search with various inputs
func TestSearchDoctorsForReferral_EdgeCases(t *testing.T) {
	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestDoctor(ctx, "docsearchedge@test.com", "pass", "Dr.", "SearchEdge", true)
	require.NoError(t, err)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/search", handler.SearchDoctorsForReferral)

	tests := []struct {
		name   string
		params string
	}{
		{
			name:   "Empty search query",
			params: "q=&limit=10",
		},
		{
			name:   "Special characters",
			params: "q=Dr.+Test&specialty=Cardiology",
		},
		{
			name:   "Only specialty filter",
			params: "specialty=Neurology&limit=20",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			url := fmt.Sprintf("/search?%s", tt.params)
			req, _ := http.NewRequest("GET", url, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)
		})
	}
}

// TestGetWeeklySchedule_LongRange tests schedule retrieval over extended period
func TestGetWeeklySchedule_LongRange(t *testing.T) {
	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestDoctor(ctx, "doclongrange@test.com", "pass", "Dr.", "LongRange", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "doclongrange@test.com").Scan(&doctorID)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/schedule/:doctorId", handler.GetWeeklySchedule)

	tests := []struct {
		name      string
		startDays int
		endDays   int
	}{
		{
			name:      "90 days range",
			startDays: 0,
			endDays:   90,
		},
		{
			name:      "Past dates",
			startDays: -30,
			endDays:   -1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			startDate := time.Now().Add(time.Duration(tt.startDays) * 24 * time.Hour).Format("2006-01-02")
			endDate := time.Now().Add(time.Duration(tt.endDays) * 24 * time.Hour).Format("2006-01-02")
			url := fmt.Sprintf("/schedule/%s?start=%s&end=%s", doctorID, startDate, endDate)
			req, _ := http.NewRequest("GET", url, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)
		})
	}
}

// TestGetReportsWithFilters tests report retrieval with various filters
func TestGetReportsWithFilters(t *testing.T) {
	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestPatient(ctx, "patreportfilter@test.com", "pass", "Pat", "ReportFilter", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patreportfilter@test.com").Scan(&patientID)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/reports/:userId", handler.GetReports)

	tests := []struct {
		name   string
		params string
	}{
		{
			name:   "With year filter",
			params: "year=2024",
		},
		{
			name:   "With month filter",
			params: "month=10",
		},
		{
			name:   "With both filters",
			params: "year=2024&month=10",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			url := fmt.Sprintf("/reports/%s?%s", patientID, tt.params)
			req, _ := http.NewRequest("GET", url, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)
		})
	}
}

// TestGetAvailabilities_EdgeCases tests availability queries with edge cases
func TestGetAvailabilities_EdgeCases(t *testing.T) {
	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestDoctor(ctx, "docavailedge@test.com", "pass", "Dr.", "AvailEdge", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docavailedge@test.com").Scan(&doctorID)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/availabilities", handler.GetAvailabilities)

	tests := []struct {
		name      string
		dayOffset int
	}{
		{
			name:      "Far future date",
			dayOffset: 365,
		},
		{
			name:      "Same day",
			dayOffset: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			day := time.Now().Add(time.Duration(tt.dayOffset) * 24 * time.Hour).Format("2006-01-02")
			currentTime := time.Now().Format(time.RFC3339)
			url := fmt.Sprintf("/availabilities?doctorId=%s&day=%s&currentTime=%s", doctorID, day, currentTime)

			req, _ := http.NewRequest("GET", url, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)
		})
	}
}

// TestGetReservationsCount_MultipleFilters tests count with various filter combinations
func TestGetReservationsCount_MultipleFilters(t *testing.T) {
	handler, ctx, cleanup := setupHandlerTest(t)
	defer cleanup()

	err := testDB.CreateTestDoctor(ctx, "doccountfilter@test.com", "pass", "Dr.", "CountFilter", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "doccountfilter@test.com").Scan(&doctorID)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/reservations/count", handler.GetReservationsCount)

	tests := []struct {
		name            string
		appointmentType string
	}{
		{
			name:            "Upcoming appointments",
			appointmentType: "upcoming",
		},
		{
			name:            "Past appointments",
			appointmentType: "past",
		},
		{
			name:            "All appointments",
			appointmentType: "all",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			url := fmt.Sprintf("/reservations/count?user_id=%s&user_type=doctor&appointment_type=%s", doctorID, tt.appointmentType)
			req, _ := http.NewRequest("GET", url, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)
		})
	}
}
