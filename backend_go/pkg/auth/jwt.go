package auth

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type User struct {
	ID string `json:"id"`
}

var JWTSecret = []byte(os.Getenv("JWT_SECRET"))
var RefreshSecret = []byte(os.Getenv("REFRESH_SECRET"))

const (
	AccessTokenExpiry  = 15 * time.Minute
	RefreshTokenExpiry = 7 * 24 * time.Hour
)

func GenerateTokenPair(userId string, userType string) (string, string, error) {
	accessToken, err := GenerateAccessToken(userId, userType)
	if err != nil {
		return "", "", err
	}

	refreshToken, err := GenerateRefreshToken(userId, userType)
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

func GenerateAccessToken(userId string, userType string) (string, error) {
	expirationTime := time.Now().Add(AccessTokenExpiry)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userId":   userId,
		"userType": userType,
		"exp":      expirationTime.Unix(),
	})

	tokenString, err := token.SignedString(JWTSecret)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func GenerateRefreshToken(userId string, userType string) (string, error) {
	expirationTime := time.Now().Add(RefreshTokenExpiry)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userId":   userId,
		"userType": userType,
		"exp":      expirationTime.Unix(),
	})

	tokenString, err := token.SignedString(RefreshSecret)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func ValidateRefreshToken(tokenString string) (*jwt.Token, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return RefreshSecret, nil
	})

	if err != nil {
		log.Println("Error parsing refresh token:", err)
		return nil, err
	}

	if !token.Valid {
		log.Println("Invalid refresh token")
		return nil, fmt.Errorf("invalid refresh token")
	}

	return token, nil
}
