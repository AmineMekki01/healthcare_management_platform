from pydantic import BaseModel, Field

from src.app.chat.constants import ChatRolesEnum, ModelsEnum
from src.app.core.models import TimestampAbstractModel
from typing import Optional, List
from datetime import datetime


class BaseMessage(BaseModel):
    id: str = Field(default="")
    chat_id: str = Field(default="")
    model: ModelsEnum = Field(default=ModelsEnum.GPT4.value)
    user_id: Optional[str] = None
    agent_role: str = Field(default=ChatRolesEnum.ASSISTANT.value)
    user_message: str = Field(default="")
    answer: str = Field(default="")
    augmented_message: str = Field(default="")
    patient_id: Optional[str] = None


class Message(BaseMessage):
    role: Optional[ChatRolesEnum] = None


class ChatSummary(BaseModel):
    id: str
    user_id: str
    title: str
    model: str
    agent_role: str
    created_at: datetime
    updated_at: datetime


class ChatCreateResponse(BaseModel):
    id: str
    user_id: str
    title: str
    model: str
    agent_role: str
    created_at: datetime
    updated_at: datetime


class FileSummary(BaseModel):
    id: str
    chat_id: str
    user_id: str
    file_name: str
    file_size: str
    file_type: str

class DocumentResponse(BaseModel):
    documents: List[FileSummary]