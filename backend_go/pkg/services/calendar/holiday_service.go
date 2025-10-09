package calendar

import (
	"context"
	"fmt"
	"log"
	"time"

	"healthcare_backend/pkg/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v4/pgxpool"
)

type HolidayService struct {
	db *pgxpool.Pool
}

func NewHolidayService(db *pgxpool.Pool) *HolidayService {
	return &HolidayService{
		db: db,
	}
}

// GetHolidays retrieves holidays based on filters
func (s *HolidayService) GetHolidays(countryCode *string, year int, institutionID *uuid.UUID) ([]models.PublicHoliday, error) {
	query := `
		SELECT 
			holiday_id, name, name_ar, name_fr, description,
			holiday_date, duration_days, country_code, region,
			is_recurring, affects_booking, display_in_calendar,
			institution_id, color, created_by, created_at, updated_at
		FROM public_holidays
		WHERE 1=1
	`

	args := []interface{}{}
	argCount := 1

	if countryCode != nil {
		query += fmt.Sprintf(" AND country_code = $%d", argCount)
		args = append(args, *countryCode)
		argCount++
	}

	if year > 0 {
		startDate := time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC)
		endDate := time.Date(year+1, 1, 1, 0, 0, 0, 0, time.UTC)
		query += fmt.Sprintf(" AND holiday_date >= $%d AND holiday_date < $%d", argCount, argCount+1)
		args = append(args, startDate, endDate)
		argCount += 2
	}

	if institutionID != nil {
		query += fmt.Sprintf(" AND (institution_id IS NULL OR institution_id = $%d)", argCount)
		args = append(args, *institutionID)
		argCount++
	}

	query += " ORDER BY holiday_date ASC"

	rows, err := s.db.Query(context.Background(), query, args...)
	if err != nil {
		log.Printf("Error querying holidays: %v", err)
		return nil, fmt.Errorf("failed to query holidays: %v", err)
	}
	defer rows.Close()

	var holidays []models.PublicHoliday
	for rows.Next() {
		var holiday models.PublicHoliday
		err := rows.Scan(
			&holiday.HolidayID, &holiday.Name, &holiday.NameAr, &holiday.NameFr, &holiday.Description,
			&holiday.HolidayDate, &holiday.DurationDays, &holiday.CountryCode, &holiday.Region,
			&holiday.IsRecurring, &holiday.AffectsBooking, &holiday.DisplayInCalendar,
			&holiday.InstitutionID, &holiday.Color, &holiday.CreatedBy, &holiday.CreatedAt, &holiday.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning holiday: %v", err)
			continue
		}
		holidays = append(holidays, holiday)
	}

	return holidays, nil
}

// CreateHoliday creates a new holiday
func (s *HolidayService) CreateHoliday(req models.CreateHolidayRequest, createdBy uuid.UUID) (*models.PublicHoliday, error) {
	holidayID := uuid.New()
	now := time.Now()

	color := req.Color
	if color == "" {
		color = "#FBB6CE"
	}

	query := `
		INSERT INTO public_holidays (
			holiday_id, name, name_ar, name_fr, description,
			holiday_date, duration_days, country_code, region,
			is_recurring, affects_booking, display_in_calendar,
			institution_id, color, created_by, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
		RETURNING holiday_id, created_at, updated_at
	`

	holiday := &models.PublicHoliday{
		HolidayID:         holidayID,
		Name:              req.Name,
		NameAr:            req.NameAr,
		NameFr:            req.NameFr,
		Description:       req.Description,
		HolidayDate:       req.HolidayDate,
		DurationDays:      req.DurationDays,
		CountryCode:       req.CountryCode,
		Region:            req.Region,
		IsRecurring:       req.IsRecurring,
		AffectsBooking:    req.AffectsBooking,
		DisplayInCalendar: req.DisplayInCalendar,
		InstitutionID:     req.InstitutionID,
		Color:             color,
		CreatedBy:         &createdBy,
	}

	err := s.db.QueryRow(context.Background(), query,
		holidayID, req.Name, req.NameAr, req.NameFr, req.Description,
		req.HolidayDate, req.DurationDays, req.CountryCode, req.Region,
		req.IsRecurring, req.AffectsBooking, req.DisplayInCalendar,
		req.InstitutionID, color, createdBy, now, now,
	).Scan(&holiday.HolidayID, &holiday.CreatedAt, &holiday.UpdatedAt)

	if err != nil {
		log.Printf("Error creating holiday: %v", err)
		return nil, fmt.Errorf("failed to create holiday: %v", err)
	}

	return holiday, nil
}

// UpdateHoliday updates an existing holiday
func (s *HolidayService) UpdateHoliday(holidayID uuid.UUID, req models.CreateHolidayRequest) error {
	query := `
		UPDATE public_holidays
		SET 
			name = $1,
			name_ar = $2,
			name_fr = $3,
			description = $4,
			holiday_date = $5,
			duration_days = $6,
			country_code = $7,
			region = $8,
			is_recurring = $9,
			affects_booking = $10,
			display_in_calendar = $11,
			institution_id = $12,
			color = $13,
			updated_at = NOW()
		WHERE holiday_id = $14
	`

	_, err := s.db.Exec(context.Background(), query,
		req.Name, req.NameAr, req.NameFr, req.Description,
		req.HolidayDate, req.DurationDays, req.CountryCode, req.Region,
		req.IsRecurring, req.AffectsBooking, req.DisplayInCalendar,
		req.InstitutionID, req.Color, holidayID,
	)

	if err != nil {
		log.Printf("Error updating holiday: %v", err)
		return fmt.Errorf("failed to update holiday: %v", err)
	}

	return nil
}

// DeleteHoliday deletes a holiday
func (s *HolidayService) DeleteHoliday(holidayID uuid.UUID) error {
	query := `DELETE FROM public_holidays WHERE holiday_id = $1`

	_, err := s.db.Exec(context.Background(), query, holidayID)
	if err != nil {
		log.Printf("Error deleting holiday: %v", err)
		return fmt.Errorf("failed to delete holiday: %v", err)
	}

	return nil
}
