#!/usr/bin/env python3
"""
Example usage of the ESG Claim Verification NLP Processing Orchestrator.

This script demonstrates how to use the main NLP processor to process
PDF documents and generate verification results.
"""

import sys
from pathlib import Path

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

def example_basic_usage():
    """Example of basic usage with the NLP processor"""
    print("=== Basic Usage Example ===")
    
    try:
        # Import the main processor
        from nlp_processor import NLPProcessor, extract_company_name_from_filename
        
        # Example PDF path (this would be a real PDF in practice)
        pdf_path = "example_reports/Apple_sustainability_report_2024.pdf"
        
        # Extract company name from filename
        company_name = extract_company_name_from_filename(pdf_path)
        print(f"Extracted company name: {company_name}")
        
        # Initialize the processor
        processor = NLPProcessor()
        
        # Define a progress callback
        def progress_callback(status):
            step = status['current_step']
            progress = status['progress']
            print(f"Progress: {progress:.1%} - {step}")
        
        print(f"\nWould process PDF: {pdf_path}")
        print(f"For company: {company_name}")
        print("Note: This is a demo - actual processing requires the PDF file and dependencies")
        
        # In real usage, you would call:
        # results = processor.process_pdf_document(pdf_path, company_name, progress_callback)
        
    except ImportError as e:
        print(f"Import error (expected without dependencies): {e}")
    except Exception as e:
        print(f"Error: {e}")

def example_batch_processing():
    """Example of processing multiple documents"""
    print("\n=== Batch Processing Example ===")
    
    # Example list of PDF files
    pdf_files = [
        "reports/Apple_sustainability_report_2024.pdf",
        "reports/Tesla_esg_report_2023.pdf", 
        "reports/Microsoft_annual_report_2022.pdf"
    ]
    
    try:
        from nlp_processor import process_pdf_document, extract_company_name_from_filename
        
        for pdf_path in pdf_files:
            company_name = extract_company_name_from_filename(pdf_path)
            print(f"Would process: {Path(pdf_path).name} -> Company: {company_name}")
            
            # In real usage:
            # results = process_pdf_document(pdf_path, company_name, output_path=f"results/{company_name}_results.json")
            
    except ImportError as e:
        print(f"Import error (expected without dependencies): {e}")

def example_results_formatting():
    """Example of using the results formatter"""
    print("\n=== Results Formatting Example ===")
    
    try:
        from results_formatter import ResultsFormatter
        
        # Create mock results for demonstration
        mock_results = {
            'document_info': {
                'filename': 'Apple_sustainability_report_2024.pdf',
                'company_name': 'Apple',
                'total_sentences': 150,
                'processing_time': 8.5,
                'processed_at': '2024-11-01T10:30:00'
            },
            'claims': [
                {
                    'id': 1,
                    'text': 'Apple reduced its carbon emissions by 75% since 2015',
                    'confidence': 0.92,
                    'verification_status': 'verified',
                    'verification_confidence': 0.88,
                    'extracted_data': {
                        'metric': 'emissions_tCO2e',
                        'value': None,
                        'unit': None,
                        'year': 2015,
                        'percentage': 75.0
                    },
                    'match_details': {
                        'csv_match': True,
                        'tolerance_check': True,
                        'reasoning': 'Claim verified: percentage reduction matches historical data',
                        'matched_data': {'baseline_year': 2015, 'reduction_verified': True}
                    }
                },
                {
                    'id': 2,
                    'text': 'Tesla achieved 50% renewable energy usage in 2023',
                    'confidence': 0.85,
                    'verification_status': 'questionable',
                    'verification_confidence': 0.45,
                    'extracted_data': {
                        'metric': 'renewable_energy_percent',
                        'value': None,
                        'unit': '%',
                        'year': 2023,
                        'percentage': 50.0
                    },
                    'match_details': {
                        'csv_match': True,
                        'tolerance_check': False,
                        'reasoning': 'Claim questionable: 50.0% differs from CSV value 41.8%',
                        'matched_data': {'csv_value': 41.8, 'year': 2023}
                    }
                }
            ],
            'summary': {
                'total_claims': 2,
                'verified': 1,
                'questionable': 1,
                'unverified': 0,
                'verification_rate': 0.5,
                'avg_classification_confidence': 0.885,
                'avg_verification_confidence': 0.665
            }
        }
        
        # Create formatter and generate summary report
        formatter = ResultsFormatter()
        summary_report = formatter.generate_summary_report(mock_results)
        
        print("Generated Summary Report:")
        print("-" * 40)
        print(summary_report)
        
        # In real usage, you could also save to files:
        # formatter.save_results_json(mock_results, "output/results.json")
        # formatter.save_results_csv(mock_results, "output/claims.csv")
        
    except ImportError as e:
        print(f"Import error (expected without dependencies): {e}")

def example_configuration():
    """Example of configuration options"""
    print("\n=== Configuration Example ===")
    
    try:
        from nlp_processor import NLPProcessor
        from config import MODEL_PATH, ESG_CSV_PATH, CONFIDENCE_THRESHOLD
        
        print("Default Configuration:")
        print(f"Model Path: {MODEL_PATH}")
        print(f"ESG CSV Path: {ESG_CSV_PATH}")
        print(f"Confidence Threshold: {CONFIDENCE_THRESHOLD}")
        
        # Example of custom configuration
        print("\nCustom Configuration Example:")
        custom_processor = NLPProcessor(
            confidence_threshold=0.8  # Higher threshold for more selective claim detection
        )
        
        print("Custom processor created with higher confidence threshold")
        
    except ImportError as e:
        print(f"Import error (expected without dependencies): {e}")

def main():
    """Run all examples"""
    print("ESG Claim Verification - Usage Examples")
    print("=" * 50)
    
    example_basic_usage()
    example_batch_processing()
    example_results_formatting()
    example_configuration()
    
    print("\n" + "=" * 50)
    print("Examples completed!")
    print("\nTo use in production:")
    print("1. Install dependencies: pip install -r requirements.txt")
    print("2. Ensure model and CSV files are in place")
    print("3. Use the NLPProcessor class or convenience functions")
    print("4. Process results with ResultsFormatter for multiple output formats")

if __name__ == "__main__":
    main()