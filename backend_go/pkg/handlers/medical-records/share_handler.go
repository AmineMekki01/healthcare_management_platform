package medicalrecords

import (
	"context"
	"database/sql"
	"log"
	"net/http"

	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/models"
	shareService "healthcare_backend/pkg/services/medical-records"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

type ShareHandler struct {
	shareService *shareService.ShareService
	config       *config.Config
	db           *pgxpool.Pool
}

func NewShareHandler(db *pgxpool.Pool, cfg *config.Config) *ShareHandler {
	return &ShareHandler{
		shareService: shareService.NewShareService(db, cfg),
		config:       cfg,
		db:           db,
	}
}

func (h *ShareHandler) ListDoctors(c *gin.Context) {
	callerUserID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	callerUserType := c.GetString("userType")

	var (
		doctors []models.Doctor
		err     error
	)
	if callerUserType == "patient" {
		doctors, err = h.shareService.ListDoctorsForPatient(callerUserID.(string))
	} else if callerUserType == "receptionist" {
		var assignedDoctorID sql.NullString
		err := h.db.QueryRow(context.Background(), "SELECT assigned_doctor_id FROM receptionists WHERE receptionist_id = $1", callerUserID.(string)).Scan(&assignedDoctorID)
		if err != nil {
			log.Printf("ListDoctors: failed to verify receptionist assignment: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify receptionist assignment"})
			return
		}
		if !assignedDoctorID.Valid {
			c.JSON(http.StatusOK, []models.Doctor{})
			return
		}

		doctor, derr := h.shareService.GetDoctorByID(assignedDoctorID.String)
		if derr != nil {
			log.Printf("ListDoctors: failed to load assigned doctor: %v", derr)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve doctors list"})
			return
		}
		if doctor == nil {
			c.JSON(http.StatusOK, []models.Doctor{})
			return
		}
		doctors = []models.Doctor{*doctor}
	} else {
		doctors, err = h.shareService.ListDoctors()
	}
	if err != nil {
		log.Printf("Error retrieving doctors list: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve doctors list"})
		return
	}

	c.JSON(http.StatusOK, doctors)
}

func (h *ShareHandler) ShareItems(c *gin.Context) {
	var req models.ShareRequest

	callerUserID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	callerUserType := c.GetString("userType")

	if err := c.BindJSON(&req); err != nil {
		log.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	req.UserID = callerUserID.(string)
	req.UserType = callerUserType

	if req.UserType == "patient" {
		if req.SharedWithID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "shared_with_id is required"})
			return
		}

		var canShare bool
		err := h.db.QueryRow(
			context.Background(),
			`SELECT EXISTS(
				SELECT 1
				FROM appointments a
				JOIN doctor_info d ON d.doctor_id = a.doctor_id
				WHERE a.patient_id = $1::uuid
					AND a.doctor_id = $2::uuid
					AND COALESCE(a.is_doctor_patient, false) = false
			)`,
			req.UserID,
			req.SharedWithID,
		).Scan(&canShare)
		if err != nil {
			log.Printf("ShareItems: failed to validate patient-doctor relationship: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recipient"})
			return
		}
		if !canShare {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
			return
		}
	}

	if req.UserType == "doctor" {
		var isPatientRecipient bool
		err := h.db.QueryRow(
			context.Background(),
			"SELECT EXISTS(SELECT 1 FROM patient_info WHERE patient_id::text = $1)",
			req.SharedWithID,
		).Scan(&isPatientRecipient)
		if err != nil {
			log.Printf("ShareItems: failed to detect recipient type: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recipient"})
			return
		}
		if isPatientRecipient {
			var canShare bool
			err := h.db.QueryRow(
				context.Background(),
				`SELECT EXISTS(
					SELECT 1
					FROM appointments
					WHERE doctor_id = $1 AND patient_id = $2 AND COALESCE(is_doctor_patient, false) = false
				)`,
				req.UserID,
				req.SharedWithID,
			).Scan(&canShare)
			if err != nil {
				log.Printf("ShareItems: failed to validate doctor-patient relationship: %v", err)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recipient"})
				return
			}
			if !canShare {
				c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
				return
			}
		} else {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
			return
		}
	}

	if req.UserType == "receptionist" {
		var assignedDoctorID sql.NullString
		err := h.db.QueryRow(context.Background(), "SELECT assigned_doctor_id FROM receptionists WHERE receptionist_id = $1", req.UserID).Scan(&assignedDoctorID)
		if err != nil {
			log.Printf("ShareItems: failed to verify receptionist assignment: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify receptionist assignment"})
			return
		}
		if !assignedDoctorID.Valid {
			c.JSON(http.StatusForbidden, gin.H{"error": "Receptionist has no assigned doctor"})
			return
		}

		// Receptionists can only share to their assigned doctor.
		if req.SharedWithID != assignedDoctorID.String {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
			return
		}
	}

	if len(req.ItemIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "item_ids is required"})
		return
	}

	var ownedCount int
	err := h.db.QueryRow(
		context.Background(),
		"SELECT COUNT(1) FROM folder_file_info WHERE id = ANY($1::uuid[]) AND user_id = $2 AND shared_by_id IS NULL",
		req.ItemIDs,
		req.UserID,
	).Scan(&ownedCount)
	if err != nil {
		log.Printf("ShareItems: failed to verify item ownership: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify item ownership"})
		return
	}
	if ownedCount != len(req.ItemIDs) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	if req.UserType == "doctor" && req.UserID == req.SharedWithID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Doctors cannot share items with themselves"})
		return
	}

	err = h.shareService.ShareItems(req)
	if err != nil {
		log.Printf("Error sharing items: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Items shared successfully"})
}

func (h *ShareHandler) GetSharedWithMe(c *gin.Context) {
	callerUserID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := callerUserID.(string)

	items, err := h.shareService.GetSharedWithMe(userID)
	if err != nil {
		log.Printf("Error retrieving shared items: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve shared items"})
		return
	}

	if len(items) == 0 {
		c.JSON(http.StatusOK, []models.FileFolder{})
	} else {
		c.JSON(http.StatusOK, gin.H{"items": items})
	}
}

func (h *ShareHandler) GetSharedByMe(c *gin.Context) {
	callerUserID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := callerUserID.(string)

	items, err := h.shareService.GetSharedByMe(userID)
	if err != nil {
		log.Printf("Error retrieving shared items: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve shared items"})
		return
	}

	if len(items) == 0 {
		c.JSON(http.StatusOK, []models.FileFolder{})
	} else {
		c.JSON(http.StatusOK, gin.H{"items": items})
	}
}
