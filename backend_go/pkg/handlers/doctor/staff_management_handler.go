package doctor

import (
	"log"
	"net/http"

	"healthcare_backend/pkg/models"
	"healthcare_backend/pkg/services/doctor"

	"github.com/gin-gonic/gin"
)

func (h *DoctorHandler) GetDoctorStaff(c *gin.Context) {
	doctorID := c.Param("doctorId")
	authDoctorID := c.GetString("userId")
	if authDoctorID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	if doctorID != authDoctorID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	staff, err := h.doctorService.GetDoctorStaff(doctorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching doctor staff: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"staff": staff})
}

func (h *DoctorHandler) GetDoctorStaffEmploymentHistory(c *gin.Context) {
	doctorID := c.Param("doctorId")
	authDoctorID := c.GetString("userId")
	if authDoctorID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	if doctorID != authDoctorID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	history, err := h.doctorService.GetDoctorStaffEmploymentHistory(doctorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching employment history: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"history": history})
}

func (h *DoctorHandler) GetTalentPool(c *gin.Context) {
	talentPool, err := h.doctorService.GetTalentPool()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching talent pool: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"talent_pool": talentPool})
}

func (h *DoctorHandler) HireReceptionist(c *gin.Context) {
	receptionistID := c.Param("receptionistId")
	if receptionistID == "" {
		var req struct {
			ReceptionistID string  `json:"receptionistId"`
			Message        *string `json:"message"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
			return
		}
		receptionistID = req.ReceptionistID

		proposal, err := h.doctorService.HireReceptionist(c.GetString("userId"), receptionistID, req.Message)
		if err != nil {
			if alreadyErr, ok := err.(*doctor.HiringProposalAlreadyExistsError); ok {
				c.JSON(http.StatusConflict, gin.H{
					"error":    "Hiring proposal already sent",
					"proposal": alreadyErr.Proposal,
				})
				return
			}
			log.Printf("Error sending hiring proposal: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error sending hiring proposal: " + err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message":  "Hiring proposal sent successfully",
			"proposal": proposal,
		})
		return
	}
	if receptionistID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Receptionist ID is required"})
		return
	}
	doctorID := c.GetString("userId")

	if doctorID == "" {
		log.Println("Doctor ID not found in context")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Doctor ID not found in context"})
		return
	}
	var req models.CreateHiringProposalRequest
	_ = c.ShouldBindJSON(&req)
	proposal, err := h.doctorService.HireReceptionist(doctorID, receptionistID, req.Message)
	if err != nil {
		if alreadyErr, ok := err.(*doctor.HiringProposalAlreadyExistsError); ok {
			c.JSON(http.StatusConflict, gin.H{
				"error":    "Hiring proposal already sent",
				"proposal": alreadyErr.Proposal,
			})
			return
		}
		log.Printf("Error sending hiring proposal: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error sending hiring proposal: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Hiring proposal sent successfully", "proposal": proposal})
}

func (h *DoctorHandler) ListHiringProposals(c *gin.Context) {
	doctorID := c.GetString("userId")
	if doctorID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	proposals, err := h.doctorService.ListHiringProposalsForDoctor(doctorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching hiring proposals: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"proposals": proposals})
}

func (h *DoctorHandler) DismissReceptionist(c *gin.Context) {
	receptionistID := c.Param("receptionistId")
	doctorID := c.GetString("userId")
	if doctorID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Doctor ID not found in context"})
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	_ = c.ShouldBindJSON(&req)
	if req.Reason == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dismissal reason is required"})
		return
	}

	err := h.doctorService.DismissReceptionist(doctorID, receptionistID, req.Reason)
	if err != nil {
		log.Println("Error dismissing receptionist:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error dismissing receptionist: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Receptionist dismissed successfully"})
}

func (h *DoctorHandler) SearchStaff(c *gin.Context) {
	doctorID := c.GetString("userId")
	if doctorID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	q := c.DefaultQuery("q", "")
	filters := map[string]string{
		"role":           c.DefaultQuery("role", ""),
		"experience":     c.DefaultQuery("experience", ""),
		"specialization": c.DefaultQuery("specialization", ""),
		"shift":          c.DefaultQuery("shift", ""),
		"limit":          c.DefaultQuery("limit", ""),
	}

	results, err := h.doctorService.SearchStaff(doctorID, q, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error searching staff: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"results": results})
}
