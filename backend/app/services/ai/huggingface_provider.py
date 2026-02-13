"""
HuggingFace AI Provider Implementation
"""
from typing import Optional, Dict, Any
from loguru import logger
from huggingface_hub import InferenceClient

from .base_provider import AIProvider
from .types import ProviderConfig, ProviderResponse, ProviderType


class HuggingFaceProvider(AIProvider):
    """
    HuggingFace AI provider implementation.
    
    Uses HuggingFace InferenceClient for chat completion.
    Priority: 3 (tertiary)
    Quota: Rate limited by free tier
    Timeout: 30 seconds
    """
    
    def __init__(self, config: ProviderConfig):
        """
        Initialize HuggingFace provider.
        
        Args:
            config: Provider configuration
        """
        super().__init__(config)
        
        self.api_key = config.api_key
        self.client = InferenceClient(token=config.api_key)
        
        logger.info(
            f"HuggingFace provider initialized with model {config.model}, "
            f"priority {config.priority}, using InferenceClient"
        )
    
    async def call(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        **kwargs
    ) -> ProviderResponse:
        """
        Make an API call to HuggingFace using InferenceClient.
        
        Args:
            prompt: The prompt to send to the AI
            temperature: Sampling temperature (0.0 to 2.0)
            max_tokens: Maximum tokens to generate
            **kwargs: Additional HuggingFace-specific parameters
            
        Returns:
            ProviderResponse with the AI's response
            
        Raises:
            Exception: If the API call fails
        """
        try:
            logger.debug(f"Calling HuggingFace API with prompt length: {len(prompt)}")
            
            # Prepare messages in chat format
            messages = [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            # Make API call using InferenceClient
            response = self.client.chat_completion(
                messages=messages,
                model=self.config.model,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            
            # Extract response content
            if hasattr(response, 'choices') and len(response.choices) > 0:
                content = response.choices[0].message.content
            else:
                raise Exception(f"Unexpected response format: {response}")
            
            # Get token usage if available
            tokens_used = None
            if hasattr(response, 'usage') and response.usage:
                tokens_used = response.usage.total_tokens
            
            logger.debug(
                f"HuggingFace API call successful, "
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
                    'finish_reason': response.choices[0].finish_reason if hasattr(response.choices[0], 'finish_reason') else 'stop'
                }
            )
            
        except Exception as e:
            error_msg = f"HuggingFace API call failed: {str(e)}"
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
            **kwargs: Additional HuggingFace-specific parameters
            
        Returns:
            ProviderResponse with the AI's response
        """
        try:
            logger.debug(f"Calling HuggingFace API (sync) with prompt length: {len(prompt)}")
            
            # Prepare messages in chat format
            messages = [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            # Make API call using InferenceClient (it's synchronous by default)
            response = self.client.chat_completion(
                messages=messages,
                model=self.config.model,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            
            # Extract response content
            if hasattr(response, 'choices') and len(response.choices) > 0:
                content = response.choices[0].message.content
            else:
                raise Exception(f"Unexpected response format: {response}")
            
            # Get token usage if available
            tokens_used = None
            if hasattr(response, 'usage') and response.usage:
                tokens_used = response.usage.total_tokens
            
            return ProviderResponse(
                provider_name=self.config.name,
                content=content,
                model=self.config.model,
                success=True,
                tokens_used=tokens_used,
                metadata={
                    'temperature': temperature,
                    'max_tokens': max_tokens,
                    'finish_reason': response.choices[0].finish_reason if hasattr(response.choices[0], 'finish_reason') else 'stop'
                }
            )
            
        except Exception as e:
            error_msg = f"HuggingFace API call failed: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)


def create_huggingface_provider(api_key: str) -> HuggingFaceProvider:
    """
    Factory function to create a HuggingFace provider with default configuration.
    
    Args:
        api_key: HuggingFace API token
        
    Returns:
        Configured HuggingFaceProvider instance
    """
    return HuggingFaceProvider(api_key=api_key)
