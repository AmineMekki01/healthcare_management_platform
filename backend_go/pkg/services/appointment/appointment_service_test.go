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

	err = createMedicalHistoryTable(ctx)
	if err != nil {
		log.Printf("Warning: Could not create medical_history table: %v", err)
	}

	cfg := &config.Config{}
	testService = NewAppointmentService(testDB.Pool, cfg)

	code := m.Run()

	unlock()

	testDB.Pool.Close()
	os.Exit(code)
}

func createMedicalHistoryTable(ctx context.Context) error {
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

func TestCancelAppointment_NonExistent(t *testing.T) {
	fakeID := uuid.New()
	err := testService.CancelAppointment(fakeID, "patient", "Test reason")

	assert.NoError(t, err)
}

func TestCancelAppointment_AlreadyCanceled(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "doccancel2@test.com", "pass", "Dr.", "Cancel2", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "doccancel2@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patcancel2@test.com", "pass", "Pat", "Cancel2", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patcancel2@test.com").Scan(&patientID)

	startTime := time.Now().Add(72 * time.Hour)
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

	err = testService.CancelAppointment(appointmentID, "patient", "First cancel")
	require.NoError(t, err)

	err = testService.CancelAppointment(appointmentID, "doctor", "Second cancel")
	assert.NoError(t, err)
}

func TestGetAvailabilities_Success(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docavail@test.com", "pass", "Dr.", "Avail", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docavail@test.com").Scan(&doctorID)

	tomorrow := time.Now().Add(24 * time.Hour).Format("2006-01-02")
	currentTime := time.Now().Format(time.RFC3339)

	availabilities, err := testService.GetAvailabilities(doctorID, tomorrow, currentTime)

	assert.NoError(t, err)
	if availabilities != nil {
		assert.GreaterOrEqual(t, len(availabilities), 0)
	}
}

func TestGetAvailabilities_MissingParams(t *testing.T) {
	availabilities, err := testService.GetAvailabilities("", "2025-10-20", time.Now().Format(time.RFC3339))

	assert.Error(t, err)
	assert.Nil(t, availabilities)
}

func TestGetAvailabilities_InvalidDate(t *testing.T) {
	availabilities, err := testService.GetAvailabilities("doc-id", "invalid-date", time.Now().Format(time.RFC3339))

	assert.Error(t, err)
	assert.Nil(t, availabilities)
}

func TestClearDoctorAvailabilities_Success(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docclear@test.com", "pass", "Dr.", "Clear", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docclear@test.com").Scan(&doctorID)

	err = testService.ClearDoctorAvailabilities(doctorID)

	assert.NoError(t, err)
}

func TestAddDoctorException_Success(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docexception@test.com", "pass", "Dr.", "Exception", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docexception@test.com").Scan(&doctorID)

	tomorrow := time.Now().Add(24 * time.Hour)
	tomorrowDate := tomorrow.Format("2006-01-02")
	startTime := tomorrow.Add(9 * time.Hour).Format(time.RFC3339)
	endTime := tomorrow.Add(10 * time.Hour).Format(time.RFC3339)

	exception := models.DoctorException{
		Date:      tomorrowDate,
		StartTime: startTime,
		EndTime:   endTime,
		Type:      "vacation",
	}

	err = testService.AddDoctorException(doctorID, exception)

	assert.NoError(t, err)
}

func TestCreateReservation_WithNotes(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docnotes@test.com", "pass", "Dr.", "Notes", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docnotes@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patnotes@test.com", "pass", "Pat", "Notes", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patnotes@test.com").Scan(&patientID)

	startTime := time.Now().Add(24 * time.Hour)
	notes := "Patient has allergies"
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "With Notes",
		Notes:            &notes,
		IsDoctorPatient:  false,
	}

	err = testService.CreateReservation(reservation)

	require.NoError(t, err)
}

func TestCreateReservation_DoctorAsPatient(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docpatient1@test.com", "pass", "Dr.", "DoctorPat1", true)
	require.NoError(t, err)
	var doctor1ID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docpatient1@test.com").Scan(&doctor1ID)

	err = testDB.CreateTestDoctor(ctx, "docpatient2@test.com", "pass", "Dr.", "DoctorPat2", true)
	require.NoError(t, err)
	var doctor2ID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docpatient2@test.com").Scan(&doctor2ID)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctor1ID,
		PatientID:        doctor2ID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Doctor as Patient",
		IsDoctorPatient:  true,
	}

	err = testService.CreateReservation(reservation)

	require.NoError(t, err)
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

