import React from 'react';
import { conditionalAnimation } from '@/utils/animations';
import { cn } from '@/lib/utils';

interface ScrollProgressProps {
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  thickness?: number;
  color?: 'primary' | 'secondary' | 'accent';
  showPercentage?: boolean;
}

export const ScrollProgress: React.FC<ScrollProgressProps> = ({
  className,
  position = 'top',
  thickness = 3,
  color = 'primary',
  showPercentage = false
}) => {
  const [scrollProgress, setScrollProgress] = React.useState(0);

  React.useEffect(() => {
    const updateScrollProgress = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(Math.min(Math.max(progress, 0), 100));
    };

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress(); // Initial call

    return () => window.removeEventListener('scroll', updateScrollProgress);
  }, []);

  const getColorClasses = () => {
    switch (color) {
      case 'primary':
        return 'bg-gradient-to-r from-accent-primary to-accent-secondary';
      case 'secondary':
        return 'bg-gradient-to-r from-accent-secondary to-accent-tertiary';
      case 'accent':
        return 'bg-accent-primary';
      default:
        return 'bg-gradient-to-r from-accent-primary to-accent-secondary';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'fixed top-0 left-0 right-0 z-50';
      case 'bottom':
        return 'fixed bottom-0 left-0 right-0 z-50';
      case 'left':
        return 'fixed top-0 left-0 bottom-0 z-50';
      case 'right':
        return 'fixed top-0 right-0 bottom-0 z-50';
      default:
        return 'fixed top-0 left-0 right-0 z-50';
    }
  };

  const getProgressStyle = () => {
    const isHorizontal = position === 'top' || position === 'bottom';
    
    if (isHorizontal) {
      return {
        width: `${scrollProgress}%`,
        height: `${thickness}px`
      };
    } else {
      return {
        height: `${scrollProgress}%`,
        width: `${thickness}px`
      };
    }
  };

  return (
    <>
      <div className={cn(getPositionClasses(), className)}>
        <div
          className={cn(
            'transition-all duration-150 ease-out',
            getColorClasses(),
            conditionalAnimation('', 'opacity-50')
          )}
          style={getProgressStyle()}
        />
      </div>
      
      {showPercentage && (
        <div className="fixed top-4 right-4 z-50 bg-background-secondary/80 backdrop-blur-sm rounded-lg px-3 py-1 text-sm font-medium text-foreground-primary">
          {Math.round(scrollProgress)}%
        </div>
      )}
    </>
  );
};

// Circular scroll progress indicator
export const CircularScrollProgress: React.FC<{
  className?: string;
  size?: number;
  strokeWidth?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}> = ({
  className,
  size = 60,
  strokeWidth = 3,
  position = 'bottom-right'
}) => {
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  React.useEffect(() => {
    const updateScrollProgress = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(Math.min(Math.max(progress, 0), 100));
    };

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress();

    return () => window.removeEventListener('scroll', updateScrollProgress);
  }, []);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'fixed top-4 left-4 z-50';
      case 'top-right':
        return 'fixed top-4 right-4 z-50';
      case 'bottom-left':
        return 'fixed bottom-4 left-4 z-50';
      case 'bottom-right':
        return 'fixed bottom-4 right-4 z-50';
      default:
        return 'fixed bottom-4 right-4 z-50';
    }
  };

  return (
    <div className={cn(getPositionClasses(), className)}>
      <div className="relative">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="hsl(var(--background-tertiary))"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#gradient)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={conditionalAnimation('transition-all duration-150 ease-out', '')}
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--accent-primary))" />
              <stop offset="100%" stopColor="hsl(var(--accent-secondary))" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-foreground-secondary">
            {Math.round(scrollProgress)}%
          </span>
        </div>
      </div>
    </div>
  );
};