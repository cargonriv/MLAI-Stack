/**
 * Critical CSS utilities for above-the-fold content optimization
 */

// Critical CSS for immediate rendering (above-the-fold content)
export const criticalCSS = `
/* Critical base styles */
*,*::before,*::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:hsl(var(--border))}
html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";font-feature-settings:normal;font-variation-settings:normal}
body{margin:0;line-height:inherit;background-color:hsl(var(--background));color:hsl(var(--foreground));-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;overflow-x:hidden}

/* Critical CSS variables */
:root{
--background-primary:220 15% 3%;
--background-secondary:220 13% 6%;
--background-tertiary:220 11% 9%;
--background:220 15% 3%;
--foreground-primary:210 40% 98%;
--foreground-secondary:215 25% 75%;
--foreground-tertiary:215 15% 55%;
--foreground:210 40% 98%;
--accent-primary:260 100% 65%;
--accent-secondary:280 100% 70%;
--accent-tertiary:300 100% 75%;
--primary:260 100% 65%;
--primary-foreground:220 15% 3%;
--card:220 13% 6%;
--card-foreground:210 40% 98%;
--border:220 13% 15%;
--ring:260 100% 65%;
--radius:0.5rem;
--gradient-hero:linear-gradient(135deg,hsl(260 100% 65%),hsl(280 100% 70%),hsl(300 100% 75%));
--glow-primary:0 0 40px hsl(260 100% 65% / 0.4);
--duration-fast:150ms;
--duration-normal:300ms;
--ease-out-quart:cubic-bezier(0.25,1,0.5,1);
}

/* Critical layout styles */
.container{width:100%;margin-left:auto;margin-right:auto;padding-left:1rem;padding-right:1rem}
@media(min-width:640px){.container{max-width:640px;padding-left:1.5rem;padding-right:1.5rem}}
@media(min-width:768px){.container{max-width:768px}}
@media(min-width:1024px){.container{max-width:1024px;padding-left:2rem;padding-right:2rem}}
@media(min-width:1280px){.container{max-width:1280px;padding-left:2.5rem;padding-right:2.5rem}}
@media(min-width:1536px){.container{max-width:1536px;padding-left:3rem;padding-right:3rem}}

/* Critical header styles */
.header{position:fixed;top:0;left:0;right:0;z-index:50;background:linear-gradient(135deg,hsl(var(--background-secondary)/0.8),hsl(var(--background-tertiary)/0.6));backdrop-filter:blur(20px);border-bottom:1px solid hsl(var(--border))}

/* Critical hero styles */
.hero{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--gradient-hero);position:relative;overflow:hidden}

/* Critical text styles */
.text-gradient{background:var(--gradient-hero);-webkit-background-clip:text;background-clip:text;color:transparent}

/* Critical button styles */
.btn-primary{background:var(--gradient-hero);color:hsl(var(--primary-foreground));padding:0.75rem 1.5rem;border-radius:var(--radius);border:none;cursor:pointer;transition:all var(--duration-normal) var(--ease-out-quart)}
.btn-primary:hover{box-shadow:var(--glow-primary);transform:translateY(-2px)}

/* Critical loading styles */
.loading{display:inline-block;width:20px;height:20px;border:2px solid hsl(var(--border));border-radius:50%;border-top-color:hsl(var(--primary));animation:spin 1s ease-in-out infinite}
@keyframes spin{to{transform:rotate(360deg)}}

/* Critical responsive utilities */
.hidden{display:none}
@media(max-width:639px){.mobile\\:block{display:block}.mobile\\:hidden{display:none}}
@media(min-width:640px){.sm\\:block{display:block}.sm\\:hidden{display:none}}
@media(min-width:768px){.md\\:block{display:block}.md\\:hidden{display:none}}
@media(min-width:1024px){.lg\\:block{display:block}.lg\\:hidden{display:none}}

/* Critical accessibility */
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.focus-visible\\:ring-2:focus-visible{outline:none;box-shadow:0 0 0 2px hsl(var(--background)),0 0 0 4px hsl(var(--ring))}

/* Critical performance optimizations */
.will-change-transform{will-change:transform}
.will-change-opacity{will-change:opacity}
.gpu-accelerated{transform:translate3d(0,0,0);backface-visibility:hidden}
`;

/**
 * Inject critical CSS into the document head
 */
export function injectCriticalCSS(): void {
  if (typeof document === 'undefined') return;

  const existingStyle = document.getElementById('critical-css');
  if (existingStyle) return;

  const style = document.createElement('style');
  style.id = 'critical-css';
  style.textContent = criticalCSS;
  
  // Insert before any existing stylesheets
  const firstLink = document.querySelector('link[rel="stylesheet"]');
  if (firstLink) {
    document.head.insertBefore(style, firstLink);
  } else {
    document.head.appendChild(style);
  }
}

/**
 * Preload non-critical CSS
 */
export function preloadNonCriticalCSS(): void {
  if (typeof document === 'undefined') return;

  // In production, CSS is already bundled and loaded by Vite
  // Only preload in development mode
  if (import.meta.env.DEV) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = '/src/index.css';
    link.onload = function() {
      this.onload = null;
      this.rel = 'stylesheet';
    };
    document.head.appendChild(link);

    // Fallback for browsers that don't support preload
    const noscript = document.createElement('noscript');
    const fallbackLink = document.createElement('link');
    fallbackLink.rel = 'stylesheet';
    fallbackLink.href = '/src/index.css';
    noscript.appendChild(fallbackLink);
    document.head.appendChild(noscript);
  }
}

/**
 * Load CSS asynchronously
 */
export function loadCSSAsync(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
    document.head.appendChild(link);
  });
}

/**
 * Remove unused CSS classes (basic implementation)
 */
export function removeUnusedCSS(): void {
  if (typeof document === 'undefined') return;

  // Get all stylesheets
  const stylesheets = Array.from(document.styleSheets);
  const usedClasses = new Set<string>();

  // Collect all classes used in the DOM
  const elements = document.querySelectorAll('*');
  elements.forEach(element => {
    const classList = element.classList;
    classList.forEach(className => {
      usedClasses.add(className);
    });
  });

  // This is a simplified implementation
  // In a real-world scenario, you'd use tools like PurgeCSS or UnCSS
  console.log('Used CSS classes:', usedClasses.size);
}

/**
 * Optimize CSS delivery for performance
 */
export function optimizeCSSDelivery(): void {
  // Inject critical CSS immediately
  injectCriticalCSS();

  // Preload non-critical CSS
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preloadNonCriticalCSS);
  } else {
    preloadNonCriticalCSS();
  }

  // Remove unused CSS after page load
  window.addEventListener('load', () => {
    setTimeout(removeUnusedCSS, 1000);
  });
}