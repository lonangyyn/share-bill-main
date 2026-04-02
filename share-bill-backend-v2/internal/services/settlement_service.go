package services

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	database "BACKEND/internal/db/sqlc"
	models "BACKEND/internal/dto"
	utils "BACKEND/internal/utils"
)

type SettlementService struct {
	store database.Store
}

// Khoi tao SettlementService
func NewSettlementService(store database.Store) *SettlementService {
	return &SettlementService{store: store}
} 

// Tinh balances, tao suggestions va tra summary
func (s *SettlementService) GetEventSummary(ctx context.Context, userID int64, eventUUIDStr string) (models.EventSummaryResponse, error) {
	eventUUID, err := utils.StringToUUID(eventUUIDStr)
	if err != nil {
		return models.EventSummaryResponse{}, utils.ErrInvalidInput
	}
	event, err := s.store.GetEventByUUID(ctx, eventUUID)
	if err != nil {
		return models.EventSummaryResponse{}, utils.ErrNotFound
	}
	// Check Permission
	_, err = s.store.GetParticipantByEventAndUser(ctx, database.GetParticipantByEventAndUserParams{
		EventID: event.EventID, UserID: &userID,
	})
	if err != nil {
		return models.EventSummaryResponse{}, utils.ErrPermissionDenied
	}

	rows, err := s.store.GetEventBalances(ctx, event.EventID)
	if err != nil {
		return models.EventSummaryResponse{}, utils.ErrInternalDB
	}
	var participantsDTO []models.ParticipantBalDTO
	
	debtors := make(map[string]float64)   
	creditors := make(map[string]float64) 
	nameMap := make(map[string]string)

	var totalExpenses float64 = 0
	for _, row := range rows {
		paid := utils.NumericToFloat(row.TotalPaid)
		share := utils.NumericToFloat(row.TotalShare)
		sent := utils.NumericToFloat(row.TotalSettledSent)
		received := utils.NumericToFloat(row.TotalSettledReceived)

		totalExpenses += paid
		finalBalance := (paid - share) + (sent - received)	
		uuidStr := row.ParticipantUuid.String()
		nameMap[uuidStr] = row.Name

		balanceType := "settled"
		action := "none"
		description := "All settled"
		// Avatar: map từ row.Avatar (nếu DB có) hoặc để rỗng
		avatarUrl :=  ""

		if finalBalance > 0 {
			balanceType = "credit"
			action = "receive"
			description = fmt.Sprintf("Receives %v", finalBalance)
			creditors[uuidStr] = finalBalance
		} else if finalBalance < 0 {
			balanceType = "debit"
			action = "pay"
			description = fmt.Sprintf("Pays %v", -finalBalance)
			debtors[uuidStr] = -finalBalance
		}

		dto := models.ParticipantBalDTO{
			ID:           uuidStr,
			Name:         row.Name,
			Avatar:       avatarUrl,
			TotalPaid:    paid,
			TotalBenefit: share,
			Balance:      finalBalance,
			BalanceType:  balanceType,
			SettlementInfo: &models.SettlementInfoDTO{
				Action:      action,
				Description: description,
			},
		}
		participantsDTO = append(participantsDTO, dto)
	}
	var suggestions []models.SettlementPlanDTO
	for len(debtors) > 0 && len(creditors) > 0 {
		var maxDebtor string
		var maxDebtAmount float64
		for id, amt := range debtors {
			if amt > maxDebtAmount {
				maxDebtor = id
				maxDebtAmount = amt
			}
		}

		var maxCreditor string
		var maxCreditAmount float64
		for id, amt := range creditors {
			if amt > maxCreditAmount {
				maxCreditor = id
				maxCreditAmount = amt
			}
		}

		amount := math.Min(maxDebtAmount, maxCreditAmount)
		if amount > 0.01 {
			suggestions = append(suggestions, models.SettlementPlanDTO{
				From: models.SettlementParty{
					ID:   maxDebtor,
					Name: nameMap[maxDebtor],
				},
				To: models.SettlementParty{
					ID:   maxCreditor,
					Name: nameMap[maxCreditor],
				},
				Amount: amount,
			})
		}

		debtors[maxDebtor] -= amount
		creditors[maxCreditor] -= amount

		if debtors[maxDebtor] < 0.01 { delete(debtors, maxDebtor) }
		if creditors[maxCreditor] < 0.01 { delete(creditors, maxCreditor) }
	}

	var avgPerPerson float64 = 0
	if len(rows) > 0 {
		avgPerPerson = totalExpenses / float64(len(rows))
	}

	status := "active"
	if strings.ToUpper(*event.Status) == "CLOSED" {
		status = "closed"
	}
	collectorDTO := s.getCollectorInfo(ctx, event.EventID)

	resp := models.EventSummaryResponse{
		Event: models.SettlementEventDTO{
			ID:                eventUUIDStr,
			Name:              event.Name,
			Currency:          event.Currency,
			TotalExpenses:     totalExpenses,
			TotalParticipants: len(rows),
			AveragePerPerson:  avgPerPerson,
			Status:            status,
		},
		Summary: models.SummaryInfoDTO{
			TotalPaidByAll: totalExpenses,
			Collector:      collectorDTO,
		},
		Participants:   participantsDTO,
		SettlementPlan: suggestions,
		Meta: models.SummaryMeta{
			GeneratedAt: time.Now(),
		},
	}

	return resp, nil
}
// Lay thong tin collector hien tai (helper)
func (s *SettlementService) getCollectorInfo(ctx context.Context, eventID int64) *models.CollectorDTO {
	collector, err := s.store.GetActiveCollectorByEventID(ctx, eventID)
	if err != nil {
		return nil
	}
	return &models.CollectorDTO{
		ID:   collector.ParticipantUuid.String(),
		Name: collector.ParticipantName,
		BankInfo: models.BankInfoDTO{
			BankName:      collector.BankName,
			AccountNumber: collector.BankAccount,
			AccountName:   collector.BankOwner,
		},
	}
	
}

// Ghi mot settlement trong DB
func (s *SettlementService) CreateSettlement(ctx context.Context, userID int64, eventUUIDStr string, req models.CreateSettlementRequest) error {
	eventUUID, err := utils.StringToUUID(eventUUIDStr)
	if err != nil {
		return utils.ErrInvalidInput
	}
	if req.PayerUUID == req.ReceiverUUID {
		return errors.New("payer and receiver cannot be the same")
	}

	event, err := s.store.GetEventByUUID(ctx, eventUUID)
	if err != nil {
		return utils.ErrNotFound
	}
	_, err = s.store.GetParticipantByEventAndUser(ctx, database.GetParticipantByEventAndUserParams{
		EventID: event.EventID, UserID: &userID,
	})
	if err != nil {
		return utils.ErrPermissionDenied
	}

	parts, _ := s.store.ListParticipantsByEventID(ctx, event.EventID)
	partMap := make(map[string]int64)
	for _, p := range parts {
		partMap[p.ParticipantUuid.String()] = p.ParticipantID
	}

	payerID, ok1 := partMap[req.PayerUUID]
	receiverID, ok2 := partMap[req.ReceiverUUID]
	if !ok1 || !ok2 {
		return utils.ErrNotFound
	}

	_, err = s.store.CreateSettlement(ctx, database.CreateSettlementParams{
		EventID:    event.EventID,
		PayerID:    &payerID,
		ReceiverID: &receiverID,
		Amount:     utils.FloatToNumeric(req.Amount),
	})
	return err
}