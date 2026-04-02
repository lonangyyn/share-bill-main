package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"BACKEND/internal/config"
	"BACKEND/internal/db"
	database "BACKEND/internal/db/sqlc"
	"BACKEND/internal/handlers"
	"BACKEND/internal/routes"
	"BACKEND/internal/services"
	"BACKEND/internal/utils"
)

func main() {
	cfg, err := config.LoadConfig(".")
	if err != nil {
		log.Fatal("Cannot load config:", err)
	}

	connPool := db.NewDatabase(cfg.DBSource)
	defer connPool.Close()

	store := database.NewStore(connPool)
	log.Println("Database connected")

	// Redis
	redisClient := db.NewRedisClient(cfg.RedisAddress, cfg.RedisPassword, cfg.RedisDb)
	log.Println("Redis connected")

	tokenMaker := utils.NewJWTMaker(cfg.JWTSecret)
	emailSender := utils.NewGmailSender(cfg.EmailSenderName, cfg.EmailSenderAddress, cfg.EmailSenderPassword)

	uploadService, err := services.NewUploadService(cfg.CloudinaryURL)
	if err != nil {
		log.Println("Upload service disabled:", err)
		uploadService = nil
	}



	userService := services.NewUserService(store, tokenMaker, cfg, redisClient, emailSender, uploadService)
	eventService := services.NewEventService(store)
	participantService := services.NewParticipantService(store)
	expenseService := services.NewExpenseService(store)
	settlementService := services.NewSettlementService(store)
	paymentService := services.NewPaymentService(store)

	paymentRequestService := services.NewPaymentRequestService(connPool)
	passwordService := services.NewPasswordService(connPool)

	userHandler := handlers.NewUserHandler(userService)
	eventHandler := handlers.NewEventHandler(eventService)
	participantHandler := handlers.NewParticipantHandler(participantService)
	expenseHandler := handlers.NewExpenseHandler(expenseService)
	settlementHandler := handlers.NewSettlementHandler(settlementService)
	paymentHandler := handlers.NewPaymentHandler(paymentService)

	paymentRequestHandler := handlers.NewPaymentRequestHandler(paymentRequestService)
	passwordHandler := handlers.NewPasswordHandler(passwordService)

	app := fiber.New(fiber.Config{
		AppName:   "Sharever API",
		BodyLimit: 10 * 1024 * 1024,
	})

	app.Use(recover.New(recover.Config{
		EnableStackTrace: true,
	}))

	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, HEAD, PUT, DELETE, PATCH",
	}))

	routes.SetupRoutes(
		app,
		cfg,
		tokenMaker,
		userHandler,
		eventHandler,
		expenseHandler,
		settlementHandler,
		participantHandler,
		paymentHandler,
	)

	routes.SetupPaymentRequestRoutes(app, tokenMaker, paymentRequestHandler)
	routes.SetupPasswordRoutes(app, tokenMaker, passwordHandler)

	log.Printf("Server is running on %s", cfg.ServerAddress)
	if err := app.Listen(cfg.ServerAddress); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
