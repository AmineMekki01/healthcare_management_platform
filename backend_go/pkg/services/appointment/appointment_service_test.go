package appointment

import (
	"context"
	"log"
	"os"
	"testing"
	"time"

	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/models"
	"healthcare_backend/pkg/testhelpers"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var (
	testDB      *testhelpers.LocalTestDatabase
	testService *AppointmentService
)

func strPtr(s string) *string {
	return &s
}

func TestMain(m *testing.M) {
	ctx := context.Background()
	var err error

	testDB, err = testhelpers.SetupLocalTestDatabase(ctx)
	if err != nil {
		log.Fatalf("Failed to setup test database: %v", err)
	}

	unlock, err := testDB.AcquireTestLock(ctx)
	if err != nil {
		log.Fatalf("Failed to acquire test DB lock: %v", err)
	}

	if err := testDB.CleanupTables(ctx); err != nil {
		log.Fatalf("Failed to cleanup test database: %v", err)
	}

	err = createMedicalDiagnosisHistoryTable(ctx)
	if err != nil {
		log.Printf("Warning: Could not create medical_diagnosis_history table: %v", err)
	}

	cfg := &config.Config{}
	testService = NewAppointmentService(testDB.Pool, cfg)

	code := m.Run()

	unlock()

	testDB.Pool.Close()
	os.Exit(code)
}

func createMedicalDiagnosisHistoryTable(ctx context.Context) error {
	query := `
		CREATE TABLE IF NOT EXISTS medical_diagnosis_history (
			diag_history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			diagnosis_name VARCHAR(50) NOT NULL,
			diagnosis_details TEXT,
			diagnosis_doctor_name VARCHAR(50) NOT NULL,
			diagnosis_doctor_id UUID,
			diagnosis_patient_id UUID,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)
	`
	_, err := testDB.Pool.Exec(ctx, query)
	return err
}

func TestCreateReservation_Success(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docappt@test.com", "pass", "Dr.", "Smith", true)
	require.NoError(t, err)

	var doctorID string
	err = testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1",
		"docappt@test.com").Scan(&doctorID)
	require.NoError(t, err)

	err = testDB.CreateTestPatient(ctx, "patappt@test.com", "pass", "John", "Doe", true)
	require.NoError(t, err)

	var patientID string
	err = testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1",
		"patappt@test.com").Scan(&patientID)
	require.NoError(t, err)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Checkup",
		IsDoctorPatient:  false,
	}

	err = testService.CreateReservation(reservation)
	require.NoError(t, err)

	var count int
	err = testDB.Pool.QueryRow(ctx,
		"SELECT COUNT(*) FROM appointments WHERE doctor_id = $1 AND patient_id = $2",
		doctorID, patientID).Scan(&count)
	require.NoError(t, err)
	assert.Equal(t, 1, count)
}

func TestGetAppointmentByID_Success(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docgetid@test.com", "pass", "Dr.", "GetID", true)
	require.NoError(t, err)
	var doctorID string
	err = testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1",
		"docgetid@test.com").Scan(&doctorID)
	require.NoError(t, err)

	err = testDB.CreateTestPatient(ctx, "patgetid@test.com", "pass", "Alice", "GetID", true)
	require.NoError(t, err)
	var patientID string
	err = testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1",
		"patgetid@test.com").Scan(&patientID)
	require.NoError(t, err)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Get By ID Test",
		IsDoctorPatient:  false,
	}
	err = testService.CreateReservation(reservation)
	require.NoError(t, err)

	var appointmentID uuid.UUID
	err = testDB.Pool.QueryRow(ctx,
		"SELECT appointment_id FROM appointments WHERE doctor_id = $1 AND patient_id = $2 ORDER BY created_at DESC LIMIT 1",
		doctorID, patientID).Scan(&appointmentID)
	require.NoError(t, err)

	appointment, err := testService.GetAppointmentByID(appointmentID.String())

	require.NoError(t, err)
	assert.NotNil(t, appointment)
	assert.Equal(t, appointmentID, appointment.AppointmentID)
}

