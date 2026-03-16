"""
JSON utilities for AI agent outputs.
Handles extraction, repair, and validation of JSON from LLM responses.
"""
import json
import re
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


def extract_json(text: str) -> Optional[str]:
    """
    Extract the first complete JSON object from text.
    
    Args:
        text: Raw text potentially containing JSON
        
    Returns:
        Extracted JSON string or None if not found
    """
    if not text:
        return None
    
    # Remove everything before "Final Answer:" if present
    if "Final Answer:" in text:
        text = text.split("Final Answer:")[-1]
    
    # Try markdown code fence first
    code_fence_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text, re.DOTALL)
    if code_fence_match:
        potential_json = code_fence_match.group(1).strip()
        if _is_valid_json(potential_json):
            logger.info("✅ Extracted JSON from markdown code fence")
            return potential_json
    
    # Find JSON object with brace counting (handles nested objects)
    start_idx = text.find('{')
    if start_idx == -1:
        return None
    
    brace_count = 0
    for i in range(start_idx, len(text)):
        char = text[i]
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0:
                potential_json = text[start_idx:i+1]
                if _is_valid_json(potential_json):
                    logger.info(f"✅ Extracted JSON using brace counting (length: {len(potential_json)})")
                    return potential_json
    
    # Last resort: regex non-greedy match
    json_match = re.search(r'\{[\s\S]*?\}', text, re.DOTALL)
    if json_match:
        potential_json = json_match.group(0)
        if _is_valid_json(potential_json):
            logger.info("✅ Extracted JSON using regex non-greedy match")
            return potential_json
    
    logger.warning("❌ Failed to extract valid JSON from text")
    return None


def repair_json(text: str) -> Optional[str]:
    """
    Attempt to repair malformed JSON.
    
    Fixes:
    - Trailing commas before closing braces/brackets
    - Missing quotes around keys
    - Single quotes instead of double quotes
    - Unescaped newlines in strings
    
    Args:
        text: Potentially malformed JSON string
        
    Returns:
        Repaired JSON string or None if unrepairable
    """
    if not text:
        return None
    
    original_text = text.strip()
    
    # Try original first
    if _is_valid_json(original_text):
        return original_text
    
    # Fix 1: Remove trailing commas before } or ]
    text = re.sub(r',\s*([}\]])', r'\1', original_text)
    if _is_valid_json(text):
        logger.info("✅ Repaired JSON by removing trailing commas")
        return text
    
    # Fix 2: Replace single quotes with double quotes (carefully)
    # Only replace quotes that appear to be delimiters
    text = re.sub(r"(?<!\\)'", '"', original_text)
    if _is_valid_json(text):
        logger.info("✅ Repaired JSON by converting single to double quotes")
        return text
    
    # Fix 3: Remove comments
    text = re.sub(r'//.*?\n', '\n', original_text)
    text = re.sub(r'/\*[\s\S]*?\*/', '', text)
    if _is_valid_json(text):
        logger.info("✅ Repaired JSON by removing comments")
        return text
    
    # Fix 4: Fix unescaped newlines in strings
    text = re.sub(r'(?<!\\)\n', '\\n', original_text)
    if _is_valid_json(text):
        logger.info("✅ Repaired JSON by escaping newlines")
        return text
    
    # Fix 5: Try all combinations
    text = original_text
    text = re.sub(r',\s*([}\]])', r'\1', text)  # trailing commas
    text = re.sub(r"(?<!\\)'", '"', text)  # single quotes
    text = re.sub(r'//.*?\n', '\n', text)  # line comments
    text = re.sub(r'/\*[\s\S]*?\*/', '', text)  # block comments
    text = re.sub(r'(?<!\\)\n', '\\n', text)  # newlines
    text = re.sub(r'(?<!\\)\t', '\\t', text)  # tabs
    
    if _is_valid_json(text):
        logger.info("✅ Repaired JSON using all repair strategies")
        return text
    
    logger.error("❌ JSON is unrepairable")
    return None


def extract_and_repair_json(text: str) -> Optional[Dict[str, Any]]:
    """
    Extract JSON from text and repair if necessary.
    Uses multiple strategies to extract valid JSON.
    
    Args:
        text: Text that may contain JSON
        
    Returns:
        Parsed JSON dictionary or None if extraction fails
    """
    try:
        return extract_json(text)
    except ValueError:
        # Try to repair the JSON
        repaired = repair_json(text)
        if repaired:
            try:
                return extract_json(repaired)
            except ValueError:
                pass
        return None


