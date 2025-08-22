package search

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/models"

	"github.com/jackc/pgx/v4/pgxpool"
)

type SearchService struct {
	db  *pgxpool.Pool
	cfg *config.Config
}

func NewSearchService(db *pgxpool.Pool, cfg *config.Config) *SearchService {
	return &SearchService{
		db:  db,
		cfg: cfg,
	}
}

func (s *SearchService) SearchDoctors(query, specialty, location string, userLatitude, userLongitude float64) ([]models.Doctor, error) {
	var doctors []models.Doctor

	sqlSelect := `
    SELECT 
        doctor_id, 
        username, 
        first_name, 
        last_name, 
        specialty, 
        experience, 
        rating_score,
        rating_count, 
        location, 
        profile_photo_url,
        COALESCE(latitude, 0) as latitude,
        COALESCE(longitude, 0) as longitude,
        CASE 
            WHEN $1::float8 IS NOT NULL AND $2::float8 IS NOT NULL AND latitude IS NOT NULL AND longitude IS NOT NULL THEN
                (6371 * acos(
                    cos(radians($1::float8)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2::float8)) + 
                    sin(radians($1::float8)) * sin(radians(latitude))
                ))
            ELSE NULL 
        END AS distance
    FROM doctor_info
    `

	queryParams := []interface{}{userLatitude, userLongitude}
	paramIndex := 3
	var conditions []string

	if specialty == "undefined" {
		specialty = ""
	}

	if query != "" {
		conditions = append(conditions, fmt.Sprintf("(first_name ILIKE $%d OR last_name ILIKE $%d)", paramIndex, paramIndex))
		queryParams = append(queryParams, "%"+query+"%")
		paramIndex++
	}
	if specialty != "" {
		conditions = append(conditions, fmt.Sprintf("specialty ILIKE $%d", paramIndex))
		queryParams = append(queryParams, "%"+specialty+"%")
		paramIndex++
	}
	if location != "" {
		conditions = append(conditions, fmt.Sprintf("location ILIKE $%d", paramIndex))
		queryParams = append(queryParams, "%"+location+"%")
		paramIndex++
	}

	if len(conditions) > 0 {
		sqlSelect += " WHERE " + strings.Join(conditions, " AND ")
	}

	if userLatitude != 0 && userLongitude != 0 {
		sqlSelect += " ORDER BY distance"
	}

	rows, err := s.db.Query(context.Background(), sqlSelect, queryParams...)
	if err != nil {
		return nil, fmt.Errorf("error executing search query: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var doctor models.Doctor
		var distance sql.NullFloat64
		err := rows.Scan(
			&doctor.DoctorID,
			&doctor.Username,
			&doctor.FirstName,
			&doctor.LastName,
			&doctor.Specialty,
			&doctor.Experience,
			&doctor.RatingScore,
			&doctor.RatingCount,
			&doctor.Location,
			&doctor.ProfilePictureURL,
			&doctor.Latitude,
			&doctor.Longitude,
			&distance,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning doctor row: %v", err)
		}

		if distance.Valid {
			doctor.DoctorDistance = distance.Float64
		}

		doctors = append(doctors, doctor)
	}

	return doctors, nil
}

func (s *SearchService) SearchDoctorsForReferral(searchQuery, specialty string, limit int) ([]map[string]interface{}, error) {
	query := `
		SELECT 
			doctor_id,
			first_name,
			last_name,
			specialty,
			experience,
			rating_score,
			rating_count
		FROM 
			doctor_info 
		WHERE 
			1=1`

	args := []interface{}{}
	argCount := 1

	if searchQuery != "" {
		query += fmt.Sprintf(" AND (LOWER(first_name || ' ' || last_name) LIKE $%d OR LOWER(specialty) LIKE $%d)", argCount, argCount)
		args = append(args, "%"+strings.ToLower(searchQuery)+"%")
		argCount++
	}

	if specialty != "" {
		query += fmt.Sprintf(" AND LOWER(specialty) LIKE $%d", argCount)
		args = append(args, "%"+strings.ToLower(specialty)+"%")
		argCount++
	}

	query += " ORDER BY rating_score DESC, experience DESC"

	query += fmt.Sprintf(" LIMIT $%d", argCount)
	args = append(args, limit)

	rows, err := s.db.Query(context.Background(), query, args...)
	if err != nil {
		return nil, fmt.Errorf("error searching doctors for referral: %v", err)
	}
	defer rows.Close()

	var doctors []map[string]interface{}
	for rows.Next() {
		var doctor struct {
			DoctorID    string  `json:"doctor_id"`
			FirstName   string  `json:"first_name"`
			LastName    string  `json:"last_name"`
			Specialty   string  `json:"specialty"`
			Experience  string  `json:"experience"`
			RatingScore float64 `json:"rating_score"`
			RatingCount int     `json:"rating_count"`
		}

		err := rows.Scan(
			&doctor.DoctorID,
			&doctor.FirstName,
			&doctor.LastName,
			&doctor.Specialty,
			&doctor.Experience,
			&doctor.RatingScore,
			&doctor.RatingCount,
		)
		if err != nil {
			continue
		}

		doctorMap := map[string]interface{}{
			"doctor_id":    doctor.DoctorID,
			"first_name":   doctor.FirstName,
			"last_name":    doctor.LastName,
			"full_name":    fmt.Sprintf("Dr. %s %s", doctor.FirstName, doctor.LastName),
			"specialty":    doctor.Specialty,
			"experience":   doctor.Experience,
			"rating_score": doctor.RatingScore,
			"rating_count": doctor.RatingCount,
		}

		doctors = append(doctors, doctorMap)
	}

	return doctors, nil
}

func (s *SearchService) SearchUsers(inputName, currentUserId, currentUserType string) ([]models.CombinedUser, error) {
	var combinedUsers []models.CombinedUser

	if currentUserType == "patient" {
		query := `
            SELECT DISTINCT di.doctor_id, di.first_name, di.last_name
			FROM doctor_info di
			LEFT JOIN followers f ON di.doctor_id = f.doctor_id AND f.follower_id = $2
			LEFT JOIN appointments apt ON di.doctor_id = apt.doctor_id AND apt.patient_id = $2 AND apt.canceled = FALSE
			WHERE LOWER(di.first_name || ' ' || di.last_name) LIKE LOWER($1)
			AND di.doctor_id != $2
			AND (f.follower_id IS NOT NULL OR apt.patient_id IS NOT NULL)
        `
		rows, err := s.db.Query(context.Background(), query, inputName+"%", currentUserId)
		if err != nil {
			return nil, fmt.Errorf("error querying doctors for patient: %v", err)
		}
		defer rows.Close()

		for rows.Next() {
			var user models.CombinedUser
			err := rows.Scan(&user.UserID, &user.FirstName, &user.LastName)
			if err != nil {
				continue
			}
			user.UserType = "doctor"
			combinedUsers = append(combinedUsers, user)
		}
	} else if currentUserType == "doctor" {
		queries := map[string]string{
			"patient": `
				SELECT pi.patient_id, pi.first_name, pi.last_name 
				FROM patient_info pi
				WHERE LOWER(pi.first_name || ' ' || pi.last_name) LIKE LOWER($1)
				  AND pi.patient_id != $2
			`,
			"doctor": `
				SELECT di.doctor_id, di.first_name, di.last_name 
				FROM doctor_info di
				WHERE LOWER(di.first_name || ' ' || di.last_name) LIKE LOWER($1)
				  AND di.doctor_id != $2
			`,
		}

		for userType, query := range queries {
			rows, err := s.db.Query(context.Background(), query, inputName+"%", currentUserId)
			if err != nil {
				continue
			}

			for rows.Next() {
				var user models.CombinedUser
				err := rows.Scan(&user.UserID, &user.FirstName, &user.LastName)
				if err != nil {
					continue
				}
				user.UserType = userType
				combinedUsers = append(combinedUsers, user)
			}
			rows.Close()
		}
	}

	return combinedUsers, nil
}
