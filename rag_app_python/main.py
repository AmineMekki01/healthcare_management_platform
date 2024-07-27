from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.app.core.logs import logger

from src.app.chat.api import router as chat_router
from src.app.core.api import router as core_router

from src.app import version

app = FastAPI(version=version)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(core_router)
app.include_router(chat_router)

logger.info("App is ready!")
