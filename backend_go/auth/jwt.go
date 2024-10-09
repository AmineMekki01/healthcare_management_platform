package auth

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type User struct {
	ID string `json:"id"`
}

var JWTSecret = []byte(os.Getenv("JWT_SECRET"))

func GenerateToken(user User, userType string) (string, error) {
	expirationTime := time.Now().Add(20 * time.Minute)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userID":   user.ID,
		"userType": userType,
		"exp":      expirationTime.Unix(),
	})

	tokenString, err := token.SignedString(JWTSecret)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}
