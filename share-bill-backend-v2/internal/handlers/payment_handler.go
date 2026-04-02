package handlers

import (
	models "BACKEND/internal/dto"
	services "BACKEND/internal/services"
	utils "BACKEND/internal/utils"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type PaymentHandler struct {
	service *services.PaymentService
}

// Tao payment handler
func NewPaymentHandler(s *services.PaymentService) *PaymentHandler {
	return &PaymentHandler{service: s}
} 

// PUT /api/v1/events/:eventId/collector
// Chon collector cho event
func (h *PaymentHandler) SetCollector(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)
	eventUUID := c.Params("eventId")

	var req models.SetCollectorRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
			Error: "INVALID_BODY", Message: "Invalid JSON format",
		})
	}

	err := h.service.SetCollector(c.Context(), userID, eventUUID, req)
	if err != nil {
		return utils.MapError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true,
		Message: "Collector updated successfully",
	})
}

// GET /api/v1/events/:eventId/collector
// Lay collector dang active
func (h *PaymentHandler) GetCollector(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)
	eventUUID := c.Params("eventId")

	resp, err := h.service.GetActiveCollector(c.Context(), userID, eventUUID)
	if err != nil {
		return utils.MapError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true,
		Data:    resp,
	})
}

// GET /api/v1/events/:eventId/qr?amount=50000&receiverId=...
// Sinh ma QR cho thanh toan
func (h *PaymentHandler) GetPaymentQR(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)
	eventUUID := c.Params("eventId")
	receiverUUID := c.Query("receiverId") 
	amountStr := c.Query("amount")        

	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil || amount <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
			Error:   "INVALID_AMOUNT",
			Message: "Amount is required and must be greater than 0",
		})
	}

	resp, err := h.service.GeneratePaymentQR(c.Context(), userID, eventUUID, receiverUUID, amount)
	if err != nil {
		return utils.MapError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true,
		Data:    resp,
	})
}