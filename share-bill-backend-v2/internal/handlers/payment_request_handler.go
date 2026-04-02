package handlers

import (
	models "BACKEND/internal/dto"
	services "BACKEND/internal/services"
	utils "BACKEND/internal/utils"

	"github.com/gofiber/fiber/v2"
)

type PaymentRequestHandler struct {
	service *services.PaymentRequestService
}

func NewPaymentRequestHandler(service *services.PaymentRequestService) *PaymentRequestHandler {
	return &PaymentRequestHandler{service: service}
}

// GET /api/v1/events/:eventId/payment-requests
func (h *PaymentRequestHandler) ListPaymentRequests(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)
	eventUUID := c.Params("eventId")

	resp, err := h.service.ListPaymentRequests(c.Context(), userID, eventUUID)
	if err != nil {
		return utils.MapError(c, err)
	}
	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true,
		Data:    resp,
	})
}

// POST /api/v1/events/:eventId/payment-requests
func (h *PaymentRequestHandler) CreatePaymentRequest(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)
	eventUUID := c.Params("eventId")

	var req models.CreatePaymentRequestRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
			Error: "INVALID_BODY", Message: "Invalid JSON format",
		})
	}

	resp, err := h.service.CreatePaymentRequest(c.Context(), userID, eventUUID, req)
	if err != nil {
		return utils.MapError(c, err)
	}
	return c.Status(fiber.StatusCreated).JSON(models.SuccessResponse{
		Success: true,
		Message: "Payment request created",
		Data:    resp,
	})
}

// POST /api/v1/events/:eventId/payment-requests/:requestId/confirm
func (h *PaymentRequestHandler) ConfirmPaymentRequest(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)
	eventUUID := c.Params("eventId")
	requestUUID := c.Params("requestId")

	resp, err := h.service.ConfirmPaymentRequest(c.Context(), userID, eventUUID, requestUUID)
	if err != nil {
		return utils.MapError(c, err)
	}
	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true,
		Message: "Payment confirmed",
		Data:    resp,
	})
}

// POST /api/v1/events/:eventId/payment-requests/:requestId/cancel
func (h *PaymentRequestHandler) CancelPaymentRequest(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)
	eventUUID := c.Params("eventId")
	requestUUID := c.Params("requestId")

	resp, err := h.service.CancelPaymentRequest(c.Context(), userID, eventUUID, requestUUID)
	if err != nil {
		return utils.MapError(c, err)
	}
	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true,
		Message: "Payment canceled",
		Data:    resp,
	})
}
