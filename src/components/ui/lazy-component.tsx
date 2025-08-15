import { useState, useRef, useEffect, ReactNode, Suspense } from "react";
import { Skeleton } from "./skeleton";

interface LazyComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  className?: string;
  minHeight?: string;
}

export const LazyComponent = ({
  children,
  fallback,
  rootMargin = "100px",
  threshold = 0.1,
  className,
  minHeight = "200px",
}: LazyComponentProps) => {
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  const defaultFallback = (
    <div className="space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-32 w-full" />
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight }}
    >
      {isInView ? (
        <Suspense fallback={fallback || defaultFallback}>
          {children}
        </Suspense>
      ) : (
        fallback || defaultFallback
      )}
    </div>
  );
};