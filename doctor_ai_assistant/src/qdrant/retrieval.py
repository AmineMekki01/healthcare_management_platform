from typing import List, Dict, Any, Optional, Tuple
from qdrant_client import models
from src.qdrant.client import qdrant_manager
from src.qdrant.collections import collection_manager
from src.qdrant.models import SearchQuery, SearchResult, ChunkMetadata, ChunkPayload
from src.shared.logs import logger
from src.config import settings
from langchain_openai import OpenAIEmbeddings


class QdrantRetrievalService:
    """
    Service for retrieving documents from multiple Qdrant collections with healthcare features.
    """
    
    def __init__(self):
        self.embedding_model = None
    
    def _get_embedding_model(self):
        """Lazy load embedding model."""
        if self.embedding_model is None:
            model_name = getattr(settings, 'EMBEDDING_MODEL', 'text-embedding-3-small')
            self.embedding_model = OpenAIEmbeddings(model=model_name)
        return self.embedding_model
    
    def generate_query_embedding(self, query_text: str) -> List[float]:
        """Generate embedding for search query.
        
        Args:
            query_text: The search query
            
        Returns:
            List of embedding values
        """
        try:
            model = self._get_embedding_model()
            embeddings = model.embed_query(query_text)
            return embeddings
        except Exception as e:
            logger.exception(f"Error generating query embedding: {e}")
            embedding_dim = getattr(settings, 'EMBEDDING_MODEL_DIM', 1536)
            return [0.0] * embedding_dim
    
    def build_search_filter(self, query: SearchQuery, skip_patient_filter: bool = False) -> Optional[models.Filter]:
        """
        Build Qdrant filter based on search query parameters.
        
        Args:
            query: Search query with filtering parameters
            skip_patient_filter: Whether to skip patient filtering
            
        Returns:
            Qdrant Filter object or None
        """
        conditions = []
        
        if query.patient_id and not skip_patient_filter:
            conditions.append(
                models.FieldCondition(
                    key="chunk_metadata.patient_id",
                    match=models.MatchValue(value=query.patient_id)
                )
            )
        
        if conditions:
            return models.Filter(must=conditions)
        
        return None
    
    async def search_collection(
        self,
        collection_name: str,
        query_embedding: List[float],
        search_filter: Optional[models.Filter],
        limit: int,
        score_threshold: float
    ) -> List[Tuple[float, Dict[str, Any]]]:
        """
        Search a single collection.
        
        Args:
            collection_name: Name of collection to search
            query_embedding: Query vector
            search_filter: Filter conditions
            limit: Maximum results
            score_threshold: Minimum score threshold
            
        Returns:
            List of (score, payload) tuples
        """
        try:
            client = qdrant_manager.client
            
            if not qdrant_manager.collection_exists(collection_name):
                logger.warning(f"Collection {collection_name} does not exist")
                return []
            
            search_result = client.search(
                collection_name=collection_name,
                query_vector=query_embedding,
                query_filter=search_filter,
                limit=limit,
                with_payload=True,
                with_vectors=False
            )
            
            results = []
            logger.debug(f"Raw search results in {collection_name}: {len(search_result)} hits")
            for hit in search_result:
                if hit.score >= score_threshold:
                    results.append((hit.score, hit.payload))
            
            logger.debug(f"Found {len(results)} results above threshold in collection {collection_name}")
            return results
            
        except Exception as e:
            logger.error(f"Error searching collection {collection_name}: {e}")
            return []
    
    async def search_multiple_collections(
        self,
        query: SearchQuery
    ) -> List[SearchResult]:
        """
        Search across multiple collections and fuse results.
        
        Args:
            query: Search query parameters
            
        Returns:
            List of fused and ranked search results
        """
        query_embedding = self.generate_query_embedding(query.query_text)
        
        try:
            await collection_manager.ensure_user_collections(query.patient_id or "default")
        except Exception as e:
            logger.exception(f"Error ensuring user collections: {e}")

        search_filter: Optional[models.Filter] = self.build_search_filter(query)
        logger.debug(f"Applied search filter: {search_filter}")

        collections_to_search: List[str] = []

        if query.patient_id:
            user_collections = collection_manager.get_user_collections(query.patient_id)
            collections_to_search.extend(user_collections.values())
            logger.debug(f"Found {len(user_collections)} collections for patient {query.patient_id}")

        seen = set()
        deduped = []
        for name in collections_to_search:
            if name not in seen:
                seen.add(name)
                deduped.append(name)
        collections_to_search = deduped
        logger.info(f"Searching collections: {collections_to_search}")

        search_tasks = []
        for collection_name in collections_to_search:
            task = self.search_collection(
                collection_name=collection_name,
                query_embedding=query_embedding,
                search_filter=search_filter,
                limit=query.limit,
                score_threshold=query.score_threshold
            )
            search_tasks.append((collection_name, task))
        
        logger.debug(f"Created {len(search_tasks)} search tasks")
        
        results_by_collection = {}
        for collection_name, task in search_tasks:
            try:
                results = await task
                if results:
                    results_by_collection[collection_name] = results
                    logger.info(f"Found {len(results)} results in collection {collection_name}")
                else:
                    logger.debug(f"No results found in collection {collection_name}")
            except Exception as e:
                logger.error(f"Error searching collection {collection_name}: {e}")

        all_results = []
        for collection_name, results in results_by_collection.items():
            for score, payload in results:
                all_results.append((score, payload, collection_name))
        
        fused_results = sorted(all_results, key=lambda x: x[0], reverse=True)[:query.limit]

        search_results = []
        for score, payload_data, source_collection in fused_results:
            try:
                chunk_metadata = payload_data.get('chunk_metadata', {})
                result = SearchResult(
                    score=score,
                    collection_name=source_collection,
                    point_id=chunk_metadata.get('chunk_id', 'unknown'),
                    content=payload_data.get('content', ''),
                    payload=ChunkPayload(
                        chunk_metadata=ChunkMetadata(**chunk_metadata),
                        content=payload_data.get('content', '')
                    )
                )
                
                search_results.append(result)
                
            except Exception as e:
                logger.exception(f"Error creating SearchResult: {e}")
                continue
        
        logger.info(f"Retrieved {len(search_results)} results for query: {query.query_text[:50]}...")
        if search_results:
            logger.info(f"First result score: {search_results[0].score}")
        return search_results
    
    def _find_source_collection(
        self, 
        payload_data: Dict[str, Any], 
        results_by_collection: Dict[str, List]
    ) -> str:
        """Find which collection a result came from.
        
        Args:
            payload_data: Payload data from Qdrant
            results_by_collection: Results by collection
            
        Returns:
            Source collection name
        """
        chunk_id = payload_data.get('chunk_id', '')
        
        for collection_name, results in results_by_collection.items():
            for _, result_payload in results:
                if result_payload.get('chunk_id') == chunk_id:
                    return collection_name
        
        return "unknown"

retrieval_service = QdrantRetrievalService()
