'use client';

import React from 'react';
import MemoFlashcard from '@/components/ui/MemoFlashcard';
import { useMemoFlashcard } from '@/hooks/useMemoFlashcard';

interface MemoProviderProps {
  children: React.ReactNode;
}

const MemoProvider: React.FC<MemoProviderProps> = ({ children }) => {
  const { showMemo, markMemoAsRead, closeMemo } = useMemoFlashcard();

  return (
    <>
      {children}
      <MemoFlashcard
        isOpen={showMemo}
        onClose={closeMemo}
        onComplete={markMemoAsRead}
      />
    </>
  );
};

export default MemoProvider;