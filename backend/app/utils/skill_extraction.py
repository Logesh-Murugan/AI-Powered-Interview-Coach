"""
Skill extraction utilities using spaCy NLP
"""
import json
import os
import re
from typing import Dict, List, Set, Tuple
from loguru import logger

# Global variables for lazy loading
_nlp = None
_skill_taxonomy = None


def load_skill_taxonomy() -> Dict[str, List[str]]:
    """
    Load skill taxonomy from JSON file.
    
    Returns:
        Dictionary with skill categories and lists of skills
    """
    global _skill_taxonomy
    
    if _skill_taxonomy is not None:
        return _skill_taxonomy
    
    taxonomy_path = os.path.join(
        os.path.dirname(__file__),
        '..',
        'data',
        'skill_taxonomy.json'
    )
    
    with open(taxonomy_path, 'r', encoding='utf-8') as f:
        _skill_taxonomy = json.load(f)
    
    logger.info(f"Loaded skill taxonomy with {len(_skill_taxonomy)} categories")
    return _skill_taxonomy


def load_spacy_model():
    """
    Load spaCy NLP model (lazy loading).
    
    Returns:
        spaCy NLP model
    """
    global _nlp
    
    if _nlp is not None:
        return _nlp
    
    try:
        import spacy
        logger.info("Loading spaCy model en_core_web_lg...")
        _nlp = spacy.load("en_core_web_lg")
        logger.info("spaCy model loaded successfully")
        return _nlp
    except OSError:
        # Model not downloaded yet, try smaller model
        logger.warning("en_core_web_lg not found, trying en_core_web_sm...")
        try:
            import spacy
            _nlp = spacy.load("en_core_web_sm")
            logger.info("Using en_core_web_sm model")
            return _nlp
        except OSError:
            logger.error("No spaCy model found. Please download with: python -m spacy download en_core_web_lg")
            raise Exception("spaCy model not found. Please run: python -m spacy download en_core_web_lg")


def normalize_skill(skill: str) -> str:
    """
    Normalize skill name for matching.
    
    Args:
        skill: Skill name
        
    Returns:
        Normalized skill name
    """
    # Convert to lowercase
    normalized = skill.lower()
    
    # Remove special characters except dots and hyphens
    normalized = re.sub(r'[^\w\s\.\-]', '', normalized)
    
    # Remove extra whitespace
    normalized = ' '.join(normalized.split())
    
    return normalized


def create_skill_patterns(taxonomy: Dict[str, List[str]]) -> Dict[str, Set[str]]:
    """
    Create normalized skill patterns for matching.
    
    Args:
        taxonomy: Skill taxonomy dictionary
        
    Returns:
        Dictionary with normalized skill patterns
    """
    patterns = {}
    
    for category, skills in taxonomy.items():
        normalized_skills = set()
        for skill in skills:
            # Add original
            normalized_skills.add(normalize_skill(skill))
            
            # Add variations
            if '.' in skill:
                # Add version without dots (e.g., "Node.js" -> "nodejs")
                normalized_skills.add(normalize_skill(skill.replace('.', '')))
            
            if ' ' in skill:
                # Add version without spaces (e.g., "Machine Learning" -> "machinelearning")
                normalized_skills.add(normalize_skill(skill.replace(' ', '')))
        
        patterns[category] = normalized_skills
    
    return patterns


def extract_skills_from_text(text: str, confidence_threshold: float = 0.6) -> Dict[str, List[Dict[str, any]]]:
    """
    Extract skills from text using NLP and pattern matching.
    
    Args:
        text: Resume text
        confidence_threshold: Minimum confidence score (0.0 to 1.0)
        
    Returns:
        Dictionary with categorized skills and confidence scores
    """
    if not text or len(text.strip()) < 50:
        logger.warning("Text too short for skill extraction")
        return {}
    
    # Load resources
    nlp = load_spacy_model()
    taxonomy = load_skill_taxonomy()
    skill_patterns = create_skill_patterns(taxonomy)
    
    # Process text with spaCy
    doc = nlp(text.lower())
    
    # Extract potential skills
    found_skills = {}
    
    # Method 1: Direct pattern matching
    for category, patterns in skill_patterns.items():
        category_skills = []
        
        for pattern in patterns:
            # Simple substring matching
            if pattern in text.lower():
                # Calculate confidence based on context
                confidence = calculate_confidence(text.lower(), pattern, doc)
                
                if confidence >= confidence_threshold:
                    # Find original skill name
                    original_skill = find_original_skill(pattern, taxonomy[category])
                    
                    if original_skill and not any(s['skill'] == original_skill for s in category_skills):
                        category_skills.append({
                            'skill': original_skill,
                            'confidence': round(confidence, 2)
                        })
        
        if category_skills:
            found_skills[category] = category_skills
    
    # Method 2: Named Entity Recognition (NER)
    # Extract organizations, products, and technologies
    for ent in doc.ents:
        if ent.label_ in ['ORG', 'PRODUCT', 'GPE', 'NORP']:
            skill_text = ent.text.strip()
            if len(skill_text) > 2:
                # Check if it matches any skill
                normalized = normalize_skill(skill_text)
                for category, patterns in skill_patterns.items():
                    if normalized in patterns:
                        original_skill = find_original_skill(normalized, taxonomy[category])
                        if original_skill:
                            if category not in found_skills:
                                found_skills[category] = []
                            
                            if not any(s['skill'] == original_skill for s in found_skills[category]):
                                found_skills[category].append({
                                    'skill': original_skill,
                                    'confidence': 0.8  # Higher confidence for NER matches
                                })
    
    # Sort skills by confidence within each category
    for category in found_skills:
        found_skills[category] = sorted(
            found_skills[category],
            key=lambda x: x['confidence'],
            reverse=True
        )
    
    logger.info(f"Extracted {sum(len(skills) for skills in found_skills.values())} skills from text")
    return found_skills


