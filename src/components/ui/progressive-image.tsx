import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

interface ProgressiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  skeletonClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const ProgressiveImage = ({
  src,
  alt,
  placeholder,
  className,
  skeletonClassName,
  onLoad,
  onError,
  ...props
}: ProgressiveImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: "50px", // Start loading 50px before the image enters viewport
        threshold: 0.1,
      }
    );

    observerRef.current.observe(img);

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground text-sm",
          className
        )}
      >
        Failed to load image
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Skeleton loader */}
      {!isLoaded && (
        <Skeleton
          className={cn(
            "absolute inset-0 z-10",
            skeletonClassName
          )}
        />
      )}
      
      {/* Placeholder image (low quality) */}
      {placeholder && !isLoaded && isInView && (
        <img
          src={placeholder}
          alt=""
          className={cn(
            "absolute inset-0 w-full h-full object-cover blur-sm scale-110 transition-opacity duration-300",
            className
          )}
          aria-hidden="true"
        />
      )}
      
      {/* Main image */}
      <img
        ref={imgRef}
        src={isInView ? src : undefined}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        {...props}
      />
    </div>
  );
};