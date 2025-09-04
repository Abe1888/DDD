import { Suspense } from 'react';
import OptimizedDashboardLayout from '@/components/layout/OptimizedDashboardLayout';
import InstantLoader from '@/components/ui/InstantLoader';
import dynamic from 'next/dynamic';

// Enhanced lazy loading with performance optimizations
const VehicleSchedule = dynamic(() => import('@/components/schedule/OptimizedVehicleSchedule'), {
  loading: () => <InstantLoader text="Loading schedule..." minimal />,
  ssr: false,
});

export default function SchedulePage() {
  return (
    <OptimizedDashboardLayout>
      <Suspense fallback={<InstantLoader text="Loading schedule..." />}>
        <VehicleSchedule />
      </Suspense>
    </OptimizedDashboardLayout>
  );
}

export const metadata = {
  title: 'Vehicle Schedule - GPS Installation Management',
  description: 'Manage vehicle installation schedules and track progress',
};

// Remove revalidate to prevent loading delays