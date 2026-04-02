package services

import (
	"context"
	"errors"

	database "BACKEND/internal/db/sqlc"
	models "BACKEND/internal/dto"
	utils "BACKEND/internal/utils"
)

type ExpenseService struct {
	store database.Store
}

// Khoi tao ExpenseService
func NewExpenseService(store database.Store) *ExpenseService {
	return &ExpenseService{store: store}
} 

// Tao transaction va chen payers + beneficiaries trong DB
func (s *ExpenseService) CreateTransaction(ctx context.Context, userID int64, eventUUIDStr string, req models.CreateTransactionRequest) (models.TransactionResponse, error) {
	eventUUID, err := utils.StringToUUID(eventUUIDStr)
	if err != nil {
		return models.TransactionResponse{}, utils.ErrInvalidInput
	}
	if len(req.Payers) == 0 {
		return models.TransactionResponse{}, errors.New("at least one payer is required")
	}
	if len(req.Beneficiaries) == 0 {
		return models.TransactionResponse{}, errors.New("at least one beneficiary is required")
	}
	event, err := s.store.GetEventByUUID(ctx, eventUUID)
	if err != nil {
		return models.TransactionResponse{}, utils.ErrNotFound
	}
	_, err = s.store.GetParticipantByEventAndUser(ctx, database.GetParticipantByEventAndUserParams{
		EventID: event.EventID,
		UserID:  &userID,
	})
	if err != nil {
		return models.TransactionResponse{}, utils.ErrPermissionDenied
	}

	participantsDB, err := s.store.ListParticipantsByEventID(ctx, event.EventID)
	if err != nil {
		return models.TransactionResponse{}, utils.ErrInternalDB
	}
	partMap := make(map[string]int64)
	for _, p := range participantsDB {
		partMap[p.ParticipantUuid.String()] = p.ParticipantID
	}

	var createdExpenseUUID string

	err = s.store.ExecTx(ctx, func(q *database.Queries) error {
		expense, err := q.CreateExpense(ctx, database.CreateExpenseParams{
			EventID:     event.EventID,
			Description: req.Description, 
			TotalAmount: utils.FloatToNumeric(req.Amount),
		})
		if err != nil {
			return utils.ErrInternalDB
		}
		createdExpenseUUID = expense.ExpenseUuid.String()
		return s.insertExpenseDetails(ctx, q, expense.ExpenseID, req.Amount, req.Payers, req.Beneficiaries, partMap)
	})

	if err != nil {
		return models.TransactionResponse{}, err 
	}

	return models.TransactionResponse{
		ID:      createdExpenseUUID,
		EventID: eventUUIDStr,
		Created: true,
	}, nil
}

// Lay chi tiet transaction (payers + shares)
func (s *ExpenseService) GetTransaction(ctx context.Context, userID int64, transactionUUIDStr string) (models.TransactionDetailResponse, error) {
	txnUUID, err := utils.StringToUUID(transactionUUIDStr)
	if err != nil {
		return models.TransactionDetailResponse{}, utils.ErrInvalidInput
	}

	expense, err := s.store.GetExpenseByUUID(ctx, txnUUID)
	if err != nil {
		return models.TransactionDetailResponse{}, utils.ErrNotFound
	}

	_, err = s.store.GetParticipantByEventAndUser(ctx, database.GetParticipantByEventAndUserParams{
		EventID: expense.EventID,
		UserID:  &userID,
	})
	if err != nil {
		return models.TransactionDetailResponse{}, utils.ErrPermissionDenied
	}

	payers, _ := s.store.GetExpensePayers(ctx, expense.ExpenseID)
	bens, _ := s.store.GetExpenseBeneficiaries(ctx, &expense.ExpenseID)
	var payersResp []models.PayerInfo
	for _, p := range payers {
		payersResp = append(payersResp, models.PayerInfo{
			ID:   p.ParticipantUuid.String(),
			Name: p.Name, 
		})
	}

	var bensResp []models.TransactionBeneficiary
	for _, b := range bens {
		bensResp = append(bensResp, models.TransactionBeneficiary{
			ParticipantID: b.ParticipantUuid.String(),
			Weight:        utils.NumericToFloat(b.SplitRatio), 
		})
	}
	return models.TransactionDetailResponse{
		ID:            expense.ExpenseUuid.String(),
		Description:   expense.Description,
		Amount:        utils.NumericToFloat(expense.TotalAmount),
		Date:          expense.CreatedAt.Time,
		Payers:        payersResp,
		Beneficiaries: bensResp,
	}, nil
}


