from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum
import uuid
from uuid import UUID

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class ChatDocumentResponse(BaseModel):
    id: UUID
    chat_id: UUID
    user_id: UUID
    filename: str
    file_size: int
    mime_type: str
    token_count: int
    storage_type: str
    ttl_days: Optional[int] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    id: UUID
    user_id: str
    model: str
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    messages: List[MessageResponse] = []
    documents: List[ChatDocumentResponse] = []

    class Config:
        from_attributes = True


class ChatListResponse(BaseModel):
    id: UUID
    title: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    message_count: int = 0
    last_message: Optional[str] = None

    class Config:
        from_attributes = True


class CreateChatRequest(BaseModel):
    title: Optional[str] = Field(None, max_length=255)


class SendMessageRequest(BaseModel):
    content: str
    chat_id: UUID
    user_id: UUID
    patient_id: Optional[UUID] = None
    id: UUID = Field(default_factory=uuid.uuid4)
    model: str
    role: str
    content: str
    created_at: datetime = Field(default_factory=datetime.now)


class MessageWithContext(BaseModel):
    """Message with additional context for LLM"""
    role: MessageRole
    content: str
    context_documents: List[str] = []
    patient_data: Optional[dict] = None


class ChatSearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    limit: int = Field(default=10, ge=1, le=50)


class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    file_size: str
    processing_status: str = "uploaded"
    storage_type: Optional[str] = None
    token_count: Optional[int] = None
    recommendation: Optional[str] = None


class MessageInput(BaseModel):
    chat_id: UUID
    user_id: UUID
    patient_id: Optional[UUID] = None
    role: str
    content: str
    patient_mentions: Optional[List[dict]] = []
    