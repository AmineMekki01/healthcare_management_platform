package models

import (
	"time"

	"github.com/google/uuid"
)

type ReceptionistExperience struct {
	ExperienceID     uuid.UUID  `json:"experienceId"`
	ReceptionistID   uuid.UUID  `json:"receptionistId"`
	OrganizationName string     `json:"organizationName"`
	PositionTitle    string     `json:"positionTitle"`
	Location         *string    `json:"location"`
	StartDate        time.Time  `json:"startDate"`
	EndDate          *time.Time `json:"endDate"`
	Description      *string    `json:"description"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}

type Receptionist struct {
	ReceptionistID    uuid.UUID                `json:"receptionistId"`
	Username          string                   `json:"username"`
	FirstName         string                   `json:"firstName"`
	LastName          string                   `json:"lastName"`
	Sex               string                   `json:"sex"`
	Password          string                   `json:"password,omitempty"`
	Email             string                   `json:"email"`
	PhoneNumber       string                   `json:"phoneNumber"`
	StreetAddress     string                   `json:"streetAddress"`
	CityName          string                   `json:"cityName"`
	StateName         string                   `json:"stateName"`
	ZipCode           string                   `json:"zipCode"`
	CountryName       string                   `json:"countryName"`
	BirthDate         *time.Time               `json:"birthDate"`
	Bio               string                   `json:"bio"`
	ProfilePictureURL string                   `json:"profilePictureUrl"`
	AssignedDoctorID  *uuid.UUID               `json:"assignedDoctorId"`
	IsActive          bool                     `json:"isActive"`
	EmailVerified     bool                     `json:"emailVerified"`
	Experiences       []ReceptionistExperience `json:"experiences"`
	ExperienceYears   float64                  `json:"experienceYears"`
	CreatedAt         time.Time                `json:"createdAt"`
	UpdatedAt         time.Time                `json:"updatedAt"`
}

type ReceptionistExperienceCreateRequest struct {
	OrganizationName string  `json:"organizationName" binding:"required"`
	PositionTitle    string  `json:"positionTitle" binding:"required"`
	Location         *string `json:"location"`
	StartDate        string  `json:"startDate" binding:"required"`
	EndDate          *string `json:"endDate"`
	Description      *string `json:"description"`
}

type ReceptionistRegisterRequest struct {
	ReceptionistID    string                                `json:"receptionistId"`
	Username          string                                `json:"username" binding:"required"`
	FirstName         string                                `json:"firstName" binding:"required"`
	LastName          string                                `json:"lastName" binding:"required"`
	Sex               string                                `json:"sex" binding:"required"`
	Email             string                                `json:"email" binding:"required,email"`
	Password          string                                `json:"password" binding:"required,min=6"`
	PhoneNumber       string                                `json:"phoneNumber" binding:"required"`
	ProfilePictureURL string                                `json:"profilePhotoUrl"`
	StreetAddress     string                                `json:"streetAddress"`
	CityName          string                                `json:"cityName" binding:"required"`
	StateName         string                                `json:"stateName" binding:"required"`
	ZipCode           string                                `json:"zipCode"`
	CountryName       string                                `json:"countryName" binding:"required"`
	BirthDate         string                                `json:"birthDate"`
	Bio               string                                `json:"bio"`
	AssignedDoctorID  string                                `json:"assignedDoctorId"`
	Experiences       []ReceptionistExperienceCreateRequest `json:"experiences"`
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
