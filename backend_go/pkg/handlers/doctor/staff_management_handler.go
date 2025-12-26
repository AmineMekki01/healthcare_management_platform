package doctor

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *DoctorHandler) GetDoctorStaff(c *gin.Context) {
	doctorID := c.Param("doctorId")

	staff, err := h.doctorService.GetDoctorStaff(doctorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching doctor staff: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"staff": staff})
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
			ReceptionistID string `json:"receptionistId"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
			return
		}
		receptionistID = req.ReceptionistID
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
	err := h.doctorService.HireReceptionist(doctorID, receptionistID)
	if err != nil {
		log.Printf("Error hiring receptionist: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error hiring receptionist: " + err.Error()})
		return
	}

	receptionist, err := h.doctorService.GetReceptionistByID(receptionistID)
	if err != nil {
		log.Printf("Warning: hired receptionist but failed to fetch details: %v", err)
		c.JSON(http.StatusOK, gin.H{"message": "Receptionist hired successfully"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Receptionist hired successfully", "receptionist": receptionist})
}

func (h *DoctorHandler) DismissReceptionist(c *gin.Context) {
	receptionistID := c.Param("receptionistId")

	err := h.doctorService.DismissReceptionist(receptionistID)
	if err != nil {
		log.Println("Error dismissing receptionist:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error dismissing receptionist: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Receptionist dismissed successfully"})
}

func (h *DoctorHandler) ActivateReceptionist(c *gin.Context) {
	receptionistID := c.Param("receptionistId")
	doctorID := c.GetString("userId")

	if receptionistID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Receptionist ID is required"})
		return
	}
	if doctorID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Doctor ID not found in context"})
		return
	}

	if err := h.doctorService.SetReceptionistActiveStatus(doctorID, receptionistID, true); err != nil {
		log.Printf("Error activating receptionist: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error activating receptionist: " + err.Error()})
		return
	}

	receptionist, err := h.doctorService.GetReceptionistByID(receptionistID)
	if err != nil {
		log.Printf("Error fetching activated receptionist: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching receptionist after activation: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Receptionist activated successfully", "receptionist": receptionist})
}

func (h *DoctorHandler) DeactivateReceptionist(c *gin.Context) {
	receptionistID := c.Param("receptionistId")
	doctorID := c.GetString("userId")

	if receptionistID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Receptionist ID is required"})
		return
	}
	if doctorID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Doctor ID not found in context"})
		return
	}

	if err := h.doctorService.SetReceptionistActiveStatus(doctorID, receptionistID, false); err != nil {
		log.Printf("Error deactivating receptionist: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error deactivating receptionist: " + err.Error()})
		return
	}

	receptionist, err := h.doctorService.GetReceptionistByID(receptionistID)
	if err != nil {
		log.Printf("Error fetching deactivated receptionist: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching receptionist after deactivation: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Receptionist deactivated successfully", "receptionist": receptionist})
}
