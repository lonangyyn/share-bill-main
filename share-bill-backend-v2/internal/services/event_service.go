package services

import (
	database "BACKEND/internal/db/sqlc"
	models "BACKEND/internal/dto"
	utils "BACKEND/internal/utils"
	"context"
)

type EventService struct {
	store database.Store
}

func NewEventService(store database.Store) *EventService {
	return &EventService{store: store}
}

func (s *EventService) CreateEvent(ctx context.Context, userID int64, req models.CreateEventRequest) (models.EventDetailResponse, error) {
	var resp models.EventDetailResponse
	err := s.store.ExecTx(ctx, func(q *database.Queries) error {
		// Tạo event
		var description *string
		if req.Description != "" {
			description = &req.Description
		}
		argEvent := database.CreateEventParams{
			Name: req.Name,
			Currency: req.Currency,
			CreatorID: &userID,
			Description: description,
		}
		event, err := s.store.CreateEvent(ctx, argEvent)
		if err != nil{
			return err
		}
		// Add creator vào event participants
		creator, err := s.store.GetUserByID(ctx, userID)
		if err != nil {
			return err
		}
		argParticipant := database.AddParticipantParams{
			EventID: event.EventID,
			Name: creator.Name,
			UserID: &userID,
			BankName: creator.BankName,
			BankAccount: creator.BankAccount,
			BankOwner: creator.BankOwner,
		}
		_, err = s.store.AddParticipant(ctx, argParticipant)
		if err != nil {
			return err
		}

		resp = models.EventDetailResponse{
			Event: models.EventInfoDTO{
				ID:          event.EventUuid.String(),
				Name:        event.Name,
				Description: utils.GetStringFromPointer(event.Description),
				Currency:    event.Currency,
				Status:      utils.GetStringFromPointer(event.Status),
				CreatedBy: models.CreatorDTO{
					ID:   creator.UserUuid.String(),
					Name: creator.Name,
				},
				CreatedAt: event.CreatedAt.Time, 
				UpdatedAt: event.LastUpdatedAt.Time,
			},
			Stats: models.EventStatsDTO{
				TotalParticipants: 1,
				TotalTransactions: 0,
				TotalExpenses:     0,
				AveragePerPerson:  0,
			},
		}
		return nil
	})
	if err != nil {
		return models.EventDetailResponse{}, utils.ErrInternalDB
	}
	return resp, nil
}

func (s *EventService) GetEvent(ctx context.Context, userID int64, eventUUID string) (models.EventDetailResponse, error) {
	// Logic: 
    // - Convert string UUID -> uuid.UUID/pgtype.UUID
    // - Gọi s.store.GetEventByUUID
    // - Gọi s.store.GetParticipant... để check quyền (nếu cần)
    // - Map sang DTO
	eventUUIDType, err := utils.StringToUUID(eventUUID)
	if err != nil {
		return models.EventDetailResponse{}, utils.ErrInvalidInput
	}
	event, err := s.store.GetEventByUUID(ctx, eventUUIDType)
	if err != nil {
		return models.EventDetailResponse{}, utils.ErrNotFound
	}
	// Kiem tra quyen truy cap
	_, err = s.store.GetParticipantByEventAndUser(ctx, database.GetParticipantByEventAndUserParams{
		EventID: event.EventID,
		UserID:  &userID,
	})
	if err != nil {
		return models.EventDetailResponse{}, utils.ErrPermissionDenied
	}

	creator, err := s.store.GetUserByID(ctx, *event.CreatorID)
	if err != nil {
		return models.EventDetailResponse{}, utils.ErrNotFound
	}

	totalExpFloat := utils.NumericToFloat(event.TotalExpenses) 
    totalPartInt := int(event.TotalParticipants) 
    var average float64
    if totalPartInt > 0 {
        average = totalExpFloat / float64(totalPartInt)
    } 

	return models.EventDetailResponse{
        Event: models.EventInfoDTO{
            ID:          event.EventUuid.String(),
            Name:        event.Name,
            Description: utils.GetStringFromPointer(event.Description),
			Currency:    event.Currency,
			Status:      utils.GetStringFromPointer(event.Status),
			CreatedBy: models.CreatorDTO{
				ID:   creator.UserUuid.String(),
				Name: creator.Name,
			},
			CreatedAt: event.CreatedAt.Time,
			UpdatedAt: event.LastUpdatedAt.Time,
        },
        Stats: models.EventStatsDTO{
            TotalParticipants: totalPartInt,
            TotalTransactions: int(event.TotalTransactions),
            TotalExpenses:     totalExpFloat,
            AveragePerPerson:  average,
        },
    }, nil

}

