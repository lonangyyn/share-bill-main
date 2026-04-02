package models

import "time"

type CreatePaymentRequestRequest struct {
	PayerID    string  `json:"payerId" validate:"required"`
	ReceiverID string  `json:"receiverId" validate:"required"`
	Amount     float64 `json:"amount" validate:"required,gt=0"`
}

type PaymentPartyDTO struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type PaymentRequestDTO struct {
	ID        string           `json:"id"`
	EventID   string           `json:"eventId"`
	Payer     PaymentPartyDTO  `json:"payer"`
	Receiver  PaymentPartyDTO  `json:"receiver"`
	Amount    float64          `json:"amount"`
	Status    string           `json:"status"`
	CreatedAt time.Time        `json:"createdAt"`
	UpdatedAt time.Time        `json:"updatedAt"`
}
