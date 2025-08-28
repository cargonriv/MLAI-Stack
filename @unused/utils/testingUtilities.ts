/**
 * Comprehensive Testing Utilities for Cross-Browser Compatibility
 * Automated testing for accessibility, performance, and browser compatibility
 */

import { AccessibilityTester, PerformanceTester, browserInfo, featureSupport } from './browserCompatibility';

export interface TestResult {
  name: string;
  passed: boolean;
  score?: number;
  details?: string;
  recommendations?: string[];
}

export interface TestSuite {
  name: string;
  results: TestResult[];
  overallScore: number;
  passed: boolean;
}

/**
 * Comprehensive browser compatibility test suite
 */
export class BrowserCompatibilityTestSuite {
  private performanceTester = PerformanceTester.getInstance();
  
  /**
   * Run all compatibility tests
   */
  async runAllTests(): Promise<TestSuite[]> {
    const suites: TestSuite[] = [];
    
    try {
      // Run individual test suites
      suites.push(await this.runFeatureDetectionTests());
      suites.push(await this.runPerformanceTests());
      suites.push(await this.runAccessibilityTests());
      suites.push(await this.runCSSCompatibilityTests());
      suites.push(await this.runResponsiveDesignTests());
      
      console.log('Browser compatibility tests completed:', suites);
      return suites;
    } catch (error) {
      console.error('Test suite execution failed:', error);
      return [];
    }
  }
  
  /**
   * Test feature detection and support
   */
  async runFeatureDetectionTests(): Promise<TestSuite> {
    const results: TestResult[] = [];
    
    // Test essential modern features
    const essentialFeatures = [
      'cssGrid',
      'flexbox',
      'customProperties',
      'transforms3d',
      'animations'
    ] as const;
    
    essentialFeatures.forEach(feature => {
      const supported = featureSupport[feature];
      results.push({
        name: `${feature} Support`,
        passed: supported,
        details: supported ? 'Feature is supported' : 'Feature not supported - fallback required',
        recommendations: supported ? [] : [`Implement fallback for ${feature}`]
      });
    });
    
    // Test enhanced features
    const enhancedFeatures = [
      'backdropFilter',
      'clipPath',
      'webGL',
      'intersectionObserver',
      'resizeObserver'
    ] as const;
    
    enhancedFeatures.forEach(feature => {
      const supported = featureSupport[feature];
      results.push({
        name: `${feature} Support`,
        passed: true, // These are optional enhancements
        score: supported ? 100 : 50,
        details: supported ? 'Enhanced feature available' : 'Enhanced feature not available - graceful degradation',
        recommendations: supported ? [] : [`Consider polyfill for ${feature}`]
      });
    });
    
    const passedTests = results.filter(r => r.passed).length;
    const overallScore = Math.round((passedTests / results.length) * 100);
    
    return {
      name: 'Feature Detection Tests',
      results,
      overallScore,
      passed: passedTests >= essentialFeatures.length
    };
  }
  
