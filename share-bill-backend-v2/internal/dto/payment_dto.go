package models

type SetCollectorRequest struct {
	ParticipantID string       `json:"participantId" validate:"required"`
	BankInfo      *BankInfoDTO `json:"bankInfo"`
}

type CollectorResponse struct {
	ParticipantID string      `json:"participantId"`
	Name          string      `json:"name"`
	BankInfo      BankInfoDTO `json:"bankInfo"`
}

type PaymentQRResponse struct {
	QRCodeURL string      `json:"qrCodeUrl"` // Link ảnh VietQR
	BankInfo  BankInfoDTO `json:"bankInfo"`
	Amount    float64     `json:"amount"`
	Content   string      `json:"content"`
}