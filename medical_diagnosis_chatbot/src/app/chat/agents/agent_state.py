"""
This module contains the state of the diagnostic agent.
"""

class DiagnosticState:
    """
    This class represents the state of the diagnostic agent.
    """
    def __init__(self, patient_info : dict = {}):
        self.patient_info = patient_info
        self.state = {
            'medical_history': {
                'input' : "Based on the medical history report. Do a deep analysis and generate a summary of the report and suggest at least 1 diagnosis and you can suggest more.", 
                'findings' : None, 
                'diagnosis': None, 
                'confidence': 0, 
                'notes': ""
            },
            
            'medical_images': {
                'input' : "Based on the medical images report. Do a deep analysis and generate a summary of the report and suggest at least 1 diagnosis and you can suggest more.", 
                'findings' : None, 
                'diagnosis': None, 
                'confidence': 0, 
                'notes': ""
            },
            
            'lab_tests': {
                'input' : "Based on the lab test results report. Do a deep analysis and generate a summary of the report and suggest at least 1 diagnosis and you can suggest more.", 
                'findings' : None, 
                'diagnosis': None, 
                'confidence': 0, 
                'notes': ""
            },
        }
        self.final_diagnosis = ""