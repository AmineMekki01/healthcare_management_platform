package models

import (
	"encoding/json"
	"time"
)

type FolderType string

const (
	FolderTypePersonal FolderType = "PERSONAL"
	FolderTypeClinical FolderType = "CLINICAL"
)

type Category string

const (
	CategoryLabResults     Category = "LAB_RESULTS"
	CategoryImagingCT      Category = "IMAGING_CT"
	CategoryImagingXray    Category = "IMAGING_XRAY"
	CategoryImagingUS      Category = "IMAGING_US"
	CategoryImagingMammo   Category = "IMAGING_MAMMO"
	CategoryImagingMRI     Category = "IMAGING_MRI"
	CategoryImagingPET     Category = "IMAGING_PET"
	CategoryClinicalReport Category = "CLINICAL_REPORT"
	CategoryDischarge      Category = "DISCHARGE"
	CategoryOther          Category = "OTHER"
)

type FileFolder struct {
	ID               string     `json:"folder_id"`
	Name             string     `json:"name"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
	Type             string     `json:"file_type"`
	Size             int64      `json:"size"`
	Ext              *string    `json:"extension"`
	UserID           string     `json:"user_id"`
	UserType         string     `json:"user_type"`
	ParentID         *string    `json:"parent_id,omitempty"`
	Path             string     `json:"path"`
	SharedByID       *string    `json:"shared_by_id,omitempty"`
	SharedByName     string     `json:"shared_by_name,omitempty"`
	SharedByType     string     `json:"shared_by_type,omitempty"`
	SharedWithID     string     `json:"shared_with_id,omitempty"`
	SharedWithName   string     `json:"shared_with_name,omitempty"`
	SharedWithType   string     `json:"shared_with_type,omitempty"`
	FolderType       FolderType `json:"folder_type"`
	Category         *Category  `json:"category,omitempty"`
	BodyPart         *string    `json:"body_part,omitempty"`
	StudyDate        *time.Time `json:"study_date,omitempty"`
	DoctorName       *string    `json:"doctor_name,omitempty"`
	OwnerUserID      *string    `json:"owner_user_id,omitempty"`
	PatientID        *string    `json:"patient_id,omitempty"`
	UploadedByUserID *string    `json:"uploaded_by_user_id,omitempty"`
	UploadedByRole   *string    `json:"uploaded_by_role,omitempty"`
	IncludedInRAG    bool       `json:"included_in_rag"`
}

func (c Category) GetDisplayName() string {
	switch c {
	case CategoryLabResults:
		return "Lab Results"
	case CategoryImagingCT:
		return "CT Scan"
	case CategoryImagingXray:
		return "X-Ray"
	case CategoryImagingUS:
		return "Ultrasound/Echography"
	case CategoryImagingMammo:
		return "Mammography"
	case CategoryImagingMRI:
		return "MRI"
	case CategoryImagingPET:
		return "PET Scan"
	case CategoryClinicalReport:
		return "Clinical Report"
	case CategoryDischarge:
		return "Discharge Summary"
	case CategoryOther:
		return "Other"
	default:
		return "Unknown"
	}
}

func (c Category) IsImagingCategory() bool {
	switch c {
	case CategoryImagingCT, CategoryImagingXray, CategoryImagingUS,
		CategoryImagingMammo, CategoryImagingMRI, CategoryImagingPET:
		return true
	default:
		return false
	}
}

type BodyPart string

const (
	BodyPartHead     BodyPart = "HEAD"
	BodyPartNeck     BodyPart = "NECK"
	BodyPartChest    BodyPart = "CHEST"
	BodyPartAbdomen  BodyPart = "ABDOMEN"
	BodyPartPelvis   BodyPart = "PELVIS"
	BodyPartSpine    BodyPart = "SPINE"
	BodyPartArm      BodyPart = "ARM"
	BodyPartHand     BodyPart = "HAND"
	BodyPartLeg      BodyPart = "LEG"
	BodyPartFoot     BodyPart = "FOOT"
	BodyPartBrain    BodyPart = "BRAIN"
	BodyPartHeart    BodyPart = "HEART"
	BodyPartLungs    BodyPart = "LUNGS"
	BodyPartKidney   BodyPart = "KIDNEY"
	BodyPartLiver    BodyPart = "LIVER"
	BodyPartKnee     BodyPart = "KNEE"
	BodyPartShoulder BodyPart = "SHOULDER"
	BodyPartHip      BodyPart = "HIP"
	BodyPartAnkle    BodyPart = "ANKLE"
	BodyPartWrist    BodyPart = "WRIST"
	BodyPartFullBody BodyPart = "FULL_BODY"
	BodyPartOther    BodyPart = "OTHER"
)

func (bp BodyPart) GetDisplayName() string {
	switch bp {
	case BodyPartHead:
		return "Head"
	case BodyPartNeck:
		return "Neck"
	case BodyPartChest:
		return "Chest"
	case BodyPartAbdomen:
		return "Abdomen"
	case BodyPartPelvis:
		return "Pelvis"
	case BodyPartSpine:
		return "Spine"
	case BodyPartArm:
		return "Arm"
	case BodyPartHand:
		return "Hand"
	case BodyPartLeg:
		return "Leg"
	case BodyPartFoot:
		return "Foot"
	case BodyPartBrain:
		return "Brain"
	case BodyPartHeart:
		return "Heart"
	case BodyPartLungs:
		return "Lungs"
	case BodyPartKidney:
		return "Kidney"
	case BodyPartLiver:
		return "Liver"
	case BodyPartKnee:
		return "Knee"
	case BodyPartShoulder:
		return "Shoulder"
	case BodyPartHip:
		return "Hip"
	case BodyPartAnkle:
		return "Ankle"
	case BodyPartWrist:
		return "Wrist"
	case BodyPartFullBody:
		return "Full Body"
	case BodyPartOther:
		return "Other"
	default:
		return "Unknown"
	}
}

type HistoryActionType string

const (
	ActionTypeUpload HistoryActionType = "upload"
	ActionTypeShare  HistoryActionType = "share"
	ActionTypeRename HistoryActionType = "rename"
	ActionTypeMove   HistoryActionType = "move"
	ActionTypeDelete HistoryActionType = "delete"
)

type FileFolderHistory struct {
	ID              string            `json:"id"`
	ItemID          string            `json:"item_id"`
	ActionType      HistoryActionType `json:"action_type"`
	PerformedByID   string            `json:"performed_by_id"`
	PerformedByType string            `json:"performed_by_type"`
	PerformedByName string            `json:"performed_by_name,omitempty"`
	OldValue        *string           `json:"old_value,omitempty"`
	NewValue        *string           `json:"new_value,omitempty"`
	SharedWithID    *string           `json:"shared_with_id,omitempty"`
	SharedWithType  *string           `json:"shared_with_type,omitempty"`
	SharedWithName  *string           `json:"shared_with_name,omitempty"`
	Metadata        json.RawMessage   `json:"metadata,omitempty"`
	CreatedAt       time.Time         `json:"created_at"`
}
