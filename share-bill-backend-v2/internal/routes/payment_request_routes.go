package routes

import (
	"BACKEND/internal/handlers"
	"BACKEND/internal/middleware"
	"BACKEND/internal/utils"

	"github.com/gofiber/fiber/v2"
)

func SetupPaymentRequestRoutes(
	app *fiber.App,
	tokenMaker *utils.JWTMaker,
	paymentRequestHandler *handlers.PaymentRequestHandler,
) {
	authMiddleware := middleware.NewAuthMiddleware(tokenMaker)
	v1 := app.Group("/api/v1", authMiddleware)

	events := v1.Group("/events")
	requests := events.Group("/:eventId/payment-requests")
	requests.Get("/", paymentRequestHandler.ListPaymentRequests)
	requests.Post("/", paymentRequestHandler.CreatePaymentRequest)
	requests.Post("/:requestId/confirm", paymentRequestHandler.ConfirmPaymentRequest)
	requests.Post("/:requestId/cancel", paymentRequestHandler.CancelPaymentRequest)
}
