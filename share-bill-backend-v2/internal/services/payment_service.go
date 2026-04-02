package services

import (
	"context"
	"errors"
	"fmt"
	"net/url"

	database "BACKEND/internal/db/sqlc"
	models "BACKEND/internal/dto"
	utils "BACKEND/internal/utils"
)

type PaymentService struct {
	store database.Store
}

// Khoi tao PaymentService
func NewPaymentService(store database.Store) *PaymentService {
	return &PaymentService{store: store}
} 

// Dat collector cho event (deactivate cu + tao moi)
func (s *PaymentService) SetCollector(ctx context.Context, requesterID int64, eventUUIDStr string, req models.SetCollectorRequest) error {
	eventUUID, err := utils.StringToUUID(eventUUIDStr)
	if err != nil { 
		return utils.ErrInvalidInput 
	}
	targetPartUUID, err := utils.StringToUUID(req.ParticipantID)
	if err != nil { 
		return utils.ErrInvalidInput 
	}

	event, err := s.store.GetEventByUUID(ctx, eventUUID)
	if err != nil { 
		return utils.ErrNotFound 
	}
	if event.CreatorID == nil || *event.CreatorID != requesterID {
		return utils.ErrPermissionDenied
	}
	part, err := s.store.GetParticipantByUUID(ctx, targetPartUUID)
	if err != nil { 
		return utils.ErrNotFound 
	}
	if part.EventID != event.EventID {
		return errors.New("participant does not belong to this event")
	}

	err = s.store.ExecTx(ctx, func(q *database.Queries) error {
		// Get active collector for event to deactivate it
		activeCollector, err := q.GetActiveCollectorByEventID(ctx, event.EventID)
		if err == nil {
			// Only deactivate if one exists
			if err := q.DeactivateCollector(ctx, activeCollector.CollectorID); err != nil {
				return err
			}
		}
		var bankName, bankAcc, bankOwner string
		if part.BankName == nil || part.BankAccount == nil || part.BankOwner == nil {
			bankName = req.BankInfo.BankName
			bankAcc = req.BankInfo.AccountNumber
			bankOwner = req.BankInfo.AccountName
		} else {
			bankName = *part.BankName
			bankAcc = *part.BankAccount
			bankOwner = *part.BankOwner
		}
		_, err = q.CreateCollector(ctx, database.CreateCollectorParams{
			EventID:       event.EventID,
			ParticipantID: &part.ParticipantID, 
			BankName:      bankName,
			BankAccount:   bankAcc,
			BankOwner:     bankOwner, 
		})
		return err
	})
	if err != nil { 
		return utils.ErrInternalDB 
	}
	return nil
}

// Lay collector dang active cho event
func (s *PaymentService) GetActiveCollector(ctx context.Context, userID int64, eventUUIDStr string) (models.CollectorResponse, error) {
	eventUUID, err := utils.StringToUUID(eventUUIDStr)
	if err != nil { 
		return models.CollectorResponse{}, utils.ErrInvalidInput 
	}

	event, err := s.store.GetEventByUUID(ctx, eventUUID)
	if err != nil { 
		return models.CollectorResponse{}, utils.ErrNotFound 
	}
	_, err = s.store.GetParticipantByEventAndUser(ctx, database.GetParticipantByEventAndUserParams{
		EventID: event.EventID, UserID: &userID,
	})
	if err != nil { 
		return models.CollectorResponse{}, utils.ErrPermissionDenied 
	}
	coll, err := s.store.GetActiveCollectorByEventID(ctx, event.EventID)
	if err != nil {
		return models.CollectorResponse{}, utils.ErrInternalDB
	}

	return models.CollectorResponse{
		ParticipantID: coll.ParticipantUuid.String(), 
		Name:          coll.ParticipantName,                     
		BankInfo: models.BankInfoDTO{
			BankName:      coll.BankName,
			AccountNumber: coll.BankAccount,
			AccountName:   coll.BankOwner,
		},
	}, nil
}

// Tao URL QR cho thanh toan (quicklink)
func (s *PaymentService) GeneratePaymentQR(ctx context.Context, userID int64, eventUUIDStr string, receiverUUIDStr string, amount float64) (models.PaymentQRResponse, error) {
	eventUUID, err := utils.StringToUUID(eventUUIDStr)
	if err != nil { 
		return models.PaymentQRResponse{}, utils.ErrInvalidInput 
	}

	event, err := s.store.GetEventByUUID(ctx, eventUUID)
	if err != nil { 
		return models.PaymentQRResponse{}, utils.ErrNotFound 
	}
	var bankName, bankAcc, bankOwner string
	if receiverUUIDStr != "" {
		recUUID, err := utils.StringToUUID(receiverUUIDStr)
		if err != nil { 
			return models.PaymentQRResponse{}, utils.ErrInvalidInput 
		}	
		part, err := s.store.GetParticipantByUUID(ctx, recUUID)
		if err != nil { 
			return models.PaymentQRResponse{}, utils.ErrNotFound 
		}

		if part.BankName == nil || part.BankAccount == nil {
			return models.PaymentQRResponse{}, errors.New("receiver does not have bank info")
		}
		bankName = *part.BankName
		bankAcc = *part.BankAccount
		bankOwner = *part.BankOwner 

	} else {
		coll, err := s.store.GetActiveCollectorByEventID(ctx, event.EventID)
		if err != nil {
			return models.PaymentQRResponse{}, errors.New("no active collector configured")
		}
		bankName = coll.BankName
		bankAcc = coll.BankAccount
		bankOwner = coll.BankOwner
	}
	// Xài quicklink
	// Format: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<CONTENT>&accountName=<NAME>
	template := "compact2" 
	content := fmt.Sprintf("Thanh toan Event %s", event.Name)
	encodedContent := url.QueryEscape(content)
	encodedName := url.QueryEscape(bankOwner)
	qrURL := fmt.Sprintf("https://img.vietqr.io/image/%s-%s-%s.png?amount=%.0f&addInfo=%s&accountName=%s",
		bankName, bankAcc, template, amount, encodedContent, encodedName,
	)
	return models.PaymentQRResponse{
		QRCodeURL: qrURL,
		BankInfo: models.BankInfoDTO{
			BankName:      bankName,
			AccountNumber: bankAcc,
			AccountName:   bankOwner,
		},
		Amount:  amount,
		Content: content,
	}, nil
}