def extract_json(text: str) -> Dict[str, Any]:
    """
    Safely extract JSON from text with fallback strategies.
    
    Args:
        text: Text that may contain JSON
        
    Returns:
        Parsed JSON dictionary
        
    Raises:
        ValueError: If no valid JSON found
    """
    import json
    import re
    
    # Strategy 1: Try direct JSON parsing
    try:
        parsed = json.loads(text.strip())
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass
    
    # Strategy 2: Look for JSON object with regex
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    
    # Strategy 3: Find JSON between first { and last }
    first_brace = text.find('{')
    last_brace = text.rfind('}')
    
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        json_str = text[first_brace:last_brace + 1]
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            pass
    
    # Strategy 4: Clean and try again
    cleaned = text.strip()
    # Remove common prefixes
    for prefix in ["```json", "```", "JSON:", "Response:", "Output:"]:
        if cleaned.startswith(prefix):
            cleaned = cleaned[len(prefix):].strip()
    # Remove common suffixes
    for suffix in ["```"]:
        if cleaned.endswith(suffix):
            cleaned = cleaned[:-len(suffix)].strip()
    
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass
    
    raise ValueError("Failed to extract valid JSON")


def _is_valid_json(text: str) -> bool:
    """Check if text is valid JSON."""
    try:
        json.loads(text)
        return True
    except json.JSONDecodeError:
        return False


def safe_json_dumps(data: Any, indent: int = 2) -> str:
    """
    Safely serialize data to JSON with proper error handling.
    
    Args:
        data: Data to serialize
        indent: Indentation level for pretty printing
        
    Returns:
        JSON string
    """
    try:
        return json.dumps(data, indent=indent, ensure_ascii=False, default=str)
    except (TypeError, ValueError) as e:
        logger.error(f"JSON serialization failed: {e}")
        # Fallback: convert to string representation
        return json.dumps({"error": "Serialization failed", "data": str(data)})


def ensure_min_items(data: Dict[str, Any], field: str, minimum: int, placeholder: str = "Placeholder item") -> Dict[str, Any]:
    """
    Ensure a list field has at least the minimum number of items.
    Auto-fills with placeholders if needed.
    
    Args:
        data: Dictionary containing the data
        field: Field name to check (must be a list)
        minimum: Minimum number of items required
        placeholder: Text to use for placeholder items
        
    Returns:
        Updated data dictionary
    """
    if field not in data or not isinstance(data[field], list):
        data[field] = []
    
    current_count = len(data[field])
    if current_count < minimum:
        items_to_add = minimum - current_count
        for i in range(items_to_add):
            data[field].append(f"{placeholder} {i + 1}")
        logger.info(f"Added {items_to_add} placeholder items to '{field}' (now has {minimum} items)")
    
    return data


def ensure_coaching_data_complete(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ensure coaching data meets all minimum requirements.
    Auto-fills missing or incomplete fields.
    """
    result = data.copy()
    
    # Ensure company_name exists
    if 'company_name' not in result:
        result['company_name'] = 'Not specified'
    
    # Ensure target_role exists
    if 'target_role' not in result:
        result['target_role'] = 'Not specified'
    
    # Ensure company_overview exists and is a string
    if 'company_overview' not in result or not isinstance(result['company_overview'], str):
        result['company_overview'] = 'Research company culture through their website and employee reviews.'
    
    # Ensure minimum items in arrays
    ensure_min_items(result, 'interview_focus_areas', 3, "Technical problem solving")
    ensure_min_items(result, 'technical_topics_to_prepare', 3, "Data structures and algorithms")
    ensure_min_items(result, 'predicted_questions', 5, "Tell me about yourself and your experience.")
    ensure_min_items(result, 'coding_practice_topics', 3, "Arrays and strings")
    ensure_min_items(result, 'pre_interview_checklist', 5, "Review your resume and the job description.")
    
    return result


def ensure_study_plan_complete(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ensure study plan data meets all minimum requirements.
    Auto-fills missing or incomplete fields.
    
    Args:
        data: Parsed study plan data
        
    Returns:
        Complete study plan data with all required fields
    """
    # Ensure required structure exists
    if 'daily_tasks' not in data or not isinstance(data['daily_tasks'], list):
        data['daily_tasks'] = []
    
    if 'weekly_milestones' not in data or not isinstance(data['weekly_milestones'], list):
        data['weekly_milestones'] = []
    
    if 'resource_links' not in data or not isinstance(data['resource_links'], dict):
        data['resource_links'] = {}
    
    if 'time_estimates' not in data or not isinstance(data['time_estimates'], dict):
        data['time_estimates'] = {
            'total_hours': 100,
            'hours_per_week': 10,
            'completion_date': '2026-12-31'
        }
    
    return data
