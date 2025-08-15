import { useState, useEffect, useCallback, useRef } from 'react';

interface AnimationOptions {
  duration?: number;
  easing?: string;
  fallbackDuration?: number;
  respectMotionPreference?: boolean;
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
  onAnimationError?: (error: Error) => void;
}

interface AnimationState {
  isAnimating: boolean;
  hasError: boolean;
  isSupported: boolean;
  prefersReducedMotion: boolean;
}

export const useGracefulAnimation = (options: AnimationOptions = {}) => {
  const {
    duration = 300,
    easing = 'ease-out',
    fallbackDuration = 0,
    respectMotionPreference = true,
    onAnimationStart,
    onAnimationEnd,
    onAnimationError
  } = options;

  const [state, setState] = useState<AnimationState>({
    isAnimating: false,
    hasError: false,
    isSupported: true,
    prefersReducedMotion: false
  });

  const animationRef = useRef<Animation | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  // Check for animation support and motion preferences
  useEffect(() => {
    const checkSupport = () => {
      const hasAnimationSupport = 'animate' in document.createElement('div');
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      setState(prev => ({
        ...prev,
        isSupported: hasAnimationSupport,
        prefersReducedMotion
      }));
    };

    checkSupport();

    // Listen for changes in motion preferences
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => checkSupport();
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const animate = useCallback((
    element: HTMLElement,
    keyframes: Keyframe[] | PropertyIndexedKeyframes,
    animationOptions?: KeyframeAnimationOptions
  ) => {
    elementRef.current = element;

    // Check if we should skip animation
    const shouldSkipAnimation = 
      !state.isSupported || 
      (respectMotionPreference && state.prefersReducedMotion);

    if (shouldSkipAnimation) {
      // Apply final state immediately
      if (Array.isArray(keyframes) && keyframes.length > 0) {
        const finalFrame = keyframes[keyframes.length - 1];
        Object.assign(element.style, finalFrame);
      }
      
      onAnimationEnd?.();
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      try {
        setState(prev => ({ ...prev, isAnimating: true, hasError: false }));
        onAnimationStart?.();

        const finalOptions: KeyframeAnimationOptions = {
          duration: state.prefersReducedMotion ? fallbackDuration : duration,
          easing,
          fill: 'forwards',
          ...animationOptions
        };

        animationRef.current = element.animate(keyframes, finalOptions);

        animationRef.current.addEventListener('finish', () => {
          setState(prev => ({ ...prev, isAnimating: false }));
          onAnimationEnd?.();
          resolve();
        });

        animationRef.current.addEventListener('cancel', () => {
          setState(prev => ({ ...prev, isAnimating: false }));
          resolve();
        });

        animationRef.current.addEventListener('error', (event) => {
          const error = new Error('Animation failed');
          setState(prev => ({ ...prev, isAnimating: false, hasError: true }));
          onAnimationError?.(error);
          reject(error);
        });

      } catch (error) {
        const err = error instanceof Error ? error : new Error('Animation setup failed');
        setState(prev => ({ ...prev, isAnimating: false, hasError: true }));
        onAnimationError?.(err);
        reject(err);
      }
    });
  }, [state.isSupported, state.prefersReducedMotion, duration, easing, fallbackDuration, respectMotionPreference, onAnimationStart, onAnimationEnd, onAnimationError]);

  const cancel = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.cancel();
      animationRef.current = null;
    }
    setState(prev => ({ ...prev, isAnimating: false }));
  }, []);

  const pause = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.pause();
    }
  }, []);

  const play = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.play();
    }
  }, []);

  return {
    animate,
    cancel,
    pause,
    play,
    ...state
  };
};

// Hook for CSS-based animations with fallbacks
export const useCSSAnimation = (className: string, options: AnimationOptions = {}) => {
  const [isActive, setIsActive] = useState(false);
  const { prefersReducedMotion } = useGracefulAnimation(options);
  
  const trigger = useCallback(() => {
    if (prefersReducedMotion && options.respectMotionPreference) {
      // Skip animation but still trigger callbacks
      options.onAnimationStart?.();
      setTimeout(() => options.onAnimationEnd?.(), 0);
      return;
    }
    
    setIsActive(true);
    options.onAnimationStart?.();
    
    const timeout = setTimeout(() => {
      setIsActive(false);
      options.onAnimationEnd?.();
    }, options.duration || 300);

    return () => clearTimeout(timeout);
  }, [className, prefersReducedMotion, options]);

  const reset = useCallback(() => {
    setIsActive(false);
  }, []);

  return {
    isActive,
    trigger,
    reset,
    className: isActive ? className : '',
    prefersReducedMotion
  };
};

// Utility function to create safe animations
export const createSafeAnimation = (
  element: HTMLElement,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options: KeyframeAnimationOptions = {}
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Check for Web Animations API support
      if (!('animate' in element)) {
        // Fallback: apply final state immediately
        if (Array.isArray(keyframes) && keyframes.length > 0) {
          const finalFrame = keyframes[keyframes.length - 1];
          Object.assign(element.style, finalFrame);
        }
        resolve();
        return;
      }

      // Check motion preferences
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        // Apply final state immediately
        if (Array.isArray(keyframes) && keyframes.length > 0) {
          const finalFrame = keyframes[keyframes.length - 1];
          Object.assign(element.style, finalFrame);
        }
        resolve();
        return;
      }

      const animation = element.animate(keyframes, {
        fill: 'forwards',
        ...options
      });

      animation.addEventListener('finish', () => resolve());
      animation.addEventListener('cancel', () => resolve());
      animation.addEventListener('error', () => {
        // Fallback on error
        if (Array.isArray(keyframes) && keyframes.length > 0) {
          const finalFrame = keyframes[keyframes.length - 1];
          Object.assign(element.style, finalFrame);
        }
        resolve();
      });

    } catch (error) {
      // Fallback on any error
      if (Array.isArray(keyframes) && keyframes.length > 0) {
        const finalFrame = keyframes[keyframes.length - 1];
        Object.assign(element.style, finalFrame);
      }
      resolve();
    }
  });
};