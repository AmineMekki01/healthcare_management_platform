package middlewares

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func DoctorOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		userTypeInterface, exists := c.Get("userType")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
		userType, ok := userTypeInterface.(string)
		if !ok || userType != "doctor" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Access forbidden: Doctors only"})
			return
		}
		c.Next()
	}
}
