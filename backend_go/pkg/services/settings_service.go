package services

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"mime/multipart"
	"time"

	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/models"
	"healthcare_backend/pkg/utils"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
)

type SettingsService struct {
	db  *pgxpool.Pool
	cfg *config.Config
}

func NewSettingsService(db *pgxpool.Pool, cfg *config.Config) *SettingsService {
	return &SettingsService{
		db:  db,
		cfg: cfg,
	}
}

func (s *SettingsService) GetUserByID(userID, userType string) (*models.StandardUserProfile, error) {
	id, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID")
	}

	switch userType {
	case "patient":
		patient, err := s.getPatientProfile(id)
		if err != nil {
			return nil, err
		}
		return models.ToStandardProfile(*patient, "patient"), nil

	case "doctor":
		doctor, err := s.getDoctorProfile(id)
		if err != nil {
			return nil, err
		}
		return models.ToStandardProfile(*doctor, "doctor"), nil

	case "receptionist":
		receptionist, err := s.getReceptionistProfile(id)
		if err != nil {
			return nil, err
		}
		return models.ToStandardProfile(*receptionist, "receptionist"), nil

	default:
		return nil, fmt.Errorf("invalid user type")
	}
}

func (s *SettingsService) getPatientProfile(id uuid.UUID) (*models.Patient, error) {
	var patient models.Patient
	query := `SELECT email, phone_number,
		first_name, COALESCE(first_name_ar, ''),
		last_name, COALESCE(last_name_ar, ''),
		TO_CHAR(birth_date, 'YYYY-MM-DD'),
		COALESCE(bio, ''), COALESCE(bio_ar, ''),
		sex,
		location, COALESCE(location_ar, ''), COALESCE(location_fr, ''),
		profile_photo_url,
		street_address, COALESCE(street_address_ar, ''), COALESCE(street_address_fr, ''),
		city_name, COALESCE(city_name_ar, ''), COALESCE(city_name_fr, ''),
		zip_code,
		country_name, COALESCE(country_name_ar, ''), COALESCE(country_name_fr, ''),
		age,
		COALESCE(state_name, '') as state_name, COALESCE(state_name_ar, '') as state_name_ar, COALESCE(state_name_fr, '') as state_name_fr
		FROM patient_info WHERE patient_id = $1`

	err := s.db.QueryRow(context.Background(), query, id).Scan(
		&patient.Email,
		&patient.PhoneNumber,
		&patient.FirstName,
		&patient.FirstNameAr,
		&patient.LastName,
		&patient.LastNameAr,
		&patient.BirthDate,
		&patient.Bio,
		&patient.BioAr,
		&patient.Sex,
		&patient.Location,
		&patient.LocationAr,
		&patient.LocationFr,
		&patient.ProfilePictureURL,
		&patient.StreetAddress,
		&patient.StreetAddressAr,
		&patient.StreetAddressFr,
		&patient.CityName,
		&patient.CityNameAr,
		&patient.CityNameFr,
		&patient.ZipCode,
		&patient.CountryName,
		&patient.CountryNameAr,
		&patient.CountryNameFr,
		&patient.Age,
		&patient.StateName,
		&patient.StateNameAr,
		&patient.StateNameFr,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("patient not found")
		}
		return nil, fmt.Errorf("error retrieving patient: %v", err)
	}

	patient.PatientID = id

	if patient.ProfilePictureURL != "" {
		if presignedURL, err := utils.GeneratePresignedObjectURL(patient.ProfilePictureURL); err == nil {
			patient.ProfilePictureURL = presignedURL
		} else {
			log.Printf("Warning: failed to generate presigned URL for patient profile picture: %v", err)
		}
	}

	return &patient, nil
}

func (s *SettingsService) getDoctorProfile(id uuid.UUID) (*models.Doctor, error) {
	var doctor models.Doctor
	query := `
		SELECT
			email,
			phone_number,
			clinic_phone_number,
			show_clinic_phone,
			first_name,
			COALESCE(first_name_ar, ''),
			last_name,
			COALESCE(last_name_ar, ''),
			TO_CHAR(birth_date, 'YYYY-MM-DD'),
			COALESCE(bio, ''),
			COALESCE(bio_ar, ''), 
			COALESCE(bio_fr, ''),
			sex,
			location, COALESCE(location_ar, ''),
			COALESCE(location_fr, ''),
			profile_photo_url,
			street_address,
			COALESCE(street_address_ar, ''),
			COALESCE(street_address_fr, ''),
			city_name, COALESCE(city_name_ar, ''),
			COALESCE(city_name_fr, ''),
			zip_code,
			country_name, COALESCE(country_name_ar, ''),
			COALESCE(country_name_fr, ''),
			age,
			COALESCE(state_name, '') as state_name,
			COALESCE(state_name_ar, '') as state_name_ar,
			COALESCE(state_name_fr, '') as state_name_fr,
			specialty_code,
			experience,
			rating_score,
			rating_count,
			medical_license,
			COALESCE(latitude, 0),
			COALESCE(longitude, 0)
		FROM 
			doctor_info 
		WHERE 
			doctor_id = $1`

	var ratingScore sql.NullFloat64
	err := s.db.QueryRow(context.Background(), query, id).Scan(
		&doctor.Email,
		&doctor.PhoneNumber,
		&doctor.ClinicPhoneNumber,
		&doctor.ShowClinicPhone,
		&doctor.FirstName,
		&doctor.FirstNameAr,
		&doctor.LastName,
		&doctor.LastNameAr,
		&doctor.BirthDate,
		&doctor.Bio,
		&doctor.BioAr,
		&doctor.BioFr,
		&doctor.Sex,
		&doctor.Location,
		&doctor.LocationAr,
		&doctor.LocationFr,
		&doctor.ProfilePictureURL,
		&doctor.StreetAddress,
		&doctor.StreetAddressAr,
		&doctor.StreetAddressFr,
		&doctor.CityName,
		&doctor.CityNameAr,
		&doctor.CityNameFr,
		&doctor.ZipCode,
		&doctor.CountryName,
		&doctor.CountryNameAr,
		&doctor.CountryNameFr,
		&doctor.Age,
		&doctor.StateName,
		&doctor.StateNameAr,
		&doctor.StateNameFr,
		&doctor.SpecialtyCode,
		&doctor.Experience,
		&ratingScore,
		&doctor.RatingCount,
		&doctor.MedicalLicense,
		&doctor.Latitude,
		&doctor.Longitude,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("doctor not found")
		}
		return nil, fmt.Errorf("error retrieving doctor: %v", err)
	}

	doctor.DoctorID = id

	if ratingScore.Valid {
		rating := float32(ratingScore.Float64)
		doctor.RatingScore = &rating
	}

	if doctor.Specialty == "" {
		doctor.Specialty = doctor.SpecialtyCode
	}

	if doctor.ProfilePictureURL != "" {
		if presignedURL, err := utils.GeneratePresignedObjectURL(doctor.ProfilePictureURL); err == nil {
			doctor.ProfilePictureURL = presignedURL
		} else {
			log.Printf("Warning: failed to generate presigned URL for doctor profile picture: %v", err)
		}
	}

	doctor.Hospitals, _ = s.getDoctorHospitals(id)
	doctor.Organizations, _ = s.getDoctorOrganizations(id)
	doctor.Awards, _ = s.getDoctorAwards(id)
	doctor.Certifications, _ = s.getDoctorCertifications(id)
	doctor.Languages, _ = s.getDoctorLanguages(id)

	return &doctor, nil
}

