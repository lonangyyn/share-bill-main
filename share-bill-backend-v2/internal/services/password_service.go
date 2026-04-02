package services

import (
	"context"

	database "BACKEND/internal/db/sqlc"
	models "BACKEND/internal/dto"
	utils "BACKEND/internal/utils"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PasswordService struct {
	pool    *pgxpool.Pool
	queries *database.Queries
}

func NewPasswordService(pool *pgxpool.Pool) *PasswordService {
	return &PasswordService{
		pool:    pool,
		queries: database.New(pool),
	}
}

func (s *PasswordService) ChangePassword(ctx context.Context, userID int64, req models.ChangePasswordRequest) error {
	if req.CurrentPassword == "" || req.NewPassword == "" {
		return utils.ErrInvalidInput
	}
	if len(req.NewPassword) < 6 {
		return utils.ErrInvalidInput
	}
	if req.ConfirmPassword != "" && req.NewPassword != req.ConfirmPassword {
		return utils.ErrInvalidInput
	}
	if req.NewPassword == req.CurrentPassword {
		return utils.ErrInvalidInput
	}

	user, err := s.queries.GetUserByID(ctx, userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return utils.ErrNotFound
		}
		return utils.ErrInternalDB
	}

	if err := utils.CheckPassword(req.CurrentPassword, user.Password); err != nil {
		return utils.ErrUnauthorized
	}

	hashed, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		return utils.ErrInternalDB
	}

	_, err = s.pool.Exec(ctx, `
		UPDATE users
		SET password = $1, updated_at = NOW()
		WHERE user_id = $2
	`, hashed, userID)
	if err != nil {
		return utils.ErrInternalDB
	}
	return nil
}
