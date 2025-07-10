import uuid
from src.app.chat.constants import ChatRolesEnum
from src.app.chat.models import BaseMessage, Message
from src.app.core.logs import logger
from src.app.chat.constants import ChatRolesEnum
from src.app.db import messages_queries
from src.app.chat.models import BaseMessage, Message, ChatSummary

from src.app.utils import get_llm_chain
class ChatbotService:
    @classmethod
    async def invoke_llm(cls, input_message: BaseMessage) -> Message:
        llm_rag_chain = get_llm_chain(input_message.chat_id)
        
        completion = await llm_rag_chain.ainvoke(input=input_message.user_message)
        print(f"completion : {completion}")
        try:
            message_id = uuid.uuid4()
            messages_queries.insert_message(
                id=str(message_id),
                chat_id=str(input_message.chat_id),
                model=str(input_message.model),
                user_id=str(input_message.userId),
                agent_role=str(ChatRolesEnum.ASSISTANT.value),
                user_message=str(input_message.user_message),
                answer=str(completion),
            )
            logger.info("Message inserted to db successfully")

        except Exception as e:
            logger.error("Error while inserting message to db: " + str(e))
        return Message(
            id=str(message_id),
            chat_id=str(input_message.chat_id),
            model=str(input_message.model),
            userId=str(input_message.userId),
            agent_role=str(ChatRolesEnum.ASSISTANT.value),
            user_message=str(input_message.user_message),
            answer=completion,
            augmented_message=str(input_message.augmented_message)
        )


class ChatServices:
    @classmethod
    def get_messages(cls, user_id: str) -> list[Message]:
        return [Message(**message) for message in messages_queries.select_messages_by_user(user_id=user_id)]

    @classmethod
    def get_chats(cls, user_id: str) -> list[ChatSummary]:
        return [ChatSummary(**chat) for chat in messages_queries.select_chats_by_user(user_id=user_id)]

    @classmethod
    def get_chat_messages(cls, chat_id) -> list[Message]:
        return [Message(**message) for message in messages_queries.select_messages_by_chat(chat_id=chat_id)]

    @classmethod
    def get_chat(cls, chat_id) -> ChatSummary:
        return ChatSummary(**messages_queries.select_chat_by_id(chat_id=chat_id))

    @classmethod
    async def create_chat(cls, chat: ChatSummary):
        try:
            messages_queries.insert_chat(
                id=str(chat.id),
                user_id=str(chat.user_id),
                title=chat.title,
                model=chat.model,
                agent_role=str(ChatRolesEnum.ASSISTANT.value),
                created_at=chat.created_at,
                updated_at=chat.updated_at,
            )
            logger.info("chat before returning to frontend: " + str(chat))
            return chat
        except Exception as e:
            logger.error(f"Error creating chat: {e}")
            raise  # Re-raise the exception instead of returning None

    @classmethod
    def create_message(cls, message) -> Message:
        return Message(**messages_queries.insert_message(message=message))