func (s *SettingsService) getReceptionistProfile(id uuid.UUID) (*models.Receptionist, error) {
	var receptionist models.Receptionist
	var birthDateStr *string
	query := `
		SELECT
			email,
			phone_number,
			first_name,
			COALESCE(first_name_ar, ''),
			last_name,
			COALESCE(last_name_ar, ''),
			TO_CHAR(birth_date, 'YYYY-MM-DD'),
			COALESCE(bio, ''),
			COALESCE(bio_ar, ''),
			sex,
			profile_photo_url,
			COALESCE(street_address, ''),
			COALESCE(street_address_ar, ''),
			COALESCE(street_address_fr, ''),
			city_name,
			COALESCE(city_name_ar, ''),
			COALESCE(city_name_fr, ''),
			COALESCE(zip_code, ''),
			country_name,
			COALESCE(country_name_ar, ''),
			COALESCE(country_name_fr, ''),
			COALESCE(state_name, '') as state_name,
			COALESCE(state_name_ar, '') as state_name_ar,
			COALESCE(state_name_fr, '') as state_name_fr,
			COALESCE(location, ''),
			COALESCE(location_ar, ''),
			COALESCE(location_fr, ''),
			is_active,
			email_verified,
			assigned_doctor_id,
			created_at,
			updated_at
		FROM 
			receptionists 
		WHERE 
			receptionist_id = $1`

	err := s.db.QueryRow(context.Background(), query, id).Scan(
		&receptionist.Email,
		&receptionist.PhoneNumber,
		&receptionist.FirstName,
		&receptionist.FirstNameAr,
		&receptionist.LastName,
		&receptionist.LastNameAr,
		&birthDateStr,
		&receptionist.Bio,
		&receptionist.BioAr,
		&receptionist.Sex,
		&receptionist.ProfilePictureURL,
		&receptionist.StreetAddress,
		&receptionist.StreetAddressAr,
		&receptionist.StreetAddressFr,
		&receptionist.CityName,
		&receptionist.CityNameAr,
		&receptionist.CityNameFr,
		&receptionist.ZipCode,
		&receptionist.CountryName,
		&receptionist.CountryNameAr,
		&receptionist.CountryNameFr,
		&receptionist.StateName,
		&receptionist.StateNameAr,
		&receptionist.StateNameFr,
		&receptionist.Location,
		&receptionist.LocationAr,
		&receptionist.LocationFr,
		&receptionist.IsActive,
		&receptionist.EmailVerified,
		&receptionist.AssignedDoctorID,
		&receptionist.CreatedAt,
		&receptionist.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("receptionist not found")
		}
		return nil, fmt.Errorf("error retrieving receptionist: %v", err)
	}

	receptionist.ReceptionistID = id

	if birthDateStr != nil && *birthDateStr != "" {
		if parsedTime, parseErr := time.Parse("2006-01-02", *birthDateStr); parseErr == nil {
			receptionist.BirthDate = &parsedTime
		}
	}

	if receptionist.ProfilePictureURL != "" {
		if presignedURL, err := utils.GeneratePresignedObjectURL(receptionist.ProfilePictureURL); err == nil {
			receptionist.ProfilePictureURL = presignedURL
		} else {
			log.Printf("Warning: failed to generate presigned URL for receptionist profile picture: %v", err)
		}
	}

	return &receptionist, nil
}

type UserUpdateData struct {
	FirstName         string `form:"firstName"`
	FirstNameAr       string `form:"firstNameAr"`
	LastName          string `form:"lastName"`
	LastNameAr        string `form:"lastNameAr"`
	Email             string `form:"email"`
	PhoneNumber       string `form:"phoneNumber"`
	ClinicPhoneNumber string `form:"clinicPhoneNumber"`
	ShowClinicPhone   *bool  `form:"showClinicPhone"`
	StreetAddress     string `form:"streetAddress"`
	StreetAddressAr   string `form:"streetAddressAr"`
	StreetAddressFr   string `form:"streetAddressFr"`
	CityName          string `form:"cityName"`
	CityNameAr        string `form:"cityNameAr"`
	CityNameFr        string `form:"cityNameFr"`
	StateName         string `form:"stateName"`
	StateNameAr       string `form:"stateNameAr"`
	StateNameFr       string `form:"stateNameFr"`
	ZipCode           string `form:"zipCode"`
	CountryName       string `form:"countryName"`
	CountryNameAr     string `form:"countryNameAr"`
	CountryNameFr     string `form:"countryNameFr"`
	Bio               string `form:"bio"`
	BioAr             string `form:"bioAr"`
	BioFr             string `form:"bioFr"`
	ProfilePictureUrl string `form:"profilePictureUrl"`
}

