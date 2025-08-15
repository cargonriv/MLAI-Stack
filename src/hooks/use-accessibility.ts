import { useEffect, useCallback, useState } from 'react';

interface AccessibilityPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  keyboardNavigation: boolean;
  screenReader: boolean;
}

interface AccessibilityState {
  preferences: AccessibilityPreferences;
  focusVisible: boolean;
  announcements: string[];
}

export function useAccessibility() {
  const [state, setState] = useState<AccessibilityState>({
    preferences: {
      reducedMotion: false,
      highContrast: false,
      keyboardNavigation: false,
      screenReader: false,
    },
    focusVisible: false,
    announcements: [],
  });

  // Detect user preferences
  useEffect(() => {
    const detectPreferences = () => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const highContrast = window.matchMedia('(prefers-contrast: high)').matches;
      
      // Detect if user is using keyboard navigation
      let keyboardNavigation = false;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          keyboardNavigation = true;
          document.body.classList.add('keyboard-navigation');
        }
      };
      
      const handleMouseDown = () => {
        keyboardNavigation = false;
        document.body.classList.remove('keyboard-navigation');
      };

      // Detect screen reader usage (basic heuristic)
      const screenReader = window.navigator.userAgent.includes('NVDA') || 
                          window.navigator.userAgent.includes('JAWS') || 
                          window.speechSynthesis !== undefined;

      setState(prev => ({
        ...prev,
        preferences: {
          reducedMotion,
          highContrast,
          keyboardNavigation,
          screenReader,
        },
      }));

      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleMouseDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mousedown', handleMouseDown);
      };
    };

    const cleanup = detectPreferences();

    // Listen for preference changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setState(prev => ({
        ...prev,
        preferences: { ...prev.preferences, reducedMotion: e.matches },
      }));
    };

    const handleContrastChange = (e: MediaQueryListEvent) => {
      setState(prev => ({
        ...prev,
        preferences: { ...prev.preferences, highContrast: e.matches },
      }));
    };

    motionQuery.addEventListener('change', handleMotionChange);
    contrastQuery.addEventListener('change', handleContrastChange);

    return () => {
      cleanup?.();
      motionQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, []);

  // Apply accessibility classes to document
  useEffect(() => {
    const { reducedMotion, highContrast } = state.preferences;
    
    if (reducedMotion) {
      document.documentElement.classList.add('motion-reduce');
    } else {
      document.documentElement.classList.remove('motion-reduce');
    }

    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [state.preferences]);

  // Screen reader announcements
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setState(prev => ({
      ...prev,
      announcements: [...prev.announcements, message],
    }));

    // Create live region for screen reader
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = message;
    
    document.body.appendChild(liveRegion);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion);
      setState(prev => ({
        ...prev,
        announcements: prev.announcements.filter(a => a !== message),
      }));
    }, 1000);
  }, []);

  // Focus management
  const manageFocus = useCallback((element: HTMLElement | null) => {
    if (!element) return;

    element.focus();
    
    // Ensure focus is visible
    setState(prev => ({ ...prev, focusVisible: true }));
    
    // Add focus-visible class for styling
    element.classList.add('focus-visible');
    
    const handleBlur = () => {
      element.classList.remove('focus-visible');
      setState(prev => ({ ...prev, focusVisible: false }));
    };
    
    element.addEventListener('blur', handleBlur, { once: true });
  }, []);

  // Skip link functionality
  const createSkipLink = useCallback((targetId: string, label: string) => {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.className = 'skip-link';
    skipLink.textContent = label;
    
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        manageFocus(target);
      }
    });
    
    return skipLink;
  }, [manageFocus]);

  // Keyboard navigation helpers
  const handleKeyboardNavigation = useCallback((
    e: React.KeyboardEvent,
    options: {
      onEnter?: () => void;
      onSpace?: () => void;
      onEscape?: () => void;
      onArrowUp?: () => void;
      onArrowDown?: () => void;
      onArrowLeft?: () => void;
      onArrowRight?: () => void;
    }
  ) => {
    const { onEnter, onSpace, onEscape, onArrowUp, onArrowDown, onArrowLeft, onArrowRight } = options;
    
    switch (e.key) {
      case 'Enter':
        onEnter?.();
        break;
      case ' ':
        e.preventDefault();
        onSpace?.();
        break;
      case 'Escape':
        onEscape?.();
        break;
      case 'ArrowUp':
        e.preventDefault();
        onArrowUp?.();
        break;
      case 'ArrowDown':
        e.preventDefault();
        onArrowDown?.();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onArrowLeft?.();
        break;
      case 'ArrowRight':
        e.preventDefault();
        onArrowRight?.();
        break;
    }
  }, []);

  // ARIA helpers
  const getAriaProps = useCallback((
    type: 'button' | 'link' | 'heading' | 'region' | 'navigation' | 'main' | 'banner' | 'contentinfo',
    options: {
      label?: string;
      describedBy?: string;
      expanded?: boolean;
      pressed?: boolean;
      current?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
      level?: number;
      live?: 'polite' | 'assertive' | 'off';
    } = {}
  ) => {
    const { label, describedBy, expanded, pressed, current, level, live } = options;
    
    const props: Record<string, any> = {};
    
    if (label) props['aria-label'] = label;
    if (describedBy) props['aria-describedby'] = describedBy;
    if (expanded !== undefined) props['aria-expanded'] = expanded;
    if (pressed !== undefined) props['aria-pressed'] = pressed;
    if (current !== undefined) props['aria-current'] = current;
    if (level !== undefined) props['aria-level'] = level;
    if (live) props['aria-live'] = live;
    
    // Add role based on type
    switch (type) {
      case 'button':
        props.role = 'button';
        props.tabIndex = 0;
        break;
      case 'link':
        props.role = 'link';
        break;
      case 'heading':
        props.role = 'heading';
        break;
      case 'region':
        props.role = 'region';
        break;
      case 'navigation':
        props.role = 'navigation';
        break;
      case 'main':
        props.role = 'main';
        break;
      case 'banner':
        props.role = 'banner';
        break;
      case 'contentinfo':
        props.role = 'contentinfo';
        break;
    }
    
    return props;
  }, []);

  return {
    preferences: state.preferences,
    focusVisible: state.focusVisible,
    announce,
    manageFocus,
    createSkipLink,
    handleKeyboardNavigation,
    getAriaProps,
  };
}

// Hook for focus trap (useful for modals and dropdowns)
export function useFocusTrap(isActive: boolean) {
  const [trapRef, setTrapRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !trapRef) return;

    const focusableElements = trapRef.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
      
      if (e.key === 'Escape') {
        // Allow parent to handle escape
        trapRef.dispatchEvent(new CustomEvent('escape-key'));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Focus first element when trap activates
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, trapRef]);

  return setTrapRef;
}

// Hook for managing ARIA live regions
export function useAriaLiveRegion() {
  const [liveRegion, setLiveRegion] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const region = document.createElement('div');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    document.body.appendChild(region);
    setLiveRegion(region);

    return () => {
      document.body.removeChild(region);
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!liveRegion) return;
    
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }, [liveRegion]);

  return announce;
}