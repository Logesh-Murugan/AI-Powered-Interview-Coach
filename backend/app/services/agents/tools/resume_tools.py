"""
Resume Analysis Tools

Custom LangChain tools for resume intelligence agent.

Tools:
1. ResumeParserTool - Parse resume data from database
2. SkillExtractorTool - Extract skills from resume text
3. ExperienceAnalyzerTool - Analyze career progression
4. SkillGapTool - Identify skill gaps for target role
5. RoadmapGeneratorTool - Generate learning roadmap

Requirements: 27.4, 27.5
"""
import json
import logging
import re
from typing import Dict, Any, List, Union
from datetime import datetime

from langchain_core.tools import Tool
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.resume import Resume
from app.utils.skill_extraction import extract_skills_from_text

logger = logging.getLogger(__name__)


class ResumeParserTool:
    """
    Tool to parse resume data from database.
    
    Input: resume_id (integer)
    Output: JSON string with resume data
    
    Requirement: 27.4
    """
    
    name = "resume_parser"
    description = (
        "Parse resume data from database. "
        "Input should be a resume_id (integer). "
        "Returns JSON with resume text, skills, experience, and education."
    )
    
    @staticmethod
    def _parse_resume_id(raw_input: str) -> Union[int, None]:
        """
        Extract the first integer value from the raw input string.
        """
        if not raw_input:
            return None

        match = re.search(r"(\d+)", raw_input)
        return int(match.group(1)) if match else None

    MAX_EXTRACTED_TEXT_LENGTH = 768
    MAX_SUMMARY_LENGTH = 256

    @staticmethod
    def _run(resume_id: str) -> str:
        """
        Parse resume from database.
        
        Args:
            resume_id: Resume ID as string
            
        Returns:
            JSON string with resume data
        """
        try:
            db = SessionLocal()
            
            resume_id_int = ResumeParserTool._parse_resume_id(resume_id)
            if resume_id_int is None:
                raise ValueError("No valid resume_id found in input")
            
            # Get resume
            resume = db.query(Resume).filter(Resume.id == resume_id_int).first()
            
            if not resume:
                return json.dumps({
                    'error': f'Resume {resume_id} not found'
                })
            
            # Extract data
            extracted_text = resume.extracted_text or ''
            if len(extracted_text) > ResumeParserTool.MAX_EXTRACTED_TEXT_LENGTH:
                extracted_text = extracted_text[:ResumeParserTool.MAX_EXTRACTED_TEXT_LENGTH]

            result = {
                'resume_id': resume.id,
                'filename': resume.filename,
                'text_summary': extracted_text[:ResumeParserTool.MAX_SUMMARY_LENGTH],
                'skills': resume.skills or {},
                'experience': resume.experience or {},
                'education': resume.education or {},
                'status': resume.status
            }
            
            db.close()
            
            return json.dumps(result, separators=(",", ":"))
            
        except Exception as e:
            logger.error(f"ResumeParserTool error: {e}")
            return json.dumps({'error': str(e)})
    
    @classmethod
    def as_tool(cls) -> Tool:
        """Convert to LangChain Tool."""
        return Tool(
            name=cls.name,
            description=cls.description,
            func=cls._run
        )