func (s *EventService) UpdateEvent(ctx context.Context, userID int64, eventUUID string, req models.UpdateEventRequest) (models.EventDetailResponse, error) {
    // Logic:
    // - Check xem userID có phải CreatorID của event không
    // - Gọi s.store.UpdateEvent
	eventUUIDType, err := utils.StringToUUID(eventUUID)
	if err != nil {
		return models.EventDetailResponse{}, utils.ErrInvalidInput
	}
	event, err := s.store.GetEventByUUID(ctx, eventUUIDType)
	if err != nil {
		return models.EventDetailResponse{}, utils.ErrNotFound
	}
	if *event.CreatorID != userID{
		return models.EventDetailResponse{}, utils.ErrPermissionDenied
	}

	arg := database.UpdateEventParams{
		EventID: event.EventID,
		Name: req.Name,
		Description: req.Description,
		Status: req.Status,
	}
	updatedEvent, err := s.store.UpdateEvent(ctx, arg)
	if err != nil {
		return models.EventDetailResponse{}, err
	}

	totalExpFloat := utils.NumericToFloat(updatedEvent.TotalExpenses) 
    totalPartInt := int(updatedEvent.TotalParticipants) 
    var average float64
    if totalPartInt > 0 {
        average = totalExpFloat / float64(totalPartInt)
    } 
	
	creator, _ := s.store.GetUserByID(ctx, userID)
	return models.EventDetailResponse{
		Event: models.EventInfoDTO{
			ID:          updatedEvent.EventUuid.String(),
			Name:        updatedEvent.Name,
			Description: utils.GetStringFromPointer(updatedEvent.Description),
			Currency:    updatedEvent.Currency,
			Status:      utils.GetStringFromPointer(updatedEvent.Status),
            CreatedBy: models.CreatorDTO{
				ID:   creator.UserUuid.String(),
				Name: creator.Name,
			},
			CreatedAt:   updatedEvent.CreatedAt.Time,
			UpdatedAt:   updatedEvent.LastUpdatedAt.Time,
		},
		Stats: models.EventStatsDTO{
			TotalParticipants: totalPartInt,
			TotalTransactions: int(updatedEvent.TotalTransactions),
			TotalExpenses:     totalExpFloat,
			AveragePerPerson:  average,
		},
	}, nil
}

func (s *EventService) ListEvents(ctx context.Context, userID int64) ([]models.EventInfoDTO, error) {
    // Logic:
    // - Gọi s.store.ListEventsByUserID 
	events,  err := s.store.ListEventsByUserID(ctx, &userID)
	if err != nil {
		return nil,  utils.ErrNotFound	
	}
	result := make([]models.EventInfoDTO, 0, len(events))
	for _, event := range events {
		creator, err := s.store.GetUserByID(ctx, *event.CreatorID)
		if err != nil {
			return nil,  utils.ErrNotFound
		}
		dto := models.EventInfoDTO{
			ID: event.EventUuid.String(),
			Name: event.Name,
			Description: utils.GetStringFromPointer(event.Description),
			Currency: event.Currency,
			Status: utils.GetStringFromPointer(event.Status),
			CreatedBy: models.CreatorDTO{
				ID:   creator.UserUuid.String(),
				Name: creator.Name,
			},
			CreatedAt: event.CreatedAt.Time,
			UpdatedAt: event.LastUpdatedAt.Time,
		}
		result = append(result, dto)
	}	
	return result, nil
}

