from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class IngestionDetail(BaseModel):
    status: str
    s3_key: str
    chunks_created: Optional[int] = None
    document_type: Optional[str] = None
    file_size: Optional[int] = None
    collection: Optional[str] = None
    error: Optional[str] = None

class MedicalRecordIngestionResponse(BaseModel):
    patient_id: str
    doctor_id: str
    total_files: int
    invalid_files: List[str]
    successful_ingestions: int
    failed_ingestions: int
    skipped_ingestions: int
    total_chunks_created: int
    ingestion_details: List[IngestionDetail]
    summary: str
    timestamp: str


class MedicalRecordIngestionRequest(BaseModel):
    patient_id: str
    doctor_id: str
    s3_keys: List[str]