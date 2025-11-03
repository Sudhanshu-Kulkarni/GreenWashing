# ESG Claim Verification - Integration Tests Documentation

This document describes the comprehensive integration test suite for the ESG Claim Verification system, covering Python NLP backend, React Native frontend, and end-to-end workflows.

## Overview

The integration test suite validates the complete ESG claim verification pipeline from PDF document upload to claim verification results. It includes:

1. **Python NLP Pipeline Tests** - Testing core processing components
2. **React Native Component Tests** - Testing frontend services and data management
3. **End-to-End Workflow Tests** - Testing complete processing workflows
4. **System Integration Tests** - Testing component interactions

## Test Structure

```
├── python_backend/
│   ├── test_complete_integration.py     # Python backend integration tests
│   ├── test_core_logic.py              # Core logic unit tests
│   └── test_integration.py             # Component integration tests
├── ClimateApp/services/__tests__/
│   ├── dataService.test.js             # DataService functionality tests
│   ├── integrationTests.js            # React Native integration tests
│   ├── endToEndTests.js               # End-to-end workflow tests
│   ├── nodeCompatibleTests.js         # Node.js compatible tests
│   └── runAllTests.js                  # Comprehensive test runner
└── run_all_integration_tests.sh        # Master test runner script
```

## Running Tests

### Quick Start

Run all integration tests with a single command:

```bash
./run_all_integration_tests.sh
```

### Individual Test Suites

#### Python Backend Tests

```bash
# Complete integration tests
python python_backend/test_complete_integration.py

# Core logic tests
python python_backend/test_core_logic.py

# Component integration tests
python python_backend/test_integration.py
```

#### React Native Tests

```bash
# Node.js compatible tests (recommended)
node ClimateApp/services/__tests__/nodeCompatibleTests.js

# DataService tests
node ClimateApp/services/__tests__/dataService.test.js

# Note: Full React Native tests require Expo environment
```

## Test Categories

### 1. Python NLP Pipeline Tests

**File**: `python_backend/test_complete_integration.py`

**Coverage**:
- Company name extraction from filenames
- NLP processor initialization and status tracking
- Processing pipeline with mocked components
- Results structure validation
- Error handling scenarios
- Configuration validation
- Component availability checks

**Key Test Cases**:
```python
def test_company_name_extraction_comprehensive()
def test_nlp_processor_initialization()
def test_mocked_processing_pipeline()
def test_results_structure_validation()
def test_error_handling_scenarios()
```

**Expected Results**:
- All components initialize correctly
- Company names extracted accurately from various filename formats
- Processing pipeline handles mocked data correctly
- Results follow expected JSON structure
- Errors handled gracefully

### 2. React Native Component Tests

**File**: `ClimateApp/services/__tests__/nodeCompatibleTests.js`

**Coverage**:
- DataService CRUD operations
- Claims filtering and statistics
- Error handling and validation
- Performance under load
- Data consistency checks
- Company name extraction logic

**Key Test Cases**:
```javascript
async function testDataServiceCore()
async function testErrorHandling()
async function testDataConsistency()
async function testPerformance()
```

**Expected Results**:
- DataService handles empty states correctly
- Document and claim operations work as expected
- Error conditions handled appropriately
- Performance meets acceptable thresholds
- Data remains consistent across operations

### 3. End-to-End Workflow Tests

**File**: `ClimateApp/services/__tests__/endToEndTests.js`

**Coverage**:
- Complete document processing workflow
- Multiple document handling
- Error recovery and resilience
- Data consistency across components
- Performance under load scenarios

**Key Test Cases**:
```javascript
async function testCompleteDocumentProcessingWorkflow()
async function testMultipleDocumentProcessing()
async function testErrorRecoveryAndResilience()
async function testDataConsistencyAndIntegrity()
```

**Expected Results**:
- Documents processed from upload to verification
- Multiple documents handled correctly
- System recovers from errors gracefully
- Data integrity maintained throughout

### 4. System Integration Tests

**File**: `ClimateApp/services/__tests__/integrationTests.js`

**Coverage**:
- Service integration (DataService, PythonBridge, DocumentProcessor)
- Cross-component data flow
- Error propagation and handling
- System requirements validation

**Key Test Cases**:
```javascript
async function testDataServiceIntegration()
async function testPythonBridgeIntegration()
async function testDocumentProcessorIntegration()
async function testEndToEndWorkflow()
```

## Test Data and Fixtures

### Mock Documents
The tests use realistic mock documents with:
- Proper filename formats (e.g., `Apple_Sustainability_Report_2023.pdf`)
- Realistic claim text samples
- Expected verification statuses
- Proper data structures

