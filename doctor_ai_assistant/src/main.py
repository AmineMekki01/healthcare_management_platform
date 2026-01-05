from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import time

from src.config import settings
from src.chat.router import router as chat_router
from src.medical_records.router import router as medical_records_router
from src.chat.models import Chat, Message
from src.documents.models import ChatbotChatDocument
from src.database import create_tables

app = FastAPI(
    title="Healthcare RAG API",
    description="A comprehensive healthcare document management and RAG system",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)


@app.on_event("startup")
async def startup_event():
    """Create database tables on startup"""
    await create_tables()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if settings.environment == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1", "*.yourdomain.com"]
    )


@app.middleware("http")
async def add_process_time_header(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "chat_error",
            "message": str(exc),
            "error_code": getattr(exc, 'error_code', None)
        }
    )


app.include_router(chat_router)
app.include_router(medical_records_router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Healthcare RAG API",
        "version": "1.0.0",
        "status": "healthy",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "environment": settings.environment,
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
    )
