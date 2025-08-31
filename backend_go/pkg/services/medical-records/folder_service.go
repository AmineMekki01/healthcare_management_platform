package medicalrecords

import (
	"strings"
	"time"

	"healthcare_backend/pkg/models"
)

// generateMedicalFolderName creates a structured folder name for medical records
func (s *MedicalRecordsService) generateMedicalFolderName(fileInfo *models.FileFolder) string {
	// Get doctor name from the uploaded_by info
	doctorName := "Doctor"
	if fileInfo.DoctorName != nil && *fileInfo.DoctorName != "" {
		doctorName = *fileInfo.DoctorName
	}
	
	// Clean doctor name (remove spaces)
	doctorName = strings.ReplaceAll(doctorName, " ", "")
	
	// Get study date or use current date
	studyDate := time.Now()
	if fileInfo.StudyDate != nil {
		studyDate = *fileInfo.StudyDate
	}
	
	// Get category
	category := models.CategoryOther
	if fileInfo.Category != nil {
		category = *fileInfo.Category
	}
	
	// Get body part
	var bodyPart *models.BodyPart
	if fileInfo.BodyPart != nil && *fileInfo.BodyPart != "" {
		bp := models.BodyPart(*fileInfo.BodyPart)
		bodyPart = &bp
	}
	
	// Use the GenerateMedicalFolderName function from models
	return models.GenerateMedicalFolderName(doctorName, category, bodyPart, studyDate)
}
