import React, { memo } from 'react';
import { RefreshCw } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = memo(({ 
  size = 'md', 
  text = 'Loading...', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center justify-center space-x-3 ${className}`}>
      <RefreshCw className={`${sizeClasses[size]} text-blue-600 animate-spin`} />
      <span className="text-sm text-slate-600">{text}</span>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;