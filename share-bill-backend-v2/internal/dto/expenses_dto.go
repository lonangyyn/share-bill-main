package models

import "time"

type CreateTransactionRequest struct {
	Description   string             `json:"description" validate:"required"`
	Amount        float64            `json:"amount" validate:"required,gt=0"`
	Payers        []string 			 `json:"payers" validate:"required"`
	Beneficiaries []TransactionBeneficiary `json:"beneficiaries" validate:"required,min=1"` 
	Attachment    string             `json:"attachment,omitempty"`
}
type TransactionBeneficiary struct {
	ParticipantID string  `json:"participantId" validate:"required"` 
	Weight        float64 `json:"weight"`                            
}

type TransactionResponse struct {
	ID      string `json:"id"`
	EventID string `json:"eventId"`
	Created bool   `json:"created"`
}

// TransactionHistoryResponse used for GET /transactions
// [cite: 3296]
// type TransactionHistoryResponse struct {
// 	Success bool             `json:"success"`
// 	Message string           `json:"message"`
// 	Data    TransactionData  `json:"data"`
// }

// type TransactionData struct {
// 	Event        EventInfoDTO      `json:"event"`
// 	Summary      SummaryStatsDTO   `json:"summary"`
// 	Transactions []TransactionDTO  `json:"transactions"`
// }

// type SummaryStatsDTO struct {
// 	TotalPaidByAll float64       `json:"totalPaidByAll"`
// 	Collector      *CollectorDTO `json:"collector,omitempty"`
// }

// API: GET /api/v1/events/:eventId/transactions
type TransactionDTO struct {
	ID        string    `json:"id"`        
	Description     string    `json:"description"`    
	Amount    float64   `json:"amount"`    
	Date      time.Time `json:"date"`      
	PayerNames  []string  `json:"payerNames"` 
}
// API: GET /transactions/:id
type TransactionDetailResponse struct {
	ID     string    `json:"id"`
	Description     string    `json:"description"`
	Amount float64   `json:"amount"`
	Date   time.Time `json:"date"`
	Payers        []PayerInfo              `json:"payers"`        
	Beneficiaries []TransactionBeneficiary `json:"beneficiaries"` 
	Attachment    string                   `json:"attachment,omitempty"`
}
type PayerInfo struct {
	ID   string `json:"id"`   
	Name string `json:"name"` 
}