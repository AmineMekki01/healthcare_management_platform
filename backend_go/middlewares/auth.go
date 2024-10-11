package middlewares

import (
	"backend_go/auth"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret = auth.JWTSecret

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header missing"})
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			return
		}

		userID, ok := claims["userID"].(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID in token"})
			return
		}

		userType, ok := claims["userType"].(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid user type in token"})
			return
		}

		c.Set("userID", userID)
		c.Set("userType", userType)
		c.Next()
	}
}
func RefreshToken(c *gin.Context) {
	refreshToken := c.GetHeader("Authorization")
	if refreshToken == "" {
		log.Println("No token provided.")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No token provided"})
		return
	}

	refreshToken = strings.TrimPrefix(refreshToken, "Bearer ")

	token, err := auth.ValidateRefreshToken(refreshToken)
	if err != nil || !token.Valid {
		log.Println("Invalid or expired refresh token : ", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired refresh token"})
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		log.Println("Invalid token claims")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		return
	}

	userID, ok := claims["userID"].(string)
	if !ok {
		log.Println("UserID not found in token claims")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		return
	}

	userType, ok := claims["userType"].(string)
	if !ok {
		log.Println("UserType not found in token claims")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		return
	}

	newAccessToken, err := auth.GenerateAccessToken(auth.User{ID: userID}, userType)
	if err != nil {
		log.Println("Failed to generate new access token : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate new access token"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"accessToken": newAccessToken,
	})
}
