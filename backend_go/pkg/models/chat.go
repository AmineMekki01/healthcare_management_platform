package models

import (
	"time"
)

type Chat struct {
	ID                   string     `json:"id"`
	SenderUserID         string     `json:"senderUserId"`
	RecipientUserID      string     `json:"recipientUserId"`
	FirstNameSender      string     `json:"firstNameSender"`
	LastNameSender       string     `json:"lastNameSender"`
	FirstNameRecipient   string     `json:"firstNameRecipient"`
	LastNameRecipient    string     `json:"lastNameRecipient"`
	UpdatedAt            time.Time  `json:"updatedAt"`
	LastMessage          *string    `json:"latestMessageContent"`
	LastMessageCreatedAt *time.Time `json:"latestMessageTime"`
	RecipientImageURL    string     `json:"recipientImageUrl"`
	RecipientUserType    string     `json:"recipientUserType"`
}

type Participant struct {
	ID        string `json:"id"`
	ChatID    string `json:"chatId"`
	UserID    string `json:"userId"`
	UserType  string `json:"userType"`
	JoinedAt  string `json:"joinedAt"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
	DeletedAt string `json:"deletedAt"`
}

type Message struct {
	ID        string    `json:"id"`
	ChatID    string    `json:"chatId"`
	SenderID  string    `json:"senderId"`
	Content   *string   `json:"content"`
	Key       *string   `json:"key"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	DeletedAt time.Time `json:"deletedAt"`
}

type CombinedUser struct {
	UserID    string `json:"userId"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	UserType  string `json:"userType"`
}
