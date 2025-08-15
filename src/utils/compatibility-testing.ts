/**
 * Cross-Browser Compatibility Testing Utilities
 * Provides automated testing for browser compatibility and feature support
 */

import { detectBrowser, detectFeatureSupport, type BrowserInfo, type FeatureSupport } from './browser-detection';

export interface CompatibilityTestResult {
  testName: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
  recommendation?: string;
}

export interface CompatibilityReport {
  browser: BrowserInfo;
  features: FeatureSupport;
  tests: CompatibilityTestResult[];
  overallScore: number;
  criticalIssues: number;
  warnings: number;
}

/**
 * Run comprehensive compatibility tests
 */
export function runCompatibilityTests(): CompatibilityReport {
  const browser = detectBrowser();
  const features = detectFeatureSupport();
  const tests: CompatibilityTestResult[] = [];
  
  // Core CSS Feature Tests
  tests.push(...runCSSFeatureTests(features));
  
  // JavaScript API Tests
  tests.push(...runJavaScriptAPITests(features));
  
  // Browser-Specific Tests
  tests.push(...runBrowserSpecificTests(browser));
  
  // Performance Tests
  tests.push(...runPerformanceTests(browser));
  
  // Accessibility Tests
  tests.push(...runAccessibilityTests());
  
  // Calculate overall score and issue counts
  const criticalIssues = tests.filter(t => !t.passed && t.severity === 'error').length;
  const warnings = tests.filter(t => !t.passed && t.severity === 'warning').length;
  const passedTests = tests.filter(t => t.passed).length;
  const overallScore = Math.round((passedTests / tests.length) * 100);
  
  return {
    browser,
    features,
    tests,
    overallScore,
    criticalIssues,
    warnings
  };
}

/**
 * Test CSS feature compatibility
 */
function runCSSFeatureTests(features: FeatureSupport): CompatibilityTestResult[] {
  const tests: CompatibilityTestResult[] = [];
  
  tests.push({
    testName: 'CSS Grid Support',
    passed: features.cssGrid,
    message: features.cssGrid ? 'CSS Grid is supported' : 'CSS Grid is not supported',
    severity: features.cssGrid ? 'info' : 'warning',
    recommendation: features.cssGrid ? undefined : 'Use flexbox fallbacks for layout'
  });
  
  tests.push({
    testName: 'Flexbox Support',
    passed: features.flexbox,
    message: features.flexbox ? 'Flexbox is supported' : 'Flexbox is not supported',
    severity: features.flexbox ? 'info' : 'error',
    recommendation: features.flexbox ? undefined : 'Critical: Flexbox is required for modern layouts'
  });
  
  tests.push({
    testName: 'CSS Custom Properties',
    passed: features.customProperties,
    message: features.customProperties ? 'CSS Custom Properties are supported' : 'CSS Custom Properties are not supported',
    severity: features.customProperties ? 'info' : 'warning',
    recommendation: features.customProperties ? undefined : 'Use static color values as fallbacks'
  });
  
  tests.push({
    testName: 'Backdrop Filter',
    passed: features.backdropFilter,
    message: features.backdropFilter ? 'Backdrop filter is supported' : 'Backdrop filter is not supported',
    severity: features.backdropFilter ? 'info' : 'warning',
    recommendation: features.backdropFilter ? undefined : 'Use solid backgrounds with opacity as fallback'
  });
  
  tests.push({
    testName: 'CSS Clip Path',
    passed: features.clipPath,
    message: features.clipPath ? 'CSS clip-path is supported' : 'CSS clip-path is not supported',
    severity: features.clipPath ? 'info' : 'warning',
    recommendation: features.clipPath ? undefined : 'Use border-radius and overflow:hidden as fallback'
  });
  
  tests.push({
    testName: '3D Transforms',
    passed: features.transforms3d,
    message: features.transforms3d ? '3D transforms are supported' : '3D transforms are not supported',
    severity: features.transforms3d ? 'info' : 'warning',
    recommendation: features.transforms3d ? undefined : 'Use 2D transforms for animations'
  });
  
  tests.push({
    testName: 'CSS Animations',
    passed: features.animations,
    message: features.animations ? 'CSS animations are supported' : 'CSS animations are not supported',
    severity: features.animations ? 'info' : 'warning',
    recommendation: features.animations ? undefined : 'Provide static fallbacks for animated elements'
  });
  
  tests.push({
    testName: 'CSS Gradients',
    passed: features.gradients,
    message: features.gradients ? 'CSS gradients are supported' : 'CSS gradients are not supported',
    severity: features.gradients ? 'info' : 'warning',
    recommendation: features.gradients ? undefined : 'Use solid colors as fallbacks'
  });
  
  return tests;
}

