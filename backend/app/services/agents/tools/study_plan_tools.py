"""
Study Plan Tools

Custom LangChain tools for study plan agent.

Requirements: 28.3, 28.4, 28.5
"""
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from langchain_core.tools import Tool
from sqlalchemy.orm import Session

from app.models.resume_analysis import ResumeAnalysis
from app.models.interview_session import InterviewSession
from app.models.evaluation import Evaluation

logger = logging.getLogger(__name__)


class SkillAssessmentTool:
    """Tool to assess user's current skill levels."""
    
    name = "skill_assessment"
    description = (
        "Assess user's current skill levels from resume and interview performance. "
        "Input should be a user_id (integer). "
        "Returns dict with skills, proficiency_scores, and recent_performance."
    )
    
    def __init__(self, db: Session):
        """Initialize with database session"""
        self.db = db
    
    def _run(self, user_id: int) -> Dict[str, Any]:
        """Assess user's skill levels."""
        try:
            # Get latest resume analysis
            resume_analysis = self.db.query(ResumeAnalysis).filter(
                ResumeAnalysis.user_id == user_id,
                ResumeAnalysis.status == 'completed'
            ).order_by(ResumeAnalysis.created_at.desc()).first()
            
            if not resume_analysis:
                return {'error': f'No resume analysis found for user {user_id}'}
            
            # Extract skills from resume analysis
            analysis_data = resume_analysis.analysis_data or {}
            
            return {
                'technical_skills': analysis_data.get('technical_skills', []),
                'soft_skills': analysis_data.get('soft_skills', []),
                'experience_years': analysis_data.get('experience_years', 0),
                'proficiency_scores': {},
                'recent_performance': []
            }
        except Exception as e:
            logger.error(f"Error in skill assessment: {e}")
            return {'error': str(e)}


class JobMarketTool:
    """Tool to research job market requirements."""
    
    name = "job_market_research"
    description = (
        "Research job market requirements for a target role. "
        "Input should be target_role (string). "
        "Returns dict with required_skills, preferred_skills, and market_trends."
    )
    
    def __init__(self):
        """Initialize job market tool"""
        self.job_requirements = {
            'Software Engineer': {
                'required_skills': ['Python', 'JavaScript', 'Git', 'SQL', 'REST APIs'],
                'preferred_skills': ['React', 'Docker', 'AWS', 'CI/CD', 'Testing'],
                'market_trends': ['Cloud computing', 'Microservices', 'DevOps'],
                'salary_range': '$80k-$150k'
            },
            'Data Scientist': {
                'required_skills': ['Python', 'Statistics', 'Machine Learning', 'SQL', 'Pandas'],
                'preferred_skills': ['TensorFlow', 'PyTorch', 'Big Data', 'Spark', 'R'],
                'market_trends': ['Deep Learning', 'MLOps', 'AutoML'],
                'salary_range': '$90k-$160k'
            },
            'Product Manager': {
                'required_skills': ['Product Strategy', 'User Research', 'Roadmapping', 'Analytics', 'Communication'],
                'preferred_skills': ['SQL', 'A/B Testing', 'Agile', 'Wireframing', 'Stakeholder Management'],
                'market_trends': ['Data-driven decisions', 'AI/ML integration', 'User-centric design'],
                'salary_range': '$100k-$180k'
            },
            'Frontend Developer': {
                'required_skills': ['HTML', 'CSS', 'JavaScript', 'React', 'Responsive Design'],
                'preferred_skills': ['TypeScript', 'Next.js', 'Testing', 'Accessibility', 'Performance'],
                'market_trends': ['Component libraries', 'SSR/SSG', 'Web3'],
                'salary_range': '$70k-$130k'
            },
            'DevOps Engineer': {
                'required_skills': ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'Cloud (AWS/Azure/GCP)'],
                'preferred_skills': ['Terraform', 'Ansible', 'Monitoring', 'Security', 'Scripting'],
                'market_trends': ['GitOps', 'Service Mesh', 'Observability'],
                'salary_range': '$90k-$160k'
            }
        }
    
    def _run(self, target_role: str) -> Dict[str, Any]:
        """Research job market for target role."""
        if target_role in self.job_requirements:
            return self.job_requirements[target_role]
        else:
            return {
                'required_skills': ['Communication', 'Problem Solving', 'Teamwork'],
                'preferred_skills': [],
                'market_trends': [],
                'note': f'Generic requirements for {target_role}'
            }


