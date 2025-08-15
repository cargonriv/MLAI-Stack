import { useEffect, useRef, useCallback } from 'react';
import { optimizeAnimation, cleanupAnimation } from '@/utils/performance';

interface AnimationOptions {
  property: string;
  duration?: number;
  easing?: string;
  fillMode?: 'forwards' | 'backwards' | 'both' | 'none';
}

export const useOptimizedAnimation = (
  trigger: boolean,
  options: AnimationOptions
) => {
  const elementRef = useRef<HTMLElement>(null);
  const animationRef = useRef<Animation | null>(null);

  const animate = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;

    // Optimize for hardware acceleration
    optimizeAnimation(element, options.property);

    // Cancel any existing animation
    if (animationRef.current) {
      animationRef.current.cancel();
    }

    // Create new animation
    const keyframes = getKeyframes(options.property, trigger);
    
    animationRef.current = element.animate(keyframes, {
      duration: options.duration || 300,
      easing: options.easing || 'ease-out',
      fill: options.fillMode || 'forwards',
    });

    // Cleanup after animation
    animationRef.current.addEventListener('finish', () => {
      cleanupAnimation(element);
    });

  }, [trigger, options.property, options.duration, options.easing, options.fillMode]);

  useEffect(() => {
    animate();
  }, [animate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.cancel();
      }
      if (elementRef.current) {
        cleanupAnimation(elementRef.current);
      }
    };
  }, []);

  return elementRef;
};

const getKeyframes = (property: string, trigger: boolean) => {
  switch (property) {
    case 'opacity':
      return [
        { opacity: trigger ? 0 : 1 },
        { opacity: trigger ? 1 : 0 }
      ];
    case 'transform':
      return [
        { transform: trigger ? 'translateY(20px) scale(0.95)' : 'translateY(0) scale(1)' },
        { transform: trigger ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)' }
      ];
    case 'scale':
      return [
        { transform: trigger ? 'scale(0.95)' : 'scale(1)' },
        { transform: trigger ? 'scale(1)' : 'scale(0.95)' }
      ];
    default:
      return [];
  }
};

// Hook for scroll-triggered animations with performance optimization
export const useScrollAnimation = (threshold: number = 0.1) => {
  const elementRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Optimize for animation
          optimizeAnimation(element, 'transform');
          
          element.style.opacity = '1';
          element.style.transform = 'translateY(0) scale(1)';
          
          // Cleanup after animation
          setTimeout(() => {
            cleanupAnimation(element);
          }, 500);
        }
      },
      {
        threshold,
        rootMargin: '50px',
      }
    );

    // Initial state
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px) scale(0.95)';
    element.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
      cleanupAnimation(element);
    };
  }, [threshold]);

  return elementRef;
};

// Hook for reduced motion preferences
export const useReducedMotion = () => {
  const prefersReducedMotion = 
    typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return prefersReducedMotion;
};