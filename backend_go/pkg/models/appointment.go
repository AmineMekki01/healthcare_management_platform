package models

import (
	"time"

	"github.com/google/uuid"
)

type Availability struct {
	AvailabilityID    string    `json:"availabilityId"`
	AvailabilityStart time.Time `json:"availabilityStart"`
	AvailabilityEnd   time.Time `json:"availabilityEnd"`
	DoctorID          string    `json:"doctorId"`
	Weekday           string    `json:"weekday"`
	SlotDuration      int       `json:"slotDuration"`
}

type Reservation struct {
	AppointmentID         uuid.UUID  `json:"appointmentId"`
	AppointmentStart      time.Time  `json:"appointmentStart"`
	AppointmentEnd        time.Time  `json:"appointmentEnd"`
	DoctorFirstName       string     `json:"doctorFirstName"`
	DoctorLastName        string     `json:"doctorLastName"`
	Specialty             string     `json:"specialty"`
	PatientFirstName      string     `json:"patientFirstName"`
	PatientLastName       string     `json:"patientLastName"`
	Age                   *int       `json:"age"`
	Title                 string     `json:"title"`
	Notes                 *string    `json:"notes"`
	PatientID             string     `json:"patientId"`
	DoctorID              string     `json:"doctorId"`
	IsDoctorPatient       bool       `json:"isDoctorPatient"`
	Canceled              bool       `json:"canceled"`
	CanceledBy            *string    `json:"canceledBy"`
	CancellationReason    *string    `json:"cancellationReason"`
	CancellationTimestamp *time.Time `json:"cancellationTimestamp"`
	ReportExists          bool       `json:"reportExists"`
}

type Appointments struct {
	AppointmentStart time.Time `json:"appointmentStart"`
	AppointmentEnd   time.Time `json:"appointmentEnd"`
	AppointmentTitle string    `json:"appointmentTitle"`
	DoctorID         string    `json:"doctorId"`
	PatientID        string    `json:"patientId"`
	AvailabilityID   string    `json:"availabilityId"`
}

type MedicalReport struct {
	ReportID           uuid.UUID          `json:"reportId"`
	PatientID          string             `json:"patientId"`
	DoctorID           uuid.UUID          `json:"doctorId"`
	AppointmentID      uuid.UUID          `json:"appointmentId"`
	PatientFirstName   string             `json:"patientFirstName"`
	PatientLastName    string             `json:"patientLastName"`
	DoctorFirstName    string             `json:"doctorFirstName"`
	DoctorLastName     string             `json:"doctorLastName"`
	ReportContent      *string            `json:"reportContent"`
	DiagnosisMade      bool               `json:"diagnosisMade"`
	DiagnosisName      *string            `json:"diagnosisName"`
	DiagnosisDetails   *string            `json:"diagnosisDetails"`
	Medications        []ReportMedication `json:"medications"`
	ReferralNeeded     bool               `json:"referralNeeded"`
	ReferralSpecialty  *string            `json:"referralSpecialty"`
	ReferralDoctorName string             `json:"referralDoctorName"`
	ReferralMessage    string             `json:"referralMessage"`
	CreatedAt          time.Time          `json:"createdAt"`
}

type ReportMedication struct {
	MedicationName string  `json:"medicationName"`
	Dosage         string  `json:"dosage"`
	Frequency      string  `json:"frequency"`
	Duration       string  `json:"duration"`
	Instructions   *string `json:"instructions"`
}

type DoctorException struct {
	Date      string `json:"date"`
	StartTime string `json:"startTime"`
	EndTime   string `json:"endTime"`
	Type      string `json:"type"`
}

type WeeklyScheduleEntry struct {
	Weekday      string `json:"weekday"`
	Enabled      bool   `json:"enabled"`
	Start        string `json:"start"`
	End          string `json:"end"`
	SlotDuration int    `json:"slotDuration"`
}