class LearningResourceTool:
    """Tool to find learning resources."""
    
    name = "learning_resources"
    description = (
        "Find quality learning resources for a skill. "
        "Input should be skill_name (string) and difficulty_level (beginner/intermediate/advanced). "
        "Returns dict with courses, tutorials, books, and practice_sites."
    )
    
    def __init__(self):
        """Initialize learning resource tool"""
        self.resources = {
            'Python': {
                'beginner': {
                    'courses': ['Python for Everybody (Coursera)', 'Automate the Boring Stuff'],
                    'tutorials': ['Official Python Tutorial', 'Real Python Basics'],
                    'books': ['Python Crash Course', 'Learn Python the Hard Way'],
                    'practice_sites': ['HackerRank Python', 'Codewars']
                },
                'intermediate': {
                    'courses': ['Python Beyond Basics', 'Effective Python'],
                    'tutorials': ['Real Python Intermediate', 'Python Tricks'],
                    'books': ['Fluent Python', 'Python Cookbook'],
                    'practice_sites': ['LeetCode', 'Project Euler']
                },
                'advanced': {
                    'courses': ['Advanced Python Programming', 'Python Design Patterns'],
                    'tutorials': ['Python Internals', 'Async Python'],
                    'books': ['Expert Python Programming', 'High Performance Python'],
                    'practice_sites': ['Codeforces', 'TopCoder']
                }
            },
            'JavaScript': {
                'beginner': {
                    'courses': ['JavaScript Basics (freeCodeCamp)', 'JavaScript30'],
                    'tutorials': ['MDN JavaScript Guide', 'JavaScript.info'],
                    'books': ['Eloquent JavaScript', 'You Don\'t Know JS'],
                    'practice_sites': ['Codewars', 'Exercism']
                },
                'intermediate': {
                    'courses': ['JavaScript: Understanding the Weird Parts', 'Modern JavaScript'],
                    'tutorials': ['ES6+ Features', 'Async JavaScript'],
                    'books': ['JavaScript: The Good Parts', 'Secrets of the JavaScript Ninja'],
                    'practice_sites': ['LeetCode', 'HackerRank']
                },
                'advanced': {
                    'courses': ['Advanced JavaScript Concepts', 'JavaScript Patterns'],
                    'tutorials': ['V8 Internals', 'Performance Optimization'],
                    'books': ['High Performance JavaScript', 'JavaScript Allongé'],
                    'practice_sites': ['Codeforces', 'Project Euler']
                }
            },
            'React': {
                'beginner': {
                    'courses': ['React Basics (Scrimba)', 'React for Beginners'],
                    'tutorials': ['Official React Tutorial', 'React Docs'],
                    'books': ['Learning React', 'React Up & Running'],
                    'practice_sites': ['Frontend Mentor', 'Codepen Challenges']
                },
                'intermediate': {
                    'courses': ['Advanced React Patterns', 'React Performance'],
                    'tutorials': ['React Hooks Deep Dive', 'State Management'],
                    'books': ['Fullstack React', 'React Design Patterns'],
                    'practice_sites': ['Frontend Mentor Pro', 'DevChallenges']
                },
                'advanced': {
                    'courses': ['React Internals', 'Building React from Scratch'],
                    'tutorials': ['Fiber Architecture', 'Custom Hooks'],
                    'books': ['Advanced React Patterns', 'React Performance'],
                    'practice_sites': ['Open Source Contributions', 'Build Your Own Framework']
                }
            },
            'Machine Learning': {
                'beginner': {
                    'courses': ['ML by Andrew Ng (Coursera)', 'Fast.ai Practical ML'],
                    'tutorials': ['Scikit-learn Tutorials', 'Kaggle Learn'],
                    'books': ['Hands-On Machine Learning', 'Introduction to ML with Python'],
                    'practice_sites': ['Kaggle Competitions', 'Google Colab']
                },
                'intermediate': {
                    'courses': ['Deep Learning Specialization', 'ML Engineering'],
                    'tutorials': ['TensorFlow Tutorials', 'PyTorch Tutorials'],
                    'books': ['Deep Learning', 'Pattern Recognition and ML'],
                    'practice_sites': ['Kaggle Expert', 'DrivenData']
                },
                'advanced': {
                    'courses': ['Advanced Deep Learning', 'ML Research Papers'],
                    'tutorials': ['Implementing Papers', 'Custom Architectures'],
                    'books': ['Deep Learning Book', 'Probabilistic ML'],
                    'practice_sites': ['Research Competitions', 'arXiv Implementation']
                }
            },
            'SQL': {
                'beginner': {
                    'courses': ['SQL for Data Science', 'SQL Basics'],
                    'tutorials': ['W3Schools SQL', 'SQLBolt'],
                    'books': ['Learning SQL', 'SQL in 10 Minutes'],
                    'practice_sites': ['HackerRank SQL', 'LeetCode Database']
                },
                'intermediate': {
                    'courses': ['Advanced SQL', 'SQL Performance Tuning'],
                    'tutorials': ['Window Functions', 'Query Optimization'],
                    'books': ['SQL Performance Explained', 'SQL Antipatterns'],
                    'practice_sites': ['Mode Analytics', 'DataLemur']
                },
                'advanced': {
                    'courses': ['Database Internals', 'Query Optimization'],
                    'tutorials': ['Execution Plans', 'Index Strategies'],
                    'books': ['Database Internals', 'High Performance MySQL'],
                    'practice_sites': ['StrataScratch', 'Advanced SQL Puzzles']
                }
            }
        }
    
    def _run(self, skill_name: str, difficulty_level: str = 'beginner') -> Dict[str, Any]:
        """Find learning resources for a skill."""
        if skill_name in self.resources:
            level_resources = self.resources[skill_name].get(difficulty_level, self.resources[skill_name]['beginner'])
            # Combine all resources into a list for test compatibility
            resources_list = []
            resources_list.extend(level_resources.get('courses', []))
            resources_list.extend(level_resources.get('tutorials', []))
            resources_list.extend(level_resources.get('books', []))
            resources_list.extend(level_resources.get('practice_sites', []))
            
            return {
                'skill': skill_name,
                'difficulty': difficulty_level,
                'resources': resources_list,
                **level_resources
            }
        else:
            generic_resources = [
                'Search on Coursera, Udemy, or edX',
                'Search on YouTube or Medium',
                'Search on Amazon or O\'Reilly',
                'Search for practice platforms'
            ]
            return {
                'skill': skill_name,
                'difficulty': difficulty_level,
                'resources': generic_resources,
                'courses': ['Search on Coursera, Udemy, or edX'],
                'tutorials': ['Search on YouTube or Medium'],
                'books': ['Search on Amazon or O\'Reilly'],
                'practice_sites': ['Search for practice platforms']
            }


