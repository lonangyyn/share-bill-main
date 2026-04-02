package services

import (
	"context"
	"errors"

	database "BACKEND/internal/db/sqlc"
	models "BACKEND/internal/dto"
	utils "BACKEND/internal/utils"
)

type ParticipantService struct {
	store database.Store
}

// Khoi tao ParticipantService
func NewParticipantService(store database.Store) *ParticipantService {
	return &ParticipantService{store: store}
} 

// Liet ke participants va tra DTO
func (s *ParticipantService) ListParticipants(ctx context.Context, userID int64, eventUUIDStr string) (models.ParticipantListResponse, error) {
	eventUUID, err := utils.StringToUUID(eventUUIDStr)
	if err != nil {
		return models.ParticipantListResponse{}, utils.ErrInvalidInput
	}
	event, err := s.store.GetEventByUUID(ctx, eventUUID)
	if err != nil {
		return models.ParticipantListResponse{}, utils.ErrNotFound
	}

	_, err = s.store.GetParticipantByEventAndUser(ctx, database.GetParticipantByEventAndUserParams{
		EventID: event.EventID,
		UserID:  &userID,
	})
	if err != nil {
		return models.ParticipantListResponse{}, utils.ErrPermissionDenied
	}
	rows, err := s.store.ListParticipantsByEventID(ctx, event.EventID)
	if err != nil {
		return models.ParticipantListResponse{}, utils.ErrInternalDB
	}
	dtos := make([]models.ParticipantDTO, 0)
	for _, row := range rows {
		isGuest := true
		userUUIDStr := ""
		email := ""
		if row.UserGlobalUuid.Valid {
			isGuest = false
			userUUIDStr = row.UserGlobalUuid.String()
		}
		if row.UserEmail != nil {
			email = *row.UserEmail
		}

		dto := models.ParticipantDTO{
			ID:       row.ParticipantUuid.String(),
			Name:     row.Name,
			JoinedAt: row.JoinedAt.Time,
			BankInfo: &models.BankInfoDTO{
				BankName:      utils.GetStringFromPointer(row.BankName),
				AccountNumber: utils.GetStringFromPointer(row.BankAccount),
				AccountName:   utils.GetStringFromPointer(row.BankOwner),
			},
			UserID:  userUUIDStr,
			Email:   email,
			IsGuest: isGuest,
		}
		dtos = append(dtos, dto)
	}
	return models.ParticipantListResponse{
		EventID:      eventUUIDStr,
		Participants: dtos,
	}, nil
}
// Them participant khong phai user (guest)
func (s *ParticipantService) AddVirtualParticipant(ctx context.Context, userID int64, eventUUIDStr string, req models.UpsertParticipantRequest) (models.ParticipantDTO, error) {
	eventUUID, err := utils.StringToUUID(eventUUIDStr)
	if err != nil {
		return models.ParticipantDTO{}, utils.ErrInvalidInput
	}
	event, err := s.store.GetEventByUUID(ctx, eventUUID)
	if err != nil {
		return models.ParticipantDTO{}, utils.ErrNotFound
	}
	_, err = s.store.GetParticipantByEventAndUser(ctx, database.GetParticipantByEventAndUserParams{
		EventID: event.EventID,
		UserID:  &userID,
	})
	if err != nil {
		return models.ParticipantDTO{}, utils.ErrPermissionDenied
	}
	var bName, bAcc, bOwner *string
	if req.BankInfo != nil {
		if req.BankInfo.BankName != "" { 
			bName = &req.BankInfo.BankName 
		}
		if req.BankInfo.AccountNumber != "" { 
			bAcc = &req.BankInfo.AccountNumber 
		}
		if req.BankInfo.AccountName != "" { 
			bOwner = &req.BankInfo.AccountName 
		}
	}
	newPart, err := s.store.AddParticipant(ctx, database.AddParticipantParams{
		EventID:     event.EventID,
		UserID:      nil,
		Name:        req.Name,
		BankName:    bName,
		BankAccount: bAcc,
		BankOwner:   bOwner,
	})
	if err != nil {
		return models.ParticipantDTO{}, utils.ErrInternalDB
	}

	return models.ParticipantDTO{
		ID:       newPart.ParticipantUuid.String(),
		Name:     newPart.Name,
		JoinedAt: newPart.JoinedAt.Time,
		IsGuest:  true,
		BankInfo: req.BankInfo,
	}, nil
}

