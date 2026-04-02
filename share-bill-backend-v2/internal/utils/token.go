package utils

import (
	"errors"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var ErrExpiredToken = errors.New("token has expired")
var ErrInvalidToken = errors.New("token is invalid")

type JWTMaker struct {
	secretKey string
}



func NewJWTMaker(secretKey string) *JWTMaker {
	return &JWTMaker{secretKey: secretKey}
}

func (maker *JWTMaker) CreateToken(userID int64, duration time.Duration) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(duration).Unix(),
		"iat":     time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(maker.secretKey))
}


func (maker *JWTMaker) VerifyToken(tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return []byte(maker.secretKey), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}
// Refresh Tokem
// Tao refresh token kèm jti va claim type="refresh"
func (maker *JWTMaker) CreateRefreshToken(userID int64, duration time.Duration) (string, string, error) {
    jti := uuid.New().String()
    claims := jwt.MapClaims{
        "user_id": userID,
        "exp":     time.Now().Add(duration).Unix(),
        "iat":     time.Now().Unix(),
        "jti":     jti,
        "type":    "refresh",
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    signed, err := token.SignedString([]byte(maker.secretKey))
    return signed, jti, err
} 

// Verify refresh token independently so we can give precise errors for expired refresh tokens
func (maker *JWTMaker) VerifyRefreshToken(tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return []byte(maker.secretKey), nil
	})
	if err != nil {
		// Explicitly return ErrExpiredToken when jwt indicates expiry
		if errors.Is(err, jwt.ErrTokenExpired) || strings.Contains(err.Error(), "expired") {
			return nil, ErrExpiredToken
		}
		return nil, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}
	if t, ok := claims["type"].(string); !ok || t != "refresh" {
		return nil, ErrInvalidToken
	}
	return claims, nil
} 