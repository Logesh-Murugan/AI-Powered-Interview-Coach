"""
Tests for base agent infrastructure

Requirements: 27.4, 27.6, 27.11, 27.12
"""
import pytest
from unittest.mock import Mock, patch
from langchain_core.tools import Tool
from langchain_core.prompts import PromptTemplate

from app.services.agents.base_agent import BaseAgent


class TestAgent(BaseAgent):
    """Test agent implementation"""
    
    def _register_tools(self):
        """Register test tools"""
        def test_tool(input_str: str) -> str:
            return f"Processed: {input_str}"
        
        return [
            Tool(
                name="test_tool",
                description="A test tool",
                func=test_tool
            )
        ]
    
    def _get_prompt_template(self):
        """Get test prompt template"""
        template = """Test agent with tools.

Tools available:
{tools}

Tool names: {tool_names}

Question: {input}
Thought: {agent_scratchpad}"""
        
        return PromptTemplate(
            template=template,
            input_variables=["input", "tools", "tool_names", "agent_scratchpad"]
        )


class TestBaseAgent:
    """Test suite for BaseAgent"""
    
    def test_agent_initialization(self):
        """Test agent can be initialized"""
        agent = TestAgent(
            max_iterations=5,
            max_execution_time=10.0,
            verbose=False
        )
        
        assert agent.max_iterations == 5
        assert agent.max_execution_time == 10.0
        assert agent.verbose is False
        assert agent.llm is not None
        assert agent.tools == []
        assert agent.agent_executor is None
    
    def test_llm_initialization(self):
        """Test LLM is initialized correctly"""
        agent = TestAgent()
        
        assert agent.llm is not None
        assert agent.llm.model_name == "mixtral-8x7b-32768"
    
    def test_tool_registration(self):
        """Test tools are registered"""
        agent = TestAgent()
        agent.initialize_agent()
        
        assert len(agent.tools) == 1
        assert agent.tools[0].name == "test_tool"
    
    def test_agent_executor_creation(self):
        """Test agent executor is created"""
        agent = TestAgent()
        agent.initialize_agent()
        
        assert agent.agent_executor is not None
    
    def test_timeout_configuration(self):
        """Test timeout is configured correctly (Req 27.11)"""
        agent = TestAgent(max_execution_time=20.0)
        agent.initialize_agent()
        
        assert agent.max_execution_time == 20.0
        assert agent.agent_executor.max_execution_time == 20.0
    
    def test_max_iterations_configuration(self):
        """Test max iterations is configured (Req 27.6)"""
        agent = TestAgent(max_iterations=10)
        agent.initialize_agent()
        
        assert agent.max_iterations == 10
        assert agent.agent_executor.max_iterations == 10
    
    def test_reasoning_steps_initialization(self):
        """Test reasoning steps are initialized (Req 27.12)"""
        agent = TestAgent()
        
        assert agent.reasoning_steps == []
    
    def test_reset_clears_state(self):
        """Test reset clears agent state"""
        agent = TestAgent()
        agent.initialize_agent()
        agent.reasoning_steps = [{'step': 1}]
        
        agent.reset()
        
        assert agent.reasoning_steps == []
        assert agent.agent_executor is None
    
    def test_extract_reasoning_steps(self):
        """Test reasoning step extraction (Req 27.12)"""
        agent = TestAgent()
        
        # Mock intermediate steps
        mock_action = Mock()
        mock_action.tool = "test_tool"
        mock_action.tool_input = {"input": "test"}
        mock_action.log = "I should use the test tool"
        
        intermediate_steps = [
            (mock_action, "Tool output")
        ]
        
        reasoning = agent._extract_reasoning_steps(intermediate_steps)
        
        assert len(reasoning) == 1
        assert reasoning[0]['step_number'] == 1
        assert reasoning[0]['tool'] == "test_tool"
        assert reasoning[0]['tool_input'] == {"input": "test"}
        assert reasoning[0]['thought'] == "I should use the test tool"
        assert reasoning[0]['observation'] == "Tool output"
    
    def test_execute_returns_correct_structure(self):
        """Test execute returns correct result structure"""
        agent = TestAgent()
        
        with patch.object(agent, 'initialize_agent'):
            with patch.object(agent, 'agent_executor') as mock_executor:
                mock_executor.invoke.return_value = {
                    'output': 'Test output',
                    'intermediate_steps': []
                }
                
                result = agent.execute({'input': 'test'})
                
                assert 'output' in result
                assert 'reasoning_steps' in result
                assert 'execution_time_ms' in result
                assert 'status' in result
                assert result['status'] == 'success'
    
    def test_execute_handles_timeout(self):
        """Test execute handles timeout (Req 27.11)"""
        agent = TestAgent()
        
        with patch.object(agent, 'initialize_agent'):
            with patch.object(agent, 'agent_executor') as mock_executor:
                mock_executor.invoke.side_effect = TimeoutError("Execution timeout")
                
                result = agent.execute({'input': 'test'})
                
                assert result['status'] == 'timeout'
                assert 'error' in result
                assert 'execution_time_ms' in result
    
    def test_execute_handles_error(self):
        """Test execute handles general errors"""
        agent = TestAgent()
        
        with patch.object(agent, 'initialize_agent'):
            with patch.object(agent, 'agent_executor') as mock_executor:
                mock_executor.invoke.side_effect = Exception("Test error")
                
                result = agent.execute({'input': 'test'})
                
                assert result['status'] == 'error'
                assert 'error' in result
                assert result['error'] == "Test error"
    
    def test_no_tools_raises_error(self):
        """Test agent with no tools raises error"""
        class NoToolsAgent(BaseAgent):
            def _register_tools(self):
                return []
            
            def _get_prompt_template(self):
                return PromptTemplate(
                    template="Test: {input}",
                    input_variables=["input"]
                )
        
        agent = NoToolsAgent()
        
        with pytest.raises(ValueError, match="at least one tool"):
            agent.initialize_agent()