func (s *SettingsService) UpdateUserInfo(userID, userType string, updateData UserUpdateData, file multipart.File, handler *multipart.FileHeader) (*models.StandardUserProfile, error) {
	fileName := fmt.Sprintf("images/profile_photos/%s.jpg", userID)

	var newProfilePictureURL string
	photoFileName := ""
	if file != nil && handler != nil {
		err := utils.DeleteFromS3(fileName)
		if err != nil {
			log.Printf("Warning: failed to delete old profile photo: %v", err)
		}

		err = utils.UploadToS3(file, handler, fileName)
		if err != nil {
			return nil, fmt.Errorf("failed to upload new profile photo: %v", err)
		}

		newProfilePictureURL, err = utils.GeneratePresignedObjectURL(fileName)
		if err != nil {
			return nil, fmt.Errorf("failed to generate presigned URL: %v", err)
		}
		photoFileName = fileName
	}

	err := s.updateUserInDatabase(userID, userType, updateData, photoFileName)
	if err != nil {
		return nil, err
	}

	updatedProfile, err := s.GetUserByID(userID, userType)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch updated profile: %v", err)
	}

	if newProfilePictureURL != "" {
		updatedProfile.ProfilePictureURL = newProfilePictureURL
	}

	return updatedProfile, nil
}

