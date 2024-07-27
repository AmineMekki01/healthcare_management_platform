from qdrant_client import QdrantClient

from src.app.chat.exceptions import RetrievalNoDocumentsFoundException
from src.app.chat.models import BaseMessage
from src.app.core.logs import logger
from src.app.settings import settings


def process_retrieval(message: BaseMessage) -> BaseMessage:
    logger.info(
        f"Qdrant settings: Host - {settings.QDRANT_HOST}, Port - {settings.QDRANT_PORT}")

    search_result = search(query=message.user_message, userId=message.userId)
    resulting_query: str = (
        f"Answer the query, \n"
        f"QUERY:\n{message.user_message}\n"
        f"CONTEXT:\n{search_result}"
    )

    return BaseMessage(augmented_message=resulting_query,
                       chat_id=message.chat_id,
                       userId=message.userId,
                       model=message.model,
                       agent_role=message.agent_role,
                       user_message=message.user_message,
                       answer=message.answer)


def search(query: str, userId: str) -> str:
    client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)
    search_result = client.query(
        collection_name=userId, query_text=query)

    if not search_result:
        raise RetrievalNoDocumentsFoundException
    return "\n".join(result.document for result in search_result)
