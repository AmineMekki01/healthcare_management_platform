package follow

import (
	"log"
	"net/http"

	"healthcare_backend/pkg/config"
	followService "healthcare_backend/pkg/services/follow"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

type FollowHandler struct {
	followService *followService.FollowService
	config        *config.Config
}

func NewFollowHandler(db *pgxpool.Pool, cfg *config.Config) *FollowHandler {
	return &FollowHandler{
		followService: followService.NewFollowService(db, cfg),
		config:        cfg,
	}
}

func (h *FollowHandler) FollowDoctor(c *gin.Context) {
	doctorID := c.Param("doctorId")

	FollowerID := c.GetString("userId")
	FollowerType := c.GetString("userType")

	err := h.followService.FollowDoctor(doctorID, FollowerID, FollowerType)
	if err != nil {
		log.Printf("Error following doctor: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully followed the doctor"})
}

func (h *FollowHandler) UnfollowDoctor(c *gin.Context) {
	doctorID := c.Param("doctorId")

	userID := c.GetString("userId")

	err := h.followService.UnfollowDoctor(doctorID, userID)
	if err != nil {
		log.Printf("Error unfollowing doctor: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully unfollowed the doctor"})
}

func (h *FollowHandler) GetDoctorFollowerCount(c *gin.Context) {
	doctorID := c.Param("doctorId")
	if doctorID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Doctor ID is required"})
		return
	}

	count, err := h.followService.GetDoctorFollowerCount(doctorID)
	if err != nil {
		log.Printf("Error getting follower count: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"followerCount": count})
}

func (h *FollowHandler) IsFollowingDoctor(c *gin.Context) {
	doctorID := c.Param("doctorId")
	followerID := c.Query("followerId")
	followerType := c.Query("followerType")

	if doctorID == "" || followerID == "" || followerType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Doctor ID, Follower ID, and Follower Type are required"})
		return
	}

	isFollowing, err := h.followService.IsFollowingDoctor(doctorID, followerID, followerType)
	if err != nil {
		log.Printf("Error checking following status: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"isFollowing": isFollowing})
}

func (h *FollowHandler) GetUserFollowings(c *gin.Context) {
	patientID := c.Param("patientId")
	if patientID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Patient ID is required"})
		return
	}

	doctors, err := h.followService.GetUserFollowings(patientID)
	if err != nil {
		log.Printf("Error getting user followings: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"followingUsers": doctors})
}