### Test Claims
Sample claims used in tests:
```javascript
{
  id: 1,
  text: 'We reduced our carbon emissions by 25% in 2023.',
  category: 'emissions',
  confidence: 0.92,
  status: 'verified',
  evidence: 3,
  reasoning: 'Found matching data in ESG database'
}
```

### Expected Results Structure
```javascript
{
  job_id: 'test_job_123',
  document_info: {
    filename: 'test_document.pdf',
    company_name: 'Test Company',
    total_sentences: 100,
    processing_time: 5.2
  },
  claims: [...],
  summary: {
    total_claims: 3,
    verified: 1,
    questionable: 1,
    unverified: 1
  },
  status: 'completed'
}
```

## Performance Benchmarks

### Python Backend
- Model loading: < 10 seconds
- PDF processing: < 30 seconds for typical documents
- Claim classification: < 5 seconds per 100 sentences
- ESG verification: < 2 seconds per claim

### React Native Frontend
- Document addition: < 100ms per document
- Data retrieval: < 50ms for typical datasets
- Claims filtering: < 20ms for 1000+ claims
- Statistics calculation: < 10ms

## Error Handling

### Expected Error Scenarios
1. **File Not Found**: PDF file doesn't exist
2. **Invalid Input**: Malformed document data
3. **Processing Failure**: Python backend unavailable
4. **Data Corruption**: Invalid claim structures
5. **Network Issues**: Communication failures

### Error Recovery
- Graceful degradation when Python backend unavailable
- Data validation and sanitization
- Retry mechanisms for transient failures
- User-friendly error messages

## System Requirements

### Python Backend Requirements
- Python 3.8+
- Required packages: transformers, pandas, PyPDF2, fuzzywuzzy
- Trained BERT model files
- ESG lookup CSV data

### React Native Requirements
- Node.js 16+
- Expo SDK 49+
- React Native 0.72+
- Required packages: expo-document-picker, expo-file-system

### Test Environment Requirements
- All system requirements above
- Internet connection for model downloads (first run)
- Sufficient disk space (>1GB for models)
- Memory: 4GB+ recommended

## Continuous Integration

### GitHub Actions Example
```yaml
name: Integration Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: pip install -r python_backend/requirements.txt
      - run: npm install
      - run: ./run_all_integration_tests.sh
```

## Troubleshooting

### Common Issues

#### Python Tests Failing
- **Issue**: Model files not found
- **Solution**: Ensure `trained_llm_for_claim_classification/` directory exists
- **Command**: Check with `ls -la trained_llm_for_claim_classification/`

#### React Native Tests Failing
- **Issue**: Module import errors
- **Solution**: Run tests in Node.js environment, not React Native
- **Command**: Use `node` instead of `expo start`

#### Performance Issues
- **Issue**: Tests running slowly
- **Solution**: Reduce test data size or increase timeouts
- **Check**: Available memory and CPU usage

### Debug Mode

Enable verbose logging:
```bash
# Python tests
PYTHONPATH=. python -v python_backend/test_complete_integration.py

# Node.js tests
DEBUG=* node ClimateApp/services/__tests__/nodeCompatibleTests.js
```

## Contributing

### Adding New Tests

1. **Python Tests**: Add to `python_backend/test_complete_integration.py`
2. **React Native Tests**: Add to appropriate test file in `ClimateApp/services/__tests__/`
3. **Follow naming convention**: `test_*` for Python, `test*` for JavaScript
4. **Include error cases**: Test both success and failure scenarios
5. **Update documentation**: Add test descriptions to this file

### Test Guidelines

- **Isolation**: Each test should be independent
- **Cleanup**: Clean up test data after each test
- **Assertions**: Use clear, descriptive assertion messages
- **Coverage**: Aim for >80% code coverage
- **Performance**: Keep test execution time reasonable

## Results Interpretation

### Success Criteria
- All test suites pass (100% success rate)
- Performance benchmarks met
- No memory leaks or resource issues
- Error handling works correctly

### Failure Analysis
- Check specific test failure messages
- Review system requirements
- Verify file permissions and paths
- Check network connectivity if applicable

### Reporting
Test results include:
- Total tests run
- Pass/fail counts
- Execution time
- Performance metrics
- Error details
- System status summary

## Maintenance

### Regular Tasks
- Update test data as system evolves
- Review performance benchmarks quarterly
- Update dependencies and fix compatibility issues
- Add tests for new features

### Version Compatibility
- Tests are designed to work with current system version
- Update tests when making breaking changes
- Maintain backward compatibility where possible
- Document any version-specific requirements

---

For questions or issues with the integration tests, please refer to the main project documentation or create an issue in the project repository.