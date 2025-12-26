package models

import (
	"time"

	"github.com/google/uuid"
)

type HiringDoctorInfo struct {
	DoctorID        uuid.UUID `json:"doctorId"`
	FirstName       string    `json:"firstName"`
	LastName        string    `json:"lastName"`
	Specialty       string    `json:"specialty"`
	ProfilePhotoURL string    `json:"profilePictureUrl"`
	CityName        string    `json:"cityName"`
	StateName       string    `json:"stateName"`
	CountryName     string    `json:"countryName"`
}

type ReceptionistHiringProposal struct {
	ProposalID     uuid.UUID         `json:"proposalId"`
	DoctorID       uuid.UUID         `json:"doctorId"`
	ReceptionistID uuid.UUID         `json:"receptionistId"`
	Status         string            `json:"status"`
	InitialMessage *string           `json:"initialMessage"`
	CreatedAt      time.Time         `json:"createdAt"`
	UpdatedAt      time.Time         `json:"updatedAt"`
	Doctor         *HiringDoctorInfo `json:"doctor,omitempty"`
}

type ReceptionistHiringMessage struct {
	MessageID  uuid.UUID `json:"messageId"`
	ProposalID uuid.UUID `json:"proposalId"`
	SenderType string    `json:"senderType"`
	SenderID   uuid.UUID `json:"senderId"`
	Message    string    `json:"message"`
	CreatedAt  time.Time `json:"createdAt"`
}

type CreateHiringProposalRequest struct {
	ReceptionistID string  `json:"receptionistId" binding:"required"`
	Message        *string `json:"message"`
}

type RespondHiringProposalRequest struct {
	Action  string  `json:"action" binding:"required,oneof=accept reject"`
	Message *string `json:"message"`
}

type CreateHiringProposalMessageRequest struct {
	Message string `json:"message" binding:"required"`
}

type ReceptionistDismissalInfo struct {
	Doctor      *HiringDoctorInfo `json:"doctor,omitempty"`
	DismissedAt *time.Time        `json:"dismissedAt,omitempty"`
	Reason      *string           `json:"reason,omitempty"`
	DismissedBy *string           `json:"dismissedBy,omitempty"`
}

type ReceptionistAssignmentStatus struct {
	AssignedDoctor *HiringDoctorInfo          `json:"assignedDoctor,omitempty"`
	LastDismissal  *ReceptionistDismissalInfo `json:"lastDismissal,omitempty"`
}