func (s *SettingsService) updateUserInDatabase(userID, userType string, updateData UserUpdateData, photoFileName string) error {
	id, err := uuid.Parse(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID")
	}

	nullIfEmpty := func(v string) interface{} {
		if v == "" {
			return nil
		}
		return v
	}

	location := fmt.Sprintf("%s, %s, %s, %s, %s",
		updateData.StreetAddress, updateData.ZipCode, updateData.CityName, updateData.StateName, updateData.CountryName)

	locationAr := interface{}(nil)
	if updateData.StreetAddressAr != "" || updateData.ZipCode != "" || updateData.CityNameAr != "" || updateData.StateNameAr != "" || updateData.CountryNameAr != "" {
		locationAr = fmt.Sprintf("%s, %s, %s, %s, %s",
			updateData.StreetAddressAr, updateData.ZipCode, updateData.CityNameAr, updateData.StateNameAr, updateData.CountryNameAr)
	}

	locationFr := interface{}(nil)
	if updateData.StreetAddressFr != "" || updateData.ZipCode != "" || updateData.CityNameFr != "" || updateData.StateNameFr != "" || updateData.CountryNameFr != "" {
		locationFr = fmt.Sprintf("%s, %s, %s, %s, %s",
			updateData.StreetAddressFr, updateData.ZipCode, updateData.CityNameFr, updateData.StateNameFr, updateData.CountryNameFr)
	}

	var query string
	var args []interface{}

	switch userType {
	case "patient":
		if photoFileName != "" {
			query = `
				UPDATE 
					patient_info 
				SET 
					first_name = $1,
					first_name_ar = $2,
					last_name = $3,
					last_name_ar = $4,
					email = $5,
					phone_number = $6,
					street_address = $7,
					street_address_ar = $8,
					street_address_fr = $9,
					city_name = $10,
					city_name_ar = $11,
					city_name_fr = $12,
					state_name = $13,
					state_name_ar = $14,
					state_name_fr = $15,
					zip_code = $16,
					country_name = $17,
					country_name_ar = $18,
					country_name_fr = $19,
					location = $20,
					location_ar = $21,
					location_fr = $22,
					bio = $23,
					bio_ar = $24,
					profile_photo_url = $25,
					updated_at = NOW()
				WHERE 
					patient_id = $26`

			args = []interface{}{
				updateData.FirstName,
				nullIfEmpty(updateData.FirstNameAr),
				updateData.LastName,
				nullIfEmpty(updateData.LastNameAr),
				updateData.Email,
				updateData.PhoneNumber,
				updateData.StreetAddress,
				nullIfEmpty(updateData.StreetAddressAr),
				nullIfEmpty(updateData.StreetAddressFr),
				updateData.CityName,
				nullIfEmpty(updateData.CityNameAr),
				nullIfEmpty(updateData.CityNameFr),
				updateData.StateName,
				nullIfEmpty(updateData.StateNameAr),
				nullIfEmpty(updateData.StateNameFr),
				updateData.ZipCode,
				updateData.CountryName,
				nullIfEmpty(updateData.CountryNameAr),
				nullIfEmpty(updateData.CountryNameFr),
				location,
				locationAr,
				locationFr,
				updateData.Bio,
				nullIfEmpty(updateData.BioAr),
				photoFileName,
				id,
			}
		} else {
			query = `
				UPDATE 
					patient_info 
				SET
					first_name = $1,
					first_name_ar = $2,
					last_name = $3,
					last_name_ar = $4,
					email = $5,
					phone_number = $6,
					street_address = $7,
					street_address_ar = $8,
					street_address_fr = $9,
					city_name = $10,
					city_name_ar = $11,
					city_name_fr = $12,
					state_name = $13,
					state_name_ar = $14,
					state_name_fr = $15,
					zip_code = $16,
					country_name = $17,
					country_name_ar = $18,
					country_name_fr = $19,
					location = $20,
					location_ar = $21,
					location_fr = $22,
					bio = $23,
					bio_ar = $24,
					updated_at = NOW()
				WHERE 
					patient_id = $25`

			args = []interface{}{
				updateData.FirstName,
				nullIfEmpty(updateData.FirstNameAr),
				updateData.LastName,
				nullIfEmpty(updateData.LastNameAr),
				updateData.Email,
				updateData.PhoneNumber,
				updateData.StreetAddress,
				nullIfEmpty(updateData.StreetAddressAr),
				nullIfEmpty(updateData.StreetAddressFr),
				updateData.CityName,
				nullIfEmpty(updateData.CityNameAr),
				nullIfEmpty(updateData.CityNameFr),
				updateData.StateName,
				nullIfEmpty(updateData.StateNameAr),
				nullIfEmpty(updateData.StateNameFr),
				updateData.ZipCode,
				updateData.CountryName,
				nullIfEmpty(updateData.CountryNameAr),
				nullIfEmpty(updateData.CountryNameFr),
				location,
				locationAr,
				locationFr,
				updateData.Bio,
				nullIfEmpty(updateData.BioAr),
				id,
			}
		}

	case "doctor":
		if photoFileName != "" {
			query = `
				UPDATE
					doctor_info 
				SET
					first_name = $1,
					first_name_ar = $2,
					last_name = $3,
					last_name_ar = $4,
					email = $5,
					phone_number = $6,
					clinic_phone_number = CASE WHEN $7 = '' THEN clinic_phone_number ELSE $7 END,
					show_clinic_phone = COALESCE($8,
					show_clinic_phone),
					street_address = $9,
					street_address_ar = $10,
					street_address_fr = $11,
					city_name = $12,
					city_name_ar = $13,
					city_name_fr = $14,
					state_name = $15,
					state_name_ar = $16,
					state_name_fr = $17,
					zip_code = $18,
					country_name = $19,
					country_name_ar = $20,
					country_name_fr = $21,
					location = $22,
					location_ar = $23,
					location_fr = $24,
					bio = $25,
					bio_ar = $26,
					bio_fr = $27,
					profile_photo_url = $28,
					updated_at = NOW()
				WHERE 
					doctor_id = $29`
			args = []interface{}{
				updateData.FirstName,
				nullIfEmpty(updateData.FirstNameAr),
				updateData.LastName,
				nullIfEmpty(updateData.LastNameAr),
				updateData.Email,
				updateData.PhoneNumber,
				updateData.ClinicPhoneNumber,
				updateData.ShowClinicPhone,
				updateData.StreetAddress,
				nullIfEmpty(updateData.StreetAddressAr),
				nullIfEmpty(updateData.StreetAddressFr),
				updateData.CityName,
				nullIfEmpty(updateData.CityNameAr),
				nullIfEmpty(updateData.CityNameFr),
				updateData.StateName,
				nullIfEmpty(updateData.StateNameAr),
				nullIfEmpty(updateData.StateNameFr),
				updateData.ZipCode,
				updateData.CountryName,
				nullIfEmpty(updateData.CountryNameAr),
				nullIfEmpty(updateData.CountryNameFr),
				location,
				locationAr,
				locationFr,
				updateData.Bio,
				nullIfEmpty(updateData.BioAr),
				nullIfEmpty(updateData.BioFr),
				photoFileName,
				id,
			}
		} else {
			query = `
				UPDATE
					doctor_info 
				SET
					first_name = $1,
					first_name_ar = $2,
					last_name = $3,
					last_name_ar = $4,
					email = $5,
					phone_number = $6,
					clinic_phone_number = CASE WHEN $7 = '' THEN clinic_phone_number ELSE $7 END,
					show_clinic_phone = COALESCE($8,
					show_clinic_phone),
					street_address = $9,
					street_address_ar = $10,
					street_address_fr = $11,
					city_name = $12,
					city_name_ar = $13,
					city_name_fr = $14,
					state_name = $15,
					state_name_ar = $16,
					state_name_fr = $17,
					zip_code = $18,
					country_name = $19,
					country_name_ar = $20,
					country_name_fr = $21,
					location = $22,
					location_ar = $23,
					location_fr = $24,
					bio = $25,
					bio_ar = $26,
					bio_fr = $27,
					updated_at = NOW()
				WHERE doctor_id = $28`
			args = []interface{}{
				updateData.FirstName,
				nullIfEmpty(updateData.FirstNameAr),
				updateData.LastName,
				nullIfEmpty(updateData.LastNameAr),
				updateData.Email,
				updateData.PhoneNumber,
				updateData.ClinicPhoneNumber,
				updateData.ShowClinicPhone,
				updateData.StreetAddress,
				nullIfEmpty(updateData.StreetAddressAr),
				nullIfEmpty(updateData.StreetAddressFr),
				updateData.CityName,
				nullIfEmpty(updateData.CityNameAr),
				nullIfEmpty(updateData.CityNameFr),
				updateData.StateName,
				nullIfEmpty(updateData.StateNameAr),
				nullIfEmpty(updateData.StateNameFr),
				updateData.ZipCode,
				updateData.CountryName,
				nullIfEmpty(updateData.CountryNameAr),
				nullIfEmpty(updateData.CountryNameFr),
				location,
				locationAr,
				locationFr,
				updateData.Bio,
				nullIfEmpty(updateData.BioAr),
				nullIfEmpty(updateData.BioFr),
				id,
			}
		}

	case "receptionist":
		if photoFileName != "" {
			query = `
				UPDATE
					receptionists 
				SET 
					first_name = $1,
					first_name_ar = $2,
					last_name = $3,
					last_name_ar = $4,
					email = $5,
					phone_number = $6,
					street_address = $7,
					street_address_ar = $8,
					street_address_fr = $9,
					city_name = $10,
					city_name_ar = $11,
					city_name_fr = $12,
					state_name = $13,
					state_name_ar = $14,
					state_name_fr = $15,
					zip_code = $16,
					country_name = $17,
					country_name_ar = $18,
					country_name_fr = $19,
					location = $20,
					location_ar = $21,
					location_fr = $22,
					bio = $23,
					bio_ar = $24,
					profile_photo_url = $25,
					updated_at = NOW()
				WHERE
					receptionist_id = $26`
			args = []interface{}{
				updateData.FirstName,
				nullIfEmpty(updateData.FirstNameAr),
				updateData.LastName,
				nullIfEmpty(updateData.LastNameAr),
				updateData.Email,
				updateData.PhoneNumber,
				updateData.StreetAddress,
				nullIfEmpty(updateData.StreetAddressAr),
				nullIfEmpty(updateData.StreetAddressFr),
				updateData.CityName,
				nullIfEmpty(updateData.CityNameAr),
				nullIfEmpty(updateData.CityNameFr),
				updateData.StateName,
				nullIfEmpty(updateData.StateNameAr),
				nullIfEmpty(updateData.StateNameFr),
				updateData.ZipCode,
				updateData.CountryName,
				nullIfEmpty(updateData.CountryNameAr),
				nullIfEmpty(updateData.CountryNameFr),
				location,
				locationAr,
				locationFr,
				updateData.Bio,
				nullIfEmpty(updateData.BioAr),
				photoFileName,
				id,
			}
		} else {
			query = `
				UPDATE
					receptionists 
				SET 
					first_name = $1,
					first_name_ar = $2,
					last_name = $3,
					last_name_ar = $4,
					email = $5,
					phone_number = $6,
					street_address = $7,
					street_address_ar = $8,
					street_address_fr = $9,
					city_name = $10,
					city_name_ar = $11,
					city_name_fr = $12,
					state_name = $13,
					state_name_ar = $14,
					state_name_fr = $15,
					zip_code = $16,
					country_name = $17,
					country_name_ar = $18,
					country_name_fr = $19,
					location = $20,
					location_ar = $21,
					location_fr = $22,
					bio = $23,
					bio_ar = $24,
					updated_at = NOW()
				WHERE
					receptionist_id = $25`
			args = []interface{}{
				updateData.FirstName,
				nullIfEmpty(updateData.FirstNameAr),
				updateData.LastName,
				nullIfEmpty(updateData.LastNameAr),
				updateData.Email,
				updateData.PhoneNumber,
				updateData.StreetAddress,
				nullIfEmpty(updateData.StreetAddressAr),
				nullIfEmpty(updateData.StreetAddressFr),
				updateData.CityName,
				nullIfEmpty(updateData.CityNameAr),
				nullIfEmpty(updateData.CityNameFr),
				updateData.StateName,
				nullIfEmpty(updateData.StateNameAr),
				nullIfEmpty(updateData.StateNameFr),
				updateData.ZipCode,
				updateData.CountryName,
				nullIfEmpty(updateData.CountryNameAr),
				nullIfEmpty(updateData.CountryNameFr),
				location,
				locationAr,
				locationFr,
				updateData.Bio,
				nullIfEmpty(updateData.BioAr),
				id,
			}
		}

	default:
		return fmt.Errorf("invalid user type")
	}

	_, err = s.db.Exec(context.Background(), query, args...)
	if err != nil {
		return fmt.Errorf("failed to update user information: %v", err)
	}

	return nil
}