class ProgressTrackerTool:
    """Tool to track learning progress."""
    
    name = "progress_tracker"
    description = (
        "Track user's learning progress from interview history. "
        "Input should be user_id (integer). "
        "Returns dict with progress_metrics, improvement_areas, and consistency."
    )
    
    def __init__(self, db: Session):
        """Initialize with database session"""
        self.db = db
    
    def _run(self, user_id: int, skill_name: str = None) -> Dict[str, Any]:
        """Track learning progress."""
        try:
            # Get interview sessions
            sessions = self.db.query(InterviewSession).filter(
                InterviewSession.user_id == user_id,
                InterviewSession.status == 'completed'
            ).order_by(InterviewSession.created_at.desc()).limit(20).all()
            
            if not sessions:
                return {
                    'practice_sessions': 0,
                    'sessions': 0,
                    'average_score': 0,
                    'score': 0,
                    'progress_metrics': {},
                    'improvement_areas': [],
                    'consistency': 'No data'
                }
            
            # Calculate metrics
            total_sessions = len(sessions)
            avg_score = sum(s.average_score or 0 for s in sessions) / total_sessions if total_sessions > 0 else 0
            
            return {
                'practice_sessions': total_sessions,
                'sessions': total_sessions,
                'average_score': round(avg_score, 2),
                'score': round(avg_score, 2),
                'progress_metrics': {
                    'sessions_completed': total_sessions,
                    'average_performance': avg_score
                },
                'improvement_areas': [],
                'consistency': 'Regular' if total_sessions >= 5 else 'Needs improvement',
                'skill_name': skill_name
            }
        except Exception as e:
            logger.error(f"Error tracking progress: {e}")
            return {'error': str(e)}


class SchedulerTool:
    """Tool to create study schedules."""
    
    name = "scheduler"
    description = (
        "Create a realistic study schedule. "
        "Input should be tasks (list), duration_days (int), and hours_per_week (int). "
        "Returns dict with daily_schedule and weekly_milestones."
    )
    
    def __init__(self):
        """Initialize scheduler tool"""
        pass
    
    def _run(self, tasks: List[Dict[str, Any]], available_hours_per_week: int, duration_days: int) -> Dict[str, Any]:
        """Create study schedule."""
        try:
            total_hours = (duration_days / 7) * available_hours_per_week
            hours_per_task = total_hours / len(tasks) if tasks else 0
            
            daily_schedule = []
            schedule = []
            weekly_milestones = []
            
            # Create daily schedule
            days_per_week = min(5, available_hours_per_week // 2)  # Study 5 days max
            hours_per_day = available_hours_per_week / days_per_week if days_per_week > 0 else 0
            
            for day in range(1, duration_days + 1):
                if day % 7 in range(1, days_per_week + 1):  # Study days
                    task_idx = (day // 7) % len(tasks) if tasks else 0
                    task_info = tasks[task_idx] if tasks else {'skill': 'Study', 'duration_minutes': 60}
                    daily_schedule.append({
                        'day': day,
                        'task': task_info.get('skill', 'Study'),
                        'hours': round(hours_per_day, 1)
                    })
            
            # Create weekly milestones
            weeks = duration_days // 7
            for week in range(1, weeks + 1):
                task_idx = (week - 1) % len(tasks) if tasks else 0
                task_info = tasks[task_idx] if tasks else {'skill': 'Study'}
                weekly_milestones.append({
                    'week': week,
                    'milestone': f'Complete {task_info.get("skill", "goals")}',
                    'hours_allocated': round(available_hours_per_week, 1)
                })
            
            return {
                'daily_schedule': daily_schedule,
                'schedule': daily_schedule,  # Alias for compatibility
                'weekly_milestones': weekly_milestones,
                'total_hours': round(total_hours, 1),
                'hours_per_task': round(hours_per_task, 1)
            }
        except Exception as e:
            logger.error(f"Error creating schedule: {e}")
            return {'error': str(e)}
