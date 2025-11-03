"""
PDF text extraction module for ESG Claim Verification system.
Extracts and cleans text from PDF documents, splits into sentences.
"""

import re
import logging
from pathlib import Path
from typing import List, Optional
import PyPDF2
import pdfplumber
import nltk
from nltk.tokenize import sent_tokenize

try:
    from .exceptions import PDFExtractionError
except ImportError:
    from exceptions import PDFExtractionError

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

logger = logging.getLogger(__name__)

class PDFExtractor:
    """Handles PDF text extraction and preprocessing."""
    
    def __init__(self):
        """Initialize the PDF extractor."""
        pass
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """
        Extract raw text from PDF document using multiple methods.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            Extracted text as string
            
        Raises:
            PDFExtractionError: If text extraction fails
        """
        pdf_path = Path(pdf_path)
        
        if not pdf_path.exists():
            raise PDFExtractionError(f"PDF file not found: {pdf_path}")
        
        # Try pdfplumber first (better for complex layouts)
        try:
            text = self._extract_with_pdfplumber(pdf_path)
            if text.strip():
                logger.info(f"Successfully extracted text using pdfplumber: {len(text)} characters")
                return text
        except Exception as e:
            logger.warning(f"pdfplumber extraction failed: {e}")
        
        # Fallback to PyPDF2
        try:
            text = self._extract_with_pypdf2(pdf_path)
            if text.strip():
                logger.info(f"Successfully extracted text using PyPDF2: {len(text)} characters")
                return text
        except Exception as e:
            logger.error(f"PyPDF2 extraction failed: {e}")
            raise PDFExtractionError(f"Failed to extract text from PDF: {pdf_path}")
        
        raise PDFExtractionError(f"No text could be extracted from PDF: {pdf_path}")
    
    def _extract_with_pdfplumber(self, pdf_path: Path) -> str:
        """Extract text using pdfplumber."""
        text_parts = []
        
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        
        return "\n".join(text_parts)
    
    def _extract_with_pypdf2(self, pdf_path: Path) -> str:
        """Extract text using PyPDF2."""
        text_parts = []
        
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        
        return "\n".join(text_parts)
    
    def clean_text(self, text: str) -> str:
        """
        Clean extracted text by removing unwanted characters and formatting.
        
        Args:
            text: Raw extracted text
            
        Returns:
            Cleaned text
        """
        if not text:
            return ""
        
        # Remove excessive line breaks and replace with single spaces
        text = re.sub(r'\n+', ' ', text)
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep punctuation needed for sentences
        text = re.sub(r'[^\w\s\.\,\!\?\;\:\-\%\(\)\[\]\"\'\/]', ' ', text)
        
        # Clean up multiple spaces again after character removal
        text = re.sub(r'\s+', ' ', text)
        
        # Remove leading/trailing whitespace
        text = text.strip()
        
        return text
    
    def split_into_sentences(self, text: str) -> List[str]:
        """
        Split cleaned text into individual sentences.
        
        Args:
            text: Cleaned text
            
        Returns:
            List of sentences
        """
        if not text:
            return []
        
        try:
            # Use NLTK's sentence tokenizer
            sentences = sent_tokenize(text)
            
            # Filter out very short sentences (likely fragments)
            filtered_sentences = []
            for sentence in sentences:
                sentence = sentence.strip()
                if len(sentence) > 10 and len(sentence.split()) > 3:
                    filtered_sentences.append(sentence)
            
            logger.info(f"Split text into {len(filtered_sentences)} sentences")
            return filtered_sentences
            
        except Exception as e:
            logger.error(f"Sentence splitting failed: {e}")
            # Fallback: simple sentence splitting
            sentences = re.split(r'[.!?]+', text)
            return [s.strip() for s in sentences if len(s.strip()) > 10]
    
    def process_pdf(self, pdf_path: str) -> List[str]:
        """
        Complete PDF processing pipeline: extract, clean, and split into sentences.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            List of cleaned sentences
            
        Raises:
            PDFExtractionError: If processing fails
        """
        try:
            # Extract raw text
            raw_text = self.extract_text_from_pdf(pdf_path)
            
            # Clean the text
            cleaned_text = self.clean_text(raw_text)
            
            # Split into sentences
            sentences = self.split_into_sentences(cleaned_text)
            
            logger.info(f"Successfully processed PDF: {len(sentences)} sentences extracted")
            return sentences
            
        except Exception as e:
            logger.error(f"PDF processing failed for {pdf_path}: {e}")
            raise PDFExtractionError(f"Failed to process PDF: {e}")

# Convenience function for direct use
def extract_sentences_from_pdf(pdf_path: str) -> List[str]:
    """
    Extract sentences from PDF file.
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        List of sentences
    """
    extractor = PDFExtractor()
    return extractor.process_pdf(pdf_path)