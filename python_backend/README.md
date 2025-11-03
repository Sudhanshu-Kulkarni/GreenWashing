# ESG Claim Verification - NLP Processing Orchestrator

This module provides the main NLP processing orchestrator for the ESG Claim Verification system. It integrates PDF extraction, claim classification, and ESG verification into a complete processing pipeline.

## Implementation Status

✅ **Task 4.1: Build main processing pipeline** - COMPLETED
- Created `nlp_processor.py` as the main orchestrator
- Implemented `process_pdf_document` function integrating all components
- Added comprehensive processing status tracking and progress reporting
- Integrated PDF extraction, claim classification, and ESG verification

✅ **Task 4.2: Implement results formatting and output** - COMPLETED
- Created `results_formatter.py` for comprehensive results formatting
- Implemented JSON output structure for processed claims and verification results
- Added detailed summary statistics calculation (total, verified, questionable, unverified)
- Implemented detailed reasoning for each verification decision
- Added support for multiple output formats (JSON, CSV, text summary)

## Key Components

### 1. NLPProcessor (`nlp_processor.py`)
Main orchestrator class that coordinates the entire processing pipeline:

- **PDF Text Extraction**: Extracts and cleans text from PDF documents
- **Claim Classification**: Uses fine-tuned BERT model to identify claims
- **ESG Verification**: Verifies claims against ESG lookup dataset
- **Progress Tracking**: Real-time status updates and progress reporting
- **Error Handling**: Comprehensive error handling and logging

### 2. ResultsFormatter (`results_formatter.py`)
Comprehensive results formatting and output system:

- **Detailed Statistics**: Summary statistics, confidence analysis, reasoning breakdown
- **Multiple Formats**: JSON, CSV, and human-readable text reports
- **Verification Insights**: Analysis of verification patterns and data coverage
- **Confidence Analysis**: Distribution analysis and correlation insights

### 3. Processing Status Tracking
Real-time status tracking with:

- Step-by-step progress updates
- Error and warning collection
- Processing time tracking
- Status callbacks for UI integration

## Usage Examples

### Basic Usage
```python
from nlp_processor import NLPProcessor, extract_company_name_from_filename

# Extract company name from filename
company_name = extract_company_name_from_filename("Apple_sustainability_report_2024.pdf")

# Initialize processor
processor = NLPProcessor()

# Process document with progress callback
def progress_callback(status):
    print(f"Progress: {status['progress']:.1%} - {status['current_step']}")

results = processor.process_pdf_document(
    pdf_path="path/to/document.pdf",
    company_name=company_name,
    progress_callback=progress_callback
)
```

### Convenience Function
```python
from nlp_processor import process_pdf_document

# Simple one-line processing
results = process_pdf_document(
    pdf_path="document.pdf",
    company_name="Company Name",
    output_path="results.json"
)
```

### Multiple Output Formats
```python
# Save results in multiple formats
saved_files = processor.save_results_multiple_formats(
    results=results,
    output_dir="output/",
    save_csv=True,
    save_summary=True
)
```

## Results Structure

The processing results include:

```json
{
  "document_info": {
    "filename": "document.pdf",
    "company_name": "Company Name",
    "total_sentences": 150,
    "processing_time": 8.5,
    "processed_at": "2024-11-01T10:30:00"
  },
  "claims": [
    {
      "id": 1,
      "text": "Claim text...",
      "classification": {
        "confidence": 0.85,
        "confidence_level": "High"
      },
      "extracted_data": {
        "metric": "emissions_tCO2e",
        "value": 1000000,
        "unit": "tons",
        "year": 2024,
        "percentage": null
      },
      "verification": {
        "status": "verified",
        "confidence": 0.9,
        "reasoning": "Claim verified against CSV data",
        "csv_match": true,
        "tolerance_check": true
      }
    }
  ],
  "summary": {
    "total_claims": 5,
    "verified": 3,
    "questionable": 1,
    "unverified": 1,
    "verification_rate": 0.6
  },
  "confidence_analysis": {
    "classification_confidence": {...},
    "verification_confidence": {...},
    "recommendations": [...]
  },
  "verification_insights": {
    "insights": [...],
    "metrics_detected": [...],
    "data_coverage": {...}
  }
}
```

## Features

### Processing Pipeline
- ✅ PDF text extraction and cleaning
- ✅ Sentence splitting and preprocessing
- ✅ Batch claim classification with progress tracking
- ✅ Structured data extraction from claims
- ✅ ESG verification against lookup dataset
- ✅ Comprehensive results formatting

### Error Handling
- ✅ Component initialization validation
- ✅ PDF extraction error handling
- ✅ Model loading error handling
- ✅ Verification error handling
- ✅ Graceful degradation for partial failures

### Progress Tracking
- ✅ Real-time step updates
- ✅ Progress percentage calculation
- ✅ Processing time tracking
- ✅ Error and warning collection
- ✅ Status callbacks for UI integration

### Results Analysis
- ✅ Summary statistics calculation
- ✅ Confidence score analysis
- ✅ Verification reasoning breakdown
- ✅ Data coverage insights
- ✅ Pattern analysis and recommendations

### Output Formats
- ✅ Structured JSON results
- ✅ CSV export for claims data
- ✅ Human-readable summary reports
- ✅ Multiple file format support

## Testing

Run the core logic tests:
```bash
python python_backend/test_core_logic.py
```

View usage examples:
```bash
python python_backend/example_usage.py
```

## Dependencies

See `requirements.txt` for full dependency list. Key dependencies:
- `transformers` - For BERT model inference
- `torch` - PyTorch for model execution
- `pandas` - Data manipulation for ESG lookup
- `PyPDF2` / `pdfplumber` - PDF text extraction
- `fuzzywuzzy` - Fuzzy string matching
- `nltk` - Natural language processing utilities

## Integration

This orchestrator integrates with:
- **PDF Extractor** (`pdf_extractor.py`) - Text extraction from PDFs
- **Claim Classifier** (`claim_classifier.py`) - Fine-tuned BERT model for claim detection
- **ESG Verifier** (`esg_verifier.py`) - Claim verification against ESG data
- **Configuration** (`config.py`) - System configuration management
- **Error Handling** (`exceptions.py`) - Custom exception classes

## Requirements Satisfied

This implementation satisfies the following requirements from the specification:

- **Requirement 1.2**: Complete processing pipeline from PDF to verified claims
- **Requirement 2.4**: Batch processing for efficient sentence classification
- **Requirement 3.4**: Categorization of claims with appropriate verification status
- **Requirement 4.1**: Display total number of detected claims and verification status
- **Requirement 4.2**: Provide confidence scores and detailed verification results

The main NLP processing orchestrator is now complete and ready for integration with the React Native frontend.