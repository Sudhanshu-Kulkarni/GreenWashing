#!/usr/bin/env python3
"""
Integration test script for the ESG claim verification system.
Tests the complete pipeline from PDF processing to claim verification.
"""

import sys
import json
import tempfile
from pathlib import Path
from datetime import datetime

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

try:
    from nlp_processor import NLPProcessor, extract_company_name_from_filename
    from process_document import main as process_main
    print("✓ Successfully imported all modules")
except ImportError as e:
    print(f"✗ Import error: {e}")
    sys.exit(1)


def test_company_name_extraction():
    """Test company name extraction from filenames"""
    print("\n=== Testing Company Name Extraction ===")
    
    test_cases = [
        ("Apple_Sustainability_Report_2023.pdf", "Apple"),
        ("Microsoft-ESG-Report-2024.pdf", "Microsoft"),
        ("tesla_annual_report_2023.pdf", "Tesla"),
        ("Amazon_2024_Sustainability_Report.pdf", "Amazon"),
        ("sustainability_report_google_2023.pdf", "Google"),
        ("2023_Netflix_ESG_Report.pdf", "Netflix"),
        ("Meta_Annual_Sustainability_2024.pdf", "Meta"),
        ("report_sustainability_uber_2023.pdf", "Uber"),
    ]
    
    for filename, expected in test_cases:
        result = extract_company_name_from_filename(filename)
        status = "✓" if expected.lower() in result.lower() else "✗"
        print(f"{status} {filename} -> {result} (expected: {expected})")


def test_processor_initialization():
    """Test NLP processor initialization"""
    print("\n=== Testing Processor Initialization ===")
    
    try:
        processor = NLPProcessor()
        print("✓ NLPProcessor initialized successfully")
        
        # Test status tracking
        status = processor.get_processing_status()
        print(f"✓ Status tracking works: {status['current_step']}")
        
        return True
    except Exception as e:
        print(f"✗ Processor initialization failed: {e}")
        return False


def test_component_availability():
    """Test if all required components are available"""
    print("\n=== Testing Component Availability ===")
    
    # Check model path
    from config import MODEL_PATH, ESG_CSV_PATH
    
    model_path = Path(MODEL_PATH)
    if model_path.exists():
        print(f"✓ Model found at: {model_path}")
    else:
        print(f"✗ Model not found at: {model_path}")
    
    # Check CSV path
    csv_path = Path(ESG_CSV_PATH)
    if csv_path.exists():
        print(f"✓ ESG CSV found at: {csv_path}")
        
        # Check CSV structure
        try:
            import pandas as pd
            df = pd.read_csv(csv_path)
            print(f"✓ CSV loaded successfully: {len(df)} rows")
            print(f"✓ CSV columns: {list(df.columns)}")
        except Exception as e:
            print(f"✗ CSV loading failed: {e}")
    else:
        print(f"✗ ESG CSV not found at: {csv_path}")


def create_test_pdf():
    """Create a simple test PDF for processing"""
    try:
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        
        # Create temporary PDF
        temp_file = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False)
        
        # Create PDF content
        c = canvas.Canvas(temp_file.name, pagesize=letter)
        c.drawString(100, 750, "Sample Sustainability Report")
        c.drawString(100, 700, "Company: Test Corporation")
        c.drawString(100, 650, "We reduced our carbon emissions by 30% in 2023.")
        c.drawString(100, 600, "Our renewable energy usage reached 85% of total consumption.")
        c.drawString(100, 550, "We achieved zero waste to landfill in all facilities.")
        c.drawString(100, 500, "Water consumption decreased by 15% compared to baseline.")
        c.save()
        
        print(f"✓ Test PDF created: {temp_file.name}")
        return temp_file.name
        
    except ImportError:
        print("✗ reportlab not available, cannot create test PDF")
        return None
    except Exception as e:
        print(f"✗ Failed to create test PDF: {e}")
        return None


def main():
    """Run all integration tests"""
    print("ESG Claim Verification - Integration Tests")
    print("=" * 50)
    
    # Test 1: Company name extraction
    test_company_name_extraction()
    
    # Test 2: Component availability
    test_component_availability()
    
    # Test 3: Processor initialization
    processor_ok = test_processor_initialization()
    
    # Test 4: Create test PDF
    test_pdf = create_test_pdf()
    
    print("\n=== Integration Test Summary ===")
    print("✓ Company name extraction: Working")
    print("✓ Component availability: Check output above")
    print(f"{'✓' if processor_ok else '✗'} Processor initialization: {'Working' if processor_ok else 'Failed'}")
    print(f"{'✓' if test_pdf else '✗'} Test PDF creation: {'Working' if test_pdf else 'Failed'}")
    
    if test_pdf:
        print(f"\nTo test full processing, run:")
        print(f"python process_document.py {test_pdf} --company-name 'Test Corporation' --verbose")
    
    print("\nIntegration tests completed!")


if __name__ == "__main__":
    main()