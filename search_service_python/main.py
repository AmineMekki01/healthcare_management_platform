from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api import router as search_router
from src import logger



app = FastAPI(title="Search Endpoints", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search_router)


logger.info("Search Service is ready!")
