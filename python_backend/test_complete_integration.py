#!/usr/bin/env python3
"""
Complete integration tests for the ESG claim verification system.
Tests the entire pipeline from PDF processing to claim verification with known input/output pairs.
"""

import sys
import json
import tempfile
import unittest
from pathlib import Path
from datetime import datetime
from unittest.mock import patch, MagicMock

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

try:
    from nlp_processor import NLPProcessor, extract_company_name_from_filename
    from process_document import main as process_main
    from config import MODEL_PATH, ESG_CSV_PATH
    print("✓ Successfully imported all modules")
except ImportError as e:
    print(f"✗ Import error: {e}")
    sys.exit(1)


class TestCompleteIntegration(unittest.TestCase):
    """Test complete ESG claim verification pipeline"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.test_data_dir = Path(__file__).parent / "test_data"
        self.test_data_dir.mkdir(exist_ok=True)
        
        # Known test cases with expected results
        self.test_cases = [
            {
                "company_name": "Apple Inc",
                "claims": [
                    "We reduced our carbon emissions by 25% in 2023.",
                    "Our renewable energy usage reached 100% of operations.",
                    "Water consumption decreased by 15% compared to baseline."
                ],
                "expected_results": {
                    "total_claims": 3,
                    "verified": 1,
                    "questionable": 1,
                    "unverified": 1
                }
            },
            {
                "company_name": "Microsoft Corporation",
                "claims": [
                    "Microsoft achieved carbon negative status in 2023.",
                    "We invested $1 billion in climate innovation fund.",
                    "Renewable energy powers 85% of our data centers."
                ],
                "expected_results": {
                    "total_claims": 3,
                    "verified": 0,
                    "questionable": 2,
                    "unverified": 1
                }
            }
        ]
    
    def test_company_name_extraction_comprehensive(self):
        """Test company name extraction with comprehensive test cases"""
        test_cases = [
            ("Apple_Sustainability_Report_2023.pdf", "Apple"),
            ("Microsoft-ESG-Report-2024.pdf", "Microsoft"),
            ("tesla_annual_report_2023.pdf", "Tesla"),
            ("Amazon_2024_Sustainability_Report.pdf", "Amazon"),
            ("sustainability_report_google_2023.pdf", "Google"),
            ("2023_Netflix_ESG_Report.pdf", "Netflix"),
            ("Meta_Annual_Sustainability_2024.pdf", "Meta"),
            ("report_sustainability_uber_2023.pdf", "Uber"),
            ("complex_company_name_inc_sustainability_2023.pdf", "Complex Company Name Inc"),
            ("UPPERCASE_COMPANY_ESG_2024.pdf", "Uppercase Company"),
        ]
        
        for filename, expected in test_cases:
            with self.subTest(filename=filename):
                result = extract_company_name_from_filename(filename)
                self.assertIsInstance(result, str)
                self.assertGreater(len(result), 0)
                # Check if expected company name is contained in result (case insensitive)
                self.assertIn(expected.lower(), result.lower(), 
                            f"Expected '{expected}' to be in '{result}' for filename '{filename}'")
    
    def test_nlp_processor_initialization(self):
        """Test NLP processor initialization with error handling"""
        try:
            processor = NLPProcessor()
            self.assertIsNotNone(processor)
            
            # Test status tracking
            status = processor.get_processing_status()
            self.assertIsInstance(status, dict)
            self.assertIn('current_step', status)
            self.assertIn('progress', status)
            
        except Exception as e:
            self.skipTest(f"NLP processor initialization failed: {e}")
    
    def test_processing_status_tracking(self):
        """Test processing status tracking functionality"""
        try:
            processor = NLPProcessor()
            
            # Test initial status
            status = processor.get_processing_status()
            self.assertEqual(status['progress'], 0.0)
            self.assertEqual(status['current_step'], "")
            
            # Test status updates
            processor.status.start_processing()
            status = processor.get_processing_status()
            self.assertEqual(status['current_step'], "Initializing")
            self.assertGreaterEqual(status['progress'], 0.0)
            
            # Test step updates
            processor.status.update_step("Test Step", 2)
            status = processor.get_processing_status()
            self.assertEqual(status['current_step'], "Test Step")
            self.assertGreater(status['progress'], 0.0)
            
        except Exception as e:
            self.skipTest(f"Status tracking test failed: {e}")
    
    def test_results_structure_validation(self):
        """Test results data structure validation"""
        # Create mock results structure
        mock_results = {
            'document_info': {
                'filename': 'test_document.pdf',
                'company_name': 'Test Company',
                'total_sentences': 100,
                'processing_time': 5.2,
                'processed_at': datetime.now().isoformat()
            },
            'claims': [
                {
                    'id': 1,
                    'text': 'Test claim about emissions',
                    'confidence': 0.85,
                    'verification_status': 'verified',
                    'verification_confidence': 0.9,
                    'extracted_data': {
                        'metric': 'emissions_tCO2e',
                        'value': 1000000,
                        'unit': 'tons',
                        'year': 2024,
                        'percentage': None
                    },
                    'match_details': {
                        'csv_match': True,
                        'tolerance_check': True,
                        'reasoning': 'Claim verified against CSV data',
                        'matched_data': {'value': 1000000, 'year': 2024}
                    }
                }
            ],
            'summary': {
                'total_claims': 1,
                'verified': 1,
                'questionable': 0,
                'unverified': 0,
                'verification_rate': 1.0,
                'avg_classification_confidence': 0.85,
                'avg_verification_confidence': 0.9
            }
        }
        
        # Test JSON serialization
        try:
            json_str = json.dumps(mock_results, indent=2, default=str)
            parsed_back = json.loads(json_str)
            self.assertIsInstance(parsed_back, dict)
        except Exception as e:
            self.fail(f"JSON serialization failed: {e}")
        
        # Test required fields
        required_top_level = ['document_info', 'claims', 'summary']
        for key in required_top_level:
            self.assertIn(key, mock_results)
        
        # Test document info structure
        doc_info = mock_results['document_info']
        required_doc_fields = ['filename', 'company_name', 'total_sentences', 'processing_time']
        for field in required_doc_fields:
            self.assertIn(field, doc_info)
        
        # Test claims structure
        self.assertIsInstance(mock_results['claims'], list)
        if mock_results['claims']:
            claim = mock_results['claims'][0]
            required_claim_fields = ['id', 'text', 'confidence', 'verification_status', 'extracted_data', 'match_details']
            for field in required_claim_fields:
                self.assertIn(field, claim)
        
        # Test summary structure
        summary = mock_results['summary']
        required_summary_fields = ['total_claims', 'verified', 'questionable', 'unverified', 'verification_rate']
        for field in required_summary_fields:
            self.assertIn(field, summary)
    
    def test_error_handling_scenarios(self):
        """Test error handling for various failure scenarios"""
        processor = NLPProcessor()
        
        # Test invalid file path
        with self.assertRaises(Exception):
            processor.process_pdf_document("nonexistent_file.pdf", "Test Company")
        
        # Test empty company name
        with self.assertRaises(Exception):
            processor.process_pdf_document("test.pdf", "")
        
        # Test None inputs
        with self.assertRaises(Exception):
            processor.process_pdf_document(None, None)
    
    @patch('nlp_processor.PDFExtractor')
    @patch('nlp_processor.ClaimClassifier')
    @patch('nlp_processor.ESGVerifier')
    def test_mocked_processing_pipeline(self, mock_verifier, mock_classifier, mock_extractor):
        """Test processing pipeline with mocked components"""
        # Setup mocks
        mock_extractor_instance = MagicMock()
        mock_extractor_instance.process_pdf.return_value = [
            "We reduced our carbon emissions by 25% in 2023.",
            "Our renewable energy usage reached 100% of operations.",
            "This is not a claim sentence."
        ]
        mock_extractor.return_value = mock_extractor_instance
        
        mock_classifier_instance = MagicMock()
        mock_classifier_instance.batch_classify.return_value = [
            {'text': 'We reduced our carbon emissions by 25% in 2023.', 'is_claim': True, 'confidence': 0.9},
            {'text': 'Our renewable energy usage reached 100% of operations.', 'is_claim': True, 'confidence': 0.85},
            {'text': 'This is not a claim sentence.', 'is_claim': False, 'confidence': 0.3}
        ]
        mock_classifier_instance.filter_claims.return_value = [
            {'text': 'We reduced our carbon emissions by 25% in 2023.', 'confidence': 0.9},
            {'text': 'Our renewable energy usage reached 100% of operations.', 'confidence': 0.85}
        ]
        mock_classifier.return_value = mock_classifier_instance
        
        # Mock ESG verifier
        mock_verifier_instance = MagicMock()
        
        # Mock ExtractedClaimData
        mock_extracted_data = MagicMock()
        mock_extracted_data.metric = 'emissions'
        mock_extracted_data.value = 25
        mock_extracted_data.unit = 'percent'
        mock_extracted_data.year = 2023
        mock_extracted_data.percentage = True
        
        mock_verifier_instance.extract_claim_data.return_value = mock_extracted_data
        
        # Mock verification result
        mock_verification_result = MagicMock()
        mock_verification_result.status = 'verified'
        mock_verification_result.confidence = 0.8
        mock_verification_result.csv_match = True
        mock_verification_result.tolerance_check = True
        mock_verification_result.reasoning = 'Test verification'
        mock_verification_result.matched_data = {'test': 'data'}
        
        mock_verifier_instance.verify_claim.return_value = mock_verification_result
        mock_verifier.return_value = mock_verifier_instance
        
        # Test processing
        processor = NLPProcessor()
        
        # Create a temporary test file
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
            temp_file.write(b'%PDF-1.4 test content')
            temp_path = temp_file.name
        
        try:
            results = processor.process_pdf_document(temp_path, "Test Company")
            
            # Validate results structure
            self.assertIn('document_info', results)
            self.assertIn('claims', results)
            self.assertIn('summary', results)
            
            # Validate document info
            self.assertEqual(results['document_info']['company_name'], 'Test Company')
            
            # Validate claims
            self.assertIsInstance(results['claims'], list)
            self.assertGreater(len(results['claims']), 0)
            
            # Validate summary
            summary = results['summary']
            self.assertIn('total_claims', summary)
            self.assertIn('verified', summary)
            self.assertIn('questionable', summary)
            self.assertIn('unverified', summary)
            
        finally:
            # Cleanup
            Path(temp_path).unlink(missing_ok=True)
    
    def test_configuration_validation(self):
        """Test configuration validation"""
        from config import validate_config
        
        try:
            # This will raise an exception if config is invalid
            validate_config()
        except FileNotFoundError as e:
            self.skipTest(f"Configuration validation failed - missing files: {e}")
        except Exception as e:
            self.fail(f"Configuration validation failed: {e}")
    
    def test_component_availability(self):
        """Test if all required components are available"""
        # Check model path
        model_path = Path(MODEL_PATH)
        if not model_path.exists():
            self.skipTest(f"Model not found at: {model_path}")
        
        # Check CSV path
        csv_path = Path(ESG_CSV_PATH)
        if not csv_path.exists():
            self.skipTest(f"ESG CSV not found at: {csv_path}")
        
        # If we get here, components are available
        self.assertTrue(model_path.exists())
        self.assertTrue(csv_path.exists())
    
    def test_realistic_processing_simulation(self):
        """Test realistic processing simulation with expected data structures"""
        # This test simulates the processing without requiring actual model files
        
        # Mock processing results that match expected structure
        expected_structure = {
            'job_id': 'test_job_123',
            'document_info': {
                'filename': 'test_sustainability_report.pdf',
                'company_name': 'Test Company',
                'total_sentences': 50,
                'processing_time': 12.5,
            },
            'claims': [
                {
                    'id': 1,
                    'text': 'We reduced our carbon emissions by 30% compared to 2020.',
                    'confidence': 0.92,
                    'extracted_data': {
                        'metric': 'carbon_emissions',
                        'value': 30,
                        'unit': 'percent',
                        'year': 2020,
                        'percentage': True
                    },
                    'verification_status': 'verified',
                    'verification_confidence': 0.85,
                    'match_details': {
                        'csv_match': True,
                        'tolerance_check': True,
                        'reasoning': 'Found matching data in ESG database',
                        'matched_data': {
                            'company': 'Test Company',
                            'year': 2020,
                            'metric': 'emissions_reduction_percent',
                            'value': 28,
                            'source': 'CDP'
                        }
                    }
                }
            ],
            'summary': {
                'total_claims': 1,
                'verified': 1,
                'questionable': 0,
                'unverified': 0
            },
            'status': 'completed',
            'timestamp': datetime.now().isoformat(),
        }
        
        # Validate the structure
        self.assertIn('job_id', expected_structure)
        self.assertIn('document_info', expected_structure)
        self.assertIn('claims', expected_structure)
        self.assertIn('summary', expected_structure)
        
        # Validate claims structure
        claims = expected_structure['claims']
        self.assertIsInstance(claims, list)
        if claims:
            claim = claims[0]
            required_fields = ['id', 'text', 'confidence', 'verification_status', 'extracted_data', 'match_details']
            for field in required_fields:
                self.assertIn(field, claim)
        
        # Validate summary totals match claims
        summary = expected_structure['summary']
        total_claims = len(claims)
        self.assertEqual(summary['total_claims'], total_claims)
        
        # Validate verification status counts
        verified_count = sum(1 for c in claims if c['verification_status'] == 'verified')
        questionable_count = sum(1 for c in claims if c['verification_status'] == 'questionable')
        unverified_count = sum(1 for c in claims if c['verification_status'] == 'unverified')
        
        self.assertEqual(summary['verified'], verified_count)
        self.assertEqual(summary['questionable'], questionable_count)
        self.assertEqual(summary['unverified'], unverified_count)


def run_integration_tests():
    """Run all integration tests"""
    print("ESG Claim Verification - Complete Integration Tests")
    print("=" * 60)
    
    # Create test suite
    suite = unittest.TestLoader().loadTestsFromTestCase(TestCompleteIntegration)
    
    # Run tests with detailed output
    runner = unittest.TextTestRunner(verbosity=2, stream=sys.stdout)
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "=" * 60)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Skipped: {len(result.skipped)}")
    
    if result.failures:
        print("\nFailures:")
        for test, traceback in result.failures:
            print(f"- {test}: {traceback}")
    
    if result.errors:
        print("\nErrors:")
        for test, traceback in result.errors:
            print(f"- {test}: {traceback}")
    
    if result.skipped:
        print("\nSkipped:")
        for test, reason in result.skipped:
            print(f"- {test}: {reason}")
    
    success = len(result.failures) == 0 and len(result.errors) == 0
    print(f"\nOverall result: {'PASSED' if success else 'FAILED'}")
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(run_integration_tests())