// Cap nhat transaction (xoa va chen lai chi tiet)
func (s *ExpenseService) UpdateTransaction(ctx context.Context, userID int64, transactionUUIDStr string, req models.CreateTransactionRequest) error {
	txnUUID, err := utils.StringToUUID(transactionUUIDStr)
	if err != nil {
		return utils.ErrInvalidInput
	}
	expense, err := s.store.GetExpenseByUUID(ctx, txnUUID)
	if err != nil {
		return utils.ErrNotFound
	}
	_, err = s.store.GetParticipantByEventAndUser(ctx, database.GetParticipantByEventAndUserParams{
		EventID: expense.EventID,
		UserID:  &userID,
	})
	if err != nil {
		return utils.ErrPermissionDenied
	}

	participants, err := s.store.ListParticipantsByEventID(ctx, expense.EventID)
	if err != nil {
		return utils.ErrInternalDB
	}
	partMap := make(map[string]int64)
	for _, p := range participants {
		partMap[p.ParticipantUuid.String()] = p.ParticipantID
	}

	return s.store.ExecTx(ctx, func(q *database.Queries) error {
		_, err := q.UpdateExpense(ctx, database.UpdateExpenseParams{
			ExpenseID:   expense.ExpenseID,
			Description: req.Description,
			TotalAmount: utils.FloatToNumeric(req.Amount),
		})
		if err != nil {
			return err
		}
		if err := q.DeleteExpensePayers(ctx, expense.ExpenseID); err != nil {
			return err
		}
		if err := q.DeleteExpenseBeneficiaries(ctx, &expense.ExpenseID); err != nil {
			return err
		}
		return s.insertExpenseDetails(ctx, q, expense.ExpenseID, req.Amount, req.Payers, req.Beneficiaries, partMap)
	})
}

// Xoa transaction
func (s *ExpenseService) DeleteTransaction(ctx context.Context, userID int64, transactionUUIDStr string) error {
	txnUUID, err := utils.StringToUUID(transactionUUIDStr)
	if err != nil {
		return utils.ErrInvalidInput
	}
	expense, err := s.store.GetExpenseByUUID(ctx, txnUUID)
	if err != nil {
		return utils.ErrNotFound
	}
	_, err = s.store.GetParticipantByEventAndUser(ctx, database.GetParticipantByEventAndUserParams{
		EventID: expense.EventID,
		UserID:  &userID,
	})
	if err != nil {
		return utils.ErrPermissionDenied
	}
	return s.store.DeleteExpense(ctx, expense.ExpenseID)
}

// Liet ke transactions trong event
func (s *ExpenseService) ListTransactions(ctx context.Context, userID int64, eventUUIDStr string) ([]models.TransactionDTO, error) {
	eventUUID, err := utils.StringToUUID(eventUUIDStr)
	if err != nil {
		return nil, utils.ErrInvalidInput
	}
	event, err := s.store.GetEventByUUID(ctx, eventUUID)
	if err != nil {
		return nil, utils.ErrNotFound
	}
	_, err = s.store.GetParticipantByEventAndUser(ctx, database.GetParticipantByEventAndUserParams{
		EventID: event.EventID,
		UserID:  &userID,
	})
	if err != nil {
		return nil, utils.ErrPermissionDenied
	}

	rawList, err := s.store.ListExpensesByEventID(ctx, event.EventID)
	if err != nil {
		return nil, utils.ErrInternalDB
	}

	result := make([]models.TransactionDTO, 0)
	for _, row := range rawList {
		payerNames := []string{}
		if row.PayerName != "" {
			payerNames = append(payerNames, row.PayerName)
		}

		dto := models.TransactionDTO{
			ID:          row.ExpenseUuid.String(),
			Description: row.Description,
			Amount:      utils.NumericToFloat(row.TotalAmount),
			Date:        row.CreatedAt.Time,
			PayerNames:  payerNames, 
		}
		result = append(result, dto)
	}
	return result, nil
}

// Helper: chen payers va beneficiaries cho expense
func (s *ExpenseService) insertExpenseDetails(
	ctx context.Context,
	q *database.Queries,
	expenseID int64,
	totalAmount float64,
	payerUUIDs []string, 
	beneficiaries []models.TransactionBeneficiary, 
	partMap map[string]int64,
) error {
	if len(payerUUIDs) == 0 {
		return errors.New("at least one payer required")
	}
	amountPerPayer := totalAmount / float64(len(payerUUIDs))

	for _, payerUUID := range payerUUIDs {
		payerID, exists := partMap[payerUUID]
		if !exists {
			return errors.New("payer not found: " + payerUUID)
		}

		err := q.CreateExpensePayer(ctx, database.CreateExpensePayerParams{
			ExpenseID:     expenseID,
			ParticipantID: &payerID,
			PaidAmount:    utils.FloatToNumeric(amountPerPayer),
		})
		if err != nil {
			return err
		}
	}

	var totalWeight float64 = 0
	for _, b := range beneficiaries {
		totalWeight += b.Weight
	}

	if totalWeight <= 0 {
		return errors.New("total weight must be greater than 0")
	}

	for _, b := range beneficiaries {
		benID, exists := partMap[b.ParticipantID]
		if !exists {
			return errors.New("beneficiary not found: " + b.ParticipantID)
		}
		ratio := b.Weight / totalWeight
		
		err := q.CreateExpenseBeneficiary(ctx, database.CreateExpenseBeneficiaryParams{
			ExpenseID:     &expenseID,
			ParticipantID: &benID,
			SplitRatio:    utils.FloatToNumeric(ratio),
		})
		if err != nil {
			return err
		}
	}

	return nil
}