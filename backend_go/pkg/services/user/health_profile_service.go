package user

import (
	"context"
	"fmt"
	"log"
	"time"

	"healthcare_backend/pkg/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/lib/pq"
)

type HealthProfileService struct {
	db *pgxpool.Pool
}

func NewHealthProfileService(db *pgxpool.Pool) *HealthProfileService {
	return &HealthProfileService{db: db}
}

func (s *HealthProfileService) GetHealthProfile(userID uuid.UUID, userType string) (*models.UserHealthProfile, error) {
	query := `
		SELECT 
			profile_id, user_id, user_type, blood_group, height_cm, weight_kg,
			allergies, chronic_conditions, current_medications,
			emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
			smoking_status, alcohol_consumption, exercise_frequency,
			dietary_restrictions, family_history, notes,
			created_at, updated_at
		FROM user_health_profile
		WHERE user_id = $1 AND user_type = $2
	`

	var profile models.UserHealthProfile
	err := s.db.QueryRow(context.Background(), query, userID, userType).Scan(
		&profile.ProfileID,
		&profile.UserID,
		&profile.UserType,
		&profile.BloodGroup,
		&profile.HeightCm,
		&profile.WeightKg,
		pq.Array(&profile.Allergies),
		pq.Array(&profile.ChronicConditions),
		pq.Array(&profile.CurrentMedications),
		&profile.EmergencyContactName,
		&profile.EmergencyContactPhone,
		&profile.EmergencyContactRelationship,
		&profile.SmokingStatus,
		&profile.AlcoholConsumption,
		&profile.ExerciseFrequency,
		pq.Array(&profile.DietaryRestrictions),
		&profile.FamilyHistory,
		&profile.Notes,
		&profile.CreatedAt,
		&profile.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return s.createEmptyProfile(userID, userType)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get health profile: %v", err)
	}

	return &profile, nil
}

func (s *HealthProfileService) createEmptyProfile(userID uuid.UUID, userType string) (*models.UserHealthProfile, error) {
	query := `
		INSERT INTO user_health_profile (user_id, user_type, allergies, chronic_conditions, current_medications, dietary_restrictions)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING profile_id, user_id, user_type, blood_group, height_cm, weight_kg,
			allergies, chronic_conditions, current_medications,
			emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
			smoking_status, alcohol_consumption, exercise_frequency,
			dietary_restrictions, family_history, notes,
			created_at, updated_at
	`

	emptyArray := []string{}
	var profile models.UserHealthProfile

	err := s.db.QueryRow(context.Background(), query,
		userID,
		userType,
		pq.Array(emptyArray),
		pq.Array(emptyArray),
		pq.Array(emptyArray),
		pq.Array(emptyArray),
	).Scan(
		&profile.ProfileID,
		&profile.UserID,
		&profile.UserType,
		&profile.BloodGroup,
		&profile.HeightCm,
		&profile.WeightKg,
		pq.Array(&profile.Allergies),
		pq.Array(&profile.ChronicConditions),
		pq.Array(&profile.CurrentMedications),
		&profile.EmergencyContactName,
		&profile.EmergencyContactPhone,
		&profile.EmergencyContactRelationship,
		&profile.SmokingStatus,
		&profile.AlcoholConsumption,
		&profile.ExerciseFrequency,
		pq.Array(&profile.DietaryRestrictions),
		&profile.FamilyHistory,
		&profile.Notes,
		&profile.CreatedAt,
		&profile.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create health profile: %v", err)
	}

	return &profile, nil
}

