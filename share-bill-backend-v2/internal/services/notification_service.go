package services

import (
	database "BACKEND/internal/db/sqlc"
	models "BACKEND/internal/dto"
	"BACKEND/internal/utils"
	"context"
	"fmt"
)

type NotificationService struct {
	store database.Store
}

func NewNotificationService(store database.Store) *NotificationService {
	return &NotificationService{store: store}
}

func (s *NotificationService) GetNotifications(ctx context.Context, userID int64) ([]models.NotificationDTO, error) {
	dbNotifs, err := s.store.GetNotificationsByUserID(ctx, userID)
	if err != nil {
		return nil, utils.ErrInternalDB
	}

	notifs := make([]models.NotificationDTO, len(dbNotifs))
	for i, n := range dbNotifs {
		notifs[i] = models.NotificationDTO{
			ID:        n.ID,
			Text:      n.Text,
			IsRead:    n.IsRead,
			EventID:   fmt.Sprintf("%v", n.EventUuid),
			CreatedAt: n.CreatedAt,
		}
	}
	return notifs, nil
}

func (s *NotificationService) MarkAllRead(ctx context.Context, userID int64) error {
	if err := s.store.MarkNotificationsRead(ctx, userID); err != nil {
		return utils.ErrInternalDB
	}
	return nil
}