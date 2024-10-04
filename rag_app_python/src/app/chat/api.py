from uuid import UUID
from fastapi import APIRouter

from src.app.chat.models import BaseMessage, Message, ChatSummary, DocumentResponse
from src.app.chat.services import ChatbotService, ChatServices
from src.app.core.logs import logger
from src.app.db import messages_queries

router = APIRouter(tags=["Chat Endpoints"])


@router.get("/v1/messages/{user_id}")
async def get_messages(user_id: str) -> list[Message]:
    return [Message(**message) for message in messages_queries.select_messages_by_user(user_id=user_id)]


@router.get("/v1/chats/{user_id}")
async def get_chats(user_id: str):
    chats = messages_queries.select_chats_by_user(user_id=user_id)

    chats_to_return = [chat for chat in chats]
    return chats_to_return


@router.get("/v1/chat/{chat_id}/messages")
async def get_chat_messages(chat_id) -> list[Message]:
    messages = messages_queries.select_messages_by_chat(chat_id=chat_id)
    messages_to_return = [
        {**message, 'id': str(message['id'])} for message in messages]
    return messages_to_return


@router.get("/v1/chat/{chat_id}")
async def get_chat(chat_id: UUID) -> ChatSummary:
    return ChatSummary(**messages_queries.select_chat_by_id(chat_id=chat_id))

@router.get("/v1/documents/{chat_id}", response_model=DocumentResponse)
async def get_chat_documents(chat_id: UUID) -> DocumentResponse:
    chat_documents = list(messages_queries.select_documents_by_chat(chat_id=chat_id))
    
    documents_to_return = [
        {
            'id': str(doc['id']), 
            'chat_id': str(doc['chat_id']), 
            'file_name': doc['file_name']
        } 
        for doc in chat_documents
    ]
    
    if not documents_to_return:
        return DocumentResponse(documents=[])
    
    return DocumentResponse(documents=documents_to_return)

@router.post("/v1/chat-create")
async def create_chat(chat: ChatSummary):
    try:
        return await ChatServices.create_chat(chat=chat)
    except Exception as e:
        logger.error(f"Error creating chat: {e}")


@router.post("/v1/qa-create")
async def qa_create(input_message: BaseMessage) -> Message:
    try:
        return await ChatbotService.invoke_llm(input_message=input_message)
    except Exception as e:
        logger.info(f"Error in qa_create : {e}")
