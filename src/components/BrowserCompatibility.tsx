/**
 * Browser Compatibility Component with Toggle Functionality
 * Initializes browser compatibility features and provides testing interface
 */

import React, { useEffect, useState } from 'react';
import { initializeBrowserCompatibility, browserInfo, featureSupport } from '../utils/browserCompatibility';
import { runBrowserCompatibilityTests, quickCompatibilityCheck, type TestSuite } from '../utils/testingUtilities';
import { ChevronDown, ChevronUp, Shield, AlertTriangle, CheckCircle, XCircle, Play } from 'lucide-react';

interface BrowserCompatibilityProps {
  showTestResults?: boolean;
  autoRunTests?: boolean;
  defaultOpen?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const BrowserCompatibility: React.FC<BrowserCompatibilityProps> = ({
  showTestResults = false,
  autoRunTests = false,
  defaultOpen = false,
  position = 'bottom-left'
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
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

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4';
    }
  };

  const getCompatibilityStatus = () => {
    if (compatibilityWarning) return 'warning';
    if (!isInitialized) return 'loading';
    return 'good';
  };

  const getStatusIcon = () => {
    const status = getCompatibilityStatus();
    switch (status) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'loading':
        return <Shield className="w-4 h-4 text-muted-foreground animate-pulse" />;
      case 'good':
      default:
        return <Shield className="w-4 h-4 text-green-500" />;
    }
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50 max-w-md`}>
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg">
        {/* Header with toggle */}
        <div 
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium text-foreground">Browser Compatibility</span>
            {compatibilityWarning && (
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        {/* Collapsible content */}
        {isOpen && (
          <div className="border-t border-border p-3 space-y-4 max-h-96 overflow-y-auto">
            {/* Compatibility Warning */}
            {compatibilityWarning && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-yellow-500 font-medium text-sm">Compatibility Warning</span>
                    <p className="text-yellow-400 text-xs mt-1">{compatibilityWarning}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Browser Information */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Shield className="w-3 h-3" />
                Browser Information
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Browser:</span>
                  <span className="text-foreground font-mono">{browserInfo.name} {browserInfo.version}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Engine:</span>
                  <span className="text-foreground font-mono">{browserInfo.engine}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Platform:</span>
                  <span className="text-foreground font-mono">{browserInfo.platform}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Device:</span>
                  <span className="text-foreground font-mono">
                    {browserInfo.isMobile ? 'Mobile' : browserInfo.isTablet ? 'Tablet' : 'Desktop'}
                  </span>
                </div>
              </div>
            </div>

            {/* Feature Support */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Feature Support</h4>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {Object.entries(featureSupport).slice(0, 8).map(([feature, supported]) => (
                  <div key={feature} className="flex items-center gap-2">
                    {supported ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-500" />
                    )}
                    <span className="text-muted-foreground capitalize truncate">
                      {feature.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
              {Object.keys(featureSupport).length > 8 && (
                <p className="text-xs text-muted-foreground mt-2">
                  +{Object.keys(featureSupport).length - 8} more features
                </p>
              )}
            </div>

            {/* Test Controls */}
            <div className="flex gap-2 pt-2 border-t border-border">
              <button
                onClick={runTests}
                disabled={isTestingRunning}
                className="flex-1 flex items-center justify-center gap-1 text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                {isTestingRunning ? (
                  <>
                    <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    Run Tests
                  </>
                )}
              </button>
            </div>

            {/* Test Results */}
            {testResults.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Test Results</h4>
                <div className="space-y-2">
                  {testResults.slice(0, 3).map((suite, index) => (
                    <div key={index} className="bg-muted/50 rounded p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground">{suite.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{suite.overallScore}/100</span>
                          {suite.passed ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {suite.results.filter(r => r.passed).length}/{suite.results.length} tests passed
                      </div>
                    </div>
                  ))}
                  {testResults.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{testResults.length - 3} more test suites
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>


  );
};

export default BrowserCompatibility;