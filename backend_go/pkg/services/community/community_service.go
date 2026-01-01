package community

import (
	"context"
	"fmt"

	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/models"

	"github.com/jackc/pgx/v4/pgxpool"
)

type CommunityService struct {
	db  *pgxpool.Pool
	cfg *config.Config
}

func NewCommunityService(db *pgxpool.Pool, cfg *config.Config) *CommunityService {
	return &CommunityService{db: db, cfg: cfg}
}

func (s *CommunityService) GetCommunityStats(ctx context.Context) (*models.CommunityStats, error) {
	if s == nil || s.db == nil {
		return nil, fmt.Errorf("database not configured")
	}
	if ctx == nil {
		ctx = context.Background()
	}

	var totals models.CommunityTotals
	err := s.db.QueryRow(ctx, `
		SELECT
			(SELECT COUNT(*) FROM doctor_info WHERE deleted_at IS NULL AND is_active) AS doctors,
			(SELECT COUNT(*) FROM patient_info WHERE deleted_at IS NULL AND is_active) AS patients,
			(SELECT COUNT(*) FROM receptionists WHERE deleted_at IS NULL AND is_active) AS receptionists,
			(SELECT COUNT(*) FROM receptionists WHERE deleted_at IS NULL AND is_active AND assigned_doctor_id IS NOT NULL) AS receptionists_assigned,
			(SELECT COUNT(*) FROM receptionists WHERE deleted_at IS NULL AND is_active AND assigned_doctor_id IS NULL) AS receptionists_unassigned,
			(SELECT COUNT(DISTINCT COALESCE(NULLIF(TRIM(specialty_code), ''), 'Unknown')) FROM doctor_info WHERE deleted_at IS NULL AND is_active) AS specialties
	`).Scan(
		&totals.Doctors,
		&totals.Patients,
		&totals.Receptionists,
		&totals.ReceptionistsAssigned,
		&totals.ReceptionistsUnassigned,
		&totals.Specialties,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch community totals: %v", err)
	}

	var age0To17, age18To25, age26To35, age36To45, age46To60, age61Plus int
	err = s.db.QueryRow(ctx, `
		SELECT
			COUNT(*) FILTER (WHERE age BETWEEN 0 AND 17) AS age_0_17,
			COUNT(*) FILTER (WHERE age BETWEEN 18 AND 25) AS age_18_25,
			COUNT(*) FILTER (WHERE age BETWEEN 26 AND 35) AS age_26_35,
			COUNT(*) FILTER (WHERE age BETWEEN 36 AND 45) AS age_36_45,
			COUNT(*) FILTER (WHERE age BETWEEN 46 AND 60) AS age_46_60,
			COUNT(*) FILTER (WHERE age >= 61) AS age_61_plus
		FROM patient_info
		WHERE deleted_at IS NULL AND is_active
	`).Scan(&age0To17, &age18To25, &age26To35, &age36To45, &age46To60, &age61Plus)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch patient age distribution: %v", err)
	}

	patientsByAge := []models.CommunityDistributionItem{
		{Label: "0-17", Count: age0To17, Percentage: percent(age0To17, totals.Patients)},
		{Label: "18-25", Count: age18To25, Percentage: percent(age18To25, totals.Patients)},
		{Label: "26-35", Count: age26To35, Percentage: percent(age26To35, totals.Patients)},
		{Label: "36-45", Count: age36To45, Percentage: percent(age36To45, totals.Patients)},
		{Label: "46-60", Count: age46To60, Percentage: percent(age46To60, totals.Patients)},
		{Label: "61+", Count: age61Plus, Percentage: percent(age61Plus, totals.Patients)},
	}

	doctorsBySpecialty, err := s.getDoctorsBySpecialty(ctx, totals.Doctors)
	if err != nil {
		return nil, err
	}

	return &models.CommunityStats{
		Totals:             totals,
		PatientsByAge:      patientsByAge,
		DoctorsBySpecialty: doctorsBySpecialty,
	}, nil
}

func (s *CommunityService) getDoctorsBySpecialty(ctx context.Context, totalDoctors int) ([]models.CommunityDistributionItem, error) {
	rows, err := s.db.Query(ctx, `
		SELECT
			COALESCE(NULLIF(TRIM(specialty_code), ''), 'Unknown') AS specialty,
			COUNT(*) AS count
		FROM doctor_info
		WHERE deleted_at IS NULL AND is_active
		GROUP BY specialty
		ORDER BY count DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to query doctors by specialty: %v", err)
	}
	defer rows.Close()

	var items []models.CommunityDistributionItem
	for rows.Next() {
		var label string
		var count int
		if err := rows.Scan(&label, &count); err != nil {
			return nil, fmt.Errorf("failed to scan specialty distribution: %v", err)
		}
		items = append(items, models.CommunityDistributionItem{
			Label:      label,
			Count:      count,
			Percentage: percent(count, totalDoctors),
		})
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate specialty distribution: %v", err)
	}

	return items, nil
}

func percent(count int, total int) float64 {
	if total <= 0 {
		return 0
	}
	return (float64(count) / float64(total)) * 100
}
