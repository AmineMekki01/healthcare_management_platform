from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from typing import List
from src.chat.models import Chat, Message
from src.chat.schemas import (
    ChatResponse, ChatListResponse,
    CreateChatRequest
)
from src.shared.logs import logger
from fastapi import HTTPException

import uuid


class ChatService:
    def __init__(
        self,
        db: AsyncSession,
    ):
        self.db = db
    
    async def create_chat(self, user_id: str, request: CreateChatRequest) -> ChatResponse:
        """Create a new chat"""
        try:
            user_uuid = uuid.UUID(user_id)
            chat = Chat(
                user_id=user_uuid,
                title=request.title or "New Chat"
            )
            
            self.db.add(chat)
            await self.db.commit()
            await self.db.refresh(chat)
            
            return ChatResponse(
                id=chat.id,
                user_id=chat.user_id,
                title=chat.title,
                created_at=chat.created_at,
                updated_at=chat.updated_at,
                messages=[],
                documents=[]
            )
            
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to create chat: {e}")
    
    async def get_user_chats(self, user_id: str, limit: int = 20) -> List[ChatListResponse]:
        """Get user's chats with summary info"""
        try:
            user_uuid = uuid.UUID(user_id)
            stmt = (
                select(Chat)
                .where(Chat.user_id == user_uuid)
                .options(selectinload(Chat.messages))
                .order_by(desc(Chat.updated_at))
                .limit(limit)
            )
            
            result = await self.db.execute(stmt)
            chats = result.scalars().all()
            
            chat_list = []
            for chat in chats:
                last_message = None
                if chat.messages:
                    sorted_messages = sorted(chat.messages, key=lambda m: m.created_at, reverse=True)
                    last_message = sorted_messages[0].content[:100] + "..." if len(sorted_messages[0].content) > 100 else sorted_messages[0].content
                
                chat_list.append(ChatListResponse(
                    id=chat.id,
                    title=chat.title,
                    created_at=chat.created_at,
                    updated_at=chat.updated_at,
                    message_count=len(chat.messages),
                    last_message=last_message
                ))
            
            return chat_list
            
        except Exception as e:
            logger.exception("[GET_USER_CHATS] exception user_id=%s error=%s", user_id, str(e))
            raise HTTPException(status_code=500, detail=f"Failed to get user chats: {e}")
        
    async def get_chat(self, chat_id: str, user_id: str) -> ChatResponse:
        """Get chat with messages and documents"""
        try:
            chat_uuid = uuid.UUID(chat_id)
            user_uuid = uuid.UUID(user_id)
            stmt = (
                select(Chat)
                .where(Chat.id == chat_uuid, Chat.user_id == user_uuid)
                .options(
                    selectinload(Chat.messages),
                    selectinload(Chat.documents)
                )
            )
    
            result = await self.db.execute(stmt)
            chat = result.scalar_one_or_none()
            
            if not chat:
                logger.exception("[GET_CHAT] exception chat_id=%s user_id=%s error=Chat not found", chat_id, user_id)
                raise HTTPException(status_code=404, detail="Chat not found")
            
            messages = []
            for m in sorted(chat.messages, key=lambda mm: mm.created_at):
                messages.append({
                    "id": m.id,
                    "user_id": str(m.user_id),
                    "model": m.model,
                    "role": m.role,
                    "content": m.content,
                    "created_at": m.created_at,
                })

            documents = []
            for d in getattr(chat, "documents", []) or []:
                created_at = None
                if getattr(d, "created_at", None):
                    try:
                        created_at = d.created_at.isoformat()
                    except Exception:
                        created_at = str(d.created_at)
                updated_at = None
                if getattr(d, "updated_at", None):
                    try:
                        updated_at = d.updated_at.isoformat()
                    except Exception:
                        updated_at = str(d.updated_at)

                documents.append({
                    "id": d.id,
                    "chat_id": d.chat_id,
                    "user_id": d.user_id,
                    "filename": d.filename,
                    "file_size": d.file_size,
                    "mime_type": d.mime_type,
                    "token_count": d.token_count,
                    "storage_type": d.storage_type,
                    "ttl_days": d.ttl_days,
                    "created_at": created_at,
                    "updated_at": updated_at,
                })

            return ChatResponse(
                id=chat.id,
                user_id=chat.user_id,
                title=chat.title,
                created_at=chat.created_at,
                updated_at=chat.updated_at,
                messages=messages,
                documents=documents,
            )
            
        except Exception as e:
            logger.exception("[GET_CHAT] exception chat_id=%s user_id=%s error=%s", chat_id, user_id, str(e))
            raise HTTPException(status_code=500, detail=f"Failed to get chat: {e}")
    
    async def delete_chat(self, chat_id: str, user_id: str) -> bool:
        """Delete a chat and all associated messages"""
        try:
            chat_uuid = uuid.UUID(chat_id)
            user_uuid = uuid.UUID(user_id)
            
            stmt = select(Chat).where(Chat.id == chat_uuid, Chat.user_id == user_uuid)
            result = await self.db.execute(stmt)
            chat = result.scalar_one_or_none()
            
            if not chat:
                raise HTTPException(status_code=404, detail="Chat not found")
            
            await self.db.delete(chat)
            await self.db.commit()
            
            return True
            
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to delete chat: {e}")
    
    async def delete_message(self, message_id: str, user_id: str) -> bool:
        """Delete a specific message"""
        try:
            message_uuid = uuid.UUID(message_id)
            user_uuid = uuid.UUID(user_id)
            
            stmt = (
                select(Message)
                .join(Chat)
                .where(
                    Message.id == message_uuid,
                    Chat.user_id == user_uuid
                )
            )
            
            result = await self.db.execute(stmt)
            message = result.scalar_one_or_none()
            
            if not message:
                raise HTTPException(status_code=404, detail="Message not found or access denied")
            
            await self.db.delete(message)
            await self.db.commit()
            
            return True
            
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to delete message: {e}")
    