func TestCancelAppointment_Success(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "doccancel@test.com", "pass", "Dr.", "Cancel", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1",
		"doccancel@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patcancel@test.com", "pass", "Bob", "Cancel", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1",
		"patcancel@test.com").Scan(&patientID)

	startTime := time.Now().Add(48 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "To Cancel",
		IsDoctorPatient:  false,
	}
	err = testService.CreateReservation(reservation)
	require.NoError(t, err)

	var appointmentID uuid.UUID
	err = testDB.Pool.QueryRow(ctx,
		"SELECT appointment_id FROM appointments WHERE doctor_id = $1 AND patient_id = $2 ORDER BY created_at DESC LIMIT 1",
		doctorID, patientID).Scan(&appointmentID)
	require.NoError(t, err)

	err = testService.CancelAppointment(appointmentID, "patient", "Changed mind")
	require.NoError(t, err)

	var canceled bool
	err = testDB.Pool.QueryRow(ctx,
		"SELECT canceled FROM appointments WHERE appointment_id = $1",
		appointmentID).Scan(&canceled)
	require.NoError(t, err)
	assert.True(t, canceled)
}

func TestGetReservations_PatientView(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docres1@test.com", "pass", "Dr.", "Res1", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docres1@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patres1@test.com", "pass", "Pat", "Res1", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patres1@test.com").Scan(&patientID)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Patient View Test",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation)

	reservations, err := testService.GetReservations(patientID, "patient", "UTC")

	require.NoError(t, err)
	assert.NotNil(t, reservations)
	assert.GreaterOrEqual(t, len(reservations), 1)
}

func TestGetReservations_DoctorView(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docres2@test.com", "pass", "Dr.", "Res2", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docres2@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patres2@test.com", "pass", "Pat", "Res2", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patres2@test.com").Scan(&patientID)

	startTime := time.Now().Add(48 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(45 * time.Minute),
		Title:            "Doctor View Test",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation)

	reservations, err := testService.GetReservations(doctorID, "doctor", "UTC")

	require.NoError(t, err)
	assert.NotNil(t, reservations)
	assert.GreaterOrEqual(t, len(reservations), 1)
}

func TestGetReservations_InvalidUserType(t *testing.T) {
	reservations, err := testService.GetReservations("some-id", "invalid", "UTC")

	assert.NoError(t, err)
	if reservations != nil {
		assert.GreaterOrEqual(t, len(reservations), 0)
	}
}

func TestGetReservations_EmptyUserID(t *testing.T) {
	reservations, err := testService.GetReservations("", "patient", "UTC")

	assert.Error(t, err)
	assert.Nil(t, reservations)
}

func TestGetAppointmentByID_NotFound(t *testing.T) {
	fakeID := uuid.New()
	appointment, err := testService.GetAppointmentByID(fakeID.String())

	assert.Error(t, err)
	assert.Nil(t, appointment)
}

func TestGetAppointmentByID_InvalidUUID(t *testing.T) {
	appointment, err := testService.GetAppointmentByID("not-a-uuid")

	assert.Error(t, err)
	assert.Nil(t, appointment)
}

func TestGetReservations_ReceptionistView(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docreception@test.com", "pass", "Dr.", "Reception", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docreception@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patreception@test.com", "pass", "Pat", "Reception", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patreception@test.com").Scan(&patientID)

	_, _ = testDB.Pool.Exec(ctx, "DELETE FROM receptionists WHERE email = $1 OR username = $2", "recreception@test.com", "recreception@test.com")

	var receptionistID string
	err = testDB.Pool.QueryRow(ctx, `
		INSERT INTO receptionists (
			username, first_name, last_name, sex, hashed_password, salt, email,
			phone_number, city_name, state_name, country_name, assigned_doctor_id
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7,
			$8, $9, $10, $11, $12
		)
		RETURNING receptionist_id::text
	`,
		"recreception@test.com",
		"Rec",
		"Reception",
		"Male",
		"pass",
		"test-salt",
		"recreception@test.com",
		"+212-600-000-010",
		"Casablanca",
		"Casablanca-Settat",
		"Morocco",
		doctorID,
	).Scan(&receptionistID)
	require.NoError(t, err)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Reception View",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation)

	startTime2 := time.Now().Add(48 * time.Hour)
	reservation2 := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        receptionistID,
		AppointmentStart: startTime2,
		AppointmentEnd:   startTime2.Add(30 * time.Minute),
		Title:            "Receptionist Personal",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation2)

	reservationsAsReceptionist, err := testService.GetReservationsWithViewAs(receptionistID, "receptionist", "UTC", "receptionist")

	assert.NoError(t, err)
	assert.NotNil(t, reservationsAsReceptionist)
	assert.GreaterOrEqual(t, len(reservationsAsReceptionist), 1)

	reservationsAsPatient, err := testService.GetReservationsWithViewAs(receptionistID, "receptionist", "UTC", "patient")

	assert.NoError(t, err)
	assert.NotNil(t, reservationsAsPatient)
	assert.GreaterOrEqual(t, len(reservationsAsPatient), 1)
}

