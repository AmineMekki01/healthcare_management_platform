package models

import (
	"time"

	"github.com/google/uuid"
)

type StandardUserProfile struct {
	ID                string                    `json:"id"`
	UserType          string                    `json:"userType"`
	FirstName         string                    `json:"firstName"`
	FirstNameAr       string                    `json:"firstNameAr,omitempty"`
	LastName          string                    `json:"lastName"`
	LastNameAr        string                    `json:"lastNameAr,omitempty"`
	Email             string                    `json:"email"`
	PhoneNumber       string                    `json:"phoneNumber"`
	Bio               string                    `json:"bio"`
	BioAr             string                    `json:"bioAr,omitempty"`
	BioFr             string                    `json:"bioFr,omitempty"`
	StreetAddress     string                    `json:"streetAddress"`
	StreetAddressAr   string                    `json:"streetAddressAr,omitempty"`
	StreetAddressFr   string                    `json:"streetAddressFr,omitempty"`
	CityName          string                    `json:"cityName"`
	CityNameAr        string                    `json:"cityNameAr,omitempty"`
	CityNameFr        string                    `json:"cityNameFr,omitempty"`
	StateName         string                    `json:"stateName"`
	StateNameAr       string                    `json:"stateNameAr,omitempty"`
	StateNameFr       string                    `json:"stateNameFr,omitempty"`
	ZipCode           string                    `json:"zipCode"`
	CountryName       string                    `json:"countryName"`
	CountryNameAr     string                    `json:"countryNameAr,omitempty"`
	CountryNameFr     string                    `json:"countryNameFr,omitempty"`
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
	SpecialtyCode   string                `json:"specialtyCode"`
	Specialty       string                `json:"specialty"`
	Experience      string                `json:"experience"`
	MedicalLicense  string                `json:"medicalLicense"`
	ClinicPhone     string                `json:"clinicPhoneNumber"`
	ShowClinicPhone bool                  `json:"showClinicPhone"`
	RatingScore     *float32              `json:"ratingScore"`
	RatingCount     int                   `json:"ratingCount"`
	Latitude        float64               `json:"latitude"`
	Longitude       float64               `json:"longitude"`
	Location        string                `json:"location"`
	Hospitals       []DoctorHospital      `json:"hospitals,omitempty"`
	Organizations   []DoctorOrganization  `json:"organizations,omitempty"`
	Awards          []DoctorAward         `json:"awards,omitempty"`
	Certifications  []DoctorCertification `json:"certifications,omitempty"`
	Languages       []DoctorLanguage      `json:"languages,omitempty"`
}