/**
 * Test JavaScript API compatibility
 */
function runJavaScriptAPITests(features: FeatureSupport): CompatibilityTestResult[] {
  const tests: CompatibilityTestResult[] = [];
  
  tests.push({
    testName: 'Intersection Observer',
    passed: features.intersectionObserver,
    message: features.intersectionObserver ? 'Intersection Observer is supported' : 'Intersection Observer is not supported',
    severity: features.intersectionObserver ? 'info' : 'warning',
    recommendation: features.intersectionObserver ? undefined : 'Load polyfill for scroll-based animations'
  });
  
  tests.push({
    testName: 'Resize Observer',
    passed: features.resizeObserver,
    message: features.resizeObserver ? 'Resize Observer is supported' : 'Resize Observer is not supported',
    severity: features.resizeObserver ? 'info' : 'warning',
    recommendation: features.resizeObserver ? undefined : 'Use window resize events as fallback'
  });
  
  tests.push({
    testName: 'WebGL Support',
    passed: features.webGL,
    message: features.webGL ? 'WebGL is supported' : 'WebGL is not supported',
    severity: features.webGL ? 'info' : 'warning',
    recommendation: features.webGL ? undefined : 'Disable WebGL-based features'
  });
  
  tests.push({
    testName: 'Service Worker',
    passed: features.serviceWorker,
    message: features.serviceWorker ? 'Service Worker is supported' : 'Service Worker is not supported',
    severity: features.serviceWorker ? 'info' : 'warning',
    recommendation: features.serviceWorker ? undefined : 'Offline functionality will be limited'
  });
  
  tests.push({
    testName: 'WebAssembly',
    passed: features.webAssembly,
    message: features.webAssembly ? 'WebAssembly is supported' : 'WebAssembly is not supported',
    severity: features.webAssembly ? 'info' : 'info',
    recommendation: features.webAssembly ? undefined : 'Use JavaScript fallbacks for WASM features'
  });
  
  tests.push({
    testName: 'ES6 Modules',
    passed: features.es6Modules,
    message: features.es6Modules ? 'ES6 modules are supported' : 'ES6 modules are not supported',
    severity: features.es6Modules ? 'info' : 'error',
    recommendation: features.es6Modules ? undefined : 'Critical: Modern JavaScript features required'
  });
  
  return tests;
}

/**
 * Test browser-specific compatibility
 */
function runBrowserSpecificTests(browser: BrowserInfo): CompatibilityTestResult[] {
  const tests: CompatibilityTestResult[] = [];
  const version = parseInt(browser.version);
  
  // Chrome-specific tests
  if (browser.name === 'Chrome') {
    tests.push({
      testName: 'Chrome Version Compatibility',
      passed: version >= 88,
      message: `Chrome ${browser.version} ${version >= 88 ? 'is supported' : 'may have compatibility issues'}`,
      severity: version >= 88 ? 'info' : 'warning',
      recommendation: version >= 88 ? undefined : 'Update to Chrome 88+ for best experience'
    });
  }
  
  // Firefox-specific tests
  if (browser.name === 'Firefox') {
    tests.push({
      testName: 'Firefox Version Compatibility',
      passed: version >= 85,
      message: `Firefox ${browser.version} ${version >= 85 ? 'is supported' : 'may have compatibility issues'}`,
      severity: version >= 85 ? 'info' : 'warning',
      recommendation: version >= 85 ? undefined : 'Update to Firefox 85+ for best experience'
    });
  }
  
  // Safari-specific tests
  if (browser.name === 'Safari') {
    tests.push({
      testName: 'Safari Version Compatibility',
      passed: version >= 14,
      message: `Safari ${browser.version} ${version >= 14 ? 'is supported' : 'may have compatibility issues'}`,
      severity: version >= 14 ? 'info' : 'warning',
      recommendation: version >= 14 ? undefined : 'Update to Safari 14+ for best experience'
    });
    
    // Safari-specific backdrop-filter test
    tests.push({
      testName: 'Safari Backdrop Filter',
      passed: version >= 14,
      message: `Safari backdrop-filter ${version >= 14 ? 'is supported' : 'requires fallback'}`,
      severity: version >= 14 ? 'info' : 'warning',
      recommendation: version >= 14 ? undefined : 'Use solid backgrounds for glassmorphism effects'
    });
  }
  
  // Edge-specific tests
  if (browser.name === 'Edge') {
    tests.push({
      testName: 'Edge Version Compatibility',
      passed: version >= 88,
      message: `Edge ${browser.version} ${version >= 88 ? 'is supported' : 'may have compatibility issues'}`,
      severity: version >= 88 ? 'info' : 'warning',
      recommendation: version >= 88 ? undefined : 'Update to Edge 88+ for best experience'
    });
  }
  
  return tests;
}

