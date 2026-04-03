"""
Result Pattern for Consistent Error Handling

Provides a type-safe way to handle operations that can succeed or fail
without relying on exceptions for control flow.
"""
from dataclasses import dataclass
from typing import Generic, TypeVar, Optional, Dict, Any

T = TypeVar('T')


@dataclass
class Result(Generic[T]):
    """
    Result type for operations that can succeed or fail.
    
    Usage:
        result = Result.ok(data)
        if result.success:
            print(result.data)
        else:
            print(result.error)
    """
    success: bool
    data: Optional[T] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

    @staticmethod
    def ok(data: T, metadata: Optional[Dict[str, Any]] = None) -> "Result[T]":
        """Create successful result"""
        return Result(success=True, data=data, metadata=metadata)

    @staticmethod
    def err(error: str, metadata: Optional[Dict[str, Any]] = None) -> "Result[T]":
        """Create error result"""
        return Result(success=False, error=error, metadata=metadata)

    def unwrap(self) -> T:
        """Get data or raise exception"""
        if not self.success:
            raise ValueError(f"Cannot unwrap error result: {self.error}")
        return self.data

    def unwrap_or(self, default: T) -> T:
        """Get data or default value"""
        return self.data if self.success else default

    def map(self, func) -> "Result":
        """Transform data if successful"""
        if self.success:
            try:
                return Result.ok(func(self.data))
            except Exception as e:
                return Result.err(str(e))
        return Result(success=False, error=self.error, metadata=self.metadata)