func (s *SettingsService) GetDoctorAdditionalInfo(doctorID string) (map[string]interface{}, error) {
	docUUID, err := uuid.Parse(doctorID)
	if err != nil {
		log.Printf("Error parsing doctor ID: %v", err)
		return nil, fmt.Errorf("invalid doctor ID")
	}

	result := make(map[string]interface{})

	hospitals := []models.DoctorHospital{}
	hospitalQuery := `
		SELECT 
			id,
			hospital_name,
			COALESCE(hospital_name_ar,
			''),
			COALESCE(hospital_name_fr,
			''),
			COALESCE(position,
			''),
			COALESCE(position_ar,
			''),
			COALESCE(position_fr,
			''),
			start_date,
			end_date,
			description,
			description_ar,
			description_fr
		FROM
			doctor_hospitals
		WHERE
			doctor_id = $1`

	rows, err := s.db.Query(context.Background(), hospitalQuery, docUUID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var hospital models.DoctorHospital
			var startDate, endDate *time.Time

			err = rows.Scan(
				&hospital.ID,
				&hospital.HospitalName,
				&hospital.HospitalNameAr,
				&hospital.HospitalNameFr,
				&hospital.Position,
				&hospital.PositionAr,
				&hospital.PositionFr,
				&startDate,
				&endDate,
				&hospital.Description,
				&hospital.DescriptionAr,
				&hospital.DescriptionFr,
			)
			if err != nil {
				log.Printf("Error scanning hospital row: %v", err)
				return nil, fmt.Errorf("error scanning hospital row: %v", err)
			}

			layout := "2006-01-02"
			if startDate != nil {
				str := startDate.Format(layout)
				hospital.StartDate = &str
			}
			if endDate != nil {
				str := endDate.Format(layout)
				hospital.EndDate = &str
			}
			hospitals = append(hospitals, hospital)
		}
	}
	result["hospitals"] = hospitals

	organizations := []models.DoctorOrganization{}
	orgQuery := `
		SELECT
			id,
			organization_name,
			COALESCE(organization_name_ar, ''),
			COALESCE(organization_name_fr, ''),
			COALESCE(role, ''),
			COALESCE(role_ar, ''),
			COALESCE(role_fr, ''),
			start_date,
			end_date,
			description,
			description_ar,
			description_fr
		FROM
			doctor_organizations
		WHERE
			doctor_id = $1`

	rows, err = s.db.Query(context.Background(), orgQuery, docUUID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var organization models.DoctorOrganization
			var startDate, endDate *time.Time

			err = rows.Scan(
				&organization.ID,
				&organization.OrganizationName,
				&organization.OrganizationNameAr,
				&organization.OrganizationNameFr,
				&organization.Role,
				&organization.RoleAr,
				&organization.RoleFr,
				&startDate,
				&endDate,
				&organization.Description,
				&organization.DescriptionAr,
				&organization.DescriptionFr,
			)
			if err != nil {
				log.Printf("Error scanning organization row: %v", err)
				return nil, fmt.Errorf("error scanning organization row: %v", err)
			}

			layout := "2006-01-02"
			if startDate != nil {
				str := startDate.Format(layout)
				organization.StartDate = &str
			}
			if endDate != nil {
				str := endDate.Format(layout)
				organization.EndDate = &str
			}
			organizations = append(organizations, organization)
		}
	}
	result["organizations"] = organizations

	awards := []models.DoctorAward{}
	awardQuery := `
		SELECT
			id,
			award_name,
			COALESCE(award_name_ar, ''),
			COALESCE(award_name_fr, ''),
			date_awarded,
			issuing_organization,
			COALESCE(issuing_organization_ar, ''),
			COALESCE(issuing_organization_fr, ''),
			description,
			description_ar,
			description_fr
		FROM
			doctor_awards
		WHERE
			doctor_id = $1`

	rows, err = s.db.Query(context.Background(), awardQuery, docUUID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var award models.DoctorAward
			var dateAwarded *time.Time

			err = rows.Scan(
				&award.ID,
				&award.AwardName,
				&award.AwardNameAr,
				&award.AwardNameFr,
				&dateAwarded,
				&award.IssuingOrganization,
				&award.IssuingOrganizationAr,
				&award.IssuingOrganizationFr,
				&award.Description,
				&award.DescriptionAr,
				&award.DescriptionFr,
			)
			if err != nil {
				log.Printf("Error scanning award row: %v", err)
				return nil, fmt.Errorf("error scanning award row: %v", err)
			}

			layout := "2006-01-02"
			if dateAwarded != nil {
				str := dateAwarded.Format(layout)
				award.DateAwarded = &str
			}
			awards = append(awards, award)
		}
	}
	result["awards"] = awards

	certifications := []models.DoctorCertification{}
	certQuery := `
		SELECT
			id,
			certification_name,
			COALESCE(certification_name_ar, ''),
			COALESCE(certification_name_fr, ''),
			issued_by,
			COALESCE(issued_by_ar, ''),
			COALESCE(issued_by_fr, ''),
			issue_date,
			expiration_date,
			description,
			description_ar,
			description_fr
		FROM 
			doctor_certifications 
		WHERE 
			doctor_id = $1`

	rows, err = s.db.Query(context.Background(), certQuery, docUUID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var certification models.DoctorCertification
			var issueDate, expirationDate *time.Time

			err = rows.Scan(
				&certification.ID,
				&certification.CertificationName,
				&certification.CertificationNameAr,
				&certification.CertificationNameFr,
				&certification.IssuedBy,
				&certification.IssuedByAr,
				&certification.IssuedByFr,
				&issueDate,
				&expirationDate,
				&certification.Description,
				&certification.DescriptionAr,
				&certification.DescriptionFr,
			)
			if err != nil {
				log.Printf("Error scanning certification row: %v", err)
				return nil, fmt.Errorf("error scanning certification row: %v", err)
			}

			layout := "2006-01-02"
			if issueDate != nil {
				str := issueDate.Format(layout)
				certification.IssueDate = &str
			}
			if expirationDate != nil {
				str := expirationDate.Format(layout)
				certification.ExpirationDate = &str
			}
			certifications = append(certifications, certification)
		}
	}
	result["certifications"] = certifications

	languages := []models.DoctorLanguage{}
	langQuery := `
		SELECT
			id,
			language_name,
			COALESCE(language_name_ar, ''),
			COALESCE(language_name_fr, ''),
			COALESCE(proficiency_level, ''),
			COALESCE(proficiency_level_ar, ''),
			COALESCE(proficiency_level_fr, '')
		FROM
			doctor_languages
		WHERE
			doctor_id = $1`

	rows, err = s.db.Query(context.Background(), langQuery, docUUID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var language models.DoctorLanguage

			err = rows.Scan(
				&language.ID,
				&language.LanguageName,
				&language.LanguageNameAr,
				&language.LanguageNameFr,
				&language.ProficiencyLevel,
				&language.ProficiencyLevelAr,
				&language.ProficiencyLevelFr,
			)
			if err != nil {
				log.Printf("Error scanning language row: %v", err)
				return nil, fmt.Errorf("error scanning language row: %v", err)
			}
			languages = append(languages, language)
		}
	}
	result["languages"] = languages

	return result, nil
}