type PatientSpecificInfo struct {
	Location string `json:"location"`
}
type ReceptionistSpecificInfo struct {
	AssignedDoctorID *uuid.UUID `json:"assignedDoctorId"`
}
type StandardUserUpdateRequest struct {
	FirstName       string `json:"first_name" form:"firstName"`
	FirstNameAr     string `json:"first_name_ar" form:"firstNameAr"`
	LastName        string `json:"last_name" form:"lastName"`
	LastNameAr      string `json:"last_name_ar" form:"lastNameAr"`
	Email           string `json:"email" form:"email"`
	PhoneNumber     string `json:"phone_number" form:"phoneNumber"`
	Bio             string `json:"bio" form:"bio"`
	BioAr           string `json:"bio_ar" form:"bioAr"`
	BioFr           string `json:"bio_fr" form:"bioFr"`
	StreetAddress   string `json:"street_address" form:"streetAddress"`
	StreetAddressAr string `json:"street_address_ar" form:"streetAddressAr"`
	StreetAddressFr string `json:"street_address_fr" form:"streetAddressFr"`
	CityName        string `json:"city_name" form:"cityName"`
	CityNameAr      string `json:"city_name_ar" form:"cityNameAr"`
	CityNameFr      string `json:"city_name_fr" form:"cityNameFr"`
	StateName       string `json:"state_name" form:"stateName"`
	StateNameAr     string `json:"state_name_ar" form:"stateNameAr"`
	StateNameFr     string `json:"state_name_fr" form:"stateNameFr"`
	ZipCode         string `json:"zip_code" form:"zipCode"`
	CountryName     string `json:"country_name" form:"countryName"`
	CountryNameAr   string `json:"country_name_ar" form:"countryNameAr"`
	CountryNameFr   string `json:"country_name_fr" form:"countryNameFr"`
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
			profile.FirstNameAr = doctor.FirstNameAr
			profile.LastName = doctor.LastName
			profile.LastNameAr = doctor.LastNameAr
			profile.Email = doctor.Email
			profile.PhoneNumber = doctor.PhoneNumber
			profile.Bio = doctor.Bio
			profile.BioAr = doctor.BioAr
			profile.BioFr = doctor.BioFr
			profile.StreetAddress = doctor.StreetAddress
			profile.StreetAddressAr = doctor.StreetAddressAr
			profile.StreetAddressFr = doctor.StreetAddressFr
			profile.CityName = doctor.CityName
			profile.CityNameAr = doctor.CityNameAr
			profile.CityNameFr = doctor.CityNameFr
			profile.StateName = doctor.StateName
			profile.StateNameAr = doctor.StateNameAr
			profile.StateNameFr = doctor.StateNameFr
			profile.ZipCode = doctor.ZipCode
			profile.CountryName = doctor.CountryName
			profile.CountryNameAr = doctor.CountryNameAr
			profile.CountryNameFr = doctor.CountryNameFr
			profile.BirthDate = doctor.BirthDate
			profile.Sex = doctor.Sex
			profile.Age = doctor.Age
			profile.ProfilePictureURL = doctor.ProfilePictureURL
			profile.IsActive = true
			profile.EmailVerified = true

			profile.DoctorInfo = &DoctorSpecificInfo{
				SpecialtyCode:   doctor.SpecialtyCode,
				Specialty:       doctor.Specialty,
				Experience:      doctor.Experience,
				MedicalLicense:  doctor.MedicalLicense,
				ClinicPhone:     doctor.ClinicPhoneNumber,
				ShowClinicPhone: doctor.ShowClinicPhone,
				RatingScore:     doctor.RatingScore,
				RatingCount:     doctor.RatingCount,
				Latitude:        doctor.Latitude,
				Longitude:       doctor.Longitude,
				Location:        doctor.Location,
				Hospitals:       doctor.Hospitals,
				Organizations:   doctor.Organizations,
				Awards:          doctor.Awards,
				Certifications:  doctor.Certifications,
				Languages:       doctor.Languages,
			}
		}

	case "patient":
		if patient, ok := user.(Patient); ok {
			profile.ID = patient.PatientID.String()
			profile.FirstName = patient.FirstName
			profile.FirstNameAr = patient.FirstNameAr
			profile.LastName = patient.LastName
			profile.LastNameAr = patient.LastNameAr
			profile.Email = patient.Email
			profile.PhoneNumber = patient.PhoneNumber
			profile.Bio = patient.Bio
			profile.BioAr = patient.BioAr
			profile.StreetAddress = patient.StreetAddress
			profile.StreetAddressAr = patient.StreetAddressAr
			profile.StreetAddressFr = patient.StreetAddressFr
			profile.CityName = patient.CityName
			profile.CityNameAr = patient.CityNameAr
			profile.CityNameFr = patient.CityNameFr
			profile.StateName = patient.StateName
			profile.StateNameAr = patient.StateNameAr
			profile.StateNameFr = patient.StateNameFr
			profile.ZipCode = patient.ZipCode
			profile.CountryName = patient.CountryName
			profile.CountryNameAr = patient.CountryNameAr
			profile.CountryNameFr = patient.CountryNameFr
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
			profile.FirstNameAr = receptionist.FirstNameAr
			profile.LastName = receptionist.LastName
			profile.LastNameAr = receptionist.LastNameAr
			profile.Email = receptionist.Email
			profile.PhoneNumber = receptionist.PhoneNumber
			profile.Bio = receptionist.Bio
			profile.BioAr = receptionist.BioAr
			profile.StreetAddress = receptionist.StreetAddress
			profile.StreetAddressAr = receptionist.StreetAddressAr
			profile.StreetAddressFr = receptionist.StreetAddressFr
			profile.CityName = receptionist.CityName
			profile.CityNameAr = receptionist.CityNameAr
			profile.CityNameFr = receptionist.CityNameFr
			profile.StateName = receptionist.StateName
			profile.StateNameAr = receptionist.StateNameAr
			profile.StateNameFr = receptionist.StateNameFr
			profile.ZipCode = receptionist.ZipCode
			profile.CountryName = receptionist.CountryName
			profile.CountryNameAr = receptionist.CountryNameAr
			profile.CountryNameFr = receptionist.CountryNameFr
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
