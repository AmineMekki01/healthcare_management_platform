from uuid import UUID
import uuid
from typing import List
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query

from src.app.chat.models import BaseMessage, Message, ChatSummary, DocumentResponse, ChatCreateResponse
from src.app.chat.services import ChatServices
from src.app.chat.tools import get_patient_basic_info, search_patients_for_doctor
from src.app.chat.agent import tbibi_agent
from src.app.core.logs import logger
from src.app.db import get_db_session
from src.app.chat.constants import ChatRolesEnum
from sqlalchemy import text

router = APIRouter(tags=["Chat Endpoints"])


# @router.get("/v1/messages/{user_id}", response_model=List[Message])
# async def get_messages(user_id: str) -> List[Message]:
#     """Get all messages for a specific user.
    
#     Args:
#         user_id: The ID of the user whose messages to retrieve
        
#     Returns:
#         List[Message]: List of messages for the user
        
#     Raises:
#         HTTPException: 500 if there's a server error
#     """
#     try:
#         messages = await ChatServices.get_messages(user_id=user_id)
#         return messages
#     except Exception as e:
#         logger.error(f"Error fetching messages for user {user_id}: {e}")
#         raise HTTPException(status_code=500, detail=f"Failed to fetch messages: {str(e)}")

#
@router.get("/v1/chatbot/chats/{user_id}", response_model=List[ChatSummary])
async def get_chats(user_id: str) -> List[ChatSummary]:
    """Get all chats for a specific user.
    
    Args:
        user_id: The ID of the user whose chats to retrieve
        
    Returns:
        List[ChatSummary]: List of chat summaries for the user
        
    Raises:
        HTTPException: 500 if there's a server error
    """
    try:
        chats = await ChatServices.get_chats(user_id=user_id)
        return chats
    except Exception as e:
        logger.error(f"Error fetching chats for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch chats: {str(e)}")

#
@router.get("/v1/chatbot/{chat_id}/messages", response_model=List[Message])
async def get_chat_messages(chat_id: UUID) -> List[Message]:
    """Get all messages for a specific chat.
    
    Args:
        chat_id: The ID of the chat to retrieve messages for
        
    Returns:
        List[Message]: List of messages in the chat
        
    Raises:
        HTTPException: 500 if there's a server error
    """
    try:
        messages = await ChatServices.get_chat_messages(str(chat_id))
        return messages
    except Exception as e:
        logger.error(f"Error fetching messages for chat {chat_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch chat messages: {str(e)}")


