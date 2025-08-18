#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Runs all ML-related tests including unit, integration, performance, accuracy, and compatibility tests
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${description}`, 'cyan');
  log(`Running: ${command}`, 'blue');
  
  try {
    const output = execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    log(`✅ ${description} completed successfully`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

function generateTestReport(results) {
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  
  log('\n' + '='.repeat(60), 'bright');
  log('COMPREHENSIVE TEST REPORT', 'bright');
  log('='.repeat(60), 'bright');
  
  log(`\nTotal Test Suites: ${totalTests}`);
  log(`Passed: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow');
  log(`Failed: ${failedTests}`, failedTests === 0 ? 'green' : 'red');
  
  log('\nDetailed Results:', 'bright');
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    const color = result.passed ? 'green' : 'red';
    log(`${status} ${result.name}`, color);
  });
  
  if (failedTests === 0) {
    log('\n🎉 All tests passed! Your ML implementation is ready for production.', 'green');
  } else {
    log(`\n⚠️  ${failedTests} test suite(s) failed. Please review and fix the issues.`, 'yellow');
  }
  
  return failedTests === 0;
}

function checkTestFiles() {
  const testFiles = [
    'src/utils/__tests__/mlUtils.test.ts',
    'src/utils/__tests__/modelManager.test.ts',
    'src/utils/__tests__/sentimentAnalysis.test.ts',
    'src/utils/__tests__/collaborativeFiltering.test.ts',
    'src/components/__tests__/SentimentAnalysisDemo.integration.test.tsx',
    'src/components/__tests__/RecommendationDemo.integration.test.tsx',
    'src/test/performance.test.ts',
    'src/test/accuracy.test.ts',
    'src/test/browser-compatibility.test.ts'
  ];
  
  const missingFiles = testFiles.filter(file => !fs.existsSync(path.join(process.cwd(), file)));
  
  if (missingFiles.length > 0) {
    log('❌ Missing test files:', 'red');
    missingFiles.forEach(file => log(`  - ${file}`, 'red'));
    return false;
  }
  
  log('✅ All test files are present', 'green');
  return true;
}

async function main() {
  log('🚀 Starting Comprehensive ML Testing Suite', 'bright');
  log('This will run unit tests, integration tests, performance benchmarks, accuracy validation, and browser compatibility tests.\n');
  
  // Check if all test files exist
  if (!checkTestFiles()) {
    log('❌ Test setup incomplete. Please ensure all test files are created.', 'red');
    process.exit(1);
  }
  
  const testSuites = [
    {
      name: 'Unit Tests - ML Utilities',
      command: 'npm run test -- src/utils/__tests__/mlUtils.test.ts --run',
      description: 'Testing core ML utility functions'
    },
    {
      name: 'Unit Tests - Model Manager',
      command: 'npm run test -- src/utils/__tests__/modelManager.test.ts --run',
      description: 'Testing model loading and management'
    },
    {
      name: 'Unit Tests - Sentiment Analysis',
      command: 'npm run test -- src/utils/__tests__/sentimentAnalysis.test.ts --run',
      description: 'Testing BERT sentiment analysis implementation'
    },
    {
      name: 'Unit Tests - Collaborative Filtering',
      command: 'npm run test -- src/utils/__tests__/collaborativeFiltering.test.ts --run',
      description: 'Testing recommendation engine implementation'
    },
    {
      name: 'Integration Tests - Sentiment Demo',
      command: 'npm run test -- src/components/__tests__/SentimentAnalysisDemo.integration.test.tsx --run',
      description: 'Testing sentiment analysis React component integration'
    },
    {
      name: 'Integration Tests - Recommendation Demo',
      command: 'npm run test -- src/components/__tests__/RecommendationDemo.integration.test.tsx --run',
      description: 'Testing recommendation React component integration'
    },
    {
      name: 'Performance Benchmarks',
      command: 'npm run test -- src/test/performance.test.ts --run',
      description: 'Running performance benchmarks across different scenarios'
    },
    {
      name: 'Accuracy Validation',
      command: 'npm run test -- src/test/accuracy.test.ts --run',
      description: 'Validating model accuracy against known datasets'
    },
    {
      name: 'Browser Compatibility',
      command: 'npm run test -- src/test/browser-compatibility.test.ts --run',
      description: 'Testing WebGL and WASM compatibility across browsers'
    }
  ];
  
  const results = [];
  
  for (const suite of testSuites) {
    const passed = runCommand(suite.command, suite.description);
    results.push({
      name: suite.name,
      passed
    });
    
    // Add a small delay between test suites
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Generate comprehensive report
  const allPassed = generateTestReport(results);
  
  // Additional checks
  log('\n' + '='.repeat(60), 'bright');
  log('ADDITIONAL VALIDATIONS', 'bright');
  log('='.repeat(60), 'bright');
  
  // Check test coverage
  log('\nRunning test coverage analysis...', 'cyan');
  const coveragePassed = runCommand(
    'npm run test -- --coverage --run',
    'Generating test coverage report'
  );
  
  // Check for TypeScript errors
  log('\nChecking TypeScript compilation...', 'cyan');
  const tscPassed = runCommand(
    'npx tsc --noEmit',
    'TypeScript type checking'
  );
  
  // Check linting
  log('\nRunning ESLint checks...', 'cyan');
  const lintPassed = runCommand(
    'npm run lint',
    'Code quality and style checks'
  );
  
  // Final summary
  log('\n' + '='.repeat(60), 'bright');
  log('FINAL SUMMARY', 'bright');
  log('='.repeat(60), 'bright');
  
  const finalResults = [
    { name: 'Test Suites', passed: allPassed },
    { name: 'Test Coverage', passed: coveragePassed },
    { name: 'TypeScript Check', passed: tscPassed },
    { name: 'Code Quality', passed: lintPassed }
  ];
  
  const allFinalPassed = finalResults.every(r => r.passed);
  
  finalResults.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    const color = result.passed ? 'green' : 'red';
    log(`${status} ${result.name}`, color);
  });
  
  if (allFinalPassed) {
    log('\n🎉 ALL VALIDATIONS PASSED! 🎉', 'green');
    log('Your ML implementation is production-ready with comprehensive test coverage.', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some validations failed. Please address the issues before deployment.', 'yellow');
    process.exit(1);
  }
}

// Handle process interruption
process.on('SIGINT', () => {
  log('\n\n❌ Test execution interrupted by user', 'red');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log('\n❌ Uncaught exception during test execution:', 'red');
  log(error.message, 'red');
  process.exit(1);
});

// Run the main function
main().catch(error => {
  log('\n❌ Test runner failed:', 'red');
  log(error.message, 'red');
  process.exit(1);
});