type DoctorAdditionalInfoData struct {
	Hospitals      []models.DoctorHospital      `json:"hospitals"`
	Organizations  []models.DoctorOrganization  `json:"organizations"`
	Awards         []models.DoctorAward         `json:"awards"`
	Certifications []models.DoctorCertification `json:"certifications"`
	Languages      []models.DoctorLanguage      `json:"languages"`
}

func (s *SettingsService) UpdateDoctorAdditionalInfo(doctorID string, data DoctorAdditionalInfoData) error {
	docUUID, err := uuid.Parse(doctorID)
	if err != nil {
		return fmt.Errorf("invalid doctor ID")
	}

	tx, err := s.db.Begin(context.Background())
	if err != nil {
		return fmt.Errorf("transaction start failed: %v", err)
	}
	defer tx.Rollback(context.Background())

	tables := []string{"doctor_hospitals", "doctor_organizations", "doctor_awards", "doctor_certifications", "doctor_languages"}
	for _, table := range tables {
		_, err = tx.Exec(context.Background(), fmt.Sprintf("DELETE FROM %s WHERE doctor_id = $1", table), docUUID)
		if err != nil {
			return fmt.Errorf("failed to delete existing %s: %v", table, err)
		}
	}

	for _, hospital := range data.Hospitals {
		var startDate, endDate *time.Time
		layout := "2006-01-02"

		if hospital.StartDate != nil && *hospital.StartDate != "" {
			t, err := time.Parse(layout, *hospital.StartDate)
			if err != nil {
				return fmt.Errorf("invalid start_date for hospital: %v", err)
			}
			startDate = &t
		}

		if hospital.EndDate != nil && *hospital.EndDate != "" {
			t, err := time.Parse(layout, *hospital.EndDate)
			if err != nil {
				return fmt.Errorf("invalid end_date for hospital: %v", err)
			}
			endDate = &t
		}

		_, err := tx.Exec(context.Background(), `
			INSERT INTO 
				doctor_hospitals 
				(doctor_id, hospital_name, hospital_name_ar, hospital_name_fr, position, position_ar, position_fr, start_date, end_date, description, description_ar, description_fr)
			VALUES 
				($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		`, docUUID, hospital.HospitalName, hospital.HospitalNameAr, hospital.HospitalNameFr, hospital.Position, hospital.PositionAr, hospital.PositionFr, startDate, endDate, hospital.Description, hospital.DescriptionAr, hospital.DescriptionFr)
		if err != nil {
			return fmt.Errorf("failed to insert hospital: %v", err)
		}
	}

	for _, organization := range data.Organizations {
		var startDate, endDate *time.Time
		layout := "2006-01-02"

		if organization.StartDate != nil && *organization.StartDate != "" {
			t, err := time.Parse(layout, *organization.StartDate)
			if err != nil {
				return fmt.Errorf("invalid start_date for organization: %v", err)
			}
			startDate = &t
		}

		if organization.EndDate != nil && *organization.EndDate != "" {
			t, err := time.Parse(layout, *organization.EndDate)
			if err != nil {
				return fmt.Errorf("invalid end_date for organization: %v", err)
			}
			endDate = &t
		}

		_, err := tx.Exec(context.Background(), `
			INSERT INTO
				doctor_organizations
				(doctor_id, organization_name, organization_name_ar, organization_name_fr, role, role_ar, role_fr, start_date, end_date, description, description_ar, description_fr)
			VALUES
				($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		`, docUUID, organization.OrganizationName, organization.OrganizationNameAr, organization.OrganizationNameFr, organization.Role, organization.RoleAr, organization.RoleFr, startDate, endDate, organization.Description, organization.DescriptionAr, organization.DescriptionFr)
		if err != nil {
			return fmt.Errorf("failed to insert organization: %v", err)
		}
	}

	for _, award := range data.Awards {
		var dateAwarded *time.Time
		layout := "2006-01-02"

		if award.DateAwarded != nil && *award.DateAwarded != "" {
			t, err := time.Parse(layout, *award.DateAwarded)
			if err != nil {
				return fmt.Errorf("invalid date_awarded for award: %v", err)
			}
			dateAwarded = &t
		}

		_, err := tx.Exec(context.Background(), `
			INSERT INTO
				doctor_awards
				(doctor_id, award_name, award_name_ar, award_name_fr, date_awarded, issuing_organization, issuing_organization_ar, issuing_organization_fr, description, description_ar, description_fr)
			VALUES
				($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		`, docUUID, award.AwardName, award.AwardNameAr, award.AwardNameFr, dateAwarded, award.IssuingOrganization, award.IssuingOrganizationAr, award.IssuingOrganizationFr, award.Description, award.DescriptionAr, award.DescriptionFr)
		if err != nil {
			return fmt.Errorf("failed to insert award: %v", err)
		}
	}

	for _, certification := range data.Certifications {
		var issueDate, expirationDate *time.Time
		layout := "2006-01-02"

		if certification.IssueDate != nil && *certification.IssueDate != "" {
			t, err := time.Parse(layout, *certification.IssueDate)
			if err != nil {
				return fmt.Errorf("invalid issue_date for certification: %v", err)
			}
			issueDate = &t
		}

		if certification.ExpirationDate != nil && *certification.ExpirationDate != "" {
			t, err := time.Parse(layout, *certification.ExpirationDate)
			if err != nil {
				return fmt.Errorf("invalid expiration_date for certification: %v", err)
			}
			expirationDate = &t
		}

		_, err := tx.Exec(context.Background(), `
			INSERT INTO
				doctor_certifications (doctor_id, certification_name, certification_name_ar, certification_name_fr, issued_by, issued_by_ar, issued_by_fr, issue_date, expiration_date, description, description_ar, description_fr)
			VALUES
				($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		`, docUUID, certification.CertificationName, certification.CertificationNameAr, certification.CertificationNameFr, certification.IssuedBy, certification.IssuedByAr, certification.IssuedByFr, issueDate, expirationDate, certification.Description, certification.DescriptionAr, certification.DescriptionFr)
		if err != nil {
			return fmt.Errorf("failed to insert certification: %v", err)
		}
	}

	for _, language := range data.Languages {
		_, err := tx.Exec(context.Background(), `
			INSERT INTO
				doctor_languages
				(doctor_id, language_name, language_name_ar, language_name_fr, proficiency_level, proficiency_level_ar, proficiency_level_fr)
			VALUES
				($1, $2, $3, $4, $5, $6, $7)
		`, docUUID, language.LanguageName, language.LanguageNameAr, language.LanguageNameFr, language.ProficiencyLevel, language.ProficiencyLevelAr, language.ProficiencyLevelFr)
		if err != nil {
			return fmt.Errorf("failed to insert language: %v", err)
		}
	}

	err = tx.Commit(context.Background())
	if err != nil {
		return fmt.Errorf("transaction commit failed: %v", err)
	}

	return nil
}

