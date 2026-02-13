# Design Document: InterviewMaster AI

## Executive Summary

InterviewMaster AI is a production-grade, AI-powered interview preparation platform that combines the speed and cost-efficiency of traditional AI services with the intelligence and personalization of autonomous AI agents. The system is architected to operate sustainably within free-tier API limits while delivering enterprise-quality performance and user experience.

### Key Design Principles

1. **Hybrid AI Architecture**: Intelligent routing between fast, cacheable Traditional AI (90% of requests) and deep-reasoning AI Agents (10% of requests)
2. **Cost Optimization**: Aggressive multi-layer caching achieves 90%+ hit rate, reducing API costs by 95%
3. **Performance First**: All endpoints meet strict performance budgets (<100ms cached, <3s uncached)
4. **Security by Design**: OWASP Top 10 mitigations, encryption at rest and in transit, comprehensive audit logging
5. **Graceful Degradation**: Circuit breakers and fallback mechanisms ensure core functionality during partial outages
6. **Scalability**: Stateless design enables horizontal scaling to 100+ concurrent users

### Technology Stack Summary

- **Backend**: FastAPI (Python 3.11+), SQLAlchemy 2.0, PostgreSQL 15+, Redis 7+, Celery
- **Frontend**: React 18.2+, Vite 5+, Redux Toolkit, Material-UI v5, TypeScript, Tailwind CSS
- **AI Stack**: Groq/Gemini/HuggingFace/Ollama (Traditional AI), LangChain 0.1+ (Agents), spaCy 3.7+, ChromaDB
- **Infrastructure**: Docker, GitHub Actions, Render (staging), Railway (production), Neon/Supabase (PostgreSQL)

### System Capabilities

- **User Management**: Secure authentication with JWT, profile management, session handling
- **Resume Intelligence**: NLP-based parsing, skill extraction, experience analysis, AI agent deep analysis
- **Interview Practice**: Role-based question generation, timed sessions, multi-criteria evaluation
- **Analytics**: Performance tracking, trend analysis, anonymous benchmarking, personalized recommendations
- **Gamification**: Achievement badges, streak tracking, leaderboards
- **AI Agents**: Resume analysis, personalized study plans, company-specific coaching


## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    React Frontend (Vite)                          │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐ │  │
│  │  │   Auth     │  │  Interview │  │ Analytics  │  │   Admin    │ │  │
│  │  │   Pages    │  │   Pages    │  │  Dashboard │  │   Panel    │ │  │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘ │  │
│  │                                                                    │  │
│  │  Redux Store │ React Router │ Material-UI │ Axios │ WebSocket   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS/WSS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY LAYER                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    FastAPI Application                            │  │
│  │                                                                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │  │
│  │  │   Auth      │  │  Interview  │  │   Admin     │             │  │
│  │  │  Middleware │  │   Routes    │  │   Routes    │             │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘             │  │
│  │                                                                    │  │
│  │  Rate Limiter │ CORS │ Security Headers │ Request ID │ Logging   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌──────────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   BUSINESS LOGIC     │  │   AI SERVICES    │  │  ASYNC WORKERS   │
├──────────────────────┤  ├──────────────────┤  ├──────────────────┤
│                      │  │                  │  │                  │
│ ┌──────────────────┐ │  │ ┌──────────────┐ │  │ ┌──────────────┐ │
│ │ User Service     │ │  │ │ AI           │ │  │ │ Celery       │ │
│ │ Resume Service   │ │  │ │ Orchestrator │ │  │ │ Workers      │ │
│ │ Interview Service│ │  │ │              │ │  │ │              │ │
│ │ Analytics Service│ │  │ │ ┌──────────┐ │ │  │ │ - Resume     │ │
│ │ Gamification Svc │ │  │ │ │Traditional│ │ │  │ │   Parsing    │ │
│ └──────────────────┘ │  │ │ │AI Service│ │ │  │ │ - Evaluation │ │
│                      │  │ │ └──────────┘ │ │  │ │ - Email      │ │
│ ┌──────────────────┐ │  │ │              │ │  │ │ - Cleanup    │ │
│ │ Repository Layer │ │  │ │ ┌──────────┐ │ │  │ └──────────────┘ │
│ │ (SQLAlchemy)     │ │  │ │ │  Agent   │ │ │  │                  │
│ └──────────────────┘ │  │ │ │ Service  │ │ │  │ Redis Queue      │
│                      │  │ │ └──────────┘ │ │  │                  │
└──────────────────────┘  │ │              │ │  └──────────────────┘
                          │ │ Provider     │ │
                          │ │ Clients:     │ │
                          │ │ - Groq       │ │
                          │ │ - Gemini     │ │
                          │ │ - HuggingFace│ │
                          │ │ - Ollama     │ │
                          │ └──────────────┘ │
                          └──────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌──────────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   DATA LAYER         │  │   CACHE LAYER    │  │  EXTERNAL APIs   │
├──────────────────────┤  ├──────────────────┤  ├──────────────────┤
│                      │  │                  │  │                  │
│ ┌──────────────────┐ │  │ ┌──────────────┐ │  │ ┌──────────────┐ │
│ │  PostgreSQL 15+  │ │  │ │   Redis 7+   │ │  │ │ Groq API     │ │
│ │                  │ │  │ │              │ │  │ │ Gemini API   │ │
│ │ - users          │ │  │ │ L1: Questions│ │  │ │ HuggingFace  │ │
│ │ - resumes        │ │  │ │ L2: Evals    │ │  │ │ Ollama       │ │
│ │ - interviews     │ │  │ │ L3: Sessions │ │  │ └──────────────┘ │
│ │ - questions      │ │  │ │ L4: User Prefs│ │  │                  │
│ │ - answers        │ │  │ │              │ │  │ ┌──────────────┐ │
│ │ - evaluations    │ │  │ │ Rate Limits  │ │  │ │ Cloudinary   │ │
│ │ - achievements   │ │  │ │ Quota Track  │ │  │ │ (File Store) │ │
│ │ - study_plans    │ │  │ │ Circuit Brk  │ │  │ └──────────────┘ │
│ │ - audit_logs     │ │  │ └──────────────┘ │  │                  │
│ └──────────────────┘ │  │                  │  │ ┌──────────────┐ │
│                      │  │ Connection Pool  │  │ │ Email Service│ │
│ Connection Pool      │  │ (Redis Client)   │  │ │ (SMTP/SES)   │ │
│ (10-20 connections)  │  │                  │  │ └──────────────┘ │
└──────────────────────┘  └──────────────────┘  └──────────────────┘
```

### Component Descriptions

#### 1. Client Layer (React Frontend)
- **Purpose**: User interface for all platform features
- **Technology**: React 18.2+, Vite 5+, Redux Toolkit, Material-UI v5, TypeScript
- **Responsibilities**:
  - Render UI components and handle user interactions
  - Manage application state with Redux
  - Handle routing and navigation
  - Communicate with backend via REST API and WebSocket
  - Implement client-side validation and error handling
  - Cache API responses for offline functionality (PWA)

#### 2. API Gateway Layer (FastAPI)
- **Purpose**: Single entry point for all client requests
- **Technology**: FastAPI 0.109+, Python 3.11+
- **Responsibilities**:
  - Route requests to appropriate services
  - Authenticate and authorize requests (JWT validation)
  - Apply rate limiting per user/IP
  - Add security headers (CSP, HSTS, etc.)
  - Generate request IDs for tracing
  - Log all requests and responses
  - Handle CORS for cross-origin requests


#### 3. Business Logic Layer
- **Purpose**: Core application logic and domain models
- **Technology**: Python 3.11+, SQLAlchemy 2.0, Pydantic v2
- **Services**:
  - **User Service**: Registration, authentication, profile management
  - **Resume Service**: Upload, parsing, skill extraction, version management
  - **Interview Service**: Session creation, question retrieval, answer submission
  - **Analytics Service**: Performance calculation, trend analysis, benchmarking
  - **Gamification Service**: Achievement tracking, streak calculation, leaderboard
- **Responsibilities**:
  - Implement business rules and validation
  - Coordinate between data layer and AI services
  - Handle transactions and data consistency
  - Emit events for async processing

#### 4. AI Services Layer
- **Purpose**: Intelligent question generation, answer evaluation, and agent-based analysis
- **Technology**: LangChain 0.1+, spaCy 3.7+, ChromaDB
- **Components**:
  - **AI Orchestrator**: Routes requests to Traditional AI or Agent Service
  - **Traditional AI Service**: Fast, cacheable operations (questions, evaluations)
  - **Agent Service**: Deep reasoning operations (resume analysis, study plans)
  - **Provider Clients**: Groq, Gemini, HuggingFace, Ollama integrations
- **Responsibilities**:
  - Select optimal AI provider based on health, quota, and performance
  - Implement circuit breakers and fallback logic
  - Track API usage and costs
  - Cache AI responses aggressively

#### 5. Async Workers Layer (Celery)
- **Purpose**: Background processing for long-running tasks
- **Technology**: Celery with Redis backend
- **Tasks**:
  - Resume parsing (PDF/DOCX extraction, NLP processing)
  - Answer evaluation (AI-based scoring and feedback)
  - Email sending (verification, password reset, notifications)
  - Data cleanup (old sessions, expired tokens, cache eviction)
  - Scheduled jobs (leaderboard calculation, backup, health checks)
- **Responsibilities**:
  - Execute tasks asynchronously without blocking API requests
  - Retry failed tasks with exponential backoff
  - Monitor task status and report failures

#### 6. Data Layer (PostgreSQL)
- **Purpose**: Persistent storage for all application data
- **Technology**: PostgreSQL 15+, SQLAlchemy 2.0, Alembic
- **Responsibilities**:
  - Store structured data with ACID guarantees
  - Enforce referential integrity with foreign keys
  - Provide full-text search capabilities
  - Support JSONB for flexible metadata storage
  - Maintain indexes for query performance

#### 7. Cache Layer (Redis)
- **Purpose**: High-speed caching to reduce database and AI API load
- **Technology**: Redis 7+
- **Cache Layers**:
  - **L1 - Questions**: TTL 30 days, stores generated questions
  - **L2 - Evaluations**: TTL 7 days, stores answer evaluations
  - **L3 - Sessions**: TTL 2 hours, stores active session data
  - **L4 - User Preferences**: TTL 24 hours, stores user profiles and settings
- **Additional Uses**:
  - Rate limiting counters
  - API quota tracking
  - Circuit breaker state
  - Celery task queue

#### 8. External APIs Layer
- **AI Providers**: Groq, Gemini, HuggingFace, Ollama
- **File Storage**: Cloudinary or AWS S3
- **Email Service**: SMTP or AWS SES
- **Monitoring**: Sentry (error tracking), Prometheus (metrics)

### Data Flow Diagrams

#### Question Generation Flow (Cached)

```
User Request
    │
    ▼
