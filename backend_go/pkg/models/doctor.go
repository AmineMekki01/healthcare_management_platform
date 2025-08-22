package models

import (
	"github.com/google/uuid"
)

type Doctor struct {
	DoctorID          uuid.UUID             `json:"doctorId"`
	Username          string                `json:"username"`
	FirstName         string                `json:"firstName"`
	LastName          string                `json:"lastName"`
	Password          string                `json:"password"`
	Age               int                   `json:"age"`
	Sex               string                `json:"sex"`
	Specialty         string                `json:"specialty"`
	Experience        string                `json:"experience"`
	MedicalLicense    string                `json:"medicalLicense"`
	Bio               string                `json:"bio"`
	Email             string                `json:"email"`
	PhoneNumber       string                `json:"phoneNumber"`
	StreetAddress     string                `json:"streetAddress"`
	CityName          string                `json:"cityName"`
	StateName         string                `json:"stateName"`
	ZipCode           string                `json:"zipCode"`
	CountryName       string                `json:"countryName"`
	Latitude          float64               `json:"latitude"`
	Longitude         float64               `json:"longitude"`
	BirthDate         string                `json:"birthDate"`
	Location          string                `json:"location"`
	RatingScore       *float32              `json:"ratingScore"`
	RatingCount       int                   `json:"ratingCount"`
	Hospitals         []DoctorHospital      `json:"hospitals"`
	Organizations     []DoctorOrganization  `json:"organizations"`
	Awards            []DoctorAward         `json:"awards"`
	Certifications    []DoctorCertification `json:"certifications"`
	Languages         []DoctorLanguage      `json:"languages"`
	ProfilePictureURL string                `json:"profilePictureUrl"`
	DoctorDistance    float64               `json:"distance"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type DoctorHospital struct {
	ID           string    `json:"id"`
	DoctorID     uuid.UUID `json:"doctorId"`
	HospitalName string    `json:"hospitalName"`
	Position     string    `json:"position"`
	StartDate    *string   `json:"startDate"`
	EndDate      *string   `json:"endDate"`
	Description  *string   `json:"description"`
}

type DoctorOrganization struct {
	ID               string    `json:"id"`
	DoctorID         uuid.UUID `json:"doctorId"`
	OrganizationName string    `json:"organizationName"`
	Role             string    `json:"role"`
	StartDate        *string   `json:"startDate"`
	EndDate          *string   `json:"endDate"`
	Description      *string   `json:"description"`
}

type DoctorAward struct {
	ID                  string    `json:"id"`
	DoctorID            uuid.UUID `json:"doctorId"`
	AwardName           string    `json:"awardName"`
	DateAwarded         *string   `json:"dateAwarded"`
	IssuingOrganization string    `json:"issuingOrganization"`
	Description         *string   `json:"description"`
}

type DoctorCertification struct {
	ID                string    `json:"id"`
	DoctorID          uuid.UUID `json:"doctorId"`
	CertificationName string    `json:"certificationName"`
	IssuedBy          string    `json:"issuedBy"`
	IssueDate         *string   `json:"issueDate"`
	ExpirationDate    *string   `json:"expirationDate"`
	Description       *string   `json:"description"`
}

type DoctorLanguage struct {
	ID               string    `json:"id"`
	DoctorID         uuid.UUID `json:"doctorId"`
	LanguageName     string    `json:"languageName"`
	ProficiencyLevel string    `json:"proficiencyLevel"`
}
