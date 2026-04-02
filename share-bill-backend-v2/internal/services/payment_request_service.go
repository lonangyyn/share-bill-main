package services

import (
	"context"
	"errors"
	"time"

	database "BACKEND/internal/db/sqlc"
	models "BACKEND/internal/dto"
	utils "BACKEND/internal/utils"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	paymentStatusPending   = "pending"
	paymentStatusConfirmed = "confirmed"
	paymentStatusCanceled  = "canceled"
)

type PaymentRequestService struct {
	pool    *pgxpool.Pool
	queries *database.Queries
}

func NewPaymentRequestService(pool *pgxpool.Pool) *PaymentRequestService {
	return &PaymentRequestService{
		pool:    pool,
		queries: database.New(pool),
	}
}

type paymentRequestRow struct {
	id           int64
	uuid         uuid.UUID
	eventID      int64
	payerID      int64
	receiverID   int64
	amount       pgtype.Numeric
	status       string
	createdAt    time.Time
	updatedAt    time.Time
	payerUUID    uuid.UUID
	payerName    string
	receiverUUID uuid.UUID
	receiverName string
}

func (s *PaymentRequestService) CreatePaymentRequest(ctx context.Context, userID int64, eventUUIDStr string, req models.CreatePaymentRequestRequest) (models.PaymentRequestDTO, error) {
	if req.Amount <= 0 || req.PayerID == "" || req.ReceiverID == "" || req.PayerID == req.ReceiverID {
		return models.PaymentRequestDTO{}, utils.ErrInvalidInput
	}

	eventUUID, err := utils.StringToUUID(eventUUIDStr)
	if err != nil {
		return models.PaymentRequestDTO{}, utils.ErrInvalidInput
	}

	event, err := s.queries.GetEventByUUID(ctx, eventUUID)
	if err != nil {
		return models.PaymentRequestDTO{}, utils.ErrNotFound
	}

	requesterPart, err := s.queries.GetParticipantByEventAndUser(ctx, database.GetParticipantByEventAndUserParams{
		EventID: event.EventID,
		UserID:  &userID,
	})
	if err != nil {
		return models.PaymentRequestDTO{}, utils.ErrPermissionDenied
	}

	payerUUID, err := utils.StringToUUID(req.PayerID)
	if err != nil {
		return models.PaymentRequestDTO{}, utils.ErrInvalidInput
	}
	receiverUUID, err := utils.StringToUUID(req.ReceiverID)
	if err != nil {
		return models.PaymentRequestDTO{}, utils.ErrInvalidInput
	}

	payerPart, err := s.queries.GetParticipantByUUID(ctx, payerUUID)
	if err != nil {
		return models.PaymentRequestDTO{}, utils.ErrNotFound
	}
	receiverPart, err := s.queries.GetParticipantByUUID(ctx, receiverUUID)
	if err != nil {
		return models.PaymentRequestDTO{}, utils.ErrNotFound
	}

	if payerPart.EventID != event.EventID || receiverPart.EventID != event.EventID {
		return models.PaymentRequestDTO{}, utils.ErrInvalidInput
	}
	if requesterPart.ParticipantID != payerPart.ParticipantID {
		return models.PaymentRequestDTO{}, utils.ErrPermissionDenied
	}

	var requestUUID uuid.UUID
	var status string
	var amount pgtype.Numeric
	var createdAt time.Time
	var updatedAt time.Time

	err = s.pool.QueryRow(ctx, `
		INSERT INTO payment_requests (event_id, payer_id, receiver_id, amount, status)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING payment_request_uuid, status, amount, created_at, updated_at
	`, event.EventID, payerPart.ParticipantID, receiverPart.ParticipantID, utils.FloatToNumeric(req.Amount), paymentStatusPending).Scan(
		&requestUUID,
		&status,
		&amount,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return models.PaymentRequestDTO{}, utils.ErrInternalDB
	}

	return models.PaymentRequestDTO{
		ID:      requestUUID.String(),
		EventID: eventUUIDStr,
		Payer: models.PaymentPartyDTO{
			ID:   req.PayerID,
			Name: payerPart.Name,
		},
		Receiver: models.PaymentPartyDTO{
			ID:   req.ReceiverID,
			Name: receiverPart.Name,
		},
		Amount:    utils.NumericToFloat(amount),
		Status:    status,
		CreatedAt: createdAt,
		UpdatedAt: updatedAt,
	}, nil
}

