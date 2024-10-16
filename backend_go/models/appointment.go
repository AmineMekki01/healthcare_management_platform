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
	ReservationID    uuid.UUID `json:"reservation_id"`
	ReservationStart time.Time `json:"reservation_start"`
	ReservationEnd   time.Time `json:"reservation_end"`
	DoctorFirstName  string    `json:"doctor_first_name"`
	DoctorLastName   string    `json:"doctor_last_name"`
	Specialty        string    `json:"specialty"`
	PatientFirstName string    `json:"patient_first_name"`
	PatientLastName  string    `json:"patient_last_name"`
	Age              int       `json:"age"`
	PatientID        string    `json:"patient_id"`
	DoctorID         string    `json:"doctor_id"`
	IsDoctorPatient  bool      `json:"is_doctor_patient"`
}

type Appointments struct {
	AppointmentStart time.Time `json:"AppointmentStart"`
	AppointmentEnd   time.Time `json:"AppointmentEnd"`
	AppointmentTitle string    `json:"AppointmentTitle"`
	DoctorID         string    `json:"DoctorID"`
	PatientID        string    `json:"PatientID"`
	AvailabilityID   int       `json:"AvailabilityID"`
}