class SkillExtractorTool:
    """
    Tool to extract skills from resume text.
    
    Input: resume_text (string)
    Output: JSON string with categorized skills
    
    Requirement: 27.4
    """
    
    name = "skill_extractor"
    description = (
        "Extract and categorize skills from resume text. "
        "Input should be resume text (string). "
        "Returns JSON with technical_skills, soft_skills, tools, and languages."
    )
    
    @staticmethod
    def _run(resume_text: str) -> str:
        """
        Extract skills from text.
        
        Args:
            resume_text: Resume text content
            
        Returns:
            JSON string with categorized skills
        """
        try:
            text_to_parse = resume_text

            # If input looks like a numeric resume_id, load text directly from the database
            resume_id_guess = None
            if isinstance(resume_text, str):
                cleaned = resume_text.strip()
                if cleaned.isdigit():
                    resume_id_guess = int(cleaned)
                else:
                    match = re.search(r"(\\d+)", cleaned)
                    if match and len(cleaned) <= 6:
                        resume_id_guess = int(match.group(1))

            if resume_id_guess is not None:
                db = SessionLocal()
                resume_record = db.query(Resume).filter(Resume.id == resume_id_guess).first()
                if resume_record:
                    text_to_parse = resume_record.extracted_text or ''
                db.close()

            # Use existing skill extraction utility
            skills_detailed = extract_skills_from_text(text_to_parse)
            
            # Extract just the skill names from detailed format
            technical_skills = [skill['skill'] for skill in skills_detailed.get('technical_skills', [])]
            soft_skills = [skill['skill'] for skill in skills_detailed.get('soft_skills', [])]
            tools = [skill['skill'] for skill in skills_detailed.get('tools', [])]
            languages = [skill['skill'] for skill in skills_detailed.get('languages', [])]
            
            # Format for agent
            result = {
                'technical_skills': technical_skills,
                'soft_skills': soft_skills,
                'tools': tools,
                'languages': languages,
                'total_skills': len(technical_skills) + len(soft_skills) + len(tools) + len(languages)
            }
            
            return json.dumps(result, separators=(",", ":"))
            
        except Exception as e:
            logger.error(f"SkillExtractorTool error: {e}")
            return json.dumps({'error': str(e)})
    
    @classmethod
    def as_tool(cls) -> Tool:
        """Convert to LangChain Tool."""
        return Tool(
            name=cls.name,
            description=cls.description,
            func=cls._run
        )


class ExperienceAnalyzerTool:
    """
    Tool to analyze career progression and experience.
    
    Input: experience_data (JSON string)
    Output: JSON string with experience analysis
    
    Requirement: 27.4
    """
    
    name = "experience_analyzer"
    description = (
        "Analyze career progression from experience data. "
        "Input should be JSON string with experience entries. "
        "Returns analysis of seniority, gaps, and career progression."
    )
    
    @staticmethod
    def _run(experience_data: str) -> str:
        """
        Analyze experience data.
        
        Args:
            experience_data: JSON string with experience entries
            
        Returns:
            JSON string with experience analysis
        """
        try:
            # Parse experience data
            if isinstance(experience_data, str):
                experience = json.loads(experience_data)
            else:
                experience = experience_data
            
            # Analyze experience
            total_months = 0
            companies = []
            roles = []
            gaps = []
            
            if isinstance(experience, dict) and 'entries' in experience:
                entries = experience['entries']
            elif isinstance(experience, list):
                entries = experience
            else:
                entries = []
            
            for entry in entries:
                if isinstance(entry, dict):
                    # Extract duration
                    duration = entry.get('duration_months', 0)
                    total_months += duration
                    
                    # Extract company and role
                    companies.append(entry.get('company_name', 'Unknown'))
                    roles.append(entry.get('job_title', 'Unknown'))
            
            # Determine seniority level
            years = total_months / 12
            if years < 2:
                seniority = 'Entry'
            elif years < 5:
                seniority = 'Mid'
            elif years < 10:
                seniority = 'Senior'
            else:
                seniority = 'Staff/Principal'
            
            result = {
                'total_experience_years': round(years, 1),
                'total_experience_months': total_months,
                'seniority_level': seniority,
                'number_of_companies': len(set(companies)),
                'number_of_roles': len(roles),
                'companies': list(set(companies)),
                'roles': roles,
                'career_progression': 'Upward' if len(roles) > 1 else 'Stable'
            }
            
            return json.dumps(result, separators=(",", ":"))
            
        except Exception as e:
            logger.error(f"ExperienceAnalyzerTool error: {e}")
            return json.dumps({'error': str(e)})
    
    @classmethod
    def as_tool(cls) -> Tool:
        """Convert to LangChain Tool."""
        return Tool(
            name=cls.name,
            description=cls.description,
            func=cls._run
        )


