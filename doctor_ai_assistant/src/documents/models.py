import uuid
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from src.database import Base

class ChatbotChatDocument(Base):
    """
    Database model for document storage tracking
    """
    __tablename__ = "chatbot_documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chatbot_chats.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    
    token_count = Column(Integer, nullable=False)
    storage_type = Column(String(20), nullable=False)
    ttl_days = Column(Integer, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    chat = relationship("Chat", back_populates="documents")

    def __repr__(self):
        return f"<ChatbotChatDocument(id={self.id}, filename={self.filename}, storage_type={self.storage_type})>"