'use client';

import React, { memo } from 'react';
import { RefreshCw } from 'lucide-react';

interface InstantLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  minimal?: boolean;
}

const InstantLoader: React.FC<InstantLoaderProps> = memo(({ 
  size = 'md', 
  text = 'Loading...', 
  className = '',
  minimal = false
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };

  if (minimal) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <RefreshCw className={`${sizeClasses[size]} text-blue-600 animate-spin`} />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <RefreshCw className={`${sizeClasses[size]} text-blue-600 animate-spin`} />
      <span className="text-sm text-slate-600">{text}</span>
    </div>
  );
});

InstantLoader.displayName = 'InstantLoader';

export default InstantLoader;