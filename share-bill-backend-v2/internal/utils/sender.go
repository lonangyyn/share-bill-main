package utils

import (
	"fmt"
	"log"
	"strings"

	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
)

type EmailSender interface {
	SendEmail(subject string, content string, to []string) error
}

type SendGridSender struct {
	name             string
	fromEmailAddress string
	apiKey           string
}

func NewSendGridSender(name string, fromEmailAddress string, apiKey string) EmailSender {
	return &SendGridSender{
		name:             name,
		fromEmailAddress: strings.TrimSpace(fromEmailAddress),
		apiKey:           strings.TrimSpace(apiKey),
	}
}

func (sender *SendGridSender) SendEmail(subject string, content string, toAddresses []string) error {
	// DEV MODE: Nếu chưa cấu hình email thì không gửi, chỉ log ra console để demo.
	if sender.fromEmailAddress == "" || sender.apiKey == "" {
		log.Println("[DEV MODE] Email sender is not configured -> skip sending email")
		log.Printf("[DEV MODE] To=%v | Subject=%s\n", toAddresses, subject)
		// OTP thường nằm trong content, log content để bạn copy OTP.
		log.Printf("[DEV MODE] Content:\n%s\n", content)
		return nil
	}

	from := mail.NewEmail(sender.name, sender.fromEmailAddress)
	
	p := mail.NewPersonalization()
	for _, to := range toAddresses {
		p.AddTos(mail.NewEmail("", to))
	}
	p.Subject = subject

	m := mail.NewV3Mail()
	m.SetFrom(from)
	m.AddPersonalizations(p)
	m.AddContent(mail.NewContent("text/html", content))

	client := sendgrid.NewSendClient(sender.apiKey)
	response, err := client.Send(m)
	if err != nil {
		return err
	}
	if response.StatusCode >= 400 {
		return fmt.Errorf("sendgrid error: %d - %s", response.StatusCode, response.Body)
	}

	return nil
}
