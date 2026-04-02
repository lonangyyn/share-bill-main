package models

import "time"

type UpsertParticipantRequest struct {
	Name     string       `json:"name" validate:"required"`
	BankInfo *BankInfoDTO `json:"bankInfo"`
}

type ParticipantListResponse struct {
	EventID      string           `json:"eventId"`
	Participants []ParticipantDTO `json:"participants"`
}

type ParticipantDTO struct {
	ID       string       `json:"id"`
	Name     string       `json:"name"`
	Avatar   string       `json:"avatar,omitempty"`
	JoinedAt time.Time    `json:"joinedAt"`
	BankInfo *BankInfoDTO `json:"bankInfo,omitempty"`
	UserID  string `json:"userId,omitempty"` // Để biết link tới profile nào
	Email   string `json:"email,omitempty"`  // Để hiển thị email
	IsGuest bool   `json:"isGuest"`          // True = User ảo, False = User thật
}