'use client';

import { useState, useEffect } from 'react';

const MEMO_READ_KEY = 'gps-installation-memo-read';

export const useMemoFlashcard = () => {
  const [showMemo, setShowMemo] = useState(false);
  const [hasReadMemo, setHasReadMemo] = useState(false);

  useEffect(() => {
    // Check if user has already read the memo
    const memoRead = localStorage.getItem(MEMO_READ_KEY);
    
    if (!memoRead) {
      // Show memo after a short delay to ensure page is loaded
      const timer = setTimeout(() => {
        setShowMemo(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      setHasReadMemo(true);
    }
  }, []);

  const markMemoAsRead = () => {
    localStorage.setItem(MEMO_READ_KEY, 'true');
    setHasReadMemo(true);
    setShowMemo(false);
  };

  const resetMemoStatus = () => {
    localStorage.removeItem(MEMO_READ_KEY);
    setHasReadMemo(false);
  };

  const showMemoAgain = () => {
    setShowMemo(true);
  };

  return {
    showMemo,
    hasReadMemo,
    markMemoAsRead,
    resetMemoStatus,
    showMemoAgain,
    closeMemo: () => setShowMemo(false)
  };
};