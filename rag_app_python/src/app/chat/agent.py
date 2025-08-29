import re
from typing import Dict, Any, Optional
from agents import Agent, Runner
from agents.extensions.memory.sqlalchemy_session import SQLAlchemySession
from openai import OpenAI
from sqlalchemy.ext.asyncio import create_async_engine
from src.app.chat.tools import get_patient_basic_info, get_patient_appointments, get_patient_medical_history, get_patient_medications, get_appointments_report_content
from src.app.chat.models import BaseMessage
from src.app.settings import settings
from src.app.core.logs import logger
from src.app.db import get_async_database_url


class TbibiAgent:
    """
    Tbibi Agent that handles both general queries and patient-specific queries
    """
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        self.engine = create_async_engine(get_async_database_url())
        
        self.general_agent = Agent(
            name="General Healthcare Assistant",
            instructions="""
            You are a healthcare AI assistant that helps doctors and medical professionals with general healthcare questions, medical knowledge, and clinical guidance.
            
            Your role is to provide:
            - Medical knowledge and clinical information
            - Healthcare best practices and guidelines
            - General medical advice and recommendations
            - Clinical decision support
            - Medical terminology explanations
            - Treatment options and considerations
            
            You should maintain conversation context and provide comprehensive, professional responses suitable for medical professionals.
            
            IMPORTANT: You do NOT have access to specific patient data tools. If a doctor needs specific patient information, they should mention the patient explicitly (e.g., @patient_name) to access patient-specific data.
            
            Present information in a clear, organized manner suitable for medical professionals.
            """,
            tools=[],
            model="gpt-5-mini"
        )
        
        self.patient_agent = Agent(
            name="Patient Data Assistant",
            instructions="""
            You are a healthcare AI assistant that helps doctors and medical professionals access and analyze patient data.
            
            IMPORTANT: When asked for patient information, ALWAYS retrieve ALL available data automatically without asking for permission or offering to fetch more details. Use all relevant tools to gather:
            - Basic patient information
            - ALL appointments (not just recent ones)
            - Complete medical history
            - ALL medications
            - ALL appointment reports that exist
            
            Your approach should be:
            1. Immediately use all available tools to gather comprehensive data
            2. Present the complete information in an organized format
            3. Do NOT ask if the user wants more details - provide everything upfront
            4. Do NOT suggest fetching additional information - fetch it automatically
            
            When you detect that appointment reports exist (has_report = true), immediately retrieve those reports using get_appointments_report_content without asking.
            
            Present information in a clear, organized manner suitable for medical professionals, but avoid conversational suggestions or offers to retrieve more data.
            
            Remember: Be comprehensive and proactive, not conversational or suggestive.
            """,
            tools=[
                get_patient_basic_info,
                get_patient_appointments,
                get_patient_medical_history,
                get_patient_medications,
                get_appointments_report_content
            ],
            model="gpt-5-mini"
        )
    
    def _extract_patient_from_query(self, query: str, doctor_id: str) -> Optional[str]:
        """
        Extract patient information from the query text.
        Looks for patterns like @patient_name or explicit patient mentions.
        
        Args:
            query: The user's query
            doctor_id: The doctor's ID for patient search context
            
        Returns:
            Patient ID if found, None otherwise
        """
        mention_pattern = r'@(\w+(?:\s+\w+)*)'
        mentions = re.findall(mention_pattern, query)
        
        if mentions:
            return None
        
        patient_keywords = [
            r'patient\s+(\w+(?:\s+\w+)*)',
            r'for\s+(\w+(?:\s+\w+)*)\s+patient',
            r'about\s+(\w+(?:\s+\w+)*)\s*[\'"]?s?\s+(?:condition|health|medical|history)'
        ]
        
        for pattern in patient_keywords:
            matches = re.findall(pattern, query, re.IGNORECASE)
            if matches:
                return None
        
        return None
    
    async def process_query(self, input_message: BaseMessage) -> str:
        """
        Process a query using the appropriate method based on content analysis.
        
        Args:
            input_message: The input message containing the user's query
            
        Returns:
            The agent's response
        """
        try:
            query = input_message.user_message
            doctor_id = input_message.user_id
            explicit_patient_id = getattr(input_message, 'patient_id', None)
            
            # Determine if this is a patient-specific query
            detected_patient_id = None
            if not explicit_patient_id:
                detected_patient_id = self._extract_patient_from_query(query, doctor_id)
            
            patient_id = explicit_patient_id or detected_patient_id
            
            if patient_id:
                return await self._process_patient_query(query, patient_id, doctor_id, input_message.chat_id)
            else:
                return await self._process_general_query(input_message)
                
        except Exception as e:
            return f"I encountered an error while processing your request: {str(e)}. Please try again or contact support if the issue persists."
    
    async def _process_patient_query(self, query: str, patient_id: str, doctor_id: str, chat_id: str) -> str:
        """Process patient-specific queries using the agent with tools"""
        try:
            enhanced_query = self._enhance_query_with_context(query, patient_id, doctor_id)
            
            session = SQLAlchemySession(
                f"conversation_{chat_id}",
                engine=self.engine,
                create_tables=True
            )

            result = await Runner.run(self.patient_agent, enhanced_query, session=session)
            
            return result.final_output
            
        except Exception as e:
            logger.error(f"Exception type: {type(e).__name__}")
            logger.error(f"Exception args: {e.args}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return f"I encountered an error while accessing patient data: {str(e)}. Please try again."
    
    async def _process_general_query(self, input_message: BaseMessage) -> str:
        """Process general healthcare queries using the patient agent without tools for context continuity"""
        try:
            query = input_message.user_message
            
            session = SQLAlchemySession(
                f"conversation_{input_message.chat_id}",
                engine=self.engine,
                create_tables=True
            )

            enhanced_query = f"""
            This is a general healthcare query (no specific patient mentioned).
            Please provide a helpful response based on general medical knowledge and any conversation context.
            Do NOT use any patient-specific tools unless explicitly needed.
            
            Query: {query}
            """

            result = await Runner.run(self.patient_agent, enhanced_query, session=session)
            
            return result.final_output
            
        except Exception as e:
            logger.error(f"Error in general query processing: {e}")
            return f"I encountered an error while processing your general query: {str(e)}. Please try again."
    
    def _enhance_query_with_context(self, query: str, patient_id: Optional[str] = None, doctor_id: Optional[str] = None) -> str:
        """Enhance the user query with available context"""
        enhanced_parts = [query]
        
        if patient_id:
            enhanced_parts.append(f"Patient ID: {patient_id}")
        
        if doctor_id:
            enhanced_parts.append(f"Doctor ID: {doctor_id}")
        
        return "\n".join(enhanced_parts)


tbibi_agent = TbibiAgent()
