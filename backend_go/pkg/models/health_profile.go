package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type FlexibleDate struct {
	time.Time
}

func (fd *FlexibleDate) UnmarshalJSON(b []byte) error {
	if string(b) == "null" {
		return nil
	}

	s := string(b)
	if s == "null" || s == `""` || s == "" {
		return nil
	}

	s = s[1 : len(s)-1]

	t, err := time.Parse("2006-01-02", s)
	if err == nil {
		fd.Time = t
		return nil
	}

	t, err = time.Parse(time.RFC3339, s)
	if err == nil {
		fd.Time = t
		return nil
	}

	return err
}

func (fd FlexibleDate) MarshalJSON() ([]byte, error) {
	if fd.Time.IsZero() {
		return []byte("null"), nil
	}
	return json.Marshal(fd.Time.Format("2006-01-02"))
}

type UserHealthProfile struct {
	ProfileID                    uuid.UUID `json:"profileId"`
	UserID                       uuid.UUID `json:"userId"`
	UserType                     string    `json:"userType"`
	BloodGroup                   *string   `json:"bloodGroup"`
	HeightCm                     *float64  `json:"heightCm"`
	WeightKg                     *float64  `json:"weightKg"`
	Allergies                    []string  `json:"allergies"`
	ChronicConditions            []string  `json:"chronicConditions"`
	CurrentMedications           []string  `json:"currentMedications"`
	EmergencyContactName         *string   `json:"emergencyContactName"`
	EmergencyContactPhone        *string   `json:"emergencyContactPhone"`
	EmergencyContactRelationship *string   `json:"emergencyContactRelationship"`
	SmokingStatus                *string   `json:"smokingStatus"`
	AlcoholConsumption           *string   `json:"alcoholConsumption"`
	ExerciseFrequency            *string   `json:"exerciseFrequency"`
	DietaryRestrictions          []string  `json:"dietaryRestrictions"`
	FamilyHistory                *string   `json:"familyHistory"`
	Notes                        *string   `json:"notes"`
	CreatedAt                    time.Time `json:"createdAt"`
	UpdatedAt                    time.Time `json:"updatedAt"`
}

type UserVaccination struct {
	VaccinationID    uuid.UUID  `json:"vaccinationId"`
	UserID           uuid.UUID  `json:"userId"`
	UserType         string     `json:"userType"`
	VaccineName      string     `json:"vaccineName"`
	VaccineType      *string    `json:"vaccineType"`
	DateAdministered *time.Time `json:"dateAdministered"`
	NextDoseDate     *time.Time `json:"nextDoseDate"`
	AdministeredBy   *string    `json:"administeredBy"`
	Location         *string    `json:"location"`
	BatchNumber      *string    `json:"batchNumber"`
	Notes            *string    `json:"notes"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}

type PatientHealthProfile = UserHealthProfile
type PatientVaccination = UserVaccination

type UpdateHealthProfileRequest struct {
	BloodGroup                   *string   `json:"bloodGroup"`
	HeightCm                     *float64  `json:"heightCm"`
	WeightKg                     *float64  `json:"weightKg"`
	Allergies                    *[]string `json:"allergies"`
	ChronicConditions            *[]string `json:"chronicConditions"`
	CurrentMedications           *[]string `json:"currentMedications"`
	EmergencyContactName         *string   `json:"emergencyContactName"`
	EmergencyContactPhone        *string   `json:"emergencyContactPhone"`
	EmergencyContactRelationship *string   `json:"emergencyContactRelationship"`
	SmokingStatus                *string   `json:"smokingStatus"`
	AlcoholConsumption           *string   `json:"alcoholConsumption"`
	ExerciseFrequency            *string   `json:"exerciseFrequency"`
	DietaryRestrictions          *[]string `json:"dietaryRestrictions"`
	FamilyHistory                *string   `json:"familyHistory"`
	Notes                        *string   `json:"notes"`
}

type CreateVaccinationRequest struct {
	VaccineName      string        `json:"vaccineName" binding:"required"`
	VaccineType      *string       `json:"vaccineType"`
	DateAdministered *FlexibleDate `json:"dateAdministered"`
	NextDoseDate     *FlexibleDate `json:"nextDoseDate"`
	AdministeredBy   *string       `json:"administeredBy"`
	Location         *string       `json:"location"`
	BatchNumber      *string       `json:"batchNumber"`
	Notes            *string       `json:"notes"`
}

type UpdateVaccinationRequest struct {
	VaccineName      *string       `json:"vaccineName"`
	VaccineType      *string       `json:"vaccineType"`
	DateAdministered *FlexibleDate `json:"dateAdministered"`
	NextDoseDate     *FlexibleDate `json:"nextDoseDate"`
	AdministeredBy   *string       `json:"administeredBy"`
	Location         *string       `json:"location"`
	BatchNumber      *string       `json:"batchNumber"`
	Notes            *string       `json:"notes"`
}
