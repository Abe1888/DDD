import { Suspense } from 'react';
import OptimizedDashboardLayout from '@/components/layout/OptimizedDashboardLayout';
import InstantLoader from '@/components/ui/InstantLoader';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import dynamic from 'next/dynamic';

// Optimized lazy loading with better performance
const Dashboard = dynamic(() => import('@/components/dashboard/OptimizedDashboard'), {
  loading: () => <InstantLoader text="Loading dashboard..." />,
  ssr: false,
});

// Server component for initial page load optimization
export default function HomePage() {
  return (
    <ErrorBoundary>
      <OptimizedDashboardLayout>
        <Suspense fallback={<InstantLoader text="Loading dashboard..." />}>
          <Dashboard />
        </Suspense>
      </OptimizedDashboardLayout>
    </ErrorBoundary>
  );
}

// Remove ISR to prevent loading issues
// export const revalidate = 60;