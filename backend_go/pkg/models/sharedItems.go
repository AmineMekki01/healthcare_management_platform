package models

import "time"

type SharedItem struct {
	ID         int       `json:"id"`
	ItemID     string    `json:"itemId"`
	SharedBy   string    `json:"sharedById"`
	SharedWith string    `json:"sharedWithId"`
	SharedAt   time.Time `json:"sharedAt"`
}

type ShareRequest struct {
	SharedWithID string   `json:"sharedWithId"`
	ItemIDs      []string `json:"itemIIds"`
	UserID       string   `json:"userId"`
	UserType     string   `json:"userType"`
}
