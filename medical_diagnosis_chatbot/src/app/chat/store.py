"""
This module contains the document store for the chatbot. The document store is a simple in-memory key-value store that stores the documents that the id used to generate tools for agents.
"""
from src.app.core.logs import logger

document_store = {}
