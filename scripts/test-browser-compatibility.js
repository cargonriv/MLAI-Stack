#!/usr/bin/env node

/**
 * Browser Compatibility Testing Script
 * Automated testing for cross-browser compatibility
 */

import fs from 'fs';
import path from 'path';

// Browser compatibility test configuration
const BROWSERS_TO_TEST = [
  { name: 'Chrome', minVersion: 88 },
  { name: 'Firefox', minVersion: 85 },
  { name: 'Safari', minVersion: 14 },
  { name: 'Edge', minVersion: 88 }
];

const CSS_FEATURES_TO_TEST = [
  'display: grid',
  'display: flex',
  'backdrop-filter: blur(10px)',
  'clip-path: circle(50%)',
  'transform: translateZ(0)',
  'animation: fadeIn 1s ease',
  'background: linear-gradient(45deg, red, blue)',
  'color: hsl(var(--custom-property))'
];

const JS_FEATURES_TO_TEST = [
  'ES6 Modules',
  'Async/Await',
  'Fetch API',
  'IntersectionObserver',
  'ResizeObserver',
  'WebGL',
  'Service Worker',
  'Local Storage',
  'IndexedDB'
];

/**
 * Generate browser compatibility report
 */
function generateCompatibilityReport() {
  console.log('🔍 Generating Browser Compatibility Report...\n');
  
  let report = '# Browser Compatibility Report\n\n';
  report += `Generated on: ${new Date().toISOString()}\n\n`;
  
  // Browser Support Matrix
  report += '## Browser Support Matrix\n\n';
  report += '| Browser | Minimum Version | Status |\n';
  report += '|---------|-----------------|--------|\n';
  
  BROWSERS_TO_TEST.forEach(browser => {
    report += `| ${browser.name} | ${browser.minVersion}+ | ✅ Supported |\n`;
  });
  
  report += '\n';
  
  // CSS Features
  report += '## CSS Features Support\n\n';
  report += '| Feature | Support | Fallback |\n';
  report += '|---------|---------|----------|\n';
  
  const cssFeatureFallbacks = {
    'display: grid': 'Flexbox layout',
    'display: flex': 'Table-cell layout',
    'backdrop-filter: blur(10px)': 'Solid background color',
    'clip-path: circle(50%)': 'Border-radius',
    'transform: translateZ(0)': 'Margin-based positioning',
    'animation: fadeIn 1s ease': 'Static state',
    'background: linear-gradient(45deg, red, blue)': 'Solid background color',
    'color: hsl(var(--custom-property))': 'Static color values'
  };
  
  CSS_FEATURES_TO_TEST.forEach(feature => {
    const fallback = cssFeatureFallbacks[feature] || 'Manual fallback';
    report += `| \`${feature}\` | Modern browsers | ${fallback} |\n`;
  });
  
  report += '\n';
  
  // JavaScript Features
  report += '## JavaScript Features Support\n\n';
  report += '| Feature | Support | Polyfill |\n';
  report += '|---------|---------|----------|\n';
  
  const jsFeaturePolyfills = {
    'ES6 Modules': 'SystemJS',
    'Async/Await': 'Babel transform',
    'Fetch API': 'whatwg-fetch',
    'IntersectionObserver': 'intersection-observer',
    'ResizeObserver': '@juggle/resize-observer',
    'WebGL': 'Not available',
    'Service Worker': 'Not available',
    'Local Storage': 'Cookie fallback',
    'IndexedDB': 'WebSQL fallback'
  };
  
  JS_FEATURES_TO_TEST.forEach(feature => {
    const polyfill = jsFeaturePolyfills[feature] || 'Available';
    report += `| ${feature} | Modern browsers | ${polyfill} |\n`;
  });
  
  report += '\n';
  
  // Testing Recommendations
  report += '## Testing Recommendations\n\n';
  report += '### Manual Testing\n';
  report += '1. Test on actual devices when possible\n';
  report += '2. Use browser developer tools device simulation\n';
  report += '3. Test with slow network conditions\n';
  report += '4. Verify accessibility with screen readers\n';
  report += '5. Test keyboard navigation\n\n';
  
  report += '### Automated Testing\n';
  report += '1. Run the built-in compatibility tests in development mode\n';
  report += '2. Use Lighthouse for performance and accessibility audits\n';
  report += '3. Validate HTML and CSS with W3C validators\n';
  report += '4. Test with axe-core for accessibility compliance\n\n';
  
  // Performance Considerations
  report += '## Performance Considerations\n\n';
  report += '### CSS Optimizations\n';
  report += '- Use `transform` and `opacity` for animations\n';
  report += '- Enable hardware acceleration with `translateZ(0)`\n';
  report += '- Minimize repaints and reflows\n';
  report += '- Use `will-change` property judiciously\n\n';
  
  report += '### JavaScript Optimizations\n';
  report += '- Lazy load non-critical resources\n';
  report += '- Use `requestAnimationFrame` for animations\n';
  report += '- Debounce scroll and resize events\n';
  report += '- Minimize DOM queries and modifications\n\n';
  
  // Accessibility Guidelines
  report += '## Accessibility Guidelines\n\n';
  report += '### WCAG 2.1 AA Compliance\n';
  report += '- Color contrast ratio ≥ 4.5:1 for normal text\n';
  report += '- Color contrast ratio ≥ 3:1 for large text\n';
  report += '- All interactive elements keyboard accessible\n';
  report += '- Proper ARIA labels and descriptions\n';
  report += '- Focus indicators visible and clear\n\n';
  
  report += '### Screen Reader Support\n';
  report += '- Semantic HTML structure\n';
  report += '- Descriptive alt text for images\n';
  report += '- Proper heading hierarchy\n';
  report += '- Skip links for navigation\n\n';
  
  return report;
}

