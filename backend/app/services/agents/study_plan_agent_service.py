"""
Study Plan Agent Service

Provides personalized study plan generation using LangChain agents.

Requirements: 28.1-28.11
"""
import time
import logging
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.models.study_plan import StudyPlan
from app.models.resume_analysis import ResumeAnalysis
from app.models.user import User
from app.services.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


class StudyPlanAgentService:
    """Service for generating personalized study plans using AI agents."""
    
    def __init__(self, db: Session):
        """Initialize study plan agent service"""
        self.db = db
        self.max_execution_time = 20.0
        
    def generate_study_plan(
        self,
        user_id: int,
        target_role: str,
        duration_days: int,
        available_hours_per_week: int
    ) -> StudyPlan:
        """Generate a personalized study plan for the user."""
        start_time = time.time()
        
        try:
            logger.info(f"Starting study plan generation for user {user_id}")
            
            self._validate_user_prerequisites(user_id)
            logger.info(f"User prerequisites validated for user {user_id}")
            
            skill_data = self._retrieve_skill_data(user_id)
            logger.info(f"Skill data retrieved for user {user_id}: {len(skill_data)} items")
            
            agent = self._initialize_agent()
            logger.info(f"Agent initialized for user {user_id}")
            
            agent_input = self._prepare_agent_input(
                user_id, target_role, duration_days, available_hours_per_week, skill_data
            )
            logger.info(f"Agent input prepared for user {user_id}")
            
            # Execute agent with proper error handling
            logger.info(f"Executing agent for user {user_id}")
            result = agent.execute(agent_input)
            logger.info(f"Agent execution completed for user {user_id}: status={result['status']}")
            
        except Exception as e:
            logger.error(f"Error during study plan generation setup for user {user_id}: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            raise ValueError(f"Failed to initialize study plan generation: {e}")
        
        logger.info(f"Agent result status: {result['status']}, output length: {len(result.get('output', '')) if result.get('output') else 0}")
        
        # Handle both 'success' and 'error' status if output contains valid JSON
        plan_data = None
        final_status = result['status']
        
        if result.get('output'):
            try:
                logger.info(f"Attempting to parse agent output (length: {len(result['output'])} chars, status: {result['status']})")
                logger.debug(f"Output preview: {result['output'][:200]}")
                plan_data = self._parse_agent_output(result['output'])
                self._validate_plan_structure(plan_data)
                final_status = 'success'  # Mark as success if parsing and validation passes
                logger.info("✅ Agent output successfully parsed and validated - marking as SUCCESS")
            except ValueError as e:
                logger.error(f"Agent output parsing failed: {e}")
                logger.info("Output parsing failed, attempting to extract JSON from reasoning steps or error")
                
                # Try to extract JSON from reasoning steps or error message
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
                        logger.info("Attempting to parse JSON extracted from error/reasoning")
                        plan_data = self._parse_agent_output(extracted_json)
                        self._validate_plan_structure(plan_data)
                        final_status = 'success'  # Mark as success if validation passes
                        logger.info("✅ JSON from error/reasoning successfully parsed - marking as SUCCESS")
                    except ValueError as e:
                        logger.error(f"Extracted JSON parsing also failed: {e}")
                        raise ValueError(f"Failed to generate valid study plan: {e}")
                else:
                    logger.error("No valid JSON found in error/reasoning")
                    raise ValueError(f"Failed to generate valid study plan: {e}")
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
            # Combine all possible sources of text
            all_text = ""
            if result.get('error'):
                all_text += str(result['error']) + "\n"
            if result.get('output'):
                all_text += str(result['output']) + "\n"
            if result.get('reasoning_steps'):
                for step in result['reasoning_steps']:
                    all_text += str(step.get('observation', '')) + "\n"
                    all_text += str(step.get('thought', '')) + "\n"
            
            logger.info(f"=== STUDY PLAN: SEARCHING ALL TEXT (length: {len(all_text)}) ===")
            
            # Strategy 1: Find JSON after LAST "Final Answer:"
            if "Final Answer:" in all_text:
                parts = all_text.split("Final Answer:")
                last_part = parts[-1]
                if "Invalid" in last_part:
                    last_part = last_part.split("Invalid")[0]
                
                import re
                json_match = re.search(r'\{[\s\S]*\}', last_part)
                if json_match:
                    potential_json = json_match.group(0)
                    try:
                        parsed = json.loads(potential_json)
                        if 'daily_tasks' in parsed or 'weekly_milestones' in parsed:
                            logger.info(f"✅ Strategy 1 SUCCESS: Found JSON with study plan fields")
                            extracted_json = potential_json
                    except json.JSONDecodeError:
                        pass
            
            # Strategy 2: Find any JSON with required fields
            if not extracted_json and ("daily_tasks" in all_text or "weekly_milestones" in all_text):
                logger.info("Found study plan fields in text, searching for JSON...")
                for field in ['daily_tasks', 'weekly_milestones']:
                    if field in all_text:
                        idx = all_text.find(field)
                        start = all_text.rfind("{", 0, idx)
                        if start >= 0:
                            brace_count = 0
                            for i in range(start, len(all_text)):
                                if all_text[i] == "{":
                                    brace_count += 1
                                elif all_text[i] == "}":
                                    brace_count -= 1
                                    if brace_count == 0:
                                        potential_json = all_text[start:i+1]
                                        try:
                                            parsed = json.loads(potential_json)
                                            if 'daily_tasks' in parsed or 'weekly_milestones' in parsed:
                                                logger.info(f"✅ Strategy 2 SUCCESS: Found JSON with study plan fields")
                                                extracted_json = potential_json
                                                break
                                        except:
                                            pass
                                        break
                        if extracted_json:
                            break
            
            # Strategy 3: Find any valid JSON with study plan structure
            if not extracted_json:
                logger.info("Trying Strategy 3: Find any JSON with study plan fields...")
                import re
                all_jsons = re.findall(r'\{[\s\S]*?\}', all_text)
                for potential_json in reversed(all_jsons):
                    try:
                        parsed = json.loads(potential_json)
                        if 'daily_tasks' in parsed or 'weekly_milestones' in parsed:
                            logger.info(f"✅ Strategy 3 SUCCESS: Found JSON in last resort")
                            extracted_json = potential_json
                            break
                    except:
                        continue
            
            if not extracted_json:
                logger.error("❌ ALL EXTRACTION STRATEGIES FAILED")
            
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
                    logger.info("Attempting to parse JSON extracted from error/reasoning")
                    plan_data = self._parse_agent_output(extracted_json)
                    self._validate_plan_structure(plan_data)
                    final_status = 'success'  # Mark as success if validation passes
                    logger.info("✅ JSON from error/reasoning successfully parsed - marking as SUCCESS")
                except ValueError as e:
                    logger.error(f"Extracted JSON parsing failed: {e}")
                    raise ValueError(f"Failed to generate valid study plan: {e}")
            else:
                # If no valid JSON found, raise error
                logger.error("No valid JSON found in error/reasoning")
                raise ValueError("Failed to generate valid study plan: No valid output produced")
        
        execution_time_ms = int((time.time() - start_time) * 1000)
        
        try:
            logger.info(f"Creating study plan record for user {user_id}")
            study_plan = self._create_study_plan_record(
                user_id, target_role, duration_days, available_hours_per_week,
                plan_data, result.get('reasoning_steps', []), execution_time_ms,
                status=final_status
            )
            logger.info(f"Study plan record created successfully for user {user_id}: ID {study_plan.id}")
            return study_plan
        except Exception as e:
            logger.error(f"Failed to create study plan record for user {user_id}: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            raise ValueError(f"Failed to save study plan: {e}")

    def _validate_user_prerequisites(self, user_id: int) -> None:
        """Validate user has resume analysis."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        resume_analysis = self.db.query(ResumeAnalysis).filter(
            ResumeAnalysis.user_id == user_id,
            ResumeAnalysis.status.in_(['success', 'completed'])
        ).first()
        
        if not resume_analysis:
            raise ValueError(
                "User must have a completed resume analysis before generating study plan."
            )
    
    def _retrieve_skill_data(self, user_id: int) -> Dict[str, Any]:
        """Retrieve skill data from resume analysis."""
        resume_analysis = self.db.query(ResumeAnalysis).filter(
            ResumeAnalysis.user_id == user_id,
            ResumeAnalysis.status.in_(['success', 'completed'])
        ).first()
        
        if not resume_analysis:
            # Return default structure if no resume analysis found
            return {
                'technical_skills': [],
                'soft_skills': [],
                'experience_years': 0,
                'education_level': 'unknown',
                'skill_gaps': [],
                'strengths': [],
                'weaknesses': []
            }
        
        analysis_data = resume_analysis.analysis_data or {}
        
        # Ensure all fields are properly structured
        return {
            'technical_skills': self._ensure_list(analysis_data.get('technical_skills', [])),
            'soft_skills': self._ensure_list(analysis_data.get('soft_skills', [])),
            'experience_years': analysis_data.get('experience_years', 0),
            'education_level': analysis_data.get('education_level', 'unknown'),
            'skill_gaps': self._ensure_list(analysis_data.get('skill_gaps', [])),
            'strengths': self._ensure_list(analysis_data.get('strengths', [])),
            'weaknesses': self._ensure_list(analysis_data.get('weaknesses', []))
        }
    
    def _ensure_list(self, value) -> List:
        """Ensure a value is a list, converting if necessary."""
        if isinstance(value, list):
            return value
        elif value is None:
            return []
        elif isinstance(value, (str, int, float, bool)):
            return [value]
        elif isinstance(value, dict):
            # For skill_gaps that might be objects, extract the text
            if 'gap' in value:
                return [value['gap']]
            else:
                return [str(value)]
        else:
            return [str(value)]

    def _initialize_agent(self) -> BaseAgent:
        """Initialize agent with 5 custom tools for study plan generation."""
        from app.services.agents.tools.study_plan_tools import (
            SkillAssessmentTool,
            JobMarketTool,
            LearningResourceTool,
            ProgressTrackerTool,
            SchedulerTool
        )
        
        tool_instances = [
            SkillAssessmentTool(db=self.db),
            JobMarketTool(),
            LearningResourceTool(),
            ProgressTrackerTool(db=self.db),
            SchedulerTool()
        ]
        
        # Convert to LangChain Tool objects
        tools = [tool.as_tool() for tool in tool_instances]
        
        system_message = """You are a personalized study plan generator.
Create comprehensive, achievable study plans with daily tasks, weekly milestones,
resource links, and progress tracking.

CRITICAL: You must use the available tools to gather information before creating the plan.

Use this format for your response:
Thought: I need to assess user's skills first
Action: skill_assessment
Action Input: {"user_id": <user_id>}
Observation: <result from tool>
...
Thought: I now have all the information needed
Final Answer: <your JSON response>

Your Final Answer must be ONLY a valid JSON object with this structure:
{
    "daily_tasks": [
        {
            "day": 1,
            "date": "2026-02-16",
            "tasks": [
                {"skill": "Python", "duration_minutes": 120, "completed": false}
            ]
        }
    ],
    "weekly_milestones": [
        {
            "week": 1,
            "milestone": "Complete basics",
            "skills_covered": ["Python"],
            "assessment": "Quiz",
            "completed": false
        }
    ],
    "resource_links": {
        "Python": ["https://example.com/resource"]
    },
    "time_estimates": {
        "total_hours": 180,
        "hours_per_week": 15,
        "completion_date": "2026-05-15"
    }
}"""
        
        agent = BaseAgent(
            tools=tools,
            system_message=system_message,
            agent_type="study_plan"
        )
        
        return agent

    def _prepare_agent_input(
            self,
            user_id: int,
            target_role: str,
            duration_days: int,
            available_hours_per_week: int,
            skill_data: Dict[str, Any]
        ) -> str:
            """Prepare input prompt for the agent."""

            # Safe extraction of technical skills
            technical_skills = skill_data.get('technical_skills', [])
            if isinstance(technical_skills, list):
                skills_str = ', '.join(str(skill) for skill in technical_skills[:10])
            else:
                skills_str = str(technical_skills) if technical_skills else "Not specified"

            # Safe extraction of strengths
            strengths = skill_data.get('strengths', [])
            if isinstance(strengths, list):
                strengths_str = ', '.join(str(strength) for strength in strengths[:5])
            else:
                strengths_str = str(strengths) if strengths else "Not specified"

            # Safe extraction of skill gaps - handle both object and string formats
            skill_gaps = skill_data.get('skill_gaps', [])
            if isinstance(skill_gaps, list):
                gaps_list = []
                for gap in skill_gaps[:5]:
                    if isinstance(gap, dict):
                        # Handle object format: {gap: "...", recommendations: [...]}
                        gap_text = gap.get('gap', str(gap))
                        gaps_list.append(str(gap_text))
                    else:
                        # Handle string format
                        gaps_list.append(str(gap))
                gaps_str = ', '.join(gaps_list)
            else:
                gaps_str = str(skill_gaps) if skill_gaps else "Not specified"

            prompt = f"""Create a {duration_days}-day study plan for {target_role}.

    User Profile:
    - Available Time: {available_hours_per_week} hours/week
    - Technical Skills: {skills_str}
    - Experience: {skill_data.get('experience_years', 0)} years
    - Strengths: {strengths_str}
    - Skill Gaps: {gaps_str}

    Use available tools when building the plan to gather current information and resources.

    Output JSON with: daily_tasks, weekly_milestones, resource_links, time_estimates"""
            return prompt


    def _parse_agent_output(self, output: str) -> Dict[str, Any]:
        """Parse agent output into structured plan data."""
        import json
        import re
        
        # Try to extract JSON from markdown code fence (multiline)
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', output, re.DOTALL)
        if json_match:
            json_str = json_match.group(1).strip()
        else:
            # Try to find raw JSON (multiline)
            json_match = re.search(r'\{[\s\S]*\}', output, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
            else:
                raise ValueError("Could not extract JSON from agent output")
        
        try:
            plan_data = json.loads(json_str)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in agent output: {e}")
        
        return plan_data
    
    def _validate_plan_structure(self, plan_data: Dict[str, Any]) -> None:
        """Validate plan contains required fields."""
        required_fields = ['daily_tasks', 'weekly_milestones', 'resource_links', 'time_estimates']
        
        for field in required_fields:
            if field not in plan_data:
                raise ValueError(f"Plan missing required field: {field}")
        
        # Validate field types
        if not isinstance(plan_data['daily_tasks'], list):
            raise ValueError("daily_tasks must be a list")
        
        if not isinstance(plan_data['weekly_milestones'], list):
            raise ValueError("weekly_milestones must be a list")
        
        if not isinstance(plan_data['resource_links'], dict):
            raise ValueError("resource_links must be a dictionary")
        
        if not isinstance(plan_data['time_estimates'], dict):
            raise ValueError("time_estimates must be a dictionary")
        
        # Validate time_estimates structure
        time_estimates = plan_data['time_estimates']
        required_time_fields = ['total_hours', 'hours_per_week', 'completion_date']
        for field in required_time_fields:
            if field not in time_estimates:
                raise ValueError(f"time_estimates missing required field: {field}")

    def _create_study_plan_record(
        self,
        user_id: int,
        target_role: str,
        duration_days: int,
        available_hours_per_week: int,
        plan_data: Dict[str, Any],
        agent_reasoning: list,
        execution_time_ms: int,
        status: str = 'active'
    ) -> StudyPlan:
        """Create study plan record in database."""
        study_plan = StudyPlan(
            user_id=user_id,
            target_role=target_role,
            duration_days=duration_days,
            available_hours_per_week=available_hours_per_week,
            plan_data=plan_data,
            agent_reasoning=agent_reasoning,
            execution_time_ms=execution_time_ms,
            status=status,
            progress_percentage=0.0
        )
        
        self.db.add(study_plan)
        self.db.commit()
        self.db.refresh(study_plan)
        
        return study_plan
    
    def get_study_plan(self, plan_id: int, user_id: int) -> Optional[StudyPlan]:
        """Get study plan by ID"""
        return self.db.query(StudyPlan).filter(
            StudyPlan.id == plan_id,
            StudyPlan.user_id == user_id
        ).first()
    
    def get_active_plan(self, user_id: int) -> Optional[StudyPlan]:
        """Get user's active study plan"""
        return self.db.query(StudyPlan).filter(
            StudyPlan.user_id == user_id,
            StudyPlan.status == 'active'
        ).first()

    def update_progress(
        self,
        plan_id: int,
        user_id: int,
        task_updates: Dict[str, Any]
    ) -> StudyPlan:
        """Update study plan progress."""
        study_plan = self.get_study_plan(plan_id, user_id)
        if not study_plan:
            raise ValueError(f"Study plan {plan_id} not found")
        
        plan_data = study_plan.plan_data
        
        for day_data in plan_data.get('daily_tasks', []):
            day_num = day_data.get('day')
            for task_idx, task in enumerate(day_data.get('tasks', [])):
                task_key = f"{day_num}_{task_idx}"
                if task_key in task_updates:
                    task['completed'] = task_updates[task_key]
        
        for milestone in plan_data.get('weekly_milestones', []):
            week_num = milestone.get('week')
            milestone_key = f"milestone_{week_num}"
            if milestone_key in task_updates:
                milestone['completed'] = task_updates[milestone_key]
        
        total_tasks = study_plan.total_tasks
        completed_tasks = study_plan.completed_tasks
        
        if total_tasks > 0:
            progress = (completed_tasks / total_tasks) * 100
            study_plan.progress_percentage = round(progress, 2)
        
        if study_plan.progress_percentage >= 100:
            study_plan.status = 'completed'
        
        study_plan.plan_data = plan_data
        self.db.commit()
        self.db.refresh(study_plan)
        
        return study_plan
    
    def abandon_plan(self, plan_id: int, user_id: int) -> StudyPlan:
        """Mark study plan as abandoned"""
        study_plan = self.get_study_plan(plan_id, user_id)
        if not study_plan:
            raise ValueError(f"Study plan {plan_id} not found")
        
        study_plan.status = 'abandoned'
        self.db.commit()
        self.db.refresh(study_plan)
        
        return study_plan