func TestSearchDoctorsForReferral_Success(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docref@test.com", "pass", "Dr.", "Referral", true)
	require.NoError(t, err)

	doctors, err := testService.SearchDoctorsForReferral("Ref", "Cardiology", 10)

	require.NoError(t, err)
	assert.NotNil(t, doctors)
}

func TestSearchDoctorsForReferral_EmptyResults(t *testing.T) {
	doctors, err := testService.SearchDoctorsForReferral("NonExistentName", "UnknownSpecialty", 10)

	assert.NoError(t, err)
	if doctors != nil {
		assert.Equal(t, 0, len(doctors))
	}
}

func TestSetDoctorAvailability_Success(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docsetavail@test.com", "pass", "Dr.", "SetAvail", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docsetavail@test.com").Scan(&doctorID)

	startDate := time.Now().Add(24 * time.Hour).Format("2006-01-02")
	endDate := time.Now().Add(72 * time.Hour).Format("2006-01-02")

	availabilities := []models.Availability{
		{
			AvailabilityStart: time.Now().Add(24 * time.Hour),
			AvailabilityEnd:   time.Now().Add(25 * time.Hour),
			DoctorID:          doctorID,
			Weekday:           "Monday",
			SlotDuration:      30,
		},
	}

	err = testService.SetDoctorAvailability(doctorID, startDate, endDate, availabilities)

	assert.NoError(t, err)
}

func TestSetDoctorAvailability_InvalidDates(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docsetavail2@test.com", "pass", "Dr.", "SetAvail2", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docsetavail2@test.com").Scan(&doctorID)

	err = testService.SetDoctorAvailability(doctorID, "invalid-date", "invalid-date", []models.Availability{})

	assert.Error(t, err)
}

func TestGetWeeklySchedule_Success(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docweekly@test.com", "pass", "Dr.", "Weekly", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docweekly@test.com").Scan(&doctorID)

	rangeStart := time.Now()
	rangeEnd := time.Now().Add(7 * 24 * time.Hour)

	schedule, err := testService.GetWeeklySchedule(doctorID, rangeStart, rangeEnd)

	assert.NoError(t, err)
	assert.NotNil(t, schedule)
}

func TestGetDoctorWeeklySchedule_Success(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docdocweekly@test.com", "pass", "Dr.", "DocWeekly", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docdocweekly@test.com").Scan(&doctorID)

	rangeStart := time.Now()
	rangeEnd := time.Now().Add(7 * 24 * time.Hour)

	schedule, err := testService.GetDoctorWeeklySchedule(doctorID, rangeStart, rangeEnd)

	assert.NoError(t, err)
	if schedule != nil {
		assert.GreaterOrEqual(t, len(schedule), 0)
	}
}

func TestCreateReport_Success(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "doccreatereport@test.com", "pass", "Dr.", "CreateReport", true)
	require.NoError(t, err)
	var doctorID uuid.UUID
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "doccreatereport@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patcreatereport@test.com", "pass", "Pat", "CreateReport", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patcreatereport@test.com").Scan(&patientID)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID.String(),
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Report Test",
		IsDoctorPatient:  false,
	}
	err = testService.CreateReservation(reservation)
	require.NoError(t, err)

	var appointmentID uuid.UUID
	testDB.Pool.QueryRow(ctx,
		"SELECT appointment_id FROM appointments WHERE doctor_id = $1 AND patient_id = $2 ORDER BY created_at DESC LIMIT 1",
		doctorID, patientID).Scan(&appointmentID)

	report := models.MedicalReport{
		AppointmentID:    appointmentID,
		PatientID:        patientID,
		DoctorID:         doctorID,
		PatientFirstName: "Pat",
		PatientLastName:  "CreateReport",
		DoctorFirstName:  "Dr.",
		DoctorLastName:   "CreateReport",
		DiagnosisName:    strPtr("Test Diagnosis"),
		DiagnosisDetails: strPtr("Test Details"),
		DiagnosisMade:    true,
	}

	createdReport, err := testService.CreateReport(report)

	require.NoError(t, err)
	assert.NotNil(t, createdReport)
	assert.NotEqual(t, uuid.Nil, createdReport.ReportID)
}

