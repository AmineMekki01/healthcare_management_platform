package models

type CommunityTotals struct {
	Doctors                 int `json:"doctors"`
	Patients                int `json:"patients"`
	Receptionists           int `json:"receptionists"`
	ReceptionistsAssigned   int `json:"receptionistsAssigned"`
	ReceptionistsUnassigned int `json:"receptionistsUnassigned"`
	Specialties             int `json:"specialties"`
}

type CommunityDistributionItem struct {
	Label      string  `json:"label"`
	Count      int     `json:"count"`
	Percentage float64 `json:"percentage"`
}

type CommunityStats struct {
	Totals             CommunityTotals             `json:"totals"`
	PatientsByAge      []CommunityDistributionItem `json:"patientsByAge"`
	DoctorsBySpecialty []CommunityDistributionItem `json:"doctorsBySpecialty"`
}
