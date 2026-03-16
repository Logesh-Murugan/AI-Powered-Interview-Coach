"""
Robust JSON extraction utilities for AI responses.
Handles malformed JSON and extracts valid JSON from mixed content.
"""
import json
import re
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


def extract_json_safe(text: str) -> Dict[str, Any]:
    """
    Safely extract JSON from AI response text.
    
    Handles:
    - Clean JSON responses
    - JSON wrapped in markdown blocks
    - JSON with extra text before/after
    - Malformed JSON that can be repaired
    
    Args:
        text: Raw AI response text
        
    Returns:
        Parsed JSON dictionary
        
    Raises:
        ValueError: If no valid JSON can be extracted
    """
    if not text or not text.strip():
        raise ValueError("Empty response from AI")
    
    text = text.strip()
    
    # Try 1: Direct JSON parsing (clean response)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        logger.debug("Direct JSON parsing failed, trying extraction methods")
    
    # Try 2: Remove markdown code blocks
    markdown_pattern = r'```(?:json)?\s*(.*?)\s*```'
    markdown_match = re.search(markdown_pattern, text, re.DOTALL | re.IGNORECASE)
    if markdown_match:
        try:
            return json.loads(markdown_match.group(1).strip())
        except json.JSONDecodeError:
            logger.debug("Markdown extraction failed")
    
    # Try 3: Extract JSON object from mixed content
    json_pattern = r'\{.*\}'
    json_match = re.search(json_pattern, text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except json.JSONDecodeError:
            logger.debug("Regex extraction failed, trying repair")
            
            # Try 4: Repair common JSON issues
            json_text = json_match.group(0)
            repaired = repair_json(json_text)
            if repaired:
                try:
                    return json.loads(repaired)
                except json.JSONDecodeError:
                    logger.debug("JSON repair failed")
    
    # Try 5: Look for array patterns if object pattern fails
    array_pattern = r'\[.*\]'
    array_match = re.search(array_pattern, text, re.DOTALL)
    if array_match:
        try:
            return {"data": json.loads(array_match.group(0))}
        except json.JSONDecodeError:
            logger.debug("Array extraction failed")
    
    raise ValueError(f"Failed to extract valid JSON from AI response: {text[:200]}...")


def repair_json(json_text: str) -> Optional[str]:
    """
    Attempt to repair common JSON formatting issues.
    
    Args:
        json_text: Potentially malformed JSON string
        
    Returns:
        Repaired JSON string or None if repair fails
    """
    try:
        # Remove trailing commas
        repaired = re.sub(r',(\s*[}\]])', r'\1', json_text)
        
        # Fix unquoted keys (simple cases)
        repaired = re.sub(r'(\w+):', r'"\1":', repaired)
        
        # Fix single quotes to double quotes
        repaired = repaired.replace("'", '"')
        
        # Remove comments
        repaired = re.sub(r'//.*?\n', '\n', repaired)
        repaired = re.sub(r'/\*.*?\*/', '', repaired, flags=re.DOTALL)
        
        # Test if repair worked
        json.loads(repaired)
        return repaired
        
    except (json.JSONDecodeError, Exception):
        return None


def ensure_minimum_arrays(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ensure arrays meet minimum length requirements.
    
    Args:
        data: Parsed JSON data
        
    Returns:
        Data with arrays padded to minimum lengths
    """
    # Default values for padding
    default_questions = [
        "Tell me about yourself and your background.",
        "Why do you want to work at this company?",
        "Describe a challenging project you worked on.",
        "How do you handle working under pressure?",
        "What are your career goals for the next 5 years?"
    ]
    
    default_checklist = [
        "Research the company's mission, values, and recent news.",
        "Review the job description and match your skills to requirements.",
        "Prepare STAR method examples for behavioral questions.",
        "Practice explaining technical concepts clearly.",
        "Prepare thoughtful questions to ask the interviewer."
    ]
    
    # Ensure predicted_questions has at least 5 items
    if "predicted_questions" in data:
        questions = data["predicted_questions"]
        if not isinstance(questions, list):
            questions = []
        
        while len(questions) < 5:
            idx = len(questions)
            if idx < len(default_questions):
                questions.append(default_questions[idx])
            else:
                questions.append(f"Additional interview question {idx + 1}")
        
        data["predicted_questions"] = questions
    
    # Ensure pre_interview_checklist has at least 5 items
    if "pre_interview_checklist" in data:
        checklist = data["pre_interview_checklist"]
        if not isinstance(checklist, list):
            checklist = []
        
        while len(checklist) < 5:
            idx = len(checklist)
            if idx < len(default_checklist):
                checklist.append(default_checklist[idx])
            else:
                checklist.append(f"Additional preparation step {idx + 1}")
        
        data["pre_interview_checklist"] = checklist
    
    # Ensure interview_process has at least 3 items
    if "interview_process" in data:
        process = data["interview_process"]
        if not isinstance(process, list):
            process = []
        
        default_process = [
            "Initial phone/video screening with recruiter",
            "Technical interview with team members",
            "Final interview with hiring manager"
        ]
        
        while len(process) < 3:
            idx = len(process)
            if idx < len(default_process):
                process.append(default_process[idx])
            else:
                process.append(f"Interview step {idx + 1}")
        
        data["interview_process"] = process
    
    return data


def create_fallback_response(company_name: str, target_role: Optional[str] = None) -> Dict[str, Any]:
    """
    Create a fallback response when AI generation completely fails.
    
    Args:
        company_name: Target company name
        target_role: Optional target role
        
    Returns:
        Complete fallback coaching response
    """
    role_text = f" for the {target_role} position" if target_role else ""
    
    return {
        "company_overview": f"{company_name} is a leading company in their industry. Research their specific culture, values, recent projects, and news through their website, LinkedIn, and industry publications to understand what makes them unique.",
        "interview_process": [
            "Initial phone or video screening with recruiter or HR",
            "Technical interview with team members or hiring manager",
            "Final interview focusing on cultural fit and role expectations"
        ],
        "predicted_questions": [
            f"Why do you want to work at {company_name}?",
            "Tell me about yourself and your relevant experience.",
            "Describe a challenging project you worked on and how you overcame obstacles.",
            "How do you stay current with industry trends and technologies?",
            "What questions do you have about our company and this role?"
        ],
        "pre_interview_checklist": [
            f"Research {company_name}'s mission, values, and recent company news.",
            "Review the job description and prepare examples matching each requirement.",
            "Prepare STAR method examples for behavioral questions.",
            "Practice explaining your technical skills and projects clearly.",
            "Prepare thoughtful questions about the role, team, and company culture."
        ]
    }