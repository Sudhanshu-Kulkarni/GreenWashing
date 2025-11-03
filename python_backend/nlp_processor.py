"""
Main NLP Processing Orchestrator for ESG Claim Verification System.

This module integrates PDF extraction, claim classification, and ESG verification
into a complete processing pipeline. It provides the main entry point for processing
PDF documents and generating verification results.
"""

import json
import logging
import time
from pathlib import Path
from typing import Dict, List, Optional, Callable, Any
from datetime import datetime

try:
    from .pdf_extractor import PDFExtractor
    from .claim_classifier import ClaimClassifier
    from .esg_verifier import ESGVerifier
    from .results_formatter import ResultsFormatter
    from .config import MODEL_PATH, ESG_CSV_PATH, CONFIDENCE_THRESHOLD
    from .exceptions import ESGProcessingError, PDFExtractionError, ModelLoadError, VerificationError
except ImportError:
    # Fallback for direct execution
    from pdf_extractor import PDFExtractor
    from claim_classifier import ClaimClassifier
    from esg_verifier import ESGVerifier
    from results_formatter import ResultsFormatter
    from config import MODEL_PATH, ESG_CSV_PATH, CONFIDENCE_THRESHOLD
    from exceptions import ESGProcessingError, PDFExtractionError, ModelLoadError, VerificationError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ProcessingStatus:
    """Track processing status and progress"""
    
    def __init__(self):
        self.current_step = ""
        self.progress = 0.0
        self.total_steps = 6
        self.step_progress = 0.0
        self.start_time = None
        self.errors = []
        self.warnings = []
    
    def start_processing(self):
        """Mark the start of processing"""
        self.start_time = time.time()
        self.progress = 0.0
        self.current_step = "Initializing"
        logger.info("Processing started")
    
    def update_step(self, step_name: str, step_number: int):
        """Update current processing step"""
        self.current_step = step_name
        self.progress = (step_number - 1) / self.total_steps
        self.step_progress = 0.0
        logger.info(f"Step {step_number}/{self.total_steps}: {step_name}")
    
    def update_step_progress(self, progress: float):
        """Update progress within current step"""
        self.step_progress = min(max(progress, 0.0), 1.0)
        total_progress = (self.progress + (self.step_progress / self.total_steps))
        logger.debug(f"Step progress: {self.step_progress:.2%}, Total: {total_progress:.2%}")
    
    def add_error(self, error: str):
        """Add an error message"""
        self.errors.append(error)
        logger.error(error)
    
    def add_warning(self, warning: str):
        """Add a warning message"""
        self.warnings.append(warning)
        logger.warning(warning)
    
    def complete_processing(self):
        """Mark processing as complete"""
        self.progress = 1.0
        self.current_step = "Complete"
        if self.start_time:
            duration = time.time() - self.start_time
            logger.info(f"Processing completed in {duration:.2f} seconds")
    
    def get_status_dict(self) -> Dict[str, Any]:
        """Get status as dictionary for JSON serialization"""
        duration = time.time() - self.start_time if self.start_time else 0
        return {
            'current_step': self.current_step,
            'progress': self.progress,
            'step_progress': self.step_progress,
            'duration': duration,
            'errors': self.errors,
            'warnings': self.warnings
        }