@router.get("/v1/chatbot/{chat_id}", response_model=ChatSummary)
async def get_chat(chat_id: UUID) -> ChatSummary:
    """Get chat details by ID.
    
    Args:
        chat_id: The ID of the chat to retrieve
        
    Returns:
        ChatSummary: The chat details if found
        
    Raises:
        HTTPException: 404 if chat not found, 500 for server errors
    """
    try:
        chat = await ChatServices.get_chat(str(chat_id))
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        return chat
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching chat {chat_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch chat: {str(e)}")

#
@router.post("/v1/chatbot/chat-create", response_model=ChatCreateResponse)
async def create_chat(chat: ChatSummary) -> ChatCreateResponse:
    """Create a new chat conversation.
    
    Args:
        chat: The chat details including user_id, title, and other metadata
        
    Returns:
        ChatCreateResponse: The created chat details
    """
    try:
        if not chat.id:
            chat.id = str(uuid.uuid4())
        if not chat.agent_role:
            chat.agent_role = ChatRolesEnum.ASSISTANT.value
        if not chat.created_at:
            chat.created_at = datetime.now(timezone.utc)
        if not chat.updated_at:
            chat.updated_at = datetime.now(timezone.utc)
            
        result = await ChatServices.create_chat(chat=chat)
        return ChatCreateResponse(
            id=str(result.id),
            user_id=str(result.user_id),
            title=result.title,
            model=result.model,
            agent_role=result.agent_role,
            created_at=result.created_at,
            updated_at=result.updated_at
        )
    except Exception as e:
        logger.error(f"Error creating chat: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create chat: {str(e)}")

#
@router.delete("/v1/chatbot/chat-delete/{chat_id}")
async def delete_chat(chat_id: str, user_id: str = Query(..., description="User ID for authorization")):
    """Delete a chat conversation and all its messages.
    
    Args:
        chat_id: The chat ID to delete
        user_id: The user ID for authorization
    
    Returns:
        dict: Success message with count of deleted messages
        
    Raises:
        HTTPException: 404 if chat not found, 403 if unauthorized, 500 for server errors
    """
    try:
        chat = await ChatServices.get_chat(chat_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
            
        if str(chat.user_id) != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this chat")
        
        async with get_db_session() as session:
            try:
                result = await session.execute(
                    text("""
                        DELETE FROM messages 
                        WHERE chat_id = :chat_id 
                        RETURNING id
                    """),
                    {"chat_id": chat_id}
                )
                messages_deleted = len(result.all())
                
                await session.execute(
                    text("DELETE FROM documents WHERE chat_id = :chat_id"),
                    {"chat_id": chat_id}
                )
                
                await session.execute(
                    text("DELETE FROM chats WHERE id = :chat_id"),
                    {"chat_id": chat_id}
                )
                
                await session.commit()
                
                try:
                    from agents.extensions.memory.sqlalchemy_session import SQLAlchemySession
                    from sqlalchemy.ext.asyncio import create_async_engine
                    from src.app.core.config import settings
                    
                    db_url = settings.DATABASE_URL.replace('postgresql://', 'postgresql+asyncpg://', 1)
                    engine = create_async_engine(db_url, echo=True)
                    chat_session = SQLAlchemySession(f"conversation_{chat_id}", engine=engine, create_tables=True)
                    await chat_session.clear_session()
                except ImportError:
                    logger.debug("SQLAlchemy session extension not available, skipping session cleanup")
                
                logger.info(f"Chat {chat_id} and its messages deleted successfully")
                return {"message": f"Chat deleted successfully. Removed {messages_deleted} messages."}
                
            except Exception as e:
                await session.rollback()
                logger.error(f"Database error while deleting chat {chat_id}: {e}")
                raise HTTPException(status_code=500, detail="Database error while deleting chat")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting chat {chat_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete chat: {str(e)}")

#
@router.delete("/v1/chatbot/message/{message_id}")
async def delete_message(message_id: str, user_id: str = Query(..., description="User ID for authorization")):
    """Delete a specific message.
    
    Args:
        message_id: The message ID to delete
        user_id: The user ID for authorization
    
    Returns:
        dict: Success message
        
    Raises:
        HTTPException: 404 if message not found, 403 if unauthorized, 500 for server errors
    """
    try:
        async with get_db_session() as session:
            result = await session.execute(
                text("""
                    SELECT id, user_id, chat_id 
                    FROM messages 
                    WHERE id = :message_id AND deleted_at IS NULL
                """),
                {"message_id": message_id}
            )
            message = result.mappings().first()
            
            if not message:
                raise HTTPException(status_code=404, detail="Message not found")
                
            if str(message['user_id']) != user_id:
                raise HTTPException(status_code=403, detail="Not authorized to delete this message")
                
            await session.execute(
                text("""
                    UPDATE messages 
                    SET deleted_at = NOW() 
                    WHERE id = :message_id
                    RETURNING id
                """),
                {"message_id": message_id}
            )
            
            await session.execute(
                text("""
                    UPDATE chats 
                    SET updated_at = NOW() 
                    WHERE id = :chat_id
                """),
                {"chat_id": message['chat_id']}
            )
            
            await session.commit()
            logger.info(f"Message {message_id} soft deleted successfully")
            return {"message": "Message deleted successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        if 'session' in locals():
            await session.rollback()
        logger.error(f"Error deleting message {message_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete message: {str(e)}")

#
@router.get("/v1/chatbot/documents/{chat_id}", response_model=DocumentResponse)
async def get_chat_documents(chat_id: UUID) -> DocumentResponse:
    try:
        chat_documents = await ChatServices.get_documents_by_chat(chat_id=chat_id)

        documents_to_return = [
            {
                'id': str(doc['id']), 
                'chat_id': str(doc['chat_id']), 
                'file_name': doc['file_name']
            } 
            for doc in chat_documents
        ]
        
        return DocumentResponse(documents=documents_to_return)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching documents for chat {chat_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch chat documents: {str(e)}")

#
@router.post("/v1/chatbot/agent-response", response_model=Message)
async def qa_create(input_message: BaseMessage) -> Message:
    """
    Tbibi chat endpoint that handles both general queries and patient-specific queries.
    
    Args:
        input_message: The input message containing the user query and chat details
    
    Returns:
        Message: The response message containing the agent's answer
    """
    try:
        agent_response = await tbibi_agent.process_query(input_message)
        
        message_data = {
            "id": str(uuid.uuid4()),
            "chat_id": str(input_message.chat_id),
            "model": str(input_message.model),
            "user_id": str(input_message.user_id),
            "agent_role": str(ChatRolesEnum.ASSISTANT.value),
            "user_message": str(input_message.user_message),
            "answer": str(agent_response),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        result_message = await ChatServices.create_message(message_data)
        
        return Message(
            id=result_message.id,
            chat_id=result_message.chat_id,
            user_id=result_message.user_id,
            model=result_message.model,
            agent_role=str(ChatRolesEnum.ASSISTANT.value),
            user_message=input_message.user_message,
            answer=agent_response,
            augmented_message=input_message.user_message,
            patient_id=getattr(input_message, 'patient_id', None)
        )
    except Exception as e:
        logger.error(f"Error in qa_create: {e}")
        raise HTTPException(status_code=500, detail="Failed to process message")


@router.get("/v1/chatbot/patients/search/{doctor_id}")
async def search_doctor_patients(
    doctor_id: str,
    search: str = Query("", description="Search term for patient name"),
    limit: int = Query(20, description="Maximum number of patients to return")
):
    """Search for patients belonging to a specific doctor.
    
    Args:
        doctor_id: The doctor ID
        search: The search term for patient name
        limit: The maximum number of patients to return
    
    Returns:
        The search results
    """
    try:
        result = await search_patients_for_doctor(
            doctor_id=doctor_id,
            search_term=search,
            limit=limit
        )
        return result
    except Exception as e:
        logger.error(f"Error searching patients for doctor {doctor_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))