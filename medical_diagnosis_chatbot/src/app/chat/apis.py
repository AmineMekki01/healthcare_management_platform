"""
This module contains the API endpoints for the chatbot.
"""

from fastapi import APIRouter, HTTPException
from src.app.chat.workflow import agent_workflow

router = APIRouter(tags=["Chat Endpoints"])


@router.get("/v1/expert-answer")
async def expert_answer():
    return agent_workflow()