from typing import Dict, Any, Literal
from enum import Enum
from dataclasses import dataclass
from src.shared.logs import logger

class StorageType(Enum):
    CONTEXT = "context"
    TEMPORARY = "temporary"
    PERSISTENT = "persistent"

@dataclass
class ModelConfig:
    context_window: int
    small_doc_threshold: int
    medium_doc_threshold: int
    large_doc_threshold: int

class ContextFitDecisionEngine:
    """
    Intelligent decision engine for document storage routing based on size and model capabilities
    """
    
    def __init__(self):
        self.model_configs = {
            "gpt-4o-mini": ModelConfig(
                context_window=128_000,
                small_doc_threshold=4_000,
                medium_doc_threshold=20_000,
                large_doc_threshold=50_000
            ),
            "gpt-5-nano": ModelConfig(
                context_window=400_000,
                small_doc_threshold=10_000,
                medium_doc_threshold=50_000,
                large_doc_threshold=100_000
            )
        }
        
        self.default_config = ModelConfig(
            context_window=128_000,
            small_doc_threshold=4_000,
            medium_doc_threshold=20_000,
            large_doc_threshold=50_000
        )
    
    def decide_storage_strategy(
        self, 
        token_count: int, 
        model_name: str,
        chat_context_size: int = 0
    ) -> Dict[str, Any]:
        """
        Decide storage strategy based on document size and model capabilities
        
        Args:
            token_count: Number of tokens in the document
            model_name: Target model name
            chat_context_size: Current chat context size in tokens
            
        Returns:
            Dictionary with storage decision and metadata
        """
        try:
            config = self.model_configs.get(model_name, self.default_config)
            
            available_context = config.context_window - chat_context_size - 2000
            
            storage_type, ttl_days, reasoning = self._make_storage_decision(
                token_count, config, available_context
            )
            
            decision = {
                "storage_type": storage_type,
                "ttl_days": ttl_days,
                "token_count": token_count,
                "model_name": model_name,
                "available_context": available_context,
                "reasoning": reasoning,
                "requires_chunking": token_count > config.small_doc_threshold,
                "chunk_size": self._calculate_chunk_size(token_count, storage_type),
                "estimated_chunks": self._estimate_chunk_count(token_count, storage_type)
            }
            
            logger.info(f"Storage decision for {token_count} tokens: {storage_type.value} ({reasoning})")
            
            return decision
            
        except Exception as e:
            logger.error(f"Storage decision failed: {e}")
            return {
                "storage_type": StorageType.TEMPORARY,
                "ttl_days": 7,
                "token_count": token_count,
                "model_name": model_name,
                "reasoning": f"Fallback due to error: {str(e)}",
                "requires_chunking": True,
                "chunk_size": 1000,
                "estimated_chunks": max(1, token_count // 1000)
            }
    
    def _make_storage_decision(
        self, 
        token_count: int, 
        config: ModelConfig, 
        available_context: int
    ) -> tuple[StorageType, int, str]:
        """Make storage decision based on token count and available context"""
        
        if token_count <= config.small_doc_threshold and token_count <= available_context:
            return (
                StorageType.CONTEXT, 
                0,
                f"Small document ({token_count} tokens) fits in context"
            )
        
        elif token_count <= config.medium_doc_threshold:
            return (
                StorageType.TEMPORARY,
                7,
                f"Medium document ({token_count} tokens) stored temporarily"
            )
        
        elif token_count <= config.large_doc_threshold:
            return (
                StorageType.PERSISTENT,
                30,
                f"Large document ({token_count} tokens) stored persistently"
            )
        
        else:
            return (
                StorageType.PERSISTENT,
                30,
                f"Very large document ({token_count} tokens) may need special handling"
            )
    
    def _calculate_chunk_size(self, token_count: int, storage_type: StorageType) -> int:
        """Calculate optimal chunk size based on document size and storage type"""
        if storage_type == StorageType.CONTEXT:
            return token_count
        elif storage_type == StorageType.TEMPORARY:
            return min(1000, token_count // 3)
        else:
            return min(1500, token_count // 5)
    
    def _estimate_chunk_count(self, token_count: int, storage_type: StorageType) -> int:
        """Estimate number of chunks that will be created"""
        if storage_type == StorageType.CONTEXT:
            return 1
        
        chunk_size = self._calculate_chunk_size(token_count, storage_type)
        return max(1, (token_count + chunk_size - 1) // chunk_size)
    
    def can_fit_in_context(
        self, 
        token_count: int, 
        model_name: str,
        current_context_size: int = 0
    ) -> bool:
        """Check if document can fit in model context"""
        config = self.model_configs.get(model_name, self.default_config)
        available_space = config.context_window - current_context_size - 2000
        return token_count <= available_space and token_count <= config.small_doc_threshold
    
    def get_model_limits(self, model_name: str) -> Dict[str, int]:
        """Get model configuration limits"""
        config = self.model_configs.get(model_name, self.default_config)
        return {
            "context_window": config.context_window,
            "small_doc_threshold": config.small_doc_threshold,
            "medium_doc_threshold": config.medium_doc_threshold,
            "large_doc_threshold": config.large_doc_threshold
        }
    
    def recommend_action(self, decision: Dict[str, Any]) -> str:
        """Provide user-friendly recommendation based on storage decision"""
        storage_type = decision["storage_type"]
        token_count = decision["token_count"]
        
        if storage_type == StorageType.CONTEXT:
            return f"Document will be included directly in chat context ({token_count:,} tokens)"
        elif storage_type == StorageType.TEMPORARY:
            return f"Document will be stored temporarily for 7 days ({token_count:,} tokens, ~{decision['estimated_chunks']} chunks)"
        else:
            return f"Document will be stored persistently for 30 days ({token_count:,} tokens, ~{decision['estimated_chunks']} chunks)"
