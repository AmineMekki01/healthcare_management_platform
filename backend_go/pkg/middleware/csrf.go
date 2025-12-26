package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func CSRFMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		method := strings.ToUpper(c.Request.Method)
		switch method {
		case http.MethodGet, http.MethodHead, http.MethodOptions:
			c.Next()
			return
		}

		csrfHeader := c.GetHeader("X-CSRF-Token")
		csrfCookie, err := c.Cookie("csrf_token")
		if err != nil || csrfHeader == "" || csrfCookie == "" || csrfHeader != csrfCookie {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "CSRF token mismatch"})
			return
		}

		c.Next()
	}
}
