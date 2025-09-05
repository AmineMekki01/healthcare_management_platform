from typing import Dict, Any
from agents import function_tool
from src.shared.logs import logger

@function_tool
async def get_patient_basic_info(patient_id: str) -> Dict[str, Any]:
    """
    Retrieve basic patient information.
    
    Args:
        patient_id: UUID string of the patient
        
    Returns:
        Dictionary containing patient's basic information
    """
    from sqlalchemy import text
    from uuid import UUID
    from src.database import AsyncSessionLocal
    logger.info(f"Retrieving basic info for patient {patient_id}")
    try:
        async with AsyncSessionLocal() as session:
            query = text("""
                SELECT patient_id, username, first_name, last_name, age, sex, 
                        email, phone_number, birth_date, street_address, city_name, 
                        state_name, zip_code, country_name, bio, location, 
                        created_at, updated_at
                FROM patient_info 
                WHERE patient_id = :patient_id AND is_verified = true
            """)
            
            result = await session.execute(query, {"patient_id": UUID(patient_id)})
            row = result.mappings().first()
        
        if not row:
            return {"error": "Patient not found or not verified"}
        
        return {
            "patient_id": str(row['patient_id']),
            "username": row['username'],
            "first_name": row['first_name'],
            "last_name": row['last_name'],
            "full_name": f"{row['first_name']} {row['last_name']}",
            "age": row['age'],
            "sex": row['sex'],
            "email": row['email'],
            "phone_number": row['phone_number'],
            "birth_date": str(row['birth_date']) if row['birth_date'] else None,
            "address": {
                "street": row['street_address'],
                "city": row['city_name'],
                "state": row['state_name'],
                "zip_code": row['zip_code'],
                "country": row['country_name'],
                "full_address": row['location']
            },
            "bio": row['bio'],
            "created_at": str(row['created_at']),
            "updated_at": str(row['updated_at'])
        }
        
    except Exception as e:
        return {"error": f"Database error: {str(e)}"}


@function_tool 
async def get_patient_appointments(patient_id: str, doctor_id: str, limit: int) -> Dict[str, Any]:
    """
    Retrieve patient's appointment history based on the patient ID and doctor ID.
    
    Args:
        patient_id: UUID string of the patient
        doctor_id: UUID string of the doctor
        limit: Maximum number of appointments to retrieve
        
    Returns:
        Dictionary containing appointment history
    """
    from sqlalchemy import text
    from uuid import UUID
    from src.database import AsyncSessionLocal
    logger.info(f"Retrieving appointments for patient {patient_id}, doctor {doctor_id}")
    try:
        async with AsyncSessionLocal() as session:
            query = text("""
                SELECT a.appointment_id, a.appointment_start, a.appointment_end, a.title,
                        a.doctor_id, d.first_name as doctor_first_name, 
                        d.last_name as doctor_last_name, d.specialty,
                        COALESCE(mr.report_id IS NOT NULL, false) AS has_report
                FROM appointments a
                JOIN doctor_info d ON a.doctor_id = d.doctor_id
                LEFT JOIN medical_reports mr ON a.appointment_id = mr.appointment_id
                WHERE a.patient_id = :patient_id AND a.doctor_id = :doctor_id
                ORDER BY a.appointment_start DESC
                LIMIT :limit
            """)
            
            result = await session.execute(query, {
                "patient_id": UUID(patient_id), 
                "doctor_id": UUID(doctor_id), 
                "limit": limit
            })
            rows = result.mappings().all()
        
        appointments = []
        for row in rows:
            appointments.append({
                "appointment_id": str(row['appointment_id']),
                "date": str(row['appointment_start']),
                "end_time": str(row['appointment_end']),
                "title": row['title'],
                "doctor": {
                    "id": str(row['doctor_id']),
                    "name": f"Dr. {row['doctor_first_name']} {row['doctor_last_name']}",
                    "specialty": row['specialty']
                },
                "has_medical_report": row['has_report']
            })
        
        return {
            "total_appointments": len(appointments),
            "appointments": appointments
        }
        
    except Exception as e:
        return {"error": f"Database error: {str(e)}"}


@function_tool 
async def get_patient_medical_history(patient_id: str) -> Dict[str, Any]:
    """
    Retrieve patient's medical diagnosis history.
    
    Args:
        patient_id: UUID string of the patient
        
    Returns:
        Dictionary containing medical history
    """
    from sqlalchemy import text
    from uuid import UUID
    from src.database import AsyncSessionLocal
    logger.info(f"Retrieving medical history for patient {patient_id}")
    try:
        async with AsyncSessionLocal() as session:
            query = text("""
                SELECT diag_history_id, diagnosis_name, diagnosis_details, 
                        diagnosis_doctor_name, diagnosis_doctor_id, created_at, updated_at
                FROM medical_diagnosis_history 
                WHERE diagnosis_patient_id = :patient_id 
                ORDER BY created_at DESC
            """)
            
            result = await session.execute(query, {"patient_id": UUID(patient_id)})
            rows = result.mappings().all()
        
        medical_history = []
        for row in rows:
            medical_history.append({
                "diagnosis_id": str(row['diag_history_id']),
                "diagnosis_name": row['diagnosis_name'],
                "diagnosis_details": row['diagnosis_details'],
                "diagnosing_doctor": {
                    "id": str(row['diagnosis_doctor_id']),
                    "name": row['diagnosis_doctor_name']
                },
                "diagnosed_date": str(row['created_at']),
                "last_updated": str(row['updated_at'])
            })
        
        return {
            "total_diagnoses": len(medical_history),
            "medical_history": medical_history
        }
        
    except Exception as e:
        return {"error": f"Database error: {str(e)}"}


