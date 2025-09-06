from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
import fastapi as fastapi
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import datetime, timezone

from src.chat.service import ChatService
from src.chat.models import Message
from src.chat.schemas import (
    ChatResponse, ChatListResponse, MessageResponse,
    CreateChatRequest, MessageInput, DocumentUploadResponse
)
from src.chat.constants import ModelsEnum
from src.database import get_db
from src.chat.agent import tbibi_agent

from src.shared.logs import logger

from sqlalchemy import text
from uuid import UUID

router = APIRouter(prefix="/api/v1/chatbot", tags=["chatbot"])



def get_chat_service(
    db: AsyncSession = Depends(get_db)
) -> ChatService:
    """Get chat service instance"""
    return ChatService(db)


@router.post("/chats", response_model=ChatResponse)
async def create_chat(
    request: CreateChatRequest,
    user_id: str,
    chat_service: ChatService = Depends(get_chat_service)
):
    """Create a new chat"""
    try:
        return await chat_service.create_chat(user_id, request)
    except Exception as e:
        logger.error(f"Failed to create chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/users/{user_id}/chats", response_model=List[ChatListResponse])
async def get_user_chats(
    user_id: str,
    limit: int = 20,
    chat_service: ChatService = Depends(get_chat_service)
):
    """Get user's chats"""
    try:
        return await chat_service.get_user_chats(user_id, limit)
    except Exception as e:
        logger.error(f"Failed to get user chats: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/chats/{chat_id}", response_model=ChatResponse)
async def get_chat(
    chat_id: str,
    user_id: str,
    chat_service: ChatService = Depends(get_chat_service)
):
    """Get a specific chat with messages and documents"""
    try:
        return await chat_service.get_chat(chat_id, user_id)
    except Exception as e:
        logger.error(f"Failed to get chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get chat: {str(e)}"
        )


