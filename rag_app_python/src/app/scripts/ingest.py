import os
from typing import Dict, List
from PyPDF2 import PdfReader
from qdrant_client import QdrantClient
from docx import Document
import tiktoken
import re
import uuid
from src.app.settings import settings
from src.app.core.logs import logger


def extract_text_from_pdf(file_path):
    try:
        pdf = PdfReader(open(file_path, 'rb'))
        text = ''
        num_pages = len(pdf.pages)
        for page_num in range(num_pages):
            text += pdf.pages[page_num].extract_text()
        return text
    except Exception as e:
        print(f"An error occurred while reading PDF: {e}")
        return None


def extract_text_from_txt(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"An error occurred while reading TXT: {e}")
        return None


def extract_text_from_docx(file_path):
    try:
        doc = Document(file_path)
        text = ''
        for para in doc.paragraphs:
            text += para.text + '\n'
        return text
    except Exception as e:
        print(f"An error occurred while reading DOCX: {e}")
        return None


def create_chunks(text: str, max_tokens: int = 500) -> list[str]:
    """
        Split the text into chunks of `max_tokens` length.

    params:
    -------
        text: str
            The text to be split into chunks.
        max_tokens: int
            The maximum number of tokens per chunk.
    returns:
    --------
        chunks: list[str]
            A list of chunks of text.
    """
    encoding = tiktoken.get_encoding("cl100k_base")
    sentences = re.split('(?<=[.!?]) +', text)
    chunks = []
    current_chunk = ""
    current_count = 0

    for sentence in sentences:
        tokens = encoding.encode(sentence)
        token_count = len(tokens)

        if current_count + token_count <= max_tokens:
            current_chunk += " " + sentence
            current_count += token_count
        else:
            chunks.append(current_chunk)
            current_chunk = sentence
            current_count = token_count

    chunks.append(current_chunk)
    return chunks


def extract_text_from_file(file_path: str) -> str:
    """
    Extract text from files of type PDF, TXT, and DOCX.

    params:
    -------
        file_path: str
            The path to the file.

    returns:    
    --------
        text: str
            The extracted text.
    """

    if file_path.endswith('.pdf'):
        return extract_text_from_pdf(file_path)
    elif file_path.endswith('.txt'):
        return extract_text_from_txt(file_path)
    elif file_path.endswith('.docx'):
        return extract_text_from_docx(file_path)
    else:
        return None


def extract_metadata(file_path: str) -> Dict[str, str]:
    """
    Extract all possible metadata from the file,
    such as file name, size, extension, etc.

    params: 
    -------
        file_path: str
            The path to the file.

    returns:    
    --------
        metadata: dict
            A dictionary containing all the metadata.   

    """
    try:
        return {
            "file_name": os.path.basename(file_path),
            "file_size": os.path.getsize(file_path),
            "file_extension": os.path.splitext(file_path)[1],
            "file_type": os.path.splitext(file_path)[1].replace(".", ""),
        }
    except Exception as e:
        print(f"An error occurred while extracting metadata: {e}")
        return {}


def populate_qdrant(client: QdrantClient, documents: List[str], metadata: List[Dict],  ids: List[str], userId: str):
    """
    Populate Qdrant with the provided documents and metadata.

    params:
    -------
        client: QdrantClient
            The Qdrant client.
        documents: list[str]
            A list of documents to be indexed.
        metadata: list[dict]
            A list of dictionaries containing the metadata for each document.
        ids: list[str]
            A list of ids for each document.
        userId: str
            The user id of the user who uploaded the file.

    """
    try:
        client.add(
            collection_name=userId,
            documents=documents,
            metadata=metadata,
            ids=ids,

        )
    except Exception as e:
        print(f"An error occurred while populating Qdrant: {e}")


def text_chunking_and_qdrant_upload(text: str, file_metadata: Dict, userId: str):
    """
    Chunk the text into smaller chunks and upload them to Qdrant.

    params: 
    -------
        text: str
            The text to be chunked.
        file_metadata: dict
            A dictionary containing the metadata of the file.
        userId: str
            The user id of the user who uploaded the file.

    """
    client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)

    logger.info(
        "Started Chunking text and extracting metadata from provided content.")

    documents = []
    metadata = []
    ids = []

    if text:
        chunks = create_chunks(text)

        for chunk in chunks:
            doc_id = str(uuid.uuid4())
            documents.append(chunk)
            metadata.append(
                {
                    "id": doc_id,
                    "chunk": chunk,
                    "chunk_length": len(chunk),
                    "file_name": file_metadata["file_name"],
                    "file_size": file_metadata["file_size"],
                    "file_extension": file_metadata["file_extension"],
                    "file_type": file_metadata["file_type"]
                }
            )
            ids.append(doc_id)
        logger.info(
            "Chunking text and extracting metadata from provided content was successful."
        )

    else:
        logger.info("No text was provided.")

    if documents and metadata and ids:
        logger.info("Started populating Qdrant..")
        populate_qdrant(client, documents, metadata, ids, userId)
        logger.info("Qdrant was populated.")
    else:
        logger.info("No documents, metadata, or ids were provided.")
