"""
Answer Evaluation Service

This service evaluates user answers using AI with multi-criteria scoring.

Requirements: 18.1-18.14
"""
import logging
import hashlib
import json
from typing import Dict, Any, Optional
from datetime import timedelta
from sqlalchemy.orm import Session

from app.models.answer import Answer
from app.models.question import Question
from app.models.evaluation import Evaluation
from app.models.user import User
from app.services.ai.orchestrator import AIOrchestrator
from app.services.cache_service import CacheService

logger = logging.getLogger(__name__)


class EvaluationService:
    """
    Service for evaluating user answers with AI.
    
    Requirements: 18.1-18.14
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.ai_orchestrator = AIOrchestrator()
        self.cache_service = CacheService()
    
    def evaluate_answer(self, answer_id: int) -> Dict[str, Any]:
        """
        Evaluate an answer using AI with multi-criteria scoring.
        
        Requirements: 18.1-18.14
        
        Args:
            answer_id: ID of the answer to evaluate
        
        Returns:
            Dictionary with evaluation results
        
        Raises:
            ValueError: If answer not found or invalid
        """
        # Retrieve answer, question, and user profile (Req 18.1)
        answer = self.db.query(Answer).filter(Answer.id == answer_id).first()
        if not answer:
            raise ValueError(f"Answer {answer_id} not found")
        
        question = self.db.query(Question).filter(Question.id == answer.question_id).first()
        if not question:
            raise ValueError(f"Question {answer.question_id} not found")
        
        user = self.db.query(User).filter(User.id == answer.user_id).first()
        if not user:
            raise ValueError(f"User {answer.user_id} not found")
        
        logger.info(f"Evaluating answer {answer_id} for question {question.id}")
        
        # Check cache for similar answer evaluation (Req 18.3, 18.4)
        answer_hash = self._generate_answer_hash(answer.answer_text, question.id)
        cache_key = f"evaluation:{answer_hash}"
        
        cached_evaluation = self.cache_service.get(cache_key)
        if cached_evaluation:
            logger.info(f"Cache hit for answer evaluation {answer_id}")
            # Create evaluation record from cache
            evaluation = self._create_evaluation_from_cache(answer_id, cached_evaluation)
            return self._format_evaluation_response(evaluation)
        
        # Cache miss - generate evaluation with AI (Req 18.5)
        logger.info(f"Cache miss for answer evaluation {answer_id}, calling AI")
        
        # Construct evaluation prompt (Req 18.2)
        prompt = self._construct_evaluation_prompt(
            answer_text=answer.answer_text,
            question_text=question.question_text,
            expected_answer_points=question.expected_answer_points,
            role=user.target_role or "Software Engineer",
            difficulty=question.difficulty
        )
        
        # Call AI provider (Req 18.6)
        try:
            from app.services.ai.types import AIRequest
            
            ai_request = AIRequest(
                prompt=prompt,
                task_type="evaluation",
                max_tokens=1500,
                temperature=0.3  # Lower temperature for more consistent evaluations
            )
            
            ai_response = self.ai_orchestrator.generate(ai_request)
            
            if not ai_response.success:
                raise ValueError(f"AI provider error: {ai_response.error}")
            
            # Extract content from response
            response_content = ai_response.content
            
        except Exception as e:
            logger.error(f"AI evaluation failed for answer {answer_id}: {e}")
            raise ValueError(f"Evaluation failed: {str(e)}")
        
        # Parse evaluation JSON (Req 18.7)
        evaluation_data = self._parse_evaluation_response(response_content)
        
        # Validate scores (Req 18.8)
        self._validate_scores(evaluation_data)
        
        # Calculate overall score (Req 18.9)
        overall_score = self._calculate_overall_score(evaluation_data)
        evaluation_data['overall_score'] = overall_score
        
        # Extract feedback sections (Req 18.10)
        feedback = self._extract_feedback(evaluation_data)
        
        # Create evaluation record (Req 18.11)
        evaluation = Evaluation(
            answer_id=answer_id,
            content_quality=evaluation_data['content_quality'],
            clarity=evaluation_data['clarity'],
            confidence=evaluation_data['confidence'],
            technical_accuracy=evaluation_data['technical_accuracy'],
            overall_score=overall_score,
            strengths=feedback['strengths'],
            improvements=feedback['improvements'],
            suggestions=feedback['suggestions'],
            example_answer=feedback.get('example_answer')
        )
        
        self.db.add(evaluation)
        self.db.flush()
        
        # Cache evaluation (Req 18.12)
        cache_data = {
            'content_quality': evaluation_data['content_quality'],
            'clarity': evaluation_data['clarity'],
            'confidence': evaluation_data['confidence'],
            'technical_accuracy': evaluation_data['technical_accuracy'],
            'overall_score': overall_score,
            'feedback': feedback
        }
        self.cache_service.set(cache_key, cache_data, ttl=timedelta(days=7))
        
        # Update answer with evaluation_id (Req 18.14)
        answer.evaluation_id = evaluation.id
        self.db.commit()
        self.db.refresh(evaluation)
        
        logger.info(f"Evaluation {evaluation.id} created for answer {answer_id} with score {overall_score}")
        
        return self._format_evaluation_response(evaluation)
    
    def _generate_answer_hash(self, answer_text: str, question_id: int) -> str:
        """Generate hash for answer caching."""
        content = f"{question_id}:{answer_text.lower().strip()}"
        return hashlib.sha256(content.encode()).hexdigest()
    
    def _construct_evaluation_prompt(
        self,
        answer_text: str,
        question_text: str,
        expected_answer_points: list,
        role: str,
        difficulty: str
    ) -> str:
        """
        Construct evaluation prompt for AI.
        
        Requirements: 18.2
        """
        prompt = f"""You are an expert interview coach evaluating a candidate's answer for a {role} position.

