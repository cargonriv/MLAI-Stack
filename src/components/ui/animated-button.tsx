import React from 'react';
import { useGestureAnimation } from '@/hooks/use-gesture-animation';
import { ANIMATION_CLASSES, conditionalAnimation } from '@/utils/animations';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  ripple?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  ripple = true,
  glow = false,
  children,
  className,
  onClick,
  disabled,
  ...props
}) => {
  const [rippleEffect, setRippleEffect] = React.useState<{ x: number; y: number; id: number } | null>(null);
  const [isPressed, setIsPressed] = React.useState(false);

  const { elementRef, gestureState } = useGestureAnimation({
    onTap: () => {
      if (!disabled && !loading && onClick) {
        onClick({} as React.MouseEvent<HTMLButtonElement>);
      }
    },
    preventScroll: false
  });

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // Create ripple effect
    if (ripple) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      
      setRippleEffect({ x, y, id });
      setTimeout(() => setRippleEffect(null), 600);
    }

    if (onClick) {
      onClick(e);
    }
  };

  const baseClasses = cn(
    'relative overflow-hidden',
    'inline-flex items-center justify-center',
    'font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    conditionalAnimation(ANIMATION_CLASSES.hoverScale, ''),
    {
      // Variants
      'bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-lg hover:shadow-glow-primary focus:ring-accent-primary': variant === 'primary',
      'bg-background-secondary text-foreground-primary border border-background-tertiary hover:bg-background-tertiary focus:ring-accent-primary': variant === 'secondary',
      'text-foreground-primary hover:bg-background-secondary focus:ring-accent-primary': variant === 'ghost',
      'border-2 border-accent-primary text-accent-primary hover:bg-accent-primary hover:text-white focus:ring-accent-primary': variant === 'outline',
      
      // Sizes
      'px-3 py-1.5 text-sm rounded-md': size === 'sm',
      'px-4 py-2 text-base rounded-lg': size === 'md',
      'px-6 py-3 text-lg rounded-xl': size === 'lg',
      
      // States
      'shadow-glow-primary': glow && variant === 'primary',
      'scale-95': gestureState.isPressed && !disabled,
    }
  );

  const iconClasses = cn(
    'transition-transform duration-200',
    {
      'mr-2': iconPosition === 'left' && children,
      'ml-2': iconPosition === 'right' && children,
      'animate-spin': loading && icon,
    }
  );

  return (
    <button
      ref={elementRef}
      className={cn(baseClasses, className)}
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      disabled={disabled || loading}
      {...props}
    >
      {/* Ripple effect */}
      {rippleEffect && (
        <span
          className="absolute pointer-events-none"
          style={{
            left: rippleEffect.x,
            top: rippleEffect.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <span className="block w-0 h-0 rounded-full bg-white/30 animate-ping" 
                style={{ animationDuration: '600ms' }} />
        </span>
      )}

      {/* Content */}
      <span className="relative flex items-center">
        {icon && iconPosition === 'left' && (
          <span className={iconClasses}>
            {loading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              icon
            )}
          </span>
        )}
        
        {children && (
          <span className={cn(
            'transition-all duration-200',
            loading && 'opacity-70'
          )}>
            {children}
          </span>
        )}
        
        {icon && iconPosition === 'right' && (
          <span className={iconClasses}>
            {loading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              icon
            )}
          </span>
        )}
      </span>

      {/* Glow effect overlay */}
      {glow && (
        <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300" />
      )}
    </button>
  );
};