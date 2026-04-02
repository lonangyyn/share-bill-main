package utils

import (
	"fmt"
	"log"
	"strings"

	"gopkg.in/gomail.v2"
)

type EmailSender interface {
	SendEmail(subject string, content string, to []string) error
}

type GmailSender struct {
	name              string
	fromEmailAddress  string
	fromEmailPassword string
}

func NewGmailSender(name string, fromEmailAddress string, fromEmailPassword string) EmailSender {
	return &GmailSender{
		name:              name,
		fromEmailAddress:  strings.TrimSpace(fromEmailAddress),
		fromEmailPassword: strings.TrimSpace(fromEmailPassword),
	}
}

func (sender *GmailSender) SendEmail(subject string, content string, to []string) error {
	// DEV MODE: Nếu chưa cấu hình email thì không gửi, chỉ log ra console để demo.
	if sender.fromEmailAddress == "" || sender.fromEmailPassword == "" {
		log.Println("[DEV MODE] Email sender is not configured -> skip sending email")
		log.Printf("[DEV MODE] To=%v | Subject=%s\n", to, subject)
		// OTP thường nằm trong content, log content để bạn copy OTP.
		log.Printf("[DEV MODE] Content:\n%s\n", content)
		return nil
	}

	m := gomail.NewMessage()
	m.SetHeader("From", fmt.Sprintf("%s <%s>", sender.name, sender.fromEmailAddress))
	m.SetHeader("To", to...)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", content)

	// Gmail SMTP Server
	d := gomail.NewDialer("smtp.gmail.com", 587, sender.fromEmailAddress, sender.fromEmailPassword)

	return d.DialAndSend(m)
}
