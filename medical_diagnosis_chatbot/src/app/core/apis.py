"""
This module contains the core API endpoints for the application.
"""

import os
from fastapi import APIRouter, UploadFile, File, Form
from fastapi import HTTPException

from src.app.core.logs import logger

from starlette import status
from starlette.requests import Request
from qdrant_client import QdrantClient

from src.app.chat.data_loader import DataLoader
from src.app.settings import settings
from typing import List

client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)
router = APIRouter(tags=['Core Endpoints'])


@router.get('/healthCheck', status_code=status.HTTP_200_OK)
async def healthCheck(request: Request) -> dict:
    return {
        'Version': request.app.version
    }

@router.post("/v1/upload-document")
async def upload_document(files: List[UploadFile] = File(...)):
    userId = "91f171ce-6abc-4e2c-887a-23ece3104d54" # JUST FOR TESTING.
   
    for file in files:        
        contents = await file.read()
        file_location = os.path.join("data", file.filename)
        os.makedirs(os.path.dirname(file_location), exist_ok=True)

        with open(file_location, "wb") as f:
            f.write(contents)

        file_metadata = {
            "file_name": file.filename,
            "file_size": os.path.getsize(file_location),
            "file_extension": file.filename.split(".")[-1],
            "file_type": file.filename.split(".")[-1].replace(".", ""),
        }
        
        data_loader = DataLoader()
        source = file.filename.split(".")[0] if "." in file.filename else file.filename
        
        documents = data_loader.ingest_report(
            file_path = file_location, 
            user_id = userId,
            file_metadata = file_metadata,
            source = source
        )
        
    return documents
 

@router.get("/v1/documents")
async def read_documents():
    return {"documents": "List of documents"}


@router.get("/")
async def root():
    return {"message": "Hello World"}
