package models

import "time"


type CreateSettlementRequest struct {
	PayerUUID    string  `json:"payerId" validate:"required"`
	ReceiverUUID string  `json:"receiverId" validate:"required"`
	Amount       float64 `json:"amount" validate:"required,gt=0"`
}
type EventSummaryResponse struct {
	Event          SettlementEventDTO        `json:"event"`
	Summary        SummaryInfoDTO      `json:"summary"`
	Participants   []ParticipantBalDTO `json:"participants"`   
	SettlementPlan []SettlementPlanDTO `json:"settlementPlan"` 
	Meta           SummaryMeta         `json:"meta"`
}

type SettlementEventDTO struct {
	ID                string `json:"id"`
	Name              string `json:"name"`
	TotalExpenses     float64 `json:"totalExpenses"`
	AveragePerPerson  float64 `json:"averagePerPerson"`
	TotalParticipants int     `json:"totalParticipants"`
	Currency          string  `json:"currency"`
	Status            string  `json:"status"`
}

type SummaryInfoDTO struct {
	TotalPaidByAll float64       `json:"totalPaidByAll"`
	Collector      *CollectorDTO `json:"collector"`
}

type CollectorDTO struct {
	ID       string      `json:"id"`
	Name     string      `json:"name"`
	BankInfo BankInfoDTO `json:"bankInfo"`
}

type ParticipantBalDTO struct {
	ID             string       `json:"id"`
	Name           string       `json:"name"`
	Avatar         string       `json:"avatar,omitempty"`
	TotalPaid      float64      `json:"totalPaid"`
	TotalBenefit   float64      `json:"totalBenefit"` // Số tiền phải đóng
	Balance        float64      `json:"balance"`      // Dư/Nợ
	BalanceType    string       `json:"balanceType"`  // "credit" (dư) hoặc "debit" (nợ)
	QRCodeURL      string       `json:"qrCodeUrl,omitempty"`
	SettlementInfo *SettlementInfoDTO `json:"settlementInfo,omitempty"`
}

type SettlementInfoDTO struct {
	Action      string `json:"action"`      // "pay"/"receive"
	Description string `json:"description"` 
}

type SettlementPlanDTO struct {
	From   SettlementParty `json:"from"`
	To     SettlementParty `json:"to"`
	Amount float64         `json:"amount"`
}

type SettlementParty struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type SummaryMeta struct {
	GeneratedAt time.Time `json:"generatedAt"`
}