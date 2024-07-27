"""
This module contains the constants and enums used in the chat module.
"""

from enum import StrEnum
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

NO_DOCUMENTS_FOUND: str = "No documents found in context. Please try again with a different query."

class FailureReasonsEnum(StrEnum):
    OPENAI_ERROR = 'OpenAI call Error'
    STREAM_TIMEOUT = 'Stream Timeout'
    FAILED_PROCESSING = 'Failed Processing'


class ChatRolesEnum(StrEnum):
    USER = 'user'
    SYSTEM = 'system'
    ASSISTANT = 'assistant'


class ModelsEnum(StrEnum):
    GPT4 = "gpt-4-1106-preview"
    # LLAMA2 = "llama2_7b"


class TimestampAbstractModel(BaseModel):
    created_at : datetime = Field(default_factory=datetime.utcnow)


class BaseMessage(BaseModel):
    id: str = Field(default="")
    chat_id: str = Field(default="")
    model: ModelsEnum = Field(default=ModelsEnum.GPT4.value)
    userId: Optional[str] = None
    agent_role: str = Field(default=ChatRolesEnum.ASSISTANT.value)
    user_message: str = Field(default="")
    augmented_message: str = Field(default="")
    medical_history_answer: str = Field(default="")
    medical_images_interpretation_answer: str = Field(default="")
    lab_test_results_answer: str = Field(default="")
    diagnostic_expert_answer: str = Field(default="")


class Message(TimestampAbstractModel, BaseMessage):
    role: Optional[ChatRolesEnum] = None


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
    
    
