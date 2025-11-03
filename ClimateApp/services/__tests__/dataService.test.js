// Test file for DataService functionality
import { DataService } from '../dataService.js';

// Enhanced test runner for DataService functionality
function runTests() {
  console.log('Running DataService tests...');
  
  // Clear any existing data to start fresh
  DataService.clearAllData();
  
  // Test 1: Empty state handling
  const emptyDocuments = DataService.getAllDocuments();
  if (emptyDocuments.length !== 0) {
    throw new Error(`Expected 0 documents in empty state, got ${emptyDocuments.length}`);
  }
  console.log('✓ Empty state handling works correctly');
  
  // Test 2: Add test document
  const testDocument = {
    filename: 'test_sustainability_report.pdf',
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
        reasoning: 'Partial match found, requires verification'
      },
      {
        id: 3,
        text: 'Water consumption decreased by 15% compared to baseline.',
        category: 'water',
        confidence: 0.75,
        status: 'unverified',
        evidence: 1,
        reasoning: 'No matching data found in database'
      }
    ]
  };
  
  const addedDocument = DataService.addDocument(testDocument);
  if (!addedDocument || !addedDocument.id) {
    throw new Error('Failed to add test document');
  }
  console.log('✓ Document addition works correctly');
  
  // Test 3: Get all documents
  const allDocuments = DataService.getAllDocuments();
  if (allDocuments.length !== 1) {
    throw new Error(`Expected 1 document, got ${allDocuments.length}`);
  }
  console.log('✓ getAllDocuments returns correct count');
  
  // Test 4: Get document by ID
  const retrievedDocument = DataService.getDocumentById(addedDocument.id);
  if (!retrievedDocument || retrievedDocument.id !== addedDocument.id) {
    throw new Error('Failed to retrieve document by ID');
  }
  console.log('✓ getDocumentById works correctly');
  
  // Test 5: Get all claims
  const allClaims = DataService.getAllClaims();
  if (allClaims.length !== 3) {
    throw new Error(`Expected 3 claims, got ${allClaims.length}`);
  }
  console.log('✓ getAllClaims returns correct count');
  
  // Test 6: Filter claims by status
  const verifiedClaims = DataService.filterClaimsByStatus('verified');
  const questionableClaims = DataService.filterClaimsByStatus('questionable');
  const unverifiedClaims = DataService.filterClaimsByStatus('unverified');
  
  if (verifiedClaims.length !== 1) {
    throw new Error(`Expected 1 verified claim, got ${verifiedClaims.length}`);
  }
  if (questionableClaims.length !== 1) {
    throw new Error(`Expected 1 questionable claim, got ${questionableClaims.length}`);
  }
  if (unverifiedClaims.length !== 1) {
    throw new Error(`Expected 1 unverified claim, got ${unverifiedClaims.length}`);
  }
  console.log('✓ Claims filtering by status works correctly');
  
  // Test 7: Get flagged claims
  const flaggedClaims = DataService.getFlaggedClaims();
  if (flaggedClaims.length !== 2) { // questionable + unverified
    throw new Error(`Expected 2 flagged claims, got ${flaggedClaims.length}`);
  }
  console.log('✓ getFlaggedClaims works correctly');
  
  // Test 8: Calculate overall stats
  const overallStats = DataService.calculateOverallStats();
  const expectedStats = {
    totalDocuments: 1,
    totalClaims: 3,
    verified: 1,
    questionable: 1,
    unverified: 1,
    flagged: 2
  };
  
  for (const [key, expectedValue] of Object.entries(expectedStats)) {
    if (overallStats[key] !== expectedValue) {
      throw new Error(`Expected ${key} to be ${expectedValue}, got ${overallStats[key]}`);
    }
  }
  console.log('✓ Overall stats calculation works correctly');
  
  // Test 9: Get claims for specific document
  const documentClaims = DataService.getClaimsByDocumentId(addedDocument.id);
  if (documentClaims.length !== 3) {
    throw new Error(`Expected 3 claims for document, got ${documentClaims.length}`);
  }
  console.log('✓ getClaimsByDocumentId works correctly');
  
  // Test 10: Search documents
  const searchResults = DataService.searchDocuments('sustainability');
  if (searchResults.length !== 1) {
    throw new Error(`Expected 1 search result, got ${searchResults.length}`);
  }
  console.log('✓ Document search works correctly');
  
  // Test 11: Get documents by status
  const completedDocs = DataService.getDocumentsByStatus('completed');
  const processingDocs = DataService.getDocumentsByStatus('processing');
  
  if (completedDocs.length !== 1) {
    throw new Error(`Expected 1 completed document, got ${completedDocs.length}`);
  }
  if (processingDocs.length !== 0) {
    throw new Error(`Expected 0 processing documents, got ${processingDocs.length}`);
  }
  console.log('✓ Documents filtering by status works correctly');
  
  // Test 12: Error handling
  try {
    DataService.getDocumentById('nonexistent_id');
    throw new Error('Expected error for nonexistent document ID');
  } catch (error) {
    if (!error.message.includes('not found')) {
      throw new Error(`Expected "not found" error, got: ${error.message}`);
    }
  }
  console.log('✓ Error handling works correctly');
  
  // Test 13: Data validation
  const invalidDocument = { invalid: 'data' };
  try {
    DataService.addDocument(invalidDocument);
    // Should still work due to sanitization
    console.log('✓ Data validation and sanitization works correctly');
  } catch (error) {
    throw new Error(`Data validation failed: ${error.message}`);
  }
  
  console.log('All DataService tests completed successfully!');
  return true;
}

// Export for potential use in other test frameworks
export { runTests };

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runTests();
}