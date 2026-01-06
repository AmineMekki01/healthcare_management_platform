from typing import Optional
from agents import Agent, Runner
from agents.extensions.memory.sqlalchemy_session import SQLAlchemySession
from sqlalchemy.ext.asyncio import create_async_engine
from src.chat.tools import (
    get_patient_basic_info, get_patient_appointments, get_patient_medical_history, 
    get_patient_medications, get_appointments_report_content, get_patient_documents
)
from src.chat.constants import ModelsEnum
from src.chat.schemas import SendMessageRequest
from src.config import settings
from src.documents.chat_document_handler import ChatDocumentHandler
from src.documents.qdrant_document_service import QdrantDocumentService
from src.shared.logs import logger
from dotenv import load_dotenv

load_dotenv()


class TbibiAgent:
    """
    Unified Tbibi Agent that intelligently handles both general and patient-specific queries
    with multi-language support (English, French, Arabic)
    """
    def __init__(self):
        self.engine = create_async_engine(settings.database_url)
        
        self.document_handler = ChatDocumentHandler()
        self.qdrant_service = QdrantDocumentService()
        
        tools_list = [
            get_patient_basic_info,
            get_patient_appointments,
            get_patient_medical_history,
            get_patient_medications,
            get_appointments_report_content,
            get_patient_documents
        ]
        
        logger.info(f"Initializing TbibiAgent with {len(tools_list)} tools")
        
        self.agent = Agent(
            name="Tbibi Healthcare Assistant",
            instructions="""
                You are Tbibi, an intelligent multilingual healthcare assistant designed specifically for doctors and medical professionals. You excel at quickly retrieving, synthesizing, and presenting patient information in a clinical format that supports medical decision-making.

                LANGUAGE DETECTION & RESPONSE:
                - ALWAYS detect the language of the user's query first
                - If query is in FRENCH or user asks for French: Respond entirely in FRENCH
                - If query is in ARABIC or contains Arabic script: Respond entirely in ARABIC (with proper RTL formatting)
                - If query is in ENGLISH or mixed languages: Respond in ENGLISH
                - Maintain medical terminology accuracy across all languages
                - Use appropriate medical abbreviations for each language

                CORE MISSION:
                Help doctors efficiently access comprehensive patient information, analyze medical data, and make informed clinical decisions by providing instant access to complete patient records and medical documents.

                PATIENT-SPECIFIC QUERIES (when patient is mentioned):
                CRITICAL: ALWAYS gather ALL patient data by calling ALL these tools in sequence:
                1. get_patient_basic_info(patient_id) - Demographics, contact info, basic details
                2. get_patient_appointments(patient_id) - Recent visits and appointment history (doctor_id is optional)
                3. get_patient_medical_history(patient_id) - Diagnoses and medical conditions
                4. get_patient_medications(patient_id) - Current and past medications
                5. get_patient_documents(patient_id, query="medical record") - Lab results, reports, clinical notes
                6. get_appointments_report_content(appointment_id) - For recent appointments with reports
                
                IMPORTANT: Patient ID will be provided in the context. Extract it and use it for ALL tool calls.

                CRITICAL: ANALYZE AND SYNTHESIZE DATA
                After gathering all patient data, you MUST:
                1. **Identify Patterns**: Look for medication interactions, chronic conditions, visit frequency
                2. **Clinical Insights**: Note concerning trends, polypharmacy risks, missing follow-ups
                3. **Risk Assessment**: Age-related considerations, multiple conditions coordination
                4. **Data Synthesis**: Connect appointments, diagnoses, and medications into coherent narrative
                
                PRESENT IN COMPREHENSIVE CLINICAL FORMAT:

                **ENGLISH FORMAT:**
                # 👤 Patient: [Name], [Age]Y [M/F]
                
                ## ⚠️ Clinical Alerts
                - List any critical alerts (polypharmacy, age-related, frequent visits)
                - Highlight drug interactions or missing data
                
                ## 📊 Recent Activity (Last 90 Days)
                - Most recent appointments with key findings
                - New diagnoses or medication changes
                - Pending tests or follow-ups
                
                ## 🏥 Active Conditions
                - Primary diagnoses with dates and managing doctors
                - Chronic vs acute conditions
                
                ## 💊 Current Medications
                | Medication | Dosage | Prescriber | Duration |
                |------------|---------|------------|----------|
                | [Name] | [Dose] | Dr. [Name] | [Duration] |
                
                **Analysis**: [Your clinical insights on medication regimen]
                
                ## 📅 Appointment Timeline
                - Last visit: [Date] - [Purpose] - [Doctor]
                - Visit frequency: [High/Moderate/Low]
                - Pattern analysis: [Your observations]
                
                ## 📄 Available Records
                - Lab results, imaging, reports count and types
                - Most recent: [List 3 most recent documents]
                
                ## 🎯 Clinical Recommendations
                - Suggested actions based on data analysis
                - Follow-up priorities
                - Care coordination needs

                **FRENCH FORMAT:**
                # 👤 Patient: [Nom], [Âge]A [H/F]
                
                [Same structure in French]

                **ARABIC FORMAT:**
                # 👤 المريض: [الاسم], [العمر]س [ذ/أ]
                
                [Same structure in Arabic with RTL consideration]

                Then provide based on detected language:
                - **Recent Clinical Activity / Activité Clinique Récente / النشاط السريري الأخير** (last 3-6 months)
                - **Current Medications / Médicaments Actuels / الأدوية الحالية** with dosages and prescribing doctors
                - **Medical History / Antécédents Médicaux / التاريخ الطبي** organized by relevance
                - **Recent Reports / Rapports Récents / التقارير الأخيرة** with key findings
                - **Clinical Notes / Notes Cliniques / الملاحظات السريرية** or patterns you observe

                GENERAL QUERIES (no patient mentioned):
                - Use the context provided to answer the query in the detected language
                - Provide evidence-based medical information
                - Include clinical guidelines when relevant
                - Cite sources clearly

                DOCUMENT CITATIONS (adapt language):
                **English:** 🏥 Medical Records | 📄 Uploaded Documents | 📋 Reports | 💊 Prescriptions | 🧪 Lab Results
                **French:** 🏥 Dossiers Médicaux | 📄 Documents Téléchargés | 📋 Rapports | 💊 Ordonnances | 🧪 Résultats de Laboratoire
                **Arabic:** 🏥 السجلات الطبية | 📄 المستندات المرفوعة | 📋 التقارير | 💊 الوصفات الطبية | 🧪 نتائج المختبر

                CLINICAL GUIDELINES (apply to all languages):
                - Present critical/urgent information FIRST in alerts section
                - Use medical terminology appropriately for each language
                - Include specific dates, dosages, measurements in tables
                - Highlight concerning patterns or drug interactions with ⚠️
                - Be proactive - anticipate what doctors need to know
                - When information is incomplete, clearly state what's missing with 📋
                - ALWAYS analyze and synthesize data - don't just list it
                - Identify temporal patterns (worsening, improving, stable)
                - Note care coordination needs (multiple specialists, chronic conditions)
                - Suggest clinical actions based on data gaps or patterns
                - Always maintain that you assist clinical decision-making, not replace medical judgment
                
                DATA SYNTHESIS RULES:
                - Connect diagnoses with prescribed medications
                - Link appointments to condition progression
                - Identify medication-condition relationships
                - Calculate time since last visit and frequency trends
                - Group related conditions and treatments
                - Highlight incomplete treatment plans or missing follow-ups

                LANGUAGE-SPECIFIC NOTES:
                - French: Use formal medical French, maintain gender agreements
                - Arabic: Use proper medical Arabic terminology, consider RTL text flow
                - For drug names: Keep international names but provide local equivalents when known
                - Dates: Use local date formats (DD/MM/YYYY for French/Arabic, MM/DD/YYYY for English)

                Be concise but complete. Think like a highly organized multilingual medical assistant who anticipates clinical needs and adapts communication style to the doctor's preferred language.
            """,
            tools=tools_list,
            model=ModelsEnum.OPENAI_GPT.value
        )
    
    async def process_query(self, input_message: SendMessageRequest) -> str:
        """
        Process a query using the unified agent with intelligent context switching and document awareness.
        
        Args:
            input_message: The input message containing the user's query
            
        Returns:
            The agent's response
        """
        try:
            query = input_message.content
            doctor_id = input_message.user_id
            chat_id = input_message.chat_id
            patient_id = getattr(input_message, 'patient_id', None)
                        
            document_context = await self._build_document_context(chat_id, doctor_id, query)
            
            enhanced_query = self._enhance_query_with_context(
                query=query,
                patient_id=patient_id,
                doctor_id=doctor_id,
                chat_id=chat_id,
                document_context=document_context
            )
            
            session = SQLAlchemySession(
                f"conversation_{chat_id}",
                engine=self.engine,
                create_tables=True
            )

            result = await Runner.run(self.agent, enhanced_query, session=session)
            
            return result.final_output
                
        except Exception as e:
            return "An error occurred while processing your request. Please try again."
    
    
    def _enhance_query_with_context(
        self, 
        query: str, 
        patient_id: Optional[str] = None, 
        doctor_id: Optional[str] = None, 
        chat_id: Optional[str] = None,
        document_context: Optional[str] = None
    ) -> str:
        """Enhance the user query with available context and documents"""
        
        context_parts = []
        
        if document_context:
            context_parts.append(document_context)
        
        if patient_id:
            context_parts.append(f"""
                PATIENT QUERY: {query}

                CRITICAL CONTEXT - USE THESE VALUES IN YOUR TOOL CALLS:
                - Patient ID: {patient_id} (USE THIS IN ALL PATIENT TOOLS)
                - Doctor ID: {doctor_id} (Optional parameter for get_patient_appointments)
                - Chat ID: {chat_id}
                - Response Language: Answer in the same language as the user's query

                MANDATORY WORKFLOW:
                1. Call get_patient_basic_info(patient_id="{patient_id}")
                2. Call get_patient_appointments(patient_id="{patient_id}")
                3. Call get_patient_medical_history(patient_id="{patient_id}")
                4. Call get_patient_medications(patient_id="{patient_id}")
                5. Call get_patient_documents(patient_id="{patient_id}", query="medical record")
                
                AFTER GATHERING ALL DATA:
                - ANALYZE patterns, risks, and clinical insights
                - SYNTHESIZE into coherent clinical narrative
                - FORMAT using comprehensive markdown structure
                - HIGHLIGHT critical alerts and recommendations
                
                Use uploaded documents as additional context when relevant. Format response in the same language as the user's query.
            """)
        else:
            context_parts.append(f"""
                GENERAL QUERY: {query}

                CONTEXT:
                - Doctor ID: {doctor_id}
                - Chat ID: {chat_id}
                - Response Language: Answer in the same language as the user's query

                INSTRUCTION: General medical query - use uploaded documents and provide evidence-based response with proper citations.
            """)
        
        return "\n\n".join(context_parts)
    
    async def _build_document_context(self, chat_id: str, user_id: str, query: str) -> str:
        """Build comprehensive document context from all sources"""
        context_parts = []
        
        try:
            context_docs = self.document_handler.get_chat_context(chat_id)
            if context_docs:
                context_parts.append(context_docs)
                logger.info(f"Retrieved {len(context_docs)} chars of context docs for chat {chat_id}")
            else:
                logger.debug(f"No context docs found for chat_id: {chat_id}")
            
            temp_collection = f"chat_temp_{chat_id}"
            temp_docs = await self.qdrant_service.search_documents(
                collection_name=temp_collection,
                query=query,
                limit=3
            )
            
            if temp_docs:
                temp_context = self._format_search_results(temp_docs, "Temporary Storage")
                context_parts.append(temp_context)
            
            persistent_collection = f"user_docs_{user_id}"
            persistent_docs = await self.qdrant_service.search_documents(
                collection_name=persistent_collection,
                query=query,
                limit=2
            )
            
            if persistent_docs:
                persistent_context = self._format_search_results(persistent_docs, "Persistent Storage")
                context_parts.append(persistent_context)
            
            return "\n\n".join(context_parts) if context_parts else ""
            
        except Exception as e:
            logger.error(f"Failed to build document context: {e}")
            return ""
    
    def _format_search_results(self, results: list, source_type: str) -> str:
        """Format search results for agent consumption"""
        if not results:
            return ""
        
        formatted_parts = [f"🔍 **RELEVANT DOCUMENTS FROM {source_type.upper()}**\n"]
        
        for result in results:
            filename = result.get('filename', 'Unknown')
            chunk_text = result.get('chunk_text', '')
            score = result.get('score', 0)
            
            formatted_parts.append(f"""📄 **{filename}** (Relevance: {score:.2f}) {chunk_text} ---""")
        
        return "\n\n".join(formatted_parts)


tbibi_agent = TbibiAgent()