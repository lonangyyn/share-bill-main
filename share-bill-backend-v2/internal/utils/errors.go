package utils

import "errors"

var (
	// 400 Bad Request
	ErrInvalidInput = errors.New("invalid input data")

	// 401 Unauthorized
	ErrUnauthorized = errors.New("authentication required")

	// 403 Forbidden
	ErrPermissionDenied = errors.New("permission denied: you do not have access")
	// 404 Not Found
	ErrNotFound      = errors.New("resource not found")
	

	// 409 Conflict
	ErrAlreadyExists  = errors.New("resource already exists")
	ErrBalanceNotZero = errors.New("cannot leave event: you have unsettled balance")
	ErrEventClosed    = errors.New("event is closed")

	// Rate limit / client errors
	ErrTooManyRequests = errors.New("too many requests")

	// 500 Internal Server Error
	ErrInternalDB = errors.New("internal database error")
)