class NLPProcessor:
    """
    Main orchestrator for the ESG claim verification pipeline.
    
    Integrates PDF extraction, claim classification, and ESG verification
    into a complete processing workflow.
    """
    
    def __init__(self, 
                 model_path: Optional[str] = None,
                 csv_path: Optional[str] = None,
                 confidence_threshold: Optional[float] = None):
        """
        Initialize the NLP processor with required components.
        
        Args:
            model_path: Path to the fine-tuned model (optional, uses config default)
            csv_path: Path to ESG CSV file (optional, uses config default)
            confidence_threshold: Confidence threshold for claim classification
        """
        self.model_path = Path(model_path) if model_path else MODEL_PATH
        self.csv_path = Path(csv_path) if csv_path else ESG_CSV_PATH
        self.confidence_threshold = confidence_threshold or CONFIDENCE_THRESHOLD
        
        # Initialize components
        self.pdf_extractor = None
        self.claim_classifier = None
        self.esg_verifier = None
        
        # Processing status
        self.status = ProcessingStatus()
        
        logger.info("NLPProcessor initialized")
    
    def _initialize_components(self):
        """Initialize all processing components"""
        try:
            logger.info("Initializing processing components...")
            
            # Initialize PDF extractor
            self.pdf_extractor = PDFExtractor()
            logger.info("PDF extractor initialized")
            
            # Initialize claim classifier
            self.claim_classifier = ClaimClassifier(self.model_path)
            logger.info("Claim classifier initialized")
            
            # Initialize ESG verifier
            self.esg_verifier = ESGVerifier(str(self.csv_path))
            logger.info("ESG verifier initialized")
            
            logger.info("All components initialized successfully")
            
        except Exception as e:
            error_msg = f"Failed to initialize components: {str(e)}"
            self.status.add_error(error_msg)
            raise ESGProcessingError(error_msg)
    
    def process_pdf_document(self, 
                           pdf_path: str, 
                           company_name: str,
                           progress_callback: Optional[Callable[[Dict], None]] = None) -> Dict[str, Any]:
        """
        Main processing pipeline: extract, classify, and verify claims from PDF.
        
        Args:
            pdf_path: Path to the PDF file to process
            company_name: Company name (extracted from filename or provided)
            progress_callback: Optional callback for progress updates
            
        Returns:
            Dictionary containing processing results and verification status
            
        Raises:
            ESGProcessingError: If processing fails at any stage
        """
        self.status.start_processing()
        
        try:
            # Step 1: Initialize components
            self.status.update_step("Initializing components", 1)
            if progress_callback:
                progress_callback(self.status.get_status_dict())
            
            self._initialize_components()
            self.status.update_step_progress(1.0)
            
            # Step 2: Extract text from PDF
            self.status.update_step("Extracting text from PDF", 2)
            if progress_callback:
                progress_callback(self.status.get_status_dict())
            
            sentences = self._extract_pdf_text(pdf_path)
            self.status.update_step_progress(1.0)
            
            # Step 3: Classify sentences as claims
            self.status.update_step("Classifying claims", 3)
            if progress_callback:
                progress_callback(self.status.get_status_dict())
            
            classification_results = self._classify_claims(sentences, progress_callback)
            self.status.update_step_progress(1.0)
            
            # Step 4: Filter and extract claim data
            self.status.update_step("Processing detected claims", 4)
            if progress_callback:
                progress_callback(self.status.get_status_dict())
            
            claims = self._process_detected_claims(classification_results)
            self.status.update_step_progress(1.0)
            
            # Step 5: Verify claims against ESG data
            self.status.update_step("Verifying claims", 5)
            if progress_callback:
                progress_callback(self.status.get_status_dict())
            
            verified_claims = self._verify_claims(claims, company_name, progress_callback)
            self.status.update_step_progress(1.0)
            
            # Step 6: Format results
            self.status.update_step("Formatting results", 6)
            if progress_callback:
                progress_callback(self.status.get_status_dict())
            
            results = self._format_results(pdf_path, company_name, sentences, verified_claims)
            self.status.update_step_progress(1.0)
            
            # Complete processing
            self.status.complete_processing()
            if progress_callback:
                progress_callback(self.status.get_status_dict())
            
            logger.info(f"Processing completed successfully. Found {len(verified_claims)} claims.")
            return results
            
        except Exception as e:
            error_msg = f"Processing failed: {str(e)}"
            self.status.add_error(error_msg)
            logger.error(error_msg)
            raise ESGProcessingError(error_msg)
    
    def _extract_pdf_text(self, pdf_path: str) -> List[str]:
        """Extract and split text from PDF into sentences"""
        try:
            if not self.pdf_extractor:
                raise PDFExtractionError("PDF extractor not initialized")
            
            sentences = self.pdf_extractor.process_pdf(pdf_path)
            
            if not sentences:
                self.status.add_warning("No sentences extracted from PDF")
                return []
            
            logger.info(f"Extracted {len(sentences)} sentences from PDF")
            return sentences
            
        except Exception as e:
            raise PDFExtractionError(f"PDF text extraction failed: {str(e)}")
    
    def _classify_claims(self, 
                        sentences: List[str], 
                        progress_callback: Optional[Callable[[Dict], None]] = None) -> List[Dict]:
        """Classify sentences as claims or non-claims"""
        try:
            if not self.claim_classifier:
                raise ModelLoadError("Claim classifier not initialized")
            
            if not sentences:
                logger.warning("No sentences to classify")
                return []
            
            # Create progress callback for batch classification
            def classification_progress(progress: float):
                self.status.update_step_progress(progress)
                if progress_callback:
                    progress_callback(self.status.get_status_dict())
            
            # Perform batch classification
            results = self.claim_classifier.batch_classify(sentences, classification_progress)
            
            # Log classification summary
            claims_count = sum(1 for r in results if r['is_claim'])
            logger.info(f"Classification complete: {claims_count}/{len(results)} sentences classified as claims")
            
            return results
            
        except Exception as e:
            raise ModelLoadError(f"Claim classification failed: {str(e)}")
    
    def _process_detected_claims(self, classification_results: List[Dict]) -> List[Dict]:
        """Filter claims and extract structured data"""
        try:
            if not self.claim_classifier:
                raise ModelLoadError("Claim classifier not initialized")
            
            # Filter for claims above confidence threshold
            claims = self.claim_classifier.filter_claims(
                classification_results, 
                self.confidence_threshold
            )
            
            if not claims:
                self.status.add_warning("No claims detected above confidence threshold")
                return []
            
            # Add extracted data to each claim
            processed_claims = []
            for i, claim in enumerate(claims):
                try:
                    # Extract structured data from claim text
                    extracted_data = self.esg_verifier.extract_claim_data(claim['text'])
                    
                    # Add to claim result
                    claim_result = {
                        'id': i + 1,
                        'text': claim['text'],
                        'confidence': claim['confidence'],
                        'extracted_data': {
                            'metric': extracted_data.metric,
                            'value': extracted_data.value,
                            'unit': extracted_data.unit,
                            'year': extracted_data.year,
                            'percentage': extracted_data.percentage
                        }
                    }
                    
                    processed_claims.append(claim_result)
                    
                except Exception as e:
                    self.status.add_warning(f"Failed to extract data from claim {i+1}: {str(e)}")
                    continue
            
            logger.info(f"Processed {len(processed_claims)} claims with extracted data")
            return processed_claims
            
        except Exception as e:
            raise ESGProcessingError(f"Claim processing failed: {str(e)}")
    
    def _verify_claims(self, 
                      claims: List[Dict], 
                      company_name: str,
                      progress_callback: Optional[Callable[[Dict], None]] = None) -> List[Dict]:
        """Verify claims against ESG lookup data"""
        try:
            if not self.esg_verifier:
                raise VerificationError("ESG verifier not initialized")
            
            if not claims:
                logger.warning("No claims to verify")
                return []
            
            verified_claims = []
            total_claims = len(claims)
            
            for i, claim in enumerate(claims):
                try:
                    # Create ExtractedClaimData object
                    try:
                        from .esg_verifier import ExtractedClaimData
                    except ImportError:
                        from esg_verifier import ExtractedClaimData
                    
                    extracted = claim['extracted_data']
                    claim_data = ExtractedClaimData(
                        metric=extracted['metric'],
                        value=extracted['value'],
                        unit=extracted['unit'],
                        year=extracted['year'],
                        percentage=extracted['percentage'],
                        raw_text=claim['text']
                    )
                    
                    # Verify the claim
                    verification_result = self.esg_verifier.verify_claim(claim_data, company_name)
                    
                    # Add verification results to claim
                    verified_claim = {
                        **claim,
                        'verification_status': verification_result.status,
                        'verification_confidence': verification_result.confidence,
                        'match_details': {
                            'csv_match': verification_result.csv_match,
                            'tolerance_check': verification_result.tolerance_check,
                            'reasoning': verification_result.reasoning,
                            'matched_data': verification_result.matched_data
                        }
                    }
                    
                    verified_claims.append(verified_claim)
                    
                    # Update progress
                    progress = (i + 1) / total_claims
                    self.status.update_step_progress(progress)
                    if progress_callback:
                        progress_callback(self.status.get_status_dict())
                    
                except Exception as e:
                    self.status.add_warning(f"Failed to verify claim {claim['id']}: {str(e)}")
                    # Add unverified claim
                    unverified_claim = {
                        **claim,
                        'verification_status': 'unverified',
                        'verification_confidence': 0.0,
                        'match_details': {
                            'csv_match': False,
                            'tolerance_check': False,
                            'reasoning': f"Verification failed: {str(e)}",
                            'matched_data': None
                        }
                    }
                    verified_claims.append(unverified_claim)
                    continue
            
            logger.info(f"Verification complete: {len(verified_claims)} claims processed")
            return verified_claims
            
        except Exception as e:
            raise VerificationError(f"Claim verification failed: {str(e)}")
    
    def _format_results(self, 
                       pdf_path: str, 
                       company_name: str, 
                       sentences: List[str], 
                       verified_claims: List[Dict]) -> Dict[str, Any]:
        """Format final results with comprehensive statistics and details"""
        try:
            # Use the dedicated results formatter
            formatter = ResultsFormatter()
            
            processing_time = time.time() - self.status.start_time if self.status.start_time else 0
            model_info = {
                'model_path': str(self.model_path),
                'csv_path': str(self.csv_path),
                'confidence_threshold': self.confidence_threshold
            }
            
            results = formatter.format_processing_results(
                pdf_path=pdf_path,
                company_name=company_name,
                sentences=sentences,
                verified_claims=verified_claims,
                processing_time=processing_time,
                model_info=model_info,
                processing_status=self.status.get_status_dict()
            )
            
            logger.info("Results formatted successfully using ResultsFormatter")
            return results
            
        except Exception as e:
            raise ESGProcessingError(f"Results formatting failed: {str(e)}")
    
    def get_processing_status(self) -> Dict[str, Any]:
        """Get current processing status"""
        return self.status.get_status_dict()
    
    def save_results_to_file(self, results: Dict[str, Any], output_path: str):
        """Save processing results to JSON file"""
        try:
            formatter = ResultsFormatter()
            formatter.save_results_json(results, output_path)
            
        except Exception as e:
            error_msg = f"Failed to save results: {str(e)}"
            logger.error(error_msg)
            raise ESGProcessingError(error_msg)
    
    def save_results_multiple_formats(self, 
                                    results: Dict[str, Any], 
                                    output_dir: str,
                                    save_csv: bool = True,
                                    save_summary: bool = True) -> Dict[str, str]:
        """
        Save results in multiple formats (JSON, CSV, summary report).
        
        Args:
            results: Processing results dictionary
            output_dir: Output directory for files
            save_csv: Whether to save CSV format
            save_summary: Whether to save text summary
            
        Returns:
            Dictionary with paths to saved files
        """
        try:
            formatter = ResultsFormatter()
            output_path = Path(output_dir)
            output_path.mkdir(parents=True, exist_ok=True)
            
            # Generate base filename
            company_name = results['document_info']['company_name']
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            base_name = f"{company_name.replace(' ', '_')}_{timestamp}"
            
            saved_files = {}
            
            # Save JSON
            json_path = output_path / f"{base_name}_results.json"
            formatter.save_results_json(results, str(json_path))
            saved_files['json'] = str(json_path)
            
            # Save CSV if requested
            if save_csv:
                csv_path = output_path / f"{base_name}_claims.csv"
                formatter.save_results_csv(results, str(csv_path))
                saved_files['csv'] = str(csv_path)
            
            # Save summary report if requested
            if save_summary:
                summary_path = output_path / f"{base_name}_summary.txt"
                summary_report = formatter.generate_summary_report(results)
                with open(summary_path, 'w', encoding='utf-8') as f:
                    f.write(summary_report)
                saved_files['summary'] = str(summary_path)
                logger.info(f"Summary report saved: {summary_path}")
            
            logger.info(f"Results saved in {len(saved_files)} formats to {output_dir}")
            return saved_files
            
        except Exception as e:
            error_msg = f"Failed to save results in multiple formats: {str(e)}"
            logger.error(error_msg)
            raise ESGProcessingError(error_msg)


