package models

import "time"

type RegisterRequestCodeRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type RegisterConfirmRequest struct {
	Email         string `json:"email" validate:"required,email"`
	Code          string `json:"code" validate:"required"` // OTP
	Password      string `json:"password" validate:"required,min=6"`
	Name          string `json:"name" validate:"required"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type LoginResponse struct {
	Token string       `json:"token"`
	RefreshToken string `json:"refreshToken"`
	User  UserResponse `json:"user"`
}

// Refresh token request/response
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type RefreshResponse struct {
	Token string `json:"token"`
	RefreshToken string `json:"refresh_token"`
}

// Logout
type LogoutRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type UserResponse struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Email         string `json:"email"`
	PhoneNumber   *string `json:"phoneNumber"`
	Avatar      *string       `json:"avatar"`             
	BankInfo    *BankInfoDTO `json:"bankInfo,omitempty"`
	UpdatedAt   time.Time    `json:"updatedAt"`
}

type UpdateProfileRequest struct {
	Name          string `json:"name"`
	Avatar        string `json:"avatar"`
	PhoneNumber   string `json:"phoneNumber"`
	BankName      string `json:"bankName"`
	AccountNumber string `json:"accountNumber"`
	AccountName   string `json:"accountName"`
}

