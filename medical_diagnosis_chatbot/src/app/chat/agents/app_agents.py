"""
This module contains the agents that will be used to query the patient's medical history, interpret medical images, interpret lab test results, and provide diagnostic expertise.
"""
from typing import List
import langchain

from src.app.chat.agents.base_agents import BaseAgent   
from src.app.core.logs import logger
import langchain_community

from langchain.agents import AgentType
from src.app.chat.utils import load_config

agent_prompts = load_config("config/agent_prompts.yaml")
class MedicalHistoryAgent(BaseAgent):
    """
    This agent will use the appropriate retriever tools to query the patient's medical history and provide a response.
    """
    def __init__(self, llm : langchain_community.chat_models.openai.ChatOpenAI, tools : List):
        agent_system_message = agent_prompts["medical_history_agent_prompt"]
        super().__init__(tools, llm,agent_system_message)
        
class MedicalImagesInterpreterAgent(BaseAgent):
    """
    This agent will use the appropriate retriever tools to interpret medical images reports and provide a response.
    """
    def __init__(self, llm : langchain_community.chat_models.openai.ChatOpenAI, tools : List):
        agent_system_message = agent_prompts["medical_images_agent_prompt"]
        super().__init__(tools, llm, agent_system_message)
    
class LabTestResultsAgent(BaseAgent):
    """
    This agent will use the appropriate retriever tools to interpret lab test results and provide a response.
    """
    def __init__(self, llm : langchain_community.chat_models.openai.ChatOpenAI, tools : List):
        agent_system_message = agent_prompts["lab_results_agent_prompt"]
        super().__init__(tools, llm, agent_system_message)
    
class DiagnosticExpertAgent(BaseAgent):
    """
    This agent will use the appropriate retriever tools to provide diagnostic expertise and provide a response.
    """
    def __init__(self, llm : langchain_community.chat_models.openai.ChatOpenAI, tools : List):
        agent_system_message = agent_prompts["diagnostic_expert_agent_prompt"]
        super().__init__(tools, llm, agent_system_message)
    
