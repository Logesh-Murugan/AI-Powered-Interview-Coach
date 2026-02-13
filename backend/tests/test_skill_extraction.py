"""
Tests for skill extraction utilities
"""
import pytest
import json
import os
from app.utils.skill_extraction import (
    load_skill_taxonomy,
    load_spacy_model,
    normalize_skill,
    create_skill_patterns,
    extract_skills_from_text,
    calculate_confidence,
    find_original_skill,
    categorize_skills,
    extract_and_categorize_skills,
    get_skill_statistics
)


class TestSkillTaxonomy:
    """Test skill taxonomy loading and structure"""
    
    def test_load_skill_taxonomy(self):
        """Test that skill taxonomy loads successfully"""
        taxonomy = load_skill_taxonomy()
        
        assert taxonomy is not None
        assert isinstance(taxonomy, dict)
        assert len(taxonomy) > 0
        
        # Check for expected categories
        expected_categories = [
            'programming_languages',
            'frameworks_libraries',
            'databases',
            'soft_skills'
        ]
        
        for category in expected_categories:
            assert category in taxonomy
            assert isinstance(taxonomy[category], list)
            assert len(taxonomy[category]) > 0
    
    def test_taxonomy_caching(self):
        """Test that taxonomy is cached after first load"""
        taxonomy1 = load_skill_taxonomy()
        taxonomy2 = load_skill_taxonomy()
        
        # Should be the same object (cached)
        assert taxonomy1 is taxonomy2
    
    def test_taxonomy_structure(self):
        """Test taxonomy has valid structure"""
        taxonomy = load_skill_taxonomy()
        
        for category, skills in taxonomy.items():
            assert isinstance(category, str)
            assert isinstance(skills, list)
            
            for skill in skills:
                assert isinstance(skill, str)
                assert len(skill) > 0


class TestSpacyModel:
    """Test spaCy model loading"""
    
    def test_load_spacy_model(self):
        """Test that spaCy model loads successfully"""
        nlp = load_spacy_model()
        
        assert nlp is not None
        assert hasattr(nlp, 'pipe')
        assert hasattr(nlp, '__call__')
    
    def test_spacy_model_caching(self):
        """Test that spaCy model is cached after first load"""
        nlp1 = load_spacy_model()
        nlp2 = load_spacy_model()
        
        # Should be the same object (cached)
        assert nlp1 is nlp2
    
    def test_spacy_model_processes_text(self):
        """Test that spaCy model can process text"""
        nlp = load_spacy_model()
        doc = nlp("Python is a programming language")
        
        assert doc is not None
        assert len(doc) > 0


class TestSkillNormalization:
    """Test skill normalization functions"""
    
    def test_normalize_skill_lowercase(self):
        """Test that skills are converted to lowercase"""
        assert normalize_skill("Python") == "python"
        assert normalize_skill("JAVASCRIPT") == "javascript"
    
    def test_normalize_skill_whitespace(self):
        """Test that extra whitespace is removed"""
        assert normalize_skill("  Python  ") == "python"
        assert normalize_skill("Machine  Learning") == "machine learning"
    
    def test_normalize_skill_special_chars(self):
        """Test that special characters are handled"""
        assert normalize_skill("C++") == "c"
        assert normalize_skill("Node.js") == "node.js"
        assert normalize_skill("React-Native") == "react-native"
    
    def test_create_skill_patterns(self):
        """Test skill pattern creation"""
        taxonomy = {
            'programming_languages': ['Python', 'JavaScript', 'Node.js'],
            'frameworks_libraries': ['React', 'Django']
        }
        
        patterns = create_skill_patterns(taxonomy)
        
        assert 'programming_languages' in patterns
        assert 'frameworks_libraries' in patterns
        
        # Check that normalized versions are included
        assert 'python' in patterns['programming_languages']
        assert 'javascript' in patterns['programming_languages']
        
        # Check variations
        assert 'nodejs' in patterns['programming_languages']  # Node.js without dot


