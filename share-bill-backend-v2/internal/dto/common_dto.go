package models

type BankInfoDTO struct {
	BankName      string `json:"bankName" validate:"required"`
	AccountNumber string `json:"accountNumber" validate:"required"`
	AccountName   string `json:"accountName" validate:"required"`
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}

type SuccessResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
}