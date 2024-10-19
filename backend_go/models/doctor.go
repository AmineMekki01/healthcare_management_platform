package models

type Doctor struct {
	DoctorID          string   `json:"DoctorId"`
	Username          string   `json:"Username"`
	FirstName         string   `json:"FirstName"`
	LastName          string   `json:"LastName"`
	Password          string   `json:"Password"`
	Age               int      `json:"age"`
	Sex               string   `json:"Sex"`
	Specialty         string   `json:"Specialty"`
	Experience        string   `json:"Experience"`
	MedicalLicense    string   `json:"MedicalLicense"`
	DoctorBio         string   `json:"DoctorBio"`
	Email             string   `json:"Email"`
	PhoneNumber       string   `json:"PhoneNumber"`
	StreetAddress     string   `json:"StreetAddress"`
	CityName          string   `json:"CityName"`
	StateName         string   `json:"StateName"`
	ZipCode           string   `json:"ZipCode"`
	CountryName       string   `json:"CountryName"`
	Latitude          float64  `json:"latitude"`
	Longitude         float64  `json:"longitude"`
	BirthDate         string   `json:"BirthDate"`
	Location          string   `json:"Location"`
	RatingScore       *float32 `json:"RatingScore"`
	RatingCount       int      `json:"RatingCount"`
	Hospitals         []string
	Organizations     []string
	Awards            []string
	Certifications    []string
	Languages         []string
	ProfilePictureURL string  `json:"ProfilePictureUrl"`
	DoctorDistance    float64 `json:"Distance"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}
