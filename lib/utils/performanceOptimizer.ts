/**
 * Performance optimization utilities for the GPS Installation Management System
 */

// Debounce function for search inputs and filters
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function for scroll events and frequent updates
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memoization utility for expensive calculations
export const memoize = <T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  }) as T;
};

// Virtual scrolling utility for large lists
export const useVirtualScrolling = (
  items: any[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }
  };
};

// Performance monitoring utilities
export const measurePerformance = (name: string, fn: () => void) => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
  } else {
    fn();
  }
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  
  React.useEffect(() => {
    if (!ref.current) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);
    
    observer.observe(ref.current);
    
    return () => observer.disconnect();
  }, [ref, options]);
  
  return isIntersecting;
};

// Optimized state update batching
export const batchUpdates = (updates: (() => void)[]) => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    requestIdleCallback(() => {
      updates.forEach(update => update());
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      updates.forEach(update => update());
    }, 0);
  }
};

// Memory usage monitoring
export const getMemoryUsage = () => {
  if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
    const memory = (window.performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
    };
  }
  return null;
};

// Component render optimization
export const shouldComponentUpdate = (prevProps: any, nextProps: any) => {
  return JSON.stringify(prevProps) !== JSON.stringify(nextProps);
};

// Preload critical resources
export const preloadCriticalResources = () => {
  if (typeof window !== 'undefined') {
    // Preload critical CSS
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = '/globals.css';
    document.head.appendChild(link);
    
    // Preconnect to Supabase
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    document.head.appendChild(preconnect);
  }
};

// Image optimization utility
export const optimizeImageLoading = (imageUrl: string, options: {
  width?: number;
  height?: number;
  quality?: number;
} = {}) => {
  const { width = 800, height = 600, quality = 75 } = options;
  
  if (imageUrl.includes('pexels.com')) {
    // Optimize Pexels images
    return `${imageUrl}?auto=compress&cs=tinysrgb&w=${width}&h=${height}`;
  }
  
  return imageUrl;
};