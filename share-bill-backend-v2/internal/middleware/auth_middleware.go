package middleware

import (
	models "BACKEND/internal/dto"
	"BACKEND/internal/utils"
	"strings"

	"github.com/gofiber/fiber/v2"
)

// Middleware kiem tra header Bearer token va set user_id
func NewAuthMiddleware(tokenMaker *utils.JWTMaker) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(models.ErrorResponse{
				Error:   "MISSING_TOKEN",
				Message: "Authorization header is required",
			})
		}

		// Kiểm tra định dạng: "Bearer <token>"
		fields := strings.Fields(authHeader)
		if len(fields) < 2 || strings.ToLower(fields[0]) != "bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(models.ErrorResponse{
				Error:   "INVALID_TOKEN_FORMAT",
				Message: "Format must be: Bearer <token>",
			})
		}
		accessToken := fields[1]
		claims, err := tokenMaker.VerifyToken(accessToken)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(models.ErrorResponse{
				Error:   "INVALID_TOKEN",
				Message: "Token is invalid or expired",
			})
		}
		payloadUserID, ok := claims["user_id"].(float64)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(models.ErrorResponse{
				Error:   "INVALID_CLAIM",
				Message: "Token payload is invalid (user_id missing or wrong type)",
			})
		}
		c.Locals("user_id", int64(payloadUserID))
		return c.Next()
	}
}