func (s *PaymentRequestService) ListPaymentRequests(ctx context.Context, userID int64, eventUUIDStr string) ([]models.PaymentRequestDTO, error) {
	eventUUID, err := utils.StringToUUID(eventUUIDStr)
	if err != nil {
		return nil, utils.ErrInvalidInput
	}

	event, err := s.queries.GetEventByUUID(ctx, eventUUID)
	if err != nil {
		return nil, utils.ErrNotFound
	}

	requesterPart, err := s.queries.GetParticipantByEventAndUser(ctx, database.GetParticipantByEventAndUserParams{
		EventID: event.EventID,
		UserID:  &userID,
	})
	if err != nil {
		return nil, utils.ErrPermissionDenied
	}

	rows, err := s.pool.Query(ctx, `
		SELECT
			pr.payment_request_uuid,
			pr.amount,
			pr.status,
			pr.created_at,
			pr.updated_at,
			payer.participant_uuid,
			payer.name,
			receiver.participant_uuid,
			receiver.name
		FROM payment_requests pr
		JOIN participants payer ON pr.payer_id = payer.participant_id
		JOIN participants receiver ON pr.receiver_id = receiver.participant_id
		WHERE pr.event_id = $1 AND (pr.payer_id = $2 OR pr.receiver_id = $2)
		ORDER BY pr.created_at DESC
	`, event.EventID, requesterPart.ParticipantID)
	if err != nil {
		return nil, utils.ErrInternalDB
	}
	defer rows.Close()

	items := make([]models.PaymentRequestDTO, 0)
	for rows.Next() {
		var row paymentRequestRow
		if err := rows.Scan(
			&row.uuid,
			&row.amount,
			&row.status,
			&row.createdAt,
			&row.updatedAt,
			&row.payerUUID,
			&row.payerName,
			&row.receiverUUID,
			&row.receiverName,
		); err != nil {
			return nil, utils.ErrInternalDB
		}
		items = append(items, models.PaymentRequestDTO{
			ID:      row.uuid.String(),
			EventID: eventUUIDStr,
			Payer: models.PaymentPartyDTO{
				ID:   row.payerUUID.String(),
				Name: row.payerName,
			},
			Receiver: models.PaymentPartyDTO{
				ID:   row.receiverUUID.String(),
				Name: row.receiverName,
			},
			Amount:    utils.NumericToFloat(row.amount),
			Status:    row.status,
			CreatedAt: row.createdAt,
			UpdatedAt: row.updatedAt,
		})
	}
	if err := rows.Err(); err != nil {
		return nil, utils.ErrInternalDB
	}
	return items, nil
}

func (s *PaymentRequestService) ConfirmPaymentRequest(ctx context.Context, userID int64, eventUUIDStr string, requestUUIDStr string) (models.PaymentRequestDTO, error) {
	eventUUID, err := utils.StringToUUID(eventUUIDStr)
	if err != nil {
		return models.PaymentRequestDTO{}, utils.ErrInvalidInput
	}
	requestUUID, err := utils.StringToUUID(requestUUIDStr)
	if err != nil {
		return models.PaymentRequestDTO{}, utils.ErrInvalidInput
	}

	event, err := s.queries.GetEventByUUID(ctx, eventUUID)
	if err != nil {
		return models.PaymentRequestDTO{}, utils.ErrNotFound
	}

	requesterPart, err := s.queries.GetParticipantByEventAndUser(ctx, database.GetParticipantByEventAndUserParams{
		EventID: event.EventID,
		UserID:  &userID,
	})
	if err != nil {
		return models.PaymentRequestDTO{}, utils.ErrPermissionDenied
	}

	row, err := s.getPaymentRequest(ctx, event.EventID, requestUUID)
	if err != nil {
		return models.PaymentRequestDTO{}, err
	}
	if row.receiverID != requesterPart.ParticipantID {
		return models.PaymentRequestDTO{}, utils.ErrPermissionDenied
	}
	if row.status != paymentStatusPending {
		return models.PaymentRequestDTO{}, utils.ErrInvalidInput
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return models.PaymentRequestDTO{}, utils.ErrInternalDB
	}
	defer tx.Rollback(ctx)

	var updatedAt time.Time
	err = tx.QueryRow(ctx, `
		UPDATE payment_requests
		SET status = $1, updated_at = NOW()
		WHERE payment_request_id = $2 AND status = $3
		RETURNING updated_at
	`, paymentStatusConfirmed, row.id, paymentStatusPending).Scan(&updatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return models.PaymentRequestDTO{}, utils.ErrInvalidInput
		}
		return models.PaymentRequestDTO{}, utils.ErrInternalDB
	}

	q := database.New(tx)
	_, err = q.CreateSettlement(ctx, database.CreateSettlementParams{
		EventID:    row.eventID,
		PayerID:    &row.payerID,
		ReceiverID: &row.receiverID,
		Amount:     row.amount,
	})
	if err != nil {
		return models.PaymentRequestDTO{}, utils.ErrInternalDB
	}

	if err := tx.Commit(ctx); err != nil {
		return models.PaymentRequestDTO{}, utils.ErrInternalDB
	}

	row.status = paymentStatusConfirmed
	row.updatedAt = updatedAt
	return s.toPaymentRequestDTO(row, eventUUIDStr), nil
}