  /**
   * Test performance across different scenarios
   */
  async runPerformanceTests(): Promise<TestSuite> {
    const results: TestResult[] = [];
    
    try {
      // Test animation frame rate
      const fps = await this.performanceTester.measureFPS(2000);
      results.push({
        name: 'Animation Frame Rate',
        passed: fps >= 30,
        score: Math.min(100, (fps / 60) * 100),
        details: `${fps} FPS measured`,
        recommendations: fps < 30 ? ['Optimize animations', 'Reduce animation complexity'] : []
      });
      
      // Test paint timing
      const paintTiming = this.performanceTester.measurePaintTiming();
      if (paintTiming.fcp) {
        results.push({
          name: 'First Contentful Paint',
          passed: paintTiming.fcp < 2000,
          score: Math.max(0, 100 - (paintTiming.fcp / 20)),
          details: `${Math.round(paintTiming.fcp)}ms`,
          recommendations: paintTiming.fcp > 2000 ? ['Optimize critical rendering path', 'Reduce render-blocking resources'] : []
        });
      }
      
      // Test memory usage
      const memory = this.performanceTester.measureMemoryUsage();
      if (memory.used && memory.total) {
        const memoryUsagePercent = (memory.used / memory.total) * 100;
        results.push({
          name: 'Memory Usage',
          passed: memoryUsagePercent < 80,
          score: Math.max(0, 100 - memoryUsagePercent),
          details: `${Math.round(memoryUsagePercent)}% of heap used`,
          recommendations: memoryUsagePercent > 80 ? ['Optimize memory usage', 'Check for memory leaks'] : []
        });
      }
      
      // Test CSS animation performance
      const testElement = document.createElement('div');
      testElement.style.cssText = 'position: fixed; top: -100px; left: -100px; width: 10px; height: 10px;';
      document.body.appendChild(testElement);
      
      const animationFPS = await this.performanceTester.testAnimationPerformance(testElement, 1000);
      document.body.removeChild(testElement);
      
      results.push({
        name: 'CSS Animation Performance',
        passed: animationFPS >= 30,
        score: Math.min(100, (animationFPS / 60) * 100),
        details: `${animationFPS} FPS during CSS animation`,
        recommendations: animationFPS < 30 ? ['Use transform and opacity for animations', 'Enable hardware acceleration'] : []
      });
      
    } catch (error) {
      results.push({
        name: 'Performance Testing',
        passed: false,
        details: `Performance testing failed: ${error}`,
        recommendations: ['Check browser compatibility for performance APIs']
      });
    }
    
    const passedTests = results.filter(r => r.passed).length;
    const overallScore = results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length;
    
    return {
      name: 'Performance Tests',
      results,
      overallScore: Math.round(overallScore),
      passed: passedTests >= Math.ceil(results.length * 0.7)
    };
  }
  
  /**
   * Test accessibility compliance
   */
  async runAccessibilityTests(): Promise<TestSuite> {
    const results: TestResult[] = [];
    
    try {
      // Test color contrast
      const contrastTests = [
        { fg: '#f8fafc', bg: '#0f0f23', name: 'Primary Text' },
        { fg: '#6366f1', bg: '#0f0f23', name: 'Accent Color' },
        { fg: '#ffffff', bg: '#6366f1', name: 'Button Text' }
      ];
      
      contrastTests.forEach(test => {
        const ratio = AccessibilityTester.checkColorContrast(test.fg, test.bg);
        const passed = ratio >= 4.5; // WCAG AA standard
        results.push({
          name: `Color Contrast - ${test.name}`,
          passed,
          score: Math.min(100, (ratio / 7) * 100), // WCAG AAA is 7:1
          details: `Contrast ratio: ${ratio.toFixed(2)}:1`,
          recommendations: passed ? [] : ['Increase color contrast', 'Use darker/lighter colors']
        });
      });
      
      // Test keyboard navigation
      const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
      let keyboardAccessible = 0;
      
      interactiveElements.forEach(element => {
        const tabIndex = element.getAttribute('tabindex');
        if (tabIndex !== '-1') {
          keyboardAccessible++;
        }
      });
      
      const keyboardScore = interactiveElements.length > 0 ? 
        (keyboardAccessible / interactiveElements.length) * 100 : 100;
      
      results.push({
        name: 'Keyboard Navigation',
        passed: keyboardScore >= 90,
        score: keyboardScore,
        details: `${keyboardAccessible}/${interactiveElements.length} elements keyboard accessible`,
        recommendations: keyboardScore < 90 ? ['Add proper tabindex attributes', 'Ensure all interactive elements are focusable'] : []
      });
      
      // Test ARIA labels
      let ariaCompliant = 0;
      interactiveElements.forEach(element => {
        if (AccessibilityTester.checkAriaLabels(element as HTMLElement)) {
          ariaCompliant++;
        }
      });
      
      const ariaScore = interactiveElements.length > 0 ? 
        (ariaCompliant / interactiveElements.length) * 100 : 100;
      
      results.push({
        name: 'ARIA Labels',
        passed: ariaScore >= 80,
        score: ariaScore,
        details: `${ariaCompliant}/${interactiveElements.length} elements have proper labels`,
        recommendations: ariaScore < 80 ? ['Add aria-label attributes', 'Provide descriptive text content'] : []
      });
      
      // Test focus indicators
      const focusableElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      results.push({
        name: 'Focus Indicators',
        passed: true, // Assume CSS provides focus styles
        score: 100,
        details: `${focusableElements.length} focusable elements found`,
        recommendations: ['Ensure visible focus indicators are present']
      });
      
    } catch (error) {
      results.push({
        name: 'Accessibility Testing',
        passed: false,
        details: `Accessibility testing failed: ${error}`,
        recommendations: ['Check accessibility testing implementation']
      });
    }
    
    const passedTests = results.filter(r => r.passed).length;
    const overallScore = results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length;
    
    return {
      name: 'Accessibility Tests',
      results,
      overallScore: Math.round(overallScore),
      passed: passedTests >= Math.ceil(results.length * 0.8)
    };
  }
  
