import uuid
from typing import List, Optional
from sqlalchemy import select, text
from src.app.chat.models import Message, ChatSummary
from src.app.core.logs import logger
from src.app.db import get_db_session



class ChatServices:
    @classmethod
    async def get_messages(cls, user_id: str) -> List[Message]:
        async with get_db_session() as session:
            result = await session.execute(
                text("""
                    SELECT id, chat_id, model, user_id, agent_role, user_message, answer, created_at
                    FROM chatbot_messages 
                    WHERE user_id = :user_id 
                    ORDER BY created_at
                """),
                {"user_id": user_id}
            )
            messages = []
            for row in result.mappings():
                messages.append(Message(
                    id=str(row['id']),
                    chat_id=str(row['chat_id']),
                    model=row['model'],
                    user_id=str(row['user_id']),
                    agent_role=row['agent_role'],
                    user_message=row['user_message'] or "",
                    answer=row['answer'] or "",
                ))
            return messages

    @classmethod
    async def get_chats(cls, user_id: str) -> List[ChatSummary]:
        async with get_db_session() as session:
            result = await session.execute(
                text("""
                    SELECT id, user_id, title, model, agent_role, created_at, updated_at
                    FROM chatbot_chats 
                    WHERE user_id = :user_id 
                    ORDER BY updated_at DESC
                """),
                {"user_id": user_id}
            )
            chats = []
            for row in result.mappings():
                chats.append(ChatSummary(
                    id=str(row['id']),
                    user_id=str(row['user_id']),
                    title=row['title'],
                    model=row['model'],
                    agent_role=row['agent_role'],
                    created_at=row['created_at'],
                    updated_at=row['updated_at']
                ))
            return chats

    @classmethod
    async def get_chat_messages(cls, chat_id: str) -> List[Message]:
        async with get_db_session() as session:
            result = await session.execute(
                text("""
                    SELECT id, chat_id, model, user_id, agent_role, user_message, answer, created_at
                    FROM chatbot_messages 
                    WHERE chat_id = :chat_id 
                    ORDER BY created_at
                """),
                {"chat_id": chat_id}
            )
            messages = []
            for row in result.mappings():
                messages.append(Message(
                    id=str(row['id']),
                    chat_id=str(row['chat_id']),
                    model=row['model'],
                    user_id=str(row['user_id']),
                    agent_role=row['agent_role'],
                    user_message=row['user_message'] or "",
                    answer=row['answer'] or "",
                ))
            return messages

    @classmethod
    async def get_chat(cls, chat_id: str) -> Optional[ChatSummary]:
        async with get_db_session() as session:
            result = await session.execute(
                text("""
                    SELECT id, user_id, title, model, agent_role, created_at, updated_at
                    FROM chatbot_chats 
                    WHERE id = :chat_id
                """),
                {"chat_id": chat_id}
            )
            row = result.mappings().first()
            if row:
                return ChatSummary(
                    id=str(row['id']),
                    user_id=str(row['user_id']),
                    title=row['title'],
                    model=row['model'],
                    agent_role=row['agent_role'],
                    created_at=row['created_at'],
                    updated_at=row['updated_at']
                )
            return None

    @classmethod
    async def create_chat(cls, chat: ChatSummary):
        try:
            async with get_db_session() as session:
                await session.execute(
                    text("""
                        INSERT INTO chatbot_chats (id, user_id, title, model, agent_role, created_at, updated_at)
                        VALUES (:id, :user_id, :title, :model, :agent_role, :created_at, :updated_at)
                    """),
                    {
                        "id": chat.id,
                        "user_id": chat.user_id,
                        "title": chat.title,
                        "model": chat.model,
                        "agent_role": chat.agent_role,
                        "created_at": chat.created_at,
                        "updated_at": chat.updated_at
                    }
                )
                await session.commit()
                logger.info("Chat created successfully: " + str(chat))
                return chat
        except Exception as e:
            logger.error(f"Error creating chat: {e}")
            raise

    @classmethod
    async def create_message(cls, message: dict) -> Message:
        try:
            async with get_db_session() as session:
                await session.execute(
                    text("""
                        INSERT INTO chatbot_messages 
                        (id, chat_id, model, user_id, agent_role, user_message, 
                         answer, created_at)
                        VALUES 
                        (:id, :chat_id, :model, :user_id, :agent_role, :user_message, 
                         :answer, NOW())
                    """),
                    message
                )
                await session.commit()
                new_message = Message(**message)
                return new_message
        except Exception as e:
            logger.error(f"Error creating message: {e}")
            raise
            
    @classmethod
    async def get_documents_by_chat(cls, chat_id: str):
        """Get all documents associated with a specific chat.
        
        Args:
            chat_id: The ID of the chat to retrieve documents for
            
        Returns:
            List[dict]: List of document dictionaries
            
        Raises:
            Exception: If there's an error fetching the documents
        """
        from sqlalchemy import text
        from src.app.db import get_db_session
        
        try:
            session = get_db_session()
            
            result = await session.execute(
                text("""
                    SELECT * FROM chatbot_files 
                    WHERE chat_id = :chat_id
                    ORDER BY uploaded_at DESC
                """),
                {"chat_id": chat_id}
            )
            
            documents = [dict(row) for row in result.mappings()]
            
            await session.close()
            
            return documents
            
        except Exception as e:
            logger.error(f"Error fetching documents for chat {chat_id}: {e}")
            if 'session' in locals():
                await session.close()
            raise
