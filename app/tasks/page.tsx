import { Suspense } from 'react';
import OptimizedDashboardLayout from '@/components/layout/OptimizedDashboardLayout';
import InstantLoader from '@/components/ui/InstantLoader';
import dynamic from 'next/dynamic';

// Enhanced lazy loading with performance optimizations
const TaskManagement = dynamic(() => import('@/components/tasks/OptimizedTaskManagement'), {
  loading: () => <InstantLoader text="Loading tasks..." minimal />,
  ssr: false,
});

export default function TasksPage() {
  return (
    <OptimizedDashboardLayout>
      <Suspense fallback={<InstantLoader text="Loading tasks..." />}>
        <TaskManagement />
      </Suspense>
    </OptimizedDashboardLayout>
  );
}

export const metadata = {
  title: 'Task Management - GPS Installation Management',
  description: 'Manage installation and maintenance tasks with team assignments',
};

// Remove revalidate to prevent loading delays