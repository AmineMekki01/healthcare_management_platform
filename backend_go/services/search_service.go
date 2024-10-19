package services

import (
	"backend_go/models"
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

func SearchForDoctors(c *gin.Context, pool *pgxpool.Pool) {
	var doctors []models.Doctor
	query := c.DefaultQuery("query", "")
	specialty := c.DefaultQuery("specialty", "")
	location := c.DefaultQuery("location", "")
	userLatitudeStr := c.DefaultQuery("latitude", "")
	userLongitudeStr := c.DefaultQuery("longitude", "")
	var userLatitude, userLongitude float64

	var err error
	if userLatitudeStr != "" && userLongitudeStr != "" {
		userLatitude, err = strconv.ParseFloat(userLatitudeStr, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid latitude"})
			return
		}
		userLongitude, err = strconv.ParseFloat(userLongitudeStr, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid longitude"})
			return
		}
	}
	log.Println("userLatitude : ", userLatitude)
	log.Println("userLongitude : ", userLongitude)
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
        latitude,
        longitude,
        CASE WHEN $1::float8 IS NOT NULL AND $2::float8 IS NOT NULL THEN
            (6371 * acos(
                cos(radians($1::float8)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2::float8)) + 
                sin(radians($1::float8)) * sin(radians(latitude))
            ))
        ELSE NULL END AS distance
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

	// Join the conditions with " AND "
	if len(conditions) > 0 {
		sqlSelect += " WHERE " + strings.Join(conditions, " AND ")
	}
	if userLatitudeStr != "" && userLongitudeStr != "" {
		sqlSelect += " ORDER BY distance"
	}
	rows, err := pool.Query(context.Background(), sqlSelect, queryParams...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
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
		if distance.Valid {
			doctor.DoctorDistance = distance.Float64
		}
		log.Println("distance : ", distance)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})

			return
		}
		doctors = append(doctors, doctor)
		log.Println("doctor data : ", doctor)
	}
	c.JSON(http.StatusOK, doctors)
}
