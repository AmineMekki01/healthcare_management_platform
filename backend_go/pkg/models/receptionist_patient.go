package models

import (
	"time"

	"github.com/google/uuid"
)

type PatientSearchRequest struct {
	DoctorID    string `json:"doctorId"`
	SearchQuery string `json:"searchQuery"`
	Status      string `json:"status"`
	DateFrom    string `json:"dateFrom"`
	DateTo      string `json:"dateTo"`
	Limit       int    `json:"limit"`
	Offset      int    `json:"offset"`
}

type PatientSearchResult struct {
	PatientID             uuid.UUID  `json:"patientId"`
	FirstName             string     `json:"firstName"`
	LastName              string     `json:"lastName"`
	Email                 string     `json:"email"`
	PhoneNumber           *string    `json:"phoneNumber"`
	Age                   *int       `json:"age"`
	Sex                   *string    `json:"sex"`
	ProfilePictureURL     *string    `json:"profilePictureUrl"`
	LastAppointmentDate   *time.Time `json:"lastAppointmentDate"`
	TotalAppointments     int        `json:"totalAppointments"`
	CompletedAppointments int        `json:"completedAppointments"`
	CanceledAppointments  int        `json:"canceledAppointments"`
	HasActiveAppointments bool       `json:"hasActiveAppointments"`
}

type PatientDetailedInfo struct {
	PatientID         uuid.UUID `json:"patientId"`
	Username          string    `json:"username"`
	FirstName         string    `json:"firstName"`
	LastName          string    `json:"lastName"`
	Email             string    `json:"email"`
	PhoneNumber       *string   `json:"phoneNumber"`
	Age               *int      `json:"age"`
	Sex               *string   `json:"sex"`
	BirthDate         *string   `json:"birthDate"`
	StreetAddress     *string   `json:"streetAddress"`
	CityName          *string   `json:"cityName"`
	StateName         *string   `json:"stateName"`
	ZipCode           *string   `json:"zipCode"`
	CountryName       *string   `json:"countryName"`
	Bio               *string   `json:"bio"`
	Location          *string   `json:"location"`
	ProfilePictureURL *string   `json:"profilePictureUrl"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

type PatientAppointmentDetail struct {
	AppointmentID         uuid.UUID  `json:"appointmentId"`
	AppointmentStart      time.Time  `json:"appointmentStart"`
	AppointmentEnd        time.Time  `json:"appointmentEnd"`
	AppointmentType       string     `json:"appointmentType"`
	Status                string     `json:"status"`
	DoctorFirstName       string     `json:"doctorFirstName"`
	DoctorLastName        string     `json:"doctorLastName"`
	DoctorSpecialty       string     `json:"doctorSpecialty"`
	Canceled              bool       `json:"canceled"`
	CanceledBy            *string    `json:"canceledBy"`
	CancellationReason    *string    `json:"cancellationReason"`
	CancellationTimestamp *time.Time `json:"cancellationTimestamp"`
	CreatedAt             time.Time  `json:"createdAt"`

	HasMedicalReport    bool                 `json:"hasMedicalReport"`
	MedicalReport       *MedicalReport       `json:"medicalReport,omitempty"`
	DiagnosisHistory    []DiagnosisHistory   `json:"diagnosisHistory,omitempty"`
	PrescribedMedicines []PrescribedMedicine `json:"prescribedMedicines,omitempty"`
}

type DiagnosisHistory struct {
	ID               int       `json:"id"`
	AppointmentID    uuid.UUID `json:"appointmentId"`
	DiagnosisName    string    `json:"diagnosisName"`
	DiagnosisDetails string    `json:"diagnosisDetails"`
	DiagnosisDate    time.Time `json:"diagnosisDate"`
	DoctorName       string    `json:"doctorName"`
	Severity         string    `json:"severity"`
	Status           string    `json:"status"`
	Notes            string    `json:"notes"`
	CreatedAt        time.Time `json:"createdAt"`
}

type PrescribedMedicine struct {
	ID             int       `json:"id"`
	AppointmentID  uuid.UUID `json:"appointmentId"`
	MedicineName   string    `json:"medicineName"`
	Dosage         string    `json:"dosage"`
	Frequency      string    `json:"frequency"`
	Duration       string    `json:"duration"`
	Instructions   string    `json:"instructions"`
	PrescribedDate time.Time `json:"prescribedDate"`
	DoctorName     string    `json:"doctorName"`
	IsActive       bool      `json:"isActive"`
	CreatedAt      time.Time `json:"createdAt"`
}

type CreatePatientRequest struct {
	Username          string `json:"username" binding:"required"`
	FirstName         string `json:"firstName" binding:"required"`
	LastName          string `json:"lastName" binding:"required"`
	Email             string `json:"email" binding:"required,email"`
	Password          string `json:"password" binding:"required,min=6"`
	PhoneNumber       string `json:"phoneNumber" binding:"required"`
	Age               int    `json:"age" binding:"required"`
	Sex               string `json:"sex" binding:"required"`
	BirthDate         string `json:"birthDate" binding:"required"`
	StreetAddress     string `json:"streetAddress"`
	CityName          string `json:"cityName" binding:"required"`
	StateName         string `json:"stateName" binding:"required"`
	ZipCode           string `json:"zipCode"`
	CountryName       string `json:"countryName" binding:"required"`
	Bio               string `json:"bio"`
	Location          string `json:"location"`
	ProfilePictureURL string `json:"profilePictureUrl"`
}

type CreateAppointmentRequest struct {
	PatientID        string `json:"patientId" binding:"required"`
	DoctorID         string `json:"doctorId" binding:"required"`
	AppointmentStart string `json:"appointmentStart" binding:"required"`
	AppointmentEnd   string `json:"appointmentEnd" binding:"required"`
	AppointmentType  string `json:"appointmentType" binding:"required"`
	Notes            string `json:"notes"`
	CreatedBy        string `json:"createdBy"`
	Title            string `json:"title" binding:"required"`
}

type AppointmentStats struct {
	TotalAppointments     int `json:"totalAppointments"`
	TodayAppointments     int `json:"todayAppointments"`
	UpcomingAppointments  int `json:"upcomingAppointments"`
	CompletedAppointments int `json:"completedAppointments"`
	CanceledAppointments  int `json:"canceledAppointments"`
	NoShowAppointments    int `json:"noShowAppointments"`
}

type PatientStats struct {
	TotalPatients    int `json:"totalPatients"`
	NewPatientsToday int `json:"newPatientsToday"`
	NewPatientsWeek  int `json:"newPatientsWeek"`
	NewPatientsMonth int `json:"newPatientsMonth"`
	ActivePatients   int `json:"activePatients"`
	InactivePatients int `json:"inactivePatients"`
}
