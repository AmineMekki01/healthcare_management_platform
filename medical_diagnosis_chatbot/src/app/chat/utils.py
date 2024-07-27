"""
This module contains utility functions for the chatbot application.
"""

import ast
from typing import Union
import pandas as pd
from docx import Document
import mammoth
from langchain.text_splitter import (
    RecursiveCharacterTextSplitter,
    HTMLHeaderTextSplitter,
)
import yaml
from src.app.chat.store import document_store
from src.app.chat.agents.retriever_tools import RetrievalTools
from src.app.core.logs import logger
from pathlib import Path
logger.info(f"document_store in utils: {len(document_store)}"	)
HEADING_1 = "heading 1"

def split_report(
    file_path : str, chunk_size: int = 5000
):
    """
    Split a report into chunks of text.
    
    Args:
        file_path (str): The path to the report file.
        chunk_size (int): The size of the chunks.
    
    Returns:
        list: A list of text chunks.
    """
    report_html = get_html_from_docx_s3(file_path)

    headers_to_split_on = [("h1", HEADING_1), ("table", "table")]

    html_splitter = HTMLHeaderTextSplitter(
        headers_to_split_on=headers_to_split_on,
        return_each_element=False,
    )

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size, chunk_overlap=0
    )

    docs = text_splitter.split_documents(html_splitter.split_text(report_html))
    return docs


def get_html_from_docx_s3(file_path : str) -> str:
    """
    Read a docx file from file_path (local) and return the html content
    
    Args:
        file_path (str): The path to the docx file.
    
    Returns:
        str: The html content.
    """
    with open(file_path, "rb") as docx_file:
        result = mammoth.convert_to_html(docx_file)

    res = (
        '<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body>'
        + result.value
        + "</body></html>"
    )
    return res


def initialize_retrieval_tools(source_docs: dict):
    """
    Initialize retrieval tools for a given source.  
    
    Args:
        source_docs: The source documents.
    
    Returns:
        RetrievalTools: The retrieval tools.
    """
    source = source_docs['source']
    collection_name = source_docs['collection_name']
    documents = source_docs['documents']
    retriever = RetrievalTools(docs=documents, source=source, collection_name=collection_name)
    retrieval_tools = retriever.create_tools(source_docs["documents_metadata"][0]["file_name"])
    return retrieval_tools


def get_source_name_from_document_store(document_store : dict = document_store):
    """
    Get source names from the document store.   
    
    Args:
        document_store (dict): The document store.

    Returns:
        list: The source names.
    """
    source_names = document_store.keys()
    return source_names


def get_source_name(word : str):
    """
    Get the source name from the document store based on a word.

    Args:
        word (str): The word.
    
    Returns:
        str: The source name.
    """
    source_names = get_source_name_from_document_store()
    logger.info(f"Source Names: {source_names}")
    for source_name in source_names:
        logger.info(f"source_name {source_name}")
        logger.info(f"word {word}")
        if word.lower() in source_name.lower():
            logger.info("gg")
            return source_name
    return None


def load_config(config_path: str):
    """
    Load a configuration file.
    
    Args:
        config_path (str): The path to the configuration file.
    
    Returns:
        dict: The configuration dictionary.
    """
    project_root = Path(__file__).parent.parent
    config_dict = yaml.safe_load(Path(project_root, config_path).read_text(encoding="utf-8"))
    return config_dict


def preprocess_data(data: Union[dict, list, tuple, str]) -> pd.DataFrame:
    """
    For Preprocessing data to be used for tools.
    
    Args:
        data: The input data in dictionary, list, tuple, or string format.
        
    Returns:
        pd.DataFrame: The preprocessed data.
    """
    if isinstance(data, str):
        data = ast.literal_eval(data)

    if isinstance(data, dict):
        df = pd.DataFrame(data)

    elif isinstance(data, list) and len(data) == 2:
        df = pd.DataFrame()
        df["x"] = data[0]
        df["y"] = data[1]

    elif isinstance(data, tuple) and len(data) == 2:
        df = pd.DataFrame()
        df["x"] = data[0]
        df["y"] = data[1]
    else:
        df = pd.DataFrame()

    return df