Question: {question_text}

Expected Answer Points:
{chr(10).join(f"- {point}" for point in expected_answer_points)}

Candidate's Answer:
{answer_text}

Difficulty Level: {difficulty}

Evaluate the answer across these criteria and provide scores (0-100) and detailed feedback:

1. Content Quality (0-100): How well does the answer address the question and cover expected points?
2. Clarity (0-100): How clear, structured, and easy to understand is the answer?
3. Confidence (0-100): Does the answer demonstrate confidence and conviction?
4. Technical Accuracy (0-100): Is the technical information correct and appropriate for the role?

Provide your evaluation in the following JSON format:
{{
  "content_quality": <score 0-100>,
  "clarity": <score 0-100>,
  "confidence": <score 0-100>,
  "technical_accuracy": <score 0-100>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "example_answer": "A brief example of a strong answer to this question"
}}

Be constructive, specific, and actionable in your feedback."""
        
        return prompt
    
    def _parse_evaluation_response(self, ai_response: str) -> Dict[str, Any]:
        """
        Parse AI evaluation response.
        
        Requirements: 18.7
        """
        try:
            # Try to extract JSON from response
            # AI might wrap JSON in markdown code blocks
            if "```json" in ai_response:
                start = ai_response.find("```json") + 7
                end = ai_response.find("```", start)
                json_str = ai_response[start:end].strip()
            elif "```" in ai_response:
                start = ai_response.find("```") + 3
                end = ai_response.find("```", start)
                json_str = ai_response[start:end].strip()
            else:
                json_str = ai_response.strip()
            
            evaluation_data = json.loads(json_str)
            
            # Ensure all required fields exist
            required_fields = ['content_quality', 'clarity', 'confidence', 'technical_accuracy']
            for field in required_fields:
                if field not in evaluation_data:
                    raise ValueError(f"Missing required field: {field}")
            
            return evaluation_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse evaluation JSON: {e}")
            logger.error(f"AI Response: {ai_response}")
            raise ValueError(f"Invalid evaluation response format: {str(e)}")
    
    def _validate_scores(self, evaluation_data: Dict[str, Any]):
        """
        Validate evaluation scores are between 0 and 100.
        
        Requirements: 18.8
        """
        score_fields = ['content_quality', 'clarity', 'confidence', 'technical_accuracy']
        
        for field in score_fields:
            score = evaluation_data.get(field)
            if not isinstance(score, (int, float)):
                raise ValueError(f"Score {field} must be a number, got {type(score)}")
            if score < 0 or score > 100:
                raise ValueError(f"Score {field} must be between 0 and 100, got {score}")
    
    def _calculate_overall_score(self, evaluation_data: Dict[str, Any]) -> float:
        """
        Calculate overall score as weighted average.
        
        Requirements: 18.9
        
        Weights:
        - content_quality: 40%
        - clarity: 20%
        - confidence: 20%
        - technical_accuracy: 20%
        """
        overall_score = (
            evaluation_data['content_quality'] * 0.4 +
            evaluation_data['clarity'] * 0.2 +
            evaluation_data['confidence'] * 0.2 +
            evaluation_data['technical_accuracy'] * 0.2
        )
        
        return round(overall_score, 2)
    
    def _extract_feedback(self, evaluation_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract feedback sections from evaluation data.
        
        Requirements: 18.10
        """
        feedback = {
            'strengths': evaluation_data.get('strengths', []),
            'improvements': evaluation_data.get('improvements', []),
            'suggestions': evaluation_data.get('suggestions', []),
            'example_answer': evaluation_data.get('example_answer')
        }
        
        # Ensure lists are not empty
        if not feedback['strengths']:
            feedback['strengths'] = ["Answer provided"]
        if not feedback['improvements']:
            feedback['improvements'] = ["Continue practicing"]
        if not feedback['suggestions']:
            feedback['suggestions'] = ["Review the question and expected points"]
        
        return feedback
    
    def _create_evaluation_from_cache(
        self,
        answer_id: int,
        cached_data: Dict[str, Any]
    ) -> Evaluation:
        """Create evaluation record from cached data."""
        feedback = cached_data['feedback']
        
        evaluation = Evaluation(
            answer_id=answer_id,
            content_quality=cached_data['content_quality'],
            clarity=cached_data['clarity'],
            confidence=cached_data['confidence'],
            technical_accuracy=cached_data['technical_accuracy'],
            overall_score=cached_data['overall_score'],
            strengths=feedback['strengths'],
            improvements=feedback['improvements'],
            suggestions=feedback['suggestions'],
            example_answer=feedback.get('example_answer')
        )
        
        self.db.add(evaluation)
        self.db.flush()
        
        # Update answer with evaluation_id
        answer = self.db.query(Answer).filter(Answer.id == answer_id).first()
        if answer:
            answer.evaluation_id = evaluation.id
        
        self.db.commit()
        self.db.refresh(evaluation)
        
        return evaluation
    
    def _format_evaluation_response(self, evaluation: Evaluation) -> Dict[str, Any]:
        """Format evaluation for API response."""
        return {
            'evaluation_id': evaluation.id,
            'answer_id': evaluation.answer_id,
            'scores': {
                'content_quality': evaluation.content_quality,
                'clarity': evaluation.clarity,
                'confidence': evaluation.confidence,
                'technical_accuracy': evaluation.technical_accuracy,
                'overall_score': evaluation.overall_score
            },
            'feedback': {
                'strengths': evaluation.strengths,
                'improvements': evaluation.improvements,
                'suggestions': evaluation.suggestions,
                'example_answer': evaluation.example_answer
            },
            'evaluated_at': evaluation.evaluated_at.isoformat() if evaluation.evaluated_at else None
        }
