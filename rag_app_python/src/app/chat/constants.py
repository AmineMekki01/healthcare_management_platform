from enum import StrEnum

NO_DOCUMENTS_FOUND: str = "No documents found in context. Please try again with a different query."


class FailureReasonsEnum(StrEnum):
    OPENAI_ERROR = 'OpenAI call Error'
    STREAM_TIMEOUT = 'Stream Timeout'
    FAILED_PROCESSING = 'Failed Processing'


class ChatRolesEnum(StrEnum):
    USER = 'user'
    SYSTEM = 'system'
    ASSISTANT = 'assistant'


class ModelsEnum(StrEnum):
    GPT4 = "gpt-4-1106-preview"
    LLAMA2 = "llama2_7b"
