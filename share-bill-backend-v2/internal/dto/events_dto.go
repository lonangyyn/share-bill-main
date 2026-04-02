package models

import "time"


type CreateEventRequest struct {
	Name        string `json:"name" validate:"required"`
	Currency    string `json:"currency" validate:"required"`
	Description string `json:"description"`
}

type UpdateEventRequest struct {
	Name		*string `json:"name"`
	Description *string `json:"description"`
	Currency    *string `json:"currency"`
	Status 	*string `json:"status"`
}


type EventDetailResponse struct {
	Event EventInfoDTO  `json:"event"`
	Stats EventStatsDTO `json:"stats"`
}

type EventInfoDTO struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Currency    string      `json:"currency"`
	Status      string      `json:"status"`
	CreatedBy   CreatorDTO  `json:"createdBy"`
	CreatedAt   time.Time   `json:"createdAt"`
	UpdatedAt   time.Time   `json:"updatedAt"`
}

type CreatorDTO struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type EventStatsDTO struct {
	TotalParticipants int     `json:"totalParticipants"`
	TotalTransactions int     `json:"totalTransactions"`
	TotalExpenses     float64 `json:"totalExpenses"`
	AveragePerPerson  float64 `json:"averagePerPerson"`
}