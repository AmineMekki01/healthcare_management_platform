from typing import Optional, List
from pydantic import BaseModel, Field


class ChunkMetadata(BaseModel):
    """Metadata for document chunks stored in Qdrant."""
    chunk_id: str
    doctor_id: str
    patient_id: Optional[str] = None
    file_s3_path: Optional[str] = None
    medical_record_type: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    file_content_type: Optional[str] = None


class ChunkPayload(BaseModel):
    """Complete payload structure for Qdrant points."""
    chunk_metadata: ChunkMetadata
    content: str


class SearchQuery(BaseModel):
    """Search query parameters for multi-collection search."""
    query_text: str
    patient_id: Optional[str] = None
    limit: int = Field(default=10, ge=1, le=100)
    score_threshold: float = Field(default=0.7, ge=0.0, le=1.0)
    collection_types: Optional[List[str]] = None


class SearchResult(BaseModel):
    """Individual search result from Qdrant."""
    score: float
    collection_name: str
    point_id: str
    content: str
    payload: ChunkPayload