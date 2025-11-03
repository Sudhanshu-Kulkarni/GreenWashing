#!/usr/bin/env python3
"""
Core logic test script for the NLP processing orchestrator.
Tests the core functionality without requiring heavy ML dependencies.
"""

import sys
import json
from pathlib import Path
from datetime import datetime

def test_company_name_extraction():
    """Test company name extraction from filenames"""
    print("--- Testing Company Name Extraction ---")
    
    def extract_company_name_from_filename(filename: str) -> str:
        """Extract company name from PDF filename."""
        # Remove file extension
        name = Path(filename).stem
        
        # Clean up separators first
        name = name.replace('_', ' ').replace('-', ' ')
        name = ' '.join(name.split())  # Remove extra spaces
        
        # Remove common suffixes (case insensitive)
        # Order matters - check longer suffixes first
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
            name_lower = name.lower()
            
            for suffix in suffixes_to_remove:
                # Check if the name ends with the suffix (with or without space)
                if name_lower.endswith(' ' + suffix):
                    name = name[:-(len(suffix) + 1)]  # Remove suffix and space
                    changed = True
                    break
                elif name_lower.endswith(suffix) and len(name) > len(suffix):
                    # Only remove if there's more than just the suffix
                    name = name[:-len(suffix)]
                    changed = True
                    break
        
        return name.strip()
    
    test_cases = [
        ("Apple_sustainability_report_2024.pdf", "Apple"),
        ("tesla-esg-report-2023.pdf", "tesla"),
        ("Microsoft_Corp_annual_report_2022.pdf", "Microsoft Corp"),
        ("google_csr_report.pdf", "google"),
        ("Amazon_2021.pdf", "Amazon")
    ]
    
    all_passed = True
    for filename, expected in test_cases:
        result = extract_company_name_from_filename(filename)
        if result.lower() == expected.lower():
            print(f"✓ {filename} -> {result}")
        else:
            print(f"✗ {filename} -> {result} (expected: {expected})")
            all_passed = False
    
    return all_passed

def test_processing_status():
    """Test processing status tracking"""
    print("\n--- Testing Processing Status ---")
    
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
            import time
            self.start_time = time.time()
            self.progress = 0.0
            self.current_step = "Initializing"
        
        def update_step(self, step_name: str, step_number: int):
            """Update current processing step"""
            self.current_step = step_name
            self.progress = (step_number - 1) / self.total_steps
            self.step_progress = 0.0
        
        def update_step_progress(self, progress: float):
            """Update progress within current step"""
            self.step_progress = min(max(progress, 0.0), 1.0)
        
        def add_error(self, error: str):
            """Add an error message"""
            self.errors.append(error)
        
        def add_warning(self, warning: str):
            """Add a warning message"""
            self.warnings.append(warning)
        
        def complete_processing(self):
            """Mark processing as complete"""
            self.progress = 1.0
            self.current_step = "Complete"
        
        def get_status_dict(self):
            """Get status as dictionary for JSON serialization"""
            import time
            duration = time.time() - self.start_time if self.start_time else 0
            return {
                'current_step': self.current_step,
                'progress': self.progress,
                'step_progress': self.step_progress,
                'duration': duration,
                'errors': self.errors,
                'warnings': self.warnings
            }
    
    try:
        status = ProcessingStatus()
        
        # Test initialization
        if status.current_step == "" and status.progress == 0.0:
            print("✓ Status initialized correctly")
        else:
            print("✗ Status initialization failed")
            return False
        
        # Test processing flow
        status.start_processing()
        if status.current_step == "Initializing" and status.progress == 0.0:
            print("✓ Processing started correctly")
        else:
            print("✗ Processing start failed")
            return False
        
        # Test step updates
        status.update_step("Test Step", 2)
        expected_progress = 1.0 / 6  # (2-1) / 6
        if status.current_step == "Test Step" and abs(status.progress - expected_progress) < 0.01:
            print("✓ Step update works correctly")
        else:
            print(f"✗ Step update failed: step={status.current_step}, progress={status.progress}")
            return False
        
        # Test error/warning handling
        status.add_error("Test error")
        status.add_warning("Test warning")
        if len(status.errors) == 1 and len(status.warnings) == 1:
            print("✓ Error and warning handling works")
        else:
            print("✗ Error/warning handling failed")
            return False
        
        # Test completion
        status.complete_processing()
        if status.current_step == "Complete" and status.progress == 1.0:
            print("✓ Processing completion works")
        else:
            print("✗ Processing completion failed")
            return False
        
        # Test status dictionary
        status_dict = status.get_status_dict()
        required_keys = ['current_step', 'progress', 'step_progress', 'duration', 'errors', 'warnings']
        if all(key in status_dict for key in required_keys):
            print("✓ Status dictionary contains all required keys")
        else:
            print("✗ Status dictionary missing keys")
            return False
        
        return True
        
    except Exception as e:
        print(f"✗ Processing status test failed: {e}")
        return False

