"""
Base Agent Class

Provides base functionality for all LangChain agents including:
- Agent initialization with LLM
- Tool registration
- Timeout handling
- Error handling
- Reasoning step logging

Requirements: 27.1-27.13
"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from abc import ABC, abstractmethod

from langchain.agents import AgentExecutor as LangChainAgentExecutor, create_react_agent
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.tools import Tool

from app.config import settings

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """
    Base class for all LangChain agents.
    
    Provides common functionality:
    - LLM initialization (Groq)
    - Tool registration
    - Agent creation
    - Execution with timeout
    - Error handling
    - Reasoning logging
    """
    
    def __init__(
        self,
        max_iterations: int = 10,
        max_execution_time: float = 20.0,
        verbose: bool = True
    ):
        """
        Initialize base agent.
        
        Args:
            max_iterations: Maximum number of tool calls (default: 10)
            max_execution_time: Maximum execution time in seconds (default: 20.0)
            verbose: Enable verbose logging (default: True)
        """
        self.max_iterations = max_iterations
        self.max_execution_time = max_execution_time
        self.verbose = verbose
        
        # Initialize LLM (Groq for fast execution)
        self.llm = self._initialize_llm()
        
        # Tools will be registered by subclasses
        self.tools: List[Tool] = []
        
        # Agent executor (created when needed)
        self.agent_executor: Optional[LangChainAgentExecutor] = None
        
        # Reasoning steps (logged during execution)
        self.reasoning_steps: List[Dict[str, Any]] = []
    
    def _initialize_llm(self) -> ChatGroq:
        """
        Initialize Groq LLM for agent.
        
        Uses mixtral-8x7b-32768 for balance of speed and capability.
        
        Returns:
            ChatGroq instance
        """
        return ChatGroq(
            model="mixtral-8x7b-32768",
            temperature=0.1,  # Low temperature for consistent reasoning
            groq_api_key=settings.GROQ_API_KEY,
            max_tokens=4096
        )
    
    @abstractmethod
    def _register_tools(self) -> List[Tool]:
        """
        Register tools for this agent.
        
        Must be implemented by subclasses.
        
        Returns:
            List of LangChain Tool instances
        """
        pass
    
    @abstractmethod
    def _get_prompt_template(self) -> PromptTemplate:
        """
        Get prompt template for this agent.
        
        Must be implemented by subclasses.
        
        Returns:
            PromptTemplate instance
        """
        pass
    
    def initialize_agent(self):
        """
        Initialize the agent with tools and prompt.
        
        Creates the ReAct agent executor.
        """
        # Register tools
        self.tools = self._register_tools()
        
        if not self.tools:
            raise ValueError("Agent must have at least one tool")
        
        # Get prompt template
        prompt = self._get_prompt_template()
        
        # Create ReAct agent
        agent = create_react_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=prompt
        )
        
        # Create agent executor with timeout and iteration limits
        self.agent_executor = LangChainAgentExecutor(
            agent=agent,
            tools=self.tools,
            max_iterations=self.max_iterations,
            max_execution_time=self.max_execution_time,
            verbose=self.verbose,
            handle_parsing_errors=True,
            return_intermediate_steps=True  # For reasoning logging
        )
        
        logger.info(
            f"Agent initialized with {len(self.tools)} tools, "
            f"max_iterations={self.max_iterations}, "
            f"max_execution_time={self.max_execution_time}s"
        )
    
    def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the agent with input data.
        
        Args:
            input_data: Input dictionary for agent
            
        Returns:
            Dictionary with:
                - output: Agent's final output
                - reasoning_steps: List of reasoning steps
                - execution_time_ms: Execution time in milliseconds
                - status: 'success', 'timeout', or 'error'
                - error: Error message (if status is 'error')
        
        Requirements: 27.6, 27.11, 27.12
        """
        if not self.agent_executor:
            self.initialize_agent()
        
        start_time = datetime.utcnow()
        
        try:
            # Execute agent
            result = self.agent_executor.invoke(input_data)
            
            # Extract reasoning steps
            self.reasoning_steps = self._extract_reasoning_steps(
                result.get('intermediate_steps', [])
            )
            
            # Calculate execution time
            execution_time_ms = int(
                (datetime.utcnow() - start_time).total_seconds() * 1000
            )
            
            # Log reasoning steps (Req 27.12)
            logger.info(
                f"Agent executed successfully in {execution_time_ms}ms "
                f"with {len(self.reasoning_steps)} reasoning steps"
            )
            
            return {
                'output': result.get('output', ''),
                'reasoning_steps': self.reasoning_steps,
                'execution_time_ms': execution_time_ms,
                'status': 'success'
            }
            
        except TimeoutError as e:
            execution_time_ms = int(
                (datetime.utcnow() - start_time).total_seconds() * 1000
            )
            logger.warning(f"Agent execution timeout after {execution_time_ms}ms: {e}")
            
            return {
                'output': None,
                'reasoning_steps': self.reasoning_steps,
                'execution_time_ms': execution_time_ms,
                'status': 'timeout',
                'error': str(e)
            }
            
        except Exception as e:
            execution_time_ms = int(
                (datetime.utcnow() - start_time).total_seconds() * 1000
            )
            logger.error(f"Agent execution error after {execution_time_ms}ms: {e}")
            
            return {
                'output': None,
                'reasoning_steps': self.reasoning_steps,
                'execution_time_ms': execution_time_ms,
                'status': 'error',
                'error': str(e)
            }
    
    def _extract_reasoning_steps(
        self,
        intermediate_steps: List[tuple]
    ) -> List[Dict[str, Any]]:
        """
        Extract and format reasoning steps from agent execution.
        
        Args:
            intermediate_steps: List of (AgentAction, observation) tuples
            
        Returns:
            List of formatted reasoning step dictionaries
        """
        reasoning = []
        
        for i, (action, observation) in enumerate(intermediate_steps):
            step = {
                'step_number': i + 1,
                'tool': action.tool,
                'tool_input': action.tool_input,
                'thought': action.log,
                'observation': str(observation)[:500]  # Truncate long observations
            }
            reasoning.append(step)
        
        return reasoning
    
    def reset(self):
        """Reset agent state for new execution."""
        self.reasoning_steps = []
        self.agent_executor = None