FastAPI Endpoint
    │
    ▼
Check Redis Cache (key: questions:{role}:{difficulty}:{count})
    │
    ├─── Cache HIT ──────────────────────────────┐
    │                                             │
    │                                             ▼
    │                                    Return Questions (50-100ms)
    │
    └─── Cache MISS
            │
            ▼
    Check Database (questions table)
            │
            ├─── Found ──────────────────────────┐
            │                                     │
            │                                     ▼
            │                            Cache in Redis (TTL: 30 days)
            │                                     │
            │                                     ▼
            │                            Return Questions (200-300ms)
            │
            └─── Not Found
                    │
                    ▼
            Route to AI Service
                    │
                    ▼
            [Continue to AI Generation Flow]
```


#### Question Generation Flow (AI - Uncached)

```
AI Service Request
    │
    ▼
AI Orchestrator
    │
    ▼
Check Provider Health & Quota
    │
    ├─── Groq (Priority 1) ──────────────────────┐
    │    - Health: OK                             │
    │    - Quota: 5000/14400 remaining            │
    │    - Avg Response: 800ms                    │
    │                                             ▼
    │                                    Call Groq API (timeout: 10s)
    │                                             │
    │                                             ├─── Success ────┐
    │                                             │                │
    │                                             │                ▼
    │                                             │         Parse & Validate
    │                                             │                │
    │                                             │                ▼
    │                                             │         Cache in Redis
    │                                             │                │
    │                                             │                ▼
    │                                             │         Store in DB
    │                                             │                │
    │                                             │                ▼
    │                                             │         Return Questions
    │                                             │         (2-3 seconds)
    │                                             │
    │                                             └─── Failure/Timeout
    │                                                      │
    ├─── Gemini (Priority 2) ────────────────────────────┤
    │    - Fallback if Groq fails                         │
    │                                                      │
    ├─── HuggingFace (Priority 3) ───────────────────────┤
    │    - Fallback if Gemini fails                       │
    │                                                      │
    └─── Ollama (Priority 4) ────────────────────────────┤
         - Local fallback if all cloud providers fail     │
                                                           │
                                                           ▼
                                                  If all fail: Return
                                                  pre-generated questions
                                                  from fallback_questions table
```

#### Answer Evaluation Flow

```
User Submits Answer
    │
    ▼
FastAPI Endpoint
    │
    ▼
Store Answer in Database
    │
    ▼
Enqueue Celery Task (evaluate_answer)
    │
    ▼
Return Submission Confirmation (200-300ms)
    │
    │ [Async Processing Begins]
    │
    ▼
Celery Worker Picks Up Task
    │
    ▼
Calculate Answer Hash (MD5 of normalized text)
    │
    ▼
Check Redis Cache (key: eval:{answer_hash})
    │
    ├─── Cache HIT ──────────────────────────────┐
    │                                             │
    │                                             ▼
    │                                    Store Cached Evaluation
    │                                             │
    │                                             ▼
    │                                    Update Answer Record
    │                                             │
    │                                             ▼
    │                                    Notify User via WebSocket
    │                                    (Total: 500-1000ms)
    │
    └─── Cache MISS
            │
            ▼
    AI Orchestrator
            │
            ▼
    Select Provider (same algorithm as questions)
            │
            ▼
    Call Provider API with Evaluation Prompt
            │
            ▼
    Parse Scores & Feedback
            │
            ▼
    Validate Scores (0-100 range)
            │
            ▼
    Calculate Weighted Overall Score
            │
            ▼
    Store Evaluation in Database
            │
            ▼
    Cache in Redis (TTL: 7 days)
            │
            ▼
    Update Answer Record
            │
            ▼
    Notify User via WebSocket
    (Total: 3-5 seconds)
```


#### AI Agent Execution Flow (Resume Analysis)

```
User Requests Resume Analysis
    │
    ▼
FastAPI Endpoint
    │
    ▼
Check if Recent Analysis Exists (<30 days)
    │
    ├─── Exists ─────────────────────────────────┐
    │                                             │
    │                                             ▼
    │                                    Return Cached Analysis
    │                                    (100-200ms)
    │
    └─── Not Exists
            │
            ▼
    Enqueue Celery Task (analyze_resume_agent)
            │
            ▼
    Return Task ID (user polls for completion)
            │
            │ [Async Agent Execution]
            │
            ▼
    Celery Worker Picks Up Task
            │
            ▼
    Initialize LangChain Agent
            │
            ├─── Tools Available:
            │    - ResumeParserTool
            │    - SkillExtractorTool
            │    - ExperienceAnalyzerTool
            │    - SkillGapTool
            │    - RoadmapGeneratorTool
            │
            ▼
    Agent Reasoning Loop (max 10 tool calls)
            │
            ├─── Step 1: Parse Resume Structure
            │    Tool: ResumeParserTool
            │    Output: Structured sections
            │
            ├─── Step 2: Extract Skills
            │    Tool: SkillExtractorTool
            │    Output: Categorized skills with confidence
            │
            ├─── Step 3: Analyze Experience
            │    Tool: ExperienceAnalyzerTool
            │    Output: Seniority level, career progression
            │
            ├─── Step 4: Identify Skill Gaps
            │    Tool: SkillGapTool
            │    Input: Target role from user profile
            │    Output: Missing skills, weak areas
            │
            └─── Step 5: Generate Roadmap
                 Tool: RoadmapGeneratorTool
                 Output: 30/60/90 day improvement plan
            │
            ▼
    Compile Agent Output
            │
            ▼
    Validate Output Structure
            │
            ▼
    Store in resume_analyses Table
            │
            ▼
    Update Task Status to "completed"
            │
            ▼
    Notify User via WebSocket
    (Total: 15-20 seconds)
```

## Hybrid AI Architecture (CRITICAL)

### Overview

The Hybrid AI Architecture is the core innovation of InterviewMaster AI. It intelligently routes requests between two AI paradigms:

1. **Traditional AI Service**: Fast, stateless, cacheable operations using direct API calls
2. **AI Agent Service**: Deep reasoning, multi-step operations using LangChain agents

This hybrid approach achieves the best of both worlds:
- **Speed**: 90% of requests served in <3 seconds via Traditional AI
- **Intelligence**: 10% of requests get deep personalization via AI Agents
- **Cost**: Aggressive caching reduces API costs by 95%

### Routing Decision Logic

```python
class AIOrchestrator:
    """
    Central orchestrator that routes AI requests to appropriate service.
    """
    
    def route_request(self, request_type: str, context: dict) -> AIResponse:
        """
        Decision tree for routing AI requests.
        
        Args:
            request_type: Type of AI operation (question_gen, evaluation, resume_analysis, etc.)
            context: Request context (user_id, cache_key, etc.)
        
        Returns:
            AIResponse from appropriate service
        """
        
        # Step 1: Check cache (applies to all request types)
        cached_response = self.cache_service.get(context['cache_key'])
        if cached_response:
            logger.info(f"Cache hit for {request_type}", extra={'cache_key': context['cache_key']})
            return cached_response
        
        # Step 2: Determine if request requires deep reasoning
        if request_type in ['resume_analysis', 'study_plan', 'company_coaching']:
            # Route to AI Agent Service (deep reasoning required)
            logger.info(f"Routing {request_type} to AI Agent Service")
            return self.agent_service.execute(request_type, context)
        
        # Step 3: Route to Traditional AI Service (fast, cacheable)
        logger.info(f"Routing {request_type} to Traditional AI Service")
        return self.traditional_ai_service.execute(request_type, context)
```

### Traditional AI Service Design

**Purpose**: Handle high-volume, cacheable operations with minimal latency

**Use Cases**:
- Question generation
- Answer evaluation
- Quick feedback generation

**Architecture**:

```python
class TraditionalAIService:
    """
    Fast, stateless AI service for cacheable operations.
    Uses multi-provider fallback for reliability.
    """
    
    def __init__(self):
        self.providers = [
            GroqProvider(priority=1, quota_limit=14400),
            GeminiProvider(priority=2, quota_limit=60),
            HuggingFaceProvider(priority=3, quota_limit=30000),
            OllamaProvider(priority=4, quota_limit=None)  # Local fallback
        ]
        self.circuit_breaker = CircuitBreakerManager()
        self.quota_tracker = QuotaTracker()
    
    def execute(self, request_type: str, context: dict) -> AIResponse:
        """
        Execute AI request with provider selection and fallback.
        """
        # Select best available provider
        provider = self.select_provider()
        
        # Check circuit breaker
        if self.circuit_breaker.is_open(provider.name):
            logger.warning(f"Circuit breaker open for {provider.name}, trying next")
            return self.execute_with_fallback(request_type, context, exclude=[provider.name])
        
        try:
            # Construct prompt from template
            prompt = self.build_prompt(request_type, context)
            
            # Call provider API with timeout
            response = provider.call(prompt, timeout=10)
            
            # Track quota usage
            self.quota_tracker.record_usage(provider.name, len(prompt))
            
            # Parse and validate response
            parsed_response = self.parse_response(response, request_type)
            
            # Cache response
            self.cache_service.set(context['cache_key'], parsed_response, ttl=self.get_ttl(request_type))
            
            return parsed_response
            
        except (TimeoutError, APIError) as e:
            logger.error(f"Provider {provider.name} failed: {e}")
            self.circuit_breaker.record_failure(provider.name)
            
            # Fallback to next provider
            return self.execute_with_fallback(request_type, context, exclude=[provider.name])
    
    def select_provider(self) -> AIProvider:
        """
        Select best provider based on health, quota, and performance.
        
        Scoring formula:
        score = (health_score * 0.4) + (quota_remaining * 0.3) + (response_time * 0.3)
        """
        best_provider = None
        best_score = -1
        
        for provider in self.providers:
            if self.circuit_breaker.is_open(provider.name):
                continue
            
            health_score = provider.get_health_score()  # 0-1
            quota_remaining = self.quota_tracker.get_remaining_percentage(provider.name)  # 0-1
            response_time_score = 1 - (provider.avg_response_time / 10000)  # Normalize to 0-1
            
            score = (health_score * 0.4) + (quota_remaining * 0.3) + (response_time_score * 0.3)
            
            if score > best_score:
                best_score = score
                best_provider = provider
        
        return best_provider or self.providers[-1]  # Fallback to Ollama if all fail
