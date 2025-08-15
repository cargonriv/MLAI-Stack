/**
 * Accessibility Testing Utilities
 * Provides automated accessibility compliance testing and validation
 */

export interface AccessibilityIssue {
  element: Element;
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  recommendation: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  wcagCriterion: string;
}

export interface AccessibilityReport {
  totalElements: number;
  issuesFound: number;
  errors: AccessibilityIssue[];
  warnings: AccessibilityIssue[];
  info: AccessibilityIssue[];
  score: number;
  wcagCompliance: {
    levelA: boolean;
    levelAA: boolean;
    levelAAA: boolean;
  };
}

/**
 * Run comprehensive accessibility tests
 */
export function runAccessibilityTests(container: Element = document.body): AccessibilityReport {
  const issues: AccessibilityIssue[] = [];
  const elements = container.querySelectorAll('*');
  
  // Run all accessibility tests
  issues.push(...testColorContrast(container));
  issues.push(...testKeyboardNavigation(container));
  issues.push(...testAriaLabels(container));
  issues.push(...testHeadingStructure(container));
  issues.push(...testImageAltText(container));
  issues.push(...testFormLabels(container));
  issues.push(...testFocusManagement(container));
  issues.push(...testSemanticHTML(container));
  issues.push(...testLandmarks(container));
  issues.push(...testSkipLinks(container));
  
  // Categorize issues by severity
  const errors = issues.filter(issue => issue.severity === 'error');
  const warnings = issues.filter(issue => issue.severity === 'warning');
  const info = issues.filter(issue => issue.severity === 'info');
  
  // Calculate accessibility score
  const totalIssues = issues.length;
  const criticalIssues = errors.length;
  const score = Math.max(0, Math.round(((elements.length - totalIssues) / elements.length) * 100));
  
  // Determine WCAG compliance levels
  const levelAErrors = errors.filter(issue => issue.wcagLevel === 'A').length;
  const levelAAErrors = errors.filter(issue => ['A', 'AA'].includes(issue.wcagLevel)).length;
  const levelAAAErrors = errors.length;
  
  return {
    totalElements: elements.length,
    issuesFound: totalIssues,
    errors,
    warnings,
    info,
    score,
    wcagCompliance: {
      levelA: levelAErrors === 0,
      levelAA: levelAAErrors === 0,
      levelAAA: levelAAAErrors === 0
    }
  };
}

/**
 * Test color contrast ratios
 */
function testColorContrast(container: Element): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const textElements = container.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label');
  
  textElements.forEach(element => {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;
    
    // Skip if no text content
    if (!element.textContent?.trim()) return;
    
    // Calculate contrast ratio (simplified)
    const contrastRatio = calculateContrastRatio(color, backgroundColor);
    
    if (contrastRatio < 4.5) {
      issues.push({
        element,
        rule: 'color-contrast',
        severity: 'error',
        message: `Insufficient color contrast ratio: ${contrastRatio.toFixed(2)}:1`,
        recommendation: 'Ensure text has a contrast ratio of at least 4.5:1 for normal text or 3:1 for large text',
        wcagLevel: 'AA',
        wcagCriterion: '1.4.3 Contrast (Minimum)'
      });
    } else if (contrastRatio < 7) {
      issues.push({
        element,
        rule: 'color-contrast-enhanced',
        severity: 'info',
        message: `Good contrast ratio: ${contrastRatio.toFixed(2)}:1, but could be enhanced for AAA compliance`,
        recommendation: 'Consider increasing contrast to 7:1 for AAA compliance',
        wcagLevel: 'AAA',
        wcagCriterion: '1.4.6 Contrast (Enhanced)'
      });
    }
  });
  
  return issues;
}

/**
 * Test keyboard navigation
 */
function testKeyboardNavigation(container: Element): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const interactiveElements = container.querySelectorAll('button, a, input, select, textarea, [tabindex]');
  
  interactiveElements.forEach(element => {
    const tabIndex = element.getAttribute('tabindex');
    
    // Check for positive tabindex (anti-pattern)
    if (tabIndex && parseInt(tabIndex) > 0) {
      issues.push({
        element,
        rule: 'tabindex-positive',
        severity: 'warning',
        message: 'Positive tabindex values can create confusing navigation order',
        recommendation: 'Use tabindex="0" or rely on natural DOM order for keyboard navigation',
        wcagLevel: 'A',
        wcagCriterion: '2.4.3 Focus Order'
      });
    }
    
    // Check for missing focus indicators
    const styles = window.getComputedStyle(element, ':focus');
    const outline = styles.outline;
    const boxShadow = styles.boxShadow;
    
    if (outline === 'none' && boxShadow === 'none') {
      issues.push({
        element,
        rule: 'focus-indicator',
        severity: 'error',
        message: 'Interactive element lacks visible focus indicator',
        recommendation: 'Add visible focus styles using outline or box-shadow',
        wcagLevel: 'AA',
        wcagCriterion: '2.4.7 Focus Visible'
      });
    }
  });
  
  return issues;
}