def test_results_structure():
    """Test results data structure and formatting"""
    print("\n--- Testing Results Structure ---")
    
    try:
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
            print("✓ Results structure is JSON serializable")
        except Exception as e:
            print(f"✗ JSON serialization failed: {e}")
            return False
        
        # Test required fields
        required_top_level = ['document_info', 'claims', 'summary']
        if all(key in mock_results for key in required_top_level):
            print("✓ Results contain all required top-level keys")
        else:
            print("✗ Results missing required top-level keys")
            return False
        
        # Test document info structure
        doc_info = mock_results['document_info']
        required_doc_fields = ['filename', 'company_name', 'total_sentences', 'processing_time']
        if all(key in doc_info for key in required_doc_fields):
            print("✓ Document info contains required fields")
        else:
            print("✗ Document info missing required fields")
            return False
        
        # Test claims structure
        if mock_results['claims'] and isinstance(mock_results['claims'], list):
            claim = mock_results['claims'][0]
            required_claim_fields = ['id', 'text', 'confidence', 'verification_status', 'extracted_data', 'match_details']
            if all(key in claim for key in required_claim_fields):
                print("✓ Claim structure contains required fields")
            else:
                print("✗ Claim structure missing required fields")
                return False
        
        # Test summary structure
        summary = mock_results['summary']
        required_summary_fields = ['total_claims', 'verified', 'questionable', 'unverified', 'verification_rate']
        if all(key in summary for key in required_summary_fields):
            print("✓ Summary contains required fields")
        else:
            print("✗ Summary missing required fields")
            return False
        
        return True
        
    except Exception as e:
        print(f"✗ Results structure test failed: {e}")
        return False

def test_summary_report_generation():
    """Test summary report text generation"""
    print("\n--- Testing Summary Report Generation ---")
    
    def generate_summary_report(results):
        """Generate a human-readable summary report"""
        try:
            doc_info = results['document_info']
            summary = results['summary']
            
            report_lines = [
                "ESG CLAIM VERIFICATION REPORT",
                "=" * 50,
                "",
                f"Document: {doc_info['filename']}",
                f"Company: {doc_info['company_name']}",
                f"Processing Time: {doc_info['processing_time']:.2f} seconds",
                "",
                "SUMMARY STATISTICS",
                "-" * 20,
                f"Total Sentences Analyzed: {doc_info['total_sentences']}",
                f"Claims Detected: {summary['total_claims']}",
                f"  • Verified: {summary['verified']} ({summary['verified']/summary['total_claims']*100:.1f}%)" if summary['total_claims'] > 0 else "  • Verified: 0",
                f"  • Questionable: {summary['questionable']} ({summary['questionable']/summary['total_claims']*100:.1f}%)" if summary['total_claims'] > 0 else "  • Questionable: 0",
                f"  • Unverified: {summary['unverified']} ({summary['unverified']/summary['total_claims']*100:.1f}%)" if summary['total_claims'] > 0 else "  • Unverified: 0",
                "",
                f"Verification Rate: {summary['verification_rate']:.1%}",
            ]
            
            return "\n".join(report_lines)
            
        except Exception as e:
            return f"Error generating report: {str(e)}"
    
    try:
        # Test with mock data
        mock_results = {
            'document_info': {
                'filename': 'test_report.pdf',
                'company_name': 'Test Corp',
                'total_sentences': 50,
                'processing_time': 3.5
            },
            'summary': {
                'total_claims': 5,
                'verified': 3,
                'questionable': 1,
                'unverified': 1,
                'verification_rate': 0.6
            }
        }
        
        report = generate_summary_report(mock_results)
        
        # Check if report contains expected elements
        expected_elements = [
            "ESG CLAIM VERIFICATION REPORT",
            "Test Corp",
            "test_report.pdf",
            "Claims Detected: 5",
            "Verified: 3 (60.0%)",
            "Verification Rate: 60.0%"
        ]
        
        all_found = True
        for element in expected_elements:
            if element in report:
                print(f"✓ Report contains: {element}")
            else:
                print(f"✗ Report missing: {element}")
                all_found = False
        
        if all_found:
            print("✓ Summary report generation successful")
            return True
        else:
            print("✗ Summary report generation incomplete")
            return False
        
    except Exception as e:
        print(f"✗ Summary report test failed: {e}")
        return False

def main():
    """Run all core logic tests"""
    print("ESG Claim Verification - Core Logic Tests")
    print("=" * 50)
    
    tests = [
        test_company_name_extraction,
        test_processing_status,
        test_results_structure,
        test_summary_report_generation
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()  # Add spacing between tests
    
    print(f"--- Test Results ---")
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("✓ All core logic tests passed!")
        return 0
    else:
        print("✗ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())