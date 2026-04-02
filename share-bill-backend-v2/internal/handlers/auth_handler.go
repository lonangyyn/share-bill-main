package handlers

import (
	models "BACKEND/internal/dto"
	services "BACKEND/internal/services"
	"BACKEND/internal/utils"

	"github.com/gofiber/fiber/v2"
)

type UserHandler struct {
	service *services.UserService
}

// Tao user handler
func NewUserHandler(s *services.UserService) *UserHandler {
	return &UserHandler{service: s}
}


// POST /api/auth/register/request
// Body: { "email": "a@gmail.com" }
// Gui ma OTP de dang ky
func (h *UserHandler) RegisterRequestCode(c *fiber.Ctx) error {
	var req models.RegisterRequestCodeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
			Error: "INVALID_BODY", Message: "Invalid JSON format",
		})
	}

	err := h.service.RegisterRequestCode(c.Context(), req.Email)
	if err != nil {
		return utils.MapError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true,
		Message: "Verification code sent to email",
	})
}

// POST /api/auth/register/resend
// Body: { "email": "..." }
// Resend verification code when OTP expired or not received
func (h *UserHandler) RegisterResendCode(c *fiber.Ctx) error {
	var req models.RegisterRequestCodeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{Error: "INVALID_BODY", Message: "Invalid JSON format"})
	}

	err := h.service.ResendVerifyCode(c.Context(), req.Email)
	if err != nil {
		return utils.MapError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{Success: true, Message: "Verification code resent"})
}
// POST /api/auth/register/confirm
// Body: { "email": "...", "code": "123456", "password": "...", "name": "..." }
// Xac nhan OTP va tao user
func (h *UserHandler) RegisterConfirm(c *fiber.Ctx) error {
	var req models.RegisterConfirmRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{Error: "INVALID_BODY", Message: "Invalid JSON format"})
	}

	resp, err := h.service.RegisterConfirm(c.Context(), req)
	if err != nil {
		return utils.MapError(c, err)
	}

	return c.Status(fiber.StatusCreated).JSON(models.SuccessResponse{
		Success: true,
		Message: "User registered successfully",
		Data:    resp,
	})
}

// POST /api/auth/login
// Body: { "email": "...", "password": "..." }
// Dang nhap, tra access va refresh token
func (h *UserHandler) Login(c *fiber.Ctx) error {
	var req models.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
			Error: "INVALID_BODY", Message: "Invalid JSON format",
		})
	}

	resp, err := h.service.Login(c.Context(), req)
	if err != nil {
		return utils.MapError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true,
		Message: "Login successfully",
		Data:    resp,
	})
}

// POST /api/auth/refresh
// Body: { "refresh_token": "..." }
// Doi refresh token lay access moi
func (h *UserHandler) RefreshToken(c *fiber.Ctx) error {
	var req models.RefreshRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{Error: "INVALID_BODY", Message: "Invalid JSON format"})
	}

	access, refresh, err := h.service.RefreshTokens(c.Context(), req.RefreshToken)
	if err != nil {
		return utils.MapError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{Success: true, Data: models.RefreshResponse{Token: access, RefreshToken: refresh}})
}

// POST /api/auth/logout
// Body: { "refresh_token": "..." }
// Thu hoi refresh token (logout)
func (h *UserHandler) Logout(c *fiber.Ctx) error {
	var req models.LogoutRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{Error: "INVALID_BODY", Message: "Invalid JSON format"})
	}
	err := h.service.RevokeRefreshToken(c.Context(), req.RefreshToken)
	if err != nil {
		return utils.MapError(c, err)
	}
	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{Success: true, Message: "Logged out"})
}

// GET /api/v1/users/profile
// Header: Authorization: Bearer <token>
// Tra profile user cho request da xac thuc
func (h *UserHandler) GetProfile(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(models.ErrorResponse{
			Error: "UNAUTHORIZED", Message: "User ID not found in context",
		})
	}

	resp, err := h.service.GetProfile(c.Context(), userID)
	if err != nil {
		return utils.MapError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true,
		Data:    resp,
	})
}

// PUT /api/v1/users/profile
// Cap nhat profile user
func (h *UserHandler) UpdateProfile(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)

	var req models.UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
			Error: "INVALID_BODY", Message: "Invalid JSON format",
		})
	}

	resp, err := h.service.UpdateProfile(c.Context(), userID, req)
	if err != nil {
		return utils.MapError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true,
		Message: "Profile updated successfully",
		Data:    resp,
	})
}

// Cap nhat avatar user
func (h *UserHandler) UpdateAvatar(c *fiber.Ctx) error{
	userID := c.Locals("user_id").(int64)
	fileHeader, err := c.FormFile("avatar")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
			Error: "INVALID_BODY",
			Message: "Image is required",
		})
	}
	file, err := fileHeader.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse{
			Error: "OPEN_FILE_FAILED",
			Message:   "Unable to open file stream",
		})	
	}
	defer file.Close()

	resp, err := h.service.UpdateUserAvatar(c.UserContext(), userID, file, fileHeader.Filename)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse{
			Error: "UPLOAD_FILE_FAILED",
			Message:   "Upload failed: " + err.Error(),
		})	
	}
	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true,
		Data: resp,
	})
}
