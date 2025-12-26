package handlers

import (
	"log"
	"net/http"

	"healthcare_backend/pkg/models"
	receptionistService "healthcare_backend/pkg/services/receptionist"

	"github.com/gin-gonic/gin"
)

type ReceptionistHandler struct {
	receptionistService *receptionistService.ReceptionistService
}

func NewReceptionistHandler(
	receptionistService *receptionistService.ReceptionistService,
) *ReceptionistHandler {
	return &ReceptionistHandler{
		receptionistService: receptionistService,
	}
}

func (h *ReceptionistHandler) RegisterReceptionist(c *gin.Context) {
	var req models.ReceptionistRegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	receptionist, err := h.receptionistService.RegisterReceptionist(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"receptionist": receptionist,
	})
}

func (h *ReceptionistHandler) LoginReceptionist(c *gin.Context) {
	var req models.ReceptionistLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	receptionist, accessToken, refreshToken, err := h.receptionistService.LoginReceptionist(req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	log.Println("LoginReceptionist rece handeler: ", receptionist)

	c.JSON(http.StatusOK, gin.H{
		"receptionist": receptionist,
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
	})
}

func (h *ReceptionistHandler) GetReceptionistProfile(c *gin.Context) {
	callerUserID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	callerUserType := c.GetString("userType")

	requestedID := c.Param("userID")
	if requestedID == "" {
		requestedID = callerUserID.(string)
	}

	if callerUserType == "receptionist" && requestedID != callerUserID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	receptionist, err := h.receptionistService.GetReceptionistProfile(requestedID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"receptionist": receptionist,
	})
}

func (h *ReceptionistHandler) UpdateReceptionistProfile(c *gin.Context) {
	receptionistID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req models.ReceptionistProfileUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	err := h.receptionistService.UpdateReceptionistProfile(receptionistID.(string), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}

func (h *ReceptionistHandler) GetAssignmentStatus(c *gin.Context) {
	callerUserID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	callerUserType := c.GetString("userType")

	receptionistID := c.Param("userID")
	if receptionistID == "" {
		receptionistID = callerUserID.(string)
	}

	if callerUserType != "receptionist" || receptionistID != callerUserID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	status, err := h.receptionistService.GetReceptionistAssignmentStatus(receptionistID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": status})
}

func (h *ReceptionistHandler) ListReceptionistExperiences(c *gin.Context) {
	callerUserID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	callerUserType := c.GetString("userType")

	receptionistID := c.Param("userID")
	if receptionistID == "" {
		receptionistID = callerUserID.(string)
	}

	if callerUserType == "receptionist" && receptionistID != callerUserID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	experiences, err := h.receptionistService.ListReceptionistExperiences(receptionistID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"experiences": experiences})
}

func (h *ReceptionistHandler) CreateReceptionistExperience(c *gin.Context) {
	callerUserID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	callerUserType := c.GetString("userType")

	receptionistID := c.Param("userID")
	if receptionistID == "" {
		receptionistID = callerUserID.(string)
	}

	if callerUserType != "receptionist" || receptionistID != callerUserID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	var req models.ReceptionistExperienceCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	experience, err := h.receptionistService.CreateReceptionistExperience(receptionistID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"experience": experience})
}

func (h *ReceptionistHandler) DeleteReceptionistExperience(c *gin.Context) {
	callerUserID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	callerUserType := c.GetString("userType")

	receptionistID := c.Param("userID")
	experienceID := c.Param("experienceId")

	if receptionistID == "" || experienceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Receptionist ID and experience ID are required"})
		return
	}

	if callerUserType != "receptionist" || receptionistID != callerUserID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	if err := h.receptionistService.DeleteReceptionistExperience(receptionistID, experienceID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Experience deleted successfully"})
}

func (h *ReceptionistHandler) ListHiringProposals(c *gin.Context) {
	callerUserID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	callerUserType := c.GetString("userType")

	receptionistID := c.Param("userID")
	if receptionistID == "" {
		receptionistID = callerUserID.(string)
	}

	if callerUserType != "receptionist" || receptionistID != callerUserID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	proposals, err := h.receptionistService.ListHiringProposals(receptionistID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"proposals": proposals})
}

func (h *ReceptionistHandler) RespondToHiringProposal(c *gin.Context) {
	callerUserID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	callerUserType := c.GetString("userType")

	receptionistID := c.Param("userID")
	proposalID := c.Param("proposalId")
	if receptionistID == "" || proposalID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Receptionist ID and proposal ID are required"})
		return
	}

	if callerUserType != "receptionist" || receptionistID != callerUserID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	var req models.RespondHiringProposalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	proposal, err := h.receptionistService.RespondToHiringProposal(receptionistID, proposalID, req.Action, req.Message)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"proposal": proposal})
}

func (h *ReceptionistHandler) ListHiringProposalMessages(c *gin.Context) {
	callerUserID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	callerUserType := c.GetString("userType")

	receptionistID := c.Param("userID")
	proposalID := c.Param("proposalId")
	if receptionistID == "" || proposalID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Receptionist ID and proposal ID are required"})
		return
	}

	if callerUserType != "receptionist" || receptionistID != callerUserID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	messages, err := h.receptionistService.ListHiringProposalMessages(receptionistID, proposalID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"messages": messages})
}

func (h *ReceptionistHandler) CreateHiringProposalMessage(c *gin.Context) {
	callerUserID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	callerUserType := c.GetString("userType")

	receptionistID := c.Param("userID")
	proposalID := c.Param("proposalId")
	if receptionistID == "" || proposalID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Receptionist ID and proposal ID are required"})
		return
	}

	if callerUserType != "receptionist" || receptionistID != callerUserID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	var req models.CreateHiringProposalMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	msg, err := h.receptionistService.CreateHiringProposalMessage(receptionistID, proposalID, req.Message)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": msg})
}