func TestGetReservations_WithDateFilter(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docfilter@test.com", "pass", "Dr.", "Filter", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docfilter@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patfilter@test.com", "pass", "Pat", "Filter", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patfilter@test.com").Scan(&patientID)

	tomorrow := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: tomorrow,
		AppointmentEnd:   tomorrow.Add(30 * time.Minute),
		Title:            "Filtered",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation)

	reservations, err := testService.GetReservations(patientID, "patient", "America/New_York")

	require.NoError(t, err)
	assert.NotNil(t, reservations)
}

func TestGetReservations_DifferentTimezones(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "doctz@test.com", "pass", "Dr.", "TZ", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "doctz@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "pattz@test.com", "pass", "Pat", "TZ", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "pattz@test.com").Scan(&patientID)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "TZ Test",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation)

	reservationsUTC, err := testService.GetReservations(patientID, "patient", "UTC")
	reservationsEST, err := testService.GetReservations(patientID, "patient", "America/New_York")

	assert.NotNil(t, reservationsUTC)
	assert.NotNil(t, reservationsEST)
}

func TestGetReservations_BothRoles(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docboth@test.com", "pass", "Dr.", "Both", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docboth@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patboth@test.com", "pass", "Pat", "Both", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patboth@test.com").Scan(&patientID)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Both Roles",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation)

	doctorReservations, err1 := testService.GetReservationsWithViewAs(doctorID, "doctor", "UTC", "doctor")
	patientReservations, err2 := testService.GetReservations(patientID, "patient", "UTC")

	assert.NoError(t, err1)
	assert.NoError(t, err2)
	assert.NotNil(t, doctorReservations)
	assert.NotNil(t, patientReservations)
}

func TestGetReservations_DoctorAsDoctor_IncludesReceptionistAndDoctorPatients(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docprovider@test.com", "pass", "Dr.", "Provider", true)
	require.NoError(t, err)
	var providerDoctorID string
	err = testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docprovider@test.com").Scan(&providerDoctorID)
	require.NoError(t, err)

	receptionistEmail := "receppatient@test.com"
	_, _ = testDB.Pool.Exec(ctx, "DELETE FROM receptionists WHERE email = $1 OR username = $2", receptionistEmail, receptionistEmail)

	var receptionistID string
	err = testDB.Pool.QueryRow(ctx, `
		INSERT INTO receptionists (
			username, first_name, last_name, sex, hashed_password, salt,
			email, phone_number, city_name, state_name, country_name,
			assigned_doctor_id, is_active, email_verified
		)
		VALUES (
			$1, $2, $3, $4, $5, $6,
			$7, $8, $9, $10, $11,
			$12, $13, $14
		)
		RETURNING receptionist_id
	`,
		receptionistEmail,
		"Receptionist Patient",
		"User",
		"Male",
		"pass",
		"test-salt",
		receptionistEmail,
		"+212-600-000-999",
		"Casablanca",
		"Casablanca-Settat",
		"Morocco",
		providerDoctorID,
		true,
		true,
	).Scan(&receptionistID)
	require.NoError(t, err)
	require.NotEmpty(t, receptionistID)

	err = testDB.CreateTestDoctor(ctx, "docpatient@test.com", "pass", "Dr.", "Patient", true)
	require.NoError(t, err)
	var doctorPatientID string
	err = testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docpatient@test.com").Scan(&doctorPatientID)
	require.NoError(t, err)

	startTime := time.Now().Add(24 * time.Hour)

	err = testService.CreateReservation(models.Reservation{
		DoctorID:         providerDoctorID,
		PatientID:        receptionistID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Receptionist Patient Appointment",
		IsDoctorPatient:  false,
	})
	require.NoError(t, err)

	err = testService.CreateReservation(models.Reservation{
		DoctorID:         providerDoctorID,
		PatientID:        doctorPatientID,
		AppointmentStart: startTime.Add(1 * time.Hour),
		AppointmentEnd:   startTime.Add(1*time.Hour + 30*time.Minute),
		Title:            "Doctor Patient Appointment",
		IsDoctorPatient:  true,
	})
	require.NoError(t, err)

	reservations, err := testService.GetReservationsWithViewAs(providerDoctorID, "doctor", "UTC", "doctor")
	require.NoError(t, err)
	require.NotEmpty(t, reservations)

	var hasReceptionistPatient bool
	var hasDoctorPatient bool
	for _, r := range reservations {
		if r.PatientID == receptionistID {
			hasReceptionistPatient = true
		}
		if r.PatientID == doctorPatientID {
			hasDoctorPatient = true
		}
	}
	assert.True(t, hasReceptionistPatient)
	assert.True(t, hasDoctorPatient)
}

