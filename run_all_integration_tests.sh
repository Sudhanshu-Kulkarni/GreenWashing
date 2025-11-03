#!/bin/bash

# Comprehensive Integration Test Runner for ESG Claim Verification System
# Runs all integration tests: Python backend, React Native components, and end-to-end workflows

set -e  # Exit on any error

echo "============================================================"
echo "ESG CLAIM VERIFICATION - COMPREHENSIVE INTEGRATION TESTS"
echo "============================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_SUITES=0
PASSED_SUITES=0
FAILED_SUITES=0
SKIPPED_SUITES=0

# Function to run a test suite
run_test_suite() {
    local suite_name="$1"
    local test_command="$2"
    local description="$3"
    
    TOTAL_SUITES=$((TOTAL_SUITES + 1))
    
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}Running: $suite_name${NC}"
    if [ -n "$description" ]; then
        echo -e "${BLUE}Description: $description${NC}"
    fi
    echo -e "${BLUE}================================================${NC}"
    echo ""
    
    # Run the test command
    if eval "$test_command"; then
        echo ""
        echo -e "${GREEN}✓ $suite_name PASSED${NC}"
        PASSED_SUITES=$((PASSED_SUITES + 1))
        return 0
    else
        echo ""
        echo -e "${RED}✗ $suite_name FAILED${NC}"
        FAILED_SUITES=$((FAILED_SUITES + 1))
        return 1
    fi
}

# Function to print final summary
print_final_summary() {
    local success_rate=0
    if [ $TOTAL_SUITES -gt 0 ]; then
        success_rate=$(( (PASSED_SUITES * 100) / TOTAL_SUITES ))
    fi
    
    echo ""
    echo "============================================================"
    echo "COMPREHENSIVE INTEGRATION TEST RESULTS"
    echo "============================================================"
    echo "Total Test Suites: $TOTAL_SUITES"
    echo -e "Passed: ${GREEN}$PASSED_SUITES${NC}"
    echo -e "Failed: ${RED}$FAILED_SUITES${NC}"
    echo -e "Skipped: ${YELLOW}$SKIPPED_SUITES${NC}"
    echo "Success Rate: $success_rate%"
    echo ""
    
    if [ $FAILED_SUITES -eq 0 ]; then
        echo -e "${GREEN}🎉 ALL INTEGRATION TESTS PASSED!${NC}"
        echo -e "${GREEN}The ESG Claim Verification system is ready for production use.${NC}"
        echo ""
        echo "Next Steps:"
        echo "• Deploy the system to your target environment"
        echo "• Set up continuous integration to run these tests regularly"
        echo "• Monitor system performance in production"
        echo "• Consider adding more test cases as the system evolves"
    else
        echo -e "${RED}❌ SOME INTEGRATION TESTS FAILED${NC}"
        echo -e "${RED}Please review the failed tests above and fix the underlying issues.${NC}"
        echo ""
        echo "Troubleshooting Tips:"
        echo "• Check that all dependencies are properly installed"
        echo "• Verify Python backend configuration (model files, CSV data)"
        echo "• Ensure React Native environment is set up correctly"
        echo "• Review error messages for specific guidance"
    fi
    
    echo "============================================================"
}

# Start testing
echo "Starting comprehensive integration tests..."
echo "This will test the complete ESG claim verification pipeline."
echo ""

# Test 1: Python Backend Integration Tests
echo -e "${YELLOW}Phase 1: Python Backend Integration Tests${NC}"
echo "Testing Python NLP pipeline, claim classification, and ESG verification..."
echo ""

if run_test_suite \
    "Python Backend Integration" \
    "python python_backend/test_complete_integration.py" \
    "Tests Python NLP pipeline with known input/output pairs"; then
    echo "Python backend tests completed successfully."
else
    echo -e "${YELLOW}Warning: Python backend tests failed. This may be due to missing dependencies.${NC}"
    echo "The system can still function with React Native components only."
fi

echo ""

# Test 2: React Native Component Integration Tests  
echo -e "${YELLOW}Phase 2: React Native Component Integration Tests${NC}"
echo "Testing React Native services, data management, and UI components..."
echo ""

run_test_suite \
    "React Native Integration" \
    "node ClimateApp/services/__tests__/nodeCompatibleTests.js" \
    "Tests React Native services and data management components"

echo ""

# Test 3: System Requirements and Configuration
echo -e "${YELLOW}Phase 3: System Requirements Validation${NC}"
echo "Validating system configuration and dependencies..."
echo ""

# Check if required files exist
echo "Checking system requirements..."

# Check Python backend files
if [ -f "python_backend/nlp_processor.py" ] && [ -f "python_backend/config.py" ]; then
    echo "✓ Python backend files found"
    PYTHON_BACKEND_AVAILABLE=true
