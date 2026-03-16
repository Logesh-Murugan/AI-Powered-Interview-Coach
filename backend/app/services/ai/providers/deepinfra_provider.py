"""
DeepInfra Provider - Fast, reliable AI inference

Benefits:
- Completely FREE for open-source models
- 500 requests/minute per account
- Fast GPU inference
- No bans or restrictions

Sign up: https://deepinfra.com/
Docs: https://deepinfra.com/docs
"""

from datetime import datetime
from typing import Optional
import httpx
from loguru import logger

try:
    from ..base_provider import AIProvider
    from ..types import ProviderConfig, ProviderResponse, ProviderType
except ImportError:
    from app.services.ai.base_provider import AIProvider
    from app.services.ai.types import ProviderConfig, ProviderResponse, ProviderType


class DeepInfraProvider(AIProvider):
    """
    DeepInfra AI Provider

    Free models (recommended):
    - meta-llama/Meta-Llama-3-8B-Instruct (Best quality)
    - mistralai/Mistral-7B-Instruct-v0.2 (Fast)
    - microsoft/WizardLM-2-8x22B (Powerful)
    """

    def __init__(
        self,
        api_key: str,
        model: str = "meta-llama/Meta-Llama-3-8B-Instruct",
        priority: int = 1,
        name: Optional[str] = None,
    ):
        """Initialize DeepInfra provider"""
        model_short = model.split("/")[-1][:20]
        provider_name = name or f"deepinfra_{model_short}"

        config = ProviderConfig(
            name=provider_name,
            provider_type=ProviderType.DEEPINFRA,
            api_key=api_key,
            api_url="https://api.deepinfra.com/v1/openai/chat/completions",
            model=model,
            priority=priority,
            quota_limit=500 * 60,  # 500 RPM per account
            timeout=30,
            max_retries=2,
            enabled=True,
        )

        super().__init__(config)
        logger.info(f"✅ DeepInfra initialized: {provider_name} ({model})")

    async def _call_api(
        self,
        prompt: str,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        **kwargs,
    ) -> ProviderResponse:
        """Make API call to DeepInfra"""
        start_time = datetime.now()

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.config.api_url,
                    headers={
                        "Authorization": f"Bearer {self.config.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.config.model,
                        "messages": [
                            {"role": "system", "content": "You are a helpful AI assistant."},
                            {"role": "user", "content": prompt},
                        ],
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                        "stream": False,
                    },
                    timeout=self.config.timeout,
                )

                response_time = (datetime.now() - start_time).total_seconds()

                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    tokens = data.get("usage", {}).get("total_tokens", 0)

                    return ProviderResponse(
                        provider_name=self.config.name,
                        content=content,
                        model=self.config.model,
                        success=True,
                        tokens_used=tokens,
                        response_time=response_time,
                        timestamp=datetime.now(),
                    )

                error_msg = f"HTTP {response.status_code}: {response.text[:200]}"
                logger.error(f"DeepInfra error: {error_msg}")
                return ProviderResponse(
                    provider_name=self.config.name,
                    content="",
                    model=self.config.model,
                    success=False,
                    error=error_msg,
                    response_time=response_time,
                    timestamp=datetime.now(),
                )

        except Exception as e:
            response_time = (datetime.now() - start_time).total_seconds()
            error_msg = f"Exception: {str(e)}"
            logger.error(f"DeepInfra exception: {error_msg}")
            return ProviderResponse(
                provider_name=self.config.name,
                content="",
                model=self.config.model,
                success=False,
                error=error_msg,
                response_time=response_time,
                timestamp=datetime.now(),
            )