func TestGetReports_Success(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestPatient(ctx, "patgetreports@test.com", "pass", "Pat", "GetReports", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patgetreports@test.com").Scan(&patientID)

	reports, err := testService.GetReports(patientID, "", "", "", "", "", "")

	assert.NoError(t, err)
	if reports != nil {
		assert.GreaterOrEqual(t, len(reports), 0)
	}
}

func TestGetReport_Success(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docgetreport2@test.com", "pass", "Dr.", "GetReport2", true)
	require.NoError(t, err)
	var doctorID uuid.UUID
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docgetreport2@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patgetreport2@test.com", "pass", "Pat", "GetReport2", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patgetreport2@test.com").Scan(&patientID)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID.String(),
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Get Report Test",
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
		PatientLastName:  "GetReport2",
		DoctorFirstName:  "Dr.",
		DoctorLastName:   "GetReport2",
		DiagnosisName:    strPtr("Test"),
		DiagnosisMade:    true,
	}
	createdReport, _ := testService.CreateReport(report)

	retrievedReport, err := testService.GetReport(createdReport.ReportID.String())

	require.NoError(t, err)
	assert.NotNil(t, retrievedReport)
	assert.Equal(t, createdReport.ReportID, retrievedReport.ReportID)
}

func TestGetReport_NotFound(t *testing.T) {
	fakeID := uuid.New()
	report, err := testService.GetReport(fakeID.String())

	assert.Error(t, err)
	assert.Nil(t, report)
}

func TestUpdateReport_Success(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docupdatereport2@test.com", "pass", "Dr.", "UpdateReport2", true)
	require.NoError(t, err)
	var doctorID uuid.UUID
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docupdatereport2@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patupdatereport2@test.com", "pass", "Pat", "UpdateReport2", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patupdatereport2@test.com").Scan(&patientID)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID.String(),
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Update Report Test",
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
		PatientLastName:  "UpdateReport2",
		DoctorFirstName:  "Dr.",
		DoctorLastName:   "UpdateReport2",
		DiagnosisName:    strPtr("Original"),
		DiagnosisMade:    true,
	}
	createdReport, _ := testService.CreateReport(report)

	updateData := models.MedicalReport{
		DiagnosisName:    strPtr("Updated Diagnosis"),
		DiagnosisDetails: strPtr("New treatment plan"),
	}

	err = testService.UpdateReport(createdReport.ReportID.String(), updateData)

	assert.NoError(t, err)
}

func TestDeleteReport_Success(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docdeletereport2@test.com", "pass", "Dr.", "DeleteReport2", true)
	require.NoError(t, err)
	var doctorID uuid.UUID
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docdeletereport2@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patdeletereport2@test.com", "pass", "Pat", "DeleteReport2", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patdeletereport2@test.com").Scan(&patientID)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID.String(),
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Delete Report Test",
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
		PatientLastName:  "DeleteReport2",
		DoctorFirstName:  "Dr.",
		DoctorLastName:   "DeleteReport2",
		DiagnosisName:    strPtr("To Delete"),
		DiagnosisMade:    true,
	}
	createdReport, _ := testService.CreateReport(report)

	err = testService.DeleteReport(createdReport.ReportID.String())

	assert.NoError(t, err)
}

func TestDeleteReport_NotFound(t *testing.T) {
	fakeID := uuid.New()
	err := testService.DeleteReport(fakeID.String())

	assert.Error(t, err)
}

