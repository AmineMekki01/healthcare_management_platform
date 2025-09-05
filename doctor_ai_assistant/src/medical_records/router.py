from fastapi import APIRouter, HTTPException

from src.medical_records.service import S3MedicalRecordsService
from src.medical_records.schemas import MedicalRecordIngestionResponse, MedicalRecordIngestionRequest

router = APIRouter(prefix="/api/v1/medical-records", tags=["Medical Records"])

@router.post("/ingest-to-qdrant", response_model=MedicalRecordIngestionResponse)
async def ingest_s3_medical_records(
    request: MedicalRecordIngestionRequest,
) -> MedicalRecordIngestionResponse:
    """
    Ingest medical records for a specific patient from database to Qdrant.
    
    Args:
        request: S3 ingestion request containing patient_id, doctor_id, and S3 keys
        
    Returns:
        S3IngestionResponse: Detailed ingestion results
        
    Raises:
        HTTPException: 400 for invalid input, 500 for server errors
    """
    try:
        if not request.patient_id:
            raise HTTPException(status_code=400, detail="No patient ID provided")
        
        result = await S3MedicalRecordsService.ingest_patient_records(
            patient_id=request.patient_id,
            doctor_id=request.doctor_id,
            s3_keys=request.s3_keys
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error in S3 medical records ingestion: {e}")
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")