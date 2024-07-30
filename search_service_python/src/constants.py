from enum import StrEnum

NO_DOCUMENTS_FOUND: str = "No documents found in context. Please try again with a different query."


class FailureReasonsEnum(StrEnum):
    OPENAI_ERROR = 'OpenAI call Error'
    STREAM_TIMEOUT = 'Stream Timeout'
    FAILED_PROCESSING = 'Failed Processing'


class ChatRolesEnum(StrEnum):
    USER = 'user'
    SYSTEM = 'system'
    ASSISTANT = 'assistant'


class ModelsEnum(StrEnum):
    GPT4 = "gpt-4-1106-preview"
    LLAMA2 = "llama2_7b"


LIST_OF_SPECIALTIES = ["cardiologist", "dermatologist", "endocrinologist", "gastroenterologist", "gynecologist", "hematologist",
                       "nephrologist", "neurologist", "oncologist", "ophthalmologist", "otolaryngologist", "pathologist", "pediatrician",
                       "psychiatrist", "radiologist", "surgeon", "urologist",
                       "obstetrician", "pulmonologist", "rheumatologist", "allergist", "anesthesiologist", "dentist", "dietitian", "plastic surgeon", "orthopedist", "endoctrinologist", "immunologist", "neurosurgeon", "urogynecologist", "urologic oncologist", "cardiothoracic surgeon", "vascular surgeon", "reproductive endocrinologist", "neonatologist", "podiatrist", "global health doctor", "geriatrician", "physiatrist", "geneticist", "addiction medicine specialist", "pain management specialist", "sports medicine specialist"]


class PhysicianSpecialty(StrEnum):
    CARDIOLOGIST = "cardiologist"
    DERMATOLOGIST = "dermatologist"
    ENDOCRINOLOGIST = "endocrinologist"
    GASTROENTEROLOGIST = "gastroenterologist"
    GYNECOLOGIST = "gynecologist"
    HEMATOLOGIST = "hematologist"
    NEPHROLOGIST = "nephrologist"
    NEUROLOGIST = "neurologist"
    ONCOLOGIST = "oncologist"
    OPHTHALMOLOGIST = "ophthalmologist"
    OTOLARYNGOLOGIST = "otolaryngologist"
    PATHOLOGIST = "pathologist"
    PEDIATRICIAN = "pediatrician"
    PSYCHIATRIST = "psychiatrist"
    RADIOLOGIST = "radiologist"
    SURGEON = "surgeon"
    UROLOGIST = "urologist"
    OBSTETRICIAN = "obstetrician"
    PULMONOLOGIST = "pulmonologist"
    RHEUMATOLOGIST = "rheumatologist"
    ALLERGIST = "allergist"
    ANESTHESIOLOGIST = "anesthesiologist"
    DENTIST = "dentist"
    DIETITIAN = "dietitian"
    PLASTIC_SURGEON = "plastic surgeon"
    ORTHOPEDIST = "orthopedist"
    ENDOCTRINOLOGIST = "endoctrinologist"
    IMMUNOLOGIST = "immunologist"
    NEUROSURGEON = "neurosurgeon"
    UROGYNECOLOGIST = "urogynecologist"
    UROLOGIC_ONCOLOGIST = "urologic oncologist"
    CARDIOTHORACIC_SURGEON = "cardiothoracic surgeon"
    VASCULAR_SURGEON = "vascular surgeon"
    REPRODUCTIVE_ENDOCRINOLOGIST = "reproductive endocrinologist"
    NEONATOLOGIST = "neonatologist"
    PODIATRIST = "podiatrist"
    GLOBAL_HEALTH_DOCTOR = "global health doctor"
    GERIATRICIAN = "geriatrician"
    PHYSIATRIST = "physiatrist"
    GENETICIST = "geneticist"
    ADDICTION_MEDICINE_SPECIALIST = "addiction medicine specialist"
    PAIN_MANAGEMENT_SPECIALIST = "pain management specialist"
    SPORTS_MEDICINE_SPECIALIST = "sports medicine specialist"
