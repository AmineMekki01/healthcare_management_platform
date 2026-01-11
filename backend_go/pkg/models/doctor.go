package models

import (
	"time"

	"github.com/google/uuid"
)

type Doctor struct {
	DoctorID               uuid.UUID             `json:"doctorId"`
	Username               string                `json:"username"`
	FirstName              string                `json:"firstName"`
	FirstNameAr            string                `json:"firstNameAr"`
	LastName               string                `json:"lastName"`
	LastNameAr             string                `json:"lastNameAr"`
	Password               string                `json:"password"`
	Age                    int                   `json:"age"`
	Sex                    string                `json:"sex"`
	SpecialtyCode          string                `json:"specialtyCode"`
	Specialty              string                `json:"specialty"`
	Experience             string                `json:"experience"`
	MedicalLicense         string                `json:"medicalLicense"`
	Bio                    string                `json:"bio"`
	BioAr                  string                `json:"bioAr"`
	BioFr                  string                `json:"bioFr"`
	Email                  string                `json:"email"`
	PhoneNumber            string                `json:"phoneNumber"`
	ClinicPhoneNumber      string                `json:"clinicPhoneNumber"`
	ShowClinicPhone        bool                  `json:"showClinicPhone"`
	StreetAddress          string                `json:"streetAddress"`
	StreetAddressAr        string                `json:"streetAddressAr"`
	StreetAddressFr        string                `json:"streetAddressFr"`
	CityName               string                `json:"cityName"`
	CityNameAr             string                `json:"cityNameAr"`
	CityNameFr             string                `json:"cityNameFr"`
	StateName              string                `json:"stateName"`
	StateNameAr            string                `json:"stateNameAr"`
	StateNameFr            string                `json:"stateNameFr"`
	ZipCode                string                `json:"zipCode"`
	CountryName            string                `json:"countryName"`
	CountryNameAr          string                `json:"countryNameAr"`
	CountryNameFr          string                `json:"countryNameFr"`
	Latitude               float64               `json:"latitude"`
	Longitude              float64               `json:"longitude"`
	BirthDate              string                `json:"birthDate"`
	Location               string                `json:"location"`
	LocationAr             string                `json:"locationAr"`
	LocationFr             string                `json:"locationFr"`
	RatingScore            *float32              `json:"ratingScore"`
	RatingCount            int                   `json:"ratingCount"`
	Hospitals              []DoctorHospital      `json:"hospitals"`
	Organizations          []DoctorOrganization  `json:"organizations"`
	Awards                 []DoctorAward         `json:"awards"`
	Certifications         []DoctorCertification `json:"certifications"`
	Languages              []DoctorLanguage      `json:"languages"`
	ProfilePictureURL      string                `json:"profilePictureUrl"`
	ConsultationFee        int                   `json:"consultationFee"`
	AcceptedInsurances     []InsuranceProvider   `json:"acceptedInsurances,omitempty"`
	AcceptedInsuranceCodes []string              `json:"acceptedInsuranceCodes,omitempty"`
	DoctorDistance         float64               `json:"distance"`
	NextAvailableSlotStart *time.Time            `json:"nextAvailableSlotStart,omitempty"`
	NextAvailableSlotEnd   *time.Time            `json:"nextAvailableSlotEnd,omitempty"`
}

type InsuranceProvider struct {
	ProviderID uuid.UUID `json:"providerId"`
	Code       string    `json:"code"`
	Name       string    `json:"name"`
	NameAr     string    `json:"nameAr"`
	NameFr     string    `json:"nameFr"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type DoctorHospital struct {
	ID             string    `json:"id"`
	DoctorID       uuid.UUID `json:"doctorId"`
	HospitalName   string    `json:"hospitalName"`
	HospitalNameAr string    `json:"hospitalNameAr"`
	HospitalNameFr string    `json:"hospitalNameFr"`
	Position       string    `json:"position"`
	PositionAr     string    `json:"positionAr"`
	PositionFr     string    `json:"positionFr"`
	StartDate      *string   `json:"startDate"`
	EndDate        *string   `json:"endDate"`
	Description    *string   `json:"description"`
	DescriptionAr  *string   `json:"descriptionAr"`
	DescriptionFr  *string   `json:"descriptionFr"`
}

type DoctorOrganization struct {
	ID                 string    `json:"id"`
	DoctorID           uuid.UUID `json:"doctorId"`
	OrganizationName   string    `json:"organizationName"`
	OrganizationNameAr string    `json:"organizationNameAr"`
	OrganizationNameFr string    `json:"organizationNameFr"`
	Role               string    `json:"role"`
	RoleAr             string    `json:"roleAr"`
	RoleFr             string    `json:"roleFr"`
	StartDate          *string   `json:"startDate"`
	EndDate            *string   `json:"endDate"`
	Description        *string   `json:"description"`
	DescriptionAr      *string   `json:"descriptionAr"`
	DescriptionFr      *string   `json:"descriptionFr"`
}

type DoctorAward struct {
	ID                    string    `json:"id"`
	DoctorID              uuid.UUID `json:"doctorId"`
	AwardName             string    `json:"awardName"`
	AwardNameAr           string    `json:"awardNameAr"`
	AwardNameFr           string    `json:"awardNameFr"`
	DateAwarded           *string   `json:"dateAwarded"`
	IssuingOrganization   string    `json:"issuingOrganization"`
	IssuingOrganizationAr string    `json:"issuingOrganizationAr"`
	IssuingOrganizationFr string    `json:"issuingOrganizationFr"`
	Description           *string   `json:"description"`
	DescriptionAr         *string   `json:"descriptionAr"`
	DescriptionFr         *string   `json:"descriptionFr"`
}

type DoctorCertification struct {
	ID                  string    `json:"id"`
	DoctorID            uuid.UUID `json:"doctorId"`
	CertificationName   string    `json:"certificationName"`
	CertificationNameAr string    `json:"certificationNameAr"`
	CertificationNameFr string    `json:"certificationNameFr"`
	IssuedBy            string    `json:"issuedBy"`
	IssuedByAr          string    `json:"issuedByAr"`
	IssuedByFr          string    `json:"issuedByFr"`
	IssueDate           *string   `json:"issueDate"`
	ExpirationDate      *string   `json:"expirationDate"`
	Description         *string   `json:"description"`
	DescriptionAr       *string   `json:"descriptionAr"`
	DescriptionFr       *string   `json:"descriptionFr"`
}

type DoctorLanguage struct {
	ID                 string    `json:"id"`
	DoctorID           uuid.UUID `json:"doctorId"`
	LanguageName       string    `json:"languageName"`
	LanguageNameAr     string    `json:"languageNameAr"`
	LanguageNameFr     string    `json:"languageNameFr"`
	ProficiencyLevel   string    `json:"proficiencyLevel"`
	ProficiencyLevelAr string    `json:"proficiencyLevelAr"`
	ProficiencyLevelFr string    `json:"proficiencyLevelFr"`
}
