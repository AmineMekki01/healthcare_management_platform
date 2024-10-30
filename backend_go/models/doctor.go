package models

import (
	"github.com/google/uuid"
)

type Doctor struct {
	DoctorID          uuid.UUID             `json:"DoctorId"`
	Username          string                `json:"Username"`
	FirstName         string                `json:"FirstName"`
	LastName          string                `json:"LastName"`
	Password          string                `json:"Password"`
	Age               int                   `json:"age"`
	Sex               string                `json:"Sex"`
	Specialty         string                `json:"Specialty"`
	Experience        string                `json:"Experience"`
	MedicalLicense    string                `json:"MedicalLicense"`
	Bio               string                `json:"Bio"`
	Email             string                `json:"Email"`
	PhoneNumber       string                `json:"PhoneNumber"`
	StreetAddress     string                `json:"StreetAddress"`
	CityName          string                `json:"CityName"`
	StateName         string                `json:"StateName"`
	ZipCode           string                `json:"ZipCode"`
	CountryName       string                `json:"CountryName"`
	Latitude          float64               `json:"latitude"`
	Longitude         float64               `json:"longitude"`
	BirthDate         string                `json:"BirthDate"`
	Location          string                `json:"Location"`
	RatingScore       *float32              `json:"RatingScore"`
	RatingCount       int                   `json:"RatingCount"`
	Hospitals         []DoctorHospital      `json:"Hospitals"`
	Organizations     []DoctorOrganization  `json:"Organizations"`
	Awards            []DoctorAward         `json:"Awards"`
	Certifications    []DoctorCertification `json:"Certifications"`
	Languages         []DoctorLanguage      `json:"Languages"`
	ProfilePictureURL string                `json:"ProfilePictureUrl"`
	DoctorDistance    float64               `json:"Distance"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type DoctorHospital struct {
	ID           int       `json:"id"`
	DoctorID     uuid.UUID `json:"doctor_id"`
	HospitalName string    `json:"hospital_name"`
	Position     string    `json:"position"`
	StartDate    *string   `json:"start_date"`
	EndDate      *string   `json:"end_date"`
	Description  string    `json:"description"`
}

type DoctorOrganization struct {
	ID               int       `json:"id"`
	DoctorID         uuid.UUID `json:"doctor_id"`
	OrganizationName string    `json:"organization_name"`
	Role             string    `json:"role"`
	StartDate        *string   `json:"start_date"`
	EndDate          *string   `json:"end_date"`
	Description      string    `json:"description"`
}

type DoctorAward struct {
	ID                  int       `json:"id"`
	DoctorID            uuid.UUID `json:"doctor_id"`
	AwardName           string    `json:"award_name"`
	DateAwarded         *string   `json:"date_awarded"`
	IssuingOrganization string    `json:"issuing_organization"`
	Description         string    `json:"description"`
}

type DoctorCertification struct {
	ID                int       `json:"id"`
	DoctorID          uuid.UUID `json:"doctor_id"`
	CertificationName string    `json:"certification_name"`
	IssuedBy          string    `json:"issued_by"`
	IssueDate         *string   `json:"issue_date"`
	ExpirationDate    *string   `json:"expiration_date"`
	Description       string    `json:"description"`
}

type DoctorLanguage struct {
	ID               int       `json:"id"`
	DoctorID         uuid.UUID `json:"doctor_id"`
	LanguageName     string    `json:"language_name"`
	ProficiencyLevel string    `json:"proficiency_level"`
}
