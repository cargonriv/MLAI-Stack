import React from 'react';
import { useLocation } from 'react-router-dom';
import { PAGE_TRANSITIONS, conditionalAnimation } from '@/utils/animations';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  transition?: 'fadeThrough' | 'slideUp' | 'scaleIn';
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className,
  transition = 'fadeThrough'
}) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = React.useState(false);
  const [currentPath, setCurrentPath] = React.useState(location.pathname);

  React.useEffect(() => {
    if (location.pathname !== currentPath) {
      // Page is changing
      setIsVisible(false);
      
      const timer = setTimeout(() => {
        setCurrentPath(location.pathname);
        setIsVisible(true);
      }, 150);

      return () => clearTimeout(timer);
    } else {
      // Initial load or same page
      setIsVisible(true);
    }
  }, [location.pathname, currentPath]);

  const getTransitionClasses = () => {
    const config = PAGE_TRANSITIONS[transition];
    
    if (!isVisible) {
      // Exit state
      switch (transition) {
        case 'fadeThrough':
          return 'opacity-0 scale-105';
        case 'slideUp':
          return 'opacity-0 -translate-y-5';
        case 'scaleIn':
          return 'opacity-0 scale-90';
        default:
          return 'opacity-0';
      }
    } else {
      // Enter state
      return 'opacity-100 scale-100 translate-y-0';
    }
  };

  const transitionClasses = conditionalAnimation(
    cn(
      'transition-all duration-300 ease-out',
      getTransitionClasses()
    ),
    'opacity-100' // Fallback for reduced motion
  );

  return (
    <div className={cn(transitionClasses, className)}>
      {children}
    </div>
  );
};

// Higher-order component for wrapping pages with transitions
export const withPageTransition = <P extends object>(
  Component: React.ComponentType<P>,
  transition: 'fadeThrough' | 'slideUp' | 'scaleIn' = 'fadeThrough'
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <PageTransition transition={transition}>
      <Component {...props} />
    </PageTransition>
  );

  WrappedComponent.displayName = `withPageTransition(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};