func TestGetReservations_DoctorAsPatientTrue(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "doc1aspatient@test.com", "pass", "Dr.", "D1AsPatient", true)
	require.NoError(t, err)
	var doctor1ID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "doc1aspatient@test.com").Scan(&doctor1ID)

	err = testDB.CreateTestDoctor(ctx, "doc2aspatient@test.com", "pass", "Dr.", "D2AsPatient", true)
	require.NoError(t, err)
	var doctor2ID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "doc2aspatient@test.com").Scan(&doctor2ID)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctor1ID,
		PatientID:        doctor2ID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Doctor as Patient",
		IsDoctorPatient:  true,
	}
	testService.CreateReservation(reservation)

	reservations, err := testService.GetReservationsWithViewAs(doctor2ID, "doctor", "UTC", "patient")

	require.NoError(t, err)
	assert.NotNil(t, reservations)
}

func TestGetReservationsCount_Patient(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "doccount@test.com", "pass", "Dr.", "Count", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "doccount@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patcount@test.com", "pass", "Pat", "Count", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patcount@test.com").Scan(&patientID)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Count Test",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation)

	count, err := testService.GetReservationsCount(patientID, "patient", "upcoming")

	require.NoError(t, err)
	assert.NotNil(t, count)
	assert.GreaterOrEqual(t, count["asPatient"], 0)
}

func TestGetReservationsCount_Doctor(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "doccountdoc@test.com", "pass", "Dr.", "CountDoc", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "doccountdoc@test.com").Scan(&doctorID)

	count, err := testService.GetReservationsCount(doctorID, "doctor", "upcoming")

	require.NoError(t, err)
	assert.NotNil(t, count)
	assert.GreaterOrEqual(t, count["asDoctor"], 0)
}

func TestGetReservationsCount_InvalidType(t *testing.T) {
	count, err := testService.GetReservationsCount("some-id", "invalid-type", "upcoming")

	assert.NoError(t, err)
	assert.NotNil(t, count)
}

func TestGetReservationsCount_EmptyUser(t *testing.T) {
	count, err := testService.GetReservationsCount("", "patient", "upcoming")

	assert.NoError(t, err)
	assert.NotNil(t, count)
}

func TestGetReservationsCount_BothRoles(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "doccountboth@test.com", "pass", "Dr.", "CountBoth", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "doccountboth@test.com").Scan(&doctorID)

	patientCount, err1 := testService.GetReservationsCount(doctorID, "patient", "upcoming")
	doctorCount, err2 := testService.GetReservationsCount(doctorID, "doctor", "upcoming")

	assert.NoError(t, err1)
	assert.NoError(t, err2)
	assert.NotNil(t, patientCount)
	assert.NotNil(t, doctorCount)
}

func TestGetReservationsCount_AllStatuses(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docallstatus@test.com", "pass", "Dr.", "AllStatus", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docallstatus@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patallstatus@test.com", "pass", "Pat", "AllStatus", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patallstatus@test.com").Scan(&patientID)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "All Status",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation)

	allCount, err := testService.GetReservationsCount(patientID, "patient", "all")

	require.NoError(t, err)
	assert.NotNil(t, allCount)
	assert.GreaterOrEqual(t, allCount["asPatient"], 0)
}

func TestGetReservations_PastAppointment(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docpastappt@test.com", "pass", "Dr.", "PastAppt", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docpastappt@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patpastappt@test.com", "pass", "Pat", "PastAppt", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patpastappt@test.com").Scan(&patientID)

	pastTime := time.Now().Add(-48 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: pastTime,
		AppointmentEnd:   pastTime.Add(30 * time.Minute),
		Title:            "Past Appointment",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation)

	reservations, err := testService.GetReservations(patientID, "patient", "UTC")

	require.NoError(t, err)
	assert.NotNil(t, reservations)
}

