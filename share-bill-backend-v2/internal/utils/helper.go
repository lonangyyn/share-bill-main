package utils

import (
	models "BACKEND/internal/dto"
	"errors"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)
func GetStringFromPointer(s *string) string {
	if s != nil {
		return *s
	}
	return ""
}

func StringToUUID(s string) (uuid.UUID, error) {
	return uuid.Parse(s)
}

func NumericToFloat(n pgtype.Numeric) float64 {
	if !n.Valid {
		return 0.0
	}
	f, _ := n.Float64Value()
	return f.Float64
}

func FloatToNumeric(f float64) pgtype.Numeric {
	val := fmt.Sprintf("%.4f", f) 
	var n pgtype.Numeric
	n.Scan(val)
	return n
}

func StringToPtr(s string) *string{
	if s == ""{
		return nil
	}
	return &s
}

func MapError(c *fiber.Ctx, err error) error {
	var statusCode int
	var errorCode string

	switch {
	// 400 Bad Request
	case errors.Is(err, ErrInvalidInput):
		statusCode = fiber.StatusBadRequest
		errorCode = "INVALID_INPUT"

	// 401 Unauthorized
	case errors.Is(err, ErrUnauthorized):
		statusCode = fiber.StatusUnauthorized
		errorCode = "UNAUTHORIZED"

	// 401 Token expired
	case errors.Is(err, ErrExpiredToken):
		statusCode = fiber.StatusUnauthorized
		errorCode = "TOKEN_EXPIRED"

	// 403 Forbidden
	case errors.Is(err, ErrPermissionDenied):
		statusCode = fiber.StatusForbidden
		errorCode = "FORBIDDEN"

	// 429 Too Many Requests
	case errors.Is(err, ErrTooManyRequests):
		statusCode = fiber.StatusTooManyRequests
		errorCode = "TOO_MANY_REQUESTS"

	// 404 Not Found
	case errors.Is(err, ErrNotFound):
		statusCode = fiber.StatusNotFound
		errorCode = "NOT_FOUND"

	// 409 Conflict
	case errors.Is(err, ErrAlreadyExists):
		statusCode = fiber.StatusConflict
		errorCode = "ALREADY_EXISTS"
	case errors.Is(err, ErrBalanceNotZero):
		statusCode = fiber.StatusConflict
		errorCode = "BALANCE_NOT_ZERO"

	// 500 Internal Server Error (Default)
	default:
		statusCode = fiber.StatusInternalServerError
		errorCode = "INTERNAL_ERROR"
	}

	return c.Status(statusCode).JSON(models.ErrorResponse{
		Error:   errorCode,
		Message: err.Error(),
	})
}