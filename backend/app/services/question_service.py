"""
Question Generation Service

This service handles question generation with multi-layer caching:
1. Redis cache (fastest, 100ms response)
2. Database (fast, 500ms response)
3. AI generation (slowest, 3000ms response)

Requirements: 12.1-12.15, 13.1-13.10
"""
import json
import hashlib
import logging
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.question import Question
from app.services.cache_service import CacheService
from app.services.ai.orchestrator import AIOrchestrator
from app.services.ai.types import AIRequest, AIResponse

logger = logging.getLogger(__name__)


class QuestionService:
    """Service for generating and managing interview questions"""
    
    # Cache TTL constants
    CACHE_TTL_SECONDS = 30 * 24 * 60 * 60  # 30 days
    
    # Validation constants
    MIN_QUESTION_LENGTH = 10
    MAX_QUESTION_LENGTH = 500
    MIN_TIME_LIMIT = 120  # 2 minutes
    MAX_TIME_LIMIT = 600  # 10 minutes
    MIN_ANSWER_POINTS = 3
    
    VALID_CATEGORIES = {'Technical', 'Behavioral', 'Domain_Specific', 'System_Design', 'Coding'}
    VALID_DIFFICULTIES = {'Easy', 'Medium', 'Hard', 'Expert'}
    
    def __init__(self, db: Session, cache: Optional[CacheService] = None):
        """Initialize question service"""
        self.db = db
        self.cache = cache or CacheService()
        # Orchestrator doesn't need db, it uses cache_service
        self.orchestrator = AIOrchestrator(cache_service=self.cache)
    
    def generate(
        self,
        role: str,
        difficulty: str,
        question_count: int,
        categories: Optional[List[str]] = None
    ) -> List[Dict]:
        """
        Generate interview questions with multi-layer caching.
        
        Requirements: 12.1-12.15
        
        Args:
            role: Target job role
            difficulty: Question difficulty level
            question_count: Number of questions to generate
            categories: Optional list of question categories
            
        Returns:
            List of question dictionaries
        """
        # Validate inputs
        if difficulty not in self.VALID_DIFFICULTIES:
            raise ValueError(f"Invalid difficulty. Must be one of: {self.VALID_DIFFICULTIES}")
        
        if question_count < 1 or question_count > 20:
            raise ValueError("question_count must be between 1 and 20")
        
        if categories:
            invalid_cats = set(categories) - self.VALID_CATEGORIES
            if invalid_cats:
                raise ValueError(f"Invalid categories: {invalid_cats}")
        
        # Step 1: Check Redis cache
        cache_key = self._construct_cache_key(role, difficulty, question_count, categories)
        cached_questions = self._get_from_cache(cache_key)
        if cached_questions:
            logger.info(f"Cache hit for {cache_key}")
            return cached_questions
        
        # Step 2: Check database
        db_questions = self._get_from_database(role, difficulty, question_count, categories)
        if db_questions and len(db_questions) >= question_count:
            logger.info(f"Database hit for role={role}, difficulty={difficulty}")
            questions_data = [q.to_dict() for q in db_questions[:question_count]]
            self._cache_questions(cache_key, questions_data)
            return questions_data
        
        # Step 3: Generate with AI
        logger.info(f"Generating questions with AI for role={role}, difficulty={difficulty}")
        generated_questions = self._generate_with_ai(role, difficulty, question_count, categories)
        
        # Validate and store questions
        validated_questions = []
        for q_data in generated_questions:
            if self._validate_question(q_data):
                question = self._store_question(q_data, role, difficulty)
                validated_questions.append(question.to_dict())
            else:
                logger.warning(f"Question validation failed: {q_data.get('question_text', '')[:50]}")
        
        if not validated_questions:
            raise Exception("Failed to generate valid questions")
        
        # Cache the results
        self._cache_questions(cache_key, validated_questions)
        
        return validated_questions
    
    def _construct_cache_key(
        self,
        role: str,
        difficulty: str,
        question_count: int,
        categories: Optional[List[str]]
    ) -> str:
        """
        Construct cache key from parameters.
        
        Requirements: 12.1
        """
        # Normalize role and difficulty
        role_normalized = role.lower().replace(' ', '_')
        difficulty_normalized = difficulty.lower()
        
        # Sort categories for consistent cache keys
        categories_str = ','.join(sorted(categories)) if categories else 'all'
        
        return f"questions:{role_normalized}:{difficulty_normalized}:{question_count}:{categories_str}"
    
    def _get_from_cache(self, cache_key: str) -> Optional[List[Dict]]:
        """
        Get questions from Redis cache.
        
        Requirements: 12.2, 12.3
        """
        try:
            cached_data = self.cache.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            logger.error(f"Cache retrieval error: {e}")
        return None
    
    def _get_from_database(
        self,
        role: str,
        difficulty: str,
        question_count: int,
        categories: Optional[List[str]]
    ) -> List[Question]:
        """
        Get questions from database.
        
        Requirements: 12.4, 12.5
        """
        try:
            query = self.db.query(Question).filter(
                Question.role == role,
                Question.difficulty == difficulty,
                Question.deleted_at.is_(None)
            )
            
            if categories:
                query = query.filter(Question.category.in_(categories))
            
            questions = query.limit(question_count * 2).all()  # Get extra for variety
            return questions
        except Exception as e:
            logger.error(f"Database query error: {e}")
            return []
    
    def _generate_with_ai(
        self,
        role: str,
        difficulty: str,
        question_count: int,
        categories: Optional[List[str]]
    ) -> List[Dict]:
        """
        Generate questions using AI orchestrator.
        
        Requirements: 12.6-12.13
        """
        # Construct prompt
        categories_str = ', '.join(categories) if categories else 'all categories'
        
        prompt = f"""Generate {question_count} interview questions for a {role} position at {difficulty} difficulty level.

Categories: {categories_str}

For each question, provide:
1. question_text: The interview question (10-500 characters)
2. category: One of {list(self.VALID_CATEGORIES)}
3. difficulty: {difficulty}
4. expected_answer_points: Array of 3-5 key points expected in a good answer
5. time_limit_seconds: Recommended time limit (120-600 seconds)

Return ONLY a JSON array of questions with no additional text.

Example format:
[
  {{
    "question_text": "Describe a time when you had to debug a complex production issue.",
    "category": "Behavioral",
    "difficulty": "{difficulty}",
    "expected_answer_points": [
      "Clearly described the problem and its impact",
      "Explained systematic debugging approach",
      "Demonstrated technical problem-solving skills",
      "Showed ownership and follow-through"
    ],
    "time_limit_seconds": 300
  }}
]"""
        
        # Create AI request
        request = AIRequest(
            prompt=prompt,
            max_tokens=2000,
            temperature=0.7,
            task_type="question_generation"
        )
        
        # Call orchestrator
        response = self.orchestrator.generate(request)
        
        if not response.success:
            raise Exception(f"AI generation failed: {response.error}")
        
        # Parse response
        try:
            # Extract JSON from response (handle markdown code blocks)
            content = response.content.strip()
            if content.startswith('```'):
                # Remove markdown code block markers
                lines = content.split('\n')
                content = '\n'.join(lines[1:-1]) if len(lines) > 2 else content
                content = content.replace('```json', '').replace('```', '').strip()
            
            questions = json.loads(content)
            
            if not isinstance(questions, list):
                raise ValueError("Response is not a list")
            
            return questions
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            logger.error(f"Response content: {response.content[:500]}")
            raise Exception("Failed to parse AI response")
    
    def _validate_question(self, question_data: Dict) -> bool:
        """
        Validate question structure and content.
        
        Requirements: 13.1-13.10
        """
        try:
            # Check required fields
            required_fields = ['question_text', 'category', 'difficulty', 'expected_answer_points', 'time_limit_seconds']
            for field in required_fields:
                if field not in question_data:
                    logger.warning(f"Missing required field: {field}")
                    return False
            
            # Validate question_text length
            question_text = question_data['question_text']
            if len(question_text) < self.MIN_QUESTION_LENGTH or len(question_text) > self.MAX_QUESTION_LENGTH:
                logger.warning(f"Invalid question_text length: {len(question_text)}")
                return False
            
            # Validate category
            if question_data['category'] not in self.VALID_CATEGORIES:
                logger.warning(f"Invalid category: {question_data['category']}")
                return False
            
            # Validate difficulty
            if question_data['difficulty'] not in self.VALID_DIFFICULTIES:
                logger.warning(f"Invalid difficulty: {question_data['difficulty']}")
                return False
            
            # Validate expected_answer_points
            answer_points = question_data['expected_answer_points']
            if not isinstance(answer_points, list) or len(answer_points) < self.MIN_ANSWER_POINTS:
                logger.warning(f"Invalid expected_answer_points: {answer_points}")
                return False
            
            # Validate time_limit_seconds
            time_limit = question_data['time_limit_seconds']
            if not isinstance(time_limit, int) or time_limit < self.MIN_TIME_LIMIT or time_limit > self.MAX_TIME_LIMIT:
                logger.warning(f"Invalid time_limit_seconds: {time_limit}")
                return False
            
            # Content filter (basic profanity check)
            profanity_words = ['fuck', 'shit', 'damn', 'bitch']  # Simplified list
            question_lower = question_text.lower()
            if any(word in question_lower for word in profanity_words):
                logger.warning(f"Question contains inappropriate content")
                return False
            
            return True
        except Exception as e:
            logger.error(f"Validation error: {e}")
            return False
    
    def _store_question(self, question_data: Dict, role: str, difficulty: str) -> Question:
        """
        Store validated question in database.
        
        Requirements: 13.9
        """
        question = Question(
            question_text=question_data['question_text'],
            category=question_data['category'],
            difficulty=difficulty,
            role=role,
            expected_answer_points=question_data['expected_answer_points'],
            time_limit_seconds=question_data['time_limit_seconds'],
            provider_name=question_data.get('provider_name'),
            generation_metadata=question_data.get('metadata'),
            usage_count=0
        )
        
        self.db.add(question)
        self.db.commit()
        self.db.refresh(question)
        
        logger.info(f"Stored question {question.id} for role={role}, difficulty={difficulty}")
        return question
    
    def _cache_questions(self, cache_key: str, questions: List[Dict]) -> None:
        """
        Cache questions in Redis.
        
        Requirements: 12.10, 12.12
        """
        try:
            self.cache.set(cache_key, json.dumps(questions), ttl=self.CACHE_TTL_SECONDS)
            logger.info(f"Cached {len(questions)} questions with key {cache_key}")
        except Exception as e:
            logger.error(f"Cache storage error: {e}")