```


### AI Agent Service Design

**Purpose**: Handle complex, multi-step reasoning tasks requiring tool use and planning

**Use Cases**:
- Deep resume analysis with skill gap identification
- Personalized study plan generation
- Company-specific interview coaching

**Architecture**:

```python
class AgentService:
    """
    LangChain-based agent service for deep reasoning tasks.
    Uses autonomous agents with tool access.
    """
    
    def __init__(self):
        self.llm = self.initialize_llm()  # Use Groq/Gemini for agent reasoning
        self.vector_store = ChromaDB()  # For knowledge retrieval
        self.tool_registry = ToolRegistry()
    
    def execute(self, agent_type: str, context: dict) -> AgentResponse:
        """
        Execute agent-based task with autonomous reasoning.
        """
        # Initialize agent with appropriate tools
        agent = self.create_agent(agent_type, context)
        
        # Execute agent with max iterations limit
        try:
            result = agent.run(
                input=context['input'],
                max_iterations=10,
                timeout=20  # 20 second timeout
            )
            
            # Extract structured output
            structured_output = self.parse_agent_output(result, agent_type)
            
            # Store agent reasoning for transparency
            self.store_agent_execution(
                agent_type=agent_type,
                user_id=context['user_id'],
                reasoning_steps=agent.get_reasoning_trace(),
                output=structured_output
            )
            
            return AgentResponse(
                success=True,
                output=structured_output,
                reasoning=agent.get_reasoning_trace(),
                execution_time=agent.execution_time
            )
            
        except TimeoutError:
            logger.error(f"Agent {agent_type} timed out after 20s")
            # Fallback to traditional NLP analysis
            return self.fallback_to_traditional(agent_type, context)
        
        except Exception as e:
            logger.error(f"Agent {agent_type} failed: {e}")
            return AgentResponse(success=False, error=str(e))
    
    def create_agent(self, agent_type: str, context: dict) -> Agent:
        """
        Create agent with appropriate tools based on agent type.
        """
        if agent_type == 'resume_analysis':
            tools = [
                self.tool_registry.get('resume_parser'),
                self.tool_registry.get('skill_extractor'),
                self.tool_registry.get('experience_analyzer'),
                self.tool_registry.get('skill_gap'),
                self.tool_registry.get('roadmap_generator')
            ]
            system_prompt = RESUME_ANALYSIS_SYSTEM_PROMPT
        
        elif agent_type == 'study_plan':
            tools = [
                self.tool_registry.get('skill_assessment'),
                self.tool_registry.get('job_market'),
                self.tool_registry.get('learning_resource'),
                self.tool_registry.get('progress_tracker'),
                self.tool_registry.get('scheduler')
            ]
            system_prompt = STUDY_PLAN_SYSTEM_PROMPT
        
        elif agent_type == 'company_coaching':
            tools = [
                self.tool_registry.get('company_research'),
                self.tool_registry.get('interview_pattern'),
                self.tool_registry.get('star_method'),
                self.tool_registry.get('confidence')
            ]
            system_prompt = COMPANY_COACHING_SYSTEM_PROMPT
        
        # Create LangChain agent
        agent = initialize_agent(
            tools=tools,
            llm=self.llm,
            agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
            verbose=True,
            max_iterations=10,
            early_stopping_method="generate"
        )
        
        return agent
```

### Provider Client Implementations

#### Groq Provider

```python
class GroqProvider(AIProvider):
    """
    Groq API client - Primary provider for speed.
    Free tier: 14,400 requests/day
    """
    
    def __init__(self):
        self.api_key = os.getenv('GROQ_API_KEY')
        self.base_url = 'https://api.groq.com/openai/v1'
        self.model = 'mixtral-8x7b-32768'
        self.priority = 1
        self.quota_limit = 14400
    
    def call(self, prompt: str, timeout: int = 10) -> str:
        """
        Call Groq API with timeout and error handling.
        """
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'model': self.model,
            'messages': [{'role': 'user', 'content': prompt}],
            'temperature': 0.7,
            'max_tokens': 2000
        }
        
        try:
            response = requests.post(
                f'{self.base_url}/chat/completions',
                headers=headers,
                json=payload,
                timeout=timeout
            )
            response.raise_for_status()
            
            return response.json()['choices'][0]['message']['content']
            
        except requests.Timeout:
            raise TimeoutError(f"Groq API timed out after {timeout}s")
        except requests.RequestException as e:
            raise APIError(f"Groq API error: {e}")
```

#### Gemini Provider

```python
class GeminiProvider(AIProvider):
    """
    Google Gemini API client - Secondary provider for quality.
    Free tier: 60 requests/minute
    """
    
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY')
        self.base_url = 'https://generativelanguage.googleapis.com/v1beta'
        self.model = 'gemini-pro'
        self.priority = 2
        self.quota_limit = 60  # per minute
    
    def call(self, prompt: str, timeout: int = 10) -> str:
        """
        Call Gemini API with timeout and error handling.
        """
        url = f'{self.base_url}/models/{self.model}:generateContent?key={self.api_key}'
        
        payload = {
            'contents': [{
                'parts': [{'text': prompt}]
            }],
            'generationConfig': {
                'temperature': 0.7,
                'maxOutputTokens': 2000
            }
        }
        
        try:
            response = requests.post(url, json=payload, timeout=timeout)
            response.raise_for_status()
            
            return response.json()['candidates'][0]['content']['parts'][0]['text']
            
        except requests.Timeout:
            raise TimeoutError(f"Gemini API timed out after {timeout}s")
        except requests.RequestException as e:
            raise APIError(f"Gemini API error: {e}")
```

#### Ollama Provider (Local Fallback)

```python
class OllamaProvider(AIProvider):
    """
    Ollama local LLM client - Ultimate fallback for privacy and cost.
    Free tier: Unlimited (runs locally)
    """
    
    def __init__(self):
        self.base_url = os.getenv('OLLAMA_URL', 'http://localhost:11434')
        self.model = 'llama2'
        self.priority = 4
        self.quota_limit = None  # Unlimited
    
    def call(self, prompt: str, timeout: int = 30) -> str:
        """
        Call local Ollama instance.
        Note: Longer timeout due to local processing.
        """
        url = f'{self.base_url}/api/generate'
        
        payload = {
            'model': self.model,
            'prompt': prompt,
            'stream': False
        }
        
        try:
            response = requests.post(url, json=payload, timeout=timeout)
            response.raise_for_status()
            
            return response.json()['response']
            
        except requests.Timeout:
            raise TimeoutError(f"Ollama timed out after {timeout}s")
        except requests.RequestException as e:
            raise APIError(f"Ollama error: {e}")
