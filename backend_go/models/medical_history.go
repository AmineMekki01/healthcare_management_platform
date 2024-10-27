package models

import (
	"time"

	"github.com/google/uuid"
)

type MedicalHistory struct {
	DiagnosisHistoryID  uuid.UUID `json:"DiagnosisHistoryID"`
	DiagnosisName       string    `json:"DiagnosisName"`
	DiagnosisDetails    string    `json:"DiagnosisDetails"`
	DiagnosisDoctorName string    `json:"DiagnosisDoctorName"`
	DiagnosisDoctorID   uuid.UUID `json:"DiagnosisDoctorID"`
	CreatedAt           time.Time `json:"CreatedAt"`
	UpdatedAt           time.Time `json:"UpdatedAt"`
	PatientID           uuid.UUID `json:"PatientID"`
}

type Medications struct {
	MedicationID          uuid.UUID `json:"MedicationID"`
	MedicationName        string    `json:"MedicationName"`
	PrescribingDoctorName string    `json:"PrescribingDoctorName"`
	PrescribingDoctorID   uuid.UUID `json:"PrescribingDoctorID"`
	CreatedAt             time.Time `json:"CreatedAt"`
	UpdatedAt             time.Time `json:"UpdatedAt"`
}
