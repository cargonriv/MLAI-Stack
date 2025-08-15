import React from 'react';
import { useGestureAnimation } from '@/hooks/use-gesture-animation';
import { ANIMATION_CLASSES, conditionalAnimation } from '@/utils/animations';
import { cn } from '@/lib/utils';

// Magnetic button that follows cursor
interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  magneticStrength?: number;
  className?: string;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  magneticStrength = 0.3,
  className,
  ...props
}) => {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * magneticStrength;
    const deltaY = (e.clientY - centerY) * magneticStrength;

    setPosition({ x: deltaX, y: deltaY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <button
      ref={buttonRef}
      className={cn(
        'relative transition-transform duration-300 ease-out-back',
        conditionalAnimation(ANIMATION_CLASSES.hoverScale, ''),
        className
      )}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </button>
  );
};

// Tilt card effect
interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  tiltStrength?: number;
  glareEffect?: boolean;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className,
  tiltStrength = 15,
  glareEffect = true
}) => {
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 });
  const [glare, setGlare] = React.useState({ x: 50, y: 50, opacity: 0 });
  const cardRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rotateX = ((e.clientY - centerY) / rect.height) * -tiltStrength;
    const rotateY = ((e.clientX - centerX) / rect.width) * tiltStrength;

    setTilt({ x: rotateX, y: rotateY });

    if (glareEffect) {
      const glareX = ((e.clientX - rect.left) / rect.width) * 100;
      const glareY = ((e.clientY - rect.top) / rect.height) * 100;
      setGlare({ x: glareX, y: glareY, opacity: 0.1 });
    }
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setGlare({ x: 50, y: 50, opacity: 0 });
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        'relative transition-transform duration-300 ease-out-quart',
        'transform-gpu perspective-1000',
        className
      )}
      style={{
        transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {glareEffect && (
        <div
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}) 0%, transparent 50%)`,
            transition: 'opacity 300ms ease-out'
          }}
        />
      )}
    </div>
  );
};

// Morphing button
interface MorphButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  morphTo?: React.ReactNode;
  morphDuration?: number;
  className?: string;
}

export const MorphButton: React.FC<MorphButtonProps> = ({
  children,
  morphTo,
  morphDuration = 300,
  className,
  ...props
}) => {
  const [isMorphed, setIsMorphed] = React.useState(false);

  return (
    <button
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        className
      )}
      onMouseEnter={() => setIsMorphed(true)}
      onMouseLeave={() => setIsMorphed(false)}
      {...props}
    >
      <span
        className={cn(
          'block transition-all duration-300 ease-out-quart',
          isMorphed ? 'transform -translate-y-full opacity-0' : 'transform translate-y-0 opacity-100'
        )}
      >
        {children}
      </span>
      
      {morphTo && (
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out-quart',
            isMorphed ? 'transform translate-y-0 opacity-100' : 'transform translate-y-full opacity-0'
          )}
        >
          {morphTo}
        </span>
      )}
    </button>
  );
};

// Ripple effect component
interface RippleEffectProps {
  children: React.ReactNode;
  className?: string;
  rippleColor?: string;
  duration?: number;
}

export const RippleEffect: React.FC<RippleEffectProps> = ({
  children,
  className,
  rippleColor = 'rgba(255, 255, 255, 0.3)',
  duration = 600
}) => {
  const [ripples, setRipples] = React.useState<Array<{
    x: number;
    y: number;
    id: number;
  }>>([]);

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples(prev => [...prev, { x, y, id }]);

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id));
    }, duration);
  };

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      onClick={handleClick}
    >
      {children}
      
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <span
            className="block w-0 h-0 rounded-full animate-ping"
            style={{
              backgroundColor: rippleColor,
              animationDuration: `${duration}ms`
            }}
          />
        </span>
      ))}
    </div>
  );
};

// Floating label input
interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  error,
  className,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [hasValue, setHasValue] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => {
    setIsFocused(false);
    setHasValue(!!inputRef.current?.value);
  };

  const isFloating = isFocused || hasValue;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        className={cn(
          'w-full px-4 py-3 bg-background-secondary border border-background-tertiary rounded-lg',
          'text-foreground-primary placeholder-transparent',
          'focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent',
          'transition-all duration-200',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        placeholder={label}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
      
      <label
        className={cn(
          'absolute left-4 transition-all duration-200 pointer-events-none',
          'text-foreground-secondary',
          isFloating
            ? 'top-1 text-xs text-accent-primary'
            : 'top-3 text-base'
        )}
      >
        {label}
      </label>
      
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};