func (s *HealthProfileService) UpdateHealthProfile(userID uuid.UUID, userType string, req models.UpdateHealthProfileRequest) (*models.UserHealthProfile, error) {
	_, err := s.GetHealthProfile(userID, userType)
	if err != nil {
		return nil, err
	}

	query := `
		UPDATE user_health_profile
		SET 
			blood_group = COALESCE($3, blood_group),
			height_cm = COALESCE($4, height_cm),
			weight_kg = COALESCE($5, weight_kg),
			allergies = COALESCE($6, allergies),
			chronic_conditions = COALESCE($7, chronic_conditions),
			current_medications = COALESCE($8, current_medications),
			emergency_contact_name = COALESCE($9, emergency_contact_name),
			emergency_contact_phone = COALESCE($10, emergency_contact_phone),
			emergency_contact_relationship = COALESCE($11, emergency_contact_relationship),
			smoking_status = COALESCE($12, smoking_status),
			alcohol_consumption = COALESCE($13, alcohol_consumption),
			exercise_frequency = COALESCE($14, exercise_frequency),
			dietary_restrictions = COALESCE($15, dietary_restrictions),
			family_history = COALESCE($16, family_history),
			notes = COALESCE($17, notes),
			updated_at = NOW()
		WHERE user_id = $1 AND user_type = $2
		RETURNING profile_id, user_id, user_type, blood_group, height_cm, weight_kg,
			allergies, chronic_conditions, current_medications,
			emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
			smoking_status, alcohol_consumption, exercise_frequency,
			dietary_restrictions, family_history, notes,
			created_at, updated_at
	`

	var profile models.UserHealthProfile

	var allergies, chronicConditions, currentMedications, dietaryRestrictions interface{}
	if req.Allergies != nil {
		allergies = pq.Array(*req.Allergies)
	}
	if req.ChronicConditions != nil {
		chronicConditions = pq.Array(*req.ChronicConditions)
	}
	if req.CurrentMedications != nil {
		currentMedications = pq.Array(*req.CurrentMedications)
	}
	if req.DietaryRestrictions != nil {
		dietaryRestrictions = pq.Array(*req.DietaryRestrictions)
	}

	err = s.db.QueryRow(context.Background(), query,
		userID,
		userType,
		req.BloodGroup,
		req.HeightCm,
		req.WeightKg,
		allergies,
		chronicConditions,
		currentMedications,
		req.EmergencyContactName,
		req.EmergencyContactPhone,
		req.EmergencyContactRelationship,
		req.SmokingStatus,
		req.AlcoholConsumption,
		req.ExerciseFrequency,
		dietaryRestrictions,
		req.FamilyHistory,
		req.Notes,
	).Scan(
		&profile.ProfileID,
		&profile.UserID,
		&profile.UserType,
		&profile.BloodGroup,
		&profile.HeightCm,
		&profile.WeightKg,
		pq.Array(&profile.Allergies),
		pq.Array(&profile.ChronicConditions),
		pq.Array(&profile.CurrentMedications),
		&profile.EmergencyContactName,
		&profile.EmergencyContactPhone,
		&profile.EmergencyContactRelationship,
		&profile.SmokingStatus,
		&profile.AlcoholConsumption,
		&profile.ExerciseFrequency,
		pq.Array(&profile.DietaryRestrictions),
		&profile.FamilyHistory,
		&profile.Notes,
		&profile.CreatedAt,
		&profile.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to update health profile: %v", err)
	}

	return &profile, nil
}

func (s *HealthProfileService) GetVaccinations(userID uuid.UUID, userType string) ([]models.UserVaccination, error) {
	query := `
		SELECT 
			vaccination_id, user_id, user_type, vaccine_name, vaccine_type,
			date_administered, next_dose_date, administered_by,
			location, batch_number, notes, created_at, updated_at
		FROM user_vaccinations
		WHERE user_id = $1 AND user_type = $2
		ORDER BY date_administered DESC NULLS LAST, created_at DESC
	`

	rows, err := s.db.Query(context.Background(), query, userID, userType)
	if err != nil {
		return nil, fmt.Errorf("failed to get vaccinations: %v", err)
	}
	defer rows.Close()

	var vaccinations []models.UserVaccination
	for rows.Next() {
		var v models.UserVaccination
		err := rows.Scan(
			&v.VaccinationID,
			&v.UserID,
			&v.UserType,
			&v.VaccineName,
			&v.VaccineType,
			&v.DateAdministered,
			&v.NextDoseDate,
			&v.AdministeredBy,
			&v.Location,
			&v.BatchNumber,
			&v.Notes,
			&v.CreatedAt,
			&v.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan vaccination: %v", err)
		}
		vaccinations = append(vaccinations, v)
	}

	return vaccinations, nil
}

