package utils

import (
	"math/rand"
	"time"
)

func GenerateOTP() string {
	source := rand.NewSource(time.Now().UnixNano())
	r := rand.New(source)
	const charset = "0123456789"
	otp := make([]byte, 6)
	for i := range otp {
		otp[i] = charset[r.Intn(len(charset))]
	}
	return string(otp)
}