```


### Prompt Engineering Templates

#### Question Generation Prompt

```python
QUESTION_GENERATION_PROMPT = """
You are an expert interview coach creating realistic interview questions.

Context:
- Target Role: {role}
- Difficulty Level: {difficulty}
- Categories: {categories}
- Number of Questions: {count}

Requirements:
1. Generate {count} unique interview questions
2. Each question must be appropriate for {role} at {difficulty} level
3. Distribute questions across categories: {categories}
4. Include expected answer points for evaluation
5. Set realistic time limits (2-10 minutes per question)

Output Format (JSON):
{{
  "questions": [
    {{
      "question_text": "string (10-500 chars)",
      "category": "Technical|Behavioral|Domain_Specific|System_Design|Coding",
      "difficulty": "{difficulty}",
      "expected_answer_points": ["point1", "point2", "point3"],
      "time_limit_seconds": 120-600
    }}
  ]
}}

Generate questions now:
"""
```

#### Answer Evaluation Prompt

```python
ANSWER_EVALUATION_PROMPT = """
You are an expert interview evaluator providing constructive feedback.

Question: {question_text}
Expected Answer Points: {expected_points}
User's Answer: {answer_text}

Evaluate the answer across these criteria:

1. Content Quality (40%): Completeness, accuracy, depth
2. Clarity (20%): Structure, articulation, coherence
3. Confidence (20%): Tone analysis, certainty, filler words
4. Technical Accuracy (20%): Correctness, best practices

Output Format (JSON):
{{
  "scores": {{
    "content_quality": 0-100,
    "clarity": 0-100,
    "confidence": 0-100,
    "technical_accuracy": 0-100,
    "overall_score": 0-100
  }},
  "feedback": {{
    "strengths": ["strength1", "strength2"],
    "improvements": ["improvement1", "improvement2"],
    "suggestions": ["suggestion1", "suggestion2"],
    "example_answer": "A better answer would include..."
  }}
}}

Provide evaluation now:
"""
```

#### Resume Analysis Agent System Prompt

```python
RESUME_ANALYSIS_SYSTEM_PROMPT = """
You are an AI career coach analyzing a resume to provide personalized insights.

Your goal: Deeply analyze the resume and identify:
1. Complete skill inventory (technical, soft skills, tools, languages)
2. Experience timeline and career progression
3. Skill gaps compared to target role: {target_role}
4. Personalized 30/60/90 day improvement roadmap

Available Tools:
- resume_parser: Extract structured data from resume text
- skill_extractor: Identify and categorize skills with confidence scores
- experience_analyzer: Parse job history and calculate seniority
- skill_gap: Compare resume skills to target role requirements
- roadmap_generator: Create personalized learning plan

Process:
1. Use resume_parser to extract structured sections
2. Use skill_extractor to identify all skills
3. Use experience_analyzer to understand career progression
4. Use skill_gap to identify missing skills for {target_role}
5. Use roadmap_generator to create actionable improvement plan

Be thorough, specific, and actionable in your analysis.
"""
```

### Circuit Breaker Implementation

```python
class CircuitBreaker:
    """
    Circuit breaker pattern for AI provider fault tolerance.
    
    States:
    - CLOSED: Normal operation, requests pass through
    - OPEN: Provider is failing, requests fail immediately
    - HALF_OPEN: Testing if provider has recovered
    """
    
    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = CircuitState.CLOSED
    
    def call(self, func: Callable, *args, **kwargs):
        """
        Execute function with circuit breaker protection.
        """
        if self.state == CircuitState.OPEN:
            if self.should_attempt_reset():
                self.state = CircuitState.HALF_OPEN
            else:
                raise CircuitBreakerOpenError("Circuit breaker is OPEN")
        
        try:
            result = func(*args, **kwargs)
            self.on_success()
            return result
        
        except Exception as e:
            self.on_failure()
            raise e
    
    def on_success(self):
        """Handle successful call."""
        self.failure_count = 0
        if self.state == CircuitState.HALF_OPEN:
            self.state = CircuitState.CLOSED
            logger.info("Circuit breaker CLOSED (recovered)")
    
    def on_failure(self):
        """Handle failed call."""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            logger.warning(f"Circuit breaker OPEN (failures: {self.failure_count})")
    
    def should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt reset."""
        return (time.time() - self.last_failure_time) >= self.timeout
```

### Cost Calculation and Optimization

```python
class CostTracker:
    """
    Track and optimize AI API costs.
    """
    
    # Cost per 1M tokens (approximate)
    COSTS = {
        'groq': 0.0,  # Free tier
        'gemini': 0.0,  # Free tier
        'huggingface': 0.0,  # Free tier
        'ollama': 0.0  # Local, free
    }
    
    def calculate_daily_cost(self, date: datetime.date) -> float:
        """
        Calculate total cost for a given date.
        """
        usage = db.query(AIProviderUsage).filter(
            AIProviderUsage.date == date
        ).all()
        
        total_cost = 0.0
        for record in usage:
            provider_cost = self.COSTS.get(record.provider_name, 0.0)
            # Assuming average 1000 tokens per request
            tokens = record.request_count * 1000
            cost = (tokens / 1_000_000) * provider_cost
            total_cost += cost
        
        return total_cost
    
    def calculate_cost_per_user(self, user_id: int, days: int = 30) -> float:
        """
        Calculate cost per user over specified period.
        """
        start_date = datetime.now() - timedelta(days=days)
        
        # Count user's AI requests
        user_requests = db.query(func.count(Answer.id)).join(
            Interview
        ).filter(
            Interview.user_id == user_id,
            Answer.created_at >= start_date
        ).scalar()
        
        # Estimate cost (assuming 2 AI calls per answer: question + evaluation)
        estimated_requests = user_requests * 2
        
        # With 90% cache hit rate, only 10% hit AI
        actual_requests = estimated_requests * 0.1
        
        # Average cost per request (free tier = $0)
        cost_per_request = 0.0
        
        return actual_requests * cost_per_request
    
    def get_optimization_recommendations(self) -> List[str]:
        """
        Analyze usage patterns and recommend optimizations.
        """
        recommendations = []
        
        # Check cache hit rate
        cache_hit_rate = self.calculate_cache_hit_rate()
        if cache_hit_rate < 0.90:
            recommendations.append(
                f"Cache hit rate is {cache_hit_rate:.1%}. Target is 90%+. "
                "Consider increasing TTL or pre-generating common questions."
            )
        
        # Check provider distribution
        provider_usage = self.get_provider_distribution()
        if provider_usage.get('ollama', 0) > 0.20:
            recommendations.append(
                "Ollama usage is high (>20%). This may indicate cloud provider issues. "
                "Check provider health and quotas."
            )
        
        # Check quota usage
        for provider, usage_pct in self.get_quota_usage().items():
            if usage_pct > 0.80:
                recommendations.append(
                    f"{provider} quota usage is {usage_pct:.1%}. "
                    "Consider implementing request throttling or user limits."
                )
        
        return recommendations
```


## Database Design

### Entity-Relationship Diagram

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│     users       │         │     resumes      │         │resume_analyses  │
├─────────────────┤         ├──────────────────┤         ├─────────────────┤
│ id (PK)         │────────<│ user_id (FK)     │────────<│ resume_id (FK)  │
│ email           │         │ id (PK)          │         │ id (PK)         │
│ password_hash   │         │ filename         │         │ analysis_data   │
│ name            │         │ file_url         │         │ agent_reasoning │
│ target_role     │         │ extracted_text   │         │ analyzed_at     │
│ experience_level│         │ skills (JSONB)   │         └─────────────────┘
│ created_at      │         │ experience(JSONB)│
│ updated_at      │         │ education (JSONB)│
│ deleted_at      │         │ status           │
└─────────────────┘         │ created_at       │
        │                   └──────────────────┘
        │
        │                   ┌──────────────────┐
        └──────────────────<│ interview_       │
                            │   sessions       │
                            ├──────────────────┤
                            │ id (PK)          │
                            │ user_id (FK)     │
                            │ role             │
                            │ difficulty       │
                            │ status           │
                            │ start_time       │
                            │ end_time         │
                            │ created_at       │
                            └──────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
        │session_questions │ │   answers    │ │session_summaries │
        ├──────────────────┤ ├──────────────┤ ├──────────────────┤
        │ id (PK)          │ │ id (PK)      │ │ id (PK)          │
        │ session_id (FK)  │ │ session_id   │ │ session_id (FK)  │
        │ question_id (FK) │ │ question_id  │ │ overall_score    │
        │ display_order    │ │ answer_text  │ │ score_trend      │
        │ answer_id (FK)   │ │ time_taken   │ │ strengths (JSONB)│
        │ status           │ │ submitted_at │ │ improvements     │
        └──────────────────┘ │ evaluation_id│ │ category_perf    │
                │             └──────────────┘ └──────────────────┘
                │                     │
                ▼                     ▼
        ┌──────────────────┐ ┌──────────────────┐
        │    questions     │ │   evaluations    │
        ├──────────────────┤ ├──────────────────┤
        │ id (PK)          │ │ id (PK)          │
        │ question_text    │ │ answer_id (FK)   │
        │ category         │ │ content_quality  │
        │ difficulty       │ │ clarity          │
        │ expected_points  │ │ confidence       │
        │ time_limit_sec   │ │ technical_acc    │
        │ created_at       │ │ overall_score    │
        │ cached_at        │ │ strengths (JSONB)│
        └──────────────────┘ │ improvements     │
                              │ suggestions      │
                              │ example_answer   │
                              │ evaluated_at     │
                              └──────────────────┘

┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│user_achievements│         │  user_streaks    │         │  leaderboard_   │
├─────────────────┤         ├──────────────────┤         │    entries      │
│ id (PK)         │         │ id (PK)          │         ├─────────────────┤
│ user_id (FK)    │         │ user_id (FK)     │         │ id (PK)         │
│ achievement_type│         │ current_streak   │         │ rank            │
│ earned_at       │         │ longest_streak   │         │ anonymous_name  │
└─────────────────┘         │ last_practice_dt │         │ average_score   │
                            └──────────────────┘         │ total_interviews│
                                                          │ period          │
┌─────────────────┐         ┌──────────────────┐         │ created_at      │
│  study_plans    │         │ai_provider_usage │         └─────────────────┘
├─────────────────┤         ├──────────────────┤
│ id (PK)         │         │ id (PK)          │         ┌─────────────────┐
│ user_id (FK)    │         │ provider_name    │         │  audit_logs     │
│ plan_data(JSONB)│         │ date             │         ├─────────────────┤
│ created_at      │         │ request_count    │         │ id (PK)         │
│ updated_at      │         │ character_count  │         │ event_type      │
└─────────────────┘         │ estimated_cost   │         │ user_id (FK)    │
                            └──────────────────┘         │ ip_address      │
┌─────────────────┐                                      │ user_agent      │
│agent_executions │         ┌──────────────────┐         │ event_data      │
├─────────────────┤         │ cache_metadata   │         │ timestamp       │
│ id (PK)         │         ├──────────────────┤         └─────────────────┘
│ agent_type      │         │ id (PK)          │
│ user_id (FK)    │         │ cache_layer      │         ┌─────────────────┐
│ reasoning_steps │         │ cache_hits       │         │community_       │
│ output (JSONB)  │         │ cache_misses     │         │  questions      │
│ execution_time  │         │ hit_rate         │         ├─────────────────┤
│ success         │         │ date             │         │ id (PK)         │
│ created_at      │         └──────────────────┘         │ user_id (FK)    │
└─────────────────┘                                      │ company_name    │
                                                          │ question_text   │
                                                          │ interview_date  │
                                                          │ status          │
                                                          │ upvotes         │
                                                          │ downvotes       │
                                                          │ verified        │
                                                          └─────────────────┘
```


### Complete Table Schemas

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    target_role VARCHAR(100),
    experience_level VARCHAR(50) CHECK (experience_level IN ('Entry', 'Mid', 'Senior', 'Staff', 'Principal')),
    account_status VARCHAR(50) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending_verification')),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_target_role ON users(target_role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Resumes table
CREATE TABLE resumes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    extracted_text TEXT,
    skills JSONB,
    experience JSONB,
    education JSONB,
    status VARCHAR(50) DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'text_extracted', 'skills_extracted', 'experience_parsed', 'education_parsed', 'extraction_failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_status ON resumes(status);
CREATE INDEX idx_resumes_skills_gin ON resumes USING GIN (skills);

-- Resume analyses table (AI Agent output)
CREATE TABLE resume_analyses (
    id SERIAL PRIMARY KEY,
    resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    analysis_data JSONB NOT NULL,
    agent_reasoning JSONB,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resume_analyses_resume_id ON resume_analyses(resume_id);
CREATE INDEX idx_resume_analyses_user_id ON resume_analyses(user_id);

-- Interview sessions table
CREATE TABLE interview_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL,
    difficulty VARCHAR(50) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard', 'Expert')),
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX idx_interview_sessions_status ON interview_sessions(status);
CREATE INDEX idx_interview_sessions_created_at ON interview_sessions(created_at);

-- Questions table
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('Technical', 'Behavioral', 'Domain_Specific', 'System_Design', 'Coding')),
    difficulty VARCHAR(50) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard', 'Expert')),
    role VARCHAR(100) NOT NULL,
    expected_answer_points JSONB NOT NULL,
    time_limit_seconds INTEGER NOT NULL CHECK (time_limit_seconds BETWEEN 120 AND 600),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cached_at TIMESTAMP
);

CREATE INDEX idx_questions_role_difficulty ON questions(role, difficulty);
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_created_at ON questions(created_at);

-- Session questions (junction table)
CREATE TABLE session_questions (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL,
    answer_id INTEGER REFERENCES answers(id),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'skipped')),
    question_displayed_at TIMESTAMP
);

CREATE INDEX idx_session_questions_session_id ON session_questions(session_id);
CREATE INDEX idx_session_questions_question_id ON session_questions(question_id);

-- Answers table
CREATE TABLE answers (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    answer_hash VARCHAR(32) NOT NULL,  -- MD5 hash for caching
    time_taken INTEGER NOT NULL,  -- seconds
    evaluation_id INTEGER REFERENCES evaluations(id),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_answers_session_id ON answers(session_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_answer_hash ON answers(answer_hash);

-- Answer drafts table (auto-save)
CREATE TABLE answer_drafts (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    draft_text TEXT NOT NULL,
    last_saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, question_id)
);

CREATE INDEX idx_answer_drafts_session_question ON answer_drafts(session_id, question_id);

-- Evaluations table
CREATE TABLE evaluations (
    id SERIAL PRIMARY KEY,
    answer_id INTEGER NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
    content_quality INTEGER NOT NULL CHECK (content_quality BETWEEN 0 AND 100),
    clarity INTEGER NOT NULL CHECK (clarity BETWEEN 0 AND 100),
    confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
    technical_accuracy INTEGER NOT NULL CHECK (technical_accuracy BETWEEN 0 AND 100),
    overall_score INTEGER NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
    strengths JSONB NOT NULL,
    improvements JSONB NOT NULL,
    suggestions JSONB NOT NULL,
    example_answer TEXT,
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_evaluations_answer_id ON evaluations(answer_id);
CREATE INDEX idx_evaluations_overall_score ON evaluations(overall_score);

-- Session summaries table
CREATE TABLE session_summaries (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    overall_session_score INTEGER NOT NULL,
    score_trend DECIMAL(5,2),  -- percentage change from previous session
    strengths JSONB NOT NULL,
    improvements JSONB NOT NULL,
    category_performance JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_session_summaries_session_id ON session_summaries(session_id);

-- User achievements table
CREATE TABLE user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(100) NOT NULL CHECK (achievement_type IN ('First_Interview', 'Ten_Interviews', 'Fifty_Interviews', 'Perfect_Score', 'Seven_Day_Streak', 'Thirty_Day_Streak', 'Category_Master')),
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_type)
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);

-- User streaks table
CREATE TABLE user_streaks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_practice_date DATE
);

CREATE INDEX idx_user_streaks_user_id ON user_streaks(user_id);

-- Leaderboard entries table
CREATE TABLE leaderboard_entries (
    id SERIAL PRIMARY KEY,
    rank INTEGER NOT NULL,
    anonymous_username VARCHAR(50) NOT NULL,
    average_score INTEGER NOT NULL,
    total_interviews INTEGER NOT NULL,
    period VARCHAR(50) NOT NULL CHECK (period IN ('weekly', 'all_time')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leaderboard_period_rank ON leaderboard_entries(period, rank);

-- Study plans table (AI Agent output)
CREATE TABLE study_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_study_plans_user_id ON study_plans(user_id);

-- AI provider usage table
CREATE TABLE ai_provider_usage (
    id SERIAL PRIMARY KEY,
    provider_name VARCHAR(50) NOT NULL CHECK (provider_name IN ('groq', 'gemini', 'huggingface', 'ollama')),
    date DATE NOT NULL,
    request_count INTEGER DEFAULT 0,
    character_count INTEGER DEFAULT 0,
    estimated_cost DECIMAL(10,4) DEFAULT 0.0,
    UNIQUE(provider_name, date)
);

CREATE INDEX idx_ai_provider_usage_provider_date ON ai_provider_usage(provider_name, date);

-- Agent executions table
CREATE TABLE agent_executions (
    id SERIAL PRIMARY KEY,
    agent_type VARCHAR(100) NOT NULL CHECK (agent_type IN ('resume_analysis', 'study_plan', 'company_coaching')),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reasoning_steps JSONB NOT NULL,
    output JSONB NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agent_executions_user_id ON agent_executions(user_id);
CREATE INDEX idx_agent_executions_agent_type ON agent_executions(agent_type);

-- Cache metadata table
CREATE TABLE cache_metadata (
    id SERIAL PRIMARY KEY,
    cache_layer VARCHAR(50) NOT NULL CHECK (cache_layer IN ('L1_Questions', 'L2_Evaluations', 'L3_Sessions', 'L4_User_Prefs')),
    cache_hits INTEGER DEFAULT 0,
    cache_misses INTEGER DEFAULT 0,
    hit_rate DECIMAL(5,2),
    date DATE NOT NULL,
    UNIQUE(cache_layer, date)
);

CREATE INDEX idx_cache_metadata_layer_date ON cache_metadata(cache_layer, date);

-- Audit logs table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    event_data JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Community questions table
CREATE TABLE community_questions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    question_text TEXT NOT NULL,
    interview_date DATE,
    status VARCHAR(50) DEFAULT 'pending_moderation' CHECK (status IN ('pending_moderation', 'approved', 'rejected', 'flagged')),
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_community_questions_company ON community_questions(company_name);
CREATE INDEX idx_community_questions_status ON community_questions(status);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_fingerprint VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- Feature flags table
CREATE TABLE feature_flags (
    id SERIAL PRIMARY KEY,
    feature_name VARCHAR(100) UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
    allowed_user_ids JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feature_flags_feature_name ON feature_flags(feature_name);
```


## API Design

### API Endpoint Summary

```
Authentication & Users:
POST   /api/v1/auth/register          - Register new user
POST   /api/v1/auth/login             - Login user
POST   /api/v1/auth/logout            - Logout current session
POST   /api/v1/auth/logout-all        - Logout all sessions
POST   /api/v1/auth/refresh           - Refresh access token
POST   /api/v1/auth/password-reset-request - Request password reset
POST   /api/v1/auth/password-reset    - Reset password with token
GET    /api/v1/users/me               - Get current user profile
PUT    /api/v1/users/me               - Update user profile
DELETE /api/v1/users/me               - Delete user account

Resumes:
POST   /api/v1/resumes                - Upload resume
GET    /api/v1/resumes                - List user's resumes
GET    /api/v1/resumes/{id}           - Get resume details
DELETE /api/v1/resumes/{id}           - Delete resume
POST   /api/v1/resumes/{id}/analyze   - Trigger AI agent analysis

Interviews:
POST   /api/v1/interviews             - Create interview session
GET    /api/v1/interviews             - List user's sessions
GET    /api/v1/interviews/{id}        - Get session details
GET    /api/v1/interviews/{id}/questions/{qid} - Get specific question
POST   /api/v1/interviews/{id}/answers - Submit answer
GET    /api/v1/interviews/{id}/summary - Get session summary

Questions:
GET    /api/v1/questions              - Get questions (with filters)
POST   /api/v1/questions/generate     - Generate new questions

Analytics:
GET    /api/v1/analytics/dashboard    - Get user analytics dashboard
GET    /api/v1/analytics/performance  - Get performance metrics
GET    /api/v1/analytics/comparison   - Get anonymous comparison

Gamification:
GET    /api/v1/achievements           - Get user achievements
GET    /api/v1/streaks                - Get user streak data
GET    /api/v1/leaderboard            - Get leaderboard

AI Agents:
POST   /api/v1/agents/study-plan      - Generate study plan
POST   /api/v1/agents/company-coaching - Get company coaching
GET    /api/v1/agents/executions      - List agent executions

Admin:
GET    /api/v1/admin/users            - List all users
GET    /api/v1/admin/metrics          - Get system metrics
POST   /api/v1/admin/users/{id}/suspend - Suspend user
GET    /api/v1/admin/community-questions - List flagged questions
PUT    /api/v1/admin/community-questions/{id} - Moderate question

Health:
GET    /health                        - Health check
GET    /metrics                       - Prometheus metrics
```

### Detailed API Specifications

#### POST /api/v1/auth/register

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user_id": 123,
    "email": "user@example.com",
    "name": "John Doe",
    "email_verified": false
  },
  "meta": {
    "timestamp": "2026-02-06T10:30:00Z",
    "request_id": "req_abc123"
  },
  "error": null
}
```

**Errors**:
- 400: Invalid email format, weak password
- 409: Email already registered
- 422: Validation errors

#### POST /api/v1/auth/login

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 900,
    "user": {
      "id": 123,
      "email": "user@example.com",
      "name": "John Doe",
      "target_role": "Software Engineer",
      "experience_level": "Mid"
    }
  },
  "meta": {
    "timestamp": "2026-02-06T10:30:00Z",
    "request_id": "req_abc124"
  },
  "error": null
}
```

**Errors**:
- 401: Invalid credentials
- 423: Account locked (too many failed attempts)

#### POST /api/v1/resumes

**Request** (multipart/form-data):
```
file: resume.pdf (binary)
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "resume_id": 456,
    "filename": "resume.pdf",
    "file_url": "https://storage.example.com/resumes/uuid.pdf",
    "file_size": 245678,
    "status": "uploaded",
    "created_at": "2026-02-06T10:30:00Z"
  },
  "meta": {
    "timestamp": "2026-02-06T10:30:00Z",
    "request_id": "req_abc125",
    "execution_time_ms": 1850
  },
  "error": null
}
```

**Errors**:
- 400: Invalid file type, file too large
- 413: Payload too large (>10MB)

#### POST /api/v1/interviews

**Request**:
```json
{
  "role": "Software Engineer",
  "difficulty": "Medium",
  "question_count": 5,
  "categories": ["Technical", "Behavioral"]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "session_id": 789,
    "role": "Software Engineer",
    "difficulty": "Medium",
    "status": "in_progress",
    "start_time": "2026-02-06T10:30:00Z",
    "first_question": {
      "question_id": 1001,
      "question_text": "Describe a time when you had to debug a complex production issue...",
      "category": "Behavioral",
      "difficulty": "Medium",
      "time_limit_seconds": 300,
      "question_number": 1,
      "total_questions": 5
    }
  },
  "meta": {
    "timestamp": "2026-02-06T10:30:00Z",
    "request_id": "req_abc126",
    "cached": true,
    "execution_time_ms": 95
  },
  "error": null
}
```

#### POST /api/v1/interviews/{id}/answers

**Request**:
```json
{
  "question_id": 1001,
  "answer_text": "In my previous role at XYZ Corp, we encountered a critical production bug..."
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "answer_id": 2001,
    "session_id": 789,
    "question_id": 1001,
    "submitted_at": "2026-02-06T10:35:00Z",
    "evaluation_status": "pending",
    "next_question": {
      "question_id": 1002,
      "question_text": "Explain the difference between REST and GraphQL...",
      "category": "Technical",
      "difficulty": "Medium",
      "time_limit_seconds": 240,
      "question_number": 2,
      "total_questions": 5
    }
  },
  "meta": {
    "timestamp": "2026-02-06T10:35:00Z",
    "request_id": "req_abc127",
    "execution_time_ms": 250
  },
  "error": null
}
```

#### GET /api/v1/analytics/dashboard

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_interviews": 42,
      "average_score_all_time": 78.5,
      "average_score_last_30_days": 82.3,
      "improvement_rate": 15.2,
      "total_practice_hours": 18.5
    },
    "score_over_time": [
      {"date": "2026-01-01", "average_score": 72},
      {"date": "2026-01-08", "average_score": 75},
      {"date": "2026-01-15", "average_score": 78},
      {"date": "2026-01-22", "average_score": 80},
      {"date": "2026-01-29", "average_score": 82}
    ],
    "category_performance": {
      "Technical": 85,
      "Behavioral": 78,
      "System_Design": 72,
      "Coding": 80
    },
    "strengths": ["Problem Solving", "Communication", "Technical Knowledge"],
    "weaknesses": ["System Design", "Time Management"],
    "recommendations": [
      "Focus on system design practice",
      "Try more hard-level questions",
      "Practice with company-specific questions"
    ]
  },
  "meta": {
    "timestamp": "2026-02-06T10:30:00Z",
    "request_id": "req_abc128",
    "cached": true,
    "execution_time_ms": 85
  },
  "error": null
}
```

### Standard Error Response Format

```json
{
  "success": false,
  "data": null,
  "meta": {
    "timestamp": "2026-02-06T10:30:00Z",
    "request_id": "req_abc129"
  },
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": ["Invalid email format"],
      "password": ["Password must be at least 8 characters"]
    },
    "request_id": "req_abc129"
  }
}
```

### Error Codes

- `VALIDATION_ERROR`: Input validation failed (400)
- `AUTHENTICATION_ERROR`: Invalid credentials (401)
- `AUTHORIZATION_ERROR`: Insufficient permissions (403)
- `NOT_FOUND`: Resource not found (404)
- `CONFLICT`: Resource already exists (409)
- `RATE_LIMIT_EXCEEDED`: Too many requests (429)
- `INTERNAL_ERROR`: Server error (500)
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable (503)


## Caching Strategy

### Multi-Layer Caching Architecture

```
Request Flow with Caching:

User Request
    │
    ▼
┌─────────────────────────────────────────┐
│ L4: User Preferences Cache (Redis)      │
│ TTL: 24 hours                            │
│ Keys: user:{user_id}:prefs               │
│ Hit Rate Target: 95%                     │
└─────────────────────────────────────────┘
    │ Miss
    ▼
┌─────────────────────────────────────────┐
│ L3: Session Data Cache (Redis)          │
│ TTL: 2 hours                             │
│ Keys: session:{session_id}               │
│ Hit Rate Target: 85%                     │
└─────────────────────────────────────────┘
    │ Miss
    ▼
┌─────────────────────────────────────────┐
│ L2: Evaluation Cache (Redis)            │
│ TTL: 7 days                              │
│ Keys: eval:{answer_hash}                 │
│ Hit Rate Target: 70%                     │
└─────────────────────────────────────────┘
    │ Miss
    ▼
┌─────────────────────────────────────────┐
│ L1: Question Cache (Redis)              │
│ TTL: 30 days                             │
│ Keys: questions:{role}:{diff}:{count}    │
│ Hit Rate Target: 95%                     │
└─────────────────────────────────────────┘
    │ Miss
    ▼
┌─────────────────────────────────────────┐
│ Database Query                           │
└─────────────────────────────────────────┘
    │ Miss
    ▼
┌─────────────────────────────────────────┐
│ AI Provider Call                         │
└─────────────────────────────────────────┘
```

### Cache Key Patterns

```python
class CacheKeyBuilder:
    """
    Centralized cache key generation with consistent patterns.
    """
    
    @staticmethod
    def question_key(role: str, difficulty: str, count: int, categories: List[str]) -> str:
        """
        Generate cache key for questions.
        Format: questions:{role}:{difficulty}:{count}:{category_hash}
        """
        category_hash = hashlib.md5(
            '|'.join(sorted(categories)).encode()
        ).hexdigest()[:8]
        return f"questions:{role}:{difficulty}:{count}:{category_hash}"
    
    @staticmethod
    def evaluation_key(answer_text: str) -> str:
        """
        Generate cache key for evaluations.
        Format: eval:{answer_hash}
        """
        # Normalize answer text (lowercase, remove extra whitespace)
        normalized = ' '.join(answer_text.lower().split())
        answer_hash = hashlib.md5(normalized.encode()).hexdigest()
        return f"eval:{answer_hash}"
    
    @staticmethod
    def session_key(session_id: int) -> str:
        """
        Generate cache key for session data.
        Format: session:{session_id}
        """
        return f"session:{session_id}"
    
    @staticmethod
    def user_prefs_key(user_id: int) -> str:
        """
        Generate cache key for user preferences.
        Format: user:{user_id}:prefs
        """
        return f"user:{user_id}:prefs"
    
    @staticmethod
    def rate_limit_key(user_id: int, endpoint: str, window: str) -> str:
        """
        Generate cache key for rate limiting.
        Format: ratelimit:{user_id}:{endpoint}:{window}
        """
        return f"ratelimit:{user_id}:{endpoint}:{window}"
    
    @staticmethod
    def quota_key(provider: str, date: str) -> str:
        """
        Generate cache key for quota tracking.
        Format: quota:{provider}:{date}
        """
        return f"quota:{provider}:{date}"
```

### Cache Invalidation Strategy

```python
class CacheInvalidator:
    """
    Event-driven cache invalidation.
    """
    
    def on_user_profile_update(self, user_id: int):
        """
        Invalidate user-related caches when profile changes.
        """
        # Invalidate user preferences
        self.redis.delete(f"user:{user_id}:prefs")
        
        # Invalidate analytics cache
        self.redis.delete(f"analytics:{user_id}:dashboard")
        
        logger.info(f"Invalidated caches for user {user_id}")
    
    def on_target_role_change(self, user_id: int, old_role: str, new_role: str):
        """
        Invalidate question caches when user changes target role.
        """
        # Invalidate all question caches for old role
        pattern = f"questions:{old_role}:*"
        keys = self.redis.keys(pattern)
        if keys:
            self.redis.delete(*keys)
        
        logger.info(f"Invalidated question caches for role change: {old_role} -> {new_role}")
    
    def on_session_complete(self, session_id: int):
        """
        Invalidate session cache when session completes.
        """
        self.redis.delete(f"session:{session_id}")
        
        # Invalidate user analytics (will be recalculated)
        session = db.query(InterviewSession).get(session_id)
        self.redis.delete(f"analytics:{session.user_id}:dashboard")
```

### Cache Warming Strategy

```python
class CacheWarmer:
    """
    Pre-populate cache with frequently accessed data.
    """
    
    def warm_common_questions(self):
        """
        Pre-generate and cache questions for common role/difficulty combinations.
        """
        common_combinations = [
            ("Software Engineer", "Easy", 5),
            ("Software Engineer", "Medium", 5),
            ("Software Engineer", "Hard", 5),
            ("Product Manager", "Medium", 5),
            ("Data Scientist", "Medium", 5)
        ]
        
        for role, difficulty, count in common_combinations:
            cache_key = CacheKeyBuilder.question_key(role, difficulty, count, ["Technical", "Behavioral"])
            
            # Check if already cached
            if self.redis.exists(cache_key):
                continue
            
            # Generate and cache
            questions = self.question_service.generate(role, difficulty, count)
            self.redis.setex(
                cache_key,
                timedelta(days=30),
                json.dumps(questions)
            )
            
            logger.info(f"Warmed cache for {role} {difficulty}")
```

## Security Architecture

### Authentication Flow

```
Registration Flow:
User → Submit email/password → Validate → Hash password (bcrypt) → 
Store in DB → Generate verification token → Send email → 
User clicks link → Verify token → Activate account

Login Flow:
User → Submit credentials → Retrieve user → Verify password (bcrypt) → 
Check account status → Generate JWT access token (15min) → 
Generate refresh token (7 days) → Store refresh token hash → 
Return both tokens

Token Refresh Flow:
User → Submit refresh token → Validate token → Check if revoked → 
Generate new access token → Return new access token

Logout Flow:
User → Submit request → Invalidate refresh token → 
Clear session data → Return success

Logout All Devices:
User → Submit request → Invalidate all refresh tokens for user → 
Clear all session data → Return success
```

### JWT Token Structure

```python
# Access Token Payload
{
    "sub": 123,  # user_id
    "email": "user@example.com",
    "role": "user",  # or "admin"
    "exp": 1707220200,  # 15 minutes from issue
    "iat": 1707219300,
    "jti": "unique-token-id"
}

# Refresh Token Payload
{
    "sub": 123,  # user_id
    "type": "refresh",
    "exp": 1707824100,  # 7 days from issue
    "iat": 1707219300,
    "jti": "unique-token-id"
}
```

### Authorization Middleware

```python
class AuthorizationMiddleware:
    """
    Middleware for JWT validation and authorization.
    """
    
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
    
    async def __call__(self, request: Request, call_next):
        """
        Validate JWT token and add user context to request.
        """
        # Skip auth for public endpoints
        if request.url.path in ['/health', '/api/v1/auth/register', '/api/v1/auth/login']:
            return await call_next(request)
        
        # Extract token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
        
        token = auth_header.split(' ')[1]
        
        try:
            # Decode and validate JWT
            payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
            
            # Add user context to request state
            request.state.user_id = payload['sub']
            request.state.user_email = payload['email']
            request.state.user_role = payload['role']
            
            # Check if admin endpoint requires admin role
            if request.url.path.startswith('/api/v1/admin') and payload['role'] != 'admin':
                raise HTTPException(status_code=403, detail="Insufficient permissions")
            
            return await call_next(request)
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
```

### Input Sanitization

```python
class InputSanitizer:
    """
    Sanitize user inputs to prevent XSS and injection attacks.
    """
    
    @staticmethod
    def sanitize_html(text: str) -> str:
        """
        Remove HTML tags and escape special characters.
        """
        import bleach
        
        # Allow no HTML tags
        cleaned = bleach.clean(text, tags=[], strip=True)
        
        # Escape HTML entities
        cleaned = html.escape(cleaned)
        
        return cleaned
    
    @staticmethod
    def sanitize_sql(text: str) -> str:
        """
        Prevent SQL injection (though we use ORM, this is defense in depth).
        """
        # Remove SQL keywords and special characters
        dangerous_patterns = [
            r'(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b)',
            r'(--|;|\/\*|\*\/)',
            r'(\bOR\b|\bAND\b).*=.*'
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                raise ValueError("Potentially malicious input detected")
        
        return text
```


## Frontend Architecture

### Component Hierarchy

```
App
├── AuthProvider (Context)
├── ThemeProvider (Material-UI)
├── Router
│   ├── PublicRoutes
│   │   ├── LandingPage
│   │   ├── LoginPage
│   │   ├── RegisterPage
│   │   └── PasswordResetPage
│   │
│   └── ProtectedRoutes (requires authentication)
│       ├── DashboardLayout
│       │   ├── Sidebar
│       │   ├── TopBar
│       │   └── MainContent
│       │       ├── Dashboard
│       │       │   ├── PerformanceOverview
│       │       │   ├── ScoreChart
│       │       │   ├── CategoryBreakdown
│       │       │   └── Recommendations
│       │       │
│       │       ├── InterviewPage
│       │       │   ├── SessionSetup
│       │       │   ├── QuestionDisplay
│       │       │   ├── AnswerEditor
│       │       │   ├── Timer
│       │       │   └── ProgressIndicator
│       │       │
│       │       ├── SessionSummaryPage
│       │       │   ├── ScoreCard
│       │       │   ├── FeedbackList
│       │       │   ├── RadarChart
│       │       │   └── NextSteps
│       │       │
│       │       ├── ResumePage
│       │       │   ├── ResumeUpload
│       │       │   ├── ResumeList
│       │       │   ├── AnalysisResults
│       │       │   └── SkillGapVisualization
│       │       │
│       │       ├── AnalyticsPage
│       │       │   ├── PerformanceTrends
│       │       │   ├── CategoryHeatmap
│       │       │   ├── ComparisonChart
│       │       │   └── LeaderboardWidget
│       │       │
│       │       ├── StudyPlanPage
│       │       │   ├── CurrentPlan
│       │       │   ├── DailyTasks
│       │       │   ├── ProgressTracker
│       │       │   └── ResourceLinks
│       │       │
│       │       ├── ProfilePage
│       │       │   ├── ProfileForm
│       │       │   ├── AchievementBadges
│       │       │   ├── StreakDisplay
│       │       │   └── SettingsPanel
│       │       │
│       │       └── AdminPage (admin only)
│       │           ├── UserManagement
│       │           ├── SystemMetrics
│       │           ├── ContentModeration
│       │           └── FeatureFlags
│       │
│       └── NotFoundPage
```

### Redux Store Structure

```typescript
interface RootState {
  auth: {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
  };
  
  interview: {
    currentSession: InterviewSession | null;
    currentQuestion: Question | null;
    answers: Answer[];
    loading: boolean;
    error: string | null;
  };
  
  analytics: {
    dashboard: DashboardData | null;
    performance: PerformanceData | null;
    comparison: ComparisonData | null;
    loading: boolean;
    error: string | null;
  };
  
  resume: {
    resumes: Resume[];
    currentResume: Resume | null;
    analysis: ResumeAnalysis | null;
    loading: boolean;
    error: string | null;
  };
  
  gamification: {
    achievements: Achievement[];
    streak: StreakData | null;
    leaderboard: LeaderboardEntry[];
    loading: boolean;
    error: string | null;
  };
  
  ui: {
    sidebarOpen: boolean;
    theme: 'light' | 'dark';
    notifications: Notification[];
  };
}
```

### API Integration Pattern

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
});

// Request interceptor: Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post('/api/v1/auth/refresh', {
          refresh_token: refreshToken
        });
        
        const { access_token } = response.data.data;
        localStorage.setItem('accessToken', access_token);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

## Testing Strategy

### Unit Testing

**Backend (Python)**:
```python
# tests/test_ai_orchestrator.py
import pytest
from unittest.mock import Mock, patch
from services.ai_orchestrator import AIOrchestrator

class TestAIOrchestrator:
    """
    Unit tests for AI Orchestrator.
    Target coverage: 80%+
    """
    
    @pytest.fixture
    def orchestrator(self):
        return AIOrchestrator()
    
    def test_route_to_cache_on_hit(self, orchestrator):
        """Test that cached responses are returned immediately."""
        # Arrange
        mock_cache = Mock()
        mock_cache.get.return_value = {"questions": ["Q1", "Q2"]}
        orchestrator.cache_service = mock_cache
        
        context = {"cache_key": "questions:swe:medium:5"}
        
        # Act
        result = orchestrator.route_request("question_gen", context)
        
        # Assert
        assert result == {"questions": ["Q1", "Q2"]}
        mock_cache.get.assert_called_once_with("questions:swe:medium:5")
    
    def test_route_to_agent_for_deep_reasoning(self, orchestrator):
        """Test that resume analysis routes to agent service."""
        # Arrange
        mock_agent_service = Mock()
        mock_agent_service.execute.return_value = {"analysis": "data"}
        orchestrator.agent_service = mock_agent_service
        
        context = {"user_id": 123}
        
        # Act
        result = orchestrator.route_request("resume_analysis", context)
        
        # Assert
        mock_agent_service.execute.assert_called_once()
        assert result == {"analysis": "data"}
    
    def test_provider_selection_algorithm(self, orchestrator):
        """Test that provider selection uses correct scoring."""
        # Arrange
        providers = [
            Mock(name="groq", get_health_score=lambda: 1.0, avg_response_time=800),
            Mock(name="gemini", get_health_score=lambda: 0.8, avg_response_time=1200)
        ]
        orchestrator.traditional_ai_service.providers = providers
        
        # Mock quota tracker
        mock_quota = Mock()
        mock_quota.get_remaining_percentage.return_value = 0.9
        orchestrator.traditional_ai_service.quota_tracker = mock_quota
        
        # Act
        selected = orchestrator.traditional_ai_service.select_provider()
        
        # Assert
        assert selected.name == "groq"  # Higher score
```

**Frontend (TypeScript/Jest)**:
```typescript
// tests/components/QuestionDisplay.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionDisplay from '@/components/QuestionDisplay';

describe('QuestionDisplay', () => {
  const mockQuestion = {
    id: 1,
    question_text: 'What is your greatest strength?',
    category: 'Behavioral',
    difficulty: 'Medium',
    time_limit_seconds: 300
  };
  
  it('renders question text correctly', () => {
    render(<QuestionDisplay question={mockQuestion} />);
    expect(screen.getByText('What is your greatest strength?')).toBeInTheDocument();
  });
  
  it('starts timer on mount', () => {
    jest.useFakeTimers();
    render(<QuestionDisplay question={mockQuestion} />);
    
    expect(screen.getByText('5:00')).toBeInTheDocument();
    
    jest.advanceTimersByTime(1000);
    expect(screen.getByText('4:59')).toBeInTheDocument();
    
    jest.useRealTimers();
  });
  
  it('calls onSubmit when answer is submitted', () => {
    const mockOnSubmit = jest.fn();
    render(<QuestionDisplay question={mockQuestion} onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'My answer' } });
    
    const submitButton = screen.getByText('Submit Answer');
    fireEvent.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith('My answer');
  });
});
```

### Integration Testing

```python
# tests/integration/test_interview_flow.py
import pytest
from fastapi.testclient import TestClient
from main import app

class TestInterviewFlow:
    """
    Integration tests for complete interview flow.
    """
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    @pytest.fixture
    def auth_headers(self, client):
        # Register and login
        client.post('/api/v1/auth/register', json={
            'email': 'test@example.com',
            'password': 'Test123!',
            'name': 'Test User'
        })
        
        response = client.post('/api/v1/auth/login', json={
            'email': 'test@example.com',
            'password': 'Test123!'
        })
        
        token = response.json()['data']['access_token']
        return {'Authorization': f'Bearer {token}'}
    
    def test_complete_interview_flow(self, client, auth_headers):
        """Test full interview flow from creation to summary."""
        # 1. Create interview session
        response = client.post('/api/v1/interviews', 
            headers=auth_headers,
            json={
                'role': 'Software Engineer',
                'difficulty': 'Medium',
                'question_count': 2,
                'categories': ['Technical']
            }
        )
        assert response.status_code == 201
        session_id = response.json()['data']['session_id']
        first_question = response.json()['data']['first_question']
        
        # 2. Submit answer to first question
        response = client.post(f'/api/v1/interviews/{session_id}/answers',
            headers=auth_headers,
            json={
                'question_id': first_question['question_id'],
                'answer_text': 'This is my detailed answer...'
            }
        )
        assert response.status_code == 201
        second_question = response.json()['data']['next_question']
        
        # 3. Submit answer to second question
        response = client.post(f'/api/v1/interviews/{session_id}/answers',
            headers=auth_headers,
            json={
                'question_id': second_question['question_id'],
                'answer_text': 'This is my second answer...'
            }
        )
        assert response.status_code == 201
        
        # 4. Wait for evaluations (in real test, use polling or webhooks)
        import time
        time.sleep(5)
        
        # 5. Get session summary
        response = client.get(f'/api/v1/interviews/{session_id}/summary',
            headers=auth_headers
        )
        assert response.status_code == 200
        summary = response.json()['data']
        
        assert 'overall_session_score' in summary
        assert 'strengths' in summary
        assert 'improvements' in summary
```

### Property-Based Testing

```python
# tests/property/test_question_generation.py
from hypothesis import given, strategies as st
from services.question_service import QuestionService

class TestQuestionGenerationProperties:
    """
    Property-based tests for question generation.
    Run 100+ iterations with random inputs.
    """
    
    @given(
        role=st.sampled_from(['Software Engineer', 'Product Manager', 'Data Scientist']),
        difficulty=st.sampled_from(['Easy', 'Medium', 'Hard']),
        count=st.integers(min_value=1, max_value=20)
    )
    def test_question_count_matches_request(self, role, difficulty, count):
        """
        Property: Generated questions count should match requested count.
        Feature: interview-master-ai, Property 1: Question count consistency
        """
        service = QuestionService()
        questions = service.generate(role, difficulty, count)
        
        assert len(questions) == count
    
    @given(
        role=st.sampled_from(['Software Engineer', 'Product Manager']),
        difficulty=st.sampled_from(['Easy', 'Medium', 'Hard'])
    )
    def test_questions_match_difficulty(self, role, difficulty):
        """
        Property: All generated questions should match requested difficulty.
        Feature: interview-master-ai, Property 2: Difficulty consistency
        """
        service = QuestionService()
        questions = service.generate(role, difficulty, 5)
        
        for question in questions:
            assert question['difficulty'] == difficulty
```

### Performance Testing

```python
# tests/performance/test_api_performance.py
import pytest
import time
from locust import HttpUser, task, between

class InterviewUser(HttpUser):
    """
    Load test simulating user behavior.
    Target: 100 concurrent users, <3s response time
    """
    wait_time = between(1, 3)
    
    def on_start(self):
        """Login before starting tasks."""
        response = self.client.post('/api/v1/auth/login', json={
            'email': 'test@example.com',
            'password': 'Test123!'
        })
        self.token = response.json()['data']['access_token']
        self.headers = {'Authorization': f'Bearer {self.token}'}
    
    @task(3)
    def create_interview(self):
        """Most common operation."""
        with self.client.post('/api/v1/interviews',
            headers=self.headers,
            json={
                'role': 'Software Engineer',
                'difficulty': 'Medium',
                'question_count': 5,
                'categories': ['Technical']
            },
            catch_response=True
        ) as response:
            if response.elapsed.total_seconds() > 3:
                response.failure(f"Too slow: {response.elapsed.total_seconds()}s")
    
    @task(1)
    def get_dashboard(self):
        """Analytics dashboard access."""
        with self.client.get('/api/v1/analytics/dashboard',
            headers=self.headers,
            catch_response=True
        ) as response:
            if response.elapsed.total_seconds() > 0.5:
                response.failure(f"Too slow: {response.elapsed.total_seconds()}s")
```

## Deployment Architecture

### Docker Compose (Local Development)

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/interviewmaster
      - REDIS_URL=redis://redis:6379/0
      - GROQ_API_KEY=${GROQ_API_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8000/api/v1
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev
  
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=interviewmaster
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
  
  celery_worker:
    build: ./backend
    command: celery -A tasks worker --loglevel=info
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/interviewmaster
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis
  
  celery_beat:
    build: ./backend
    command: celery -A tasks beat --loglevel=info
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/interviewmaster
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
  redis_data:
```

### CI/CD Pipeline (GitHub Actions)

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov
      
      - name: Run linting
        run: |
          flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
      
      - name: Run tests
        run: |
          pytest --cov=. --cov-report=xml --cov-report=term
      
      - name: Check coverage
        run: |
          coverage report --fail-under=80
  
  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Render (Staging)
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_STAGING }}
  
  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway (Production)
        run: |
          curl -X POST ${{ secrets.RAILWAY_DEPLOY_HOOK }}
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-06  
**Status**: Draft - Awaiting Review

## Correctness Properties

### What are Correctness Properties?

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

Unlike unit tests that verify specific examples, property-based tests verify universal rules that should hold for all valid inputs. This approach catches edge cases and bugs that example-based testing might miss.

### Core Correctness Properties

**Property 1: Email Validation Consistency**

*For any* string input provided as an email address, the system SHALL accept it if and only if it conforms to RFC 5322 standard format, rejecting all non-conforming inputs with a clear error message.

**Validates: Requirements 1.1, 35.4**

**Property 2: Password Strength Validation**

*For any* string input provided as a password, the system SHALL accept it if and only if it contains at least 8 characters with at least one uppercase letter, one lowercase letter, one number, and one special character.

**Validates: Requirements 1.3**

**Property 3: JWT Token Expiry Consistency**

*For any* successfully authenticated user, the generated JWT access token SHALL have an expiry time of exactly 15 minutes (900 seconds) from the issue time, and refresh tokens SHALL have an expiry of exactly 7 days (604800 seconds).

**Validates: Requirements 2.6**

**Property 4: File Extension Validation**

*For any* file upload attempt, the system SHALL accept the file if and only if the extension is .pdf or .docx (case-insensitive), rejecting all other extensions with HTTP 400.

**Validates: Requirements 6.1**

**Property 5: File Size Boundary Enforcement**

*For any* file upload with valid extension, the system SHALL accept files with size ≤ 10MB and reject files with size > 10MB with a clear error message.

**Validates: Requirements 6.3**

**Property 6: Cache Key Format Consistency**

*For any* question generation request with role, difficulty, and count parameters, the constructed cache key SHALL follow the exact format "questions:{role}:{difficulty}:{count}:{category_hash}" where category_hash is the MD5 hash of sorted categories.

**Validates: Requirements 12.1**

**Property 7: Cache Hit Performance**

*For any* request where the cache key exists and is not expired, the system SHALL return the cached response in under 100ms at the 95th percentile.

**Validates: Requirements 12.3**

**Property 8: Question Generation Performance**

*For any* question generation request (cached or uncached), the system SHALL return questions within 3000ms at the 95th percentile, including all fallback attempts.

**Validates: Requirements 12.14**

**Property 9: JSON Response Validation**

*For any* AI provider response, the system SHALL validate that the response is valid JSON before processing, rejecting malformed responses and triggering fallback to next provider.

**Validates: Requirements 13.1**

**Property 10: Question Text Length Boundaries**

*For any* generated or stored question, the question_text field SHALL have length between 10 and 500 characters inclusive, with questions outside this range rejected during validation.

**Validates: Requirements 13.3**

**Property 11: Answer Text Length Boundaries**

*For any* submitted answer, the answer_text field SHALL have length between 10 and 5000 characters inclusive, with answers outside this range rejected with HTTP 422.

**Validates: Requirements 16.3**

**Property 12: Evaluation Score Calculation**

*For any* answer evaluation with scores for content_quality, clarity, confidence, and technical_accuracy (each 0-100), the overall_score SHALL equal exactly: (content_quality × 0.4) + (clarity × 0.2) + (confidence × 0.2) + (technical_accuracy × 0.2), rounded to nearest integer.

**Validates: Requirements 18.9**

**Property 13: Session Score Aggregation**

*For any* completed interview session with N questions, the overall_session_score SHALL equal the arithmetic mean of all N question overall_scores, rounded to nearest integer.

**Validates: Requirements 19.4**

**Property 14: Achievement Idempotency**

*For any* user and achievement type, triggering the achievement condition multiple times SHALL result in exactly one achievement record in user_achievements table (idempotent operation).

**Validates: Requirements 22.1**

**Property 15: Streak Calculation Logic**

*For any* user practice pattern, the current_streak SHALL increment by 1 when practicing on consecutive days, reset to 1 when gap > 1 day, and remain unchanged when practicing multiple times in same day.

**Validates: Requirements 23.4, 23.6**

**Property 16: Cache Hit Rate Formula**

*For any* cache layer with H hits and M misses, the calculated hit_rate SHALL equal exactly (H / (H + M)) × 100, with proper handling of division by zero (return 0 when H + M = 0).

**Validates: Requirements 25.8**

**Property 17: Cache Performance Target**

*For any* system state after 100 total requests, the cache hit rate SHALL be ≥ 90% for L1 (Questions) and L4 (User Preferences) cache layers.

**Validates: Requirements 25.12**

**Property 18: API Quota Enforcement**

*For any* AI provider, when daily request count reaches the quota limit (Groq: 14400, Gemini: 60/min, HuggingFace: 30000 chars/month), the system SHALL disable that provider and route requests to next available provider.

**Validates: Requirements 26.3**

**Property 19: Agent Execution Timeout**

*For any* AI agent execution (resume analysis, study plan, company coaching), the execution SHALL complete within 20000ms or timeout with graceful fallback to traditional analysis.

**Validates: Requirements 27.11**

**Property 20: Schema Validation Enforcement**

*For any* API endpoint receiving JSON payload, the system SHALL validate the payload against the endpoint's Pydantic schema, rejecting invalid payloads with HTTP 422 and detailed validation errors.

**Validates: Requirements 35.1**

**Property 21: Sensitive Data Encryption**

*For any* sensitive data (API keys, personal information) stored in the database, the data SHALL be encrypted using AES-256-GCM with unique IV per record, with no plaintext sensitive data in database.

**Validates: Requirements 36.1**

**Property 22: SQL Query Optimization**

*For any* database query generated by the ORM, the query SHALL use explicit column selection (SELECT col1, col2, ...) and never use SELECT *, ensuring optimal query performance.

**Validates: Requirements 40.8**

**Property 23: Frontend Performance Budget**

*For any* page load in the application, the First Contentful Paint (FCP) SHALL occur within 1500ms at the 95th percentile under standard network conditions (3G or better).

**Validates: Requirements 41.1**

**Property 24: Keyboard Accessibility**

*For any* interactive element (button, link, input, etc.) in the application, keyboard focus SHALL produce a visible focus indicator with contrast ratio ≥ 3:1 against background.

**Validates: Requirements 42.1**

### Testing Implementation Guidelines

**Property-Based Testing Framework**: Use `hypothesis` for Python backend and `fast-check` for TypeScript frontend.

**Test Configuration**:
- Minimum 100 iterations per property test
- Use shrinking to find minimal failing examples
- Tag each test with feature name and property number
- Run property tests in CI/CD pipeline

**Example Property Test**:

```python
from hypothesis import given, strategies as st
import pytest

@given(
    content_quality=st.integers(min_value=0, max_value=100),
    clarity=st.integers(min_value=0, max_value=100),
    confidence=st.integers(min_value=0, max_value=100),
    technical_accuracy=st.integers(min_value=0, max_value=100)
)
def test_evaluation_score_calculation_property(content_quality, clarity, confidence, technical_accuracy):
    """
    Property 12: Evaluation Score Calculation
    Feature: interview-master-ai, Property 12
    
    For any valid scores (0-100), overall score should equal weighted average.
    """
    # Calculate expected score
    expected = round(
        (content_quality * 0.4) + 
        (clarity * 0.2) + 
        (confidence * 0.2) + 
        (technical_accuracy * 0.2)
    )
    
    # Call system function
    actual = calculate_overall_score(content_quality, clarity, confidence, technical_accuracy)
    
    # Verify property holds
    assert actual == expected, f"Expected {expected}, got {actual}"
    assert 0 <= actual <= 100, f"Score {actual} out of valid range"
```

### Edge Cases and Error Conditions

In addition to properties, the following edge cases require explicit unit tests:

1. **Empty Database State**: System behavior when no questions exist in database
2. **All Providers Down**: Fallback to pre-generated questions when all AI providers fail
3. **Concurrent Session Creation**: Race conditions when multiple users create sessions simultaneously
4. **Token Expiry During Request**: Handling of requests where token expires mid-processing
5. **Cache Eviction Under Memory Pressure**: Behavior when Redis reaches memory limit
6. **Database Connection Loss**: Graceful degradation when database becomes unavailable
7. **Malformed AI Responses**: Handling of unexpected AI provider response formats
8. **File Upload Interruption**: Handling of incomplete file uploads
9. **Evaluation Timeout**: Behavior when evaluation takes longer than expected
10. **Streak Calculation at Midnight**: Correct streak handling across day boundaries

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-06  
**Status**: Complete - Ready for Review