/**
 * Test ARIA labels and descriptions
 */
function testAriaLabels(container: Element): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const elementsNeedingLabels = container.querySelectorAll('button, input, select, textarea');
  
  elementsNeedingLabels.forEach(element => {
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledby = element.getAttribute('aria-labelledby');
    const ariaDescribedby = element.getAttribute('aria-describedby');
    const label = element.closest('label') || container.querySelector(`label[for="${element.id}"]`);
    
    // Check if element has accessible name
    if (!ariaLabel && !ariaLabelledby && !label && !element.textContent?.trim()) {
      issues.push({
        element,
        rule: 'accessible-name',
        severity: 'error',
        message: 'Interactive element lacks accessible name',
        recommendation: 'Add aria-label, aria-labelledby, or associate with a label element',
        wcagLevel: 'A',
        wcagCriterion: '4.1.2 Name, Role, Value'
      });
    }
    
    // Check for empty ARIA labels
    if (ariaLabel === '') {
      issues.push({
        element,
        rule: 'empty-aria-label',
        severity: 'error',
        message: 'Empty aria-label attribute',
        recommendation: 'Provide meaningful text for aria-label or remove the attribute',
        wcagLevel: 'A',
        wcagCriterion: '4.1.2 Name, Role, Value'
      });
    }
  });
  
  return issues;
}

/**
 * Test heading structure
 */
function testHeadingStructure(container: Element): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  
  if (headings.length === 0) {
    return issues;
  }
  
  let previousLevel = 0;
  
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));
    
    // Check for missing h1
    if (index === 0 && level !== 1) {
      issues.push({
        element: heading,
        rule: 'heading-h1-first',
        severity: 'warning',
        message: 'Page should start with h1 heading',
        recommendation: 'Use h1 for the main page heading',
        wcagLevel: 'AAA',
        wcagCriterion: '2.4.10 Section Headings'
      });
    }
    
    // Check for skipped heading levels
    if (level > previousLevel + 1) {
      issues.push({
        element: heading,
        rule: 'heading-level-skip',
        severity: 'warning',
        message: `Heading level skipped from h${previousLevel} to h${level}`,
        recommendation: 'Use heading levels in sequential order',
        wcagLevel: 'AAA',
        wcagCriterion: '2.4.10 Section Headings'
      });
    }
    
    // Check for empty headings
    if (!heading.textContent?.trim()) {
      issues.push({
        element: heading,
        rule: 'empty-heading',
        severity: 'error',
        message: 'Heading element is empty',
        recommendation: 'Provide meaningful text content for headings',
        wcagLevel: 'A',
        wcagCriterion: '2.4.6 Headings and Labels'
      });
    }
    
    previousLevel = level;
  });
  
  return issues;
}

/**
 * Test image alt text
 */
function testImageAltText(container: Element): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const images = container.querySelectorAll('img');
  
  images.forEach(img => {
    const alt = img.getAttribute('alt');
    const role = img.getAttribute('role');
    
    // Check for missing alt attribute
    if (alt === null) {
      issues.push({
        element: img,
        rule: 'img-alt-missing',
        severity: 'error',
        message: 'Image missing alt attribute',
        recommendation: 'Add alt attribute with descriptive text or empty alt="" for decorative images',
        wcagLevel: 'A',
        wcagCriterion: '1.1.1 Non-text Content'
      });
    }
    
    // Check for placeholder alt text
    if (alt && (alt.includes('image') || alt.includes('photo') || alt.includes('picture'))) {
      issues.push({
        element: img,
        rule: 'img-alt-placeholder',
        severity: 'warning',
        message: 'Alt text appears to be placeholder text',
        recommendation: 'Provide specific, descriptive alt text that conveys the image content',
        wcagLevel: 'A',
        wcagCriterion: '1.1.1 Non-text Content'
      });
    }
    
    // Check for very long alt text
    if (alt && alt.length > 125) {
      issues.push({
        element: img,
        rule: 'img-alt-long',
        severity: 'info',
        message: 'Alt text is very long',
        recommendation: 'Consider using shorter alt text and providing detailed description elsewhere',
        wcagLevel: 'A',
        wcagCriterion: '1.1.1 Non-text Content'
      });
    }
  });
  
  return issues;
}