class SkillGapTool:
    """
    Tool to identify skill gaps for target role.
    
    Input: JSON with current_skills and target_role
    Output: JSON string with skill gaps and recommendations
    
    Requirement: 27.4
    """
    
    name = "skill_gap_analyzer"
    description = (
        "Identify skill gaps between current skills and target role requirements. "
        "Input should be JSON with 'current_skills' (list) and 'target_role' (string). "
        "Returns skill gaps and recommendations."
    )
    
    # Role requirements database (simplified)
    ROLE_REQUIREMENTS = {
        'Software Engineer': {
            'required': ['Python', 'JavaScript', 'Git', 'SQL', 'REST APIs'],
            'preferred': ['Docker', 'AWS', 'React', 'Node.js', 'Testing']
        },
        'Product Manager': {
            'required': ['Product Strategy', 'Roadmapping', 'Stakeholder Management', 'Analytics', 'Agile'],
            'preferred': ['SQL', 'A/B Testing', 'User Research', 'Wireframing']
        },
        'Data Scientist': {
            'required': ['Python', 'Machine Learning', 'Statistics', 'SQL', 'Data Visualization'],
            'preferred': ['TensorFlow', 'PyTorch', 'Spark', 'Cloud Platforms', 'Deep Learning']
        },
        'Marketing Manager': {
            'required': ['Digital Marketing', 'SEO', 'Content Strategy', 'Analytics', 'Campaign Management'],
            'preferred': ['Google Ads', 'Social Media', 'Email Marketing', 'CRM']
        },
        'Finance Analyst': {
            'required': ['Financial Modeling', 'Excel', 'Accounting', 'Data Analysis', 'Reporting'],
            'preferred': ['SQL', 'Python', 'Tableau', 'Bloomberg Terminal']
        }
    }
    
    @staticmethod
    def _run(input_data: str) -> str:
        """
        Identify skill gaps.
        
        Args:
            input_data: JSON string with current_skills and target_role
            
        Returns:
            JSON string with skill gaps
        """
        try:
            # Parse input
            if isinstance(input_data, str):
                data = json.loads(input_data)
            else:
                data = input_data
            
            current_skills = data.get('current_skills', [])
            target_role = data.get('target_role', 'Software Engineer')
            
            # Normalize skills to lowercase for comparison
            current_skills_lower = [s.lower() for s in current_skills]
            
            # Get role requirements
            requirements = SkillGapTool.ROLE_REQUIREMENTS.get(
                target_role,
                SkillGapTool.ROLE_REQUIREMENTS['Software Engineer']
            )
            
            # Find gaps
            required_gaps = [
                skill for skill in requirements['required']
                if skill.lower() not in current_skills_lower
            ]
            
            preferred_gaps = [
                skill for skill in requirements['preferred']
                if skill.lower() not in current_skills_lower
            ]
            
            # Calculate match percentage
            total_required = len(requirements['required'])
            matched_required = total_required - len(required_gaps)
            match_percentage = (matched_required / total_required * 100) if total_required > 0 else 0
            
            result = {
                'target_role': target_role,
                'match_percentage': round(match_percentage, 1),
                'required_skills_missing': required_gaps,
                'preferred_skills_missing': preferred_gaps,
                'total_gaps': len(required_gaps) + len(preferred_gaps),
                'priority': 'High' if len(required_gaps) > 2 else 'Medium' if len(required_gaps) > 0 else 'Low',
                'recommendation': 'Focus on required skills first' if required_gaps else 'Consider adding preferred skills'
            }
            
            return json.dumps(result, separators=(",", ":"))
            
        except Exception as e:
            logger.error(f"SkillGapTool error: {e}")
            return json.dumps({'error': str(e)})
    
    @classmethod
    def as_tool(cls) -> Tool:
        """Convert to LangChain Tool."""
        return Tool(
            name=cls.name,
            description=cls.description,
            func=cls._run
        )


