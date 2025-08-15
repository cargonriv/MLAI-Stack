// Animation utility functions and constants

export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 800,
  slowest: 1200
} as const;

export const EASING_FUNCTIONS = {
  easeOutQuart: 'cubic-bezier(0.25, 1, 0.5, 1)',
  easeInOutQuart: 'cubic-bezier(0.76, 0, 0.24, 1)',
  easeOutExpo: 'cubic-bezier(0.19, 1, 0.22, 1)',
  easeInOutBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  easeOutBack: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
} as const;

// Predefined animation classes for common patterns
export const ANIMATION_CLASSES = {
  // Fade animations
  fadeIn: 'animate-in fade-in duration-300',
  fadeOut: 'animate-out fade-out duration-300',
  fadeInUp: 'animate-in fade-in slide-in-from-bottom-4 duration-500',
  fadeInDown: 'animate-in fade-in slide-in-from-top-4 duration-500',
  fadeInLeft: 'animate-in fade-in slide-in-from-left-4 duration-500',
  fadeInRight: 'animate-in fade-in slide-in-from-right-4 duration-500',

  // Scale animations
  scaleIn: 'animate-in zoom-in-95 duration-300',
  scaleOut: 'animate-out zoom-out-95 duration-300',
  
  // Slide animations
  slideInUp: 'animate-in slide-in-from-bottom duration-300',
  slideInDown: 'animate-in slide-in-from-top duration-300',
  slideInLeft: 'animate-in slide-in-from-left duration-300',
  slideInRight: 'animate-in slide-in-from-right duration-300',

  // Bounce and spring effects
  bounceIn: 'animate-bounce',
  pulse: 'animate-pulse',
  spin: 'animate-spin',

  // Hover effects
  hoverScale: 'transition-transform duration-200 hover:scale-105',
  hoverGlow: 'transition-all duration-300 hover:shadow-glow-primary',
  hoverLift: 'transition-all duration-200 hover:-translate-y-1 hover:shadow-lg',

  // Focus effects
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-background-primary',
  focusGlow: 'focus:outline-none focus:shadow-glow-primary',

  // Loading states
  shimmer: 'animate-pulse bg-gradient-to-r from-background-secondary via-background-tertiary to-background-secondary bg-[length:200%_100%]',
  skeleton: 'animate-pulse bg-background-tertiary rounded'
} as const;

// Animation state management
export interface AnimationState {
  isAnimating: boolean;
  progress: number;
  direction: 'forward' | 'reverse';
  duration: number;
}

export const createAnimationState = (duration: number = ANIMATION_DURATIONS.normal): AnimationState => ({
  isAnimating: false,
  progress: 0,
  direction: 'forward',
  duration
});

// Stagger animation utility
export const createStaggerDelay = (index: number, baseDelay: number = 100): number => {
  return index * baseDelay;
};

// Spring animation configuration
export interface SpringConfig {
  tension: number;
  friction: number;
  mass: number;
}

export const SPRING_CONFIGS = {
  gentle: { tension: 120, friction: 14, mass: 1 },
  wobbly: { tension: 180, friction: 12, mass: 1 },
  stiff: { tension: 210, friction: 20, mass: 1 },
  slow: { tension: 280, friction: 60, mass: 1 },
  molasses: { tension: 280, friction: 120, mass: 1 }
} as const;

// Intersection Observer utility for scroll animations
export const createScrollObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver => {
  const defaultOptions: IntersectionObserverInit = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
    ...options
  };

  return new IntersectionObserver(callback, defaultOptions);
};

// Performance-optimized animation frame utility
export class AnimationFrameManager {
  private callbacks: Set<() => void> = new Set();
  private isRunning = false;

  add(callback: () => void): void {
    this.callbacks.add(callback);
    if (!this.isRunning) {
      this.start();
    }
  }

  remove(callback: () => void): void {
    this.callbacks.delete(callback);
    if (this.callbacks.size === 0) {
      this.stop();
    }
  }

  private start(): void {
    this.isRunning = true;
    this.tick();
  }

  private stop(): void {
    this.isRunning = false;
  }

  private tick = (): void => {
    if (!this.isRunning) return;

    this.callbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Animation callback error:', error);
      }
    });

    if (this.callbacks.size > 0) {
      requestAnimationFrame(this.tick);
    } else {
      this.stop();
    }
  };
}

// Global animation frame manager instance
export const animationFrameManager = new AnimationFrameManager();

// Utility to check if user prefers reduced motion
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Conditional animation utility
export const conditionalAnimation = (
  animationClass: string,
  fallbackClass: string = ''
): string => {
  return prefersReducedMotion() ? fallbackClass : animationClass;
};

// Smooth scroll utility
export const smoothScrollTo = (
  element: HTMLElement | string,
  options: ScrollIntoViewOptions = {}
): void => {
  const target = typeof element === 'string' 
    ? document.querySelector(element) as HTMLElement
    : element;

  if (!target) return;

  const defaultOptions: ScrollIntoViewOptions = {
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest',
    ...options
  };

  target.scrollIntoView(defaultOptions);
};

// Page transition utilities
export const PAGE_TRANSITIONS = {
  fadeThrough: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
    transition: { duration: 0.3, ease: 'easeInOut' }
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: 'easeInOut' }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.2, ease: 'easeOut' }
  }
} as const;