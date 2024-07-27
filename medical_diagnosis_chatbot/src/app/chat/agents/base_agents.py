"""
This module contains the base agent class which will be used to create the agents for the chatbot.
"""
from langchain.agents.initialize import initialize_agent
from langchain.agents.openai_functions_agent.base import OpenAIFunctionsAgent
from langchain.agents import create_openai_tools_agent, AgentExecutor
from langchain.schema.messages import SystemMessage
from langchain.prompts import MessagesPlaceholder, ChatPromptTemplate, MessagesPlaceholder
from langchain.memory import ConversationBufferMemory
import langchain_community


from src.app.core.logs import logger

class BaseAgent:
    """
    This agent will use retriever tools as context for llm to answer the query.
    """

    def __init__(
        self,
        tools: list,
        llm: langchain_community.chat_models.openai.ChatOpenAI,
        agent_system_message: str = None,
    ):
        self.llm = llm
        self.tools = tools
        self.agent = None
        self.max_iterations = 20
        self.prompt = ChatPromptTemplate.from_messages(
            [
                ("system", agent_system_message),
                ("human", "{input}"),
                MessagesPlaceholder(variable_name="agent_scratchpad"),
            ]
        )
        self.agent_kwargs = {
            "extra_prompt_messages": [MessagesPlaceholder(variable_name="memory")],
            "system_message": SystemMessage(content=agent_system_message),
        }


    def initialize_agent(self):
        """
        Initialize the agent based on the llm, tools and agent_type.
        """
        
        tool_agent = create_openai_tools_agent(self.llm, self.tools, self.prompt)
        self.agent = AgentExecutor(
            agent=tool_agent,
            tools=self.tools,
            max_iteration=self.max_iterations,
            verbose=True,
        )
        

    def invoke_agent(self, query: str) -> str:
        """
        Invoke the agent by passing query and return the output
        
        Args:
            query (str): The query text.
        
        Returns:
            str: The output text.
        """
        if self.agent is None:
            logger.debug("Agent not initialized, calling initialize_agent.")
            self.initialize_agent()
            
        result = self.agent.invoke({"input": query})
        return result['output']
    