import React, { useState, useRef, useEffect } from 'react';
import { 
  generateImageSources, 
  createBlurPlaceholder, 
  globalLazyLoader,
  type ImageOptimizationOptions 
} from '@/utils/imageOptimization';
import { cn } from '@/lib/utils';

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  lazy?: boolean;
  placeholder?: 'blur' | 'empty';
  priority?: boolean;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized image component with modern format support, lazy loading, and performance optimizations
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  quality = 80,
  format = 'webp',
  lazy = true,
  placeholder = 'blur',
  priority = false,
  className,
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const [blurDataUrl, setBlurDataUrl] = useState<string>('');

  // Generate optimized image sources
  const imageSources = generateImageSources(src, {
    quality,
    format,
    width,
    height,
    lazy,
    placeholder,
  });

  // Create blur placeholder
  useEffect(() => {
    if (placeholder === 'blur' && width && height) {
      const blurUrl = createBlurPlaceholder(Math.min(width, 40), Math.min(height, 40));
      setBlurDataUrl(blurUrl);
    }
  }, [placeholder, width, height]);

  // Setup lazy loading
  useEffect(() => {
    const imgElement = imgRef.current;
    if (!imgElement || !lazy || priority) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(imgElement);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(imgElement);

    return () => {
      observer.unobserve(imgElement);
    };
  }, [lazy, priority]);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Preload critical images
  useEffect(() => {
    if (priority && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, src]);

  const shouldShowPlaceholder = !isLoaded && !hasError && placeholder !== 'empty';
  const shouldLoad = isInView || priority;

  return (
    <div 
      className={cn(
        'relative overflow-hidden',
        className
      )}
      style={{ width, height }}
    >
      {/* Blur placeholder */}
      {shouldShowPlaceholder && placeholder === 'blur' && blurDataUrl && (
        <img
          src={blurDataUrl}
          alt=""
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-0' : 'opacity-100'
          )}
          style={{
            filter: 'blur(10px)',
            transform: 'scale(1.1)', // Prevent blur edge artifacts
          }}
        />
      )}

      {/* Loading skeleton */}
      {shouldShowPlaceholder && placeholder === 'empty' && (
        <div 
          className={cn(
            'absolute inset-0 bg-muted animate-pulse transition-opacity duration-300',
            isLoaded ? 'opacity-0' : 'opacity-100'
          )}
        />
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={shouldLoad ? imageSources.src : undefined}
        srcSet={shouldLoad ? imageSources.srcSet : undefined}
        sizes={imageSources.sizes}
        alt={alt}
        width={width}
        height={height}
        loading={lazy && !priority ? 'lazy' : 'eager'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          hasError && 'hidden'
        )}
        style={{
          // Optimize for performance
          willChange: isLoaded ? 'auto' : 'opacity',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)', // Force GPU acceleration
        }}
        {...props}
      />

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <div className="text-center">
            <div className="text-2xl mb-2">📷</div>
            <div className="text-sm">Failed to load image</div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {!isLoaded && !hasError && shouldLoad && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

/**
 * Optimized image with picture element for better format support
 */
export const OptimizedPicture: React.FC<OptimizedImageProps & {
  sources?: Array<{
    srcSet: string;
    type: string;
    media?: string;
  }>;
}> = ({
  src,
  alt,
  sources = [],
  width,
  height,
  quality = 80,
  lazy = true,
  priority = false,
  className,
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <picture className={cn('block', className)}>
      {/* Modern format sources */}
      {sources.map((source, index) => (
        <source
          key={index}
          srcSet={source.srcSet}
          type={source.type}
          media={source.media}
        />
      ))}
      
      {/* Fallback image */}
      <OptimizedImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        quality={quality}
        lazy={lazy}
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </picture>
  );
};

export default OptimizedImage;