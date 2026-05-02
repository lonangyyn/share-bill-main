package handlers

import (
	models "BACKEND/internal/dto"
	services "BACKEND/internal/services"
	utils "BACKEND/internal/utils"

	"github.com/gofiber/fiber/v2"
)

type NotificationHandler struct {
	service *services.NotificationService
}

func NewNotificationHandler(service *services.NotificationService) *NotificationHandler {
	return &NotificationHandler{service: service}
}

func (h *NotificationHandler) GetNotifications(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)

	notifs, err := h.service.GetNotifications(c.Context(), userID)
	if err != nil {
		return utils.MapError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true, Data: notifs,
	})
}

func (h *NotificationHandler) MarkAllRead(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)
	if err := h.service.MarkAllRead(c.Context(), userID); err != nil {
		return utils.MapError(c, err)
	}
	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{Success: true})
}