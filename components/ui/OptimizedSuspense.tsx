'use client';

import React, { Suspense, memo } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface OptimizedSuspenseProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingText?: string;
}

/**
 * Optimized Suspense wrapper with better loading states
 * and performance optimizations for page transitions
 */
const OptimizedSuspense: React.FC<OptimizedSuspenseProps> = memo(({ 
  children, 
  fallback, 
  loadingText = 'Loading...' 
}) => {
  const defaultFallback = (
    <div className="min-h-[200px] flex items-center justify-center">
      <LoadingSpinner text={loadingText} />
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <div className="optimize-rendering">
        {children}
      </div>
    </Suspense>
  );
});

OptimizedSuspense.displayName = 'OptimizedSuspense';

export default OptimizedSuspense;