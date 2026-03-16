"""
HuggingFace Router Provider (OpenAI-compatible chat)
"""

import asyncio
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


class HuggingFaceProvider(AIProvider):
    """
    HuggingFace Router (openai-compatible) provider.
    """

    def __init__(
        self,
        api_key: str,
        model: str = "meta-llama/Meta-Llama-3-8B-Instruct",
        priority: int = 1,
        name: Optional[str] = None,
    ):
        model_short = model.split("/")[-1][:20]
        provider_name = name or f"hf_{model_short}"

        config = ProviderConfig(
            name=provider_name,
            provider_type=ProviderType.HUGGINGFACE,
            api_key=api_key,
            api_url="https://router.huggingface.co/v1/chat/completions",
            model=model,
            priority=priority,
            quota_limit=999_999,
            timeout=60,
            max_retries=3,
            enabled=True,
        )
        super().__init__(config)
        logger.info(f"✅ HuggingFace initialized: {provider_name} ({model})")

    async def _call_api(
        self,
        prompt: str,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        **kwargs,
    ) -> ProviderResponse:
        start_time = datetime.now()
        max_retries = 3
        retry_delay = 8

        for attempt in range(max_retries):
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
                            content=content.strip(),
                            model=data.get("model", self.config.model),
                            success=True,
                            tokens_used=tokens,
                            response_time=response_time,
                            timestamp=datetime.now(),
                        )

                    if response.status_code in (429, 503) and attempt < max_retries - 1:
                        logger.info(f"HF router busy, waiting {retry_delay}s...")
                        await asyncio.sleep(retry_delay)
                        continue

                    error_msg = f"HTTP {response.status_code}: {response.text[:200]}"
                    if response.status_code >= 500 and attempt < max_retries - 1:
                        await asyncio.sleep(5)
                        continue

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
                if attempt < max_retries - 1:
                    await asyncio.sleep(5)
                    continue
                response_time = (datetime.now() - start_time).total_seconds()
                return ProviderResponse(
                    provider_name=self.config.name,
                    content="",
                    model=self.config.model,
                    success=False,
                    error=str(e),
                    response_time=response_time,
                    timestamp=datetime.now(),
                )

        return ProviderResponse(
            provider_name=self.config.name,
            content="",
            model=self.config.model,
            success=False,
            error="All retries failed",
            response_time=(datetime.now() - start_time).total_seconds(),
            timestamp=datetime.now(),
        )
