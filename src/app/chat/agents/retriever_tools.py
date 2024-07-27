"""
This module contains classes for creating retrieval tools adapted for use with a Qdrant client,
"""

import langchain
import re
from langchain.tools.retriever import create_retriever_tool
from qdrant_client.http.models import Filter, FieldCondition, MatchValue
from qdrant_client import QdrantClient

from src.app.core.logs import logger
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings

class Document:
    """ 
    This class represents a document with page content and metadata.
    """
    def __init__(self, page_content, metadata):
        self.page_content = page_content
        self.metadata = metadata

       
class QdrantRetriever:
    """
    This class creates a retriever tool adapted for use with a Qdrant client,
    """
    def __init__(self, client, collection_name, filtering_criteria):
        self.client = client
        self.collection_name = collection_name
        self.filtering_criteria = filtering_criteria


    def get_query_vector_embedding(self, query : str):
        """
        Get the query vector embedding.
        
        Args:
            query (str): The query text.    
            
        Returns:
            embeddings (np.array): The query vector embedding.
        """
        embeddings = FastEmbedEmbeddings()
        return embeddings.embed_query(query)


    def get_relevant_documents(self, query_text : str):
        """
        Get relevant documents based on a query text and filtering criteria.
        
        Args:
            query_text (str): The query text.
        
        Returns:
            documents (list): A list of documents.
        """
        query_vector = self.get_query_vector_embedding(query_text)        
        qdrant_filter = Filter(must=[
            FieldCondition(
                key=k,
                match=MatchValue(value=v),
            )
            for k,v in self.filtering_criteria.items() if v is not None   
            ]
        )
        search_results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            query_filter=qdrant_filter,
            limit=20,
            with_payload=True,
            with_vectors=True,
        )
        documents = [self.extract_page_content_from_scored_point(scored_point) for scored_point in search_results]

        return documents
    
    def extract_page_content_from_scored_point(self, scored_point : dict):
        """
        Extract page content from a scored point.
        
        Args:   
            scored_point: A scored point.
            
        Returns:
            Document: A document object.
        """
        metadata = scored_point.payload
        page_content = metadata.get("page_content", "")
        return Document(page_content, metadata)

class RetrievalTools:
    """
    This class creates retrieval tools adapted for use with a Qdrant client, 
    intended to be used within the LangChain framework.
    """

    def __init__(self, docs: list, source: str, collection_name : str, db_client=None):
        """
        Initialize with documents, source, and an   optional Qdrant client.
        """
        self.client = QdrantClient(host="localhost", port=6333) if not db_client else db_client
        self.docs = docs
        self.source = source
        self.collection_name = collection_name
        logger.info("Retrieval Tools Initialized")

    def create_filters(self):
        """
        Create filtering criteria based on document metadata.
        """
        metadatas = [doc.metadata for doc in self.docs if hasattr(doc, 'metadata') and doc.metadata]
        self.filtering_criteria = [
            {k: v for k, v in metadata}
            for metadata in set(frozenset(metadata.items()) for metadata in metadatas)
        ] + [{}]

    def create_tool_for_criteria(self, filtering_criteria, report_name=""):
        """
        Creates a retrieval tool for a given filtering criteria.
        
        Args:
            filtering_criteria: The filtering criteria.
            report_name: The report name.
            
        Returns:
            tool: The retrieval tool.
        """

        if "heading 1" in filtering_criteria:
            filter_value = filtering_criteria["heading 1"]
            section_name = filter_value.lower().strip()
            function_name = "_".join(["search"] + [x for x in re.split("[^A-Za-z0-9]", section_name) if x not in ("", " ")])[:64]
        else:
            function_name = "_".join(["search"] + self.source.split(" "))
        qdrant_retriever = QdrantRetriever(self.client, self.collection_name, filtering_criteria)
        
        return create_retriever_tool(
            retriever=qdrant_retriever,
            name=function_name,
            description=f"Use this tool when searching for documents related to {report_name}"
        )

    def create_tools(self, report_name: str = "") -> list:
        """
        Create a list of retrieval tools based on filtering criteria and source.
       
        Args:
            report_name: The report name.
            
        Returns:
            tools: A list of retrieval tools.
        """
        logger.info("Creating Retrieval Tools")
        self.create_filters()
        self.tools = []

        for filtering_criteria in self.filtering_criteria:
            tool = self.create_tool_for_criteria(filtering_criteria, report_name)
            self.tools.append(tool)
     
        if self.tools:
            logger.info("Retrieval Tools Created successfully")
        return self.tools
