"""
Custom exception classes for ESG processing errors.
Provides specific error types for different processing failures.
"""

class ESGProcessingError(Exception):
    """Base exception for ESG processing errors."""
    pass

class ModelLoadError(ESGProcessingError):
    """Error loading the fine-tuned model."""
    def __init__(self, message="Failed to load the fine-tuned model"):
        self.message = message
        super().__init__(self.message)

class PDFExtractionError(ESGProcessingError):
    """Error extracting text from PDF."""
    def __init__(self, message="Failed to extract text from PDF"):
        self.message = message
        super().__init__(self.message)

class VerificationError(ESGProcessingError):
    """Error during claim verification."""
    def __init__(self, message="Failed to verify claims against ESG data"):
        self.message = message
        super().__init__(self.message)

class ConfigurationError(ESGProcessingError):
    """Error in system configuration."""
    def __init__(self, message="Configuration error"):
        self.message = message
        super().__init__(self.message)

class DataValidationError(ESGProcessingError):
    """Error in data validation."""
    def __init__(self, message="Data validation failed"):
        self.message = message
        super().__init__(self.message)