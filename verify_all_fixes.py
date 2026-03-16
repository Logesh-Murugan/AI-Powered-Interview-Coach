"""
Comprehensive AI Agent Fix Verification Script

This script verifies that all critical fixes have been applied correctly:
1. Study Plan Agent - Tools initialization
2. Study Plan Validation - Schema alignment
3. Company Coaching Tools - JSON string returns
4. Company Coaching Agent - Error recovery
5. Base Agent - Improved ReAct prompt

Run with: python verify_all_fixes.py
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_fix_1_study_plan_tools():
    """FIX 1: Verify Study Plan Agent has proper tools initialization"""
    print("\n" + "="*60)
    print("FIX 1: Testing Study Plan Agent Tools Initialization")
    print("="*60)
    
    try:
        from app.services.agents.study_plan_agent_service import StudyPlanAgentService
        from unittest.mock import Mock
        
        # Create mock db
        mock_db = Mock()
        service = StudyPlanAgentService(mock_db)
        
        # Initialize agent
        agent = service._initialize_agent()
        
        # Verify agent has tools
        assert agent is not None, "Agent should be initialized"
        assert len(agent.tools) == 5, f"Agent should have 5 tools, got {len(agent.tools)}"
        
        # Verify tool names
        tool_names = [tool.name for tool in agent.tools]
        expected_tools = ['skill_assessment', 'job_market_research', 'learning_resources', 'progress_tracker', 'scheduler']
        for tool in expected_tools:
            assert tool in tool_names, f"Missing tool: {tool}"
        
        # Verify system message has correct JSON schema
        assert 'resource_links' in agent.system_message, "System message should mention resource_links"
        assert 'time_estimates' in agent.system_message, "System message should mention time_estimates"
        
        print("✅ PASS: Study Plan Agent has proper tools initialization")
        return True
        
    except Exception as e:
        print(f"❌ FAIL: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_fix_2_study_plan_validation_schema():
    """FIX 2: Verify Study Plan validation matches agent output schema"""
    print("\n" + "="*60)
    print("FIX 2: Testing Study Plan Validation Schema Alignment")
    print("="*60)
    
    try:
        from app.services.agents.study_plan_agent_service import StudyPlanAgentService
        from unittest.mock import Mock
        
        mock_db = Mock()
        service = StudyPlanAgentService(mock_db)
        
        # Test validation with correct schema
        plan_data = {
            'daily_tasks': [{'day': 1, 'tasks': []}],
            'weekly_milestones': [{'week': 1, 'milestone': 'test'}],
            'resource_links': {'Python': ['https://example.com']},
            'time_estimates': {
                'total_hours': 180,
                'hours_per_week': 15,
                'completion_date': '2026-05-15'
            }
        }
        
        # Should not raise
        service._validate_plan_structure(plan_data)
        
        print("✅ PASS: Study Plan validation schema is correctly aligned")
        return True
        
    except Exception as e:
        print(f"❌ FAIL: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_fix_3_company_coaching_tools_json():
    """FIX 3: Verify Company Coaching Tools return JSON strings"""
    print("\n" + "="*60)
    print("FIX 3: Testing Company Coaching Tools JSON Returns")
    print("="*60)
    
    try:
        import json
        from unittest.mock import Mock
        from app.services.agents.tools.company_coaching_tools import (
            CompanyResearchTool,
            InterviewPatternTool,
            STARMethodTool,
            ConfidenceTool
        )
        
        # Test CompanyResearchTool
        tool = CompanyResearchTool()
        result = tool._run('Google')
        assert isinstance(result, str), f"CompanyResearchTool should return string, got {type(result)}"
        data = json.loads(result)
        assert 'culture' in data, "Result should have culture field"
        print("  ✅ CompanyResearchTool returns valid JSON")
        
        # Test InterviewPatternTool
        tool = InterviewPatternTool()
        result = tool._run('Amazon')
        assert isinstance(result, str), f"InterviewPatternTool should return string, got {type(result)}"
        data = json.loads(result)
        assert 'common_categories' in data, "Result should have common_categories field"
        print("  ✅ InterviewPatternTool returns valid JSON")
        
        # Test STARMethodTool
        mock_db = Mock()
        mock_db.query.return_value.filter.return_value.first.return_value = None
        tool = STARMethodTool(db=mock_db)
        result = tool._run(1)
        assert isinstance(result, str), f"STARMethodTool should return string, got {type(result)}"
        data = json.loads(result)
        assert isinstance(data, list), "Result should be a list"
        print("  ✅ STARMethodTool returns valid JSON")
        
        # Test ConfidenceTool
        tool = ConfidenceTool()
        result = tool._run('Microsoft', 'Engineer')
        assert isinstance(result, str), f"ConfidenceTool should return string, got {type(result)}"
        data = json.loads(result)
        assert 'confidence_tips' in data, "Result should have confidence_tips field"
        assert 'pre_interview_checklist' in data, "Result should have pre_interview_checklist field"
        print("  ✅ ConfidenceTool returns valid JSON")
        
        print("✅ PASS: All Company Coaching Tools return valid JSON strings")
        return True
        
    except Exception as e:
        print(f"❌ FAIL: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_fix_4_company_coaching_error_recovery():
    """FIX 4: Verify Company Coaching Agent has error recovery"""
    print("\n" + "="*60)
    print("FIX 4: Testing Company Coaching Agent Error Recovery")
    print("="*60)
    
    try:
        from app.services.agents.company_coaching_agent_service import CompanyCoachingAgentService
        from unittest.mock import Mock
        
        mock_db = Mock()
        service = CompanyCoachingAgentService(mock_db)
        
        # Verify the _extract_json_from_result method exists
        assert hasattr(service, '_extract_json_from_result'), "Service should have _extract_json_from_result method"
        
        # Test JSON extraction from error message
        test_result = {
            'status': 'error',
            'error': "Missing 'Action:' after 'Thought:{\"company_overview\": {}}",
            'output': None,
            'reasoning_steps': []
        }
        
        extracted = service._extract_json_from_result(test_result)
        assert extracted is not None, "Should extract JSON from error message"
        assert 'company_overview' in extracted, "Extracted JSON should contain company_overview"
        
        print("✅ PASS: Company Coaching Agent has error recovery")
        return True
        
    except Exception as e:
        print(f"❌ FAIL: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_fix_5_base_agent_prompt():
    """FIX 5: Verify Base Agent has improved ReAct prompt"""
    print("\n" + "="*60)
    print("FIX 5: Testing Base Agent Improved ReAct Prompt")
    print("="*60)
    
    try:
        from app.services.agents.base_agent import BaseAgent
        from langchain_core.tools import Tool
        
        # Create a simple test agent
        def dummy_tool():
            return "test"
        
        tools = [Tool(name="test_tool", func=dummy_tool, description="Test tool")]
        agent = BaseAgent(tools=tools, system_message="Test system message")
        
        # Get the prompt template
        prompt_template = agent._get_prompt_template()
        prompt_text = prompt_template.template
        
        # Verify critical format rules are in the prompt
        assert "CRITICAL FORMAT RULES" in prompt_text, "Prompt should have CRITICAL FORMAT RULES"
        assert "NEVER put JSON directly after \"Thought:\"" in prompt_text, "Prompt should warn about JSON in Thought"
        assert "NEVER skip the Action line" in prompt_text, "Prompt should warn about skipping Action"
        assert "NEVER put JSON in the Thought field" in prompt_text, "Prompt should warn about JSON in Thought field"
        
        print("✅ PASS: Base Agent has improved ReAct prompt with format rules")
        return True
        
    except Exception as e:
        print(f"❌ FAIL: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run all fix verification tests"""
    print("\n" + "="*60)
    print("AI AGENT FIX VERIFICATION SUITE")
    print("="*60)
    
    results = []
    
    results.append(("FIX 1: Study Plan Tools", test_fix_1_study_plan_tools()))
    results.append(("FIX 2: Study Plan Validation", test_fix_2_study_plan_validation_schema()))
    results.append(("FIX 3: Company Coaching Tools JSON", test_fix_3_company_coaching_tools_json()))
    results.append(("FIX 4: Company Coaching Error Recovery", test_fix_4_company_coaching_error_recovery()))
    results.append(("FIX 5: Base Agent Prompt", test_fix_5_base_agent_prompt()))
    
    # Print summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL FIXES VERIFIED SUCCESSFULLY!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please review the fixes.")
        return 1


if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)
