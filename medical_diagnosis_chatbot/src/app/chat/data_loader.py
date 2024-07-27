"""
This module contains the DataLoader class which is responsible for extracting text from different file types (pdf, txt, docx), splitting the text into chunks, embedding the text and uploading the text to Qdrant.
"""

from typing import Dict
from docx import Document
from PyPDF2 import PdfReader
import openai
from langchain.text_splitter import RecursiveCharacterTextSplitter
from qdrant_client import QdrantClient
from qdrant_client.http.models import VectorParams, Distance

from src.app.chat.store import document_store
from src.app.core.logs import logger
from src.app.settings import settings
import uuid 
from src.app.chat.utils import split_report
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings


class DataLoader:
    """ 
    This class is responsible for extracting text from different file types (pdf, txt, docx), splitting the text into chunks, embedding the text and uploading the text to Qdrant.
    """
    def __init__(
        self, 
        persist_directory="./db/qdrant", 
        embeddings=None, 
        report_name="default", 
        db_client=None
        ):
        self.persist_directory = persist_directory
        self.report_name = report_name
        self.client = QdrantClient(host="localhost", port=6333) if not db_client else db_client
        openai.api_key = settings.OPENAI_API_KEY
        self.vector_dim = 384
        
    def extract_text_from_pdf_file(self, file_path: str):
        """
        Extract text from a PDF file.
        
        Args:
            file_path (str): The path to the PDF file.
            
        Returns:
            splitted_texts (list): A list of text chunks.
        """
        try:
            pdf = PdfReader(open(file_path, 'rb'))
            pdf_texts = [p.extract_text().strip() for p in pdf.pages]
            text = [text for text in pdf_texts if text]
            splitted_texts = self.split_docs(text)
            return splitted_texts
        except Exception as e:
            logger.info(f"An error occurred while reading PDF: {e}")
            return None
    
    def extract_text_from_txt_file(self, file_path : str):
        """
        Extract text from a TXT file.   
        
        Args:
            file_path (str): The path to the TXT file.
            
        Returns:
            splitted_texts (list): A list of text chunks.
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
                
            splitted_texts = self.split_docs(text)
            return splitted_texts
        
        except Exception as e:
            logger.info(f"An error occurred while reading TXT: {e}")
            return None
        
    def extract_text_from_docx(self, file_path : str):
        """
        Extract text from a DOCX file.
        
        Args:
            file_path (str): The path to the DOCX file.
            
        Returns:
            splitted_texts (list): A list of text chunks.
        """
        try:
            doc = Document(file_path)
            text = ''
            for para in doc.paragraphs:
                text += para.text + '\n'

            splitted_texts = self.split_docs(text)
            return splitted_texts
        except Exception as e:
            logger.info(f"An error occurred while reading DOCX: {e}")
            return None
    
    def extract_text_from_file(self, file_path: str):
        """
        Extract text from a file.
        
        Args:
            file_path (str): The path to the file.
            
        Returns:
            splitted_texts (list): A list of text chunks.
        """
        if file_path.endswith('.pdf'):
            return self.extract_text_from_pdf_file(file_path)
        elif file_path.endswith('.txt'):
            return self.extract_text_from_txt_file(file_path)
        elif file_path.endswith('.docx'):
            return self.extract_text_from_docx(file_path)
        else:
            logger.info(f"Unsupported file type: {file_path}")
            return None
    
    def split_docs(self, texts : list):
        """
        Split the text into chunks.
        
        Args:
            texts (list): A list of texts.
        
        Returns:
            character_split_texts (list): A list of text chunks.
        """
        character_splitter = RecursiveCharacterTextSplitter(
            separators=["\n\n", "\n", ". ", " ", ""], chunk_size=1000, chunk_overlap=0
        )
        character_split_texts = character_splitter.split_text("\n\n".join(texts))
        return character_split_texts
    
    def get_metadata(self, text: str, file_metadata : Dict, userId : str):
        """
        Get metadata for the text.  
        
        Args:
            text (str): The text.
            file_metadata (dict): The file metadata.
            userId (str): The user id.
            
        Returns:
            documents (list): A list of documents.
            metadata (list): A list of metadata.
            ids (list): A list of ids.
        """
        documents = []
        metadata = []
        ids = []
        
        for chunk in text:
            doc_id = str(uuid.uuid4())
            documents.append(chunk)
            metadata.append(
                {
                    "doc_id": doc_id,
                    "file_name": file_metadata["file_name"],
                    "file_size": file_metadata["file_size"],
                    "file_extension": file_metadata["file_extension"],
                    "file_type": file_metadata["file_type"],
                    "user_id": userId,
                }
            )
            ids.append(doc_id)
        return documents, metadata, ids
    
    def text_chunking_and_qdrant_upload(self, text : str, file_metadata : Dict, userId : str):
        """
        Split the text into chunks, get metadata for the text and upload the text to Qdrant.
        
        Args:
            text (str): The text.
            file_metadata (dict): The file metadata.
            userId (str): The user id.
        
        Returns:
            None
        """
        documents, metadata, ids = self.get_metadata(text, file_metadata, userId)
        self.populate_qdrant(documents, metadata, ids, userId)

    def create_collection(self, collection_name: str, vector_dim: int):
        """
        Create a collection in Qdrant.
        
        Args:
            collection_name (str): The collection name.
            vector_dim (int): The vector dimension.
            
        Returns:    
            None
        """
        vectors_config = VectorParams(
        size=vector_dim,
        distance=Distance.COSINE
    )
        self.client.recreate_collection(
            collection_name=collection_name,
            vectors_config=vectors_config,
        )
    
    
    def embed_text(self, text: str):
        """
        Embed text using FastEmbed and return the embedding.
        
        Args:
            text (str): The text.
            
        Returns:
            embeddings (np.array): The text embedding.
        """
        fast_embed = FastEmbedEmbeddings()
        return fast_embed.embed_query(text)
    
    def populate_qdrant(self, documents : list, metadata : list, ids : list, userId : str):
        """
        Populate Qdrant with the documents. 
        
        Args:
            documents (list): A list of documents.
            metadata (list): A list of metadata.
            ids (list): A list of ids.
            userId (str): The user id.
            
        Returns:
            None
        """
        self.create_collection(collection_name=userId, vector_dim=self.vector_dim)
        
        embeddings = [self.embed_text(doc) for doc in documents]

        for i, doc in enumerate(documents):
            metadata[i]['page_content'] = doc
        
        points = [{
            "id": doc_id,
            "vector": embedding,
            "payload": doc_metadata
        } for embedding, doc_metadata, doc_id in zip(embeddings, metadata, ids)]
        
    
        self.client.upsert(collection_name=userId, points=points)

        logger.info("Uploaded to Qdrant successfully")

    
    
    def ingest_report(self, file_path: str, user_id: str, file_metadata: Dict, source : str, collection_name: str = None):
        """
        Ingest a report.
    
        Args:
            file_path (str): The path to the file.
            user_id (str): The user id.
            file_metadata (dict): The file metadata.
            source (str): The source.
            collection_name (str): The collection name.
        
        Returns:
            documents (list): A list of documents.
        """
        documents = split_report(file_path, chunk_size = 5000)

        if collection_name is None:
            collection_name = user_id
        
        documents_text = [doc.page_content for doc in documents]
        documents_metadata = []
        documents_ids = []
        
        for doc_text in documents:
            doc_id = str(uuid.uuid4())
            documents_ids.append(doc_id)
            
            metadata = {
                "doc_id": doc_id,
                "user_id": user_id,
                "type": "protocol",
                "report_name": self.report_name,
                "file_name": file_metadata["file_name"],
                "file_size": file_metadata["file_size"],
                "file_extension": file_metadata["file_extension"],
                "file_type": file_metadata["file_type"],
            }
            
            documents_metadata.append(metadata)
            documents_ids.append(doc_id)
            
        self.populate_qdrant(documents=documents_text, metadata=documents_metadata, ids=documents_ids, userId=user_id)

        document_store[source] = {
            "source": source,
            "collection_name": user_id,
            "documents": documents,
            "documents_metadata": documents_metadata,
            "documents_ids": documents_ids,
            
        }
        logger.info("Document stored successfully.")
        return documents