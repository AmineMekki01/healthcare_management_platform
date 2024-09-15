from qdrant_client import QdrantClient

from src.app.chat.models import BaseMessage
from src.app.core.logs import logger
from src.app.settings import settings
from src.app.utils import init_vector_store
from qdrant_client.http import models

def process_retrieval(message: BaseMessage) -> BaseMessage:
    logger.info(
        f"Qdrant settings: Host - {settings.QDRANT_HOST}, Port - {settings.QDRANT_PORT}")

    search_result = search_documents(query_text=message.user_message, chat_id=message.chat_id)
    print(f"search_result : {search_result}")
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



def search_documents(chat_id, query_text):
    try:
        vector_store = init_vector_store()
        results = vector_store.similarity_search(
            query=query_text,
            k=3,
            filter=models.Filter(
                should=[
                    models.FieldCondition(
                        key="metadata.chat_id",
                        match=models.MatchValue(
                            value=chat_id
                        ),
                    ),
                ]
            ),
        )
    except Exception as e:
        logger.error(f"Got an error when searching for context. The error : {e}")
        results = ""
        
    return results