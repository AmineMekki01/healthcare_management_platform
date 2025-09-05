from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.database import Base
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid
from src.documents.models import ChatbotChatDocument


class Chat(Base):
    __tablename__ = "chatbot_chats"
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), nullable=False, index=True)
    title = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        default=func.now(),
        server_default=func.now(),
        onupdate=func.now(),
    )
        
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")
    documents = relationship("ChatbotChatDocument", back_populates="chat", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "chatbot_messages"
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id = Column(PG_UUID(as_uuid=True), ForeignKey("chatbot_chats.id"), nullable=False)
    user_id = Column(String(255), nullable=False)
    model = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    chat = relationship("Chat", back_populates="messages")
