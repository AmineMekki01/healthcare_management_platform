package models

import (
	"time"

	"github.com/google/uuid"
)

type Receptionist struct {
	ReceptionistID    uuid.UUID  `json:"receptionistId"`
	Username          string     `json:"username"`
	FirstName         string     `json:"firstName"`
	LastName          string     `json:"lastName"`
	Sex               string     `json:"sex"`
	Password          string     `json:"password,omitempty"`
	Email             string     `json:"email"`
	PhoneNumber       string     `json:"phoneNumber"`
	StreetAddress     string     `json:"streetAddress"`
	CityName          string     `json:"cityName"`
	StateName         string     `json:"stateName"`
	ZipCode           string     `json:"zipCode"`
	CountryName       string     `json:"countryName"`
	BirthDate         *time.Time `json:"birthDate"`
	Bio               string     `json:"bio"`
	ProfilePictureURL string     `json:"profilePictureUrl"`
	AssignedDoctorID  *uuid.UUID `json:"assignedDoctorId"`
	IsActive          bool       `json:"isActive"`
	EmailVerified     bool       `json:"emailVerified"`
	CreatedAt         time.Time  `json:"createdAt"`
	UpdatedAt         time.Time  `json:"updatedAt"`
}

type ReceptionistWorkSchedule struct {
	ID             int       `json:"id"`
	ReceptionistID uuid.UUID `json:"receptionistId"`
	DayOfWeek      int       `json:"dayOfWeek"`
	StartTime      string    `json:"startTime"`
	EndTime        string    `json:"endTime"`
	IsActive       bool      `json:"isActive"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

type ReceptionistPermission struct {
	ID              int       `json:"id"`
	ReceptionistID  uuid.UUID `json:"receptionistId"`
	PermissionType  string    `json:"permissionType"`
	PermissionLevel string    `json:"permissionLevel"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

type ReceptionistActivity struct {
	ID             int       `json:"id"`
	ReceptionistID uuid.UUID `json:"receptionistId"`
	ActivityType   string    `json:"activityType"`
	Description    string    `json:"description"`
	RelatedID      *string   `json:"relatedId"`
	CreatedAt      time.Time `json:"createdAt"`
}

type DocumentVerification struct {
	ID             int        `json:"id"`
	PatientID      uuid.UUID  `json:"patientId"`
	ReceptionistID uuid.UUID  `json:"receptionistId"`
	DocumentType   string     `json:"documentType"`
	DocumentURL    string     `json:"documentUrl"`
	Status         string     `json:"status"`
	Notes          string     `json:"notes"`
	VerifiedAt     *time.Time `json:"verifiedAt"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`

	PatientName string `json:"patientName,omitempty"`
}

type ReceptionistRegisterRequest struct {
	Username          string                `json:"username" binding:"required"`
	FirstName         string                `json:"firstName" binding:"required"`
	LastName          string                `json:"lastName" binding:"required"`
	Sex               string                `json:"sex" binding:"required"`
	Email             string                `json:"email" binding:"required,email"`
	Password          string                `json:"password" binding:"required,min=6"`
	PhoneNumber       string                `json:"phoneNumber" binding:"required"`
	ProfilePictureURL string                `json:"profilePhotoUrl"`
	StreetAddress     string                `json:"streetAddress"`
	CityName          string                `json:"cityName" binding:"required"`
	StateName         string                `json:"stateName" binding:"required"`
	ZipCode           string                `json:"zipCode"`
	CountryName       string                `json:"countryName" binding:"required"`
	BirthDate         string                `json:"birthDate"`
	Bio               string                `json:"bio"`
	AssignedDoctorID  string                `json:"assignedDoctorId"`
	Permissions       []PermissionRequest   `json:"permissions"`
	WorkSchedule      []WorkScheduleRequest `json:"workSchedule"`
}
type PermissionRequest struct {
	PermissionType  string `json:"permissionType" binding:"required"`
	PermissionLevel string `json:"permissionLevel" binding:"required"`
}

type WorkScheduleRequest struct {
	DayOfWeek int    `json:"dayOfWeek" binding:"required,min=1,max=7"`
	StartTime string `json:"startTime" binding:"required"`
	EndTime   string `json:"endTime" binding:"required"`
}

type ReceptionistLoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type ReceptionistProfileUpdateRequest struct {
	FirstName     string `json:"firstName"`
	LastName      string `json:"lastName"`
	PhoneNumber   string `json:"phoneNumber"`
	StreetAddress string `json:"streetAddress"`
	CityName      string `json:"cityName"`
	StateName     string `json:"stateName"`
	ZipCode       string `json:"zipCode"`
	CountryName   string `json:"countryName"`
	Bio           string `json:"bio"`
}

type ReceptionistDashboardStats struct {
	TotalAppointments     int `json:"totalAppointments"`
	ConfirmedAppointments int `json:"confirmedAppointments"`
	PendingVerifications  int `json:"pendingVerifications"`
	NewPatients           int `json:"newPatients"`
}

type AppointmentTrend struct {
	Date         string `json:"date"`
	Appointments int    `json:"appointments"`
}

type DocumentVerificationRequest struct {
	Status string `json:"status" binding:"required,oneof=approved rejected"`
	Notes  string `json:"notes"`
}

type AppointmentBookingRequest struct {
	PatientID        string `json:"patientId" binding:"required"`
	DoctorID         string `json:"doctorId" binding:"required"`
	AppointmentStart string `json:"appointmentStart" binding:"required"`
	AppointmentEnd   string `json:"appointmentEnd" binding:"required"`
	AppointmentType  string `json:"appointmentType" binding:"required"`
	Notes            string `json:"notes"`
}

type AppointmentUpdateRequest struct {
	AppointmentStart string `json:"appointmentStart"`
	AppointmentEnd   string `json:"appointmentEnd"`
	AppointmentType  string `json:"appointmentType"`
	Status           string `json:"status"`
	Notes            string `json:"notes"`
}

type AppointmentHistoryFilters struct {
	Status   string `json:"status"`
	DateFrom string `json:"dateFrom"`
	DateTo   string `json:"dateTo"`
}

type PatientAppointmentHistoryFilters struct {
	PatientName     string `json:"patientName"`
	DoctorID        string `json:"doctorId"`
	Status          string `json:"status"`
	AppointmentType string `json:"appointmentType"`
	DateFrom        string `json:"dateFrom"`
	DateTo          string `json:"dateTo"`
}
