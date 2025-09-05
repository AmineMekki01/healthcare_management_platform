from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from src.shared.logs import logger

class ChatDocumentHandler:
    """
    Manages in-memory document context for chat sessions with add/remove capabilities
    """
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ChatDocumentHandler, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self.chat_contexts: Dict[str, Dict[str, Dict[str, Any]]] = {}
            logger.info("ChatDocumentHandler initialized as singleton")
            ChatDocumentHandler._initialized = True
        else:
            logger.debug("ChatDocumentHandler singleton instance reused")
            
    def add_document(
        self, 
        chat_id, 
        doc_id: str, 
        content: str, 
        metadata: Dict[str, Any]
    ) -> bool:
        """
        Add document to chat context
        
        Args:
            chat_id: Chat session ID
            doc_id: Document ID
            content: Document text content
            metadata: Document metadata (filename, size, etc.)
            
        Returns:
            True if added successfully
        """
        try:
            chat_id_str = str(chat_id)
            
            logger.info(f"Adding document {doc_id} to chat {chat_id_str}")
            
            if chat_id_str not in self.chat_contexts:
                self.chat_contexts[chat_id_str] = {}
                logger.debug(f"Created new chat context for chat_id={chat_id_str}")
                
            self.chat_contexts[chat_id_str][doc_id] = {
                'content': content,
                'metadata': metadata,
                'added_at': datetime.now(timezone.utc)
            }
            
            logger.info(f"Document {doc_id} added to chat {chat_id_str} context")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add document {doc_id} to chat {chat_id}: {e}")
            return False
    
    def remove_document(self, chat_id: str, doc_id: str) -> bool:
        """
        Remove document from chat context
        
        Args:
            chat_id: Chat session ID
            doc_id: Document ID to remove
            
        Returns:
            True if successfully removed, False if not found
        """
        try:
            if chat_id in self.chat_contexts:
                removed_doc = self.chat_contexts[chat_id].pop(doc_id, None)
                if removed_doc:
                    logger.info(f"Removed document {doc_id} from chat {chat_id} context")
                    return True
                else:
                    logger.warning(f"Document {doc_id} not found in chat {chat_id} context")
                    return False
            else:
                logger.warning(f"Chat {chat_id} not found in context")
                return False
                
        except Exception as e:
            logger.error(f"Failed to remove document {doc_id} from chat {chat_id}: {e}")
            return False
    
    def get_chat_context(self, chat_id) -> Optional[str]:
        """Get formatted context for a specific chat"""
        chat_id_str = str(chat_id)
        
        if chat_id_str in self.chat_contexts:
            context_docs = self.chat_contexts[chat_id_str]
            logger.debug(f"Found {len(context_docs)} documents for chat {chat_id_str}")
            
            formatted_context = []
            for doc_id, doc_data in context_docs.items():
                content = doc_data['content']
                metadata = doc_data['metadata']
                
                formatted_doc = f"📄 **{metadata.get('filename', 'Unknown File')}**\n{content}\n"
                formatted_context.append(formatted_doc)
            
            result = "\n\n".join(formatted_context)
            logger.info(f"Retrieved {len(result)} chars of context for chat {chat_id_str}")
            return result
        else:
            logger.debug(f"No context found for chat_id {chat_id_str}")
            return None
    
    def get_document_list(self, chat_id: str) -> List[Dict[str, Any]]:
        """
        Get list of documents for a chat
        """
        try:
            if chat_id not in self.chat_contexts:
                logger.info(f"[CHAT_HANDLER] No documents found for chat {chat_id}")
                return []
            
            doc_list = []
            for doc_id, doc_data in self.chat_contexts[chat_id].items():
                doc_info = {
                    'id': doc_id,
                    'filename': doc_data['metadata'].get('filename', 'Unknown'),
                    'file_size': doc_data['metadata'].get('file_size', 0),
                    'token_count': doc_data['metadata'].get('token_count', 0),
                    'storage_type': 'context',
                    'created_at': doc_data['added_at'].isoformat(),
                }
                doc_list.append(doc_info)
            
            logger.info(f"[CHAT_HANDLER] Returning {len(doc_list)} documents for chat {chat_id}")
            return doc_list
            
        except Exception as e:
            logger.error(f"Failed to get document list: {e}")
            return []
    
    def clear_chat(self, chat_id: str) -> bool:
        """
        Remove all documents for a chat session
        
        Args:
            chat_id: Chat session ID
            
        Returns:
            True if successfully cleared
        """
        try:
            if chat_id in self.chat_contexts:
                doc_count = len(self.chat_contexts[chat_id])
                del self.chat_contexts[chat_id]
                logger.info(f"Cleared {doc_count} documents from chat {chat_id} context")
                return True
            return True
            
        except Exception as e:
            logger.error(f"Failed to clear chat {chat_id} context: {e}")
            return False
    
    def get_document_content(self, chat_id: str, doc_id: str) -> Optional[str]:
        """
        Get specific document content
        
        Args:
            chat_id: Chat session ID
            doc_id: Document ID
            
        Returns:
            Document content or None if not found
        """
        try:
            if chat_id in self.chat_contexts and doc_id in self.chat_contexts[chat_id]:
                return self.chat_contexts[chat_id][doc_id]['content']
            return None
            
        except Exception as e:
            logger.error(f"Failed to get document {doc_id} content from chat {chat_id}: {e}")
            return None
    
    def has_documents(self, chat_id: str) -> bool:
        """
        Check if chat has any documents in context
        
        Args:
            chat_id: Chat session ID
            
        Returns:
            True if chat has documents
        """
        return chat_id in self.chat_contexts and len(self.chat_contexts[chat_id]) > 0
    
    def get_context_size(self, chat_id: str) -> int:
        """
        Get total token count for chat context
        
        Args:
            chat_id: Chat session ID
            
        Returns:
            Total tokens in chat context
        """
        try:
            if chat_id not in self.chat_contexts:
                return 0
            
            total_tokens = 0
            for doc_data in self.chat_contexts[chat_id].values():
                total_tokens += doc_data['metadata'].get('token_count', 0)
            
            return total_tokens
            
        except Exception as e:
            logger.error(f"Failed to calculate context size for chat {chat_id}: {e}")
            return 0
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get handler statistics
        
        Returns:
            Statistics about current state
        """
        try:
            total_chats = len(self.chat_contexts)
            total_documents = sum(len(docs) for docs in self.chat_contexts.values())
            
            chat_stats = []
            for chat_id, documents in self.chat_contexts.items():
                chat_stat = {
                    'chat_id': chat_id,
                    'document_count': len(documents),
                    'total_tokens': sum(doc['metadata'].get('token_count', 0) for doc in documents.values())
                }
                chat_stats.append(chat_stat)
            
            return {
                'total_chats': total_chats,
                'total_documents': total_documents,
                'chat_stats': chat_stats
            }
            
        except Exception as e:
            logger.error(f"Failed to get handler stats: {e}")
            return {'error': str(e)}