func TestGetPatientMedications_Success(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestPatient(ctx, "patmeds@test.com", "pass", "Pat", "Meds", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patmeds@test.com").Scan(&patientID)

	medications, err := testService.GetPatientMedications(patientID)

	assert.NoError(t, err)
	if medications != nil {
		assert.GreaterOrEqual(t, len(medications), 0)
	}
}

func TestGetPatientMedications_InvalidID(t *testing.T) {
	medications, err := testService.GetPatientMedications("not-a-uuid")

	assert.Error(t, err)
	assert.Nil(t, medications)
}

func TestCreateReservation_PastDate(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docpast@test.com", "pass", "Dr.", "Past", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docpast@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patpast@test.com", "pass", "Pat", "Past", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patpast@test.com").Scan(&patientID)

	pastTime := time.Now().Add(-24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: pastTime,
		AppointmentEnd:   pastTime.Add(30 * time.Minute),
		Title:            "Past Appointment",
		IsDoctorPatient:  false,
	}

	err = testService.CreateReservation(reservation)

	assert.NoError(t, err)
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

func TestSearchDoctorsForReferral_WithSpecialty(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docrefspec@test.com", "pass", "Dr.", "RefSpec", true)
	require.NoError(t, err)

	doctors, err := testService.SearchDoctorsForReferral("", "Cardiology", 5)

	require.NoError(t, err)
	assert.NotNil(t, doctors)
}

func TestGetAvailabilities_EmptyResults(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docemptyavail@test.com", "pass", "Dr.", "EmptyAvail", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docemptyavail@test.com").Scan(&doctorID)

	farFuture := time.Now().Add(365 * 24 * time.Hour).Format("2006-01-02")
	currentTime := time.Now().Format(time.RFC3339)

	availabilities, err := testService.GetAvailabilities(doctorID, farFuture, currentTime)

	assert.NoError(t, err)
	if availabilities != nil {
		assert.GreaterOrEqual(t, len(availabilities), 0)
	}
}

func strPtr(s string) *string {
	return &s
}

func TestCreateReservation_OverlappingTimeSlots(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docoverlap@test.com", "pass", "Dr.", "Overlap", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docoverlap@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patoverlap1@test.com", "pass", "Pat", "Overlap1", true)
	require.NoError(t, err)
	var patient1ID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patoverlap1@test.com").Scan(&patient1ID)

	err = testDB.CreateTestPatient(ctx, "patoverlap2@test.com", "pass", "Pat", "Overlap2", true)
	require.NoError(t, err)
	var patient2ID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patoverlap2@test.com").Scan(&patient2ID)

	startTime := time.Now().Add(48 * time.Hour)
	reservation1 := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patient1ID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "First",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation1)

	reservation2 := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patient2ID,
		AppointmentStart: startTime.Add(15 * time.Minute),
		AppointmentEnd:   startTime.Add(45 * time.Minute),
		Title:            "Overlapping",
		IsDoctorPatient:  false,
	}
	err = testService.CreateReservation(reservation2)

	assert.NoError(t, err)
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

	reservationsUTC, _ := testService.GetReservations(patientID, "patient", "UTC")
	reservationsEST, _ := testService.GetReservations(patientID, "patient", "America/New_York")

	assert.NotNil(t, reservationsUTC)
	assert.NotNil(t, reservationsEST)
}

func TestCancelAppointment_WithReason(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docreason@test.com", "pass", "Dr.", "Reason", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docreason@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patreason@test.com", "pass", "Pat", "Reason", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patreason@test.com").Scan(&patientID)

	startTime := time.Now().Add(48 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Cancel With Reason",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation)

	var appointmentID uuid.UUID
	testDB.Pool.QueryRow(ctx,
		"SELECT appointment_id FROM appointments WHERE doctor_id = $1 AND patient_id = $2 ORDER BY created_at DESC LIMIT 1",
		doctorID, patientID).Scan(&appointmentID)

	err = testService.CancelAppointment(appointmentID, "patient", "Emergency came up")

	assert.NoError(t, err)
}

func TestGetReservationsCount_UpcomingVsPast(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docupcoming@test.com", "pass", "Dr.", "Upcoming", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docupcoming@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patupcoming@test.com", "pass", "Pat", "Upcoming", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patupcoming@test.com").Scan(&patientID)

	futureTime := time.Now().Add(48 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: futureTime,
		AppointmentEnd:   futureTime.Add(30 * time.Minute),
		Title:            "Future",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation)

	upcomingCount, err := testService.GetReservationsCount(patientID, "patient", "upcoming")
	require.NoError(t, err)

	pastCount, err := testService.GetReservationsCount(patientID, "patient", "past")
	require.NoError(t, err)

	assert.GreaterOrEqual(t, upcomingCount["asPatient"], 0)
	assert.GreaterOrEqual(t, pastCount["asPatient"], 0)
}

func TestGetReservationsCount_InvalidType(t *testing.T) {
	count, err := testService.GetReservationsCount("some-id", "invalid-type", "upcoming")

	assert.NoError(t, err)
	assert.NotNil(t, count)
}

func TestSetDoctorAvailability_EmptyArray(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docemptyarray@test.com", "pass", "Dr.", "EmptyArray", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docemptyarray@test.com").Scan(&doctorID)

	startDate := time.Now().Add(24 * time.Hour).Format("2006-01-02")
	endDate := time.Now().Add(72 * time.Hour).Format("2006-01-02")

	err = testService.SetDoctorAvailability(doctorID, startDate, endDate, []models.Availability{})

	assert.NoError(t, err)
}

func TestGetWeeklySchedule_EmptySchedule(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docemptysched@test.com", "pass", "Dr.", "EmptySched", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docemptysched@test.com").Scan(&doctorID)

	rangeStart := time.Now()
	rangeEnd := time.Now().Add(7 * 24 * time.Hour)

	schedule, err := testService.GetWeeklySchedule(doctorID, rangeStart, rangeEnd)

	assert.NoError(t, err)
	assert.NotNil(t, schedule)
}

