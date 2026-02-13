# TASK-023: AI Provider Base Classes - COMPLETE ✅

## Task Overview
**Priority**: P0 | **Effort**: 3h | **Owner**: Backend | **Sprint**: 4

Create base classes and interfaces for AI providers to enable multi-provider AI integration with intelligent routing and fallback.

## Implementation Summary

### Files Created

1. **`backend/app/services/ai/__init__.py`**
   - Package initialization
   - Exports for base classes and types

2. **`backend/app/services/ai/types.py`** (250+ lines)
   - `ProviderType` enum (GROQ, GEMINI, HUGGINGFACE, OLLAMA)
   - `ProviderConfig` dataclass with validation
   - `ProviderResponse` dataclass
   - `ProviderHealth` dataclass with automatic health scoring

3. **`backend/app/services/ai/base_provider.py`** (200+ lines)
   - `AIProvider` abstract base class
   - Health tracking and scoring
   - Quota management
   - Automatic metrics collection

4. **`backend/tests/test_ai_base_provider.py`** (27 comprehensive tests)
   - Config validation tests
   - Response handling tests
   - Health tracking tests
   - Provider interface tests

## Key Features Implemented

### 1. Provider Configuration (`ProviderConfig`)
```python
@dataclass
class ProviderConfig:
    name: str
    provider_type: ProviderType
    api_key: Optional[str] = None
    api_url: Optional[str] = None
    model: str = ""
    priority: int = 1  # 1 = highest, 10 = lowest
    quota_limit: int = 0  # 0 = unlimited
    timeout: int = 10
    max_retries: int = 3
    enabled: bool = True
```

**Features**:
- Validation for priority (1-10), timeout (>= 1s), quota (>= 0)
- Support for both API-based and local providers
- Flexible configuration per provider

### 2. Provider Response (`ProviderResponse`)
```python
@dataclass
class ProviderResponse:
    provider_name: str
    content: str
    model: str
    success: bool = True
    error: Optional[str] = None
    tokens_used: Optional[int] = None
    response_time: float = 0.0
    timestamp: datetime
    metadata: Dict[str, Any]
```

**Features**:
- Standardized response format across all providers
- Success/error tracking
- Token usage tracking
- Response time measurement
- Extensible metadata

### 3. Provider Health (`ProviderHealth`)
```python
@dataclass
class ProviderHealth:
    provider_name: str
    is_healthy: bool = True
    health_score: float = 1.0  # 0.0 to 1.0
    consecutive_failures: int = 0
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    average_response_time: float = 0.0
    quota_remaining: float = 1.0
```

**Health Score Calculation**:
```
health_score = (
    success_rate * 0.5 +
    response_time_score * 0.3 +
    quota_remaining * 0.2 -
    failure_penalty
)
```

**Features**:
- Automatic health score calculation
- Exponential moving average for response time
- Consecutive failure tracking
- Marks unhealthy after 5 consecutive failures

### 4. AI Provider Base Class (`AIProvider`)

**Abstract Methods**:
- `async def call(prompt: str, **kwargs) -> ProviderResponse`

**Implemented Methods**:
- `async def call_with_tracking()` - Wraps call() with automatic health tracking
- `def get_health_score()` - Returns current health score (0.0-1.0)
- `def check_quota()` - Checks if quota is available
- `def is_healthy()` - Comprehensive health check
- `def get_health_status()` - Detailed health metrics
- `def reset_health()` - Reset all health metrics
- `def update_quota_remaining()` - Update quota percentage

**Health Check Logic**:
A provider is unhealthy if:
- Disabled in configuration
- Quota exhausted
- 5+ consecutive failures
- Health score < 0.3

## Test Results

### All 27 Tests Passing ✅

**Test Coverage**:
- `TestProviderConfig` (4 tests) - Configuration and validation
- `TestProviderResponse` (3 tests) - Response handling
- `TestProviderHealth` (7 tests) - Health tracking and scoring
- `TestAIProvider` (13 tests) - Provider interface and methods

**Key Test Scenarios**:
- ✅ Config validation (priority, timeout, quota)
- ✅ Response creation and serialization
- ✅ Health score calculation
- ✅ Success/failure tracking
- ✅ Consecutive failure handling
- ✅ Average response time calculation
- ✅ Quota management
- ✅ Provider health checks
- ✅ Async call tracking

## Architecture Design

### Provider Hierarchy
```
AIProvider (Abstract Base Class)
    ├── GroqProvider (TASK-024)
    ├── GeminiProvider (TASK-025)
    ├── HuggingFaceProvider (TASK-025)
    └── OllamaProvider (TASK-025)
```

### Health Tracking Flow
```
1. Provider.call_with_tracking(prompt)
   ↓
2. Measure start time
   ↓
3. Call provider.call(prompt)
   ↓
4. Measure response time
   ↓
5. Update health metrics
   - Success: update_success(response_time)
   - Failure: update_failure()
   ↓
6. Recalculate health score
   ↓
7. Return ProviderResponse
```

