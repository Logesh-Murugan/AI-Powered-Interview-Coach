"""
Groq AI Provider Implementation
"""
import asyncio
from typing import Optional, Dict, Any
from groq import Groq, AsyncGroq
from loguru import logger

from .base_provider import AIProvider
from .types import ProviderConfig, ProviderResponse, ProviderType


class GroqProvider(AIProvider):
    """
    Groq AI provider implementation.
    
    Uses Groq's mixtral-8x7b-32768 model for fast inference.
    Priority: 1 (highest)
    Quota: 14,400 requests/day
    Timeout: 10 seconds
    """
    
    def __init__(self, api_key: str, config: Optional[ProviderConfig] = None):
        """
        Initialize Groq provider.
        
        Args:
            api_key: Groq API key
            config: Optional provider configuration (uses defaults if not provided)
        """
        if config is None:
            config = ProviderConfig(
                name="groq",
                provider_type=ProviderType.GROQ,
                api_key=api_key,
                api_url="https://api.groq.com/openai/v1",
                model="llama-3.3-70b-versatile",  # Updated to current model
                priority=1,
                quota_limit=14400,  # 14,400 requests/day
                timeout=10,
                max_retries=3
            )
        
        super().__init__(config)
        
        # Initialize Groq client
        self.client = AsyncGroq(api_key=api_key)
        self.sync_client = Groq(api_key=api_key)
        
        logger.info(
            f"Groq provider initialized with model {config.model}, "
            f"priority {config.priority}, quota {config.quota_limit}/day"
        )
    
    async def call(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        **kwargs
    ) -> ProviderResponse:
        """
        Make an API call to Groq.
        
        Args:
            prompt: The prompt to send to the AI
            temperature: Sampling temperature (0.0 to 2.0)
            max_tokens: Maximum tokens to generate
            **kwargs: Additional Groq-specific parameters
            
        Returns:
            ProviderResponse with the AI's response
            
        Raises:
            Exception: If the API call fails
        """
        try:
            logger.debug(f"Calling Groq API with prompt length: {len(prompt)}")
            
            # Make API call with timeout
            response = await asyncio.wait_for(
                self.client.chat.completions.create(
                    model=self.config.model,
                    messages=[
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature=temperature,
                    max_tokens=max_tokens,
                    **kwargs
                ),
                timeout=self.config.timeout
            )
            
            # Extract response content
            content = response.choices[0].message.content
            
            # Get token usage
            tokens_used = None
            if hasattr(response, 'usage') and response.usage:
                tokens_used = response.usage.total_tokens
            
            logger.debug(
                f"Groq API call successful, "
                f"tokens used: {tokens_used}, "
                f"response length: {len(content)}"
            )
            
            return ProviderResponse(
                provider_name=self.config.name,
                content=content,
                model=self.config.model,
                success=True,
                tokens_used=tokens_used,
                metadata={
                    'temperature': temperature,
                    'max_tokens': max_tokens,
                    'finish_reason': response.choices[0].finish_reason
                }
            )
            
        except asyncio.TimeoutError:
            error_msg = f"Groq API call timed out after {self.config.timeout}s"
            logger.error(error_msg)
            raise Exception(error_msg)
            
        except Exception as e:
            error_msg = f"Groq API call failed: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)
    
    def call_sync(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        **kwargs
    ) -> ProviderResponse:
        """
        Synchronous version of call() for non-async contexts.
        
        Args:
            prompt: The prompt to send to the AI
            temperature: Sampling temperature (0.0 to 2.0)
            max_tokens: Maximum tokens to generate
            **kwargs: Additional Groq-specific parameters
            
        Returns:
            ProviderResponse with the AI's response
        """
        try:
            logger.debug(f"Calling Groq API (sync) with prompt length: {len(prompt)}")
            
            response = self.sync_client.chat.completions.create(
                model=self.config.model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=temperature,
                max_tokens=max_tokens,
                timeout=self.config.timeout,
                **kwargs
            )
            
            content = response.choices[0].message.content
            tokens_used = response.usage.total_tokens if hasattr(response, 'usage') else None
            
            return ProviderResponse(
                provider_name=self.config.name,
                content=content,
                model=self.config.model,
                success=True,
                tokens_used=tokens_used,
                metadata={
                    'temperature': temperature,
                    'max_tokens': max_tokens,
                    'finish_reason': response.choices[0].finish_reason
                }
            )
            
        except Exception as e:
            error_msg = f"Groq API call failed: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)


def create_groq_provider(api_key: str) -> GroqProvider:
    """
    Factory function to create a Groq provider with default configuration.
    
    Args:
        api_key: Groq API key
        
    Returns:
        Configured GroqProvider instance
    """
    return GroqProvider(api_key=api_key)