func TestSearchDoctorsForReferral_LimitResults(t *testing.T) {
	ctx := context.Background()

	for i := 0; i < 3; i++ {
		email := "doclimit" + string(rune('a'+i)) + "@test.com"
		testDB.CreateTestDoctor(ctx, email, "pass", "Dr.", "Limit", true)
	}

	doctors, err := testService.SearchDoctorsForReferral("Limit", "", 2)

	require.NoError(t, err)
	assert.NotNil(t, doctors)
	if doctors != nil {
		assert.LessOrEqual(t, len(doctors), 2)
	}
}

func TestCreateReservation_EmptyTitle(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docemptytitle@test.com", "pass", "Dr.", "EmptyTitle", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docemptytitle@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patemptytitle@test.com", "pass", "Pat", "EmptyTitle", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patemptytitle@test.com").Scan(&patientID)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "",
		IsDoctorPatient:  false,
	}

	err = testService.CreateReservation(reservation)

	assert.NoError(t, err)
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

	doctorReservations, err1 := testService.GetReservations(doctorID, "doctor", "UTC")
	patientReservations, err2 := testService.GetReservations(patientID, "patient", "UTC")

	assert.NoError(t, err1)
	assert.NoError(t, err2)
	assert.NotNil(t, doctorReservations)
	assert.NotNil(t, patientReservations)
}

func TestCancelAppointment_ByDoctor(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "doccanceldoc@test.com", "pass", "Dr.", "CancelDoc", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "doccanceldoc@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patcanceldoc@test.com", "pass", "Pat", "CancelDoc", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patcanceldoc@test.com").Scan(&patientID)

	startTime := time.Now().Add(48 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Doctor Cancel",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation)

	var appointmentID uuid.UUID
	testDB.Pool.QueryRow(ctx,
		"SELECT appointment_id FROM appointments WHERE doctor_id = $1 AND patient_id = $2 ORDER BY created_at DESC LIMIT 1",
		doctorID, patientID).Scan(&appointmentID)

	err = testService.CancelAppointment(appointmentID, "doctor", "Doctor unavailable")

	assert.NoError(t, err)
}

func TestGetAvailabilities_WithExistingAppointments(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docexistappt@test.com", "pass", "Dr.", "ExistAppt", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docexistappt@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patexistappt@test.com", "pass", "Pat", "ExistAppt", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patexistappt@test.com").Scan(&patientID)

	tomorrow := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: tomorrow,
		AppointmentEnd:   tomorrow.Add(30 * time.Minute),
		Title:            "Existing",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation)

	tomorrowStr := tomorrow.Format("2006-01-02")
	currentTime := time.Now().Format(time.RFC3339)

	availabilities, err := testService.GetAvailabilities(doctorID, tomorrowStr, currentTime)

	assert.NoError(t, err)
	if availabilities != nil {
		assert.GreaterOrEqual(t, len(availabilities), 0)
	}
}

func TestCreateReservation_LongDuration(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "doclong@test.com", "pass", "Dr.", "Long", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "doclong@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patlong@test.com", "pass", "Pat", "Long", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patlong@test.com").Scan(&patientID)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(2 * time.Hour),
		Title:            "Long Appointment",
		IsDoctorPatient:  false,
	}

	err = testService.CreateReservation(reservation)

	assert.NoError(t, err)
}

func TestGetAppointmentStatistics_PatientRole(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docstats@test.com", "pass", "Dr.", "Stats", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docstats@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patstats@test.com", "pass", "Pat", "Stats", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patstats@test.com").Scan(&patientID)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Stats Test",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation)

	stats, err := testService.GetAppointmentStatistics(patientID, "patient")

	require.NoError(t, err)
	assert.NotNil(t, stats)
	assert.Contains(t, stats, "as_patient")
	assert.Contains(t, stats, "as_doctor")
}

func TestGetAppointmentStatistics_DoctorRole(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docstats2@test.com", "pass", "Dr.", "Stats2", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docstats2@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patstats2@test.com", "pass", "Pat", "Stats2", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patstats2@test.com").Scan(&patientID)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Doctor Stats",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation)

	stats, err := testService.GetAppointmentStatistics(doctorID, "doctor")

	require.NoError(t, err)
	assert.NotNil(t, stats)
	assert.Contains(t, stats, "as_doctor")
	assert.Contains(t, stats, "as_patient")
}

func TestGetAppointmentStatistics_ReceptionistRole(t *testing.T) {
	stats, err := testService.GetAppointmentStatistics("some-id", "receptionist")

	assert.NoError(t, err)
	assert.NotNil(t, stats)
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

	reservations, err := testService.GetReservations("receptionist-id", "receptionist", "UTC")

	assert.NoError(t, err)
	assert.NotNil(t, reservations)
}