### Health Score Components
- **Success Rate (50%)**: successful_requests / total_requests
- **Response Time (30%)**: Faster is better (1s ideal, 10s poor)
- **Quota Remaining (20%)**: Percentage of quota left
- **Failure Penalty**: -0.1 per consecutive failure (max -0.5)

## Acceptance Criteria - ALL MET ✅

- [x] **AIProvider ABC created**
  - Abstract base class with `call()` method
  - All providers must extend this class

- [x] **Interface methods defined**
  - `call()` - Abstract method for API calls
  - `get_health_score()` - Returns health score
  - `check_quota()` - Checks quota availability
  - `is_healthy()` - Comprehensive health check

- [x] **Type hints for all methods**
  - All methods have proper type annotations
  - Using Python 3.10+ type hints
  - Optional types where appropriate

- [x] **Dataclasses for responses**
  - `ProviderConfig` - Configuration
  - `ProviderResponse` - API responses
  - `ProviderHealth` - Health metrics
  - All with proper validation

## Usage Example

```python
from app.services.ai.base_provider import AIProvider
from app.services.ai.types import ProviderConfig, ProviderType, ProviderResponse

# Create a provider (example with mock)
class MyProvider(AIProvider):
    async def call(self, prompt: str, **kwargs) -> ProviderResponse:
        # Implement API call logic
        response = await make_api_call(prompt)
        return ProviderResponse(
            provider_name=self.config.name,
            content=response.text,
            model=self.config.model,
            success=True,
            tokens_used=response.tokens
        )

# Configure provider
config = ProviderConfig(
    name="my-provider",
    provider_type=ProviderType.GROQ,
    api_key="sk-...",
    model="mixtral-8x7b-32768",
    priority=1,
    quota_limit=14400,
    timeout=10
)

# Initialize provider
provider = MyProvider(config)

# Make a call with automatic health tracking
response = await provider.call_with_tracking("Generate a question about Python")

# Check health
if provider.is_healthy():
    print(f"Provider healthy: {provider.get_health_score():.2f}")
else:
    print("Provider unhealthy, using fallback")

# Get detailed health status
status = provider.get_health_status()
print(f"Total requests: {status['total_requests']}")
print(f"Success rate: {status['successful_requests'] / status['total_requests']:.2%}")
```

## Benefits of This Design

### 1. **Extensibility**
- Easy to add new providers (just extend `AIProvider`)
- Consistent interface across all providers
- Provider-specific logic isolated in subclasses

### 2. **Reliability**
- Automatic health tracking
- Circuit breaker pattern ready
- Intelligent fallback support

### 3. **Observability**
- Detailed metrics per provider
- Health scores for routing decisions
- Request/response tracking

### 4. **Flexibility**
- Support for API-based and local providers
- Configurable priorities and quotas
- Per-provider timeout and retry settings

### 5. **Testability**
- Abstract base class easy to mock
- Comprehensive test coverage
- Health metrics verifiable

## Next Steps

### TASK-024: Groq Provider Implementation
- Implement `GroqProvider` extending `AIProvider`
- Integrate Groq API with mixtral-8x7b-32768 model
- Priority 1, quota 14,400 requests/day
- 10-second timeout

### TASK-025: Other Providers
- Implement `GeminiProvider` (priority 2)
- Implement `HuggingFaceProvider` (priority 3)
- Implement `OllamaProvider` (priority 4, unlimited)

### TASK-026: Circuit Breaker
- Implement circuit breaker pattern
- Integrate with provider health checks
- Automatic provider disabling/enabling

### TASK-027: AI Orchestrator
- Intelligent provider selection
- Automatic fallback chain
- Load balancing and routing

## Technical Decisions

### Why Dataclasses?
- Clean, readable code
- Automatic `__init__`, `__repr__`, `__eq__`
- Type hints built-in
- Easy serialization with `to_dict()`

### Why Abstract Base Class?
- Enforces interface contract
- Prevents instantiation of base class
- Clear inheritance hierarchy
- IDE support for abstract methods

### Why Health Scoring?
- Enables intelligent routing
- Automatic degradation handling
- Better than binary healthy/unhealthy
- Supports weighted provider selection

### Why Async?
- Non-blocking API calls
- Better performance with multiple providers
- Supports concurrent requests
- Future-proof for high load

## Dependencies
- ✅ TASK-001 (Backend Project Initialization) - Complete

## Files Summary

| File | Lines | Purpose |
|------|-------|---------|
| `types.py` | 250+ | Type definitions and dataclasses |
| `base_provider.py` | 200+ | Abstract base class |
| `test_ai_base_provider.py` | 400+ | Comprehensive tests |
| **Total** | **850+** | **Foundation for AI integration** |

---

**Status**: ✅ COMPLETE  
**Date Completed**: 2026-02-10  
**Tests**: 27/27 passing  
**Ready for**: TASK-024 (Groq Provider Implementation)
