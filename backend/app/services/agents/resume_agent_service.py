"""
Resume Intelligence Agent Service

Provides comprehensive resume analysis using LangChain agents with:
- Skill inventory analysis
- Experience timeline analysis
- Skill gap identification
- Learning roadmap generation
- 30-day caching
- Fallback to traditional NLP

Requirements: 27.1-27.13
"""
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from langchain_core.prompts import PromptTemplate
from langchain_core.tools import Tool

from app.services.agents.base_agent import BaseAgent
from app.services.agents.agent_executor import AgentExecutor
from app.services.agents.tools.resume_tools import (
    ResumeParserTool,
    SkillExtractorTool,
    ExperienceAnalyzerTool,
    SkillGapTool,
    RoadmapGeneratorTool,
    AnalysisFormatterTool
)
from app.models.resume import Resume, ResumeStatus
from app.models.resume_analysis import ResumeAnalysis

logger = logging.getLogger(__name__)


class ResumeIntelligenceAgent(BaseAgent):
    """
    LangChain agent for comprehensive resume analysis.
    
    Uses 5 custom tools to analyze resume and generate insights.
    
    Requirements: 27.4, 27.5, 27.6
    """
    
    def _register_tools(self) -> list[Tool]:
        """
        Register resume analysis tools.
        
        Returns:
            List of 5 resume analysis tools
        """
        return [
            ResumeParserTool.as_tool(),
            SkillExtractorTool.as_tool(),
            ExperienceAnalyzerTool.as_tool(),
            SkillGapTool.as_tool(),
            RoadmapGeneratorTool.as_tool(),
            AnalysisFormatterTool.as_tool()
        ]
    
    def _get_prompt_template(self) -> PromptTemplate:
        """
        Get prompt template for resume analysis agent.

        Returns:
            PromptTemplate for ReAct agent
        """
        template = """You are a resume analysis expert. Analyze the resume and return structured JSON data.

Available tools: {tools}

WORKFLOW:
1. Use resume_parser to extract resume data
2. Use skill_extractor to analyze skills  
3. Use experience_analyzer to analyze career progression
4. Use skill_gap_analyzer to identify gaps for target role
5. Use roadmap_generator to create improvement plan
6. Use analysis_formatter to create final JSON output

IMPORTANT: Your Final Answer must be ONLY the JSON output from analysis_formatter tool. No additional text.

Question: {input}

{agent_scratchpad}"""

        return PromptTemplate(
            template=template,
            input_variables=["input", "tools", "agent_scratchpad"]
        )



