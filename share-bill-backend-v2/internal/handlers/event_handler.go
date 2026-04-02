package handlers

import (
	models "BACKEND/internal/dto"
	services "BACKEND/internal/services"
	utils "BACKEND/internal/utils"

	"github.com/gofiber/fiber/v2"
)

type EventHandler struct {
	service *services.EventService
}

// Tao event handler
func NewEventHandler(s *services.EventService) *EventHandler {
	return &EventHandler{service: s}
} 


// CreateEvent POST /events
// Tao event moi
func (h *EventHandler) CreateEvent(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)
	var req models.CreateEventRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
			Error: "INVALID_BODY", Message: "Invalid request body",
		})
	}

	resp, err := h.service.CreateEvent(c.Context(), userID, req)
	if err != nil {
		return utils.MapError(c, err)
	}

	return c.Status(fiber.StatusCreated).JSON(models.SuccessResponse{
		Success: true, Message: "Event created successfully", Data: resp,
	})
}

// GetEvent GET /events/:eventId
// Lay chi tiet event
func (h *EventHandler) GetEvent(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)
	eventUUID := c.Params("eventId")

	resp, err := h.service.GetEvent(c.Context(), userID, eventUUID)
	if err != nil {
		return utils.MapError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true, Data: resp,
	})
}

// UpdateEvent PUT /events/:eventId
// Cap nhat event (chi creator)
func (h *EventHandler) UpdateEvent(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)
	eventUUID := c.Params("eventId")
	var req models.UpdateEventRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
			Error: "INVALID_BODY", Message: "Invalid request body",
		})
	}

	resp, err := h.service.UpdateEvent(c.Context(), userID, eventUUID, req)
	if err != nil {
		return utils.MapError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true, Message: "Event updated successfully", Data: resp,
	})
}

// ListEvents GET /events
// Liet ke event cua user
func (h *EventHandler) ListEvents(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)

	resp, err := h.service.ListEvents(c.Context(), userID)
	if err != nil {
		return utils.MapError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true, Data: resp,
	})
}

// JoinEvent POST /events/:eventId/join
// Tham gia event
func (h *EventHandler) JoinEvent(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)
	eventUUID := c.Params("eventId")
	var req models.UpsertParticipantRequest
	_ = c.BodyParser(&req)

	err := h.service.JoinEvent(c.Context(), userID, eventUUID, req)
	if err != nil {
		return utils.MapError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true, Message: "Joined event successfully",
	})
}

// LeaveEvent POST /events/:eventId/leave
// Roi event neu balance = 0
func (h *EventHandler) LeaveEvent(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)
	eventUUID := c.Params("eventId")

	err := h.service.LeaveEvent(c.Context(), userID, eventUUID)
	if err != nil {
		return utils.MapError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true, Message: "Left event successfully",
	})
}

// DeleteEvent DELETE /events/:eventId
// Xoa event (chi creator)
func (h *EventHandler) DeleteEvent(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)
	eventUUID := c.Params("eventId")

	err := h.service.DeleteEvent(c.Context(), userID, eventUUID)
	if err != nil {
		return utils.MapError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true, Message: "Event deleted successfully",
	})
}