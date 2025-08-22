package middleware

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

func ReceptionistMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userType, exists := c.Get("userType")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User type not found"})
			return
		}

		if userType != "receptionist" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Access denied. Receptionist access required"})
			return
		}

		c.Next()
	}
}

func PatientOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		userTypeInterface, exists := c.Get("userType")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
		userType, ok := userTypeInterface.(string)
		if !ok || userType != "patient" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Access forbidden: Patients only"})
			return
		}
		c.Next()
	}
}
