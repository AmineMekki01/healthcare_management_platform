from uuid import UUID
from typing import List
from fastapi import APIRouter, HTTPException

from src.app.chat.models import BaseMessage, Message, ChatSummary, DocumentResponse, ChatCreateResponse
from src.app.chat.services import ChatbotService, ChatServices
from src.app.core.logs import logger
from src.app.db import messages_queries

router = APIRouter(tags=["Chat Endpoints"])


@router.get("/v1/messages/{user_id}", response_model=List[Message])
async def get_messages(user_id: str) -> List[Message]:
    try:
        messages = messages_queries.select_messages_by_user(user_id=user_id)
        messages_to_return = [
            {
                **message,
                'id': str(message['id']) if message.get('id') else "",
                'chat_id': str(message['chat_id']) if message.get('chat_id') else ""
            }
            for message in messages
        ]
        return [Message(**message) for message in messages_to_return]
    except Exception as e:
        logger.error(f"Error fetching messages for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch messages")


@router.get("/v1/chats/{user_id}", response_model=List[ChatSummary])
async def get_chats(user_id: str) -> List[ChatSummary]:
    try:
        chats = messages_queries.select_chats_by_user(user_id=user_id)
        chats_to_return = [
            {
                **chat,
                'id': str(chat['id']),
                'user_id': str(chat['user_id'])
            }
            for chat in chats
        ]
        return chats_to_return
    except Exception as e:
        logger.error(f"Error fetching chats for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch chats")


@router.get("/v1/chat/{chat_id}/messages", response_model=List[Message])
async def get_chat_messages(chat_id) -> List[Message]:
    try:
        messages = messages_queries.select_messages_by_chat(chat_id=chat_id)
        messages_to_return = [
            {**message, 'id': str(message['id'])} for message in messages]
        return messages_to_return
    except Exception as e:
        logger.error(f"Error fetching messages for chat {chat_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch chat messages")


@router.get("/v1/chat/{chat_id}", response_model=ChatSummary)
async def get_chat(chat_id: UUID) -> ChatSummary:
    try:
        chat_data = messages_queries.select_chat_by_id(chat_id=chat_id)
        if not chat_data:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        # Convert UUID fields to strings
        chat_data_formatted = {
            **chat_data,
            'id': str(chat_data['id']),
            'user_id': str(chat_data['user_id'])
        }
        return ChatSummary(**chat_data_formatted)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching chat {chat_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch chat")

@router.get("/v1/documents/{chat_id}", response_model=DocumentResponse)
async def get_chat_documents(chat_id: UUID) -> DocumentResponse:
    try:
        chat_documents = list(messages_queries.select_documents_by_chat(chat_id=chat_id))
        
        documents_to_return = [
            {
                'id': str(doc['id']), 
                'chat_id': str(doc['chat_id']), 
                'file_name': doc['file_name']
            } 
            for doc in chat_documents
        ]
        
        return DocumentResponse(documents=documents_to_return)
    except Exception as e:
        logger.error(f"Error fetching documents for chat {chat_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch chat documents")

@router.post("/v1/chat-create", response_model=ChatCreateResponse)
async def create_chat(chat: ChatSummary) -> ChatCreateResponse:
    try:
        result = await ChatServices.create_chat(chat=chat)
        result_dict = result.dict()
        
        # Convert UUID fields to strings if they exist
        if 'id' in result_dict:
            result_dict['id'] = str(result_dict['id'])
        if 'user_id' in result_dict:
            result_dict['user_id'] = str(result_dict['user_id'])
            
        return ChatCreateResponse(**result_dict)
    except Exception as e:
        logger.error(f"Error creating chat: {e}")
        raise HTTPException(status_code=500, detail="Failed to create chat")


@router.post("/v1/qa-create", response_model=Message)
async def qa_create(input_message: BaseMessage) -> Message:
    try:
        result = await ChatbotService.invoke_llm(input_message=input_message)
        return result
    except Exception as e:
        logger.error(f"Error in qa_create: {e}")
        raise HTTPException(status_code=500, detail="Failed to process message")