@router.post("/agent-response", response_model=MessageResponse)
async def agent_response(
    request: MessageInput,
    chat_service: ChatService = Depends(get_chat_service)
):
    """Unified agent endpoint that processes messages and returns AI responses"""
    try:
        user_message = Message(
            chat_id=request.chat_id,
            user_id=str(request.user_id),
            model=ModelsEnum.OPENAI_GPT.value,
            role="user",
            content=request.content,
            created_at=datetime.now(timezone.utc)
        )
        chat_service.db.add(user_message)
        
        agent_response = await tbibi_agent.process_query(request)

        ai_message = Message(
            chat_id=request.chat_id,
            user_id=str(request.user_id),
            model=ModelsEnum.OPENAI_GPT.value,
            role="assistant",
            content=agent_response,
            created_at=datetime.now(timezone.utc),
        )
        chat_service.db.add(ai_message)

        await chat_service.db.commit()
    
        return ai_message


    except ChatException as e:
        if e.error_code == "CHAT_NOT_FOUND":
            logger.error(f"Chat not found for chat_id: {request.chat_id}, user_id: {request.user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=e.message
            )
        logger.error(f"Failed to process query: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )


@router.delete("/chats/{chat_id}")
async def delete_chat(
    chat_id: str,
    user_id: str,
    chat_service: ChatService = Depends(get_chat_service)
):
    """Delete a chat"""
    try:
        success = await chat_service.delete_chat(chat_id, user_id)
        return {"message": "Chat deleted successfully", "success": success}
    except ChatException as e:
        if e.error_code == "CHAT_NOT_FOUND":
            logger.error(f"Chat not found for chat_id: {chat_id}, user_id: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=e.message
            )
        logger.error(f"Failed to delete chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )


@router.post("/chats/{chat_id}/documents", response_model=DocumentUploadResponse)
async def upload_document(
    chat_id: str,
    user_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Upload a document to a chat with intelligent storage routing"""
    try:
        from src.documents.service import DocumentService
        
        document_service = DocumentService(db)
        logger.info("[DOC_UPLOAD] DocumentService initialized, calling upload method")
        result = await document_service.upload_document(
            chat_id=chat_id,
            user_id=user_id,
            file=file
        )
        
        if result["success"]:
            logger.info(
                "[DOC_UPLOAD] success chat_id=%s user_id=%s document_id=%s storage_type=%s token_count=%s",
                chat_id, user_id, result.get("document_id"), result.get("storage_type"), result.get("token_count")
            )
            return DocumentUploadResponse(
                document_id=result["document_id"],
                filename=result["filename"],
                file_size=result["file_size"],
                processing_status=result["processing_status"],
                storage_type=result["storage_type"],
                token_count=result["token_count"],
                recommendation=result["recommendation"]
            )
        else:
            logger.warning(
                "[DOC_UPLOAD] failed chat_id=%s user_id=%s filename=%s error=%s",
                chat_id, user_id, getattr(file, 'filename', None), result.get("error")
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
            
    except Exception as e:
        logger.exception("[DOC_UPLOAD] exception chat_id=%s user_id=%s error=%s", chat_id, user_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document upload failed: {str(e)}"
        )


@router.get("/chats/{chat_id}/documents")
async def get_chat_documents(
    chat_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get documents associated with a chat"""
    try:
        from src.documents.service import DocumentService
        
        document_service = DocumentService(db)
        documents = await document_service.get_chat_documents(chat_id, user_id)
        return {"documents": documents}
        
    except Exception as e:
        logger.exception("[DOC_LIST] exception chat_id=%s user_id=%s error=%s", chat_id, user_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve documents"
        )


@router.delete("/chats/{chat_id}/documents/{document_id}")
async def delete_chat_document(
    chat_id: str,
    document_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a document from a chat with complete context removal"""
    try:
        from src.documents.service import DocumentService
        
        document_service = DocumentService(db)
        result = await document_service.delete_document(
            chat_id=chat_id,
            doc_id=document_id,
            user_id=user_id
        )
        
        if result["success"]:
            logger.info("[DOC_DELETE] success chat_id=%s user_id=%s document_id=%s storage_type=%s", chat_id, user_id, document_id, result.get("storage_type"))
            return {
                "message": result["message"],
                "document_id": result["document_id"],
                "storage_type": result["storage_type"]
            }
        else:
            logger.warning("[DOC_DELETE] failed chat_id=%s user_id=%s document_id=%s error=%s", chat_id, user_id, document_id, result.get("error"))
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND if "not found" in result["error"] else status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
            
    except Exception as e:
        logger.exception("[DOC_DELETE] exception chat_id=%s user_id=%s document_id=%s error=%s", chat_id, user_id, document_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document deletion failed: {str(e)}"
        )


@router.delete("/message/{message_id}")
async def delete_message(
    message_id: str,
    user_id: str,
    chat_service: ChatService = Depends(get_chat_service)
):
    """Delete a specific message"""
    try:
        success = await chat_service.delete_message(message_id, user_id)
        return {"message": "Message deleted successfully", "success": success}
    except ChatException as e:
        if e.error_code == "MESSAGE_NOT_FOUND":
            logger.exception("[DELETE_MESSAGE] exception message_id=%s user_id=%s error=%s", message_id, user_id, str(e))
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=e.message
            )
        logger.exception("[DELETE_MESSAGE] exception message_id=%s user_id=%s error=%s", message_id, user_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )


@router.get("/patients/search/{user_id}")
async def search_patients(
    user_id: str,
    search: str = "",
    limit: int = 5,
    db: AsyncSession = Depends(get_db)
):
    """Search for patients"""
    try:
        base_query = """
            SELECT DISTINCT p.patient_id, p.username, p.first_name, p.last_name, 
                    p.email, p.phone_number, p.age, p.sex, p.location
            FROM patient_info p
            INNER JOIN appointments a ON p.patient_id = a.patient_id
            WHERE a.doctor_id = :doctor_id AND p.is_verified = true
        """
        
        params = {"doctor_id": UUID(user_id)}
        
        if search:
            query = text(f"""
                {base_query}
                AND (LOWER(p.first_name) LIKE LOWER(:search_term) 
                        OR LOWER(p.last_name) LIKE LOWER(:search_term)
                        OR LOWER(CONCAT(p.first_name, ' ', p.last_name)) LIKE LOWER(:search_term))
                ORDER BY p.last_name, p.first_name
                LIMIT :limit
            """)
            params.update({"search_term": f"%{search}%", "limit": limit})
        else:
            query = text(f"""
                {base_query}
                ORDER BY p.last_name, p.first_name
                LIMIT :limit
            """)
            params.update({"limit": limit})
        
        result = await db.execute(query, params)
        rows = result.mappings().all()
        
        patients = []
        for row in rows:
            patients.append({
                "patient_id": str(row['patient_id']),
                "username": row['username'],
                "first_name": row['first_name'],
                "last_name": row['last_name'],
                "full_name": f"{row['first_name']} {row['last_name']}",
                "email": row['email'],
                "phone_number": row['phone_number'],
                "age": row['age'],
                "sex": row['sex'],
                "location": row['location']
            })
        
        return {
            "total_patients": len(patients),
            "patients": patients
        }
 
        
    except Exception as e:
        logger.exception("[PATIENT_SEARCH] exception user_id=%s error=%s", user_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Patient search failed"
        )
