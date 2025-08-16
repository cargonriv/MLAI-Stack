/**
 * Image optimization utilities for modern format support and performance
 */

export interface ImageOptimizationOptions {
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  width?: number;
  height?: number;
  lazy?: boolean;
  placeholder?: 'blur' | 'empty';
}

/**
 * Check if browser supports modern image formats
 */
export function checkImageFormatSupport(): {
  webp: boolean;
  avif: boolean;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;

  return {
    webp: canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0,
    avif: canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0,
  };
}

/**
 * Generate optimized image sources with fallbacks
 */
export function generateImageSources(
  src: string,
  options: ImageOptimizationOptions = {}
): {
  srcSet: string;
  src: string;
  sizes?: string;
} {
  const { quality = 80, width, height } = options;
  const support = checkImageFormatSupport();
  
  // Generate different sizes for responsive images
  const sizes = width ? [width, Math.floor(width * 0.75), Math.floor(width * 0.5)] : [1920, 1280, 640];
  
  const sources: string[] = [];
  
  // Add AVIF sources if supported
  if (support.avif) {
    sizes.forEach(size => {
      sources.push(`${getOptimizedImageUrl(src, { ...options, format: 'avif', width: size, quality })} ${size}w`);
    });
  }
  
  // Add WebP sources if supported
  if (support.webp) {
    sizes.forEach(size => {
      sources.push(`${getOptimizedImageUrl(src, { ...options, format: 'webp', width: size, quality })} ${size}w`);
    });
  }
  
  // Add fallback JPEG sources
  sizes.forEach(size => {
    sources.push(`${getOptimizedImageUrl(src, { ...options, format: 'jpeg', width: size, quality })} ${size}w`);
  });

  return {
    srcSet: sources.join(', '),
    src: getOptimizedImageUrl(src, { ...options, format: 'jpeg', quality }),
    sizes: '(max-width: 640px) 100vw, (max-width: 1280px) 75vw, 50vw',
  };
}

/**
 * Get optimized image URL (placeholder implementation)
 * In a real implementation, this would integrate with a CDN or image optimization service
 */
function getOptimizedImageUrl(src: string, options: ImageOptimizationOptions): string {
  // For now, return the original src
  // In production, you'd integrate with services like:
  // - Cloudinary: `https://res.cloudinary.com/demo/image/fetch/f_${format},q_${quality},w_${width}/${src}`
  // - ImageKit: `https://ik.imagekit.io/demo/${src}?tr=f-${format},q-${quality},w-${width}`
  // - Next.js Image Optimization API
  
  const params = new URLSearchParams();
  if (options.format) params.set('format', options.format);
  if (options.quality) params.set('quality', options.quality.toString());
  if (options.width) params.set('width', options.width.toString());
  if (options.height) params.set('height', options.height.toString());
  
  const queryString = params.toString();
  return queryString ? `${src}?${queryString}` : src;
}

/**
 * Create a blur placeholder for images
 */
export function createBlurPlaceholder(width: number = 40, height: number = 40): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Create a simple gradient placeholder
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, 'hsl(220, 13%, 6%)');
  gradient.addColorStop(1, 'hsl(220, 11%, 9%)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL('image/jpeg', 0.1);
}

/**
 * Lazy load images with Intersection Observer
 */
export class LazyImageLoader {
  private observer: IntersectionObserver;
  private images: Set<HTMLImageElement> = new Set();

  constructor(options: IntersectionObserverInit = {}) {
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
        ...options,
      }
    );
  }

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        this.loadImage(img);
        this.observer.unobserve(img);
        this.images.delete(img);
      }
    });
  }

  private loadImage(img: HTMLImageElement) {
    const src = img.dataset.src;
    const srcSet = img.dataset.srcset;
    
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
    }
    
    if (srcSet) {
      img.srcset = srcSet;
      img.removeAttribute('data-srcset');
    }
    
    img.classList.remove('lazy-loading');
    img.classList.add('lazy-loaded');
    
    // Trigger fade-in animation
    img.style.opacity = '1';
  }

  observe(img: HTMLImageElement) {
    this.images.add(img);
    this.observer.observe(img);
  }

  unobserve(img: HTMLImageElement) {
    this.images.delete(img);
    this.observer.unobserve(img);
  }

  disconnect() {
    this.observer.disconnect();
    this.images.clear();
  }
}

/**
 * Preload critical images
 */
export function preloadCriticalImages(images: string[]) {
  images.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
}

/**
 * Convert image to WebP format (client-side)
 */
export function convertToWebP(
  file: File,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert image to WebP'));
            }
          },
          'image/webp',
          quality
        );
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Optimize image file size
 */
export function optimizeImageFile(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'webp'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      if (ctx) {
        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, `.${format}`),
                {
                  type: `image/${format}`,
                  lastModified: Date.now(),
                }
              );
              resolve(optimizedFile);
            } else {
              reject(new Error('Failed to optimize image'));
            }
          },
          `image/${format}`,
          quality
        );
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

// Global lazy image loader instance
export const globalLazyLoader = new LazyImageLoader();

// Initialize lazy loading on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Find all lazy images and start observing them
      const lazyImages = document.querySelectorAll('img[data-src]');
      lazyImages.forEach(img => {
        globalLazyLoader.observe(img as HTMLImageElement);
      });
    });
  }
}