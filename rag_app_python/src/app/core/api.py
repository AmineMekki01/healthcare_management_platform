import os
import uuid

from fastapi import APIRouter, UploadFile, File, Form
from fastapi import HTTPException

from src.app.core.logs import logger

from starlette import status
from starlette.requests import Request
from qdrant_client import QdrantClient

from src.app.scripts.ingest import extract_text_from_file
from src.app.settings import settings
from src.app.scripts.ingest import text_chunking_and_qdrant_upload
from typing import List
from src.app.db import messages_queries

client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)
router = APIRouter(tags=['Core Endpoints'])


@router.get('/healthCheck', status_code=status.HTTP_200_OK)
async def healthCheck(request: Request) -> dict:
    return {
        'Version': request.app.version
    }


@router.post("/v1/upload-document")
async def upload_document(files: List[UploadFile] = File(...), user_id: str = Form(...), chat_id: str = Form(...)):
    file_names = []
    save_directory = "data"
    print(f"currentChatId : {chat_id}")
    # Ensure the directory exists
    if not os.path.exists(save_directory):
        os.makedirs(save_directory)   
    for file in files:        
        contents = await file.read()
        print(file)
        file_location = f"data/{file.filename}"
        with open(file_location, "wb") as f:
            f.write(contents)

        file_size = os.path.getsize(file_location)
        file_metadata = {
            "file_name": file.filename,
            "file_size": file_size,
            "file_type": file.filename.split(".")[-1].replace(".", ""),
            "chat_id" : chat_id,
            "user_id" : user_id
        }
        file_names.append(file.filename)
        text = extract_text_from_file(file_location)

        if text is None:
            logger.error(
                f"File upload failed for {file.filename}, unsupported file type or content could not be extracted.")

            raise HTTPException(
                status_code=422, detail="Unsupported file type or content could not be extracted.")

        text_chunking_and_qdrant_upload(text, file_metadata)

        file_id = uuid.uuid4()
        messages_queries.insert_file(
            id=str(file_id),
            chat_id=str(chat_id),
            user_id=user_id,
            file_name=str(file.filename),
            file_size=str(file_size),
            file_type=str(file.filename.split(".")[-1]),
        )
    return {'files_names': file_names}


@router.get("/v1/documents")
async def read_documents():
    return {"documents": "List of documents"}


@router.get("/")
async def root():
    return {"message": "Hello World"}
