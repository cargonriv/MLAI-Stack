import React from 'react';
import { useParallax, useMouseParallax } from '@/hooks/use-parallax';
import { conditionalAnimation } from '@/utils/animations';
import { cn } from '@/lib/utils';

interface FloatingElementsProps {
  className?: string;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  opacity?: number;
  speed?: number;
  mouseParallax?: boolean;
  mouseIntensity?: number;
}

export const FloatingElements: React.FC<FloatingElementsProps> = ({
  className,
  count = 6,
  size = 'md',
  opacity = 0.1,
  speed = 0.3,
  mouseParallax = false,
  mouseIntensity = 0.05
}) => {
  const { elementRef: parallaxRef } = useParallax({
    speed,
    direction: 'up'
  });

  const { elementRef: mouseRef } = useMouseParallax(mouseIntensity);

  // Combine refs if both parallax effects are used
  const combinedRef = React.useCallback((node: HTMLElement | null) => {
    if (parallaxRef.current !== node) {
      (parallaxRef as React.MutableRefObject<HTMLElement | null>).current = node;
    }
    if (mouseParallax && mouseRef.current !== node) {
      (mouseRef as React.MutableRefObject<HTMLElement | null>).current = node;
    }
  }, [parallaxRef, mouseRef, mouseParallax]);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-2 h-2';
      case 'md':
        return 'w-4 h-4';
      case 'lg':
        return 'w-6 h-6';
      default:
        return 'w-4 h-4';
    }
  };

  const elements = Array.from({ length: count }, (_, i) => {
    const delay = i * 0.5;
    const duration = 8 + (i % 4) * 2; // Vary duration between 8-14s
    const xPosition = 10 + (i * 15) % 80; // Distribute across width
    const yPosition = 10 + (i * 20) % 80; // Distribute across height
    
    return (
      <div
        key={i}
        className={cn(
          'absolute rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary',
          getSizeClasses(),
          conditionalAnimation('animate-float-slow', '')
        )}
        style={{
          left: `${xPosition}%`,
          top: `${yPosition}%`,
          opacity,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
        }}
      />
    );
  });

  return (
    <div
      ref={combinedRef}
      className={cn(
        'absolute inset-0 pointer-events-none overflow-hidden',
        className
      )}
    >
      {elements}
    </div>
  );
};

// Animated background orbs with more complex movement
export const AnimatedOrbs: React.FC<{
  className?: string;
  count?: number;
}> = ({ className, count = 3 }) => {
  const orbs = Array.from({ length: count }, (_, i) => {
    const size = 200 + (i * 50); // Vary sizes
    const delay = i * 2;
    const duration = 20 + (i * 5);
    
    return (
      <div
        key={i}
        className={cn(
          'absolute rounded-full blur-3xl',
          'bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20',
          conditionalAnimation('animate-float-slow', '')
        )}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          left: `${20 + (i * 30)}%`,
          top: `${10 + (i * 25)}%`,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
        }}
      />
    );
  });

  return (
    <div className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}>
      {orbs}
    </div>
  );
};

// Particle system for more dynamic effects
export const ParticleSystem: React.FC<{
  className?: string;
  particleCount?: number;
  speed?: 'slow' | 'medium' | 'fast';
}> = ({ className, particleCount = 20, speed = 'medium' }) => {
  const getSpeedClass = () => {
    switch (speed) {
      case 'slow':
        return 'animate-float-slow';
      case 'medium':
        return 'animate-float-medium';
      case 'fast':
        return 'animate-float-fast';
      default:
        return 'animate-float-medium';
    }
  };

  const particles = Array.from({ length: particleCount }, (_, i) => {
    const size = Math.random() * 4 + 1; // 1-5px
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const delay = Math.random() * 5;
    const duration = 5 + Math.random() * 10; // 5-15s
    const opacity = 0.1 + Math.random() * 0.3; // 0.1-0.4
    
    return (
      <div
        key={i}
        className={cn(
          'absolute rounded-full bg-accent-primary',
          conditionalAnimation(getSpeedClass(), '')
        )}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          left: `${x}%`,
          top: `${y}%`,
          opacity,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
        }}
      />
    );
  });

  return (
    <div className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}>
      {particles}
    </div>
  );
};