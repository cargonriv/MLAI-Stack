import { useEffect, useRef, useState } from 'react';

interface ParallaxOptions {
  speed?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  disabled?: boolean;
}

export const useParallax = (options: ParallaxOptions = {}) => {
  const { speed = 0.5, direction = 'up', disabled = false } = options;
  const [offset, setOffset] = useState(0);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (disabled) return;

    const handleScroll = () => {
      const element = elementRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const scrolled = window.pageYOffset;
      const rate = scrolled * -speed;

      let transform = '';
      switch (direction) {
        case 'up':
          transform = `translateY(${rate}px)`;
          break;
        case 'down':
          transform = `translateY(${-rate}px)`;
          break;
        case 'left':
          transform = `translateX(${rate}px)`;
          break;
        case 'right':
          transform = `translateX(${-rate}px)`;
          break;
      }

      setOffset(rate);
      if (element.style) {
        element.style.transform = transform;
      }
    };

    // Use requestAnimationFrame for smooth animations
    let ticking = false;
    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', requestTick, { passive: true });
    
    // Initial call
    handleScroll();

    return () => {
      window.removeEventListener('scroll', requestTick);
    };
  }, [speed, direction, disabled]);

  return { elementRef, offset };
};

// Hook for mouse-based parallax effects
export const useMouseParallax = (intensity: number = 0.1) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const element = elementRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * intensity;
      const deltaY = (e.clientY - centerY) * intensity;

      setPosition({ x: deltaX, y: deltaY });
      
      if (element.style) {
        element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [intensity]);

  return { elementRef, position };
};