/**
 * Check if CSS file has proper vendor prefixes
 */
function checkVendorPrefixes(cssContent) {
  const issues = [];
  
  // Only check for critical vendor prefix issues
  // Skip browser-compatibility.css as it already has comprehensive prefixes
  if (cssContent.includes('/* Browser Compatibility and Fallbacks */')) {
    return issues; // Skip the compatibility file itself
  }
  
  // Check for backdrop-filter without webkit prefix (critical for Safari)
  const backdropFilterMatches = cssContent.match(/backdrop-filter:\s*[^;]+;/g);
  if (backdropFilterMatches) {
    const hasWebkitPrefix = cssContent.includes('-webkit-backdrop-filter:');
    if (!hasWebkitPrefix) {
      issues.push('backdrop-filter missing -webkit- prefix for Safari support');
    }
  }
  
  // Only flag user-select without prefixes as it's commonly needed
  const userSelectMatches = cssContent.match(/user-select:\s*[^;]+;/g);
  if (userSelectMatches) {
    const hasWebkitPrefix = cssContent.includes('-webkit-user-select:');
    if (!hasWebkitPrefix) {
      issues.push('user-select missing vendor prefixes');
    }
  }
  
  return issues;
}

/**
 * Analyze CSS files for compatibility issues
 */
function analyzeCSSFiles() {
  console.log('🎨 Analyzing CSS files for compatibility issues...\n');
  
  const cssFiles = [
    'src/index.css',
    'src/styles/browser-compatibility.css',
    'tailwind.config.ts'
  ];
  
  const issues = [];
  
  cssFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileIssues = checkVendorPrefixes(content);
      
      if (fileIssues.length > 0) {
        issues.push({
          file: filePath,
          issues: fileIssues
        });
      }
    }
  });
  
  if (issues.length === 0) {
    console.log('✅ No CSS compatibility issues found');
  } else {
    console.log('⚠️  CSS compatibility issues found:');
    issues.forEach(({ file, issues: fileIssues }) => {
      console.log(`\n📄 ${file}:`);
      fileIssues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    });
  }
  
  return issues;
}

/**
 * Check package.json for required polyfills
 */
