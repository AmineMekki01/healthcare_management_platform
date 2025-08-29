"""
Patient data retrieval tools for the RAG chatbot system.
These tools allow the AI agent to access comprehensive patient information.
"""

import asyncio
from typing import List, Dict, Any, Optional
from uuid import UUID
from src.app.core.logs import logger
from src.app.db import get_database_connection

import json

from typing_extensions import TypedDict, Any

from agents import Agent, FunctionTool, RunContextWrapper, function_tool


class ToolQuery(TypedDict):
    patient_id: str
    doctor_id: str
    limit: int
    search_term: str



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
    from src.app.db import get_db_session
    
    try:
        async with get_db_session() as session:
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
        logger.error(f"Error retrieving patient basic info: {e}")
        return {"error": f"Database error: {str(e)}"}

@function_tool 
async def get_patient_appointments(patient_id: str, doctor_id: str, limit: int) -> Dict[str, Any]:
    """
    Retrieve patient's appointment history based on the patient ID and doctor ID.
    
    Args:
        patient_id: UUID string of the patient
        limit: Maximum number of appointments to retrieve
        doctor_id: UUID string of the doctor
        
    Returns:
        Dictionary containing appointment history
    """
    from sqlalchemy import text
    from uuid import UUID
    from src.app.db import get_db_session
    
    try:
        async with get_db_session() as session:
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
        logger.error(f"Error retrieving patient appointments: {e}")
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
    from src.app.db import get_db_session
    
    try:
        async with get_db_session() as session:
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
        logger.error(f"Error retrieving patient medical history: {e}")
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
    from src.app.db import get_db_session
    
    try:
        async with get_db_session() as session:
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
        logger.error(f"Error retrieving patient medications: {e}")
        return {"error": f"Database error: {str(e)}"}


@function_tool
async def get_appointments_report_content(appointment_id: str):
    """Retrieve the content of an appointment report based on the appointment ID.
    
    Args:
        appointment_id: The appointment ID
    
    Returns:
        The content of the appointment report
    """
    from sqlalchemy import text
    from uuid import UUID
    from src.app.db import get_db_session
    
    try:
        # Get the database session
        session = get_db_session()
        
        query = text("""
            SELECT appointment_id, patient_first_name, patient_last_name,
            doctor_first_name, doctor_last_name, diagnosis_made,
            diagnosis_name, diagnosis_details, report_content,
            referral_needed, referral_specialty, referral_doctor_name,
            referral_message
            FROM medical_reports 
            WHERE patient_id = :patient_id
            ORDER BY created_at DESC
        """)

        # Execute the query with parameters
        result = await session.execute(query, {"patient_id": UUID(appointment_id)})
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
            
        # Close the session
        await session.close()
        
        return appointments_reports
        
    except ValueError as ve:
        logger.error(f"Invalid UUID format: {ve}")
        return {"error": f"Invalid appointment ID format: {str(ve)}"}
    except Exception as e:
        logger.error(f"Error retrieving appointment report content: {e}", exc_info=True)
        return {"error": f"Database error: {str(e)}"}
    finally:
        # Ensure session is closed in case of any error
        if 'session' in locals():
            await session.close()


async def search_patients_for_doctor(doctor_id: str, search_term: str = "", limit: int = 10) -> Dict[str, Any]:
    """
    Search for patients that belong to a specific doctor.
    
    Args:
        doctor_id: UUID string of the doctor
        search_term: Optional search term to filter patients by name
        limit: Maximum number of patients to return
        
    Returns:
        Dictionary containing matching patients
    """
    from sqlalchemy import text
    from uuid import UUID
    from src.app.db import get_db_session
    
    try:
        async with get_db_session() as session:
            base_query = """
                SELECT DISTINCT p.patient_id, p.username, p.first_name, p.last_name, 
                        p.email, p.phone_number, p.age, p.sex, p.location
                FROM patient_info p
                INNER JOIN appointments a ON p.patient_id = a.patient_id
                WHERE a.doctor_id = :doctor_id AND p.is_verified = true
            """
            
            params = {"doctor_id": UUID(doctor_id)}
            
            if search_term:
                query = text(f"""
                    {base_query}
                    AND (LOWER(p.first_name) LIKE LOWER(:search_term) 
                            OR LOWER(p.last_name) LIKE LOWER(:search_term)
                            OR LOWER(CONCAT(p.first_name, ' ', p.last_name)) LIKE LOWER(:search_term))
                    ORDER BY p.last_name, p.first_name
                    LIMIT :limit
                """)
                params.update({"search_term": f"%{search_term}%", "limit": limit})
            else:
                query = text(f"""
                    {base_query}
                    ORDER BY p.last_name, p.first_name
                    LIMIT :limit
                """)
                params.update({"limit": limit})
            
            result = await session.execute(query, params)
            rows = result.mappings().all()
            
            patients = []
            for row in rows:
                print(f"Patient: {row['first_name']} {row['last_name']}")
                patients.append({
                    "patient_id": str(row['patient_id']),
                    "username": row['username'],
                    "first_name": row['first_name'],
                    "last_name": row['last_name'],
                    "full_name": f"{row['first_name']} {row['last_name']}",
                    "email": row['email'],
                    "phone_number": row['phone_number'],
                    "age": row['age'],
                    "sex": row['sex'],
                    "location": row['location']
                })
            
            return {
                "total_patients": len(patients),
                "patients": patients
            }
        
    except Exception as e:
        logger.error(f"Error searching patients for doctor: {e}")
        return {"error": f"Database error: {str(e)}"}
