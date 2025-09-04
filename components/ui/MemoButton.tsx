'use client';

import React, { useState, memo } from 'react';
import { FileText, Info } from 'lucide-react';
import MemoFlashcard from './MemoFlashcard';

interface MemoButtonProps {
  className?: string;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md' | 'lg';
}

const MemoButton: React.FC<MemoButtonProps> = memo(({ 
  className = '',
  variant = 'icon',
  size = 'md'
}) => {
  const [showMemo, setShowMemo] = useState(false);

  const sizeClasses = {
    sm: variant === 'icon' ? 'p-1.5' : 'px-2 py-1 text-xs',
    md: variant === 'icon' ? 'p-2' : 'px-3 py-1.5 text-sm',
    lg: variant === 'icon' ? 'p-3' : 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const handleComplete = () => {
    setShowMemo(false);
  };

  if (variant === 'button') {
    return (
      <>
        <button
          onClick={() => setShowMemo(true)}
          className={`btn-secondary flex items-center space-x-2 ${sizeClasses[size]} ${className}`}
        >
          <FileText className={iconSizes[size]} />
          <span>Installation Guidelines</span>
        </button>
        
        <MemoFlashcard
          isOpen={showMemo}
          onClose={() => setShowMemo(false)}
          onComplete={handleComplete}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowMemo(true)}
        className={`text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors ${sizeClasses[size]} ${className}`}
        aria-label="View installation guidelines"
        title="Installation Guidelines"
      >
        <FileText className={iconSizes[size]} />
      </button>
      
      <MemoFlashcard
        isOpen={showMemo}
        onClose={() => setShowMemo(false)}
        onComplete={handleComplete}
      />
    </>
  );
});

MemoButton.displayName = 'MemoButton';

export default MemoButton;