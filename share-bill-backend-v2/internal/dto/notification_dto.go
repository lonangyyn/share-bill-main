package models

import "time"

type NotificationDTO struct {
	ID        int64     `json:"id"`
	Text      string    `json:"text"`
	IsRead    bool      `json:"isRead"`
	EventID   string    `json:"eventId,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}