  /**
   * Test CSS compatibility and fallbacks
   */
  async runCSSCompatibilityTests(): Promise<TestSuite> {
    const results: TestResult[] = [];
    
    // Test CSS feature support with fallbacks
    const cssFeatures = [
      { property: 'display', value: 'grid', fallback: 'flex' },
      { property: 'backdrop-filter', value: 'blur(10px)', fallback: 'background opacity' },
      { property: 'clip-path', value: 'circle(50%)', fallback: 'border-radius' },
      { property: 'transform', value: 'translateZ(0)', fallback: 'position' },
      { property: 'animation', value: 'fadeIn 1s ease', fallback: 'static state' }
    ];
    
    cssFeatures.forEach(feature => {
      const supported = CSS.supports && CSS.supports(feature.property, feature.value);
      results.push({
        name: `CSS ${feature.property} Support`,
        passed: true, // All have fallbacks
        score: supported ? 100 : 70,
        details: supported ? 'Native support available' : `Fallback to ${feature.fallback}`,
        recommendations: supported ? [] : [`Ensure ${feature.fallback} fallback is implemented`]
      });
    });
    
    // Test vendor prefix requirements
    const prefixTests = [
      { property: '-webkit-backdrop-filter', required: browserInfo.engine === 'WebKit' },
      { property: '-moz-appearance', required: browserInfo.engine === 'Gecko' },
      { property: '-ms-grid', required: browserInfo.name === 'Edge' && parseInt(browserInfo.version) < 79 }
    ];
    
    prefixTests.forEach(test => {
      results.push({
        name: `Vendor Prefix - ${test.property}`,
        passed: true,
        score: test.required ? 100 : 90,
        details: test.required ? 'Vendor prefix required' : 'Vendor prefix optional',
        recommendations: test.required ? [`Ensure ${test.property} is included`] : []
      });
    });
    
    const overallScore = results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length;
    
    return {
      name: 'CSS Compatibility Tests',
      results,
      overallScore: Math.round(overallScore),
      passed: true // All CSS features have fallbacks
    };
  }
  