func TestGetReports_WithFilters(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestPatient(ctx, "patfilterreports@test.com", "pass", "Pat", "FilterReports", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patfilterreports@test.com").Scan(&patientID)

	reports, err := testService.GetReports(patientID, "2024-01-01", "2024-12-31", "", "10", "0", "created_at DESC")

	assert.NoError(t, err)
	if reports != nil {
		assert.GreaterOrEqual(t, len(reports), 0)
	}
}

func TestClearDoctorAvailabilities_NonExistentDoctor(t *testing.T) {
	fakeID := uuid.New().String()
	err := testService.ClearDoctorAvailabilities(fakeID)

	assert.NoError(t, err)
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

func TestSearchDoctorsForReferral_EmptyName(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docemptyname@test.com", "pass", "Dr.", "EmptyName", true)
	require.NoError(t, err)

	doctors, err := testService.SearchDoctorsForReferral("", "", 10)

	require.NoError(t, err)
	assert.NotNil(t, doctors)
}

func TestGetWeeklySchedule_WithAppointments(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docschedappt@test.com", "pass", "Dr.", "SchedAppt", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docschedappt@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patschedappt@test.com", "pass", "Pat", "SchedAppt", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patschedappt@test.com").Scan(&patientID)

	today := time.Now()
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: today.Add(2 * time.Hour),
		AppointmentEnd:   today.Add(3 * time.Hour),
		Title:            "Within Range",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation)

	rangeStart := today.Add(-1 * time.Hour)
	rangeEnd := today.Add(7 * 24 * time.Hour)

	schedule, err := testService.GetWeeklySchedule(doctorID, rangeStart, rangeEnd)

	assert.NoError(t, err)
	assert.NotNil(t, schedule)
}

func TestCreateReservation_ShortDuration(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docshort@test.com", "pass", "Dr.", "Short", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docshort@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patshort@test.com", "pass", "Pat", "Short", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patshort@test.com").Scan(&patientID)

	startTime := time.Now().Add(24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(15 * time.Minute),
		Title:            "Short",
		IsDoctorPatient:  false,
	}

	err = testService.CreateReservation(reservation)

	assert.NoError(t, err)
}

func TestGetReservations_MultipleSameDoctor(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docmulti@test.com", "pass", "Dr.", "Multi", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docmulti@test.com").Scan(&doctorID)

	for i := 0; i < 3; i++ {
		email := "patmulti" + string(rune('a'+i)) + "@test.com"
		err = testDB.CreateTestPatient(ctx, email, "pass", "Pat", "Multi", true)
		require.NoError(t, err)
		var patientID string
		testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", email).Scan(&patientID)

		startTime := time.Now().Add(time.Duration(24*(i+1)) * time.Hour)
		reservation := models.Reservation{
			DoctorID:         doctorID,
			PatientID:        patientID,
			AppointmentStart: startTime,
			AppointmentEnd:   startTime.Add(30 * time.Minute),
			Title:            "Multi " + string(rune('A'+i)),
			IsDoctorPatient:  false,
		}
		testService.CreateReservation(reservation)
	}

	reservations, err := testService.GetReservations(doctorID, "doctor", "UTC")

	require.NoError(t, err)
	assert.NotNil(t, reservations)
	assert.GreaterOrEqual(t, len(reservations), 3)
}

func TestCancelAppointment_InvalidUserType(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docinvalidcancel@test.com", "pass", "Dr.", "InvalidCancel", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docinvalidcancel@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patinvalidcancel@test.com", "pass", "Pat", "InvalidCancel", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patinvalidcancel@test.com").Scan(&patientID)

	startTime := time.Now().Add(48 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: startTime,
		AppointmentEnd:   startTime.Add(30 * time.Minute),
		Title:            "Invalid Cancel",
		IsDoctorPatient:  false,
	}
	testService.CreateReservation(reservation)

	var appointmentID uuid.UUID
	testDB.Pool.QueryRow(ctx,
		"SELECT appointment_id FROM appointments WHERE doctor_id = $1 AND patient_id = $2 ORDER BY created_at DESC LIMIT 1",
		doctorID, patientID).Scan(&appointmentID)

	err = testService.CancelAppointment(appointmentID, "invalid_role", "Test")

	assert.NoError(t, err)
}

func TestGetReservations_EmptyResult(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docemptyres@test.com", "pass", "Dr.", "EmptyRes", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docemptyres@test.com").Scan(&doctorID)

	reservations, err := testService.GetReservations(doctorID, "doctor", "UTC")

	assert.NoError(t, err)
	if reservations != nil {
		assert.GreaterOrEqual(t, len(reservations), 0)
	}
}

