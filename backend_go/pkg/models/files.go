package models

import "time"

type FileFolder struct {
	ID             string    `json:"folderId"`
	Name           string    `json:"name"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
	Type           string    `json:"fileType"`
	Size           int64     `json:"size"`
	Ext            *string   `json:"extension"`
	UserID         string    `json:"userId"`
	UserType       string    `json:"userType"`
	ParentID       *string   `json:"parentId,omitempty"`
	Path           string    `json:"path"`
	SharedByID     string    `json:"sharedById,omitempty"`
	SharedByName   string    `json:"sharedByName,omitempty"`
	SharedByType   string    `json:"sharedByType,omitempty"`
	SharedWithID   string    `json:"sharedWithId,omitempty"`
	SharedWithName string    `json:"sharedWithName,omitempty"`
	SharedWithType string    `json:"sharedWithType,omitempty"`
}
