#!/usr/bin/env python3
"""
Command-line interface for processing PDF documents through the ESG claim verification pipeline.
This script serves as the bridge between React Native and the Python NLP backend.
"""

import sys
import json
import os
import argparse
from pathlib import Path
from datetime import datetime

# Add the current directory to Python path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from nlp_processor import NLPProcessor, extract_company_name_from_filename
    from config import MODEL_PATH, ESG_CSV_PATH
except ImportError as e:
    print(f"Error importing modules: {e}", file=sys.stderr)
    sys.exit(1)


def create_status_file(status_dir: Path, job_id: str, status: dict):
    """Create a status file for React Native to monitor progress"""
    try:
        status_dir.mkdir(parents=True, exist_ok=True)
        status_file = status_dir / f"{job_id}_status.json"
        
        with open(status_file, 'w') as f:
            json.dump(status, f, indent=2)
            
    except Exception as e:
        print(f"Warning: Could not create status file: {e}", file=sys.stderr)


def progress_callback(job_id: str, status_dir: Path):
    """Create a progress callback function for the processor"""
    def callback(status_dict):
        try:
            # Add timestamp and job ID
            status_dict['job_id'] = job_id
            status_dict['timestamp'] = datetime.now().isoformat()
            
            # Create status file
            create_status_file(status_dir, job_id, status_dict)
            
            # Print progress for debugging
            progress = status_dict.get('progress', 0) * 100
            step = status_dict.get('current_step', 'Unknown')
            print(f"Progress: {progress:.1f}% - {step}", file=sys.stderr)
            
        except Exception as e:
            print(f"Warning: Progress callback error: {e}", file=sys.stderr)
    
    return callback


def main():
    parser = argparse.ArgumentParser(description='Process PDF document for ESG claim verification')
    parser.add_argument('pdf_path', help='Path to the PDF file to process')
    parser.add_argument('--company-name', help='Company name (if not provided, extracted from filename)')
    parser.add_argument('--job-id', help='Job ID for tracking (if not provided, generated)')
    parser.add_argument('--output-dir', help='Output directory for results', default='./shared/results')
    parser.add_argument('--status-dir', help='Status directory for progress tracking', default='./shared/status')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose output')
    
    args = parser.parse_args()
    
    # Validate input file
    pdf_path = Path(args.pdf_path)
    if not pdf_path.exists():
        print(f"Error: PDF file not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)
    
    if not pdf_path.suffix.lower() == '.pdf':
        print(f"Error: File must be a PDF: {pdf_path}", file=sys.stderr)
        sys.exit(1)
    
    # Extract or use provided company name
    company_name = args.company_name
    if not company_name:
        company_name = extract_company_name_from_filename(pdf_path.name)
        if args.verbose:
            print(f"Extracted company name: {company_name}", file=sys.stderr)
    
    # Generate job ID if not provided
    job_id = args.job_id
    if not job_id:
        job_id = f"job_{int(datetime.now().timestamp())}_{os.getpid()}"
    
    # Setup directories
    output_dir = Path(args.output_dir)
    status_dir = Path(args.status_dir)
    
    try:
        output_dir.mkdir(parents=True, exist_ok=True)
        status_dir.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        print(f"Error creating directories: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Create initial status
    initial_status = {
        'job_id': job_id,
        'status': 'starting',
        'progress': 0.0,
        'current_step': 'Initializing',
        'pdf_path': str(pdf_path),
        'company_name': company_name,
        'timestamp': datetime.now().isoformat()
    }
    create_status_file(status_dir, job_id, initial_status)
    
    if args.verbose:
        print(f"Starting processing for job: {job_id}", file=sys.stderr)
        print(f"PDF: {pdf_path}", file=sys.stderr)
        print(f"Company: {company_name}", file=sys.stderr)
    
    try:
        # Initialize processor
        processor = NLPProcessor()
        
        # Create progress callback
        callback = progress_callback(job_id, status_dir)
        
        # Process the document
        results = processor.process_pdf_document(
            str(pdf_path),
            company_name,
            callback
        )
        
        # Add job metadata to results
        results['job_id'] = job_id
        results['processing_timestamp'] = datetime.now().isoformat()
        
        # Save results to output directory
        results_file = output_dir / f"{job_id}_results.json"
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        # Create final status
        final_status = {
            'job_id': job_id,
            'status': 'completed',
            'progress': 1.0,
            'current_step': 'Complete',
            'results_file': str(results_file),
            'timestamp': datetime.now().isoformat()
        }
        create_status_file(status_dir, job_id, final_status)
        
        # Output results to stdout for React Native
        print(json.dumps(results, ensure_ascii=False))
        
        if args.verbose:
            print(f"Processing completed successfully", file=sys.stderr)
            print(f"Results saved to: {results_file}", file=sys.stderr)
            print(f"Total claims: {results['summary']['total_claims']}", file=sys.stderr)
            print(f"Verified: {results['summary']['verified']}", file=sys.stderr)
        
    except Exception as e:
        error_msg = str(e)
        
        # Create error status
        error_status = {
            'job_id': job_id,
            'status': 'error',
            'progress': 0.0,
            'current_step': 'Failed',
            'error': error_msg,
            'timestamp': datetime.now().isoformat()
        }
        create_status_file(status_dir, job_id, error_status)
        
        # Output error
        error_result = {
            'job_id': job_id,
            'status': 'error',
            'error': error_msg,
            'timestamp': datetime.now().isoformat()
        }
        
        print(json.dumps(error_result), file=sys.stderr)
        print(f"Processing failed: {error_msg}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()