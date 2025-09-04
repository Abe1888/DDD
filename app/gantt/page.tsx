import { Suspense } from 'react';
import OptimizedDashboardLayout from '@/components/layout/OptimizedDashboardLayout';
import InstantLoader from '@/components/ui/InstantLoader';
import dynamic from 'next/dynamic';

// Enhanced lazy loading for heavy Gantt chart with performance optimizations
const GanttChart = dynamic(() => import('@/components/gantt/OptimizedGanttChart'), {
  loading: () => <InstantLoader text="Loading chart..." minimal />,
  ssr: false,
});

export default function GanttPage() {
  return (
    <OptimizedDashboardLayout>
      <Suspense fallback={<InstantLoader text="Loading chart..." />}>
        <GanttChart />
      </Suspense>
    </OptimizedDashboardLayout>
  );
}

export const metadata = {
  title: 'Gantt Chart - GPS Installation Management',
  description: 'Visual project timeline and task scheduling with Gantt chart view',
};

// Remove revalidate to prevent loading delays