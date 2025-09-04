import { Suspense } from 'react';
import OptimizedDashboardLayout from '@/components/layout/OptimizedDashboardLayout';
import InstantLoader from '@/components/ui/InstantLoader';
import dynamic from 'next/dynamic';

// Enhanced lazy loading with performance optimizations
const TeamManagement = dynamic(() => import('@/components/team/OptimizedTeamManagement'), {
  loading: () => <InstantLoader text="Loading team..." minimal />,
  ssr: false,
});

export default function TeamPage() {
  return (
    <OptimizedDashboardLayout>
      <Suspense fallback={<InstantLoader text="Loading team..." />}>
        <TeamManagement />
      </Suspense>
    </OptimizedDashboardLayout>
  );
}

export const metadata = {
  title: 'Team Management - GPS Installation Management',
  description: 'Monitor team performance and manage task assignments',
};

// Remove revalidate to prevent loading delays