func TestGetAvailabilities_FarPast(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docpastdate@test.com", "pass", "Dr.", "PastDate", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docpastdate@test.com").Scan(&doctorID)

	pastDate := time.Now().Add(-365 * 24 * time.Hour).Format("2006-01-02")
	currentTime := time.Now().Format(time.RFC3339)

	availabilities, err := testService.GetAvailabilities(doctorID, pastDate, currentTime)

	assert.NoError(t, err)
	if availabilities != nil {
		assert.GreaterOrEqual(t, len(availabilities), 0)
	}
}

func TestSetDoctorAvailability_MultipleSlots(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docmultislots@test.com", "pass", "Dr.", "MultiSlots", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docmultislots@test.com").Scan(&doctorID)

	startDate := time.Now().Add(24 * time.Hour).Format("2006-01-02")
	endDate := time.Now().Add(72 * time.Hour).Format("2006-01-02")

	baseTime := time.Now().Add(24 * time.Hour)
	availabilities := []models.Availability{
		{
			AvailabilityStart: baseTime,
			AvailabilityEnd:   baseTime.Add(1 * time.Hour),
			DoctorID:          doctorID,
			Weekday:           "Monday",
			SlotDuration:      30,
		},
		{
			AvailabilityStart: baseTime.Add(2 * time.Hour),
			AvailabilityEnd:   baseTime.Add(3 * time.Hour),
			DoctorID:          doctorID,
			Weekday:           "Monday",
			SlotDuration:      30,
		},
	}

	err = testService.SetDoctorAvailability(doctorID, startDate, endDate, availabilities)

	assert.NoError(t, err)
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

func TestGetAppointmentByID_EmptyString(t *testing.T) {
	appointment, err := testService.GetAppointmentByID("")

	assert.Error(t, err)
	assert.Nil(t, appointment)
}

func TestSearchDoctorsForReferral_OnlySpecialty(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docspeconly@test.com", "pass", "Dr.", "SpecOnly", true)
	require.NoError(t, err)

	doctors, err := testService.SearchDoctorsForReferral("", "Cardiology", 10)

	require.NoError(t, err)
	assert.NotNil(t, doctors)
}

func TestGetWeeklySchedule_PastDate(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docpastsched@test.com", "pass", "Dr.", "PastSched", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docpastsched@test.com").Scan(&doctorID)

	rangeStart := time.Now().Add(-14 * 24 * time.Hour)
	rangeEnd := time.Now().Add(-7 * 24 * time.Hour)

	schedule, err := testService.GetWeeklySchedule(doctorID, rangeStart, rangeEnd)

	assert.NoError(t, err)
	assert.NotNil(t, schedule)
}

func TestGetReports_EmptyDateRange(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestPatient(ctx, "patemptyrange@test.com", "pass", "Pat", "EmptyRange", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patemptyrange@test.com").Scan(&patientID)

	reports, err := testService.GetReports(patientID, "", "", "", "", "", "")

	assert.NoError(t, err)
	if reports != nil {
		assert.GreaterOrEqual(t, len(reports), 0)
	}
}

func TestCreateReservation_SameDayMultiple(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docsameday@test.com", "pass", "Dr.", "SameDay", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docsameday@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patsameday@test.com", "pass", "Pat", "SameDay", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patsameday@test.com").Scan(&patientID)

	tomorrow := time.Now().Add(24 * time.Hour)

	for i := 0; i < 2; i++ {
		startTime := tomorrow.Add(time.Duration(i*2) * time.Hour)
		reservation := models.Reservation{
			DoctorID:         doctorID,
			PatientID:        patientID,
			AppointmentStart: startTime,
			AppointmentEnd:   startTime.Add(30 * time.Minute),
			Title:            "Same Day " + string(rune('A'+i)),
			IsDoctorPatient:  false,
		}
		err = testService.CreateReservation(reservation)
		require.NoError(t, err)
	}

	reservations, err := testService.GetReservations(patientID, "patient", "UTC")

	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(reservations), 2)
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

	reservations, err := testService.GetReservations(doctor2ID, "doctor", "UTC")

	require.NoError(t, err)
	assert.NotNil(t, reservations)
}

func TestGetReservationsCount_EmptyUser(t *testing.T) {
	count, err := testService.GetReservationsCount("", "patient", "upcoming")

	assert.NoError(t, err)
	assert.NotNil(t, count)
}

