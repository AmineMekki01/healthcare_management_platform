package services

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

func FollowDoctor(db *pgxpool.Pool, c *gin.Context) {
	var req struct {
		DoctorID     string `json:"doctor_id" binding:"required"`
		FollowerID   string `json:"follower_id" binding:"required"`
		FollowerType string `json:"follower_type" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Doctor ID, Follower ID, and Follower Type are required"})
		return
	}
	_, err := db.Exec(context.Background(),
		`
        INSERT INTO followers (doctor_id, follower_id, follower_type)
        VALUES ($1, $2, $3)
        ON CONFLICT (doctor_id, follower_id, follower_type) DO NOTHING
    `, req.DoctorID, req.FollowerID, req.FollowerType)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to follow doctor"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully followed the doctor"})
}

func GetDoctorFollowerCount(db *pgxpool.Pool, c *gin.Context) {
	doctorID := c.Param("doctorId")
	if doctorID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Doctor ID is required"})
		return
	}

	var count int
	err := db.QueryRow(context.Background(),
		`
		SELECT COUNT(*)
		FROM followers
		WHERE doctor_id = $1
	`, doctorID).Scan(&count)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get follower count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"follower_count": count})
}

func IsFollowingDoctor(db *pgxpool.Pool, c *gin.Context) {
	doctorID := c.Param("doctorId")
	followerID := c.Query("follower_id")
	followerType := c.Query("follower_type")

	if doctorID == "" || followerID == "" || followerType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Doctor ID, Follower ID, and Follower Type are required"})
		return
	}

	var existsInDB bool
	err := db.QueryRow(context.Background(),
		`
        SELECT EXISTS (
            SELECT 1 FROM followers
            WHERE doctor_id = $1 AND follower_id = $2 AND follower_type = $3
        )
    `, doctorID, followerID, followerType).Scan(&existsInDB)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check following status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"is_following": existsInDB})
}
