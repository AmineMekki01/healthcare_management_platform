package models

import "time"

type SharedItem struct {
	ID         int       `json:"id"`
	ItemID     string    `json:"item_id"`
	SharedBy   string    `json:"shared_by_id"`
	SharedWith string    `json:"shared_with_id"`
	SharedAt   time.Time `json:"shared_at"`
}

type ShareRequest struct {
	SharedWithID string   `json:"sharedWithID"`
	ItemIDs      []string `json:"itemIDs"`
	UserID       string   `json:"userID"`
	UserType     string   `json:"userType"`
}
