"""
Company Coaching Tools

Custom LangChain tools for company-specific interview coaching.

Requirements: 29.1, 29.3-29.7
"""
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.resume_analysis import ResumeAnalysis


class CompanyResearchTool:
    """Tool for researching company culture, values, and interview style"""
    
    name = "company_research"
    description = """Research a company's culture, values, and interview style.
    Input: company_name (string)
    Output: Dictionary with culture, values, interview_style, hiring_process"""
    
    def _run(self, company_name: str) -> Dict[str, Any]:
        """
        Research company information from public sources.
        
        In production, this would integrate with:
        - Glassdoor API
        - LinkedIn Company API
        - Company website scraping
        - Crunchbase API
        
        For now, returns structured mock data based on common patterns.
        """
        # Normalize company name
        company_name = company_name.strip().lower()
        
        # Mock data for common companies (in production, fetch from APIs)
        company_data = {
            'google': {
                'culture': 'Innovation-driven, collaborative, data-focused. Emphasis on "Googleyness" - intellectual humility, comfort with ambiguity, and bias to action.',
                'values': ['Innovation', 'User Focus', 'Collaboration', 'Excellence', 'Diversity'],
                'interview_style': 'Highly technical with behavioral questions. Expect coding challenges, system design, and Googleyness assessment.',
                'hiring_process': '5-6 rounds: Phone screen, technical interviews (2-3), behavioral interview, hiring committee review'
            },
            'amazon': {
                'culture': 'Customer-obsessed, ownership-driven, high-bar for talent. Fast-paced with strong emphasis on leadership principles.',
                'values': ['Customer Obsession', 'Ownership', 'Invent and Simplify', 'Bias for Action', 'Frugality'],
                'interview_style': 'Behavioral interviews focused on Leadership Principles using STAR method. Technical rounds for engineering roles.',
                'hiring_process': '4-5 rounds: Phone screen, onsite loop with 4-5 interviewers, bar raiser interview, debrief'
            },
            'microsoft': {
                'culture': 'Growth mindset, inclusive, collaborative. Focus on learning and innovation with work-life balance.',
                'values': ['Innovation', 'Diversity & Inclusion', 'Corporate Social Responsibility', 'Trustworthy Computing'],
                'interview_style': 'Mix of technical and behavioral. Emphasis on problem-solving approach and growth mindset.',
                'hiring_process': '4-5 rounds: Recruiter screen, technical phone screen, onsite with 4-5 interviews, as-appropriate (AA) interview'
            },
            'meta': {
                'culture': 'Move fast, be bold, focus on impact. Flat hierarchy with emphasis on autonomy and ownership.',
                'values': ['Move Fast', 'Be Bold', 'Focus on Impact', 'Be Open', 'Build Social Value'],
                'interview_style': 'Technical depth with behavioral questions. Coding, system design, and product sense for PM roles.',
                'hiring_process': '5-6 rounds: Recruiter screen, technical phone screen, onsite with 4-5 interviews, hiring committee'
            },
            'apple': {
                'culture': 'Excellence-driven, secretive, design-focused. High attention to detail and user experience.',
                'values': ['Innovation', 'Privacy', 'Environmental Responsibility', 'Accessibility', 'Education'],
                'interview_style': 'Deep technical dives with focus on past projects. Expect detailed questions about your work.',
                'hiring_process': '4-6 rounds: Phone screen, technical interviews, behavioral interviews, team fit assessment'
            }
        }
        
        # Get company data or return generic template
        if company_name in company_data:
            return company_data[company_name]
        else:
            # Generic template for unknown companies
            return {
                'culture': f'{company_name.title()} values innovation, collaboration, and excellence. Research their website and Glassdoor for specific cultural insights.',
                'values': ['Innovation', 'Collaboration', 'Excellence', 'Integrity', 'Customer Focus'],
                'interview_style': 'Typical tech interview process with technical and behavioral components. Research Glassdoor for specific interview experiences.',
                'hiring_process': 'Standard process: Initial screen, technical interviews, behavioral interviews, final round with leadership'
            }
    
    async def _arun(self, company_name: str) -> Dict[str, Any]:
        """Async version"""
        return self._run(company_name)


