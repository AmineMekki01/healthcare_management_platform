from enum import Enum

class DocumentType(Enum):
    """Medical document types for heuristic classification."""
    LAB_REPORT = "lab_report"
    LAB_RESULT = "lab_result"
    IMAGING = "imaging"
    DISCHARGE_SUMMARY = "discharge_summary"
    CLINICAL_REPORT = "clinical_report"
    PRESCRIPTION = "prescription"
    CONSULTATION_NOTE = "consultation_note"
    SURGICAL_REPORT = "surgical_report"
    RESEARCH_PAPER = "research_paper"
    GENERAL_DOCUMENT = "general_document"
    GENERAL = "general"