package models

import (
	"time"

	"github.com/google/uuid"
)

type MedicalHistory struct {
	DiagnosisHistoryID  uuid.UUID `json:"diagnosisHistoryId"`
	DiagnosisName       string    `json:"diagnosisName"`
	DiagnosisDetails    string    `json:"diagnosisDetails"`
	DiagnosisDoctorName string    `json:"diagnosisDoctorName"`
	DiagnosisDoctorID   uuid.UUID `json:"diagnosisDoctorId"`
	CreatedAt           time.Time `json:"createdAt"`
	UpdatedAt           time.Time `json:"updatedAt"`
	PatientID           uuid.UUID `json:"patientId"`
}

type Medications struct {
	MedicationID          uuid.UUID  `json:"medicationId"`
	PatientID             uuid.UUID  `json:"patientId"`
	MedicationName        string     `json:"medicationName"`
	Dosage                string     `json:"dosage"`
	Frequency             string     `json:"frequency"`
	Duration              string     `json:"duration"`
	Instructions          *string    `json:"instructions"`
	PrescribingDoctorName string     `json:"prescribingDoctorName"`
	PrescribingDoctorID   uuid.UUID  `json:"prescribingDoctorId"`
	ReportID              *uuid.UUID `json:"reportId"`
	CreatedAt             time.Time  `json:"createdAt"`
	UpdatedAt             time.Time  `json:"updatedAt"`
}
