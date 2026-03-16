"""
Structured LLM Service using LangChain PydanticOutputParser.

Provides guaranteed structured output from LLMs using Pydantic schemas.
"""
import json
import logging
from typing import Type, TypeVar, Optional, Dict, Any
from pydantic import BaseModel, ValidationError
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_core.language_models import BaseLLM

from app.services.llm.orchestrator import LLMOrchestrator
from app.services.agents.utils.json_utils import extract_and_repair_json, ensure_coaching_data_complete

logger = logging.getLogger(__name__)

T = TypeVar('T', bound=BaseModel)


class StructuredLLMService:
    """
    Service for generating structured LLM outputs using Pydantic schemas.
    
    Uses LangChain's PydanticOutputParser to force the LLM to return
    valid JSON that matches the schema. Includes fallback mechanisms
    for handling malformed outputs.
    """
    
    def __init__(self):
        """Initialize the structured LLM service."""
        self.llm_orchestrator = LLMOrchestrator()
    
    async def generate_structured_output(
        self,
        prompt_template: str,
        output_schema: Type[T],
        input_variables: Dict[str, Any],
        max_retries: int = 3
    ) -> T:
        """
        Generate structured output from LLM matching the Pydantic schema.
        
        Args:
            prompt_template: The prompt template with {format_instructions} placeholder
            output_schema: Pydantic model class to validate against
            input_variables: Variables to fill in the prompt template
            max_retries: Maximum number of retries on validation failure
            
        Returns:
            Validated Pydantic model instance
            
        Raises:
            ValueError: If structured output cannot be generated after max_retries
        """
        # Create Pydantic output parser
        parser = PydanticOutputParser(pydantic_object=output_schema)
        
        # Add format instructions to input variables
        format_instructions = parser.get_format_instructions()
        full_input_vars = {
            **input_variables,
            "format_instructions": format_instructions
        }
        
        # Create prompt template
        prompt = PromptTemplate(
            template=prompt_template,
            input_variables=list(full_input_vars.keys())
        )
        
        last_error = None
        
        for attempt in range(max_retries):
            try:
                logger.info(f"=== Structured LLM Call Attempt {attempt + 1}/{max_retries} ===")
                
                # Format the prompt
                formatted_prompt = prompt.format(**full_input_vars)
                logger.info(f"Prompt length: {len(formatted_prompt)} chars")
                
                # Call LLM
                response = await self._call_llm(formatted_prompt)
                logger.info(f"LLM response length: {len(response)} chars")
                
                # Try to parse with Pydantic parser
                try:
                    parsed_output = parser.parse(response)
                    logger.info(f"✅ Pydantic parsing successful on attempt {attempt + 1}")
                    return parsed_output
                except Exception as parse_error:
                    logger.warning(f"⚠️ Pydantic parsing failed: {parse_error}")
                    
                    # Fallback: Try to extract and repair JSON
                    logger.info("Attempting JSON extraction and repair...")
                    extracted_data = extract_and_repair_json(response)
                    
                    if extracted_data:
                        # Apply auto-fill for minimum items
                        extracted_data = ensure_coaching_data_complete(extracted_data)
                        
                        # Try to validate with Pydantic
                        try:
                            validated = output_schema(**extracted_data)
                            logger.info(f"✅ Fallback validation successful on attempt {attempt + 1}")
                            return validated
                        except ValidationError as ve:
                            logger.warning(f"⚠️ Fallback validation failed: {ve}")
                            last_error = ve
                            
                            # On final retry, try to fix specific issues
                            if attempt == max_retries - 1:
                                logger.info("Final attempt: Applying aggressive fixes...")
                                fixed_data = self._aggressive_fix(extracted_data, output_schema)
                                try:
                                    return output_schema(**fixed_data)
                                except Exception as e:
                                    last_error = e
                    else:
                        logger.warning("⚠️ JSON extraction returned None")
                        last_error = parse_error
                        
            except Exception as e:
                logger.error(f"❌ Error on attempt {attempt + 1}: {e}")
                last_error = e
                
                if attempt < max_retries - 1:
                    logger.info(f"Retrying... ({attempt + 2}/{max_retries})")
        
        # All retries failed
        raise ValueError(f"Failed to generate valid structured output after {max_retries} attempts: {last_error}")
    
    async def _call_llm(self, prompt: str) -> str:
        """
        Call the LLM with the given prompt.
        
        Args:
            prompt: The formatted prompt string
            
        Returns:
            LLM response text
        """
        # Use the orchestrator to call the LLM
        response = await self.llm_orchestrator.call_llm(prompt)
        return response
    
    def _aggressive_fix(self, data: Dict[str, Any], schema: Type[T]) -> Dict[str, Any]:
        """
        Apply aggressive fixes to data to make it match the schema.
        This is a last resort when normal parsing fails.
        """
        fixed = data.copy()
        
        # Get schema fields
        schema_fields = schema.__fields__
        
        for field_name, field_info in schema_fields.items():
            if field_name not in fixed:
                # Add missing fields with defaults
                if field_info.outer_type_ == str:
                    fixed[field_name] = "Not specified"
                elif hasattr(field_info.outer_type_, '__origin__') and field_info.outer_type_.__origin__ == list:
                    fixed[field_name] = []
                elif hasattr(field_info.outer_type_, '__origin__') and field_info.outer_type_.__origin__ == dict:
                    fixed[field_name] = {}
                else:
                    fixed[field_name] = None
        
        return fixed


# Singleton instance
_structured_llm_service: Optional[StructuredLLMService] = None


def get_structured_llm_service() -> StructuredLLMService:
    """Get or create the singleton StructuredLLMService instance."""
    global _structured_llm_service
    if _structured_llm_service is None:
        _structured_llm_service = StructuredLLMService()
    return _structured_llm_service
