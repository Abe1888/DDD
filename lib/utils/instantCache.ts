/**
 * Instant caching utilities for ultra-fast tab switching
 */

// Memory cache for instant data access
class InstantCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize = 50;

  set(key: string, data: any, ttl: number = 300000) { // 5 minutes default TTL
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }

  // Clean expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
export const instantCache = new InstantCache();

// Auto-cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    instantCache.cleanup();
  }, 300000);
}

// Cache wrapper for SWR
export const withInstantCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300000
) => {
  return async (): Promise<T> => {
    // Try cache first
    const cached = instantCache.get(key);
    if (cached) {
      console.log(`Cache hit for ${key}`);
      return cached;
    }

    // Fetch and cache
    try {
      const data = await fetcher();
      instantCache.set(key, data, ttl);
      console.log(`Cache miss, fetched and cached ${key}`);
      return data;
    } catch (error) {
      console.error(`Failed to fetch ${key}:`, error);
      throw error;
    }
  };
};

// Preload critical data for instant access
export const preloadCriticalData = () => {
  if (typeof window !== 'undefined') {
    // Preload in background after page load
    setTimeout(() => {
      import('@/lib/hooks/useOptimizedSWR').then(({ prefetchAllDataOptimized }) => {
        prefetchAllDataOptimized();
      }).catch(console.error);
    }, 1000);
  }
};

// Route-specific cache warming
export const warmCacheForRoute = (route: string) => {
  if (typeof window !== 'undefined') {
    switch (route) {
      case '/schedule':
        import('@/lib/hooks/useOptimizedSWR').then(({ prefetchVehiclesOptimized, prefetchLocationsOptimized }) => {
          prefetchVehiclesOptimized();
          prefetchLocationsOptimized();
        }).catch(console.error);
        break;
      case '/timeline':
        import('@/lib/hooks/useOptimizedSWR').then(({ prefetchVehiclesOptimized, prefetchLocationsOptimized }) => {
          prefetchVehiclesOptimized();
          prefetchLocationsOptimized();
        }).catch(console.error);
        break;
      case '/gantt':
        import('@/lib/hooks/useOptimizedSWR').then(({ prefetchVehiclesOptimized, prefetchLocationsOptimized }) => {
          prefetchVehiclesOptimized();
          prefetchLocationsOptimized();
        }).catch(console.error);
        break;
      case '/tasks':
        import('@/lib/hooks/useOptimizedSWR').then(({ prefetchTasksOptimized, prefetchTeamMembersOptimized }) => {
          prefetchTasksOptimized();
          prefetchTeamMembersOptimized();
        }).catch(console.error);
        break;
      case '/team':
        import('@/lib/hooks/useOptimizedSWR').then(({ prefetchTeamMembersOptimized, prefetchTasksOptimized }) => {
          prefetchTeamMembersOptimized();
          prefetchTasksOptimized();
        }).catch(console.error);
        break;
    }
  }
};