func (s *SettingsService) getDoctorHospitals(doctorID uuid.UUID) ([]models.DoctorHospital, error) {
	var hospitals []models.DoctorHospital
	rows, err := s.db.Query(context.Background(), `
		SELECT
			id,
			hospital_name,
			COALESCE(hospital_name_ar, ''),
			COALESCE(hospital_name_fr, ''),
			COALESCE(position, ''),
			COALESCE(position_ar, ''),
			COALESCE(position_fr, ''),
			start_date,
			end_date,
			description,
			description_ar,
			description_fr
		FROM
			doctor_hospitals
		WHERE
			doctor_id = $1`,
		doctorID)
	if err != nil {
		return hospitals, err
	}
	defer rows.Close()

	for rows.Next() {
		var hospital models.DoctorHospital
		var startDate, endDate *time.Time
		err = rows.Scan(&hospital.ID, &hospital.HospitalName, &hospital.HospitalNameAr, &hospital.HospitalNameFr, &hospital.Position, &hospital.PositionAr, &hospital.PositionFr, &startDate, &endDate, &hospital.Description, &hospital.DescriptionAr, &hospital.DescriptionFr)
		if err != nil {
			continue
		}
		if startDate != nil {
			str := startDate.Format("2006-01-02")
			hospital.StartDate = &str
		}
		if endDate != nil {
			str := endDate.Format("2006-01-02")
			hospital.EndDate = &str
		}
		hospitals = append(hospitals, hospital)
	}
	return hospitals, nil
}