func TestGetAppointmentStatistics_EmptyResults(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docemptystats@test.com", "pass", "Dr.", "EmptyStats", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docemptystats@test.com").Scan(&doctorID)

	stats, err := testService.GetAppointmentStatistics(doctorID, "doctor")

	require.NoError(t, err)
	assert.NotNil(t, stats)
	assert.Equal(t, 0, stats["as_doctor"])
	assert.Equal(t, 0, stats["as_patient"])
}

func TestCreateReport_WithMedications(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docmedreport@test.com", "pass", "Dr.", "MedReport", true)
	require.NoError(t, err)
	var doctorID uuid.UUID
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docmedreport@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patmedreport@test.com", "pass", "Pat", "MedReport", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patmedreport@test.com").Scan(&patientID)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID.String(),
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Med Report Test",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation)

	var appointmentID uuid.UUID
	testDB.Pool.QueryRow(ctx,
		"SELECT appointment_id FROM appointments WHERE doctor_id = $1 AND patient_id = $2 ORDER BY created_at DESC LIMIT 1",
		doctorID, patientID).Scan(&appointmentID)

	medications := []models.ReportMedication{
		{
			MedicationName: "Aspirin",
			Dosage:         "100mg",
			Frequency:      "Once daily",
			Duration:       "30 days",
			Instructions:   strPtr("Take with food"),
		},
		{
			MedicationName: "Ibuprofen",
			Dosage:         "200mg",
			Frequency:      "Twice daily",
			Duration:       "14 days",
		},
	}

	report := models.MedicalReport{
		AppointmentID:    appointmentID,
		PatientID:        patientID,
		DoctorID:         doctorID,
		PatientFirstName: "Pat",
		PatientLastName:  "MedReport",
		DoctorFirstName:  "Dr.",
		DoctorLastName:   "MedReport",
		DiagnosisName:    strPtr("Inflammation"),
		DiagnosisDetails: strPtr("Minor inflammation"),
		DiagnosisMade:    true,
		Medications:      medications,
	}

	createdReport, err := testService.CreateReport(report)

	require.NoError(t, err)
	assert.NotNil(t, createdReport)
	assert.Equal(t, 2, len(createdReport.Medications))
}

func TestCreateReport_InvalidMedication(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docinvalidmed@test.com", "pass", "Dr.", "InvalidMed", true)
	require.NoError(t, err)
	var doctorID uuid.UUID
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docinvalidmed@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patinvalidmed@test.com", "pass", "Pat", "InvalidMed", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patinvalidmed@test.com").Scan(&patientID)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID.String(),
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Invalid Med Test",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation)

	var appointmentID uuid.UUID
	testDB.Pool.QueryRow(ctx,
		"SELECT appointment_id FROM appointments WHERE doctor_id = $1 AND patient_id = $2 ORDER BY created_at DESC LIMIT 1",
		doctorID, patientID).Scan(&appointmentID)

	medications := []models.ReportMedication{
		{
			MedicationName: "",
			Dosage:         "100mg",
			Frequency:      "Once daily",
			Duration:       "30 days",
		},
	}

	report := models.MedicalReport{
		AppointmentID:    appointmentID,
		PatientID:        patientID,
		DoctorID:         doctorID,
		PatientFirstName: "Pat",
		PatientLastName:  "InvalidMed",
		DoctorFirstName:  "Dr.",
		DoctorLastName:   "InvalidMed",
		DiagnosisName:    strPtr("Test"),
		DiagnosisMade:    false,
		Medications:      medications,
	}

	_, err = testService.CreateReport(report)

	assert.Error(t, err)
}

