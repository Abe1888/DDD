import { Suspense } from 'react';
import OptimizedDashboardLayout from '@/components/layout/OptimizedDashboardLayout';
import InstantLoader from '@/components/ui/InstantLoader';
import dynamic from 'next/dynamic';

// Enhanced lazy loading with performance optimizations
const ProjectManagement = dynamic(() => import('@/components/dashboard/ProjectManagement'), {
  loading: () => <InstantLoader text="Loading project management..." minimal />,
  ssr: false,
});

export default function ProjectPage() {
  return (
    <OptimizedDashboardLayout>
      <Suspense fallback={<InstantLoader text="Loading project management..." />}>
        <ProjectManagement />
      </Suspense>
    </OptimizedDashboardLayout>
  );
}

export const metadata = {
  title: 'Project Management - GPS Installation Management',
  description: 'Control project timeline, reset functionality, and schedule management',
};