class TestSkillExtraction:
    """Test skill extraction from text"""
    
    def test_extract_skills_from_simple_text(self):
        """Test skill extraction from simple text"""
        text = """
        I have 5 years of experience with Python and JavaScript.
        I've worked with React, Django, and PostgreSQL databases.
        """
        
        skills = extract_skills_from_text(text, confidence_threshold=0.6)
        
        assert isinstance(skills, dict)
        assert len(skills) > 0
        
        # Check that some skills were found
        all_skills = []
        for category_skills in skills.values():
            all_skills.extend([s['skill'] for s in category_skills])
        
        # Should find at least some of these skills
        expected_skills = ['Python', 'JavaScript', 'React', 'Django', 'PostgreSQL']
        found_count = sum(1 for skill in expected_skills if skill in all_skills)
        assert found_count >= 3  # At least 3 out of 5
    
    def test_extract_skills_with_confidence(self):
        """Test that confidence scores are calculated"""
        text = """
        Expert in Python with 5 years of experience.
        Proficient in JavaScript and React.
        """
        
        skills = extract_skills_from_text(text, confidence_threshold=0.6)
        
        for category, category_skills in skills.items():
            for skill_info in category_skills:
                assert 'skill' in skill_info
                assert 'confidence' in skill_info
                assert 0.0 <= skill_info['confidence'] <= 1.0
                assert skill_info['confidence'] >= 0.6
    
    def test_extract_skills_empty_text(self):
        """Test extraction from empty text"""
        skills = extract_skills_from_text("", confidence_threshold=0.6)
        assert skills == {}
    
    def test_extract_skills_short_text(self):
        """Test extraction from very short text"""
        skills = extract_skills_from_text("Python", confidence_threshold=0.6)
        assert skills == {}  # Too short for meaningful extraction
    
    def test_extract_skills_no_skills(self):
        """Test extraction from text with no skills"""
        text = "I like to eat pizza and watch movies on weekends."
        skills = extract_skills_from_text(text, confidence_threshold=0.6)
        
        # Should return empty or very few skills
        total_skills = sum(len(s) for s in skills.values())
        assert total_skills == 0 or total_skills < 3
    
    def test_extract_skills_confidence_threshold(self):
        """Test that confidence threshold filters skills"""
        text = "I have experience with Python and JavaScript."
        
        # Lower threshold should find more skills
        skills_low = extract_skills_from_text(text, confidence_threshold=0.5)
        skills_high = extract_skills_from_text(text, confidence_threshold=0.8)
        
        count_low = sum(len(s) for s in skills_low.values())
        count_high = sum(len(s) for s in skills_high.values())
        
        # Lower threshold should find at least as many skills
        assert count_low >= count_high
    
    def test_extract_skills_multiple_mentions(self):
        """Test that multiple mentions increase confidence"""
        text = """
        Python is my primary language. I use Python daily.
        I've built multiple projects with Python.
        """
        
        skills = extract_skills_from_text(text, confidence_threshold=0.6)
        
        # Find Python in results
        python_found = False
        for category_skills in skills.values():
            for skill_info in category_skills:
                if skill_info['skill'] == 'Python':
                    python_found = True
                    # Should have higher confidence due to multiple mentions
                    assert skill_info['confidence'] > 0.6
        
        assert python_found


class TestConfidenceCalculation:
    """Test confidence score calculation"""
    
    def test_calculate_confidence_base(self):
        """Test base confidence score"""
        nlp = load_spacy_model()
        text = "I know Python"
        doc = nlp(text.lower())
        
        confidence = calculate_confidence(text.lower(), "python", doc)
        
        assert 0.0 <= confidence <= 1.0
        assert confidence >= 0.6  # Base confidence
    
    def test_calculate_confidence_multiple_occurrences(self):
        """Test confidence increases with multiple occurrences"""
        nlp = load_spacy_model()
        text1 = "I know Python"
        text2 = "I know Python and use Python daily with Python projects"
        
        doc1 = nlp(text1.lower())
        doc2 = nlp(text2.lower())
        
        confidence1 = calculate_confidence(text1.lower(), "python", doc1)
        confidence2 = calculate_confidence(text2.lower(), "python", doc2)
        
        assert confidence2 > confidence1
    
    def test_calculate_confidence_context_keywords(self):
        """Test confidence increases with context keywords"""
        nlp = load_spacy_model()
        text1 = "Python"
        text2 = "Expert in Python with 5 years of experience"
        
        doc1 = nlp(text1.lower())
        doc2 = nlp(text2.lower())
        
        confidence1 = calculate_confidence(text1.lower(), "python", doc1)
        confidence2 = calculate_confidence(text2.lower(), "python", doc2)
        
        assert confidence2 > confidence1


