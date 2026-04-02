package handlers

import (
	models "BACKEND/internal/dto"
	services "BACKEND/internal/services"
	utils "BACKEND/internal/utils"

	"github.com/gofiber/fiber/v2"
)

type PasswordHandler struct {
	service *services.PasswordService
}

func NewPasswordHandler(service *services.PasswordService) *PasswordHandler {
	return &PasswordHandler{service: service}
}

// PUT /api/v1/users/password
func (h *PasswordHandler) ChangePassword(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)

	var req models.ChangePasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
			Error: "INVALID_BODY", Message: "Invalid JSON format",
		})
	}

	if err := h.service.ChangePassword(c.Context(), userID, req); err != nil {
		return utils.MapError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true,
		Message: "Password updated successfully",
	})
}