class InterviewPatternTool:
    """Tool for analyzing historical interview patterns from database"""
    
    name = "interview_patterns"
    description = """Analyze historical interview patterns for a company.
    Input: company_name (string)
    Output: Dictionary with common_categories, difficulty_distribution, typical_questions"""
    
    def __init__(self, db: Session = None):
        """Initialize with database session"""
        self.db = db
    
    def _run(self, company_name: str) -> Dict[str, Any]:
        """
        Analyze interview patterns from database.
        
        In production, this would query company_interview_patterns table (Req 30).
        For now, returns structured mock data based on common patterns.
        """
        company_name = company_name.strip().lower()
        
        # Mock pattern data (in production, query from database)
        patterns = {
            'google': {
                'common_categories': ['Algorithms', 'Data Structures', 'System Design', 'Behavioral', 'Googleyness'],
                'difficulty_distribution': {'Easy': 10, 'Medium': 50, 'Hard': 40},
                'typical_questions': [
                    'Design a URL shortener',
                    'Implement LRU cache',
                    'Tell me about a time you disagreed with a teammate',
                    'How would you improve Google Maps?',
                    'Reverse a linked list'
                ]
            },
            'amazon': {
                'common_categories': ['Leadership Principles', 'System Design', 'Algorithms', 'Behavioral', 'Customer Focus'],
                'difficulty_distribution': {'Easy': 15, 'Medium': 55, 'Hard': 30},
                'typical_questions': [
                    'Tell me about a time you failed',
                    'Design Amazon\'s recommendation system',
                    'Describe a time you had to make a decision with incomplete information',
                    'How do you prioritize when everything is urgent?',
                    'Implement a binary search tree'
                ]
            },
            'microsoft': {
                'common_categories': ['Algorithms', 'System Design', 'Behavioral', 'Problem Solving', 'Growth Mindset'],
                'difficulty_distribution': {'Easy': 20, 'Medium': 50, 'Hard': 30},
                'typical_questions': [
                    'Design a parking lot system',
                    'Tell me about a time you learned from failure',
                    'How would you test an elevator?',
                    'Implement a thread-safe singleton',
                    'Describe your approach to learning new technologies'
                ]
            },
            'meta': {
                'common_categories': ['Algorithms', 'System Design', 'Product Sense', 'Behavioral', 'Coding'],
                'difficulty_distribution': {'Easy': 10, 'Medium': 45, 'Hard': 45},
                'typical_questions': [
                    'Design Facebook News Feed',
                    'Implement a rate limiter',
                    'How would you improve Instagram Stories?',
                    'Tell me about your most impactful project',
                    'Design a distributed cache'
                ]
            },
            'apple': {
                'common_categories': ['Algorithms', 'System Design', 'Past Projects', 'Behavioral', 'Design'],
                'difficulty_distribution': {'Easy': 15, 'Medium': 50, 'Hard': 35},
                'typical_questions': [
                    'Explain your most complex project in detail',
                    'Design iOS notification system',
                    'How do you ensure code quality?',
                    'Implement a memory-efficient data structure',
                    'Tell me about a time you optimized performance'
                ]
            }
        }
        
        if company_name in patterns:
            return patterns[company_name]
        else:
            # Generic pattern for unknown companies
            return {
                'common_categories': ['Algorithms', 'System Design', 'Behavioral', 'Technical Skills', 'Problem Solving'],
                'difficulty_distribution': {'Easy': 20, 'Medium': 50, 'Hard': 30},
                'typical_questions': [
                    'Tell me about yourself',
                    'Describe a challenging project',
                    'How do you handle conflict?',
                    'Design a scalable system',
                    'Solve a coding problem'
                ]
            }
    
    async def _arun(self, company_name: str) -> Dict[str, Any]:
        """Async version"""
        return self._run(company_name)


