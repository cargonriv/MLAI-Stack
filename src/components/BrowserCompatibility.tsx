/**
 * Browser Compatibility Component
 * Initializes browser compatibility features and provides testing interface
 */

import React, { useEffect, useState } from 'react';
import { initializeBrowserCompatibility, browserInfo, featureSupport } from '../utils/browserCompatibility';
import { runBrowserCompatibilityTests, quickCompatibilityCheck, type TestSuite } from '../utils/testingUtilities';

interface BrowserCompatibilityProps {
  showTestResults?: boolean;
  autoRunTests?: boolean;
}

export const BrowserCompatibility: React.FC<BrowserCompatibilityProps> = ({
  showTestResults = false,
  autoRunTests = false
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [testResults, setTestResults] = useState<TestSuite[]>([]);
  const [isTestingRunning, setIsTestingRunning] = useState(false);
  const [compatibilityWarning, setCompatibilityWarning] = useState<string | null>(null);

  useEffect(() => {
    // Initialize browser compatibility features
    try {
      initializeBrowserCompatibility();
      setIsInitialized(true);
      
      // Quick compatibility check
      const isCompatible = quickCompatibilityCheck();
      if (!isCompatible) {
        setCompatibilityWarning(
          'Your browser may not support all features. Some functionality might be limited.'
        );
      }
      
      // Auto-run tests if requested
      if (autoRunTests) {
        runTests();
      }
    } catch (error) {
      console.error('Browser compatibility initialization failed:', error);
      setCompatibilityWarning('Browser compatibility check failed. Please update your browser.');
    }
  }, [autoRunTests]);

  const runTests = async () => {
    setIsTestingRunning(true);
    try {
      await runBrowserCompatibilityTests();
      // Get results from global variable set by testing utility
      const results = (window as unknown as { __browserCompatibilityResults?: { results: TestSuite[] } }).__browserCompatibilityResults?.results || [];
      setTestResults(results);
    } catch (error) {
      console.error('Browser compatibility tests failed:', error);
    } finally {
      setIsTestingRunning(false);
    }
  };

  if (!showTestResults && !compatibilityWarning) {
    return null; // Component is working silently
  }

  return (
    <div className="browser-compatibility">
      {compatibilityWarning && (
        <div className="compatibility-warning bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-yellow-500 font-medium">Browser Compatibility Warning</span>
          </div>
          <p className="text-yellow-400 mt-2">{compatibilityWarning}</p>
        </div>
      )}

      {showTestResults && (
        <div className="compatibility-testing bg-bg-secondary rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-fg-primary">Browser Compatibility Testing</h3>
            <button
              onClick={runTests}
              disabled={isTestingRunning}
              className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-colors disabled:opacity-50"
            >
              {isTestingRunning ? 'Running Tests...' : 'Run Tests'}
            </button>
          </div>

          {/* Browser Information */}
          <div className="browser-info mb-6">
            <h4 className="text-md font-medium text-fg-primary mb-2">Browser Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-fg-tertiary">Browser:</span>
                <span className="text-fg-primary ml-2">{browserInfo.name} {browserInfo.version}</span>
              </div>
              <div>
                <span className="text-fg-tertiary">Engine:</span>
                <span className="text-fg-primary ml-2">{browserInfo.engine}</span>
              </div>
              <div>
                <span className="text-fg-tertiary">Platform:</span>
                <span className="text-fg-primary ml-2">{browserInfo.platform}</span>
              </div>
              <div>
                <span className="text-fg-tertiary">Device:</span>
                <span className="text-fg-primary ml-2">
                  {browserInfo.isMobile ? 'Mobile' : browserInfo.isTablet ? 'Tablet' : 'Desktop'}
                </span>
              </div>
            </div>
          </div>

          {/* Feature Support */}
          <div className="feature-support mb-6">
            <h4 className="text-md font-medium text-fg-primary mb-2">Feature Support</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
              {Object.entries(featureSupport).map(([feature, supported]) => (
                <div key={feature} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${supported ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-fg-secondary capitalize">
                    {feature.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="test-results">
              <h4 className="text-md font-medium text-fg-primary mb-4">Test Results</h4>
              <div className="space-y-4">
                {testResults.map((suite, index) => (
                  <div key={index} className="test-suite bg-bg-tertiary rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-fg-primary">{suite.name}</h5>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-fg-secondary">{suite.overallScore}/100</span>
                        <span className={`w-3 h-3 rounded-full ${suite.passed ? 'bg-green-500' : 'bg-red-500'}`} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {suite.results.map((result, resultIndex) => (
                        <div key={resultIndex} className="flex items-start gap-3 text-sm">
                          <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${result.passed ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-fg-primary">{result.name}</span>
                              {result.score && (
                                <span className="text-fg-tertiary">{Math.round(result.score)}/100</span>
                              )}
                            </div>
                            {result.details && (
                              <p className="text-fg-secondary mt-1">{result.details}</p>
                            )}
                            {result.recommendations && result.recommendations.length > 0 && (
                              <div className="mt-1">
                                <p className="text-yellow-400 text-xs">
                                  Recommendations: {result.recommendations.join(', ')}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isTestingRunning && (
            <div className="testing-progress flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <div className="animate-spin w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full" />
                <span className="text-fg-secondary">Running compatibility tests...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BrowserCompatibility;