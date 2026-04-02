package routes

import (
	"BACKEND/internal/config"
	models "BACKEND/internal/dto"
	"BACKEND/internal/handlers"
	"BACKEND/internal/middleware"
	"BACKEND/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/monitor" // Dashboard thống kê (Optional)
)

// Dang ky tat ca route va middleware
func SetupRoutes(
	app *fiber.App,
	cfg config.Config,
	tokenMaker *utils.JWTMaker,
	userHandler *handlers.UserHandler,
	eventHandler *handlers.EventHandler,
	expenseHandler *handlers.ExpenseHandler, 
	settlementHandler *handlers.SettlementHandler,
	participantHandler *handlers.ParticipantHandler,
	paymentHandler *handlers.PaymentHandler,
) {
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
			Success: true, 
			Message: "Server is running",
		})
	})
	app.Get("/metrics", monitor.New()) // Truy cập /metrics để xem dashboard


	api := app.Group("/api")
	// PUBLIC ROUTES (Ko cần Token) ===================================
	auth := api.Group("/auth")
	// --- AUTH ---
	// Gửi OTP đăng ký
	auth.Post("/register/request", userHandler.RegisterRequestCode) 
	// Xác thực & Tạo user
	auth.Post("/register/confirm", userHandler.RegisterConfirm)
	// Resend verification code if user didn't receive or code expired
	auth.Post("/register/resend", userHandler.RegisterResendCode)
	// Đăng nhập     
	auth.Post("/login", userHandler.Login)
	// Refresh token
	auth.Post("/refresh", userHandler.RefreshToken)
	// Logout (revoke refresh token)
	auth.Post("/logout", userHandler.Logout)

	// PROTECTED ROUTES =============================
	authMiddleware := middleware.NewAuthMiddleware(tokenMaker)
	v1 := api.Group("/v1", authMiddleware)

	// --- USER ---
	users := v1.Group("/users")
	// Xem profile
	users.Get("/profile", userHandler.GetProfile)
	// Sửa profile
	users.Put("/profile", userHandler.UpdateProfile)
	// Update avatar
	users.Patch("/avatar", userHandler.UpdateAvatar)
	
	// --- EVENT ---
	events := v1.Group("/events")
	// Tạo nhóm
	events.Post("/", eventHandler.CreateEvent)
	// List nhóm
	events.Get("/", eventHandler.ListEvents)
	// Chi tiết nhóm
	events.Get("/:eventId", eventHandler.GetEvent)
	// Sửa nhóm
	events.Put("/:eventId", eventHandler.UpdateEvent)
	// Xoá nhóm
	events.Delete("/:eventId", eventHandler.DeleteEvent)
	// Tham gia
	events.Post("/:eventId/join", eventHandler.JoinEvent)
	// Rời nhóm
	events.Post("/:eventId/leave", eventHandler.LeaveEvent)

	// --- TRANSACTIONS (EXPENSE) ---
	// Tạo chi tiêu
	events.Post("/:eventId/transactions", expenseHandler.CreateTransaction)
	// List chi tiêu của event
	events.Get("/:eventId/transactions", expenseHandler.ListTransactions)

	transactions := v1.Group("/transactions")
	// Lấy chi tiết chi tiêu
	transactions.Get("/:transactionId", expenseHandler.GetTransaction)
	// Cập nhật chi tiêu
	transactions.Put("/:transactionId", expenseHandler.UpdateTransaction)
	// Xoá chi tiêu
	transactions.Delete("/:transactionId", expenseHandler.DeleteTransaction)

	// --- PAYMENT ROUTES ---
	// Chọn collector
    events.Put("/:eventId/collector", paymentHandler.SetCollector)
	// Lấy collector hiện tại
    events.Get("/:eventId/collector", paymentHandler.GetCollector)
	// Lấy mã QR
    events.Get("/:eventId/generate-qrcode", paymentHandler.GetPaymentQR)

	

	// --- SETTLEMENTS ---
	// Xem nợ
	events.Get("/:eventId/summary", settlementHandler.GetEventSummary)
	// Ghi nhận trả nợ
	events.Post("/:eventId/settlements", settlementHandler.CreateSettlement)

	// --- PARTICIPANTS ---
	// List thành viên
	events.Get("/:eventId/participants", participantHandler.ListParticipants)
	// Thêm thành viên ảo
	events.Post("/:eventId/participants", participantHandler.AddVirtualParticipant)
	parts := v1.Group("/participants")
	// Sửa thành viên
	parts.Put("/:participantId", participantHandler.UpdateParticipant)
	// Kick thành viên
	parts.Delete("/:participantId", participantHandler.KickParticipant)
}