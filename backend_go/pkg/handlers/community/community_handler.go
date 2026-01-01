package community

import (
	"net/http"

	"healthcare_backend/pkg/services/community"

	"github.com/gin-gonic/gin"
)

type CommunityHandler struct {
	service *community.CommunityService
}

func NewCommunityHandler(service *community.CommunityService) *CommunityHandler {
	return &CommunityHandler{service: service}
}

func (h *CommunityHandler) GetCommunityStats(c *gin.Context) {
	stats, err := h.service.GetCommunityStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}
