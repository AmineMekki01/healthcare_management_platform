"""
This module contains the workflow for the medical diagnosis chatbot. The workflow is a sequence of steps that the chatbot follows to provide a diagnosis for a patient. The workflow consists of the following steps:
1. Initialize tools
2. Create agents
3. Invoke agents
4. Provide a diagnosis
"""
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_community.chat_models.openai import ChatOpenAI


from src.app.chat.agents.app_agents import MedicalHistoryAgent, MedicalImagesInterpreterAgent, LabTestResultsAgent, DiagnosticExpertAgent
from src.app.chat.agents.agent_state import DiagnosticState


from src.app.settings import settings
from src.app.core.logs import logger
from src.app.chat.utils import initialize_retrieval_tools, get_source_name
from src.app.chat.tools.custom_tools import SignificanceTesting, CorrelationTool
from src.app.chat.store import document_store

logger.info(f"document_store in workflow: {len(document_store)}")
llm = ChatOpenAI(api_key=settings.OPENAI_API_KEY)

def initialize_tools():
    """
    Initialize the tools for the agents.
    
    Returns:
        tuple: A tuple of the tools for the agents.
    """
    medical_history_source = get_source_name("history")
    medical_history_source_docs = document_store.get(medical_history_source)
    medical_history_agent_tool = initialize_retrieval_tools(source_docs=medical_history_source_docs)
    
    medical_images_source = get_source_name("image")
    medical_images_source_docs = document_store.get(medical_images_source)
    medical_images_agent_tool = initialize_retrieval_tools(source_docs=medical_images_source_docs)
    
    lab_test_results_source = get_source_name("lab")
    lab_test_results_source_docs = document_store.get(lab_test_results_source)
    lab_test_results_agent_tool = initialize_retrieval_tools(source_docs=lab_test_results_source_docs)
    
    return  medical_images_agent_tool, medical_history_agent_tool, lab_test_results_agent_tool

def create_agents(medical_history_agent_tool=None, medical_images_agent_tool=None, lab_test_results_agent_tool=None):
    """
    Create the agents for the chatbot.
    
    Args:
        medical_history_agent_tool: The tool for querying the patient's medical history.
        medical_images_agent_tool: The tool for interpreting medical images.
        lab_test_results_agent_tool: The tool for interpreting lab test results.
        
    Returns:
        dict: A dictionary of agents.
    """
    agents = {}
    if medical_history_agent_tool:
        agents['medical_history_agent'] = MedicalHistoryAgent(llm, medical_history_agent_tool)
    
    if medical_images_agent_tool:
        agents['medical_images_agent'] = MedicalImagesInterpreterAgent(llm, medical_images_agent_tool)
    
    if lab_test_results_agent_tool:
        agents['lab_test_results_agent'] = LabTestResultsAgent(llm, lab_test_results_agent_tool)
    
    if any([medical_history_agent_tool, medical_images_agent_tool, lab_test_results_agent_tool]):
        agents['diagnostic_expert_agent'] = DiagnosticExpertAgent(llm, [SignificanceTesting(), CorrelationTool()])
    
    return agents


def invoke_medical_history_agent(state: DiagnosticState, agent: MedicalHistoryAgent) -> DiagnosticState:
    """
    Invoke the medical history agent.
    
    Args:
        state: The diagnostic state.
        agent: The medical history agent.
        
    Returns:
        DiagnosticState: The updated diagnostic state.
    """
    findings = agent.invoke_agent(state.state["medical_history"]["input"])
    state.state["medical_history"]["findings"] = findings
    return state

def invoke_medical_images_agent(state: DiagnosticState, agent: MedicalImagesInterpreterAgent) -> DiagnosticState:
    """
    Invoke the medical images agent.
    
    Args:
        state: The diagnostic state.
        agent: The medical images agent.
        
    Returns:
        DiagnosticState: The updated diagnostic state.
    """
    findings = agent.invoke_agent(state.state["medical_images"]["input"])
    state.state["medical_images"]["findings"] = findings
    return state


def invoke_lab_test_results_agent(state: DiagnosticState, agent: LabTestResultsAgent) -> DiagnosticState:
    """
    Invoke the lab test results agent.
    
    Args:
        state: The diagnostic state.
        agent: The lab test results agent.
        
    Returns:
        DiagnosticState: The updated diagnostic state.
    """
    findings = agent.invoke_agent(state.state["lab_tests"]["input"])
    state.state["lab_tests"]["findings"] = findings
    return state


def invoke_expert_agent(state: DiagnosticState, agent: DiagnosticExpertAgent) -> DiagnosticState:
    """
    Invoke the diagnostic expert agent.
    
    Args:
        state: The diagnostic state.
        agent: The diagnostic expert agent.
    
    Returns:
        DiagnosticState: The updated diagnostic state.
    """
    synthesized_info = f"""
    Based on the the interaction with the patient, his/her medical history, the following findings were obtained:
    Patient information: {state.patient_info}
    Medical history: {state.state['medical_history']['findings']}
    Medical images: {state.state["medical_images"]["findings"]}
    Lab test results: {state.state["lab_tests"]["findings"]}

    Based on the above findings, Provide a diagnosis for the patient.
    
    """
    state.final_diagnosis = agent.invoke_agent(synthesized_info)
    return state


def agent_workflow():
    patient_info = {"age": 42} # FOR TEST. IT WILL BE LINKED TO THE USER-ID AND HIS DATA
    diagnostic_state = DiagnosticState(patient_info)
    
    medical_images_agent_tool, medical_history_agent_tool, lab_test_results_agent_tool= initialize_tools()
    
    agents = create_agents(medical_images_agent_tool=medical_images_agent_tool, medical_history_agent_tool=medical_history_agent_tool, lab_test_results_agent_tool=lab_test_results_agent_tool)
        

    if 'medical_history_agent' in agents:
        diagnostic_state = invoke_medical_history_agent(diagnostic_state, agents['medical_history_agent'])
    
    if 'medical_images_agent' in agents:
        diagnostic_state = invoke_medical_images_agent(diagnostic_state, agents['medical_images_agent'])
        
    if 'lab_test_results_agent' in agents:
        diagnostic_state = invoke_lab_test_results_agent(diagnostic_state, agents['lab_test_results_agent'])
    

    if 'diagnostic_expert_agent' in agents:
        diagnostic_state = invoke_expert_agent(diagnostic_state, agents['diagnostic_expert_agent'])
    
    
    return diagnostic_state