@function_tool 
async def get_patient_medications(patient_id: str) -> Dict[str, Any]:
    """
    Retrieve patient's current and past medications.
    
    Args:
        patient_id: UUID string of the patient
        
    Returns:
        Dictionary containing medication information
    """
    from sqlalchemy import text
    from uuid import UUID
    from src.database import AsyncSessionLocal
    logger.info(f"Retrieving medications for patient {patient_id}")
    try:
        async with AsyncSessionLocal() as session:
            query = text("""
                SELECT medication_id, medication_name, dosage, frequency, duration,
                        instructions, prescribing_doctor_name, prescribing_doctor_id,
                        report_id, created_at, updated_at
                FROM medications 
                WHERE patient_id = :patient_id 
                ORDER BY created_at DESC
            """)
            
            result = await session.execute(query, {"patient_id": UUID(patient_id)})
            rows = result.mappings().all()
        
        medications = []
        for row in rows:
            medications.append({
                "medication_id": str(row['medication_id']),
                "medication_name": row['medication_name'],
                "dosage": row['dosage'],
                "frequency": row['frequency'],
                "duration": row['duration'],
                "instructions": row['instructions'],
                "prescribing_doctor": {
                    "id": str(row['prescribing_doctor_id']),
                    "name": row['prescribing_doctor_name']
                },
                "report_id": str(row['report_id']) if row['report_id'] else None,
                "prescribed_date": str(row['created_at']),
                "last_updated": str(row['updated_at'])
            })
        
        return {
            "total_medications": len(medications),
            "medications": medications
        }
        
    except Exception as e:
        return {"error": f"Database error: {str(e)}"}


@function_tool
async def get_appointments_report_content(appointment_id: str) -> Dict[str, Any]:
    """Retrieve the content of an appointment report based on the appointment ID.
    
    Args:
        appointment_id: The appointment ID
    
    Returns:
        The content of the appointment report
    """
    from sqlalchemy import text
    from uuid import UUID
    from src.database import AsyncSessionLocal
    logger.info(f"Retrieving report content for appointment {appointment_id}")
    try:
        async with AsyncSessionLocal() as session:
            query = text("""
                SELECT appointment_id, patient_first_name, patient_last_name,
                doctor_first_name, doctor_last_name, diagnosis_made,
                diagnosis_name, diagnosis_details, report_content,
                referral_needed, referral_specialty, referral_doctor_name,
                referral_message
                FROM medical_reports 
                WHERE appointment_id = :appointment_id
                ORDER BY created_at DESC
            """)

            result = await session.execute(query, {"appointment_id": UUID(appointment_id)})
            rows = result.mappings().all()
            
            appointments_reports = []
            for row in rows:
                appointments_reports.append({
                    "appointment_id": str(row['appointment_id']) if row['appointment_id'] else None,
                    "patient_first_name": row['patient_first_name'],
                    "patient_last_name": row['patient_last_name'],
                    "doctor_first_name": row['doctor_first_name'],
                    "doctor_last_name": row['doctor_last_name'],
                    "diagnosis_made": row['diagnosis_made'],
                    "diagnosis_name": row['diagnosis_name'],
                    "diagnosis_details": row['diagnosis_details'],
                    "report_content": row['report_content'],
                    "referral_needed": row['referral_needed'],
                    "referral_specialty": row['referral_specialty'],
                    "referral_doctor_name": row['referral_doctor_name'],
                    "referral_message": row['referral_message']
                })
            
            return {
                "total_reports": len(appointments_reports),
                "reports": appointments_reports
            }
        
    except ValueError as ve:
        return {"error": f"Invalid appointment ID format: {str(ve)}"}
    except Exception as e:
        return {"error": f"Database error: {str(e)}"}


@function_tool
async def get_patient_documents(
    patient_id: str = None, 
    query: str = "", 
    limit: int = 10
) -> Dict[str, Any]:
    """
    Search for documents related to a specific patient or general documents.
    
    Args:
        patient_id: UUID string of the patient to search documents for
        query: Search query text (optional, will use default if empty)
        limit: Maximum number of results to return (default 10)
        
    Returns:
        Dictionary containing search results with citations and source indicators
    """
    try:
        from src.qdrant.retrieval import retrieval_service
        from src.qdrant.models import SearchQuery
        logger.info(f"Searching documents for patient {patient_id}")
        search_context = "patient-specific" if patient_id else "general"
        
        if not query or query.strip() == "":
            query = "medical record patient document"
            logger.debug(f"Using default query: {query}")
        
        search_query = SearchQuery(
            query_text=query,
            patient_id=patient_id,
            limit=limit,
            score_threshold=0.0
        )
        
        search_results = await retrieval_service.search_multiple_collections(search_query)
        logger.info(f"Document search completed: {len(search_results) if search_results else 0} results found")
        documents = []
        for result in search_results:
            documents.append({
                "content": result.content,
                "score": result.score,
                "file_name": result.payload.chunk_metadata.file_name,
                "file_type": result.payload.chunk_metadata.file_type,
            })
        
        logger.info(f"Returning {len(documents)} documents for patient {patient_id or 'general'}")
        return {
            "documents": documents,
            "total_found": len(documents),
            "search_context": search_context,
            "query_used": query
        }
        
    except Exception as e:
        logger.error(f"Error searching patient documents: {e}")
        return {"error": f"Failed to search documents: {str(e)}"}
