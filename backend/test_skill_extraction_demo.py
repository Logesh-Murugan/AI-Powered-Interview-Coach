"""
Demo script to test skill extraction functionality
"""
from app.utils.skill_extraction import extract_and_categorize_skills, get_skill_statistics

# Sample resume text
resume_text = """
JOHN DOE
Senior Full-Stack Developer
Email: john.doe@example.com | Phone: (555) 123-4567

PROFESSIONAL SUMMARY
Experienced software engineer with 7 years of expertise in building scalable web applications.
Strong background in Python, JavaScript, and cloud technologies. Proven track record of
delivering high-quality solutions and leading development teams.

TECHNICAL SKILLS
Programming Languages: Python, JavaScript, TypeScript, Java, SQL
Web Frameworks: React, Django, FastAPI, Node.js, Express.js
Databases: PostgreSQL, MongoDB, Redis, MySQL
Cloud & DevOps: AWS, Docker, Kubernetes, CI/CD, Jenkins, Terraform
Tools & Technologies: Git, GitHub, GitLab, VS Code, Postman
Mobile: React Native, Flutter

PROFESSIONAL EXPERIENCE

Senior Full-Stack Developer | Tech Corp | 2020 - Present
- Developed microservices architecture using Python and FastAPI
- Built responsive React frontend applications with TypeScript
- Implemented CI/CD pipelines with Jenkins and Docker
- Managed PostgreSQL and MongoDB databases
- Led team of 5 developers using Agile methodologies
- Improved application performance by 40%

Full-Stack Developer | StartupXYZ | 2017 - 2020
- Created RESTful APIs with Django and Django REST Framework
- Developed single-page applications with React and Redux
- Deployed applications on AWS using EC2, S3, and RDS
- Implemented authentication with JWT and OAuth2
- Collaborated with cross-functional teams

EDUCATION
Bachelor of Science in Computer Science
University of Technology | 2013 - 2017

SOFT SKILLS
- Strong communication and presentation skills
- Excellent problem-solving abilities
- Team leadership and mentoring
- Agile and Scrum methodologies
- Time management and organization

LANGUAGES
- English (Native)
- Spanish (Intermediate)
- French (Basic)
"""

print("=" * 80)
print("SKILL EXTRACTION DEMO")
print("=" * 80)
print()

print("Extracting skills from resume...")
print()

# Extract skills
detailed_skills, categorized_skills = extract_and_categorize_skills(
    resume_text,
    confidence_threshold=0.6
)

# Display categorized skills
print("CATEGORIZED SKILLS:")
print("-" * 80)
for category, skills in categorized_skills.items():
    print(f"\n{category.upper().replace('_', ' ')}:")
    for skill in skills:
        print(f"  • {skill}")

# Display statistics
print()
print("=" * 80)
print("STATISTICS:")
print("-" * 80)
stats = get_skill_statistics(categorized_skills)
for key, value in stats.items():
    print(f"{key.replace('_', ' ').title()}: {value}")

# Display detailed skills with confidence scores
print()
print("=" * 80)
print("DETAILED SKILLS (with confidence scores):")
print("-" * 80)
for category, skills in detailed_skills.items():
    print(f"\n{category.upper().replace('_', ' ')}:")
    for skill_info in skills[:5]:  # Show top 5 per category
        print(f"  • {skill_info['skill']} (confidence: {skill_info['confidence']})")
    if len(skills) > 5:
        print(f"  ... and {len(skills) - 5} more")

print()
print("=" * 80)
print("DEMO COMPLETE!")
print("=" * 80)