func (s *SettingsService) getDoctorOrganizations(doctorID uuid.UUID) ([]models.DoctorOrganization, error) {
	var organizations []models.DoctorOrganization
	rows, err := s.db.Query(context.Background(), `
		SELECT
			id,
			organization_name,
			COALESCE(organization_name_ar, ''),
			COALESCE(organization_name_fr, ''),
			COALESCE(role, ''),
			COALESCE(role_ar, ''),
			COALESCE(role_fr, ''),
			start_date,
			end_date,
			description,
			description_ar,
			description_fr
		FROM
			doctor_organizations 
		WHERE
			doctor_id = $1`,
		doctorID)
	if err != nil {
		return organizations, err
	}
	defer rows.Close()

	for rows.Next() {
		var org models.DoctorOrganization
		var startDate, endDate *time.Time
		err = rows.Scan(&org.ID, &org.OrganizationName, &org.OrganizationNameAr, &org.OrganizationNameFr, &org.Role, &org.RoleAr, &org.RoleFr, &startDate, &endDate, &org.Description, &org.DescriptionAr, &org.DescriptionFr)
		if err != nil {
			continue
		}
		if startDate != nil {
			str := startDate.Format("2006-01-02")
			org.StartDate = &str
		}
		if endDate != nil {
			str := endDate.Format("2006-01-02")
			org.EndDate = &str
		}
		organizations = append(organizations, org)
	}
	return organizations, nil
}

func (s *SettingsService) getDoctorAwards(doctorID uuid.UUID) ([]models.DoctorAward, error) {
	var awards []models.DoctorAward
	rows, err := s.db.Query(context.Background(), `
		SELECT
			id,
			award_name,
			COALESCE(award_name_ar, ''),
			COALESCE(award_name_fr, ''),
			date_awarded,
			issuing_organization,
			COALESCE(issuing_organization_ar, ''),
			COALESCE(issuing_organization_fr, ''),
			description,
			description_ar,
			description_fr
		FROM 
			doctor_awards 
		WHERE 
			doctor_id = $1`,
		doctorID)
	if err != nil {
		return awards, err
	}
	defer rows.Close()

	for rows.Next() {
		var award models.DoctorAward
		var dateAwarded *time.Time
		err = rows.Scan(&award.ID, &award.AwardName, &award.AwardNameAr, &award.AwardNameFr, &dateAwarded, &award.IssuingOrganization, &award.IssuingOrganizationAr, &award.IssuingOrganizationFr, &award.Description, &award.DescriptionAr, &award.DescriptionFr)
		if err != nil {
			continue
		}
		if dateAwarded != nil {
			str := dateAwarded.Format("2006-01-02")
			award.DateAwarded = &str
		}
		awards = append(awards, award)
	}
	return awards, nil
}

func (s *SettingsService) getDoctorCertifications(doctorID uuid.UUID) ([]models.DoctorCertification, error) {
	var certifications []models.DoctorCertification
	rows, err := s.db.Query(context.Background(), `
		SELECT
			id,
			certification_name,
			COALESCE(certification_name_ar, ''),
			COALESCE(certification_name_fr, ''),
			COALESCE(issued_by, ''),
			COALESCE(issued_by_ar, ''),
			COALESCE(issued_by_fr, ''),
			issue_date,
			expiration_date,
			description,
			description_ar,
			description_fr
		FROM 
			doctor_certifications 
		WHERE 
			doctor_id = $1`,
		doctorID)
	if err != nil {
		return certifications, err
	}
	defer rows.Close()

	for rows.Next() {
		var cert models.DoctorCertification
		var issueDate, expirationDate *time.Time
		err = rows.Scan(&cert.ID, &cert.CertificationName, &cert.CertificationNameAr, &cert.CertificationNameFr, &cert.IssuedBy, &cert.IssuedByAr, &cert.IssuedByFr, &issueDate, &expirationDate, &cert.Description, &cert.DescriptionAr, &cert.DescriptionFr)
		if err != nil {
			continue
		}
		if issueDate != nil {
			str := issueDate.Format("2006-01-02")
			cert.IssueDate = &str
		}
		if expirationDate != nil {
			str := expirationDate.Format("2006-01-02")
			cert.ExpirationDate = &str
		}
		certifications = append(certifications, cert)
	}
	return certifications, nil
}

func (s *SettingsService) getDoctorLanguages(doctorID uuid.UUID) ([]models.DoctorLanguage, error) {
	var languages []models.DoctorLanguage
	rows, err := s.db.Query(context.Background(), `
		SELECT
			id,
			language_name,
			COALESCE(language_name_ar, ''),
			COALESCE(language_name_fr, ''), 
			COALESCE(proficiency_level, ''),
			COALESCE(proficiency_level_ar, ''),
			COALESCE(proficiency_level_fr, '')
		FROM 
			doctor_languages 
		WHERE 
			doctor_id = $1`,
		doctorID)
	if err != nil {
		return languages, err
	}
	defer rows.Close()

	for rows.Next() {
		var lang models.DoctorLanguage
		err = rows.Scan(&lang.ID, &lang.LanguageName, &lang.LanguageNameAr, &lang.LanguageNameFr, &lang.ProficiencyLevel, &lang.ProficiencyLevelAr, &lang.ProficiencyLevelFr)
		if err != nil {
			continue
		}
		languages = append(languages, lang)
	}
	return languages, nil
}
