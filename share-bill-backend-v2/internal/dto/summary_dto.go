package models

type ParticipantSumDTO struct {
	ID           string            `json:"id"`
	Name         string            `json:"name"`
	Avatar       string            `json:"avatar,omitempty"`
	TotalPaid    float64           `json:"totalPaid"`
	TotalBenefit float64           `json:"totalBenefit"`
	Balance      float64           `json:"balance"`     // + = Receive, - = Pay
	BalanceType  string            `json:"balanceType"` // 'credit' or 'debit'
	QRCodeURL    string            `json:"qrCodeUrl,omitempty"`
	Settlement   *SettlementAction `json:"settlementInfo,omitempty"`
}

type SettlementAction struct {
	Action      string `json:"action"` // 'pay' or 'receive'
	Description string `json:"description"`
}

type SettlementPlanItem struct {
	From      SimpleParticipant `json:"from"`
	To        SimpleParticipant `json:"to"`
	Amount    float64           `json:"amount"`
	QRCodeURL string            `json:"qrCodeUrl,omitempty"`
}

type SimpleParticipant struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type MissingBankItem struct {
	ParticipantID string `json:"participantId"`
	Name          string `json:"name"`
}
