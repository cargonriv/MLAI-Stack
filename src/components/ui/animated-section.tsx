import React from 'react';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { useParallax } from '@/hooks/use-parallax';
import { ANIMATION_CLASSES, conditionalAnimation } from '@/utils/animations';
import { cn } from '@/lib/utils';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fadeInUp' | 'fadeInDown' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn' | 'slideInUp';
  delay?: number;
  threshold?: number;
  parallax?: boolean;
  parallaxSpeed?: number;
  stagger?: boolean;
  staggerDelay?: number;
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  className,
  animation = 'fadeInUp',
  delay = 0,
  threshold = 0.1,
  parallax = false,
  parallaxSpeed = 0.5,
  stagger = false,
  staggerDelay = 100
}) => {
  const { elementRef: scrollRef, isVisible } = useScrollAnimation({
    threshold,
    delay,
    triggerOnce: true
  });

  const { elementRef: parallaxRef } = useParallax({
    speed: parallaxSpeed,
    disabled: !parallax
  });

  // Combine refs if both scroll and parallax are used
  const combinedRef = React.useCallback((node: HTMLElement | null) => {
    if (scrollRef.current !== node) {
      (scrollRef as React.MutableRefObject<HTMLElement | null>).current = node;
    }
    if (parallax && parallaxRef.current !== node) {
      (parallaxRef as React.MutableRefObject<HTMLElement | null>).current = node;
    }
  }, [scrollRef, parallaxRef, parallax]);

  const animationClass = conditionalAnimation(
    isVisible ? ANIMATION_CLASSES[animation] : 'opacity-0',
    'opacity-100'
  );

  return (
    <section
      ref={combinedRef}
      className={cn(
        'transition-all duration-500',
        animationClass,
        className
      )}
      style={{
        transitionDelay: stagger ? `${staggerDelay}ms` : undefined
      }}
    >
      {children}
    </section>
  );
};

// Animated container for staggered children
interface AnimatedContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  className,
  staggerDelay = 100
}) => {
  const childrenArray = React.Children.toArray(children);

  return (
    <div className={cn('space-y-4', className)}>
      {childrenArray.map((child, index) => (
        <AnimatedSection
          key={index}
          animation="fadeInUp"
          delay={index * staggerDelay}
          className="w-full"
        >
          {child}
        </AnimatedSection>
      ))}
    </div>
  );
};