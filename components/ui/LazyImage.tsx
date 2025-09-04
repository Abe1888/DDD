'use client';

import React, { useState, useRef, memo } from 'react';
import { useIntersectionObserver } from '@/lib/utils/performanceOptimizer';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized lazy loading image component with intersection observer
 * Only loads images when they enter the viewport
 */
const LazyImage: React.FC<LazyImageProps> = memo(({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const isInView = useIntersectionObserver(imgRef, {
    threshold: 0.1,
    rootMargin: '50px'
  });

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm"
          aria-hidden="true"
        />
      )}
      
      {/* Actual image */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-500">
          <span className="text-sm">Failed to load image</span>
        </div>
      )}
      
      {/* Loading indicator */}
      {isInView && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;