package handlers

import (
	models "BACKEND/internal/dto"
	services "BACKEND/internal/services"
	utils "BACKEND/internal/utils"

	"github.com/gofiber/fiber/v2"
)

type ParticipantHandler struct {
	service *services.ParticipantService
}

// Tao participant handler
func NewParticipantHandler(s *services.ParticipantService) *ParticipantHandler {
	return &ParticipantHandler{service: s}
} 


// GET /api/v1/events/:eventId/participants
// Liet ke participants
func (h *ParticipantHandler) ListParticipants(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)
	eventUUID := c.Params("eventId")

	resp, err := h.service.ListParticipants(c.Context(), userID, eventUUID)
	if err != nil {
		return utils.MapError(c, err)
	}
	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true,
		Data:    resp,
	})
}

// POST /api/v1/events/:eventId/participants
// Them participant ao/guest
func (h *ParticipantHandler) AddVirtualParticipant(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)
	eventUUID := c.Params("eventId")
	var req models.UpsertParticipantRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
			Error: "INVALID_BODY", Message: "Invalid JSON format",
		})
	}
	resp, err := h.service.AddVirtualParticipant(c.Context(), userID, eventUUID, req)
	if err != nil {
		return utils.MapError(c, err)
	}
	return c.Status(fiber.StatusCreated).JSON(models.SuccessResponse{
		Success: true,
		Message: "Virtual participant added successfully",
		Data:    resp,
	})
}

// PUT /api/v1/participants/:participantId
// Cap nhat participant (owner hoac chu event cho guest)
func (h *ParticipantHandler) UpdateParticipant(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)
	partUUID := c.Params("participantId")
	var req models.UpsertParticipantRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
			Error: "INVALID_BODY", Message: "Invalid JSON format",
		})
	}
	resp, err := h.service.UpdateParticipant(c.Context(), userID, partUUID, req)
	if err != nil {
		return utils.MapError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true,
		Message: "Participant updated successfully",
		Data:    resp,
	})
}

// DELETE /api/v1/participants/:participantId
// Kick participant (chi creator, kiem tra balance)
func (h *ParticipantHandler) KickParticipant(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)
	partUUID := c.Params("participantId")

	err := h.service.KickParticipant(c.Context(), userID, partUUID)
	if err != nil {
		return utils.MapError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true,
		Message: "Participant removed successfully",
	})
}