class STARMethodTool:
    """Tool for extracting STAR method examples from user's resume"""
    
    name = "star_examples"
    description = """Extract STAR method examples from user's resume.
    Input: user_id (integer)
    Output: List of 3-5 STAR examples with situation, task, action, result"""
    
    def __init__(self, db: Session):
        """Initialize with database session"""
        self.db = db
    
    def _run(self, user_id: int) -> List[Dict[str, str]]:
        """
        Extract STAR examples from user's resume analysis.
        
        Queries resume_analyses table for user's experience and achievements,
        then structures them as STAR method examples.
        """
        # Get user's resume analysis
        resume_analysis = self.db.query(ResumeAnalysis).filter(
            ResumeAnalysis.user_id == user_id,
            ResumeAnalysis.status == 'completed'
        ).first()
        
        if not resume_analysis:
            return []
        
        analysis_data = resume_analysis.analysis_data or {}
        
        # Extract experiences and achievements
        experiences = analysis_data.get('work_experience', [])
        achievements = analysis_data.get('key_achievements', [])
        projects = analysis_data.get('projects', [])
        
        star_examples = []
        
        # Convert experiences to STAR format
        for exp in experiences[:2]:  # Top 2 experiences
            star_examples.append({
                'situation': f"Working as {exp.get('title', 'professional')} at {exp.get('company', 'previous company')}",
                'task': exp.get('responsibilities', ['Delivered key projects'])[0] if exp.get('responsibilities') else 'Delivered key projects',
                'action': 'Led development, collaborated with team, implemented solutions',
                'result': exp.get('achievements', ['Successful project delivery'])[0] if exp.get('achievements') else 'Successful project delivery',
                'relevant_to': 'Leadership and technical execution'
            })
        
        # Convert achievements to STAR format
        for achievement in achievements[:2]:  # Top 2 achievements
            if isinstance(achievement, str):
                star_examples.append({
                    'situation': 'Identified opportunity for improvement',
                    'task': 'Needed to deliver measurable impact',
                    'action': achievement,
                    'result': 'Achieved significant positive outcome',
                    'relevant_to': 'Problem solving and impact'
                })
        
        # Convert projects to STAR format
        for project in projects[:1]:  # Top 1 project
            if isinstance(project, dict):
                star_examples.append({
                    'situation': f"Project: {project.get('name', 'Key project')}",
                    'task': project.get('description', 'Build and deliver solution'),
                    'action': f"Used {', '.join(project.get('technologies', ['various technologies']))}",
                    'result': project.get('outcome', 'Successfully delivered project'),
                    'relevant_to': 'Technical skills and project delivery'
                })
        
        # Return top 5 examples
        return star_examples[:5]
    
    async def _arun(self, user_id: int) -> List[Dict[str, str]]:
        """Async version"""
        return self._run(user_id)


class ConfidenceTool:
    """Tool for generating confidence-building tips"""
    
    name = "confidence_tips"
    description = """Generate confidence-building tips for interview preparation.
    Input: company_name (string), target_role (string)
    Output: List of confidence-building tips and pre-interview checklist"""
    
    def _run(self, company_name: str, target_role: str = "") -> Dict[str, List[str]]:
        """
        Generate confidence-building tips and pre-interview checklist.
        
        Provides actionable advice for interview preparation and confidence.
        """
        confidence_tips = [
            f"Research {company_name}'s recent news, products, and initiatives to show genuine interest",
            "Practice your STAR method examples out loud to build fluency and confidence",
            "Prepare 3-5 thoughtful questions to ask your interviewers about the role and team",
            "Review your resume thoroughly and be ready to discuss every point in detail",
            "Get a good night's sleep and arrive 10 minutes early (or log in 5 minutes early for virtual)",
            "Remember: The interview is also for you to evaluate if the company is a good fit",
            "Prepare a brief 2-minute introduction highlighting your key strengths and interest in the role",
            "Practice positive self-talk and visualize a successful interview outcome"
        ]
        
        pre_interview_checklist = [
            f"✓ Research {company_name}'s mission, values, and recent news",
            "✓ Review the job description and match your skills to requirements",
            "✓ Prepare 5-7 STAR method examples covering different competencies",
            "✓ Practice coding problems on LeetCode/HackerRank (for technical roles)",
            "✓ Prepare questions to ask interviewers about role, team, and culture",
            "✓ Test your internet connection and video/audio setup (for virtual interviews)",
            "✓ Prepare professional attire and ensure a quiet interview space",
            "✓ Have a copy of your resume, notepad, and pen ready",
            "✓ Plan your route and arrival time (add buffer for unexpected delays)",
            "✓ Review your STAR examples one more time the night before"
        ]
        
        # Add role-specific tips
        if target_role:
            role_lower = target_role.lower()
            if 'engineer' in role_lower or 'developer' in role_lower:
                confidence_tips.append("Review fundamental data structures and algorithms - focus on understanding, not memorization")
                pre_interview_checklist.append("✓ Practice 2-3 medium difficulty coding problems the day before")
            elif 'manager' in role_lower or 'lead' in role_lower:
                confidence_tips.append("Prepare examples demonstrating leadership, conflict resolution, and team building")
                pre_interview_checklist.append("✓ Prepare metrics showing your impact on team performance and delivery")
            elif 'product' in role_lower:
                confidence_tips.append("Be ready to discuss product decisions, user research, and prioritization frameworks")
                pre_interview_checklist.append("✓ Review the company's products and prepare improvement suggestions")
        
        return {
            'confidence_tips': confidence_tips,
            'pre_interview_checklist': pre_interview_checklist
        }
    
    async def _arun(self, company_name: str, target_role: str = "") -> Dict[str, List[str]]:
        """Async version"""
        return self._run(company_name, target_role)
