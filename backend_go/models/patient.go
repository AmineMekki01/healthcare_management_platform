package models

import "github.com/google/uuid"

type Patient struct {
	PatientID         uuid.UUID `json:"PatientID"`
	Username          string    `json:"Username"`
	Password          string    `json:"Password"`
	Email             string    `json:"Email"`
	Age               int       `json:"Age"`
	PhoneNumber       string    `json:"PhoneNumber"`
	FirstName         string    `json:"FirstName"`
	LastName          string    `json:"LastName"`
	BirthDate         string    `json:"BirthDate"`
	StreetAddress     string    `json:"StreetAddress"`
	CityName          string    `json:"CityName"`
	StateName         string    `json:"StateName"`
	ZipCode           string    `json:"ZipCode"`
	CountryName       string    `json:"CountryName"`
	Bio               string    `json:"Bio"`
	Sex               string    `json:"sex"`
	Location          string    `json:"location"`
	ProfilePictureURL string    `json:"ProfilePictureUrl"`
}