class TestSkillMatching:
    """Test skill matching functions"""
    
    def test_find_original_skill_exact(self):
        """Test finding original skill with exact match"""
        skill_list = ['Python', 'JavaScript', 'Node.js']
        
        assert find_original_skill('python', skill_list) == 'Python'
        assert find_original_skill('javascript', skill_list) == 'JavaScript'
    
    def test_find_original_skill_variations(self):
        """Test finding original skill with variations"""
        skill_list = ['Node.js', 'Machine Learning']
        
        # Should match Node.js even without dot
        assert find_original_skill('nodejs', skill_list) == 'Node.js'
        
        # Should match Machine Learning even without space
        assert find_original_skill('machinelearning', skill_list) == 'Machine Learning'
    
    def test_find_original_skill_not_found(self):
        """Test finding skill that doesn't exist"""
        skill_list = ['Python', 'JavaScript']
        
        assert find_original_skill('ruby', skill_list) is None


class TestSkillCategorization:
    """Test skill categorization"""
    
    def test_categorize_skills_basic(self):
        """Test basic skill categorization"""
        skills_dict = {
            'programming_languages': [
                {'skill': 'Python', 'confidence': 0.9},
                {'skill': 'JavaScript', 'confidence': 0.8}
            ],
            'soft_skills': [
                {'skill': 'Communication', 'confidence': 0.7}
            ]
        }
        
        categorized = categorize_skills(skills_dict)
        
        assert 'technical_skills' in categorized
        assert 'soft_skills' in categorized
        
        assert 'Python' in categorized['technical_skills']
        assert 'JavaScript' in categorized['technical_skills']
        assert 'Communication' in categorized['soft_skills']
    
    def test_categorize_skills_mapping(self):
        """Test that taxonomy categories map correctly"""
        skills_dict = {
            'programming_languages': [{'skill': 'Python', 'confidence': 0.9}],
            'frameworks_libraries': [{'skill': 'React', 'confidence': 0.8}],
            'databases': [{'skill': 'PostgreSQL', 'confidence': 0.8}],
            'cloud_platforms': [{'skill': 'AWS', 'confidence': 0.7}],
            'devops_tools': [{'skill': 'Docker', 'confidence': 0.7}],
            'soft_skills': [{'skill': 'Leadership', 'confidence': 0.6}]
        }
        
        categorized = categorize_skills(skills_dict)
        
        # Programming languages, frameworks, databases -> technical_skills
        assert 'Python' in categorized['technical_skills']
        assert 'React' in categorized['technical_skills']
        assert 'PostgreSQL' in categorized['technical_skills']
        
        # Cloud and DevOps -> tools
        assert 'AWS' in categorized['tools']
        assert 'Docker' in categorized['tools']
        
        # Soft skills -> soft_skills
        assert 'Leadership' in categorized['soft_skills']
    
    def test_categorize_skills_no_duplicates(self):
        """Test that categorization doesn't create duplicates"""
        skills_dict = {
            'programming_languages': [
                {'skill': 'Python', 'confidence': 0.9},
                {'skill': 'Python', 'confidence': 0.8}  # Duplicate
            ]
        }
        
        categorized = categorize_skills(skills_dict)
        
        # Should only have one Python
        assert categorized['technical_skills'].count('Python') == 1
    
    def test_categorize_skills_empty_categories_removed(self):
        """Test that empty categories are removed"""
        skills_dict = {
            'programming_languages': [{'skill': 'Python', 'confidence': 0.9}]
        }
        
        categorized = categorize_skills(skills_dict)
        
        # Should only have technical_skills, not empty categories
        assert 'technical_skills' in categorized
        # Empty categories should not be present
        for category, skills in categorized.items():
            assert len(skills) > 0


class TestExtractAndCategorize:
    """Test combined extraction and categorization"""
    
    def test_extract_and_categorize_skills(self):
        """Test full extraction and categorization pipeline"""
        text = """
        Senior Software Engineer with 5 years of experience.
        
        Technical Skills:
        - Programming: Python, JavaScript, TypeScript
        - Frameworks: React, Django, FastAPI
        - Databases: PostgreSQL, MongoDB, Redis
        - Cloud: AWS, Docker, Kubernetes
        
        Soft Skills:
        - Strong communication and leadership
        - Team collaboration
        - Problem solving
        """
        
        detailed, categorized = extract_and_categorize_skills(text, confidence_threshold=0.6)
        
        # Check detailed skills
        assert isinstance(detailed, dict)
        assert len(detailed) > 0
        
        # Check categorized skills
        assert isinstance(categorized, dict)
        assert 'technical_skills' in categorized or 'tools' in categorized
        
        # Should have found multiple skills
        total_skills = sum(len(skills) for skills in categorized.values())
        assert total_skills >= 5
    
    def test_extract_and_categorize_returns_both(self):
        """Test that both detailed and categorized are returned"""
        text = "I have experience with Python and JavaScript."
        
        detailed, categorized = extract_and_categorize_skills(text)
        
        assert isinstance(detailed, dict)
        assert isinstance(categorized, dict)
        
        # Detailed should have confidence scores
        for category_skills in detailed.values():
            for skill_info in category_skills:
                assert 'confidence' in skill_info
        
        # Categorized should just have skill names
        for category_skills in categorized.values():
            for skill in category_skills:
                assert isinstance(skill, str)