func (s *PaymentRequestService) CancelPaymentRequest(ctx context.Context, userID int64, eventUUIDStr string, requestUUIDStr string) (models.PaymentRequestDTO, error) {
	eventUUID, err := utils.StringToUUID(eventUUIDStr)
	if err != nil {
		return models.PaymentRequestDTO{}, utils.ErrInvalidInput
	}
	requestUUID, err := utils.StringToUUID(requestUUIDStr)
	if err != nil {
		return models.PaymentRequestDTO{}, utils.ErrInvalidInput
	}

	event, err := s.queries.GetEventByUUID(ctx, eventUUID)
	if err != nil {
		return models.PaymentRequestDTO{}, utils.ErrNotFound
	}

	requesterPart, err := s.queries.GetParticipantByEventAndUser(ctx, database.GetParticipantByEventAndUserParams{
		EventID: event.EventID,
		UserID:  &userID,
	})
	if err != nil {
		return models.PaymentRequestDTO{}, utils.ErrPermissionDenied
	}

	row, err := s.getPaymentRequest(ctx, event.EventID, requestUUID)
	if err != nil {
		return models.PaymentRequestDTO{}, err
	}
	if row.receiverID != requesterPart.ParticipantID {
		return models.PaymentRequestDTO{}, utils.ErrPermissionDenied
	}
	if row.status != paymentStatusPending {
		return models.PaymentRequestDTO{}, utils.ErrInvalidInput
	}

	var updatedAt time.Time
	err = s.pool.QueryRow(ctx, `
		UPDATE payment_requests
		SET status = $1, updated_at = NOW()
		WHERE payment_request_id = $2 AND status = $3
		RETURNING updated_at
	`, paymentStatusCanceled, row.id, paymentStatusPending).Scan(&updatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return models.PaymentRequestDTO{}, utils.ErrInvalidInput
		}
		return models.PaymentRequestDTO{}, utils.ErrInternalDB
	}

	row.status = paymentStatusCanceled
	row.updatedAt = updatedAt
	return s.toPaymentRequestDTO(row, eventUUIDStr), nil
}

func (s *PaymentRequestService) getPaymentRequest(ctx context.Context, eventID int64, requestUUID uuid.UUID) (paymentRequestRow, error) {
	var row paymentRequestRow
	err := s.pool.QueryRow(ctx, `
		SELECT
			pr.payment_request_id,
			pr.payment_request_uuid,
			pr.event_id,
			pr.payer_id,
			pr.receiver_id,
			pr.amount,
			pr.status,
			pr.created_at,
			pr.updated_at,
			payer.participant_uuid,
			payer.name,
			receiver.participant_uuid,
			receiver.name
		FROM payment_requests pr
		JOIN participants payer ON pr.payer_id = payer.participant_id
		JOIN participants receiver ON pr.receiver_id = receiver.participant_id
		WHERE pr.event_id = $1 AND pr.payment_request_uuid = $2
		LIMIT 1
	`, eventID, requestUUID).Scan(
		&row.id,
		&row.uuid,
		&row.eventID,
		&row.payerID,
		&row.receiverID,
		&row.amount,
		&row.status,
		&row.createdAt,
		&row.updatedAt,
		&row.payerUUID,
		&row.payerName,
		&row.receiverUUID,
		&row.receiverName,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return paymentRequestRow{}, utils.ErrNotFound
		}
		return paymentRequestRow{}, utils.ErrInternalDB
	}
	return row, nil
}

func (s *PaymentRequestService) toPaymentRequestDTO(row paymentRequestRow, eventUUIDStr string) models.PaymentRequestDTO {
	return models.PaymentRequestDTO{
		ID:      row.uuid.String(),
		EventID: eventUUIDStr,
		Payer: models.PaymentPartyDTO{
			ID:   row.payerUUID.String(),
			Name: row.payerName,
		},
		Receiver: models.PaymentPartyDTO{
			ID:   row.receiverUUID.String(),
			Name: row.receiverName,
		},
		Amount:    utils.NumericToFloat(row.amount),
		Status:    row.status,
		CreatedAt: row.createdAt,
		UpdatedAt: row.updatedAt,
	}
}