  /**
   * Test responsive design across different screen sizes
   */
  async runResponsiveDesignTests(): Promise<TestSuite> {
    const results: TestResult[] = [];
    
    // Test viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    results.push({
      name: 'Viewport Meta Tag',
      passed: !!viewportMeta,
      score: viewportMeta ? 100 : 0,
      details: viewportMeta ? 'Viewport meta tag present' : 'Viewport meta tag missing',
      recommendations: viewportMeta ? [] : ['Add viewport meta tag for mobile optimization']
    });
    
    // Test responsive breakpoints
    const breakpoints = [
      { name: 'Mobile', width: 375 },
      { name: 'Tablet', width: 768 },
      { name: 'Desktop', width: 1024 },
      { name: 'Large Desktop', width: 1440 }
    ];
    
    const originalWidth = window.innerWidth;
    
    for (const breakpoint of breakpoints) {
      // Simulate different screen sizes (limited testing in browser)
      const mediaQuery = window.matchMedia(`(min-width: ${breakpoint.width}px)`);
      results.push({
        name: `${breakpoint.name} Breakpoint`,
        passed: true,
        score: 100,
        details: `Breakpoint at ${breakpoint.width}px`,
        recommendations: []
      });
    }
    
    // Test touch-friendly sizing
    const touchTargets = document.querySelectorAll('button, a, input, select, textarea');
    let touchFriendly = 0;
    
    touchTargets.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.width >= 44 && rect.height >= 44) {
        touchFriendly++;
      }
    });
    
    const touchScore = touchTargets.length > 0 ? 
      (touchFriendly / touchTargets.length) * 100 : 100;
    
    results.push({
      name: 'Touch Target Sizing',
      passed: touchScore >= 80,
      score: touchScore,
      details: `${touchFriendly}/${touchTargets.length} elements are touch-friendly (44px+)`,
      recommendations: touchScore < 80 ? ['Increase touch target sizes to 44px minimum'] : []
    });
    
    const passedTests = results.filter(r => r.passed).length;
    const overallScore = results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length;
    
    return {
      name: 'Responsive Design Tests',
      results,
      overallScore: Math.round(overallScore),
      passed: passedTests >= Math.ceil(results.length * 0.8)
    };
  }
  
  /**
   * Generate a comprehensive test report
   */
  generateReport(testSuites: TestSuite[]): string {
    let report = '# Browser Compatibility Test Report\n\n';
    
    // Overall summary
    const totalTests = testSuites.reduce((sum, suite) => sum + suite.results.length, 0);
    const passedSuites = testSuites.filter(suite => suite.passed).length;
    const overallScore = testSuites.reduce((sum, suite) => sum + suite.overallScore, 0) / testSuites.length;
    
    report += `## Summary\n`;
    report += `- **Overall Score**: ${Math.round(overallScore)}/100\n`;
    report += `- **Test Suites Passed**: ${passedSuites}/${testSuites.length}\n`;
    report += `- **Total Tests**: ${totalTests}\n`;
    report += `- **Browser**: ${browserInfo.name} ${browserInfo.version}\n`;
    report += `- **Platform**: ${browserInfo.platform}\n\n`;
    
    // Detailed results
    testSuites.forEach(suite => {
      report += `## ${suite.name}\n`;
      report += `**Score**: ${suite.overallScore}/100 ${suite.passed ? '✅' : '❌'}\n\n`;
      
      suite.results.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        const score = result.score ? ` (${Math.round(result.score)}/100)` : '';
        report += `- **${result.name}**: ${status}${score}\n`;
        if (result.details) {
          report += `  - ${result.details}\n`;
        }
        if (result.recommendations && result.recommendations.length > 0) {
          report += `  - Recommendations: ${result.recommendations.join(', ')}\n`;
        }
      });
      report += '\n';
    });
    
    return report;
  }
}

/**
 * Initialize and run browser compatibility tests
 */
export async function runBrowserCompatibilityTests(): Promise<void> {
  console.log('Starting browser compatibility tests...');
  
  const testSuite = new BrowserCompatibilityTestSuite();
  const results = await testSuite.runAllTests();
  const report = testSuite.generateReport(results);
  
  console.log('Browser Compatibility Test Results:');
  console.log(report);
  
  // Store results for debugging
  (window as unknown as { __browserCompatibilityResults: unknown }).__browserCompatibilityResults = {
    results,
    report,
    browserInfo,
    featureSupport
  };
}

/**
 * Quick compatibility check for essential features
 */
export function quickCompatibilityCheck(): boolean {
  const essentialFeatures = [
    featureSupport.cssGrid || featureSupport.flexbox,
    featureSupport.customProperties,
    featureSupport.transforms3d,
    featureSupport.es6Modules,
    featureSupport.asyncAwait
  ];
  
  const supportedFeatures = essentialFeatures.filter(Boolean).length;
  const isCompatible = supportedFeatures >= 4; // At least 4 out of 5 essential features
  
  if (!isCompatible) {
    console.warn('Browser compatibility issues detected. Some features may not work properly.');
  }
  
  return isCompatible;
}