class TestSkillStatistics:
    """Test skill statistics calculation"""
    
    def test_get_skill_statistics_basic(self):
        """Test basic statistics calculation"""
        skills_dict = {
            'technical_skills': ['Python', 'JavaScript', 'React'],
            'soft_skills': ['Communication'],
            'tools': ['Docker', 'Git']
        }
        
        stats = get_skill_statistics(skills_dict)
        
        assert stats['total_skills'] == 6
        assert stats['technical_skills_count'] == 3
        assert stats['soft_skills_count'] == 1
        assert stats['tools_count'] == 2
        assert stats['languages_count'] == 0
    
    def test_get_skill_statistics_empty(self):
        """Test statistics with empty skills"""
        skills_dict = {}
        
        stats = get_skill_statistics(skills_dict)
        
        assert stats['total_skills'] == 0
        assert stats['technical_skills_count'] == 0
        assert stats['soft_skills_count'] == 0
        assert stats['tools_count'] == 0
        assert stats['languages_count'] == 0
    
    def test_get_skill_statistics_all_categories(self):
        """Test statistics with all categories"""
        skills_dict = {
            'technical_skills': ['Python', 'JavaScript'],
            'soft_skills': ['Communication', 'Leadership'],
            'tools': ['Docker'],
            'languages': ['English', 'Spanish']
        }
        
        stats = get_skill_statistics(skills_dict)
        
        assert stats['total_skills'] == 7
        assert stats['technical_skills_count'] == 2
        assert stats['soft_skills_count'] == 2
        assert stats['tools_count'] == 1
        assert stats['languages_count'] == 2


class TestEndToEndSkillExtraction:
    """Test end-to-end skill extraction scenarios"""
    
    def test_realistic_resume_text(self):
        """Test extraction from realistic resume text"""
        text = """
        JOHN DOE
        Senior Full-Stack Developer
        
        SUMMARY
        Experienced software engineer with 7 years of expertise in building scalable web applications.
        Strong background in Python, JavaScript, and cloud technologies.
        
        TECHNICAL SKILLS
        Languages: Python, JavaScript, TypeScript, SQL
        Frameworks: React, Django, FastAPI, Node.js
        Databases: PostgreSQL, MongoDB, Redis
        Cloud & DevOps: AWS, Docker, Kubernetes, CI/CD
        Tools: Git, Jenkins, Terraform
        
        EXPERIENCE
        Senior Developer at Tech Corp (2020-Present)
        - Developed microservices using Python and FastAPI
        - Built React frontend applications
        - Implemented CI/CD pipelines with Jenkins
        - Managed PostgreSQL databases
        
        SOFT SKILLS
        - Strong communication and leadership abilities
        - Excellent problem-solving skills
        - Team collaboration and mentoring
        """
        
        detailed, categorized = extract_and_categorize_skills(text, confidence_threshold=0.6)
        
        # Should extract multiple skills
        total_skills = sum(len(skills) for skills in categorized.values())
        assert total_skills >= 10
        
        # Should have technical skills
        assert 'technical_skills' in categorized or 'tools' in categorized
        
        # Get statistics
        stats = get_skill_statistics(categorized)
        assert stats['total_skills'] >= 10
    
    def test_performance_large_text(self):
        """Test performance with large text"""
        import time
        
        # Create large text by repeating resume content
        base_text = """
        Senior Software Engineer with expertise in Python, JavaScript, React, Django,
        PostgreSQL, AWS, Docker, and Kubernetes. Strong communication and leadership skills.
        """
        large_text = base_text * 50  # Repeat 50 times
        
        start_time = time.time()
        detailed, categorized = extract_and_categorize_skills(large_text, confidence_threshold=0.6)
        end_time = time.time()
        
        execution_time = (end_time - start_time) * 1000  # Convert to milliseconds
        
        # Should complete within 3000ms as per acceptance criteria
        assert execution_time < 3000
        
        # Should still extract skills
        assert len(categorized) > 0