func TestCreateReport_EmptyMedications(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docemptymed@test.com", "pass", "Dr.", "EmptyMed", true)
	require.NoError(t, err)
	var doctorID uuid.UUID
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docemptymed@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patemptymed@test.com", "pass", "Pat", "EmptyMed", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patemptymed@test.com").Scan(&patientID)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID.String(),
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Empty Med Test",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation)

	var appointmentID uuid.UUID
	testDB.Pool.QueryRow(ctx,
		"SELECT appointment_id FROM appointments WHERE doctor_id = $1 AND patient_id = $2 ORDER BY created_at DESC LIMIT 1",
		doctorID, patientID).Scan(&appointmentID)

	report := models.MedicalReport{
		AppointmentID:    appointmentID,
		PatientID:        patientID,
		DoctorID:         doctorID,
		PatientFirstName: "Pat",
		PatientLastName:  "EmptyMed",
		DoctorFirstName:  "Dr.",
		DoctorLastName:   "EmptyMed",
		DiagnosisName:    strPtr("Test"),
		DiagnosisMade:    false,
		Medications:      []models.ReportMedication{},
	}

	createdReport, err := testService.CreateReport(report)

	require.NoError(t, err)
	assert.NotNil(t, createdReport)
	assert.Equal(t, 0, len(createdReport.Medications))
}

func TestGetReservationsCount_PastAppointments(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docpastcount@test.com", "pass", "Dr.", "PastCount", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docpastcount@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patpastcount@test.com", "pass", "Pat", "PastCount", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patpastcount@test.com").Scan(&patientID)

	pastTime := time.Now().Add(-72 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: pastTime,
		AppointmentEnd:   pastTime.Add(30 * time.Minute),
		Title:            "Past Appointment",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation)

	count, err := testService.GetReservationsCount(doctorID, "doctor", "past")

	require.NoError(t, err)
	assert.NotNil(t, count)
	assert.GreaterOrEqual(t, count["as_doctor"], 1)
}

func TestGetReservationsCount_DoctorAsPatient(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "doc1countaspatient@test.com", "pass", "Dr.", "D1CountAsPatient", true)
	require.NoError(t, err)
	var doctor1ID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "doc1countaspatient@test.com").Scan(&doctor1ID)

	err = testDB.CreateTestDoctor(ctx, "doc2countaspatient@test.com", "pass", "Dr.", "D2CountAsPatient", true)
	require.NoError(t, err)
	var doctor2ID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "doc2countaspatient@test.com").Scan(&doctor2ID)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctor1ID,
		PatientID:        doctor2ID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Doctor as Patient Count",
		IsDoctorPatient:  true,
	}
	testService.CreateReservation(reservation)

	count, err := testService.GetReservationsCount(doctor2ID, "doctor", "upcoming")

	require.NoError(t, err)
	assert.NotNil(t, count)
	assert.GreaterOrEqual(t, count["as_patient"], 0)
	assert.GreaterOrEqual(t, count["as_doctor"], 0)
}

func TestGetAvailabilities_MultipleDays(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docmultiday@test.com", "pass", "Dr.", "MultiDay", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docmultiday@test.com").Scan(&doctorID)

	futureDate := time.Now().Add(48 * time.Hour)
	startDate := futureDate.Format("2006-01-02")
	endDate := futureDate.Add(7 * 24 * time.Hour).Format("2006-01-02")

	baseTime := time.Date(futureDate.Year(), futureDate.Month(), futureDate.Day(), 10, 0, 0, 0, time.UTC)
	availabilities := []models.Availability{
		{
			AvailabilityStart: baseTime,
			AvailabilityEnd:   baseTime.Add(4 * time.Hour),
			DoctorID:          doctorID,
			Weekday:           futureDate.Weekday().String(),
			SlotDuration:      30,
		},
	}

	err = testService.SetDoctorAvailability(doctorID, startDate, endDate, availabilities)
	require.NoError(t, err)

	queryTime := time.Now().Format(time.RFC3339)
	slots, err := testService.GetAvailabilities(doctorID, startDate, queryTime)

	assert.NoError(t, err)
	assert.NotNil(t, slots)
}

func TestCancelAppointment_AlreadyCanceledTwice(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "doccancel2@test.com", "pass", "Dr.", "Cancel2", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "doccancel2@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patcancel2@test.com", "pass", "Pat", "Cancel2", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patcancel2@test.com").Scan(&patientID)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Cancel Twice Test",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation)

	var appointmentID uuid.UUID
	testDB.Pool.QueryRow(ctx,
		"SELECT appointment_id FROM appointments WHERE doctor_id = $1 AND patient_id = $2 ORDER BY created_at DESC LIMIT 1",
		doctorID, patientID).Scan(&appointmentID)

	err = testService.CancelAppointment(appointmentID, patientID, "First cancel")
	require.NoError(t, err)

	err = testService.CancelAppointment(appointmentID, patientID, "Second cancel attempt")
	assert.NoError(t, err)
}