/**
 * Test form labels
 */
function testFormLabels(container: Element): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const formControls = container.querySelectorAll('input:not([type="hidden"]), select, textarea');
  
  formControls.forEach(control => {
    const id = control.getAttribute('id');
    const label = container.querySelector(`label[for="${id}"]`);
    const ariaLabel = control.getAttribute('aria-label');
    const ariaLabelledby = control.getAttribute('aria-labelledby');
    
    // Check if form control has a label
    if (!label && !ariaLabel && !ariaLabelledby) {
      issues.push({
        element: control,
        rule: 'form-label-missing',
        severity: 'error',
        message: 'Form control missing label',
        recommendation: 'Associate form control with a label element or provide aria-label',
        wcagLevel: 'A',
        wcagCriterion: '3.3.2 Labels or Instructions'
      });
    }
    
    // Check for required field indicators
    if (control.hasAttribute('required') && !control.getAttribute('aria-required')) {
      const requiredIndicator = label?.textContent?.includes('*') || 
                               label?.textContent?.includes('required') ||
                               control.getAttribute('aria-describedby');
      
      if (!requiredIndicator) {
        issues.push({
          element: control,
          rule: 'required-field-indicator',
          severity: 'warning',
          message: 'Required field lacks clear indication',
          recommendation: 'Add visual and programmatic indication that field is required',
          wcagLevel: 'A',
          wcagCriterion: '3.3.2 Labels or Instructions'
        });
      }
    }
  });
  
  return issues;
}

/**
 * Test focus management
 */
function testFocusManagement(container: Element): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  // Check for focus traps in modals/dialogs
  const modals = container.querySelectorAll('[role="dialog"], [role="alertdialog"], .modal');
  modals.forEach(modal => {
    const modalFocusable = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (modalFocusable.length === 0) {
      issues.push({
        element: modal,
        rule: 'modal-focus-trap',
        severity: 'error',
        message: 'Modal/dialog lacks focusable elements',
        recommendation: 'Ensure modals contain at least one focusable element',
        wcagLevel: 'A',
        wcagCriterion: '2.4.3 Focus Order'
      });
    }
  });
  
  return issues;
}

/**
 * Test semantic HTML usage
 */
function testSemanticHTML(container: Element): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  
  // Check for generic div/span usage where semantic elements would be better
  const clickableDivs = container.querySelectorAll('div[onclick], span[onclick]');
  clickableDivs.forEach(element => {
    issues.push({
      element,
      rule: 'semantic-button',
      severity: 'warning',
      message: 'Clickable div/span should be a button element',
      recommendation: 'Use <button> element for interactive controls',
      wcagLevel: 'A',
      wcagCriterion: '4.1.2 Name, Role, Value'
    });
  });
  
  // Check for missing main landmark
  const main = container.querySelector('main, [role="main"]');
  if (!main && container === document.body) {
    issues.push({
      element: container,
      rule: 'main-landmark',
      severity: 'warning',
      message: 'Page missing main landmark',
      recommendation: 'Add <main> element or role="main" to identify main content area',
      wcagLevel: 'AAA',
      wcagCriterion: '2.4.1 Bypass Blocks'
    });
  }
  
  return issues;
}

/**
 * Test landmark regions
 */
function testLandmarks(container: Element): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  
  // Check for navigation landmarks
  const navElements = container.querySelectorAll('nav, [role="navigation"]');
  navElements.forEach(nav => {
    if (!nav.getAttribute('aria-label') && !nav.getAttribute('aria-labelledby')) {
      issues.push({
        element: nav,
        rule: 'nav-landmark-label',
        severity: 'info',
        message: 'Navigation landmark should have accessible name',
        recommendation: 'Add aria-label to distinguish multiple navigation areas',
        wcagLevel: 'AAA',
        wcagCriterion: '2.4.1 Bypass Blocks'
      });
    }
  });
  
  return issues;
}

/**
 * Test skip links
 */
function testSkipLinks(container: Element): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  
  if (container === document.body) {
    const skipLink = container.querySelector('a[href^="#"]:first-child');
    
    if (!skipLink || !skipLink.textContent?.toLowerCase().includes('skip')) {
      issues.push({
        element: container,
        rule: 'skip-link',
        severity: 'warning',
        message: 'Page missing skip link',
        recommendation: 'Add skip link as first focusable element to bypass navigation',
        wcagLevel: 'A',
        wcagCriterion: '2.4.1 Bypass Blocks'
      });
    }
  }
  
  return issues;
}

