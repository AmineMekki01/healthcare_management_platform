package medicalrecords

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"healthcare_backend/pkg/config"
)

type IngestionClient struct {
	baseURL    string
	httpClient *http.Client
}

type IngestionRequest struct {
	PatientID string   `json:"patient_id"`
	DoctorID  string   `json:"doctor_id"`
	S3Keys    []string `json:"s3_keys"`
}

type IngestionResponse struct {
	Message           string `json:"message"`
	TotalFiles        int    `json:"total_files"`
	SuccessfulIngests int    `json:"successful_ingests"`
	FailedIngests     int    `json:"failed_ingests"`
}

func NewIngestionClient(cfg *config.Config) *IngestionClient {
	return &IngestionClient{
		baseURL: cfg.PythonAPIBaseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *IngestionClient) TriggerIngestion(ctx context.Context, patientID, doctorID string, s3Keys []string) error {
	if len(s3Keys) == 0 {
		log.Printf("No S3 keys provided for ingestion, skipping")
		return nil
	}

	endpoint := fmt.Sprintf("%s/api/v1/medical-records/ingest-to-qdrant", c.baseURL)

	request := IngestionRequest{
		PatientID: patientID,
		DoctorID:  doctorID,
		S3Keys:    s3Keys,
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return fmt.Errorf("failed to marshal ingestion request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create ingestion request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	log.Printf("Triggering Python API ingestion for patient %s, doctor %s, files: %v", patientID, doctorID, s3Keys)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to call Python API ingestion endpoint: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		log.Printf("Python API ingestion failed with status %d: %s", resp.StatusCode, string(body))
		return fmt.Errorf("ingestion API returned status %d: %s", resp.StatusCode, string(body))
	}

	var ingestionResp IngestionResponse
	if err := json.Unmarshal(body, &ingestionResp); err != nil {
		log.Printf("Warning: failed to parse ingestion response: %v", err)
	} else {
		log.Printf("Ingestion completed: %d/%d files successfully ingested",
			ingestionResp.SuccessfulIngests, ingestionResp.TotalFiles)
	}

	return nil
}

func (c *IngestionClient) TriggerIngestionAsync(patientID, doctorID string, s3Keys []string) {
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
		defer cancel()

		if err := c.TriggerIngestion(ctx, patientID, doctorID, s3Keys); err != nil {
			log.Printf("Async ingestion failed: %v", err)
		}
	}()
}
