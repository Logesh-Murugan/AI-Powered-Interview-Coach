"""
OpenRouter Provider - Access 100+ AI models through one API

Benefits:
- $5 free credit on signup (create 3 accounts = $15 total)
- Many FREE community models (unlimited usage)
- No bans or restrictions
- One API for GPT, Claude, Llama, Mistral, etc.

Sign up: https://openrouter.ai/
Docs: https://openrouter.ai/docs
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


class OpenRouterProvider(AIProvider):
    """
    OpenRouter AI Provider - Multi-model access

    Free models (recommended):
    - meta-llama/llama-3.2-3b-instruct:free (Fast & reliable)
    - google/gemma-2-9b-it:free (Good quality)
    - mistralai/mistral-7b-instruct:free (Consistent)
    """

    def __init__(
        self,
        api_key: str,
        model: str = "meta-llama/llama-3.2-3b-instruct:free",
        priority: int = 1,
        name: Optional[str] = None,
    ):
        """Initialize OpenRouter provider"""
        model_short = model.split("/")[-1].replace(":free", "")[:20]
        provider_name = name or f"openrouter_{model_short}"

        config = ProviderConfig(
            name=provider_name,
            provider_type=ProviderType.OPENROUTER,
            api_key=api_key,
            api_url="https://openrouter.ai/api/v1/chat/completions",
            model=model,
            priority=priority,
            quota_limit=999_999,
            timeout=60,
            max_retries=3,
            enabled=True,
        )

        super().__init__(config)
        logger.info(f"✅ OpenRouter initialized: {provider_name} ({model})")

    async def _call_api(
        self,
        prompt: str,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        **kwargs,
    ) -> ProviderResponse:
        """Make API call to OpenRouter"""
        start_time = datetime.now()

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.config.api_url,
                    headers={
                        "Authorization": f"Bearer {self.config.api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://interviewmaster.ai",
                        "X-Title": "InterviewMaster AI",
                    },
                    json={
                        "model": self.config.model,
                        "messages": [
                            {"role": "system", "content": "You are a helpful AI assistant."},
                            {"role": "user", "content": prompt},
                        ],
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                        "top_p": 0.95,
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
                        model=data.get("model", self.config.model),
                        success=True,
                        tokens_used=tokens,
                        response_time=response_time,
                        timestamp=datetime.now(),
                    )

                error_msg = f"HTTP {response.status_code}: {response.text[:200]}"
                logger.error(f"OpenRouter error: {error_msg}")
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
            logger.error(f"OpenRouter exception: {error_msg}")
            return ProviderResponse(
                provider_name=self.config.name,
                content="",
                model=self.config.model,
                success=False,
                error=error_msg,
                response_time=response_time,
                timestamp=datetime.now(),
            )
