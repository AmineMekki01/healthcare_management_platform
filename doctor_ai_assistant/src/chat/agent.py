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
import re
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
                AUTOMATICALLY gather ALL patient data by using these tools in sequence:
                1. get_patient_basic_info() - Demographics, contact info, basic details
                2. get_patient_appointments() - Recent visits and appointment history  
                3. get_patient_medical_history() - Diagnoses and medical conditions
                4. get_patient_medications() - Current and past medications
                5. get_patient_documents() - Lab results, reports, clinical notes
                6. get_appointments_report_content() - For appointments with reports

                PRESENT IN CLINICAL FORMAT:

                **ENGLISH FORMAT:**
                👤 **[Patient Name], [Age]Y [M/F]**
                📍 **Primary Conditions:** [Active diagnoses]
                💊 **Current Medications:** [Active prescriptions] 
                📅 **Last Seen:** [Most recent appointment]
                ⚠️ **Alerts:** [Important notes, allergies, critical info]

                **FRENCH FORMAT:**
                👤 **[Nom du Patient], [Âge]A [H/F]**
                📍 **Conditions Principales:** [Diagnostics actifs]
                💊 **Médicaments Actuels:** [Prescriptions actives] 
                📅 **Dernière Consultation:** [Dernier rendez-vous]
                ⚠️ **Alertes:** [Notes importantes, allergies, infos critiques]

                **ARABIC FORMAT:**
                👤 **[اسم المريض], [العمر]س [ذ/أ]**
                📍 **الحالات الأساسية:** [التشخيصات النشطة]
                💊 **الأدوية الحالية:** [الوصفات النشطة] 
                📅 **آخر زيارة:** [آخر موعد]
                ⚠️ **تنبيهات:** [ملاحظات مهمة، حساسية، معلومات حرجة]

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
                - Present critical/urgent information FIRST
                - Use medical terminology appropriately for each language
                - Include specific dates, dosages, measurements
                - Highlight concerning patterns or drug interactions
                - Be proactive - anticipate what doctors need to know
                - When information is incomplete, clearly state what's missing
                - Always maintain that you assist clinical decision-making, not replace medical judgment

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
    
    def _detect_language(self, text: str) -> str:
        """
        Detect the language of the input text
        Returns: 'arabic', 'french', or 'english'
        """
        # Check for Arabic characters
        arabic_pattern = re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]')
        if arabic_pattern.search(text):
            return 'arabic'
        
        # French indicators (common French words and phrases)
        french_indicators = [
            'bonjour', 'bonsoir', 'merci', 'patient', 'médecin', 'docteur', 
            'traitement', 'médicament', 'ordonnance', 'consultation', 'dossier',
            'antécédents', 'diagnostic', 'symptômes', 'analyses', 'résultats',
            'rendez-vous', 'hospitalisation', 'chirurgie', 'thérapie',
            # French medical terms
            'hypertension', 'diabète', 'cardiovasculaire', 'respiratoire',
            'neurologique', 'dermatologique', 'gynécologique', 'pédiatrique'
        ]
        
        text_lower = text.lower()
        french_matches = sum(1 for indicator in french_indicators if indicator in text_lower)
        
        # If we find multiple French indicators, it's likely French
        if french_matches >= 2:
            return 'french'
        
        # Check for explicit language requests
        if any(phrase in text_lower for phrase in ['en français', 'in french', 'réponds en français']):
            return 'french'
        
        if any(phrase in text_lower for phrase in ['بالعربية', 'in arabic', 'باللغة العربية']):
            return 'arabic'
        
        # Default to English
        return 'english'
    
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
            
            # Detect language
            detected_language = self._detect_language(query)
            
            document_context = await self._build_document_context(chat_id, doctor_id, query)
            
            enhanced_query = self._enhance_query_with_context(
                query=query,
                patient_id=patient_id,
                doctor_id=doctor_id,
                chat_id=chat_id,
                document_context=document_context,
                detected_language=detected_language
            )
            
            session = SQLAlchemySession(
                f"conversation_{chat_id}",
                engine=self.engine,
                create_tables=True
            )

            result = await Runner.run(self.agent, enhanced_query, session=session)
            
            return result.final_output
                
        except Exception as e:
            # Return error message in detected language
            error_messages = {
                'english': f"I encountered an error while processing your request: {str(e)}. Please try again or contact support if the issue persists.",
                'french': f"J'ai rencontré une erreur lors du traitement de votre demande: {str(e)}. Veuillez réessayer ou contacter le support si le problème persiste.",
                'arabic': f"واجهت خطأ أثناء معالجة طلبك: {str(e)}. يرجى المحاولة مرة أخرى أو الاتصال بالدعم إذا استمرت المشكلة."
            }
            
            detected_language = self._detect_language(input_message.content)
            return error_messages.get(detected_language, error_messages['english'])
    
    
    def _enhance_query_with_context(
        self, 
        query: str, 
        patient_id: Optional[str] = None, 
        doctor_id: Optional[str] = None, 
        chat_id: Optional[str] = None,
        document_context: Optional[str] = None,
        detected_language: str = 'english'
    ) -> str:
        """Enhance the user query with available context and documents"""
        
        context_parts = []
        
        if document_context:
            context_parts.append(document_context)
        
        # Add language instruction
        language_instruction = f"""
        DETECTED LANGUAGE: {detected_language.upper()}
        CRITICAL: Respond entirely in {detected_language.upper()}. Use appropriate medical terminology and formatting for this language.
        """
        context_parts.append(language_instruction)
        
        if patient_id:
            context_parts.append(f"""
                PATIENT QUERY: {query}

                CONTEXT:
                - Patient ID: {patient_id}
                - Doctor ID: {doctor_id} 
                - Chat ID: {chat_id}
                - Response Language: {detected_language}

                INSTRUCTION: Patient mentioned - gather complete patient profile using ALWAYS ALL patient tools automatically. Use uploaded documents as additional context when relevant. Format response in {detected_language.upper()}.
            """)
        else:
            context_parts.append(f"""
                GENERAL QUERY: {query}

                CONTEXT:
                - Doctor ID: {doctor_id}
                - Chat ID: {chat_id}
                - Response Language: {detected_language}

                INSTRUCTION: General medical query - use uploaded documents and provide evidence-based response with proper citations in {detected_language.upper()}.
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
            
            formatted_parts.append(f"""📄 **{filename}** (Relevance: {score:.2f})
{chunk_text}
---""")
        
        return "\n\n".join(formatted_parts)


tbibi_agent = TbibiAgent()