def calculate_confidence(text: str, skill: str, doc) -> float:
    """
    Calculate confidence score for a skill match.
    
    Args:
        text: Full text
        skill: Skill to check
        doc: spaCy doc object
        
    Returns:
        Confidence score (0.0 to 1.0)
    """
    confidence = 0.6  # Base confidence
    
    # Increase confidence if skill appears multiple times
    count = text.count(skill)
    if count > 1:
        confidence += min(0.2, count * 0.05)
    
    # Increase confidence if skill appears in context keywords
    context_keywords = ['experience', 'proficient', 'expert', 'skilled', 'knowledge', 
                       'worked with', 'developed', 'built', 'created', 'implemented',
                       'years', 'projects', 'using', 'with']
    
    # Check if skill appears near context keywords
    skill_index = text.find(skill)
    if skill_index != -1:
        context_window = text[max(0, skill_index-100):min(len(text), skill_index+100)]
        for keyword in context_keywords:
            if keyword in context_window:
                confidence += 0.05
                break
    
    # Cap at 1.0
    return min(1.0, confidence)


def find_original_skill(normalized: str, skill_list: List[str]) -> str:
    """
    Find original skill name from normalized version.
    
    Args:
        normalized: Normalized skill name
        skill_list: List of original skill names
        
    Returns:
        Original skill name or None
    """
    for skill in skill_list:
        if normalize_skill(skill) == normalized:
            return skill
        
        # Check variations
        if normalize_skill(skill.replace('.', '')) == normalized:
            return skill
        
        if normalize_skill(skill.replace(' ', '')) == normalized:
            return skill
    
    return None


def categorize_skills(skills_dict: Dict[str, List[Dict[str, any]]]) -> Dict[str, List[str]]:
    """
    Categorize skills into main categories for resume storage.
    
    Args:
        skills_dict: Dictionary with detailed skill information
        
    Returns:
        Simplified dictionary with categorized skills
    """
    categorized = {
        'technical_skills': [],
        'soft_skills': [],
        'tools': [],
        'languages': []
    }
    
    # Map taxonomy categories to main categories
    category_mapping = {
        'programming_languages': 'technical_skills',
        'frameworks_libraries': 'technical_skills',
        'databases': 'technical_skills',
        'cloud_platforms': 'tools',
        'devops_tools': 'tools',
        'version_control': 'tools',
        'mobile_development': 'technical_skills',
        'data_science_ml': 'technical_skills',
        'methodologies': 'technical_skills',
        'soft_skills': 'soft_skills',
        'security': 'technical_skills',
        'other_tools': 'tools',
        'languages_spoken': 'languages'
    }
    
    for category, skills in skills_dict.items():
        main_category = category_mapping.get(category, 'technical_skills')
        for skill_info in skills:
            skill_name = skill_info['skill']
            if skill_name not in categorized[main_category]:
                categorized[main_category].append(skill_name)
    
    # Remove empty categories
    categorized = {k: v for k, v in categorized.items() if v}
    
    return categorized


def extract_and_categorize_skills(text: str, confidence_threshold: float = 0.6) -> Tuple[Dict, Dict]:
    """
    Extract skills and return both detailed and categorized versions.
    
    Args:
        text: Resume text
        confidence_threshold: Minimum confidence score
        
    Returns:
        Tuple of (detailed_skills, categorized_skills)
    """
    detailed_skills = extract_skills_from_text(text, confidence_threshold)
    categorized_skills = categorize_skills(detailed_skills)
    
    return detailed_skills, categorized_skills


def get_skill_statistics(skills_dict: Dict[str, List[str]]) -> Dict[str, int]:
    """
    Get statistics about extracted skills.
    
    Args:
        skills_dict: Categorized skills dictionary
        
    Returns:
        Dictionary with skill counts
    """
    stats = {
        'total_skills': sum(len(skills) for skills in skills_dict.values()),
        'technical_skills_count': len(skills_dict.get('technical_skills', [])),
        'soft_skills_count': len(skills_dict.get('soft_skills', [])),
        'tools_count': len(skills_dict.get('tools', [])),
        'languages_count': len(skills_dict.get('languages', []))
    }
    
    return stats
