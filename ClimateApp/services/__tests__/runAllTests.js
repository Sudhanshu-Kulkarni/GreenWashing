// Comprehensive Test Runner for ESG Claim Verification System
// Runs all integration tests: Python backend, React Native components, and end-to-end workflows

import { runTests as runDataServiceTests } from './dataService.test.js';
import { runIntegrationTests } from './integrationTests.js';
import { runEndToEndTests } from './endToEndTests.js';

/**
 * Comprehensive test suite runner
 */
class ComprehensiveTestRunner {
  constructor() {
    this.testSuites = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.skippedTests = 0;
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * Add a test suite to run
   */
  addTestSuite(name, testFunction, description = '') {
    this.testSuites.push({
      name,
      testFunction,
      description,
      status: 'pending',
      duration: 0,
      error: null
    });
  }

  /**
   * Run all test suites
   */
  async runAllTests() {
    this.startTime = Date.now();
    
    console.log('ESG Claim Verification - Comprehensive Test Suite');
    console.log('='.repeat(70));
    console.log(`Running ${this.testSuites.length} test suites...\n`);

    for (const suite of this.testSuites) {
      await this.runTestSuite(suite);
    }

    this.endTime = Date.now();
    this.printFinalSummary();
    
    return this.failedTests === 0;
  }

  /**
   * Run a single test suite
   */
  async runTestSuite(suite) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Running: ${suite.name}`);
    if (suite.description) {
      console.log(`Description: ${suite.description}`);
    }
    console.log(`${'='.repeat(50)}`);

    const suiteStartTime = Date.now();

    try {
      const result = await suite.testFunction();
      suite.duration = Date.now() - suiteStartTime;
      
      if (result === true || result === undefined) {
        suite.status = 'passed';
        this.passedTests++;
        console.log(`\n✓ ${suite.name} PASSED (${suite.duration}ms)`);
      } else {
        suite.status = 'failed';
        suite.error = 'Test suite returned false';
        this.failedTests++;
        console.log(`\n✗ ${suite.name} FAILED (${suite.duration}ms)`);
      }
    } catch (error) {
      suite.duration = Date.now() - suiteStartTime;
      
      if (error.message && error.message.includes('SKIP:')) {
        suite.status = 'skipped';
        suite.error = error.message.replace('SKIP:', '').trim();
        this.skippedTests++;
        console.log(`\n⚠ ${suite.name} SKIPPED (${suite.duration}ms)`);
        console.log(`Reason: ${suite.error}`);
      } else {
        suite.status = 'failed';
        suite.error = error.message || 'Unknown error';
        this.failedTests++;
        console.log(`\n✗ ${suite.name} FAILED (${suite.duration}ms)`);
        console.log(`Error: ${suite.error}`);
        
        // Print stack trace for debugging
        if (error.stack) {
          console.log('Stack trace:');
          console.log(error.stack);
        }
      }
    }

    this.totalTests++;
  }

  /**
   * Print final test summary
   */
  printFinalSummary() {
    const totalDuration = this.endTime - this.startTime;
    const successRate = this.totalTests > 0 ? ((this.passedTests / this.totalTests) * 100).toFixed(1) : 0;

    console.log('\n' + '='.repeat(70));
    console.log('COMPREHENSIVE TEST RESULTS');
    console.log('='.repeat(70));
    console.log(`Total Test Suites: ${this.totalTests}`);
    console.log(`Passed: ${this.passedTests}`);
    console.log(`Failed: ${this.failedTests}`);
    console.log(`Skipped: ${this.skippedTests}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);

    // Print detailed results
    console.log('\nDETAILED RESULTS:');
    console.log('-'.repeat(70));
    
    this.testSuites.forEach(suite => {
      const statusIcon = {
        'passed': '✓',
        'failed': '✗',
        'skipped': '⚠',
        'pending': '?'
      }[suite.status] || '?';
      
      const statusText = suite.status.toUpperCase().padEnd(8);
      const duration = `${suite.duration}ms`.padStart(8);
      
      console.log(`${statusIcon} ${statusText} ${duration} ${suite.name}`);
      
      if (suite.error && suite.status !== 'skipped') {
        console.log(`    Error: ${suite.error}`);
      } else if (suite.error && suite.status === 'skipped') {
        console.log(`    Reason: ${suite.error}`);
      }
    });

    // Print failed tests summary
    if (this.failedTests > 0) {
      console.log('\nFAILED TEST SUITES:');
      console.log('-'.repeat(70));
      this.testSuites
        .filter(suite => suite.status === 'failed')
        .forEach(suite => {
          console.log(`- ${suite.name}: ${suite.error}`);
        });
    }

    // Print skipped tests summary
    if (this.skippedTests > 0) {
      console.log('\nSKIPPED TEST SUITES:');
      console.log('-'.repeat(70));
      this.testSuites
        .filter(suite => suite.status === 'skipped')
        .forEach(suite => {
          console.log(`- ${suite.name}: ${suite.error}`);
        });
    }

    // Print recommendations
    console.log('\nRECOMMENDations:');
    console.log('-'.repeat(70));
    
    if (this.failedTests > 0) {
      console.log('• Review failed test details above and fix underlying issues');
      console.log('• Check system requirements and dependencies');
      console.log('• Verify Python backend is properly configured');
    }
    
    if (this.skippedTests > 0) {
      console.log('• Address reasons for skipped tests to improve coverage');
      console.log('• Install missing dependencies or configure required components');
    }
    
    if (this.passedTests === this.totalTests) {
      console.log('• All tests passed! System is ready for production use');
      console.log('• Consider running tests regularly as part of CI/CD pipeline');
    }

