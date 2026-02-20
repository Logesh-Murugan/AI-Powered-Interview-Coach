"""
Agent Executor Wrapper

Provides high-level interface for executing agents with:
- Automatic fallback handling
- Result validation
- Error recovery
- Caching integration

Requirements: 27.1-27.13
"""
import logging
from typing import Dict, Any, Optional, Callable
from datetime import datetime

from app.services.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


class AgentExecutor:
    """
    High-level wrapper for agent execution.
    
    Provides:
    - Execution with automatic retry
    - Fallback to traditional methods
    - Result validation
    - Error handling
    """
    
    def __init__(
        self,
        agent: BaseAgent,
        fallback_function: Optional[Callable] = None,
        validate_output: Optional[Callable] = None
    ):
        """
        Initialize agent executor.
        
        Args:
            agent: BaseAgent instance to execute
            fallback_function: Function to call if agent fails (optional)
            validate_output: Function to validate agent output (optional)
        """
        self.agent = agent
        self.fallback_function = fallback_function
        self.validate_output = validate_output
    
    def execute_with_fallback(
        self,
        input_data: Dict[str, Any],
        use_fallback_on_timeout: bool = True
    ) -> Dict[str, Any]:
        """
        Execute agent with automatic fallback on failure.
        
        Args:
            input_data: Input data for agent
            use_fallback_on_timeout: Use fallback if agent times out
            
        Returns:
            Dictionary with:
                - output: Agent or fallback output
                - reasoning_steps: Agent reasoning steps
                - execution_time_ms: Execution time
                - status: 'success', 'timeout', 'error', or 'fallback'
                - used_fallback: Boolean indicating if fallback was used
                - error: Error message (if applicable)
        
        Requirements: 27.13
        """
        # Try agent execution
        result = self.agent.execute(input_data)
        
        # Check if we need fallback
        needs_fallback = (
            result['status'] in ['error', 'timeout'] and
            self.fallback_function is not None and
            (use_fallback_on_timeout or result['status'] == 'error')
        )
        
        if needs_fallback:
            logger.warning(
                f"Agent execution {result['status']}, using fallback function"
            )
            
            try:
                # Execute fallback
                fallback_output = self.fallback_function(input_data)
                
                return {
                    'output': fallback_output,
                    'reasoning_steps': result.get('reasoning_steps', []),
                    'execution_time_ms': result.get('execution_time_ms', 0),
                    'status': 'fallback',
                    'used_fallback': True,
                    'original_error': result.get('error')
                }
                
            except Exception as e:
                logger.error(f"Fallback function also failed: {e}")
                
                return {
                    'output': None,
                    'reasoning_steps': result.get('reasoning_steps', []),
                    'execution_time_ms': result.get('execution_time_ms', 0),
                    'status': 'error',
                    'used_fallback': True,
                    'error': f"Agent and fallback both failed: {e}"
                }
        
        # Validate output if validator provided
        if result['status'] == 'success' and self.validate_output:
            try:
                is_valid = self.validate_output(result['output'])
                
                if not is_valid:
                    logger.warning("Agent output failed validation")
                    result['validation_failed'] = True
                    
                    # Try fallback if available
                    if self.fallback_function:
                        logger.info("Using fallback due to validation failure")
                        fallback_output = self.fallback_function(input_data)
                        result['output'] = fallback_output
                        result['status'] = 'fallback'
                        result['used_fallback'] = True
                
            except Exception as e:
                logger.error(f"Output validation error: {e}")
                result['validation_error'] = str(e)
        
        result['used_fallback'] = False
        return result
    
    def execute_with_retry(
        self,
        input_data: Dict[str, Any],
        max_retries: int = 2
    ) -> Dict[str, Any]:
        """
        Execute agent with automatic retry on failure.
        
        Args:
            input_data: Input data for agent
            max_retries: Maximum number of retries
            
        Returns:
            Agent execution result
        """
        last_result = None
        
        for attempt in range(max_retries + 1):
            if attempt > 0:
                logger.info(f"Retrying agent execution (attempt {attempt + 1})")
                self.agent.reset()  # Reset agent state
            
            result = self.agent.execute(input_data)
            last_result = result
            
            # Success - return immediately
            if result['status'] == 'success':
                if attempt > 0:
                    result['retry_count'] = attempt
                return result
            
            # Timeout - don't retry (won't help)
            if result['status'] == 'timeout':
                logger.warning("Agent timeout - not retrying")
                break
        
        # All retries failed
        if last_result:
            last_result['retry_count'] = max_retries
            last_result['all_retries_failed'] = True
        
        return last_result or {
            'output': None,
            'status': 'error',
            'error': 'No result from agent execution'
        }
