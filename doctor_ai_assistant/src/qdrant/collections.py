from typing import Dict
from enum import Enum
from src.qdrant.client import qdrant_manager
from src.shared.logs import logger

class CollectionType(Enum):
    """Types of collections in the healthcare system."""
    USER_RECORDS = "user_records"
    USER_UPLOADS = "user_uploads"
    SESSION_EPHEMERAL = "session_ephemeral"


class CollectionManager:
    """
    Manages healthcare-specific collection operations and lifecycle.
    """
    
    def __init__(self):
        self.manager = qdrant_manager
    
    async def ensure_user_collections(self, user_id: str) -> Dict[str, bool]:
        """
        Ensure that all required collections exist for a user.
        
        Args:
            user_id: The user ID
            
        Returns:
            Dict mapping collection types to creation success status
        """
        results = {}
        
        records_collection = self.manager.get_collection_name("user_records", user_id)
        results["records"] = self.manager.create_collection(records_collection)
        
        uploads_collection = self.manager.get_collection_name("user_uploads", user_id)
        results["uploads"] = self.manager.create_collection(uploads_collection)
        
        logger.info(f"User collections ensured for user {user_id}: {results}")
        return results

    def get_user_collections(self, user_id: str) -> Dict[str, str]:
        """
        Get all collection names for a user.
        
        Args:
            user_id: The user ID
            
        Returns:
            Dict mapping collection types to collection names
        """
        return {
            "records": self.manager.get_collection_name("user_records", user_id),
            "uploads": self.manager.get_collection_name("user_uploads", user_id)
        }
collection_manager = CollectionManager()