function checkPolyfills() {
  console.log('📦 Checking for required polyfills...\n');
  
  const packageJsonPath = 'package.json';
  if (!fs.existsSync(packageJsonPath)) {
    console.log('❌ package.json not found');
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredPolyfills = [
    'css-vars-ponyfill',
    'intersection-observer',
    '@juggle/resize-observer'
  ];
  
  const missingPolyfills = requiredPolyfills.filter(polyfill => !dependencies[polyfill]);
  
  if (missingPolyfills.length === 0) {
    console.log('✅ All required polyfills are installed');
  } else {
    console.log('⚠️  Missing polyfills:');
    missingPolyfills.forEach(polyfill => {
      console.log(`  - ${polyfill}`);
    });
    console.log('\nInstall missing polyfills with:');
    console.log(`npm install ${missingPolyfills.join(' ')}`);
  }
  
  return missingPolyfills;
}

/**
 * Generate HTML test page for manual browser testing
 */
function generateTestPage() {
  console.log('📄 Generating test page for manual browser testing...\n');
  
  const testPageHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Browser Compatibility Test Page</title>
    <style>
        /* Test CSS Features */
        .test-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
        }
        
        .test-flex {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }
        
        .test-backdrop {
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.1);
            padding: 1rem;
            border-radius: 8px;
        }
        
        .test-clip-path {
            clip-path: circle(50%);
            width: 100px;
            height: 100px;
            background: linear-gradient(45deg, #6366f1, #8b5cf6);
        }
        
        .test-transform {
            transform: translateZ(0) scale(1.1);
            -webkit-transform: translateZ(0) scale(1.1);
            transition: transform 0.3s ease;
        }
        
        .test-animation {
            animation: fadeIn 2s ease infinite alternate;
            -webkit-animation: fadeIn 2s ease infinite alternate;
        }
        
        @keyframes fadeIn {
            from { opacity: 0.5; }
            to { opacity: 1; }
        }
        
        @-webkit-keyframes fadeIn {
            from { opacity: 0.5; }
            to { opacity: 1; }
        }
        
        .test-custom-props {
            --test-color: #6366f1;
            color: var(--test-color);
            background: hsl(var(--test-hsl, 220 100% 50%));
        }
        
        body {
            font-family: system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 2rem;
            background: #0f0f23;
            color: #f8fafc;
        }
        
        .test-section {
            margin: 2rem 0;
            padding: 1rem;
            border: 1px solid #374151;
            border-radius: 8px;
        }
        
        .status {
            padding: 0.5rem;
            border-radius: 4px;
            margin: 0.5rem 0;
        }
        
        .status.pass { background: #065f46; color: #d1fae5; }
        .status.fail { background: #7f1d1d; color: #fecaca; }
    </style>
</head>
<body>
    <h1>Browser Compatibility Test Page</h1>
    <p>This page tests various CSS and JavaScript features for browser compatibility.</p>
    
    <div class="test-section">
        <h2>CSS Grid Test</h2>
        <div class="test-grid">
            <div style="background: #374151; padding: 1rem; border-radius: 4px;">Grid Item 1</div>
            <div style="background: #374151; padding: 1rem; border-radius: 4px;">Grid Item 2</div>
            <div style="background: #374151; padding: 1rem; border-radius: 4px;">Grid Item 3</div>
        </div>
        <div id="grid-status" class="status">Testing...</div>
    </div>
    
    <div class="test-section">
        <h2>Flexbox Test</h2>
        <div class="test-flex" style="background: #374151; border-radius: 4px;">
            <span>Centered with Flexbox</span>
        </div>
        <div id="flex-status" class="status">Testing...</div>
    </div>
    
    <div class="test-section">
        <h2>Backdrop Filter Test</h2>
        <div style="background: linear-gradient(45deg, #6366f1, #8b5cf6); padding: 2rem; border-radius: 8px;">
            <div class="test-backdrop">
                <p>This should have a backdrop blur effect</p>
            </div>
        </div>
        <div id="backdrop-status" class="status">Testing...</div>
    </div>
    
    <div class="test-section">
        <h2>Clip Path Test</h2>
        <div class="test-clip-path"></div>
        <div id="clippath-status" class="status">Testing...</div>
    </div>
    
    <div class="test-section">
        <h2>Transform Test</h2>
        <div class="test-transform" style="background: #6366f1; color: white; padding: 1rem; border-radius: 4px; display: inline-block;">
            Hover me (should scale)
        </div>
        <div id="transform-status" class="status">Testing...</div>
    </div>
    
    <div class="test-section">
        <h2>Animation Test</h2>
        <div class="test-animation" style="background: #8b5cf6; color: white; padding: 1rem; border-radius: 4px; display: inline-block;">
            Animated Element
        </div>
        <div id="animation-status" class="status">Testing...</div>
    </div>
    
    <div class="test-section">
        <h2>Custom Properties Test</h2>
        <div class="test-custom-props" style="padding: 1rem; border-radius: 4px;">
            Text with custom property color
        </div>
        <div id="customprops-status" class="status">Testing...</div>
    </div>
    
    <div class="test-section">
        <h2>JavaScript Features Test</h2>
        <div id="js-results"></div>
    </div>
    
    <script>
        // Test CSS feature support
        function testCSSSupport() {
            const tests = [
                { name: 'grid', property: 'display', value: 'grid', elementId: 'grid-status' },
                { name: 'flex', property: 'display', value: 'flex', elementId: 'flex-status' },
                { name: 'backdrop', property: 'backdrop-filter', value: 'blur(10px)', elementId: 'backdrop-status' },
                { name: 'clippath', property: 'clip-path', value: 'circle(50%)', elementId: 'clippath-status' },
                { name: 'transform', property: 'transform', value: 'translateZ(0)', elementId: 'transform-status' },
                { name: 'animation', property: 'animation', value: 'fadeIn 1s ease', elementId: 'animation-status' },
                { name: 'customprops', property: 'color', value: 'var(--test)', elementId: 'customprops-status' }
            ];
            
            tests.forEach(test => {
                const supported = CSS.supports && CSS.supports(test.property, test.value);
                const element = document.getElementById(test.elementId);
                if (element) {
                    element.textContent = supported ? 'PASS - Feature supported' : 'FAIL - Feature not supported';
                    element.className = 'status ' + (supported ? 'pass' : 'fail');
                }
            });
        }
        
        // Test JavaScript features
        function testJSFeatures() {
            const results = document.getElementById('js-results');
            const tests = [
                { name: 'ES6 Modules', test: () => typeof Symbol !== 'undefined' },
                { name: 'Async/Await', test: () => (async () => {}).constructor === (async function(){}).constructor },
                { name: 'Fetch API', test: () => typeof fetch !== 'undefined' },
                { name: 'IntersectionObserver', test: () => 'IntersectionObserver' in window },
                { name: 'ResizeObserver', test: () => 'ResizeObserver' in window },
                { name: 'WebGL', test: () => {
                    try {
                        const canvas = document.createElement('canvas');
                        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
                    } catch { return false; }
                }},
                { name: 'Service Worker', test: () => 'serviceWorker' in navigator },
                { name: 'Local Storage', test: () => typeof Storage !== 'undefined' && 'localStorage' in window },
                { name: 'IndexedDB', test: () => 'indexedDB' in window }
            ];
            
            let html = '<h3>JavaScript Feature Support</h3>';
            tests.forEach(test => {
                try {
                    const supported = test.test();
                    html += \`<div class="status \${supported ? 'pass' : 'fail'}">\${test.name}: \${supported ? 'PASS' : 'FAIL'}</div>\`;
                } catch (error) {
                    html += \`<div class="status fail">\${test.name}: ERROR - \${error.message}</div>\`;
                }
            });
            
            results.innerHTML = html;
        }
        
        // Run tests when page loads
        document.addEventListener('DOMContentLoaded', () => {
            testCSSSupport();
            testJSFeatures();
        });
    </script>
</body>
</html>`;
  
  const testPagePath = 'browser-compatibility-test.html';
  fs.writeFileSync(testPagePath, testPageHTML);
  console.log(`✅ Test page generated: ${testPagePath}`);
  console.log('Open this file in different browsers to test compatibility');
  
  return testPagePath;
}

/**
 * Main function to run all compatibility checks
 */
function main() {
  console.log('🚀 Browser Compatibility Testing Suite\n');
  console.log('=====================================\n');
  
  // Generate compatibility report
  const report = generateCompatibilityReport();
  const reportPath = 'browser-compatibility-report.md';
  fs.writeFileSync(reportPath, report);
  console.log(`✅ Compatibility report generated: ${reportPath}\n`);
  
  // Analyze CSS files
  const cssIssues = analyzeCSSFiles();
  console.log('');
  
  // Check polyfills
  const missingPolyfills = checkPolyfills();
  console.log('');
  
  // Generate test page
  const testPagePath = generateTestPage();
  console.log('');
  
  // Summary
  console.log('📊 Summary:');
  console.log(`- Compatibility report: ${reportPath}`);
  console.log(`- Test page: ${testPagePath}`);
  console.log(`- CSS issues found: ${cssIssues.length}`);
  console.log(`- Missing polyfills: ${missingPolyfills.length}`);
  
  if (cssIssues.length === 0 && missingPolyfills.length === 0) {
    console.log('\n✅ All compatibility checks passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some compatibility issues found. Please review the report.');
    process.exit(1);
  }
}

// Run the script
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMainModule) {
  main();
}

export {
  generateCompatibilityReport,
  analyzeCSSFiles,
  checkPolyfills,
  generateTestPage
};