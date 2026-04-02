package handlers

import (
	models "BACKEND/internal/dto"
	"BACKEND/internal/services"
	"path/filepath"
	"strings"

	"github.com/gofiber/fiber/v2"
)

type UploadHandler struct {
	service *services.UploadService
}

// Tao upload handler
func NewUploadHandler(s *services.UploadService) *UploadHandler{
	return &UploadHandler{service: s}
} 

// POST /api/v1/upload
// Upload hinh anh len cloud
func (h *UploadHandler) UploadImage (c *fiber.Ctx) error{
	fileHeader, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "File is required",
		})
	}

	// Validate
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	allowedExts := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".webp": true,
	}
	if !allowedExts[ext] {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
			Error: "INVALID_BODY",
			Message: "Invalid file type. Only JPG, PNG, WEBP are allowed.",
		})
	}

	const MAX_UPLOAD_SIZE = 5 * 1024 * 1024 // 5MB
	if fileHeader.Size > MAX_UPLOAD_SIZE {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
			Error: "INVALID_FILE_SIZE",
			Message:   "File size too large (Max 5MB)",
		})
	}

	// Open file
	file, err := fileHeader.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse{
			Error: "OPEN_FILE_FAILED",
			Message:   "Unable to open file stream",
		})
	}
	defer file.Close()

	resp, err := h.service.UploadImage(c.Context(), file, fileHeader.Filename)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse{
			Error: "UPLOAD_FILE_FAILED",
			Message:   "Upload failed: " + err.Error(),
		})
	}
	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true,
		Message: "Upload succeed",
		Data: resp,
	})
}