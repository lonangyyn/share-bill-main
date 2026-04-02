package handlers

import (
	models "BACKEND/internal/dto"
	services "BACKEND/internal/services"
	utils "BACKEND/internal/utils"

	"github.com/gofiber/fiber/v2"
)

type ExpenseHandler struct {
	service *services.ExpenseService
}

// Tao expense handler
func NewExpenseHandler(s *services.ExpenseService) *ExpenseHandler {
	return &ExpenseHandler{service: s}
}


// POST /api/v1/events/:eventId/transactions
// Tao transaction (payers + shares)
func (h *ExpenseHandler) CreateTransaction(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)
	eventUUID := c.Params("eventId")
	var req models.CreateTransactionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
			Error: "INVALID_BODY", Message: "Invalid JSON format",
		})
	}

	resp, err := h.service.CreateTransaction(c.Context(), userID, eventUUID, req)
	if err != nil {
		return utils.MapError(c, err)
	}

	return c.Status(fiber.StatusCreated).JSON(models.SuccessResponse{
		Success: true,
		Message: "Transaction created successfully",
		Data:    resp,
	})
}

// GET /api/v1/events/:eventId/transactions
// Liet ke transactions trong event
func (h *ExpenseHandler) ListTransactions(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)
	eventUUID := c.Params("eventId")

	resp, err := h.service.ListTransactions(c.Context(), userID, eventUUID)
	if err != nil {
		return utils.MapError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true,
		Data:    resp,
	})
}

// GET /api/v1/transactions/:transactionId
// Lay chi tiet transaction
func (h *ExpenseHandler) GetTransaction(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)
	txnUUID := c.Params("transactionId") 

	resp, err := h.service.GetTransaction(c.Context(), userID, txnUUID)
	if err != nil {
		return utils.MapError(c, err)
	}
	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true,
		Data:    resp,
	})
}

// PUT /api/v1/transactions/:transactionId
// Cap nhat transaction
func (h *ExpenseHandler) UpdateTransaction(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)
	txnUUID := c.Params("transactionId")

	var req models.CreateTransactionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
			Error: "INVALID_BODY", Message: "Invalid JSON format",
		})
	}

	err := h.service.UpdateTransaction(c.Context(), userID, txnUUID, req)
	if err != nil {
		return utils.MapError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true,
		Message: "Transaction updated successfully",
	})
}

// DELETE /api/v1/transactions/:transactionId
// Xoa transaction
func (h *ExpenseHandler) DeleteTransaction(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)
	txnUUID := c.Params("transactionId")

	err := h.service.DeleteTransaction(c.Context(), userID, txnUUID)
	if err != nil {
		return utils.MapError(c, err)
	}
	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true,
		Message: "Transaction deleted successfully",
	})
}