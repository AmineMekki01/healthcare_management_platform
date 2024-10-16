package models

import (
	"time"
)

type Chat struct {
	ID                   string     `json:"id"`
	SenderUserID         string     `json:"sender_user_id"`
	RecipientUserID      string     `json:"recipient_user_id"`
	FirstNameSender      string     `json:"first_name_sender"`
	LastNameSender       string     `json:"last_name_sender"`
	FirstNameRecipient   string     `json:"first_name_recipient"`
	LastNameRecipient    string     `json:"last_name_recipient"`
	UpdatedAt            time.Time  `json:"updated_at"`
	LastMessage          *string    `json:"latest_message_content"`
	LastMessageCreatedAt *time.Time `json:"latest_message_time"`
	RecipientImageURL    string     `json:"recipient_image_url"`
}

type Participant struct {
	ID        string `json:"id"`
	ChatID    string `json:"chat_id"`
	UserID    string `json:"user_id"`
	UserType  string `json:"user_type"`
	JoinedAt  string `json:"joined_at"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
	DeletedAt string `json:"deleted_at"`
}

type Message struct {
	ID        string    `json:"id"`
	ChatID    string    `json:"chat_id"`
	SenderID  string    `json:"sender_id"`
	Content   *string   `json:"content"`
	Key       *string   `json:"key"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	DeletedAt time.Time `json:"deleted_at"`
}
