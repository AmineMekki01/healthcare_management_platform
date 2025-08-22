package search

import (
	"net/http"
	"strconv"

	"healthcare_backend/pkg/services/search"

	"github.com/gin-gonic/gin"
)

type SearchHandler struct {
	searchService *search.SearchService
}

func NewSearchHandler(searchService *search.SearchService) *SearchHandler {
	return &SearchHandler{
		searchService: searchService,
	}
}

func (h *SearchHandler) SearchDoctors(c *gin.Context) {
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

	doctors, err := h.searchService.SearchDoctors(query, specialty, location, userLatitude, userLongitude)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, doctors)
}

func (h *SearchHandler) SearchDoctorsForReferral(c *gin.Context) {
	searchQuery := c.DefaultQuery("q", "")
	specialty := c.DefaultQuery("specialty", "")
	limit := c.DefaultQuery("limit", "10")

	limitInt, err := strconv.Atoi(limit)
	if err != nil {
		limitInt = 10
	}

	doctors, err := h.searchService.SearchDoctorsForReferral(searchQuery, specialty, limitInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search doctors"})
		return
	}

	c.JSON(http.StatusOK, doctors)
}

func (h *SearchHandler) SearchUsers(c *gin.Context) {
	inputName := c.Param("username")
	currentUserId := c.Param("userId")
	currentUserType := c.Query("userType")

	users, err := h.searchService.SearchUsers(inputName, currentUserId, currentUserType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search users"})
		return
	}

	c.JSON(http.StatusOK, users)
}
