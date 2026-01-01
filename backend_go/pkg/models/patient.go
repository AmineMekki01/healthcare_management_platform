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
	FirstNameAr       string    `json:"firstNameAr"`
	LastName          string    `json:"lastName"`
	LastNameAr        string    `json:"lastNameAr"`
	BirthDate         string    `json:"birthDate"`
	StreetAddress     string    `json:"streetAddress"`
	StreetAddressAr   string    `json:"streetAddressAr"`
	StreetAddressFr   string    `json:"streetAddressFr"`
	CityName          string    `json:"cityName"`
	CityNameAr        string    `json:"cityNameAr"`
	CityNameFr        string    `json:"cityNameFr"`
	StateName         string    `json:"stateName"`
	StateNameAr       string    `json:"stateNameAr"`
	StateNameFr       string    `json:"stateNameFr"`
	ZipCode           string    `json:"zipCode"`
	CountryName       string    `json:"countryName"`
	CountryNameAr     string    `json:"countryNameAr"`
	CountryNameFr     string    `json:"countryNameFr"`
	Bio               string    `json:"bio"`
	BioAr             string    `json:"bioAr"`
	Sex               string    `json:"sex"`
	Location          string    `json:"location"`
	LocationAr        string    `json:"locationAr"`
	LocationFr        string    `json:"locationFr"`
	ProfilePictureURL string    `json:"profilePictureUrl"`
}
