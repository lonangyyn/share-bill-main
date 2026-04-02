package routes

import (
	"BACKEND/internal/handlers"
	"BACKEND/internal/middleware"
	"BACKEND/internal/utils"

	"github.com/gofiber/fiber/v2"
)

func SetupPasswordRoutes(
	app *fiber.App,
	tokenMaker *utils.JWTMaker,
	passwordHandler *handlers.PasswordHandler,
) {
	authMiddleware := middleware.NewAuthMiddleware(tokenMaker)
	v1 := app.Group("/api/v1", authMiddleware)

	users := v1.Group("/users")
	users.Put("/password", passwordHandler.ChangePassword)
}
