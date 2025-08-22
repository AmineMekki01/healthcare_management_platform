package models

import "github.com/google/uuid"

type Patient struct {
	PatientID         uuid.UUID `json:"patientId"`
	Username          string    `json:"username"`
	Password          string    `json:"password"`
	Email             string    `json:"email"`
	Age               int       `json:"age"`
	PhoneNumber       string    `json:"phoneNumber"`
	FirstName         string    `json:"firstName"`
	LastName          string    `json:"lastName"`
	BirthDate         string    `json:"birthDate"`
	StreetAddress     string    `json:"streetAddress"`
	CityName          string    `json:"cityName"`
	StateName         string    `json:"stateName"`
	ZipCode           string    `json:"zipCode"`
	CountryName       string    `json:"countryName"`
	Bio               string    `json:"bio"`
	Sex               string    `json:"sex"`
	Location          string    `json:"location"`
	ProfilePictureURL string    `json:"profilePictureUrl"`
}
