from pydantic import BaseModel
from typing import List

class MedicalRecordIngestionResponse(BaseModel):
    success: bool
    patient_id: str
    records_processed: int
    chunks_created: int
    collection_name: str


class MedicalRecordIngestionRequest(BaseModel):
    patient_id: str
    doctor_id: str
    s3_keys: List[str]