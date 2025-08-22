package models

import (
	"time"

	"github.com/google/uuid"
)

type StandardUserProfile struct {
	ID                string                    `json:"id"`
	UserType          string                    `json:"userType"`
	FirstName         string                    `json:"firstName"`
	LastName          string                    `json:"lastName"`
	Email             string                    `json:"email"`
	PhoneNumber       string                    `json:"phoneNumber"`
	Bio               string                    `json:"bio"`
	StreetAddress     string                    `json:"streetAddress"`
	CityName          string                    `json:"cityName"`
	StateName         string                    `json:"stateName"`
	ZipCode           string                    `json:"zipCode"`
	CountryName       string                    `json:"countryName"`
	BirthDate         string                    `json:"birthDate"`
	Sex               string                    `json:"sex"`
	Age               int                       `json:"age"`
	ProfilePictureURL string                    `json:"profilePictureUrl"`
	IsActive          bool                      `json:"isActive"`
	EmailVerified     bool                      `json:"emailVerified"`
	CreatedAt         string                    `json:"createdAt"`
	UpdatedAt         string                    `json:"updatedAt"`
	DoctorInfo        *DoctorSpecificInfo       `json:"doctorInfo,omitempty"`
	PatientInfo       *PatientSpecificInfo      `json:"patientInfo,omitempty"`
	ReceptionistInfo  *ReceptionistSpecificInfo `json:"receptionistInfo,omitempty"`
}

type DoctorSpecificInfo struct {
	Specialty      string                `json:"specialty"`
	Experience     string                `json:"experience"`
	MedicalLicense string                `json:"medicalLicense"`
	RatingScore    *float32              `json:"ratingScore"`
	RatingCount    int                   `json:"ratingCount"`
	Latitude       float64               `json:"latitude"`
	Longitude      float64               `json:"longitude"`
	Location       string                `json:"location"`
	Hospitals      []DoctorHospital      `json:"hospitals,omitempty"`
	Organizations  []DoctorOrganization  `json:"organizations,omitempty"`
	Awards         []DoctorAward         `json:"awards,omitempty"`
	Certifications []DoctorCertification `json:"certifications,omitempty"`
	Languages      []DoctorLanguage      `json:"languages,omitempty"`
}

type PatientSpecificInfo struct {
	Location string `json:"location"`
}
type ReceptionistSpecificInfo struct {
	AssignedDoctorID *uuid.UUID `json:"assignedDoctorId"`
}
type StandardUserUpdateRequest struct {
	FirstName     string `json:"first_name" form:"firstName"`
	LastName      string `json:"last_name" form:"lastName"`
	Email         string `json:"email" form:"email"`
	PhoneNumber   string `json:"phone_number" form:"phoneNumber"`
	Bio           string `json:"bio" form:"bio"`
	StreetAddress string `json:"street_address" form:"streetAddress"`
	CityName      string `json:"city_name" form:"cityName"`
	StateName     string `json:"state_name" form:"stateName"`
	ZipCode       string `json:"zip_code" form:"zipCode"`
	CountryName   string `json:"country_name" form:"countryName"`
}

func ToStandardProfile(user interface{}, userType string) *StandardUserProfile {
	profile := &StandardUserProfile{
		UserType: userType,
	}

	switch userType {
	case "doctor":
		if doctor, ok := user.(Doctor); ok {
			profile.ID = doctor.DoctorID.String()
			profile.FirstName = doctor.FirstName
			profile.LastName = doctor.LastName
			profile.Email = doctor.Email
			profile.PhoneNumber = doctor.PhoneNumber
			profile.Bio = doctor.Bio
			profile.StreetAddress = doctor.StreetAddress
			profile.CityName = doctor.CityName
			profile.StateName = doctor.StateName
			profile.ZipCode = doctor.ZipCode
			profile.CountryName = doctor.CountryName
			profile.BirthDate = doctor.BirthDate
			profile.Sex = doctor.Sex
			profile.Age = doctor.Age
			profile.ProfilePictureURL = doctor.ProfilePictureURL
			profile.IsActive = true
			profile.EmailVerified = true

			profile.DoctorInfo = &DoctorSpecificInfo{
				Specialty:      doctor.Specialty,
				Experience:     doctor.Experience,
				MedicalLicense: doctor.MedicalLicense,
				RatingScore:    doctor.RatingScore,
				RatingCount:    doctor.RatingCount,
				Latitude:       doctor.Latitude,
				Longitude:      doctor.Longitude,
				Location:       doctor.Location,
				Hospitals:      doctor.Hospitals,
				Organizations:  doctor.Organizations,
				Awards:         doctor.Awards,
				Certifications: doctor.Certifications,
				Languages:      doctor.Languages,
			}
		}

	case "patient":
		if patient, ok := user.(Patient); ok {
			profile.ID = patient.PatientID.String()
			profile.FirstName = patient.FirstName
			profile.LastName = patient.LastName
			profile.Email = patient.Email
			profile.PhoneNumber = patient.PhoneNumber
			profile.Bio = patient.Bio
			profile.StreetAddress = patient.StreetAddress
			profile.CityName = patient.CityName
			profile.StateName = patient.StateName
			profile.ZipCode = patient.ZipCode
			profile.CountryName = patient.CountryName
			profile.BirthDate = patient.BirthDate
			profile.Sex = patient.Sex
			profile.Age = patient.Age
			profile.ProfilePictureURL = patient.ProfilePictureURL
			profile.IsActive = true
			profile.EmailVerified = true

			profile.PatientInfo = &PatientSpecificInfo{
				Location: patient.Location,
			}
		}

	case "receptionist":
		if receptionist, ok := user.(Receptionist); ok {
			profile.ID = receptionist.ReceptionistID.String()
			profile.FirstName = receptionist.FirstName
			profile.LastName = receptionist.LastName
			profile.Email = receptionist.Email
			profile.PhoneNumber = receptionist.PhoneNumber
			profile.Bio = receptionist.Bio
			profile.StreetAddress = receptionist.StreetAddress
			profile.CityName = receptionist.CityName
			profile.StateName = receptionist.StateName
			profile.ZipCode = receptionist.ZipCode
			profile.CountryName = receptionist.CountryName
			profile.Sex = receptionist.Sex
			profile.ProfilePictureURL = receptionist.ProfilePictureURL
			profile.IsActive = receptionist.IsActive
			profile.EmailVerified = receptionist.EmailVerified

			if !receptionist.CreatedAt.IsZero() {
				profile.CreatedAt = receptionist.CreatedAt.Format(time.RFC3339)
			}
			if !receptionist.UpdatedAt.IsZero() {
				profile.UpdatedAt = receptionist.UpdatedAt.Format(time.RFC3339)
			}

			if receptionist.BirthDate != nil && !receptionist.BirthDate.IsZero() {
				profile.BirthDate = receptionist.BirthDate.Format("2006-01-02")
			}

			profile.ReceptionistInfo = &ReceptionistSpecificInfo{
				AssignedDoctorID: receptionist.AssignedDoctorID,
			}
		}
	}

	return profile
}
