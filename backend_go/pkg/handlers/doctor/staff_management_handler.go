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

	c.JSON(http.StatusOK, gin.H{"message": "Receptionist hired successfully"})
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