class ResumeAgentService:
    """
    Service for resume intelligence agent operations.
    
    Handles:
    - Cache checking (30-day TTL)
    - Agent execution
    - Fallback to traditional NLP
    - Result storage
    
    Requirements: 27.1-27.13
    """
    
    CACHE_TTL_DAYS = 30
    
    def __init__(self, db: Session):
        self.db = db
    
    def analyze_resume(
        self,
        resume_id: int,
        user_id: int,
        target_role: str = "Software Engineer",
        force_refresh: bool = False
    ) -> Dict[str, Any]:
        """
        Analyze resume using LangChain agent.
        
        Args:
            resume_id: Resume ID to analyze
            user_id: User ID (for authorization)
            target_role: Target role for skill gap analysis
            force_refresh: Force new analysis (skip cache)
            
        Returns:
            Dictionary with analysis results
            
        Raises:
            ValueError: If resume not found or not ready
            
        Requirements: 27.1-27.13
        """
        # Requirement 27.1: Validate resume exists and is ready
        resume = self._validate_resume(resume_id, user_id)
        
        # Requirement 27.2, 27.3: Check cache (< 30 days old)
        if not force_refresh:
            cached_analysis = self._get_cached_analysis(resume_id, user_id)
            if cached_analysis:
                logger.info(f"Returning cached analysis for resume {resume_id}")
                return self._format_analysis_response(cached_analysis, from_cache=True)
        
        # Execute agent analysis
        error_message = None
        try:
            analysis_result = self._execute_agent_analysis(resume, target_role)
            
            # Store in database
            analysis_record = self._store_analysis(
                resume_id=resume_id,
                user_id=user_id,
                analysis_data=analysis_result['output'],
                agent_reasoning=analysis_result['reasoning_steps'],
                execution_time_ms=analysis_result['execution_time_ms'],
                status=analysis_result['status']
            )
            
            # Ensure the analysis is committed and visible
            self.db.commit()
            self.db.refresh(analysis_record)
            self.db.expunge_all()  # Clear session cache
            logger.info(f"✅ AI analysis stored and committed for resume {resume_id} (ID: {analysis_record.id})")
            
            # Verify it's immediately visible
            verification = self.db.query(ResumeAnalysis).filter(
                ResumeAnalysis.id == analysis_record.id
            ).first()
            if verification:
                logger.info(f"✅ Analysis verified visible in database")
            else:
                logger.error(f"❌ Analysis not visible after commit!")
            
            return self._format_analysis_response(analysis_record, from_cache=False)
            
        except Exception as e:
            error_message = str(e)
            logger.error(f"Agent analysis failed: {error_message}")
            
            # Requirement 27.13: Fallback to traditional NLP
            fallback_result = self._fallback_analysis(resume, target_role)
            
            # Store fallback result
            analysis_record = self._store_analysis(
                resume_id=resume_id,
                user_id=user_id,
                analysis_data=fallback_result,
                agent_reasoning=[],
                execution_time_ms=0,
                status='fallback'
            )
            
            return self._format_analysis_response(analysis_record, from_cache=False, error=error_message)
    
    def _validate_resume(self, resume_id: int, user_id: int) -> Resume:
        """
        Validate resume exists and is ready for analysis.
        
        Automatically triggers processing if resume is in UPLOADED status.
        
        Args:
            resume_id: Resume ID
            user_id: User ID
            
        Returns:
            Resume object
            
        Raises:
            ValueError: If validation fails
            
        Requirement: 27.1
        """
        resume = self.db.query(Resume).filter(
            Resume.id == resume_id,
            Resume.user_id == user_id,
            Resume.deleted_at.is_(None)
        ).first()
        
        if not resume:
            raise ValueError(f"Resume {resume_id} not found for user {user_id}")
        
        # Auto-trigger processing if resume is still in UPLOADED status
        if resume.status == ResumeStatus.UPLOADED.value:
            logger.warning(
                f"Resume {resume_id} is in UPLOADED status, triggering processing"
            )
            # Trigger processing in background
            from app.tasks.resume_tasks import extract_resume_text_task
            import threading
            thread = threading.Thread(
                target=extract_resume_text_task,
                args=(resume_id,)
            )
            thread.daemon = True
            thread.start()
            
            raise ValueError(
                f"Resume {resume_id} is not ready for analysis and is being processed. "
                f"Please wait a few moments and try again. "
                f"Processing typically takes 30-60 seconds."
            )
        
        if resume.status not in [ResumeStatus.SKILLS_EXTRACTED.value, ResumeStatus.COMPLETED.value]:
            status_messages = {
                ResumeStatus.TEXT_EXTRACTED.value: "Text extraction complete, skill extraction in progress",
                ResumeStatus.EXTRACTION_FAILED.value: "Processing failed, please try uploading the resume again"
            }
            message = status_messages.get(
                resume.status,
                f"Current status: {resume.status}"
            )
            raise ValueError(
                f"Resume {resume_id} is not ready for analysis. "
                f"{message}. "
                f"Required status: skills_extracted or completed"
            )
        
        if not resume.extracted_text:
            raise ValueError(f"Resume {resume_id} has no extracted text")
        
        return resume
    
    def _get_cached_analysis(self, resume_id: int, user_id: int = None) -> Optional[ResumeAnalysis]:
        """
        Get cached analysis if less than 30 days old.
        
        Args:
            resume_id: Resume ID
            user_id: User ID (optional, for ownership check)
            
        Returns:
            ResumeAnalysis or None
            
        Requirements: 27.2, 27.3
        """
        cutoff_date = datetime.utcnow() - timedelta(days=self.CACHE_TTL_DAYS)
        
        logger.debug(f"Looking for cached analysis for resume {resume_id} (cutoff: {cutoff_date})")
        
        query = self.db.query(ResumeAnalysis).filter(
            ResumeAnalysis.resume_id == resume_id,
            ResumeAnalysis.deleted_at.is_(None),
            ResumeAnalysis.created_at >= cutoff_date,
            ResumeAnalysis.status.in_(['success', 'fallback'])
        )
        
        # Add user_id filter if provided
        if user_id is not None:
            query = query.filter(ResumeAnalysis.user_id == user_id)
        
        analysis = query.order_by(ResumeAnalysis.created_at.desc()).first()
        
        if not analysis:
            # Check if there are ANY analyses for this resume (for debugging)
            any_query = self.db.query(ResumeAnalysis).filter(
                ResumeAnalysis.resume_id == resume_id,
                ResumeAnalysis.deleted_at.is_(None)
            )
            if user_id is not None:
                any_query = any_query.filter(ResumeAnalysis.user_id == user_id)
                
            any_analysis = any_query.order_by(ResumeAnalysis.created_at.desc()).first()
            
            if any_analysis:
                logger.debug(
                    f"Found analysis for resume {resume_id} but it's too old or wrong status "
                    f"(status: {any_analysis.status}, created: {any_analysis.created_at})"
                )
            else:
                logger.debug(f"No analysis found at all for resume {resume_id}")
        else:
            logger.debug(
                f"Found cached analysis for resume {resume_id} "
                f"(ID: {analysis.id}, status: {analysis.status}, created: {analysis.created_at})"
            )
        
        return analysis
    
    def _execute_agent_analysis(
        self,
        resume: Resume,
        target_role: str
    ) -> Dict[str, Any]:
        """
        Execute LangChain agent for resume analysis.
        
        Args:
            resume: Resume object
            target_role: Target role for analysis
            
        Returns:
            Agent execution result
            
        Requirements: 27.4, 27.5, 27.6, 27.11, 27.12
        """
        # Initialize agent
        agent = ResumeIntelligenceAgent(
            max_iterations=8,  # Reduced to prevent token overflow (6 tools + 2 buffer)
            max_execution_time=60.0,
            verbose=True
        )
        
        # Create executor with fallback
        executor = AgentExecutor(
            agent=agent,
            fallback_function=lambda input_data: self._fallback_analysis(
                resume,
                input_data.get('target_role', 'Software Engineer')
            )
        )
        
        # Prepare input
        input_data = {
            'input': f"""Analyze resume {resume.id} for target role: {target_role}

REQUIRED STEPS:
1. Use resume_parser tool with resume_id: {resume.id}
2. Use skill_extractor tool with the parsed data
3. Use experience_analyzer tool with the parsed data  
4. Use skill_gap_analyzer tool with skills and target role: {target_role}
5. Use roadmap_generator tool with gap analysis results
6. Use analysis_formatter tool with all collected data

Your Final Answer must be ONLY the JSON output from analysis_formatter tool.""",
            'resume_id': resume.id,
            'target_role': target_role
        }
        
        # Execute with fallback
        result = executor.execute_with_fallback(input_data)
        
        logger.info(f"Agent result status: {result['status']}, output length: {len(result.get('output', '')) if result.get('output') else 0}")
        
        # Requirement 27.8: Validate output structure
        # Handle both 'success' and 'error' status if output contains JSON
        if result.get('output'):
            try:
                logger.info(f"Attempting to validate agent output (length: {len(result['output'])} chars, status: {result['status']})")
                logger.debug(f"Output preview: {result['output'][:200]}")
                validated_output = self._validate_and_parse_output(
                    result['output'],
                    resume,
                    target_role
                )
                result['output'] = validated_output
                result['status'] = 'success'  # Mark as success if validation passes
                logger.info("✅ Agent output successfully validated and parsed - marking as SUCCESS")
                return result
            except ValueError as e:
                logger.error(f"Agent output validation failed: {e}")
                logger.info("Output validation failed, attempting to extract JSON from reasoning steps or error")
                
                # Try to extract JSON from reasoning steps even when there's output (fallback case)
                extracted_json = None
                
                # First, try to extract from error message (for ReAct format errors)
                if result.get('error') and result.get('status') == 'error':
                    error_msg = str(result['error'])
                    logger.info(f"Checking error message for JSON (length: {len(error_msg)})")
                    logger.debug(f"Error message preview: {error_msg[:300]}...")
                    
                    # Look for the ReAct format error pattern with JSON
                    if "Missing 'Action:' after 'Thought:{" in error_msg and "{" in error_msg and "}" in error_msg:
                        logger.info("Found ReAct format error with JSON, attempting extraction")
                        # Find the JSON in the error message
                        start_idx = error_msg.find("{")
                        if start_idx >= 0:
                            # Find the matching closing brace
                            brace_count = 0
                            end_idx = -1
                            for j in range(start_idx, len(error_msg)):
                                if error_msg[j] == "{":
                                    brace_count += 1
                                elif error_msg[j] == "}":
                                    brace_count -= 1
                                    if brace_count == 0:
                                        end_idx = j + 1
                                        break
                            
                            if end_idx > start_idx:
                                potential_json = error_msg[start_idx:end_idx]
                                logger.info(f"Extracted potential JSON from error, length: {len(potential_json)}")
                                logger.debug(f"Extracted JSON from error: {potential_json[:200]}...")
                                try:
                                    import json
                                    json.loads(potential_json)
                                    extracted_json = potential_json
                                    logger.info(f"✅ Found valid JSON in error message: {extracted_json[:100]}...")
                                except json.JSONDecodeError as e:
                                    logger.warning(f"Error JSON validation failed: {e}")
                
                # If not found in error, try reasoning steps
                if not extracted_json and result.get('reasoning_steps'):
                    logger.info(f"Found {len(result['reasoning_steps'])} reasoning steps")
                    for i, step in enumerate(reversed(result['reasoning_steps'])):
                        logger.info(f"Processing step {i+1}")
                        
                        # Check if this is an exception step with JSON in thought
                        if step.get('tool') == '_Exception' and step.get('thought'):
                            step_text = step['thought']
                            logger.info(f"Found _Exception step with thought, length: {len(step_text)}")
                            logger.debug(f"Exception step thought: {step_text[:200]}...")
                            
                            # Remove markdown code blocks if present
                            if "```json" in step_text:
                                logger.info("Found ```json marker, extracting from markdown")
                                # Extract content between ```json and ```
                                start_marker = "```json"
                                end_marker = "```"
                                start_idx = step_text.find(start_marker)
                                if start_idx >= 0:
                                    start_idx += len(start_marker)
                                    end_idx = step_text.find(end_marker, start_idx)
                                    if end_idx >= 0:
                                        step_text = step_text[start_idx:end_idx].strip()
                                        logger.info(f"Extracted from markdown, new length: {len(step_text)}")
                                        logger.debug(f"Extracted from markdown: {step_text[:200]}...")
                            
                            if "{" in step_text and "}" in step_text:
                                logger.info("Found JSON braces in exception step, attempting extraction")
                                # Try to extract JSON from step
                                start_idx = step_text.find("{")
                                # Find the matching closing brace
                                brace_count = 0
                                end_idx = -1
                                for j in range(start_idx, len(step_text)):
                                    if step_text[j] == "{":
                                        brace_count += 1
                                    elif step_text[j] == "}":
                                        brace_count -= 1
                                        if brace_count == 0:
                                            end_idx = j + 1
                                            break
                                
                                if end_idx > start_idx:
                                    potential_json = step_text[start_idx:end_idx]
                                    logger.info(f"Extracted potential JSON from exception step, length: {len(potential_json)}")
                                    logger.debug(f"Extracted JSON from exception step: {potential_json[:200]}...")
                                    try:
                                        import json
                                        json.loads(potential_json)
                                        extracted_json = potential_json
                                        logger.info(f"✅ Found valid JSON in exception step: {extracted_json[:100]}...")
                                        break
                                    except json.JSONDecodeError as e:
                                        logger.warning(f"Exception step JSON validation failed: {e}")
                                        logger.debug("Exception step JSON validation failed, trying next step")
                                        continue
                                else:
                                    logger.warning("Could not find matching braces in exception step")
                            else:
                                logger.debug("No JSON braces found in exception step")
                        else:
                            # Regular reasoning step processing
                            step_text = step.get('observation', '') + step.get('thought', '')
                            logger.info(f"Step text length: {len(step_text)}")
                            logger.debug(f"Checking reasoning step: {step_text[:200]}...")
                            
                            # Remove markdown code blocks if present
                            if "```json" in step_text:
                                logger.info("Found ```json marker, extracting from markdown")
                                # Extract content between ```json and ```
                                start_marker = "```json"
                                end_marker = "```"
                                start_idx = step_text.find(start_marker)
                                if start_idx >= 0:
                                    start_idx += len(start_marker)
                                    end_idx = step_text.find(end_marker, start_idx)
                                    if end_idx >= 0:
                                        step_text = step_text[start_idx:end_idx].strip()
                                        logger.info(f"Extracted from markdown, new length: {len(step_text)}")
                                        logger.debug(f"Extracted from markdown: {step_text[:200]}...")
                            
                            if "{" in step_text and "}" in step_text:
                                logger.info("Found JSON braces, attempting extraction")
                                # Try to extract JSON from step
                                start_idx = step_text.find("{")
                                # Find the matching closing brace
                                brace_count = 0
                                end_idx = -1
                                for j in range(start_idx, len(step_text)):
                                    if step_text[j] == "{":
                                        brace_count += 1
                                    elif step_text[j] == "}":
                                        brace_count -= 1
                                        if brace_count == 0:
                                            end_idx = j + 1
                                            break
                                
                                if end_idx > start_idx:
                                    potential_json = step_text[start_idx:end_idx]
                                    logger.info(f"Extracted potential JSON, length: {len(potential_json)}")
                                    logger.debug(f"Extracted potential JSON from reasoning: {potential_json[:200]}...")
                                    try:
                                        import json
                                        json.loads(potential_json)
                                        extracted_json = potential_json
                                        logger.info(f"✅ Found valid JSON in reasoning steps: {extracted_json[:100]}...")
                                        break
                                    except json.JSONDecodeError as e:
                                        logger.warning(f"JSON validation failed: {e}")
                                        logger.debug("JSON validation failed, trying next step")
                                        continue
                                else:
                                    logger.warning("Could not find matching braces")
                            else:
                                logger.debug("No JSON braces found in step")
                
                if extracted_json:
                    try:
                        logger.info("Attempting to validate JSON extracted from error/reasoning after output validation failed")
                        validated_output = self._validate_and_parse_output(
                            extracted_json,
                            resume,
                            target_role
                        )
                        result['output'] = validated_output
                        result['status'] = 'success'  # Mark as success if validation passes
                        logger.info("✅ JSON from error/reasoning successfully validated after output failure - marking as SUCCESS")
                        return result
                    except ValueError as e:
                        logger.error(f"Extracted JSON validation also failed: {e}")
                
                # If no valid JSON found, use fallback
                logger.info("No valid JSON found in error/reasoning after output validation failed, using fallback")
                result['output'] = self._fallback_analysis(resume, target_role)
                result['status'] = 'fallback'
                result['validation_error'] = str(e)
                return result
        else:
            # If no output, try to extract JSON from reasoning steps OR error message
            logger.info("No agent output, attempting to extract JSON from reasoning steps or error")
            logger.info(f"Result keys: {list(result.keys())}")
            logger.info(f"Result status: {result.get('status')}")
            logger.info(f"Result has reasoning_steps: {'reasoning_steps' in result}")
            logger.info(f"Result has error: {'error' in result}")
            if 'reasoning_steps' in result:
                logger.info(f"Reasoning steps type: {type(result['reasoning_steps'])}")
                logger.info(f"Reasoning steps length: {len(result.get('reasoning_steps', []))}")
            
            extracted_json = None
            
            # First, try to extract from error message (for ReAct format errors)
            if result.get('error') and result.get('status') == 'error':
                error_msg = str(result['error'])
                logger.info(f"Checking error message for JSON (length: {len(error_msg)})")
                logger.debug(f"Error message preview: {error_msg[:300]}...")
                
                # Look for the ReAct format error pattern with JSON
                if "Missing 'Action:' after 'Thought:{" in error_msg and "{" in error_msg and "}" in error_msg:
                    logger.info("Found ReAct format error with JSON, attempting extraction")
                    # Find the JSON in the error message
                    start_idx = error_msg.find("{")
                    if start_idx >= 0:
                        # Find the matching closing brace
                        brace_count = 0
                        end_idx = -1
                        for j in range(start_idx, len(error_msg)):
                            if error_msg[j] == "{":
                                brace_count += 1
                            elif error_msg[j] == "}":
                                brace_count -= 1
                                if brace_count == 0:
                                    end_idx = j + 1
                                    break
                        
                        if end_idx > start_idx:
                            potential_json = error_msg[start_idx:end_idx]
                            logger.info(f"Extracted potential JSON from error, length: {len(potential_json)}")
                            logger.debug(f"Extracted JSON from error: {potential_json[:200]}...")
                            try:
                                import json
                                json.loads(potential_json)
                                extracted_json = potential_json
                                logger.info(f"✅ Found valid JSON in error message: {extracted_json[:100]}...")
                            except json.JSONDecodeError as e:
                                logger.warning(f"Error JSON validation failed: {e}")
            
            # If not found in error, try reasoning steps
            if not extracted_json and result.get('reasoning_steps'):
                logger.info(f"Found {len(result['reasoning_steps'])} reasoning steps")
                for i, step in enumerate(reversed(result['reasoning_steps'])):
                    logger.info(f"Processing step {i+1}")
                    
                    # Check if this is an exception step with JSON in thought
                    if step.get('tool') == '_Exception' and step.get('thought'):
                        step_text = step['thought']
                        logger.info(f"Found _Exception step with thought, length: {len(step_text)}")
                        logger.debug(f"Exception step thought: {step_text[:200]}...")
                        
                        # Remove markdown code blocks if present
                        if "```json" in step_text:
                            logger.info("Found ```json marker, extracting from markdown")
                            # Extract content between ```json and ```
                            start_marker = "```json"
                            end_marker = "```"
                            start_idx = step_text.find(start_marker)
                            if start_idx >= 0:
                                start_idx += len(start_marker)
                                end_idx = step_text.find(end_marker, start_idx)
                                if end_idx >= 0:
                                    step_text = step_text[start_idx:end_idx].strip()
                                    logger.info(f"Extracted from markdown, new length: {len(step_text)}")
                                    logger.debug(f"Extracted from markdown: {step_text[:200]}...")
                        
                        if "{" in step_text and "}" in step_text:
                            logger.info("Found JSON braces in exception step, attempting extraction")
                            # Try to extract JSON from step
                            start_idx = step_text.find("{")
                            # Find the matching closing brace
                            brace_count = 0
                            end_idx = -1
                            for j in range(start_idx, len(step_text)):
                                if step_text[j] == "{":
                                    brace_count += 1
                                elif step_text[j] == "}":
                                    brace_count -= 1
                                    if brace_count == 0:
                                        end_idx = j + 1
                                        break
                            
                            if end_idx > start_idx:
                                potential_json = step_text[start_idx:end_idx]
                                logger.info(f"Extracted potential JSON from exception step, length: {len(potential_json)}")
                                logger.debug(f"Extracted JSON from exception step: {potential_json[:200]}...")
                                try:
                                    import json
                                    json.loads(potential_json)
                                    extracted_json = potential_json
                                    logger.info(f"✅ Found valid JSON in exception step: {extracted_json[:100]}...")
                                    break
                                except json.JSONDecodeError as e:
                                    logger.warning(f"Exception step JSON validation failed: {e}")
                                    logger.debug("Exception step JSON validation failed, trying next step")
                                    continue
                            else:
                                logger.warning("Could not find matching braces in exception step")
                        else:
                            logger.debug("No JSON braces found in exception step")
                    else:
                        # Regular reasoning step processing
                        step_text = step.get('observation', '') + step.get('thought', '')
                        logger.info(f"Step text length: {len(step_text)}")
                        logger.debug(f"Checking reasoning step: {step_text[:200]}...")
                        
                        # Remove markdown code blocks if present
                        if "```json" in step_text:
                            logger.info("Found ```json marker, extracting from markdown")
                            # Extract content between ```json and ```
                            start_marker = "```json"
                            end_marker = "```"
                            start_idx = step_text.find(start_marker)
                            if start_idx >= 0:
                                start_idx += len(start_marker)
                                end_idx = step_text.find(end_marker, start_idx)
                                if end_idx >= 0:
                                    step_text = step_text[start_idx:end_idx].strip()
                                    logger.info(f"Extracted from markdown, new length: {len(step_text)}")
                                    logger.debug(f"Extracted from markdown: {step_text[:200]}...")
                        
                        if "{" in step_text and "}" in step_text:
                            logger.info("Found JSON braces, attempting extraction")
                            # Try to extract JSON from step
                            start_idx = step_text.find("{")
                            # Find the matching closing brace
                            brace_count = 0
                            end_idx = -1
                            for j in range(start_idx, len(step_text)):
                                if step_text[j] == "{":
                                    brace_count += 1
                                elif step_text[j] == "}":
                                    brace_count -= 1
                                    if brace_count == 0:
                                        end_idx = j + 1
                                        break
                            
                            if end_idx > start_idx:
                                potential_json = step_text[start_idx:end_idx]
                                logger.info(f"Extracted potential JSON, length: {len(potential_json)}")
                                logger.debug(f"Extracted potential JSON from reasoning: {potential_json[:200]}...")
                                try:
                                    import json
                                    json.loads(potential_json)
                                    extracted_json = potential_json
                                    logger.info(f"✅ Found valid JSON in reasoning steps: {extracted_json[:100]}...")
                                    break
                                except json.JSONDecodeError as e:
                                    logger.warning(f"JSON validation failed: {e}")
                                    logger.debug("JSON validation failed, trying next step")
                                    continue
                            else:
                                logger.warning("Could not find matching braces")
                        else:
                            logger.debug("No JSON braces found in step")
            else:
                if not result.get('reasoning_steps'):
                    logger.warning("No reasoning steps found")
            
            if extracted_json:
                try:
                    logger.info("Attempting to validate JSON extracted from error/reasoning")
                    validated_output = self._validate_and_parse_output(
                        extracted_json,
                        resume,
                        target_role
                    )
                    result['output'] = validated_output
                    result['status'] = 'success'  # Mark as success if validation passes
                    logger.info("✅ JSON from error/reasoning successfully validated - marking as SUCCESS")
                    return result
                except ValueError as e:
                    logger.error(f"Extracted JSON validation failed: {e}")
            
            # If no valid JSON found, use fallback
            logger.info("No valid JSON found in error/reasoning, using fallback")
            result['output'] = self._fallback_analysis(resume, target_role)
            result['status'] = 'fallback'
        
        return result
    
    def _validate_and_parse_output(
        self,
        agent_output: str,
        resume: Resume,
        target_role: str
    ) -> Dict[str, Any]:
        """
        Validate and parse agent output into structured format.
        
        Args:
            agent_output: Raw agent output
            resume: Resume object
            target_role: Target role
            
        Returns:
            Structured analysis data
            
        Requirement: 27.8
        """
        raw_text = agent_output.strip()
        
        logger.info(f"Agent raw output length: {len(raw_text)} chars")
        logger.info(f"Agent raw output (first 500 chars): {raw_text[:500]}")

        # Remove common prefixes
        if "Final Answer:" in raw_text:
            raw_text = raw_text.split("Final Answer:", 1)[-1].strip()
        
        # Remove markdown code blocks if present
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:].strip()
        if raw_text.startswith("```"):
            raw_text = raw_text[3:].strip()
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3].strip()

        def _extract_json(text: str) -> str:
            # Find all opening braces
            start_candidates = [
                idx for idx, char in enumerate(text)
                if char == "{"
            ]

            if not start_candidates:
                logger.error(f"No JSON object found in output: {text[:500]}")
                raise ValueError("Agent output contains no JSON object")

            # Try from the FIRST opening brace (most likely to be the main object)
            for start in start_candidates:
                depth = 0
                for idx in range(start, len(text)):
                    char = text[idx]
                    if char == "{":
                        depth += 1
                    elif char == "}":
                        depth -= 1
                        if depth == 0:
                            extracted = text[start: idx + 1]
                            logger.info(f"Extracted JSON (first 300 chars): {extracted[:300]}")
                            # Try to parse it to verify it's valid JSON
                            try:
                                json.loads(extracted)
                                return extracted
                            except json.JSONDecodeError:
                                # This JSON is invalid, try next candidate
                                logger.debug(f"Extracted JSON is invalid, trying next candidate")
                                continue

            logger.error(f"Unbalanced JSON braces or no valid JSON in output: {text[:500]}")
            raise ValueError("Agent output contains unbalanced JSON braces or no valid JSON")

        def _extract_json_from_react_error(self, reasoning_steps: List[Dict]) -> Optional[str]:
            """
            Extract JSON from ReAct format errors in reasoning steps.
            The agent often generates perfect JSON in the 'thought' field when ReAct parser fails.
            """
            for step in reasoning_steps:
                if step.get('tool') == '_Exception' and 'thought' in step:
                    thought = step['thought']
                    if thought and isinstance(thought, str):
                        # Look for JSON in the thought field
                        if '```json' in thought:
                            # Extract JSON from markdown code block
                            start = thought.find('```json') + 7
                            end = thought.find('```', start)
                            if end > start:
                                json_str = thought[start:end].strip()
                                try:
                                    # Validate it's proper JSON
                                    json.loads(json_str)
                                    logger.info("Successfully extracted JSON from ReAct error thought field")
                                    return json_str
                                except json.JSONDecodeError:
                                    continue
                        elif thought.strip().startswith('{') and thought.strip().endswith('}'):
                            # Direct JSON in thought field
                            try:
                                json.loads(thought.strip())
                                logger.info("Successfully extracted direct JSON from ReAct error thought field")
                                return thought.strip()
                            except json.JSONDecodeError:
                                continue
            return None

        # First try normal extraction
        try:
            raw_json = _extract_json(raw_text)
        except ValueError:
            # If normal extraction fails, try to get JSON from ReAct error reasoning steps
            logger.info("Normal JSON extraction failed, trying ReAct error extraction...")
            
            # Get reasoning steps if available (this might be from a previous attempt)
            if hasattr(self, '_last_reasoning_steps') and self._last_reasoning_steps:
                extracted_json = self._extract_json_from_react_error(self._last_reasoning_steps)
                if extracted_json:
                    raw_json = extracted_json
                    logger.info("Successfully recovered JSON from ReAct error reasoning steps")
                else:
                    logger.error("Failed to extract JSON from ReAct error reasoning steps")
                    raise ValueError("Agent output contains no valid JSON object")
            else:
                logger.error("No reasoning steps available for ReAct error extraction")
                raise ValueError("Agent output contains no valid JSON object")

        def _log_invalid(reason: str):
            logger.error(
                "%s Raw output (first 2000 chars): %s",
                reason,
                raw_text[:2000]
            )

        try:
            parsed = json.loads(raw_json)
            logger.info(f"Successfully parsed JSON with keys: {list(parsed.keys())}")
        except json.JSONDecodeError as exc:
            logger.error(f"JSON parsing failed. Raw JSON (first 500 chars): {raw_json[:500]}")
            logger.error(f"JSON decode error: {exc}")
            _log_invalid("Agent output is not valid JSON:")
            raise ValueError(f"Agent output is not valid JSON: {exc}") from exc

        if not isinstance(parsed, dict):
            _log_invalid("Agent output must be a JSON object.")
            raise ValueError("Agent output must be a JSON object.")

        analysis_data = parsed.get('analysis_data') if 'analysis_data' in parsed else parsed

        if not isinstance(analysis_data, dict):
            _log_invalid("Agent output missing structured analysis sections.")
            raise ValueError("Agent output missing structured analysis sections.")

        required_sections = [
            'skill_inventory',
            'experience_timeline',
            'skill_gaps',
            'improvement_roadmap'
        ]

        for section in required_sections:
            section_value = analysis_data.get(section)
            if section_value is None:
                _log_invalid(f"Agent output missing '{section}' section.")
                raise ValueError(f"Agent output missing '{section}' section.")
            # Allow both dict and list types for flexibility
            if not isinstance(section_value, (dict, list)):
                _log_invalid(f"Agent output invalid '{section}' section (must be dict or list).")
                raise ValueError(f"Agent output invalid '{section}' section (must be dict or list).")
            logger.info(f"Section '{section}' validated successfully")

        skill_inventory = analysis_data['skill_inventory']
        if isinstance(skill_inventory, dict):
            for field in ['technical_skills', 'soft_skills', 'tools', 'languages']:
                skill_inventory.setdefault(field, [])
        else:
            # If it's not a dict, convert it
            skill_inventory = {
                'technical_skills': [],
                'soft_skills': [],
                'tools': [],
                'languages': []
            }

        experience_timeline = analysis_data['experience_timeline']
        if isinstance(experience_timeline, list):
            # Convert list format to dict format
            experience_timeline = {
                'total_years': resume.total_experience_months / 12 if resume.total_experience_months else 0,
                'seniority_level': resume.seniority_level or 'Unknown',
                'companies': [],
                'roles': [],
                'analysis': '',
                'timeline': experience_timeline  # Keep original list
            }
        else:
            experience_timeline.setdefault(
                'total_years',
                resume.total_experience_months / 12 if resume.total_experience_months else 0
            )
            experience_timeline.setdefault('seniority_level', resume.seniority_level or 'Unknown')
            experience_timeline.setdefault('companies', [])
            experience_timeline.setdefault('roles', [])
            experience_timeline.setdefault('analysis', experience_timeline.get('analysis', ''))

        skill_gaps = analysis_data['skill_gaps']
        if isinstance(skill_gaps, list):
            # Convert list format to dict format
            skill_gaps = {
                'target_role': target_role,
                'required_missing': skill_gaps,
                'preferred_missing': [],
                'match_percentage': 0.0,
                'recommendation': ''
            }
        else:
            skill_gaps.setdefault('target_role', target_role)
            skill_gaps.setdefault('required_missing', [])
            skill_gaps.setdefault('preferred_missing', [])
            skill_gaps.setdefault('match_percentage', 0.0)
            skill_gaps.setdefault('recommendation', '')

        improvement_roadmap = analysis_data['improvement_roadmap']
        if isinstance(improvement_roadmap, list):
            # Convert list format to dict format
            improvement_roadmap = {
                'timeline_weeks': 0,
                'milestones': improvement_roadmap,
                'recommendations': ''
            }
        else:
            improvement_roadmap.setdefault('timeline_weeks', 0)
            improvement_roadmap.setdefault('milestones', [])
            improvement_roadmap.setdefault('recommendations', improvement_roadmap.get('recommendations', ''))

        result = {
            'skill_inventory': skill_inventory,
            'experience_timeline': experience_timeline,
            'skill_gaps': skill_gaps,
            'improvement_roadmap': improvement_roadmap,
        }

        summary = parsed.get('analysis_summary') or analysis_data.get('analysis_summary')
        if summary:
            result['analysis_summary'] = summary

        logger.info("Agent output successfully validated and parsed")
        return result
    
    def _fallback_analysis(
        self,
        resume: Resume,
        target_role: str
    ) -> Dict[str, Any]:
        """
        Fallback to traditional NLP analysis.
        
        Args:
            resume: Resume object
            target_role: Target role
            
        Returns:
            Analysis data using traditional methods
            
        Requirement: 27.13
        """
        logger.info(f"Using fallback NLP analysis for resume {resume.id}")
        
        # Use existing skill extraction
        skills = resume.skills or {}
        
        # Basic experience analysis
        experience_years = resume.total_experience_months / 12 if resume.total_experience_months else 0
        
        return {
            'skill_inventory': skills,
            'experience_timeline': {
                'total_years': experience_years,
                'seniority_level': resume.seniority_level or 'Unknown',
                'companies': [],
                'roles': []
            },
            'skill_gaps': {
                'target_role': target_role,
                'required_missing': [],
                'preferred_missing': [],
                'match_percentage': 0.0,
                'note': 'Fallback analysis - limited detail'
            },
            'improvement_roadmap': {
                'timeline_weeks': 12,
                'milestones': [],
                'note': 'Fallback analysis - generic recommendations'
            },
            'fallback_used': True
        }
    
    def _store_analysis(
        self,
        resume_id: int,
        user_id: int,
        analysis_data: Dict[str, Any],
        agent_reasoning: list,
        execution_time_ms: int,
        status: str
    ) -> ResumeAnalysis:
        """
        Store analysis in database.
        
        Args:
            resume_id: Resume ID
            user_id: User ID
            analysis_data: Analysis results
            agent_reasoning: Agent reasoning steps
            execution_time_ms: Execution time
            status: Analysis status
            
        Returns:
            ResumeAnalysis record
            
        Requirement: 27.9
        """
        analysis = ResumeAnalysis(
            resume_id=resume_id,
            user_id=user_id,
            analysis_data=analysis_data,
            agent_reasoning=agent_reasoning,
            execution_time_ms=execution_time_ms,
            status=status
        )
        
        self.db.add(analysis)
        self.db.commit()
        self.db.refresh(analysis)
        
        logger.info(
            f"Stored analysis {analysis.id} for resume {resume_id} "
            f"(status: {status}, time: {execution_time_ms}ms)"
        )
        
        return analysis
    
    def _format_analysis_response(
        self,
        analysis: ResumeAnalysis,
        from_cache: bool,
        error: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Format analysis for API response.
        
        Args:
            analysis: ResumeAnalysis record
            from_cache: Whether from cache
            error: Optional error message
            
        Returns:
            Formatted response
            
        Requirement: 27.10
        """
        response = {
            'analysis_id': analysis.id,
            'resume_id': analysis.resume_id,
            'analysis_data': analysis.analysis_data,
            'agent_reasoning': analysis.agent_reasoning if analysis.has_reasoning else None,
            'execution_time_ms': analysis.execution_time_ms,
            'status': analysis.status,
            'analyzed_at': analysis.created_at.isoformat(),
            'from_cache': from_cache,
            'cache_age_days': (datetime.utcnow() - analysis.created_at).days if from_cache else 0
        }
        
        if error:
            response['error'] = error
            
        return response
    
    def get_analysis_history(
        self,
        resume_id: int,
        user_id: int,
        limit: int = 10
    ) -> list[Dict[str, Any]]:
        """
        Get analysis history for resume.
        
        Args:
            resume_id: Resume ID
            user_id: User ID
            limit: Maximum number of records
            
        Returns:
            List of analysis records
        """
        # Verify resume belongs to user
        resume = self.db.query(Resume).filter(
            Resume.id == resume_id,
            Resume.user_id == user_id
        ).first()
        
        if not resume:
            raise ValueError(f"Resume {resume_id} not found for user {user_id}")
        
        analyses = self.db.query(ResumeAnalysis).filter(
            ResumeAnalysis.resume_id == resume_id,
            ResumeAnalysis.deleted_at.is_(None)
        ).order_by(ResumeAnalysis.created_at.desc()).limit(limit).all()
        
        return [
            self._format_analysis_response(analysis, from_cache=False)
            for analysis in analyses
        ]
