"""
LangChain Agent Services

This package contains the LangChain agent infrastructure for autonomous AI agents.

Agents:
- Resume Intelligence Agent: Deep resume analysis with skill gap identification
- Study Plan Agent: Personalized learning roadmap generation
- Company Coaching Agent: Company-specific interview preparation

Requirements: 27.1-27.13, 28.1-28.11, 29.1-29.11
"""

from app.services.agents.base_agent import BaseAgent
from app.services.agents.agent_executor import AgentExecutor

__all__ = ['BaseAgent', 'AgentExecutor']