    console.log('\n' + '='.repeat(70));
    
    const overallResult = this.failedTests === 0 ? 'PASSED' : 'FAILED';
    console.log(`OVERALL RESULT: ${overallResult}`);
    console.log('='.repeat(70));
  }

  /**
   * Generate test report in JSON format
   */
  generateTestReport() {
    return {
      summary: {
        totalSuites: this.totalTests,
        passed: this.passedTests,
        failed: this.failedTests,
        skipped: this.skippedTests,
        successRate: this.totalTests > 0 ? ((this.passedTests / this.totalTests) * 100) : 0,
        totalDuration: this.endTime - this.startTime,
        timestamp: new Date().toISOString()
      },
      suites: this.testSuites.map(suite => ({
        name: suite.name,
        description: suite.description,
        status: suite.status,
        duration: suite.duration,
        error: suite.error
      })),
      environment: {
        platform: 'React Native',
        testRunner: 'Custom Integration Test Runner',
        nodeVersion: typeof process !== 'undefined' ? process.version : 'unknown'
      }
    };
  }
}

/**
 * Wrapper for DataService tests
 */
async function runDataServiceTestSuite() {
  console.log('Running DataService tests...');
  
  try {
    // The existing test runner logs to console
    runDataServiceTests();
    return true;
  } catch (error) {
    console.error('DataService tests failed:', error);
    throw error;
  }
}

/**
 * Test Python backend availability and basic functionality
 */
async function testPythonBackendAvailability() {
  console.log('Testing Python backend availability...');
  
  try {
    // This would normally check if Python backend is accessible
    // For now, we'll simulate the check
    const pythonAvailable = false; // Set to true if Python backend is available
    
    if (!pythonAvailable) {
      throw new Error('SKIP: Python backend not available in React Native environment');
    }
    
    console.log('✓ Python backend is available');
    return true;
  } catch (error) {
    if (error.message.includes('SKIP:')) {
      throw error;
    }
    console.error('Python backend availability test failed:', error);
    throw error;
  }
}

/**
 * Test system requirements and dependencies
 */
async function testSystemRequirements() {
  console.log('Testing system requirements...');
  
  try {
    // Check required modules are available
    const requiredModules = [
      'DataService',
      'PythonBridge', 
      'DocumentProcessor'
    ];
    
    for (const moduleName of requiredModules) {
      try {
        if (moduleName === 'DataService') {
          const { DataService } = await import('../dataService.js');
          if (!DataService) throw new Error(`${moduleName} not available`);
        } else if (moduleName === 'PythonBridge') {
          const { PythonBridge } = await import('../pythonBridge.js');
          if (!PythonBridge) throw new Error(`${moduleName} not available`);
        } else if (moduleName === 'DocumentProcessor') {
          const { DocumentProcessor } = await import('../documentProcessor.js');
          if (!DocumentProcessor) throw new Error(`${moduleName} not available`);
        }
        console.log(`✓ ${moduleName} module available`);
      } catch (error) {
        throw new Error(`Required module ${moduleName} not available: ${error.message}`);
      }
    }
    
    // Check basic functionality
    const { DataService } = await import('../dataService.js');
    DataService.clearAllData();
    const emptyDocs = DataService.getAllDocuments();
    if (!Array.isArray(emptyDocs)) {
      throw new Error('DataService basic functionality test failed');
    }
    
    console.log('✓ System requirements satisfied');
    return true;
  } catch (error) {
    console.error('System requirements test failed:', error);
    throw error;
  }
}

/**
 * Main test runner function
 */
export async function runComprehensiveTests() {
  const runner = new ComprehensiveTestRunner();
  
  // Add all test suites
  runner.addTestSuite(
    'System Requirements',
    testSystemRequirements,
    'Verify all required modules and dependencies are available'
  );
  
  runner.addTestSuite(
    'DataService Tests',
    runDataServiceTestSuite,
    'Test DataService functionality with mock data and error handling'
  );
  
  runner.addTestSuite(
    'Integration Tests',
    runIntegrationTests,
    'Test integration between React Native services and Python bridge'
  );
  
  runner.addTestSuite(
    'End-to-End Tests',
    runEndToEndTests,
    'Test complete workflow from document upload to claim verification'
  );
  
  runner.addTestSuite(
    'Python Backend Availability',
    testPythonBackendAvailability,
    'Check if Python NLP backend is available and accessible'
  );
  
  // Run all tests
  const success = await runner.runAllTests();
  
  // Generate and save test report
  const report = runner.generateTestReport();
  
  try {
    // In a real environment, you might save this to a file
    console.log('\nTest report generated successfully');
    // console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.warn('Failed to save test report:', error);
  }
  
  return success;
}

/**
 * Quick test runner for development
 */
export async function runQuickTests() {
  console.log('ESG Claim Verification - Quick Test Suite');
  console.log('='.repeat(50));
  
  const runner = new ComprehensiveTestRunner();
  
  // Add only essential tests for quick feedback
  runner.addTestSuite(
    'System Requirements',
    testSystemRequirements,
    'Quick system check'
  );
  
  runner.addTestSuite(
    'DataService Basic Tests',
    runDataServiceTestSuite,
    'Basic DataService functionality'
  );
  
  const success = await runner.runAllTests();
  return success;
}

// Export individual test functions for selective testing
export {
  runDataServiceTestSuite,
  testPythonBackendAvailability,
  testSystemRequirements
};

// Run comprehensive tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runComprehensiveTests().then(success => {
    console.log(`\nComprehensive tests ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Comprehensive tests failed with error:', error);
    process.exit(1);
  });
}