class RoadmapGeneratorTool:
    """
    Tool to generate learning roadmap based on skill gaps.
    
    Input: JSON with skill_gaps and experience_level
    Output: JSON string with learning roadmap
    
    Requirement: 27.4
    """
    
    name = "roadmap_generator"
    description = (
        "Generate learning roadmap based on skill gaps and experience level. "
        "Input should be JSON with 'skill_gaps' (list) and 'experience_level' (string). "
        "Returns structured learning roadmap with milestones."
    )
    
    @staticmethod
    def _run(input_data: str) -> str:
        """
        Generate learning roadmap.
        
        Args:
            input_data: JSON string with skill_gaps and experience_level
            
        Returns:
            JSON string with learning roadmap
        """
        try:
            # Parse input
            if isinstance(input_data, str):
                data = json.loads(input_data)
            else:
                data = input_data
            
            skill_gaps = data.get('skill_gaps', [])
            experience_level = data.get('experience_level', 'Mid')
            
            # Generate roadmap based on experience level
            if experience_level in ['Entry', 'Junior']:
                timeline_weeks = 16  # 4 months
                hours_per_week = 10
            elif experience_level in ['Mid', 'Intermediate']:
                timeline_weeks = 12  # 3 months
                hours_per_week = 8
            else:  # Senior, Staff
                timeline_weeks = 8  # 2 months
                hours_per_week = 6
            
            # Create milestones
            milestones = []
            skills_per_milestone = max(1, len(skill_gaps) // 4)
            
            for i in range(0, len(skill_gaps), skills_per_milestone):
                milestone_skills = skill_gaps[i:i + skills_per_milestone]
                week_start = (i // skills_per_milestone) * (timeline_weeks // 4) + 1
                week_end = week_start + (timeline_weeks // 4) - 1
                
                milestone = {
                    'milestone_number': (i // skills_per_milestone) + 1,
                    'weeks': f'{week_start}-{week_end}',
                    'skills_to_learn': milestone_skills,
                    'estimated_hours': hours_per_week * (timeline_weeks // 4),
                    'activities': [
                        f'Complete online course for {skill}' for skill in milestone_skills
                    ] + [
                        'Build practice project',
                        'Review and consolidate learning'
                    ]
                }
                milestones.append(milestone)
            
            result = {
                'total_timeline_weeks': timeline_weeks,
                'hours_per_week': hours_per_week,
                'total_hours': timeline_weeks * hours_per_week,
                'experience_level': experience_level,
                'number_of_skills': len(skill_gaps),
                'milestones': milestones,
                'success_tips': [
                    'Practice consistently every week',
                    'Build projects to apply new skills',
                    'Join online communities for support',
                    'Track your progress regularly'
                ]
            }
            
            return json.dumps(result, separators=(",", ":"))
            
        except Exception as e:
            logger.error(f"RoadmapGeneratorTool error: {e}")
            return json.dumps({'error': str(e)})
    
    @classmethod
    def as_tool(cls) -> Tool:
        """Convert to LangChain Tool."""
        return Tool(
            name=cls.name,
            description=cls.description,
            func=cls._run
        )


class AnalysisFormatterTool:
    """
    Tool to format the assembled data into the required JSON schema.
    """

    name = "analysis_formatter"
    description = (
        "Format the collected skill inventory, experience timeline, skill gaps, "
        "and learning roadmap into the final JSON structure that the resume agent must return. "
        "Input should be JSON with keys: skill_inventory, experience_timeline, skill_gaps, improvement_roadmap, and optional analysis_summary."
    )

    @staticmethod
    def _extract_json(text: str) -> str:
        start = text.find("{")
        if start == -1:
            raise ValueError("No JSON object found in payload")

        depth = 0
        for idx in range(start, len(text)):
            char = text[idx]
            if char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    return text[start: idx + 1]

        raise ValueError("Unbalanced JSON braces in payload")

    def _run(payload: Union[str, Dict[str, Any]]) -> str:
        try:
            if isinstance(payload, str):
                trimmed = payload.strip()
                json_part = AnalysisFormatterTool._extract_json(trimmed)
                data = json.loads(json_part)
            else:
                data = payload
        except Exception as exc:
            logger.error(f"AnalysisFormatterTool input parse error: {exc}")
            raise

        analysis_data = {
            "skill_inventory": data.get("skill_inventory", {}) or {},
            "experience_timeline": data.get("experience_timeline", {}) or {},
            "skill_gaps": data.get("skill_gaps", {}) or {},
            "improvement_roadmap": data.get("improvement_roadmap", {}) or {},
        }

        result = {
            **analysis_data
        }

        summary = data.get("analysis_summary")
        if summary:
            result["analysis_summary"] = summary

        return json.dumps(result, separators=(",", ":"))

    @classmethod
    def as_tool(cls) -> Tool:
        return Tool(
            name=cls.name,
            description=cls.description,
            func=cls._run
        )
