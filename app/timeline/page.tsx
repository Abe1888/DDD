import { Suspense } from 'react';
import OptimizedDashboardLayout from '@/components/layout/OptimizedDashboardLayout';
import InstantLoader from '@/components/ui/InstantLoader';
import dynamic from 'next/dynamic';

// Enhanced lazy loading with performance optimizations
const InstallationTimeline = dynamic(() => import('@/components/timeline/OptimizedInstallationTimeline'), {
  loading: () => <InstantLoader text="Loading timeline..." minimal />,
  ssr: false,
});

export default function TimelinePage() {
  return (
    <OptimizedDashboardLayout>
      <Suspense fallback={<InstantLoader text="Loading timeline..." />}>
        <InstallationTimeline />
      </Suspense>
    </OptimizedDashboardLayout>
  );
}

export const metadata = {
  title: 'Installation Timeline - GPS Installation Management',
  description: 'View project timeline and installation progress across all locations',
};

// Remove revalidate to prevent loading delays