else
    echo "⚠ Python backend files missing"
    PYTHON_BACKEND_AVAILABLE=false
fi

# Check trained model
if [ -d "trained_llm_for_claim_classification/best_finetuned_model" ]; then
    echo "✓ Trained LLM model found"
    MODEL_AVAILABLE=true
else
    echo "⚠ Trained LLM model missing"
    MODEL_AVAILABLE=false
fi

# Check ESG data
if [ -f "esg_lookup_2020_2025.csv" ]; then
    echo "✓ ESG lookup data found"
    ESG_DATA_AVAILABLE=true
else
    echo "⚠ ESG lookup data missing"
    ESG_DATA_AVAILABLE=false
fi

# Check React Native services
if [ -f "ClimateApp/services/dataService.js" ] && [ -f "ClimateApp/services/pythonBridge.js" ]; then
    echo "✓ React Native services found"
    RN_SERVICES_AVAILABLE=true
else
    echo "✗ React Native services missing"
    RN_SERVICES_AVAILABLE=false
fi

echo ""

# Test 4: End-to-End Workflow Simulation
echo -e "${YELLOW}Phase 4: End-to-End Workflow Validation${NC}"
echo "Simulating complete document processing workflow..."
echo ""

# Create a simple end-to-end test
cat > temp_e2e_test.js << 'EOF'
// Simple end-to-end workflow test
import { DataService } from './ClimateApp/services/dataService.js';

console.log('Testing end-to-end workflow simulation...');

try {
    // Clear existing data
    DataService.clearAllData();
    
    // Simulate document processing workflow
    const mockDocument = {
        filename: 'Apple_Sustainability_Report_2023.pdf',
        size: '2.5 MB',
        status: 'completed',
        processingMode: 'Python',
        claims: [
            {
                id: 1,
                text: 'We reduced our carbon emissions by 25% in 2023.',
                category: 'emissions',
                confidence: 0.92,
                status: 'verified',
                evidence: 3,
                reasoning: 'Found matching data in ESG database'
            },
            {
                id: 2,
                text: 'Our renewable energy usage reached 100% of operations.',
                category: 'renewable_energy',
                confidence: 0.88,
                status: 'questionable',
                evidence: 2,
                reasoning: 'Partial match found'
            }
        ]
    };
    
    // Add document
    const addedDoc = DataService.addDocument(mockDocument);
    console.log('✓ Document added successfully');
    
    // Test retrieval
    const retrievedDoc = DataService.getDocumentById(addedDoc.id);
    console.log('✓ Document retrieved successfully');
    
    // Test claims filtering
    const verifiedClaims = DataService.filterClaimsByStatus('verified');
    const questionableClaims = DataService.filterClaimsByStatus('questionable');
    console.log(`✓ Claims filtered: ${verifiedClaims.length} verified, ${questionableClaims.length} questionable`);
    
    // Test statistics
    const stats = DataService.calculateOverallStats();
    console.log(`✓ Statistics calculated: ${stats.totalDocuments} docs, ${stats.totalClaims} claims`);
    
    console.log('✓ End-to-end workflow simulation completed successfully');
    process.exit(0);
    
} catch (error) {
    console.error('✗ End-to-end workflow simulation failed:', error.message);
    process.exit(1);
}
EOF

run_test_suite \
    "End-to-End Workflow Simulation" \
    "node temp_e2e_test.js" \
    "Simulates complete document processing workflow"

# Cleanup temporary test file
rm -f temp_e2e_test.js

echo ""

# Print system status summary
echo -e "${YELLOW}System Status Summary:${NC}"
echo "====================="

if [ "$PYTHON_BACKEND_AVAILABLE" = true ]; then
    echo -e "Python Backend: ${GREEN}Available${NC}"
else
    echo -e "Python Backend: ${YELLOW}Missing${NC}"
fi

if [ "$MODEL_AVAILABLE" = true ]; then
    echo -e "Trained Model: ${GREEN}Available${NC}"
else
    echo -e "Trained Model: ${YELLOW}Missing${NC}"
fi

if [ "$ESG_DATA_AVAILABLE" = true ]; then
    echo -e "ESG Data: ${GREEN}Available${NC}"
else
    echo -e "ESG Data: ${YELLOW}Missing${NC}"
fi

if [ "$RN_SERVICES_AVAILABLE" = true ]; then
    echo -e "React Native Services: ${GREEN}Available${NC}"
else
    echo -e "React Native Services: ${RED}Missing${NC}"
fi

echo ""

# Print final summary
print_final_summary

# Exit with appropriate code
if [ $FAILED_SUITES -eq 0 ]; then
    exit 0
else
    exit 1
fi