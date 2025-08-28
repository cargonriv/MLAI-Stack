/**
 * CSS optimization utilities for removing unused styles and improving performance
 */

export interface CSSOptimizationOptions {
  removeUnusedClasses?: boolean;
  minifyCSS?: boolean;
  extractCriticalCSS?: boolean;
  purgeUnusedKeyframes?: boolean;
  optimizeCustomProperties?: boolean;
}

/**
 * CSS optimization class
 */
export class CSSOptimizer {
  private usedClasses: Set<string> = new Set();
  private usedKeyframes: Set<string> = new Set();
  private usedCustomProperties: Set<string> = new Set();
  private observer: MutationObserver | null = null;

  constructor() {
    this.scanInitialDOM();
    this.setupDOMObserver();
  }

  /**
   * Scan initial DOM for used classes
   */
  private scanInitialDOM() {
    if (typeof document === 'undefined') return;

    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      this.extractClassesFromElement(element);
    });

    // Scan for keyframes in computed styles
    this.scanForUsedKeyframes();
    
    // Scan for custom properties
    this.scanForUsedCustomProperties();
  }

  /**
   * Setup DOM observer to track dynamically added classes
   */
  private setupDOMObserver() {
    if (typeof document === 'undefined' || !window.MutationObserver) return;

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.extractClassesFromElement(node as Element);
              // Scan child elements too
              const childElements = (node as Element).querySelectorAll('*');
              childElements.forEach(child => {
                this.extractClassesFromElement(child);
              });
            }
          });
        } else if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          this.extractClassesFromElement(mutation.target as Element);
        }
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  /**
   * Extract classes from an element
   */
  private extractClassesFromElement(element: Element) {
    const classList = element.classList;
    classList.forEach(className => {
      this.usedClasses.add(className);
      
      // Also add responsive variants
      this.addResponsiveVariants(className);
      
      // Add state variants
      this.addStateVariants(className);
    });
  }

  /**
   * Add responsive variants of a class
   */
  private addResponsiveVariants(className: string) {
    const breakpoints = ['sm', 'md', 'lg', 'xl', '2xl'];
    breakpoints.forEach(bp => {
      this.usedClasses.add(`${bp}:${className}`);
    });
  }

  /**
   * Add state variants of a class
   */
  private addStateVariants(className: string) {
    const states = ['hover', 'focus', 'active', 'disabled', 'focus-visible'];
    states.forEach(state => {
      this.usedClasses.add(`${state}:${className}`);
    });
  }

  /**
   * Scan for used keyframes in animations
   */
  private scanForUsedKeyframes() {
    if (typeof document === 'undefined') return;

    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      const animationName = computedStyle.animationName;
      
      if (animationName && animationName !== 'none') {
        animationName.split(',').forEach(name => {
          this.usedKeyframes.add(name.trim());
        });
      }
    });
  }

  /**
   * Scan for used CSS custom properties
   */
  private scanForUsedCustomProperties() {
    if (typeof document === 'undefined') return;

    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      
      // Check all CSS properties for custom property usage
      for (let i = 0; i < computedStyle.length; i++) {
        const property = computedStyle[i];
        const value = computedStyle.getPropertyValue(property);
        
        // Look for var() usage
        const varMatches = value.match(/var\(([^)]+)\)/g);
        if (varMatches) {
          varMatches.forEach(match => {
            const propName = match.match(/var\(([^,)]+)/)?.[1]?.trim();
            if (propName) {
              this.usedCustomProperties.add(propName);
            }
          });
        }
      }
    });
  }

  /**
   * Get all used classes
   */
  getUsedClasses(): string[] {
    return Array.from(this.usedClasses);
  }

  /**
   * Get all used keyframes
   */
  getUsedKeyframes(): string[] {
    return Array.from(this.usedKeyframes);
  }

  /**
   * Get all used custom properties
   */
  getUsedCustomProperties(): string[] {
    return Array.from(this.usedCustomProperties);
  }

  /**
   * Generate purged CSS (simplified implementation)
   */
  generatePurgedCSS(originalCSS: string): string {
    const usedClasses = this.getUsedClasses();
    const usedKeyframes = this.getUsedKeyframes();
    const usedCustomProperties = this.getUsedCustomProperties();

    let purgedCSS = originalCSS;

    // This is a simplified implementation
    // In production, you'd use a proper CSS parser like PostCSS
    
    // Remove unused utility classes (basic pattern matching)
    const classRegex = /\.([\w-]+)(?:\:[^{]*)?{[^}]*}/g;
    purgedCSS = purgedCSS.replace(classRegex, (match, className) => {
      // Keep the class if it's used or if it's a base style
      if (usedClasses.some(used => used.includes(className)) || 
          this.isBaseStyle(className)) {
        return match;
      }
      return '';
    });

    // Remove unused keyframes
    const keyframeRegex = /@keyframes\s+([\w-]+)\s*{[^}]*(?:{[^}]*}[^}]*)*}/g;
    purgedCSS = purgedCSS.replace(keyframeRegex, (match, keyframeName) => {
      if (usedKeyframes.includes(keyframeName)) {
        return match;
      }
      return '';
    });

    // Remove unused custom properties from :root
    const rootRegex = /:root\s*{([^}]*)}/g;
    purgedCSS = purgedCSS.replace(rootRegex, (match, content) => {
      const lines = content.split(';');
      const filteredLines = lines.filter(line => {
        const propMatch = line.match(/--([^:]+):/);
        if (propMatch) {
          const propName = `--${propMatch[1].trim()}`;
          return usedCustomProperties.includes(propName);
        }
        return true; // Keep non-custom-property lines
      });
      return `:root{${filteredLines.join(';')}}`;
    });

    // Remove empty rules and compress whitespace
    purgedCSS = purgedCSS
      .replace(/[^{}]*{\s*}/g, '') // Remove empty rules
      .replace(/\s+/g, ' ') // Compress whitespace
      .replace(/;\s*}/g, '}') // Remove trailing semicolons
      .trim();

    return purgedCSS;
  }

  /**
   * Check if a class is a base style that should be kept
   */
  private isBaseStyle(className: string): boolean {
    const baseStyles = [
      'container',
      'sr-only',
      'focus-visible',
      'dark',
      'light',
      // Add other base styles that should always be kept
    ];
    
    return baseStyles.some(base => className.includes(base));
  }

  /**
   * Minify CSS
   */
  minifyCSS(css: string): string {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Compress whitespace
      .replace(/;\s*}/g, '}') // Remove trailing semicolons
      .replace(/\s*{\s*/g, '{') // Remove spaces around braces
      .replace(/;\s*/g, ';') // Remove spaces after semicolons
      .replace(/:\s*/g, ':') // Remove spaces after colons
      .trim();
  }

  /**
   * Extract critical CSS for above-the-fold content
   */
  extractCriticalCSS(css: string): string {
    // Get viewport dimensions
    const viewportHeight = window.innerHeight;
    
    // Find elements in the viewport
    const criticalElements = Array.from(document.querySelectorAll('*')).filter(element => {
      const rect = element.getBoundingClientRect();
      return rect.top < viewportHeight && rect.bottom > 0;
    });

    // Extract classes from critical elements
    const criticalClasses = new Set<string>();
    criticalElements.forEach(element => {
      element.classList.forEach(className => {
        criticalClasses.add(className);
      });
    });

    // Filter CSS to only include critical classes
    const classRegex = /\.([\w-]+)(?:\:[^{]*)?{[^}]*}/g;
    const criticalCSS = css.match(classRegex)?.filter(rule => {
      const className = rule.match(/\.([\w-]+)/)?.[1];
      return className && criticalClasses.has(className);
    }).join('') || '';

    // Always include base styles and CSS variables
    const baseCSS = css.match(/:root\s*{[^}]*}|html\s*{[^}]*}|body\s*{[^}]*}|\*[^{]*{[^}]*}/g)?.join('') || '';

    return baseCSS + criticalCSS;
  }

  /**
   * Get optimization statistics
   */
  getStats(): {
    totalClasses: number;
    usedClasses: number;
    totalKeyframes: number;
    usedKeyframes: number;
    totalCustomProperties: number;
    usedCustomProperties: number;
  } {
    // This would require parsing the original CSS to get total counts
    // For now, return basic stats
    return {
      totalClasses: 0, // Would need CSS parsing
      usedClasses: this.usedClasses.size,
      totalKeyframes: 0, // Would need CSS parsing
      usedKeyframes: this.usedKeyframes.size,
      totalCustomProperties: 0, // Would need CSS parsing
      usedCustomProperties: this.usedCustomProperties.size,
    };
  }

  /**
   * Cleanup observer
   */
  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

/**
 * Optimize CSS with given options
 */
export function optimizeCSS(css: string, options: CSSOptimizationOptions = {}): string {
  const optimizer = new CSSOptimizer();
  let optimizedCSS = css;

  if (options.removeUnusedClasses) {
    optimizedCSS = optimizer.generatePurgedCSS(optimizedCSS);
  }

  if (options.minifyCSS) {
    optimizedCSS = optimizer.minifyCSS(optimizedCSS);
  }

  if (options.extractCriticalCSS) {
    optimizedCSS = optimizer.extractCriticalCSS(optimizedCSS);
  }

  return optimizedCSS;
}

/**
 * Load CSS optimization on page load
 */
export function initializeCSSOptimization(): CSSOptimizer {
  const optimizer = new CSSOptimizer();

  // Log optimization stats after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      const stats = optimizer.getStats();
      console.log('CSS Optimization Stats:', stats);
    }, 1000);
  });

  return optimizer;
}

// Global CSS optimizer instance
export const globalCSSOptimizer = initializeCSSOptimization();