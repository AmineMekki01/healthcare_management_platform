import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from qdrant_client import QdrantClient, models
from qdrant_client.http.models import Filter, FieldCondition, MatchValue, FilterSelector
import openai
from src.config import settings
from src.shared.logs import logger
from fastembed import SparseTextEmbedding

class QdrantDocumentService:
    """
    Manages document storage and retrieval in Qdrant with TTL support and removal capabilities
    """
    
    def __init__(self):
        try:
            logger.info(f"Initializing Qdrant client - host={settings.qdrant_host}, port={settings.qdrant_port}")
            self.client = QdrantClient(
                host=settings.qdrant_host,
                port=settings.qdrant_port
            )
            self.openai_client = openai.OpenAI(api_key=settings.openai_api_key)
            self.embedding_model = "text-embedding-3-small"
            self.vector_size = 1536
            self.sparse_model = None
            logger.info(f"Qdrant client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Qdrant client: {e}")
            self.client = None
            self.openai_client = openai.OpenAI(api_key=settings.openai_api_key)
            self.embedding_model = "text-embedding-3-small"
            self.vector_size = 1536
            self.sparse_model = None
    
    def _get_sparse_model(self):
        """Lazy load BM25 sparse embedding model."""
        if self.sparse_model is None:
            self.sparse_model = SparseTextEmbedding(model_name="Qdrant/bm25")
        return self.sparse_model
    
    def generate_sparse_vector(self, text: str) -> models.SparseVector:
        """Generate BM25 sparse vector using FastEmbed."""
        try:
            sparse_model = self._get_sparse_model()
            embeddings = list(sparse_model.embed([text]))
            if embeddings:
                sparse_embedding = embeddings[0]
                return models.SparseVector(
                    indices=sparse_embedding.indices.tolist(),
                    values=sparse_embedding.values.tolist()
                )
            else:
                logger.error("FastEmbed BM25 returned no embeddings")
                return models.SparseVector(indices=[], values=[])
        except Exception as e:
            logger.exception(f"Error generating BM25 sparse vector: {e}")
            return models.SparseVector(indices=[], values=[])
    
    async def store_document_chunks(
        self,
        collection_name: str,
        doc_id: str,
        chunks: List[str],
        metadata: Dict[str, Any],
        ttl_days: Optional[int] = None
    ) -> bool:
        """
        Store document chunks in Qdrant collection with optional TTL
        
        Args:
            collection_name: Qdrant collection name
            doc_id: Unique document ID
            chunks: List of text chunks
            metadata: Document metadata
            ttl_days: TTL in days (None for no expiration)
            
        Returns:
            True if successfully stored
        """
        try:
            await self._ensure_collection_exists(collection_name)
            
            embeddings = await self._generate_embeddings(chunks)
            
            expires_at = None
            if ttl_days:
                expires_at = (datetime.now(timezone.utc) + timedelta(days=ttl_days)).isoformat()
            
            points = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                point_id = str(uuid.uuid4())
                
                payload = {
                    "document_id": doc_id,
                    "chunk_index": i,
                    "chunk_text": chunk,
                    "filename": metadata.get("filename", ""),
                    "mime_type": metadata.get("mime_type", ""),
                    "file_size": metadata.get("file_size", 0),
                    "token_count": metadata.get("token_count", 0),
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "expires_at": expires_at
                }
                
                sparse_vector = self.generate_sparse_vector(chunk)
                
                point = models.PointStruct(
                    id=point_id,
                    vector={
                        "dense": embedding,
                        "sparse": sparse_vector
                    },
                    payload=payload
                )
                points.append(point)
            
            operation_info = self.client.upsert(
                collection_name=collection_name,
                points=points
            )
            
            if operation_info.status == models.UpdateStatus.COMPLETED:
                logger.info(f"Stored {len(chunks)} chunks for document {doc_id} in {collection_name}")
                return True
            else:
                logger.error(f"Error storing document chunks: {operation_info}")
                return False
                
        except Exception as e:
            logger.error(f"Error storing document chunks: {e}")
            return False
    
    async def search_documents(
        self,
        collection_name: str,
        query: str,
        limit: int = 5,
        doc_id_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for relevant document chunks
        
        Args:
            collection_name: Qdrant collection name
            query: Search query
            limit: Maximum results to return
            doc_id_filter: Optional document ID to filter by
            
        Returns:
            List of relevant chunks with metadata
        """
        try:
            if not await self._collection_exists(collection_name):
                logger.warning(f"Collection {collection_name} does not exist")
                return []
            
            query_embedding = await self._generate_embeddings([query])
            if not query_embedding:
                return []
            
            filter_conditions = [
                FieldCondition(
                    key="expires_at",
                    match=MatchValue(value=None)
                )
            ]
            
            current_time = datetime.now(timezone.utc).isoformat()
            
            if doc_id_filter:
                filter_conditions.append(
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(value=doc_id_filter)
                    )
                )
            
            search_results = self.client.search(
                collection_name=collection_name,
                query_vector=query_embedding[0],
                limit=limit,
                query_filter=Filter(must=filter_conditions) if filter_conditions else None
            )
            
            results = []
            for result in search_results:
                chunk_data = {
                    "chunk_text": result.payload.get("chunk_text", ""),
                    "document_id": result.payload.get("document_id", ""),
                    "filename": result.payload.get("filename", ""),
                    "chunk_index": result.payload.get("chunk_index", 0),
                    "score": result.score,
                    "created_at": result.payload.get("created_at", "")
                }
                results.append(chunk_data)
            
            logger.info(f"Found {len(results)} relevant chunks in {collection_name}")
            return results
            
        except Exception as e:
            logger.error(f"Error searching documents in {collection_name}: {e}")
            return []
    
    async def delete_document(self, collection_name: str, doc_id: str) -> bool:
        """
        Delete all chunks for a specific document
        
        Args:
            collection_name: Qdrant collection name
            doc_id: Document ID to delete
            
        Returns:
            True if successfully deleted
        """
        try:
            if not await self._collection_exists(collection_name):
                logger.warning(f"Collection {collection_name} does not exist")
                return False
            
            operation_info = self.client.delete(
                collection_name=collection_name,
                points_selector=FilterSelector(
                    filter=Filter(
                        must=[
                            FieldCondition(
                                key="document_id",
                                match=MatchValue(value=doc_id)
                            )
                        ]
                    )
                )
            )
            
            if operation_info.status == models.UpdateStatus.COMPLETED:
                logger.info(f"Deleted document {doc_id} from {collection_name}")
                return True
            else:
                logger.error(f"Error deleting document {doc_id} from {collection_name}: {operation_info}")
                return False
                
        except Exception as e:
            logger.error(f"Error deleting document {doc_id} from {collection_name}: {e}")
            return False
    
    async def delete_collection(self, collection_name: str) -> bool:
        """
        Delete entire collection (for chat cleanup)
        
        Args:
            collection_name: Collection name to delete
            
        Returns:
            True if successfully deleted
        """
        try:
            if await self._collection_exists(collection_name):
                self.client.delete_collection(collection_name)
                logger.info(f"Deleted collection {collection_name}")
                return True
            return True
            
        except Exception as e:
            logger.error(f"Error deleting collection {collection_name}: {e}")
            return False
    
    async def cleanup_expired_documents(self, collection_name: str) -> int:
        """
        Remove expired documents from collection
        
        Args:
            collection_name: Collection to clean up
            
        Returns:
            Number of documents cleaned up
        """
        try:
            if not await self._collection_exists(collection_name):
                return 0
            
            current_time = datetime.now(timezone.utc).isoformat()
            
            operation_info = self.client.delete(
                collection_name=collection_name,
                points_selector=FilterSelector(
                    filter=Filter(
                        must=[
                            FieldCondition(
                                key="expires_at",
                                range={
                                    "lt": current_time
                                }
                            )
                        ]
                    )
                )
            )
            
            logger.info(f"Cleaned up expired documents from {collection_name}")
            return 1
            
        except Exception as e:
            logger.error(f"Error cleaning up expired documents: {e}")
            return 0
    
    async def get_document_info(self, collection_name: str, doc_id: str) -> Optional[Dict[str, Any]]:
        """
        Get document information
        
        Args:
            collection_name: Collection name
            doc_id: Document ID
            
        Returns:
            Document metadata or None if not found
        """
        try:
            if not await self._collection_exists(collection_name):
                return None
            
            search_results = self.client.scroll(
                collection_name=collection_name,
                scroll_filter=Filter(
                    must=[
                        FieldCondition(
                            key="document_id",
                            match=MatchValue(value=doc_id)
                        )
                    ]
                ),
                limit=1
            )
            
            if search_results[0]:
                payload = search_results[0][0].payload
                return {
                    "document_id": doc_id,
                    "filename": payload.get("filename", ""),
                    "file_size": payload.get("file_size", 0),
                    "token_count": payload.get("token_count", 0),
                    "created_at": payload.get("created_at", ""),
                    "expires_at": payload.get("expires_at")
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting document info for {doc_id}: {e}")
            return None
    
    async def _ensure_collection_exists(self, collection_name: str):
        """Ensure Qdrant collection exists with hybrid search configuration"""
        try:
            if not await self._collection_exists(collection_name):
                self.client.create_collection(
                    collection_name=collection_name,
                    vectors_config={
                        "dense": models.VectorParams(
                            size=self.vector_size,
                            distance=models.Distance.COSINE
                        )
                    },
                    sparse_vectors_config={
                        "sparse": models.SparseVectorParams(
                            index=models.SparseIndexParams()
                        )
                    }
                )
                logger.info(f"Created hybrid Qdrant collection: {collection_name}")
        except Exception as e:
            logger.error(f"Error ensuring collection exists for {collection_name}: {e}")
            raise
    
    async def _collection_exists(self, collection_name: str) -> bool:
        """Check if collection exists"""
        try:
            collections = self.client.get_collections()
            return any(col.name == collection_name for col in collections.collections)
        except Exception as e:
            logger.error(f"Error checking collection existence for {collection_name}: {e}")
            return False
    
    async def _generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for text chunks"""
        try:
            response = self.openai_client.embeddings.create(
                model=self.embedding_model,
                input=texts
            )
            
            return [embedding.embedding for embedding in response.data]
            
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            return []
