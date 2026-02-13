"""
Setup script for InterviewMaster AI Backend
"""
from setuptools import setup, find_packages

setup(
    name="interviewmaster-backend",
    version="1.0.0",
    description="InterviewMaster AI Backend API",
    author="InterviewMaster Team",
    packages=find_packages(),
    python_requires=">=3.11",
    install_requires=[
        "fastapi>=0.109.0",
        "uvicorn[standard]>=0.27.0",
        "sqlalchemy>=2.0.25",
        "pydantic>=2.5.3",
        "pydantic-settings>=2.1.0",
    ],
)