// Cap nhat participant (check quyen owner/creator)
func (s *ParticipantService) UpdateParticipant(ctx context.Context, userID int64, participantUUIDStr string, req models.UpsertParticipantRequest) (models.ParticipantDTO, error) {
	partUUID, err := utils.StringToUUID(participantUUIDStr)
	if err != nil {
		return models.ParticipantDTO{}, utils.ErrInvalidInput
	}
	part, err := s.store.GetParticipantByUUID(ctx, partUUID)
	if err != nil {
		return models.ParticipantDTO{}, utils.ErrNotFound
	}

	// Case A: User thật sửa mình
	// Case B: Creator sửa Guest
	canEdit := false
	if part.UserID != nil && *part.UserID == userID {
		canEdit = true // Case A
	} else if part.UserID == nil {
		// Case B
		event, _ := s.store.GetEventByID(ctx, part.EventID) 
		if event.CreatorID != nil && *event.CreatorID == userID {
			canEdit = true
		}
	}
	if !canEdit {
		return models.ParticipantDTO{}, utils.ErrPermissionDenied
	}

	var bName, bAcc, bOwner *string
	if req.BankInfo != nil {
		bName = utils.StringToPtr(req.BankInfo.BankName)
		bAcc = utils.StringToPtr(req.BankInfo.AccountNumber)
		bOwner = utils.StringToPtr(req.BankInfo.AccountName)
	}

	updated, err := s.store.UpdateParticipant(ctx, database.UpdateParticipantParams{
		ParticipantID: part.ParticipantID,
		Name:          utils.StringToPtr(req.Name),
		BankName:      bName,
		BankAccount:   bAcc,
		BankOwner:     bOwner,
	})
	if err != nil {
		return models.ParticipantDTO{}, utils.ErrInternalDB
	}
	return models.ParticipantDTO{
		ID:       updated.ParticipantUuid.String(),
		Name:     updated.Name,
		JoinedAt: updated.JoinedAt.Time,
		IsGuest:  updated.UserID == nil,
		BankInfo: &models.BankInfoDTO{
			BankName:      utils.GetStringFromPointer(updated.BankName),
			AccountNumber: utils.GetStringFromPointer(updated.BankAccount),
			AccountName:   utils.GetStringFromPointer(updated.BankOwner),
		},
	}, nil
}

// Kick participant (chi creator, khong kick chinh minh neu co user)
func (s *ParticipantService) KickParticipant(ctx context.Context, requesterID int64, participantUUIDStr string) error {
	partUUID, err := utils.StringToUUID(participantUUIDStr)
	if err != nil {
		return utils.ErrInvalidInput
	}
	part, err := s.store.GetParticipantByUUID(ctx, partUUID)
	if err != nil {
		return utils.ErrNotFound
	}
	event, err := s.store.GetEventByID(ctx, part.EventID)
	if err != nil {
		return utils.ErrInternalDB
	}
	if event.CreatorID == nil || *event.CreatorID != requesterID {
		return utils.ErrPermissionDenied
	}
	if part.UserID != nil && *part.UserID == requesterID {
		return errors.New("cannot kick yourself")
	}
	// Banlance > 0 ko duoc kick
	if part.UserID != nil {
		bal, err := s.store.GetParticipantBalance(ctx, database.GetParticipantBalanceParams{
			EventID: event.EventID,
			UserID:  part.UserID,
		})
		if err == nil {
			balFloat := utils.NumericToFloat(bal)
			if balFloat > 0.01 || balFloat < -0.01 {
				return utils.ErrBalanceNotZero
			}
		}
	}

	err = s.store.RemoveParticipantByID(ctx, part.ParticipantID)
	if err != nil {
		return utils.ErrInternalDB
	}
	return nil
}