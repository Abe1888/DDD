import React from 'react';
import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

// Optimized lazy loading with better loading states and SSR
const ProjectStats = dynamic(() => import('./ProjectStats'), {
  loading: () => <LoadingSpinner text="Loading project statistics..." />,
  ssr: false,
});

const LocationOverview = dynamic(() => import('./LocationOverview'), {
  loading: () => <LoadingSpinner text="Loading location overview..." />,
  ssr: false,
});

const Dashboard: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="space-y-6 animate-fade-in">
        <React.Suspense fallback={<LoadingSpinner text="Loading dashboard components..." />}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ErrorBoundary fallback={<div className="bg-white border border-slate-200 rounded-lg p-8 text-center"><p className="text-sm text-slate-600">Failed to load project statistics</p></div>}>
              <ProjectStats />
            </ErrorBoundary>
            <ErrorBoundary fallback={<div className="bg-white border border-slate-200 rounded-lg p-8 text-center"><p className="text-sm text-slate-600">Failed to load location overview</p></div>}>
              <LocationOverview />
            </ErrorBoundary>
          </div>
        </React.Suspense>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;