/**
 * Test performance-related compatibility
 */
function runPerformanceTests(browser: BrowserInfo): CompatibilityTestResult[] {
  const tests: CompatibilityTestResult[] = [];
  
  // Hardware acceleration test
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  const hasHardwareAcceleration = !!gl;
  
  tests.push({
    testName: 'Hardware Acceleration',
    passed: hasHardwareAcceleration,
    message: hasHardwareAcceleration ? 'Hardware acceleration is available' : 'Hardware acceleration is not available',
    severity: hasHardwareAcceleration ? 'info' : 'warning',
    recommendation: hasHardwareAcceleration ? undefined : 'Reduce animation complexity'
  });
  
  // Performance API test
  const hasPerformanceAPI = 'performance' in window && 'measure' in performance;
  tests.push({
    testName: 'Performance API',
    passed: hasPerformanceAPI,
    message: hasPerformanceAPI ? 'Performance API is available' : 'Performance API is not available',
    severity: hasPerformanceAPI ? 'info' : 'info',
    recommendation: hasPerformanceAPI ? undefined : 'Performance monitoring will be limited'
  });
  
  // RequestAnimationFrame test
  const hasRAF = 'requestAnimationFrame' in window;
  tests.push({
    testName: 'RequestAnimationFrame',
    passed: hasRAF,
    message: hasRAF ? 'RequestAnimationFrame is available' : 'RequestAnimationFrame is not available',
    severity: hasRAF ? 'info' : 'error',
    recommendation: hasRAF ? undefined : 'Critical: Smooth animations require RAF support'
  });
  
  return tests;
}

/**
 * Test accessibility compatibility
 */
function runAccessibilityTests(): CompatibilityTestResult[] {
  const tests: CompatibilityTestResult[] = [];
  
  // Screen reader compatibility
  const hasAriaSupport = 'ariaLabel' in document.createElement('div');
  tests.push({
    testName: 'ARIA Support',
    passed: hasAriaSupport,
    message: hasAriaSupport ? 'ARIA attributes are supported' : 'ARIA attributes may not be supported',
    severity: hasAriaSupport ? 'info' : 'warning',
    recommendation: hasAriaSupport ? undefined : 'Use semantic HTML as fallback'
  });
  
  // Focus management
  const hasFocusVisible = CSS.supports('selector(:focus-visible)');
  tests.push({
    testName: 'Focus-Visible Support',
    passed: hasFocusVisible,
    message: hasFocusVisible ? ':focus-visible is supported' : ':focus-visible is not supported',
    severity: hasFocusVisible ? 'info' : 'warning',
    recommendation: hasFocusVisible ? undefined : 'Use :focus as fallback for keyboard navigation'
  });
  
  // Reduced motion support
  const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  tests.push({
    testName: 'Reduced Motion Preference',
    passed: true, // This is always a pass, just informational
    message: hasReducedMotion ? 'User prefers reduced motion' : 'User allows motion',
    severity: 'info',
    recommendation: hasReducedMotion ? 'Respect reduced motion preferences' : undefined
  });
  
  return tests;
}

/**
 * Generate compatibility report HTML
 */