/**
 * Calculate color contrast ratio (simplified)
 */
function calculateContrastRatio(color1: string, color2: string): number {
  // This is a simplified implementation
  // In a real application, you would use a proper color contrast library
  
  // Parse RGB values (simplified)
  const rgb1 = parseRGB(color1);
  const rgb2 = parseRGB(color2);
  
  if (!rgb1 || !rgb2) return 21; // Assume good contrast if can't parse
  
  // Calculate relative luminance
  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);
  
  // Calculate contrast ratio
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse RGB color values
 */
function parseRGB(color: string): [number, number, number] | null {
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  }
  return null;
}

/**
 * Calculate relative luminance
 */
function getRelativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Generate accessibility report HTML
 */
export function generateAccessibilityReportHTML(report: AccessibilityReport): string {
  return `
    <div class="accessibility-report">
      <h2>Accessibility Report</h2>
      
      <div class="accessibility-score">
        <h3>Accessibility Score: ${report.score}%</h3>
        <div class="score-details">
          <p><strong>Total Elements:</strong> ${report.totalElements}</p>
          <p><strong>Issues Found:</strong> ${report.issuesFound}</p>
          <p><strong>Errors:</strong> ${report.errors.length}</p>
          <p><strong>Warnings:</strong> ${report.warnings.length}</p>
        </div>
      </div>
      
      <div class="wcag-compliance">
        <h3>WCAG Compliance</h3>
        <p><strong>Level A:</strong> ${report.wcagCompliance.levelA ? '✅ Compliant' : '❌ Non-compliant'}</p>
        <p><strong>Level AA:</strong> ${report.wcagCompliance.levelAA ? '✅ Compliant' : '❌ Non-compliant'}</p>
        <p><strong>Level AAA:</strong> ${report.wcagCompliance.levelAAA ? '✅ Compliant' : '❌ Non-compliant'}</p>
      </div>
      
      ${report.errors.length > 0 ? `
        <div class="accessibility-errors">
          <h3>Errors (${report.errors.length})</h3>
          ${report.errors.map(issue => `
            <div class="issue error">
              <h4>${issue.rule}</h4>
              <p><strong>Message:</strong> ${issue.message}</p>
              <p><strong>Recommendation:</strong> ${issue.recommendation}</p>
              <p><strong>WCAG:</strong> ${issue.wcagLevel} - ${issue.wcagCriterion}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${report.warnings.length > 0 ? `
        <div class="accessibility-warnings">
          <h3>Warnings (${report.warnings.length})</h3>
          ${report.warnings.map(issue => `
            <div class="issue warning">
              <h4>${issue.rule}</h4>
              <p><strong>Message:</strong> ${issue.message}</p>
              <p><strong>Recommendation:</strong> ${issue.recommendation}</p>
              <p><strong>WCAG:</strong> ${issue.wcagLevel} - ${issue.wcagCriterion}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Log accessibility report to console
 */
export function logAccessibilityReport(report: AccessibilityReport): void {
  console.group('♿ Accessibility Report');
  
  console.log(`Score: ${report.score}%`);
  console.log(`Total Elements: ${report.totalElements}`);
  console.log(`Issues Found: ${report.issuesFound}`);
  
  console.group('WCAG Compliance');
  console.log(`Level A: ${report.wcagCompliance.levelA ? '✅' : '❌'}`);
  console.log(`Level AA: ${report.wcagCompliance.levelAA ? '✅' : '❌'}`);
  console.log(`Level AAA: ${report.wcagCompliance.levelAAA ? '✅' : '❌'}`);
  console.groupEnd();
  
  if (report.errors.length > 0) {
    console.group(`❌ Errors (${report.errors.length})`);
    report.errors.forEach(issue => {
      console.error(`${issue.rule}: ${issue.message}`);
      console.log(`💡 ${issue.recommendation}`);
    });
    console.groupEnd();
  }
  
  if (report.warnings.length > 0) {
    console.group(`⚠️ Warnings (${report.warnings.length})`);
    report.warnings.forEach(issue => {
      console.warn(`${issue.rule}: ${issue.message}`);
      console.log(`💡 ${issue.recommendation}`);
    });
    console.groupEnd();
  }
  
  console.groupEnd();
}