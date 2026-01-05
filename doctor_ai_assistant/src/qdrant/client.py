from typing import Optional, List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, CollectionStatus, SparseVectorParams, SparseIndexParams
from src.config import settings
from src.shared.logs import logger

class QdrantManager:
    """
    Manages Qdrant client connections and provides high-level operations
    for healthcare document collections.
    """
    
    def __init__(self):
        self._client: Optional[QdrantClient] = None
        self._embedding_dim = getattr(settings, 'EMBEDDING_MODEL_DIM', 1536)
    
    @property
    def client(self) -> QdrantClient:
        """Get or create Qdrant client instance."""
        if self._client is None:
            try:
                logger.info(f"Initializing Qdrant client - host={settings.qdrant_host}, port={settings.qdrant_port}")
                self._client = QdrantClient(
                    host=settings.qdrant_host,
                    port=settings.qdrant_port,
                    timeout=30
                )
                logger.info(f"Qdrant client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Qdrant client: {e}")
                self._client = None
        return self._client
    
    async def health_check(self) -> bool:
        """Check if Qdrant server is healthy and accessible."""
        try:
            collections = self.client.get_collections()
            logger.info(f"Qdrant health check passed. Found {len(collections.collections)} collections.")
            return True
        except Exception as e:
            logger.error(f"Qdrant health check failed: {e}")
            return False
    
    def get_collection_name(self, collection_type: str, identifier: str) -> str:
        """
        Generate standardized collection names.
        
        Args:
            collection_type: Type of collection ('user_records', 'user_uploads', 'session_ephemeral')
            identifier: User ID for user collections, session ID for ephemeral
            
        Returns:
            Formatted collection name
        """
        if collection_type == "user_records":
            return f"user_{identifier}_records"
        elif collection_type == "user_uploads":
            return f"user_{identifier}_uploads"
        elif collection_type == "session_ephemeral":
            return f"session_{identifier}_ephemeral"
        else:
            raise ValueError(f"Unknown collection type: {collection_type}")
    
    def collection_exists(self, collection_name: str) -> bool:
        """Check if a collection exists."""
        try:
            return self.client.collection_exists(collection_name)
        except Exception as e:
            logger.error(f"Error checking collection existence for {collection_name}: {e}")
            return False
    
    def create_collection(
        self, 
        collection_name: str, 
        ttl_seconds: Optional[int] = None
    ) -> bool:
        """
        Create a new collection with hybrid search support (dense + sparse vectors).
        
        Args:
            collection_name: Name of the collection to create
            ttl_seconds: TTL for ephemeral collections (None for persistent)
            
        Returns:
            True if created successfully, False otherwise
        """
        try:
            if self.collection_exists(collection_name):
                logger.info(f"Collection {collection_name} already exists")
                return True
            
            vectors_config = {
                "dense": VectorParams(
                    size=self._embedding_dim,
                    distance=Distance.COSINE
                )
            }
            
            sparse_vectors_config = {
                "sparse": SparseVectorParams(
                    index=SparseIndexParams()
                )
            }
            
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=vectors_config,
                sparse_vectors_config=sparse_vectors_config
            )
            
            if ttl_seconds:
                logger.info(f"Hybrid collection {collection_name} created with TTL tracking")
            else:
                logger.info(f"Persistent hybrid collection {collection_name} created (dense + sparse)")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to create collection {collection_name}: {e}")
            return False
    
    def delete_collection(self, collection_name: str) -> bool:
        """Delete a collection."""
        try:
            if not self.collection_exists(collection_name):
                logger.info(f"Collection {collection_name} does not exist")
                return True
            
            self.client.delete_collection(collection_name)
            logger.info(f"Collection {collection_name} deleted")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete collection {collection_name}: {e}")
            return False


qdrant_manager = QdrantManager()