export function generateCompatibilityReport(report: CompatibilityReport): string {
  const { browser, tests, overallScore, criticalIssues, warnings } = report;
  
  const criticalTests = tests.filter(t => !t.passed && t.severity === 'error');
  const warningTests = tests.filter(t => !t.passed && t.severity === 'warning');
  const passedTests = tests.filter(t => t.passed);
  
  return `
    <div class="compatibility-report">
      <h2>Browser Compatibility Report</h2>
      
      <div class="browser-info">
        <h3>Browser Information</h3>
        <p><strong>Browser:</strong> ${browser.name} ${browser.version}</p>
        <p><strong>Engine:</strong> ${browser.engine}</p>
        <p><strong>Platform:</strong> ${browser.platform}</p>
        <p><strong>Device Type:</strong> ${browser.isMobile ? 'Mobile' : browser.isTablet ? 'Tablet' : 'Desktop'}</p>
      </div>
      
      <div class="compatibility-score">
        <h3>Compatibility Score: ${overallScore}%</h3>
        <div class="score-bar">
          <div class="score-fill" style="width: ${overallScore}%"></div>
        </div>
        <p><strong>Critical Issues:</strong> ${criticalIssues}</p>
        <p><strong>Warnings:</strong> ${warnings}</p>
      </div>
      
      ${criticalIssues > 0 ? `
        <div class="critical-issues">
          <h3>Critical Issues</h3>
          ${criticalTests.map(test => `
            <div class="test-result error">
              <h4>${test.testName}</h4>
              <p>${test.message}</p>
              ${test.recommendation ? `<p><strong>Recommendation:</strong> ${test.recommendation}</p>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${warnings > 0 ? `
        <div class="warnings">
          <h3>Warnings</h3>
          ${warningTests.map(test => `
            <div class="test-result warning">
              <h4>${test.testName}</h4>
              <p>${test.message}</p>
              ${test.recommendation ? `<p><strong>Recommendation:</strong> ${test.recommendation}</p>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <div class="passed-tests">
        <h3>Passed Tests (${passedTests.length})</h3>
        <details>
          <summary>View Details</summary>
          ${passedTests.map(test => `
            <div class="test-result success">
              <h4>${test.testName}</h4>
              <p>${test.message}</p>
            </div>
          `).join('')}
        </details>
      </div>
    </div>
  `;
}

/**
 * Log compatibility report to console
 */
export function logCompatibilityReport(report: CompatibilityReport): void {
  console.group('🔍 Browser Compatibility Report');
  
  console.log(`Browser: ${report.browser.name} ${report.browser.version}`);
  console.log(`Engine: ${report.browser.engine}`);
  console.log(`Platform: ${report.browser.platform}`);
  console.log(`Overall Score: ${report.overallScore}%`);
  
  if (report.criticalIssues > 0) {
    console.group('❌ Critical Issues');
    report.tests
      .filter(t => !t.passed && t.severity === 'error')
      .forEach(test => {
        console.error(`${test.testName}: ${test.message}`);
        if (test.recommendation) {
          console.log(`💡 ${test.recommendation}`);
        }
      });
    console.groupEnd();
  }
  
  if (report.warnings > 0) {
    console.group('⚠️ Warnings');
    report.tests
      .filter(t => !t.passed && t.severity === 'warning')
      .forEach(test => {
        console.warn(`${test.testName}: ${test.message}`);
        if (test.recommendation) {
          console.log(`💡 ${test.recommendation}`);
        }
      });
    console.groupEnd();
  }
  
  console.groupEnd();
}

/**
 * Run compatibility tests and apply fixes automatically
 */
export function runCompatibilityTestsAndFixes(): CompatibilityReport {
  const report = runCompatibilityTests();
  
  // Apply automatic fixes based on test results
  report.tests.forEach(test => {
    if (!test.passed) {
      applyCompatibilityFix(test);
    }
  });
  
  return report;
}

/**
 * Apply compatibility fixes based on test results
 */
function applyCompatibilityFix(test: CompatibilityTestResult): void {
  const body = document.body;
  
  switch (test.testName) {
    case 'CSS Grid Support':
      if (!test.passed) {
        body.classList.add('no-css-grid');
      }
      break;
      
    case 'Backdrop Filter':
      if (!test.passed) {
        body.classList.add('no-backdrop-filter');
      }
      break;
      
    case 'CSS Custom Properties':
      if (!test.passed) {
        body.classList.add('no-custom-properties');
      }
      break;
      
    case 'Intersection Observer':
      if (!test.passed) {
        body.classList.add('no-intersection-observer');
      }
      break;
      
    case 'Hardware Acceleration':
      if (!test.passed) {
        body.classList.add('no-hardware-acceleration');
      }
      break;
  }
}

/**
 * Initialize compatibility testing
 */
export function initializeCompatibilityTesting(): CompatibilityReport {
  if (typeof window === 'undefined') {
    throw new Error('Compatibility testing can only run in browser environment');
  }
  
  const report = runCompatibilityTestsAndFixes();
  
  // Log report in development
  if (process.env.NODE_ENV === 'development') {
    logCompatibilityReport(report);
  }
  
  return report;
}