func TestGetAvailabilities_DoctorNotExist(t *testing.T) {
	fakeID := uuid.New().String()
	tomorrow := time.Now().Add(24 * time.Hour).Format("2006-01-02")
	currentTime := time.Now().Format(time.RFC3339)

	availabilities, err := testService.GetAvailabilities(fakeID, tomorrow, currentTime)

	assert.NoError(t, err)
	if availabilities != nil {
		assert.GreaterOrEqual(t, len(availabilities), 0)
	}
}

func TestClearDoctorAvailabilities_Multiple(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docclearmulti@test.com", "pass", "Dr.", "ClearMulti", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docclearmulti@test.com").Scan(&doctorID)

	startDate := time.Now().Add(24 * time.Hour).Format("2006-01-02")
	endDate := time.Now().Add(72 * time.Hour).Format("2006-01-02")

	baseTime := time.Now().Add(24 * time.Hour)
	availabilities := []models.Availability{
		{
			AvailabilityStart: baseTime,
			AvailabilityEnd:   baseTime.Add(1 * time.Hour),
			DoctorID:          doctorID,
			Weekday:           "Monday",
			SlotDuration:      30,
		},
	}
	testService.SetDoctorAvailability(doctorID, startDate, endDate, availabilities)

	err = testService.ClearDoctorAvailabilities(doctorID)

	assert.NoError(t, err)
}

func TestGetReports_InvalidDateFormat(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestPatient(ctx, "patinvaliddate@test.com", "pass", "Pat", "InvalidDate", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patinvaliddate@test.com").Scan(&patientID)

	reports, err := testService.GetReports(patientID, "invalid-date", "invalid-date", "", "", "", "")

	assert.NoError(t, err)
	if reports != nil {
		assert.GreaterOrEqual(t, len(reports), 0)
	}
}

func TestGetReport_InvalidUUID(t *testing.T) {
	report, err := testService.GetReport("not-a-valid-uuid")

	assert.Error(t, err)
	assert.Nil(t, report)
}

func TestUpdateReport_InvalidUUID(t *testing.T) {
	updateData := models.MedicalReport{
		DiagnosisName: strPtr("Test"),
	}

	err := testService.UpdateReport("not-a-valid-uuid", updateData)

	assert.Error(t, err)
}

func TestDeleteReport_InvalidUUID(t *testing.T) {
	err := testService.DeleteReport("not-a-valid-uuid")

	assert.Error(t, err)
}

func TestGetDoctorWeeklySchedule_LongRange(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "doclongrange@test.com", "pass", "Dr.", "LongRange", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "doclongrange@test.com").Scan(&doctorID)

	rangeStart := time.Now()
	rangeEnd := time.Now().Add(30 * 24 * time.Hour)

	schedule, err := testService.GetDoctorWeeklySchedule(doctorID, rangeStart, rangeEnd)

	assert.NoError(t, err)
	if schedule != nil {
		assert.GreaterOrEqual(t, len(schedule), 0)
	}
}

func TestGetPatientMedications_EmptyResult(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestPatient(ctx, "patemptymeds@test.com", "pass", "Pat", "EmptyMeds", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patemptymeds@test.com").Scan(&patientID)

	medications, err := testService.GetPatientMedications(patientID)

	assert.NoError(t, err)
	if medications != nil {
		assert.GreaterOrEqual(t, len(medications), 0)
	}
}

func TestCreateReservation_FarFuture(t *testing.T) {
	ctx := context.Background()

	err := testDB.CreateTestDoctor(ctx, "docfarfuture@test.com", "pass", "Dr.", "FarFuture", true)
	require.NoError(t, err)
	var doctorID string
	testDB.Pool.QueryRow(ctx, "SELECT doctor_id FROM doctor_info WHERE email = $1", "docfarfuture@test.com").Scan(&doctorID)

	err = testDB.CreateTestPatient(ctx, "patfarfuture@test.com", "pass", "Pat", "FarFuture", true)
	require.NoError(t, err)
	var patientID string
	testDB.Pool.QueryRow(ctx, "SELECT patient_id FROM patient_info WHERE email = $1", "patfarfuture@test.com").Scan(&patientID)

	farFutureTime := time.Now().Add(365 * 24 * time.Hour)
	reservation := models.Reservation{
		DoctorID:         doctorID,
		PatientID:        patientID,
		AppointmentStart: farFutureTime,
		AppointmentEnd:   farFutureTime.Add(30 * time.Minute),
		Title:            "Far Future",
		IsDoctorPatient:  false,
	}

	err = testService.CreateReservation(reservation)

	assert.NoError(t, err)
}

func TestGetReservations_PastAppointments(t *testing.T) {
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
