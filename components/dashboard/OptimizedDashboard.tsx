'use client';

import React, { memo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import InstantLoader from '@/components/ui/InstantLoader';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import ProjectCountdown from '@/components/ui/ProjectCountdown';
import ProjectStatusBadge from '@/components/ui/ProjectStatusBadge';
import MemoFlashcard from '@/components/ui/MemoFlashcard';
import MemoTooltip from '@/components/ui/MemoTooltip';
import { useMemoFlashcard } from '@/hooks/useMemoFlashcard';
import { useProjectSettings } from '@/lib/hooks/useProjectSettings';

// Ultra-optimized lazy loading with instant fallbacks
const ProjectStats = dynamic(() => import('./OptimizedProjectStats'), {
  loading: () => <InstantLoader text="Loading stats..." minimal />,
  ssr: false,
});

const LocationOverview = dynamic(() => import('./OptimizedLocationOverview'), {
  loading: () => <InstantLoader text="Loading locations..." minimal />,
  ssr: false,
});

const OptimizedDashboard: React.FC = memo(() => {
  const { projectSettings, refetch: refetchProjectSettings } = useProjectSettings();
  const { showMemo, markMemoAsRead, closeMemo } = useMemoFlashcard();
  const currentStartDate = projectSettings?.project_start_date || new Date().toISOString().split('T')[0];

  // Force re-render when project settings change
  const [renderKey, setRenderKey] = React.useState(0);
  
  React.useEffect(() => {
    setRenderKey(prev => prev + 1);
  }, [projectSettings?.project_start_date]);
  // Listen for project settings changes and force re-render
  React.useEffect(() => {
    const handleStorageChange = () => {
      refetchProjectSettings();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refetchProjectSettings]);
  return (
    <ErrorBoundary>
      {/* Memo Flashcard */}
      <MemoFlashcard
        isOpen={showMemo}
        onClose={closeMemo}
        onComplete={markMemoAsRead}
      />
      
      <div key={renderKey} className="space-y-6 animate-fade-in">
        {/* Project Status Header */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-1">
                GPS Installation Management Dashboard
              </h2>
              <p className="text-sm text-slate-600">
                Monitor project progress and manage installation schedules
              </p>
              <div className="text-xs text-slate-500 mt-1">
                Project Start: {new Date(currentStartDate).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MemoTooltip />
              <ProjectStatusBadge startDate={currentStartDate} size="lg" />
            </div>
          </div>
        </div>

        {/* Project Countdown - Prominent placement */}
        <ErrorBoundary fallback={
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
            <p className="text-sm text-slate-600">Failed to load project countdown</p>
          </div>
        }>
          <ProjectCountdown 
            startDate={currentStartDate}
            key={currentStartDate} // Force re-render when date changes
            onCountdownComplete={() => console.log('Project started!')}
          />
        </ErrorBoundary>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ErrorBoundary fallback={
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
              <p className="text-sm text-slate-600">Failed to load project statistics</p>
            </div>
          }>
            <Suspense fallback={<InstantLoader text="Loading stats..." />}>
              <ProjectStats />
            </Suspense>
          </ErrorBoundary>
          
          <ErrorBoundary fallback={
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
              <p className="text-sm text-slate-600">Failed to load location overview</p>
            </div>
          }>
            <Suspense fallback={<InstantLoader text="Loading locations..." />}>
              <LocationOverview />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  );
});

OptimizedDashboard.displayName = 'OptimizedDashboard';

export default OptimizedDashboard;