func (s *HealthProfileService) CreateVaccination(userID uuid.UUID, userType string, req models.CreateVaccinationRequest) (*models.UserVaccination, error) {
	query := `
		INSERT INTO user_vaccinations (
			user_id, user_type, vaccine_name, vaccine_type, date_administered,
			next_dose_date, administered_by, location, batch_number, notes
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING vaccination_id, user_id, user_type, vaccine_name, vaccine_type,
			date_administered, next_dose_date, administered_by,
			location, batch_number, notes, created_at, updated_at
	`

	var dateAdministered, nextDoseDate *time.Time
	if req.DateAdministered != nil && !req.DateAdministered.IsZero() {
		t := req.DateAdministered.Time
		dateAdministered = &t
	}
	if req.NextDoseDate != nil && !req.NextDoseDate.IsZero() {
		t := req.NextDoseDate.Time
		nextDoseDate = &t
	}

	var vaccination models.UserVaccination
	err := s.db.QueryRow(context.Background(), query,
		userID,
		userType,
		req.VaccineName,
		req.VaccineType,
		dateAdministered,
		nextDoseDate,
		req.AdministeredBy,
		req.Location,
		req.BatchNumber,
		req.Notes,
	).Scan(
		&vaccination.VaccinationID,
		&vaccination.UserID,
		&vaccination.UserType,
		&vaccination.VaccineName,
		&vaccination.VaccineType,
		&vaccination.DateAdministered,
		&vaccination.NextDoseDate,
		&vaccination.AdministeredBy,
		&vaccination.Location,
		&vaccination.BatchNumber,
		&vaccination.Notes,
		&vaccination.CreatedAt,
		&vaccination.UpdatedAt,
	)

	if err != nil {
		log.Println("failed to create vaccination: ", err)
		return nil, fmt.Errorf("failed to create vaccination: %v", err)
	}

	return &vaccination, nil
}

func (s *HealthProfileService) UpdateVaccination(vaccinationID uuid.UUID, userID uuid.UUID, userType string, req models.UpdateVaccinationRequest) (*models.UserVaccination, error) {
	query := `
		UPDATE user_vaccinations
		SET 
			vaccine_name = COALESCE($4, vaccine_name),
			vaccine_type = COALESCE($5, vaccine_type),
			date_administered = COALESCE($6, date_administered),
			next_dose_date = COALESCE($7, next_dose_date),
			administered_by = COALESCE($8, administered_by),
			location = COALESCE($9, location),
			batch_number = COALESCE($10, batch_number),
			notes = COALESCE($11, notes),
			updated_at = NOW()
		WHERE vaccination_id = $1 AND user_id = $2 AND user_type = $3
		RETURNING vaccination_id, user_id, user_type, vaccine_name, vaccine_type,
			date_administered, next_dose_date, administered_by,
			location, batch_number, notes, created_at, updated_at
	`

	var dateAdministered, nextDoseDate interface{}
	if req.DateAdministered != nil && !req.DateAdministered.IsZero() {
		t := req.DateAdministered.Time
		dateAdministered = &t
	}
	if req.NextDoseDate != nil && !req.NextDoseDate.IsZero() {
		t := req.NextDoseDate.Time
		nextDoseDate = &t
	}

	var vaccination models.UserVaccination
	err := s.db.QueryRow(context.Background(), query,
		vaccinationID,
		userID,
		userType,
		req.VaccineName,
		req.VaccineType,
		dateAdministered,
		nextDoseDate,
		req.AdministeredBy,
		req.Location,
		req.BatchNumber,
		req.Notes,
	).Scan(
		&vaccination.VaccinationID,
		&vaccination.UserID,
		&vaccination.UserType,
		&vaccination.VaccineName,
		&vaccination.VaccineType,
		&vaccination.DateAdministered,
		&vaccination.NextDoseDate,
		&vaccination.AdministeredBy,
		&vaccination.Location,
		&vaccination.BatchNumber,
		&vaccination.Notes,
		&vaccination.CreatedAt,
		&vaccination.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("vaccination not found")
	}

	if err != nil {
		return nil, fmt.Errorf("failed to update vaccination: %v", err)
	}

	return &vaccination, nil
}

func (s *HealthProfileService) DeleteVaccination(vaccinationID uuid.UUID, userID uuid.UUID, userType string) error {
	query := `
		DELETE FROM user_vaccinations
		WHERE vaccination_id = $1 AND user_id = $2 AND user_type = $3
	`

	result, err := s.db.Exec(context.Background(), query, vaccinationID, userID, userType)
	if err != nil {
		return fmt.Errorf("failed to delete vaccination: %v", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("vaccination not found")
	}

	return nil
}
