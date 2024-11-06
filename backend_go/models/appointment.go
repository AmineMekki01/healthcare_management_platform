package models

import (
	"time"

	"github.com/google/uuid"
)

type Availability struct {
	AvailabilityID    int       `json:"AvailabilityId"`
	AvailabilityStart time.Time `json:"AvailabilityStart"`
	AvailabilityEnd   time.Time `json:"AvailabilityEnd"`
	DoctorID          string    `json:"DoctorId"`
}

type Reservation struct {
	ReservationID         uuid.UUID  `json:"reservation_id"`
	ReservationStart      time.Time  `json:"reservation_start"`
	ReservationEnd        time.Time  `json:"reservation_end"`
	DoctorFirstName       string     `json:"doctor_first_name"`
	DoctorLastName        string     `json:"doctor_last_name"`
	Specialty             string     `json:"specialty"`
	PatientFirstName      string     `json:"patient_first_name"`
	PatientLastName       string     `json:"patient_last_name"`
	Age                   int        `json:"age"`
	PatientID             string     `json:"patient_id"`
	DoctorID              string     `json:"doctor_id"`
	IsDoctorPatient       bool       `json:"is_doctor_patient"`
	Canceled              bool       `json:canceled`
	CanceledBy            *string    `json:canceled_by`
	CancellationReason    *string    `json:cancellation_reason`
	CancellationTimestamp *time.Time `json:cancellation_timestamp`
	ReportExists          bool       `json:"report_exist"`
}

type Appointments struct {
	AppointmentStart time.Time `json:"AppointmentStart"`
	AppointmentEnd   time.Time `json:"AppointmentEnd"`
	AppointmentTitle string    `json:"AppointmentTitle"`
	DoctorID         string    `json:"DoctorID"`
	PatientID        string    `json:"PatientID"`
	AvailabilityID   int       `json:"AvailabilityID"`
}

type MedicalReport struct {
	ReportID           uuid.UUID `json:"report_id"`
	PatientID          string    `json:"patient_id"`
	DoctorID           uuid.UUID `json:"doctor_id"`
	AppointmentID      uuid.UUID `json:"appointment_id"`
	PatientFirstName   string    `json:"patient_first_name"`
	PatientLastName    string    `json:"patient_last_name"`
	DoctorFirstName    string    `json:"doctor_first_name"`
	DoctorLastName     string    `json:"doctor_last_name"`
	ReportContent      string    `json:"report_content"`
	DiagnosisMade      bool      `json:"diagnosis_made"`
	DiagnosisName      string    `json:"diagnosis_name"`
	DiagnosisDetails   string    `json:"diagnosis_details"`
	ReferralNeeded     bool      `json:"referral_needed"`
	ReferralSpecialty  string    `json:"referral_specialty"`
	ReferralDoctorName string    `json:"referral_doctor_name"`
	ReferralMessage    string    `json:"referral_message"`
	CreatedAt          time.Time `json:"created_at"`
}
