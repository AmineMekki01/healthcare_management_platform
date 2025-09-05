import uuid
from typing import Dict, Any, Optional, List
from fastapi import UploadFile
from src.documents.document_processor import DocumentProcessor
from src.documents.context_decision_engine import ContextFitDecisionEngine, StorageType
from src.documents.chat_document_handler import ChatDocumentHandler
from src.documents.qdrant_document_service import QdrantDocumentService
from src.documents.models import ChatbotChatDocument
from src.shared.logs import logger
from sqlalchemy.ext.asyncio import AsyncSession


class DocumentService:
    """
    Orchestrates document upload, processing, storage, and retrieval with intelligent routing
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.processor = DocumentProcessor()
        self.decision_engine = ContextFitDecisionEngine()
        self.chat_handler = ChatDocumentHandler()
        self.qdrant_service = QdrantDocumentService()
    
    async def upload_document(
        self,
        chat_id: str,
        user_id: str,
        file: UploadFile,
        model_name: str
    ) -> Dict[str, Any]:
        """
        Complete document upload workflow with intelligent storage routing
        
        Args:
            chat_id: Chat session ID
            user_id: User ID
            file: Uploaded file
            model_name: Target model for context fitting
            
        Returns:
            Upload result with storage decision and metadata
        """
        try:
            logger.info(f"[DOC_UPLOAD] start chat_id={chat_id} user_id={user_id} filename={file.filename} content_type={file.content_type}")
            
            doc_id = str(uuid.uuid4())
            
            file_content = await file.read()
            
            doc_metadata = await self.processor.process_document(
                file_content=file_content,
                filename=file.filename,
                mime_type=file.content_type
            )
            
            current_context_size = self.chat_handler.get_context_size(chat_id)
            
            storage_decision = self.decision_engine.decide_storage_strategy(
                token_count=doc_metadata['token_count'],
                model_name=model_name,
                chat_context_size=current_context_size
            )
            
            logger.info(f"[DOC_UPLOAD] storage_decision: {storage_decision['storage_type'].value} token_count={doc_metadata['token_count']}")
            success = await self._execute_storage_strategy(
                doc_id=doc_id,
                chat_id=chat_id,
                user_id=user_id,
                doc_metadata=doc_metadata,
                storage_decision=storage_decision
            )
            logger.info(f"[DOC_UPLOAD] storage_execution success={success}")
            
            if success:
                await self._save_document_record(
                    doc_id=doc_id,
                    chat_id=chat_id,
                    user_id=user_id,
                    metadata=doc_metadata,
                    storage_decision=storage_decision
                )
                
                return {
                    "success": True,
                    "document_id": doc_id,
                    "filename": file.filename,
                    "file_size": self._format_file_size(len(file_content)),
                    "token_count": doc_metadata['token_count'],
                    "storage_type": storage_decision['storage_type'].value,
                    "ttl_days": storage_decision.get('ttl_days'),
                    "processing_status": "completed",
                    "recommendation": self.decision_engine.recommend_action(storage_decision)
                }
            else:
                logger.error(f"Document upload failed for {file.filename}: Failed to store document")
                raise Exception("Failed to store document")
                
        except Exception as e:
            logger.error(f"Document upload failed for {file.filename}: {e}")
            return {
                "success": False,
                "error": str(e),
                "filename": file.filename,
                "processing_status": "failed"
            }
    
    async def delete_document(
        self,
        chat_id: str,
        doc_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Delete document from all storage locations and update agent context
        
        Args:
            chat_id: Chat session ID
            doc_id: Document ID to delete
            user_id: User ID
            
        Returns:
            Deletion result
        """
        try:
            doc_record = await self._get_document_record(doc_id, chat_id, user_id)
            
            if not doc_record:
                return {
                    "success": False,
                    "error": "Document not found",
                    "document_id": doc_id
                }
            
            storage_type = StorageType(doc_record.storage_type)
            success = False
            
            if storage_type == StorageType.CONTEXT:
                success = self.chat_handler.remove_document(chat_id, doc_id)
                
            elif storage_type == StorageType.TEMPORARY:
                collection_name = f"chat_temp_{chat_id}"
                success = await self.qdrant_service.delete_document(collection_name, doc_id)
                
            elif storage_type == StorageType.PERSISTENT:
                collection_name = f"user_docs_{user_id}"
                success = await self.qdrant_service.delete_document(collection_name, doc_id)
            
            if success:
                await self._delete_document_record(doc_id)
                
                return {
                    "success": True,
                    "message": "Document removed successfully",
                    "document_id": doc_id,
                    "storage_type": storage_type.value
                }
            else:
                return {
                    "success": False,
                    "error": "Failed to remove document from storage",
                    "document_id": doc_id
                }
                
        except Exception as e:
            logger.error(f"Document deletion failed for {doc_id}: {e}")
            return {
                "success": False,
                "error": str(e),
                "document_id": doc_id
            }
    
    async def get_chat_documents(self, chat_id: str, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all documents associated with a chat
        
        Args:
            chat_id: Chat session ID
            user_id: User ID
            
        Returns:
            List of document metadata
        """
        try:            
            db_docs = await self._get_chat_document_records(chat_id, user_id)
            await self._ensure_context_documents_loaded(chat_id, user_id, db_docs)
            context_docs = self.chat_handler.get_document_list(chat_id)
            logger.info(f"[GET_DOCS] context_docs count={len(context_docs)}")
            return db_docs
            
        except Exception as e:
            logger.exception(f"[GET_DOCS] exception chat_id={chat_id} user_id={user_id} error={e}")
            return []
    
    async def _execute_storage_strategy(
        self,
        doc_id: str,
        chat_id: str,
        user_id: str,
        doc_metadata: Dict[str, Any],
        storage_decision: Dict[str, Any]
    ) -> bool:
        """Execute storage based on decision engine recommendation"""
        try:
            storage_type = storage_decision['storage_type']
            extracted_text = doc_metadata['extracted_text']
            
            if storage_type == StorageType.CONTEXT:
                return self.chat_handler.add_document(
                    chat_id=chat_id,
                    doc_id=doc_id,
                    content=extracted_text,
                    metadata=doc_metadata
                )
                
            elif storage_type == StorageType.TEMPORARY:
                collection_name = f"chat_temp_{chat_id}"
                chunks = self.processor.chunk_text(
                    extracted_text, 
                    chunk_size=storage_decision['chunk_size']
                )
                
                return await self.qdrant_service.store_document_chunks(
                    collection_name=collection_name,
                    doc_id=doc_id,
                    chunks=chunks,
                    metadata=doc_metadata,
                    ttl_days=storage_decision['ttl_days']
                )
                
            elif storage_type == StorageType.PERSISTENT:
                collection_name = f"user_docs_{user_id}"
                chunks = self.processor.chunk_text(
                    extracted_text,
                    chunk_size=storage_decision['chunk_size']
                )
                
                return await self.qdrant_service.store_document_chunks(
                    collection_name=collection_name,
                    doc_id=doc_id,
                    chunks=chunks,
                    metadata=doc_metadata,
                    ttl_days=storage_decision['ttl_days']
                )
            
            return False
            
        except Exception as e:
            logger.error(f"Storage execution failed: {e}")
            return False
    
    async def _save_document_record(
        self,
        doc_id: str,
        chat_id: str,
        user_id: str,
        metadata: Dict[str, Any],
        storage_decision: Dict[str, Any]
    ):
        """Save document record to database"""
        try:
            document = ChatbotChatDocument(
                id=uuid.UUID(doc_id),
                chat_id=uuid.UUID(chat_id),
                user_id=uuid.UUID(user_id),
                filename=metadata['filename'],
                file_size=metadata['file_size'],
                mime_type=metadata['mime_type'],
                token_count=metadata['token_count'],
                storage_type=storage_decision['storage_type'].value,
                ttl_days=storage_decision.get('ttl_days')
            )
            
            self.db.add(document)
            await self.db.commit()
            
        except Exception as e:
            logger.error(f"Failed to save document record: {e}")
            await self.db.rollback()
            raise
    
    async def _get_document_record(self, doc_id: str, chat_id: str, user_id: str) -> Optional[ChatbotChatDocument]:
        """Get document record from database"""
        try:
            from sqlalchemy import select
            
            stmt = select(ChatbotChatDocument).where(
                ChatbotChatDocument.id == uuid.UUID(doc_id),
                ChatbotChatDocument.chat_id == uuid.UUID(chat_id),
                ChatbotChatDocument.user_id == uuid.UUID(user_id)
            )
            
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
            
        except Exception as e:
            logger.error(f"Failed to get document record: {e}")
            return None
    
    async def _delete_document_record(self, doc_id: str):
        """Delete document record from database"""
        try:
            from sqlalchemy import select
            
            stmt = select(ChatbotChatDocument).where(ChatbotChatDocument.id == uuid.UUID(doc_id))
            result = await self.db.execute(stmt)
            document = result.scalar_one_or_none()
            
            if document:
                await self.db.delete(document)
                await self.db.commit()
                
        except Exception as e:
            logger.error(f"Failed to delete document record: {e}")
            await self.db.rollback()
            raise
    
    async def _get_chat_document_records(self, chat_id: str, user_id: str) -> List[Dict[str, Any]]:
        """Get document records for a chat from database"""
        try:
            from sqlalchemy import select
            
            stmt = select(ChatbotChatDocument).where(
                ChatbotChatDocument.chat_id == uuid.UUID(chat_id),
                ChatbotChatDocument.user_id == uuid.UUID(user_id)
            )
            
            result = await self.db.execute(stmt)
            documents = result.scalars().all()
            
            doc_list = []
            for doc in documents:
                doc_info = {
                    'id': str(doc.id),
                    'filename': doc.filename,
                    'file_size': doc.file_size,
                    'token_count': doc.token_count,
                    'storage_type': doc.storage_type,
                    'created_at': doc.created_at.isoformat() if doc.created_at else None,
                    'ttl_days': doc.ttl_days
                }
                doc_list.append(doc_info)
            
            return doc_list
            
        except Exception as e:
            logger.exception(f"[GET_DB_DOCS] exception chat_id={chat_id} user_id={user_id} error={e}")
            return []
    
    def _format_file_size(self, bytes_size: int) -> str:
        """Format file size in human readable format"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if bytes_size < 1024:
                return f"{bytes_size:.1f} {unit}"
            bytes_size /= 1024
        return f"{bytes_size:.1f} TB"
    
    async def _ensure_context_documents_loaded(self, chat_id: str, user_id: str, db_docs: List[Dict[str, Any]]) -> None:
        """Reload context documents from database if they're missing from memory after restart"""
        try:
            context_docs_in_db = [doc for doc in db_docs if doc.get('storage_type') == 'context']
            
            if not context_docs_in_db:
                return
                
            memory_docs = self.chat_handler.get_document_list(chat_id)
            memory_doc_ids = {doc.get('id') for doc in memory_docs}
            
            for doc_info in context_docs_in_db:
                doc_id = doc_info.get('id')
                if doc_id not in memory_doc_ids:
                    self.chat_handler.add_document(
                        chat_id=chat_id,
                        doc_id=doc_id,
                        content=f"[Document: {doc_info.get('filename')} - Content lost on restart]",
                        metadata=doc_info
                    )
                    
        except Exception as e:
            logger.exception(f"[RELOAD_CONTEXT] failed to reload context docs: {e}")