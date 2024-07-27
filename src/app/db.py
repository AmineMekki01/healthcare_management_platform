import pugsql
from src.app.settings import settings

messages_queries = pugsql.module("db/queries/messages")
messages_connection = messages_queries.connect(settings.DATABASE_URL)