func (s *EventService) JoinEvent(ctx context.Context, userID int64, eventUUID string, req models.UpsertParticipantRequest) error {
    // Logic:
    // - Lấy eventID (int64) từ UUID
    // - Gọi s.store.AddParticipant
	eventUUIDType, err := utils.StringToUUID(eventUUID)
	if err != nil {
		return utils.ErrInvalidInput
	}
	event, err := s.store.GetEventByUUID(ctx, eventUUIDType)
	if err != nil {
		return utils.ErrNotFound
	}
	// Kiem tra user da la participant chua
	_, err = s.store.GetParticipantByEventAndUser(ctx, database.GetParticipantByEventAndUserParams{
		EventID: event.EventID,
		UserID:  &userID,
	})
	if err == nil {
		return utils.ErrAlreadyExists
	}
	// Auto fill bank info
	user, err := s.store.GetUserByID(ctx, userID)
	if err != nil {
		return utils.ErrNotFound
	}
	var bankName, bankAcc, bankOwner *string
	getVal := func(reqVal string, dbVal *string) *string {
		if reqVal != "" {
			return &reqVal
		}
		return dbVal
	}
	if req.BankInfo != nil {
		bankName = getVal(req.BankInfo.BankName, user.BankName)
		bankAcc = getVal(req.BankInfo.AccountNumber, user.BankAccount)
		bankOwner = getVal(req.BankInfo.AccountName, user.BankOwner)
	} else {
		bankName, bankAcc, bankOwner = user.BankName, user.BankAccount, user.BankOwner
	}
	arg := database.AddParticipantParams{
		EventID: event.EventID,
		Name: req.Name,
		UserID: &userID,
		BankName: bankName,
		BankAccount: bankAcc,
		BankOwner: bankOwner,
	}
	_, err = s.store.AddParticipant(ctx, arg)
	return err
}

func (s *EventService) LeaveEvent(ctx context.Context, userID int64, eventUUID string) error {
    // Logic:
    // - Kiểm tra xem user có đang nợ tiền (Balance < 0) trong event không? Nếu có thì chặn.
    // - Gọi s.store.RemoveParticipant (Cần viết thêm query này nếu chưa có)
	eventUUIDType, err := utils.StringToUUID(eventUUID)
	if err != nil {
		return utils.ErrInvalidInput
	}

	event, err := s.store.GetEventByUUID(ctx, eventUUIDType)
	if err != nil {
		return utils.ErrNotFound
	}

	// find participant record first
	part, err := s.store.GetParticipantByEventAndUser(ctx, database.GetParticipantByEventAndUserParams{
		EventID: event.EventID,
		UserID:  &userID,
	})
	if err != nil {
		return utils.ErrNotFound
	}

	balance, err := s.store.GetParticipantBalance(ctx, database.GetParticipantBalanceParams{
		EventID: event.EventID,
		UserID:  &userID,
	})
	if err == nil {
		balanceFloat := utils.NumericToFloat(balance)
		if balanceFloat > 0.01 || balanceFloat < -0.01 {
			return utils.ErrBalanceNotZero
		}
	}

	err = s.store.RemoveParticipantByID(ctx, part.ParticipantID)
	if err != nil {
		return utils.ErrInternalDB
	}

	return nil
}

func (s *EventService) DeleteEvent(ctx context.Context, userID int64, eventUUID string) error {
	// Logic:
	// - Kiểm tra xem user có phải CreatorID của event không
	// - Gọi s.store.DeleteEvent 
	eventUUIDType, err := utils.StringToUUID(eventUUID)
	if err != nil {
		return utils.ErrInvalidInput
	}

	event, err := s.store.GetEventByUUID(ctx, eventUUIDType)
	if err != nil {
		return utils.ErrNotFound
	}

	if *event.CreatorID != userID {
		return utils.ErrPermissionDenied
	}

	err = s.store.DeleteEvent(ctx, event.EventID)
	if err != nil {
		return utils.ErrInternalDB
	}
	return nil
}