# Convenience functions for direct use
def process_pdf_document(pdf_path: str, 
                        company_name: str,
                        output_path: Optional[str] = None,
                        progress_callback: Optional[Callable[[Dict], None]] = None) -> Dict[str, Any]:
    """
    Process a PDF document and return verification results.
    
    Args:
        pdf_path: Path to the PDF file
        company_name: Company name for verification
        output_path: Optional path to save results JSON file
        progress_callback: Optional callback for progress updates
        
    Returns:
        Processing results dictionary
    """
    processor = NLPProcessor()
    results = processor.process_pdf_document(pdf_path, company_name, progress_callback)
    
    if output_path:
        processor.save_results_to_file(results, output_path)
    
    return results


def extract_company_name_from_filename(filename: str) -> str:
    """
    Extract company name from PDF filename.
    
    Args:
        filename: PDF filename
        
    Returns:
        Extracted company name
    """
    # Remove file extension
    name = Path(filename).stem
    
    # Clean up separators first
    name = name.replace('_', ' ').replace('-', ' ')
    name = ' '.join(name.split())  # Remove extra spaces
    
    # Common report-related terms to remove (case insensitive)
    terms_to_remove = [
        'sustainability report',
        'annual report', 
        'csr report', 
        'esg report',
        'environmental report',
        'impact report',
        'sustainability',
        'annual',
        'report',
        'csr',
        'esg',
        '2020', '2021', '2022', '2023', '2024', '2025'
    ]
    
    # Split into words for better processing
    words = name.lower().split()
    
    # Remove report-related terms
    filtered_words = []
    for word in words:
        # Skip if word is a report term or year
        if word not in [term.lower() for term in terms_to_remove]:
            # Skip if word is just numbers (years)
            if not word.isdigit():
                filtered_words.append(word)
    
    # If we have filtered words, use them
    if filtered_words:
        result = ' '.join(filtered_words)
        # Capitalize first letter of each word
        result = ' '.join(word.capitalize() for word in result.split())
        return result
    
    # Fallback: try the original suffix removal approach
    name_lower = name.lower()
    
    # Remove common suffixes (case insensitive)
    suffixes_to_remove = [
        'sustainability report',
        'annual report', 
        'csr report', 
        'esg report',
        '2020', '2021', '2022', '2023', '2024', '2025'
    ]
    
    # Keep removing suffixes until no more can be removed
    changed = True
    while changed:
        changed = False
        
        for suffix in suffixes_to_remove:
            # Check if the name ends with the suffix (with or without space)
            if name_lower.endswith(' ' + suffix):
                name = name[:-(len(suffix) + 1)]  # Remove suffix and space
                name_lower = name.lower()
                changed = True
                break
            elif name_lower.endswith(suffix) and len(name) > len(suffix):
                # Only remove if there's more than just the suffix
                name = name[:-len(suffix)]
                name_lower = name.lower()
                changed = True
                break
    
    # Capitalize result
    result = ' '.join(word.capitalize() for word in name.split())
    return result.strip() if result.strip() else 'Unknown Company'


if __name__ == "__main__":
    # Example usage
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python nlp_processor.py <pdf_path> [company_name] [output_path]")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    company_name = sys.argv[2] if len(sys.argv) > 2 else extract_company_name_from_filename(pdf_path)
    output_path = sys.argv[3] if len(sys.argv) > 3 else None
    
    def progress_callback(status):
        print(f"Progress: {status['progress']:.1%} - {status['current_step']}")
    
    try:
        results = process_pdf_document(pdf_path, company_name, output_path, progress_callback)
        print(f"\nProcessing completed!")
        print(f"Total claims: {results['summary']['total_claims']}")
        print(f"Verified: {results['summary']['verified']}")
        print(f"Questionable: {results['summary']['questionable']}")
        print(f"Unverified: {results['summary']['unverified']}")
        
    except Exception as e:
        print(f"Processing failed: {str(e)}")
        sys.exit(1)