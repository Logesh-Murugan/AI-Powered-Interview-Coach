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
from abc import ABC

try:
    # Try new langchain API (v0.2+)
    from langchain.agents import AgentExecutor, create_react_agent
except ImportError:
    # Fallback to langgraph for newer versions
    from langgraph.prebuilt import create_react_agent
    AgentExecutor = None

# Backward-compatible alias used by some tests and older code paths.
LangChainAgentExecutor = AgentExecutor

# LLM is provided by the AI Orchestrator (multi-provider)
from langchain_core.prompts import PromptTemplate
from langchain_core.tools import Tool

from app.config import settings

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """
    Base class for all LangChain agents.

    Provides common functionality:
    - LLM initialization (via AI Orchestrator multi-provider)
    - Tool registration
    - Agent creation
    - Execution with timeout
    - Error handling
    - Reasoning logging
    """

    def __init__(
        self,
        tools: Optional[List[Tool]] = None,
        system_message: Optional[str] = None,
        agent_type: Optional[str] = None,
        max_iterations: int = 10,
        max_execution_time: float = 20.0,
        verbose: bool = True,
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
        self.system_message = system_message
        self.agent_type = agent_type or "generic"

        # Initialize LLM using orchestrator for automatic failover
        self.llm = self._initialize_llm()

        # Tools can be injected directly by lightweight services or registered by subclasses
        self._configured_tools: List[Tool] = list(tools or [])
        self.tools: List[Tool] = list(self._configured_tools)

        # Agent executor (created when needed)
        self.agent_executor: Optional[AgentExecutor] = None

        # Reasoning steps (logged during execution)
        self.reasoning_steps: List[Dict[str, Any]] = []

    def _initialize_llm(self):
        """
        Initialize LLM for agent using orchestrator for automatic failover.

        Uses AIOrchestrator with automatic multi-provider failover
        (OpenRouter, DeepInfra, HuggingFace).

        Returns:
            LangChain-compatible LLM instance
        """
        from app.services.ai.orchestrator import AIOrchestrator
        from langchain_core.language_models.llms import LLM
        from langchain_core.callbacks.manager import CallbackManagerForLLMRun
        from typing import Optional, List, Any

        orchestrator_instance = AIOrchestrator()

        class OrchestratorLLM(LLM):
            """LangChain LLM wrapper for AIOrchestrator with automatic failover"""

            model_name: str = "orchestrator-multi"
            _bound_tools: List[Any] = []

            @property
            def _llm_type(self) -> str:
                return "orchestrator"

            def _call(
                self,
                prompt: str,
                stop: Optional[List[str]] = None,
                run_manager: Optional[CallbackManagerForLLMRun] = None,
                **kwargs: Any,
            ) -> str:
                """Call orchestrator which handles failover automatically"""
                from app.services.ai.types import AIRequest

                request = AIRequest(
                    prompt=prompt,
                    max_tokens=kwargs.get("max_tokens", 2048),
                    temperature=kwargs.get("temperature", 0.1),
                )

                response = orchestrator_instance.generate(request)

                if not response.success:
                    raise Exception(f"All AI providers failed: {response.error}")

                return response.content

            def bind_tools(self, tools: List[Any], **kwargs: Any) -> "OrchestratorLLM":
                """
                Bind tools to the LLM (required by LangChain agents).
                
                This creates a new instance with bound tools to maintain immutability.
                Tool binding is handled by the agent framework, not the LLM itself.
                """
                # Create a new instance with bound tools
                new_instance = OrchestratorLLM()
                new_instance._bound_tools = list(tools)
                return new_instance

        logger.info("Agent LLM initialized with orchestrator (multi-provider failover)")
        return OrchestratorLLM()

    def _register_tools(self) -> List[Tool]:
        """
        Register tools for this agent.

        Returns:
            List of LangChain Tool instances
        """
        if self._configured_tools:
            return list(self._configured_tools)
        raise NotImplementedError("Agent must define tools or override _register_tools")

    def _get_prompt_template(self, tools: List[Tool]) -> PromptTemplate:
        """
        Get prompt template for this agent.

        Args:
            tools: List of tools to include in prompt

        Returns:
            PromptTemplate instance
        """
        if not self.system_message:
            raise NotImplementedError(
                "Agent must define a system_message or override _get_prompt_template"
            )

        # Format tools description for prompt
        tool_descriptions = "\n".join([f"- {tool.name}: {tool.description}" for tool in tools])
        tool_names = ", ".join([tool.name for tool in tools])

        template = """{system_message}

You have access to the following tools:
{tools}

Tool Names: {tool_names}

CRITICAL FORMAT RULES - FOLLOW EXACTLY:
1. You MUST use this exact format for each step:
   Thought: [your reasoning]
   Action: [tool name]
   Action Input: [input to tool]
   Observation: [result from tool]

2. When you have your final answer, use ONLY this format:
   Thought: I now know the final answer
   Final Answer: [your answer]

3. NEVER put JSON directly after "Thought:" - always follow Thought with Action or Final Answer
4. NEVER skip the Action line when using tools
5. NEVER put JSON in the Thought field - only put it in Final Answer
6. Use ONLY tool names from: {tool_names}
7. STOP immediately after Final Answer - do not add any additional text or actions

Use the following format:

Question: the input question you must answer
Thought: think step by step about the best tool to use
Action: the action to take, should be one of the available tools
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Question: {input}
Thought: {agent_scratchpad}"""

        return PromptTemplate(
            template=template,
            input_variables=[
                "input",
                "agent_scratchpad",
            ],
            partial_variables={
                "system_message": self.system_message,
                "tools": tool_descriptions,
                "tool_names": tool_names,
            },
        )

    def initialize_agent(self):
        """
        Initialize the agent with tools and prompt.

        Creates the ReAct agent executor.
        """
        self.tools = self._register_tools()

        if not self.tools:
            raise ValueError("Agent must have at least one tool")

        prompt = self._get_prompt_template(self.tools)

        if LangChainAgentExecutor is None:
            # Using langgraph - pass prompt to avoid default prompt with tool_names
            agent = create_react_agent(
                llm=self.llm,
                tools=self.tools,
                prompt=prompt,
            )
            self.agent_executor = agent
        else:
            agent = create_react_agent(
                llm=self.llm,
                tools=self.tools,
                prompt=prompt,
            )

            self.agent_executor = LangChainAgentExecutor(
                agent=agent,
                tools=self.tools,
                max_iterations=self.max_iterations,
                max_execution_time=self.max_execution_time,
                verbose=self.verbose,
                handle_parsing_errors=True,  # This should handle parsing errors gracefully
                return_intermediate_steps=True,
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
            if AgentExecutor is None:
                result = self.agent_executor.invoke(input_data)
                messages = result.get("messages", [])
                output = messages[-1].content if messages and len(messages) > 0 else ""
                intermediate_steps = []
            else:
                result = self.agent_executor.invoke(input_data)
                output = result.get("output", "")
                intermediate_steps = result.get("intermediate_steps", [])

            self.reasoning_steps = self._extract_reasoning_steps(intermediate_steps)

            execution_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

            logger.info(
                f"Agent executed successfully in {execution_time_ms}ms "
                f"with {len(self.reasoning_steps)} reasoning steps"
            )

            return {
                "output": output,
                "reasoning_steps": self.reasoning_steps,
                "execution_time_ms": execution_time_ms,
                "status": "success",
            }

        except TimeoutError as e:
            execution_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            logger.warning(f"Agent execution timeout after {execution_time_ms}ms: {e}")

            return {
                "output": None,
                "reasoning_steps": self.reasoning_steps,
                "execution_time_ms": execution_time_ms,
                "status": "timeout",
                "error": str(e),
            }

        except Exception as e:
            execution_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            logger.error(f"Agent execution error after {execution_time_ms}ms: {e}")
            
            # Try to extract any output from the error or intermediate steps
            output = None
            try:
                # Check if this is a ReAct format error but agent actually produced output
                error_str = str(e)
                logger.debug(f"Full error message: {error_str[:1000]}...")
                
                # Look for JSON in the error message itself (common with ReAct format errors)
                if "{" in error_str and "}" in error_str:
                    logger.debug("Found JSON braces in error message, attempting extraction...")
                    
                    # Try to extract JSON from error message - look for the pattern after "Thought:"
                    if "Thought:" in error_str:
                        logger.debug("Found 'Thought:' in error message")
                        # Extract everything after "Thought:" 
                        thought_part = error_str.split("Thought:", 1)[-1]
                        logger.debug(f"Thought part: {thought_part[:500]}...")
                        
                        if "{" in thought_part and "}" in thought_part:
                            logger.debug("Found JSON braces in thought part")
                            start_idx = thought_part.find("{")
                            # Find the matching closing brace
                            brace_count = 0
                            end_idx = -1
                            for i in range(start_idx, len(thought_part)):
                                if thought_part[i] == "{":
                                    brace_count += 1
                                elif thought_part[i] == "}":
                                    brace_count -= 1
                                    if brace_count == 0:
                                        end_idx = i + 1
                                        break
                            
                            if end_idx > start_idx:
                                potential_json = thought_part[start_idx:end_idx]
                                logger.debug(f"Extracted potential JSON: {potential_json[:200]}...")
                                try:
                                    import json
                                    json.loads(potential_json)
                                    output = potential_json
                                    logger.info(f"✅ Extracted valid JSON from ReAct error (Thought section): {output[:100]}...")
                                except json.JSONDecodeError as json_err:
                                    logger.debug(f"JSON decode failed: {json_err}")
                    
                    # Also try looking for the pattern "after 'Thought:{" which is common in ReAct errors
                    if not output and "after 'Thought:{" in error_str:
                        logger.debug("Found ReAct format error pattern")
                        # Extract everything after "after 'Thought:{"
                        start_marker = "after 'Thought:{"
                        start_pos = error_str.find(start_marker)
                        if start_pos >= 0:
                            # Start from the opening brace
                            json_start = start_pos + len(start_marker) - 1  # -1 to include the {
                            json_part = error_str[json_start:]
                            logger.debug(f"JSON part from ReAct error: {json_part[:500]}...")
                            
                            if "{" in json_part and "}" in json_part:
                                # Find the matching closing brace
                                brace_count = 0
                                end_idx = -1
                                for i in range(len(json_part)):
                                    if json_part[i] == "{":
                                        brace_count += 1
                                    elif json_part[i] == "}":
                                        brace_count -= 1
                                        if brace_count == 0:
                                            end_idx = i + 1
                                            break
                                
                                if end_idx > 0:
                                    potential_json = json_part[:end_idx]
                                    logger.debug(f"Extracted potential JSON from ReAct pattern: {potential_json[:200]}...")
                                    try:
                                        import json
                                        json.loads(potential_json)
                                        output = potential_json
                                        logger.info(f"✅ Extracted valid JSON from ReAct pattern: {output[:100]}...")
                                    except json.JSONDecodeError as json_err:
                                        logger.debug(f"ReAct pattern JSON decode failed: {json_err}")
                    
                    # NEW: Try the exact pattern from the test output: "Missing 'Action:' after 'Thought:{JSON}"
                    if not output and "Missing 'Action:' after 'Thought:{" in error_str:
                        logger.debug("Found exact ReAct missing Action pattern")
                        # Find the start of JSON after "Missing 'Action:' after 'Thought:{"
                        start_marker = "Missing 'Action:' after 'Thought:{"
                        start_pos = error_str.find(start_marker)
                        if start_pos >= 0:
                            # Start from the opening brace
                            json_start = start_pos + len(start_marker) - 1  # -1 to include the {
                            json_part = error_str[json_start:]
                            logger.debug(f"JSON part from missing Action error: {json_part[:500]}...")
                            
                            # Find the complete JSON object
                            if "{" in json_part:
                                brace_count = 0
                                end_idx = -1
                                for i in range(len(json_part)):
                                    if json_part[i] == "{":
                                        brace_count += 1
                                    elif json_part[i] == "}":
                                        brace_count -= 1
                                        if brace_count == 0:
                                            end_idx = i + 1
                                            break
                                
                                if end_idx > 0:
                                    potential_json = json_part[:end_idx]
                                    logger.debug(f"Extracted JSON from missing Action pattern: {potential_json[:200]}...")
                                    try:
                                        import json
                                        json.loads(potential_json)
                                        output = potential_json
                                        logger.info(f"✅ Extracted valid JSON from missing Action pattern: {output[:100]}...")
                                    except json.JSONDecodeError as json_err:
                                        logger.debug(f"Missing Action pattern JSON decode failed: {json_err}")
                    
                    # If not found in Thought section, try general extraction
                    if not output:
                        logger.debug("Trying general JSON extraction from error message")
                        start_idx = error_str.find("{")
                        end_idx = error_str.rfind("}") + 1
                        if start_idx >= 0 and end_idx > start_idx:
                            potential_json = error_str[start_idx:end_idx]
                            logger.debug(f"General extraction potential JSON: {potential_json[:200]}...")
                            try:
                                import json
                                json.loads(potential_json)
                                output = potential_json
                                logger.info(f"✅ Extracted valid JSON from error message: {output[:100]}...")
                            except json.JSONDecodeError as json_err:
                                logger.debug(f"General JSON decode failed: {json_err}")
                else:
                    logger.debug("No JSON braces found in error message")
                
                # If no JSON in error, try to extract from intermediate steps
                if not output and hasattr(self, 'reasoning_steps') and self.reasoning_steps:
                    # Look for JSON in the last reasoning step
                    for step in reversed(self.reasoning_steps):
                        step_text = step.get('observation', '') + step.get('thought', '')
                        if "{" in step_text and "}" in step_text:
                            # Try to extract JSON from step
                            start_idx = step_text.find("{")
                            end_idx = step_text.rfind("}") + 1
                            if start_idx >= 0 and end_idx > start_idx:
                                potential_json = step_text[start_idx:end_idx]
                                # Validate it's JSON
                                try:
                                    import json
                                    json.loads(potential_json)
                                    output = potential_json
                                    logger.info(f"✅ Extracted valid JSON from reasoning steps: {output[:100]}...")
                                    break
                                except json.JSONDecodeError:
                                    continue
                
                # Try to extract from agent_executor result if available
                if not output and hasattr(e, 'args') and e.args:
                    for arg in e.args:
                        if isinstance(arg, str) and "{" in arg and "}" in arg:
                            start_idx = arg.find("{")
                            end_idx = arg.rfind("}") + 1
                            if start_idx >= 0 and end_idx > start_idx:
                                potential_json = arg[start_idx:end_idx]
                                try:
                                    import json
                                    json.loads(potential_json)
                                    output = potential_json
                                    logger.info(f"✅ Extracted valid JSON from exception args: {output[:100]}...")
                                    break
                                except json.JSONDecodeError:
                                    continue
                
                    # Also try looking for the pattern "Parsing LLM output produced both a final answer and a parse-able action"
                    if not output and ("both a final answer and a parse-able action" in error_str or "Could not parse LLM output" in error_str):
                        logger.debug("Found ReAct conflicting output/parsing pattern")
                        # Try to find any JSON object in the entire error string
                        import re
                        # This matches the outermost JSON object
                        json_matches = list(re.finditer(r'\{.*\}', error_str, re.DOTALL))
                        if json_matches:
                            # Try from the last match backwards as it's more likely to be the final answer
                            for match in reversed(json_matches):
                                potential_json = match.group(0)
                                # Validate matching braces manually to handle nested JSON
                                brace_count = 0
                                first_brace = potential_json.find('{')
                                last_brace = -1
                                for i in range(first_brace, len(potential_json)):
                                    if potential_json[i] == '{':
                                        brace_count += 1
                                    elif potential_json[i] == '}':
                                        brace_count -= 1
                                        if brace_count == 0:
                                            last_brace = i + 1
                                            break
                                
                                if last_brace > first_brace:
                                    clean_json = potential_json[first_brace:last_brace]
                                    try:
                                        import json
                                        json.loads(clean_json)
                                        output = clean_json
                                        logger.info(f"✅ Extracted valid JSON from conflicted ReAct output: {output[:100]}...")
                                        break
                                    except json.JSONDecodeError:
                                        continue
            except Exception as extract_error:
                logger.debug(f"Could not extract output from error: {extract_error}")

            return {
                "output": output,
                "reasoning_steps": getattr(self, 'reasoning_steps', []),
                "execution_time_ms": execution_time_ms,
                "status": "error",
                "error": str(e),
            }

    def _extract_reasoning_steps(self, intermediate_steps: List[tuple]) -> List[Dict[str, Any]]:
        """
        Extract and format reasoning steps from agent execution.
        """
        reasoning = []

        for i, (action, observation) in enumerate(intermediate_steps):
            # Handle different action types (AgentAction object vs string)
            if isinstance(action, str):
                step = {
                    "step_number": i + 1,
                    "tool": "unknown",
                    "tool_input": action,
                    "thought": "",
                    "observation": str(observation)[:500],
                }
            else:
                # AgentAction object with attributes
                step = {
                    "step_number": i + 1,
                    "tool": getattr(action, 'tool', getattr(action, 'name', 'unknown')),
                    "tool_input": getattr(action, 'tool_input', getattr(action, 'input', str(action))),
                    "thought": getattr(action, 'log', getattr(action, 'thought', '')),
                    "observation": str(observation)[:500],
                }
            reasoning.append(step)

        return reasoning

    def reset(self):
        """Reset agent state for new execution."""
        self.reasoning_steps = []
        self.agent_executor = None
