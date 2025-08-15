import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AdvancedVisualEffectsProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'mesh' | 'orbs' | 'particles' | 'glass' | 'dynamic' | 'celebration';
  intensity?: 'low' | 'medium' | 'high';
  interactive?: boolean;
}

export const AdvancedVisualEffects: React.FC<AdvancedVisualEffectsProps> = ({
  children,
  className,
  variant = 'mesh',
  intensity = 'medium',
  interactive = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const baseClasses = cn(
    'relative overflow-hidden transition-all duration-500 ease-out',
    interactive && 'cursor-pointer',
    className
  );

  const getVariantClasses = () => {
    switch (variant) {
      case 'mesh':
        return cn(
          'gradient-mesh-bg',
          intensity === 'low' && 'opacity-30',
          intensity === 'medium' && 'opacity-50',
          intensity === 'high' && 'opacity-70'
        );
      case 'orbs':
        return 'relative';
      case 'particles':
        return 'particle-container';
      case 'glass':
        return cn(
          'glass-effect',
          intensity === 'high' && 'glass-effect-intense'
        );
      case 'dynamic':
        return cn(
          'dynamic-bg',
          interactive && isHovered && 'animate-dynamic-bg-shift'
        );
      case 'celebration':
        return cn(
          'particle-celebration',
          isActive && 'animate-celebration-particle'
        );
      default:
        return '';
    }
  };

  const getInteractiveClasses = () => {
    if (!interactive) return '';
    
    return cn(
      'color-scheme-interactive',
      'hover-3d',
      isHovered && 'shadow-glow-hover',
      isActive && 'shadow-glow-active'
    );
  };

  return (
    <div
      ref={containerRef}
      className={cn(baseClasses, getVariantClasses(), getInteractiveClasses())}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
    >
      {variant === 'orbs' && (
        <>
          <div className="gradient-orb gradient-orb-1 animate-orb-float" />
          <div className="gradient-orb gradient-orb-2 animate-orb-float" style={{ animationDelay: '-5s' }} />
          <div className="gradient-orb gradient-orb-3 animate-orb-float" style={{ animationDelay: '-10s' }} />
        </>
      )}
      
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
};

interface GradientBorderProps {
  children: React.ReactNode;
  className?: string;
  animated?: boolean;
  thickness?: number;
}

export const GradientBorder: React.FC<GradientBorderProps> = ({
  children,
  className,
  animated = false,
  thickness = 2
}) => {
  return (
    <div
      className={cn(
        'gradient-border',
        animated && 'gradient-border-animated',
        className
      )}
      style={{ '--border-thickness': `${thickness}px` } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

interface Hover3DProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'subtle' | 'medium' | 'intense';
  rotateX?: number;
  rotateY?: number;
  translateZ?: number;
  scale?: number;
}

export const Hover3D: React.FC<Hover3DProps> = ({
  children,
  className,
  intensity = 'medium',
  rotateX,
  rotateY,
  translateZ,
  scale
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getIntensityValues = () => {
    switch (intensity) {
      case 'subtle':
        return { rotateX: 2, rotateY: 2, translateZ: 10, scale: 1.02 };
      case 'medium':
        return { rotateX: 5, rotateY: 5, translateZ: 20, scale: 1.05 };
      case 'intense':
        return { rotateX: 15, rotateY: 15, translateZ: 50, scale: 1.1 };
      default:
        return { rotateX: 5, rotateY: 5, translateZ: 20, scale: 1.05 };
    }
  };

  const values = getIntensityValues();
  const finalRotateX = rotateX ?? values.rotateX;
  const finalRotateY = rotateY ?? values.rotateY;
  const finalTranslateZ = translateZ ?? values.translateZ;
  const finalScale = scale ?? values.scale;

  return (
    <div
      className={cn(
        'hover-3d transition-all duration-300 ease-out',
        intensity === 'intense' && 'hover-3d-intense',
        className
      )}
      style={{
        '--transform-rotate-x': `${isHovered ? finalRotateX : 0}deg`,
        '--transform-rotate-y': `${isHovered ? finalRotateY : 0}deg`,
        '--transform-translate-z': `${isHovered ? finalTranslateZ : 0}px`,
        '--transform-scale': isHovered ? finalScale : 1,
      } as React.CSSProperties}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
};

interface ParticleEffectProps {
  trigger?: boolean;
  type?: 'celebration' | 'ambient' | 'interactive';
  count?: number;
  duration?: number;
  colors?: string[];
}

export const ParticleEffect: React.FC<ParticleEffectProps> = ({
  trigger = false,
  type = 'ambient',
  count = 50,
  duration = 2000,
  colors = ['hsl(var(--accent-primary))', 'hsl(var(--accent-secondary))', 'hsl(var(--accent-tertiary))']
}) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; delay: number }>>([]);

  useEffect(() => {
    if (trigger && type === 'celebration') {
      const newParticles = Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 1000
      }));
      
      setParticles(newParticles);
      
      setTimeout(() => {
        setParticles([]);
      }, duration);
    }
  }, [trigger, type, count, duration, colors]);

  if (type === 'ambient') {
    return <div className="particle-container" />;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full animate-celebration-particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}ms`
          }}
        />
      ))}
    </div>
  );
};

interface DynamicColorSchemeProps {
  children: React.ReactNode;
  className?: string;
  hueShift?: number;
  saturationBoost?: number;
  brightnessBoost?: number;
}

export const DynamicColorScheme: React.FC<DynamicColorSchemeProps> = ({
  children,
  className,
  hueShift = 30,
  saturationBoost = 0.2,
  brightnessBoost = 0.1
}) => {
  const [isInteracting, setIsInteracting] = useState(false);

  return (
    <div
      className={cn(
        'theme-transition-smooth',
        className
      )}
      style={{
        filter: isInteracting 
          ? `hue-rotate(${hueShift}deg) saturate(${1 + saturationBoost}) brightness(${1 + brightnessBoost})`
          : 'none'
      }}
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
    >
      {children}
    </div>
  );
};

interface ThemeTransitionProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  easing?: string;
}

export const ThemeTransition: React.FC<ThemeTransitionProps> = ({
  children,
  className,
  duration = 500,
  easing = 'cubic-bezier(0.4, 0, 0.2, 1)'
}) => {
  return (
    <div
      className={cn('theme-transition', className)}
      style={{
        '--theme-transition-duration': `${duration}ms`,
        '--theme-transition-easing': easing
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

// Export all components
export {
  AdvancedVisualEffects as default,
  GradientBorder,
  Hover3D,
  ParticleEffect,
  DynamicColorScheme,
  ThemeTransition
};