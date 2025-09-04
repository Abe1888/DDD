'use client';

import React, { useState, useCallback, memo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Truck, Calendar, Users, BarChart3, Settings, Menu, X, Cog } from 'lucide-react';
import MemoButton from '@/components/ui/MemoButton';
import { 
  prefetchVehiclesOptimized, 
  prefetchLocationsOptimized, 
  prefetchTeamMembersOptimized, 
  prefetchTasksOptimized,
  prefetchAllDataOptimized 
} from '@/lib/hooks/useOptimizedSWR';

interface OptimizedDashboardLayoutProps {
  children: React.ReactNode;
}

const OptimizedDashboardLayout: React.FC<OptimizedDashboardLayoutProps> = memo(({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, href: '/' },
    { id: 'project', label: 'Project Management', icon: Cog, href: '/project' },
    { id: 'schedule', label: 'Vehicle Schedule', icon: Truck, href: '/schedule' },
    { id: 'timeline', label: 'Installation Timeline', icon: Calendar, href: '/timeline' },
    { id: 'gantt', label: 'Gantt Chart', icon: Calendar, href: '/gantt' },
    { id: 'tasks', label: 'Task Management', icon: Settings, href: '/tasks' },
    { id: 'team', label: 'Team Management', icon: Users, href: '/team' },
  ];

  const isActiveRoute = useCallback((href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  }, [pathname]);

  // Instant prefetch on hover with route-specific data
  const handleNavHover = useCallback((href: string) => {
    switch (href) {
      case '/project':
        // No specific prefetch needed for project management
        break;
      case '/schedule':
        prefetchVehiclesOptimized();
        prefetchLocationsOptimized();
        break;
      case '/timeline':
        prefetchVehiclesOptimized();
        prefetchLocationsOptimized();
        break;
      case '/gantt':
        prefetchVehiclesOptimized();
        prefetchLocationsOptimized();
        break;
      case '/tasks':
        prefetchTasksOptimized();
        prefetchTeamMembersOptimized();
        prefetchVehiclesOptimized();
        break;
      case '/team':
        prefetchTeamMembersOptimized();
        prefetchTasksOptimized();
        break;
      case '/':
        prefetchAllDataOptimized();
        break;
    }
  }, []);

  // Instant navigation with prefetch
  const handleNavClick = useCallback((e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    
    // Prefetch data before navigation
    handleNavHover(href);
    
    // Use router.push for instant navigation
    router.push(href);
  }, [router, handleNavHover]);

  // Aggressive prefetch on layout mount
  React.useEffect(() => {
    let mounted = true;
    
    const timer = setTimeout(() => {
      if (mounted && typeof window !== 'undefined') {
        try {
          prefetchAllDataOptimized();
        } catch (error) {
          console.warn('Failed to prefetch data:', error);
        }
      }
    }, 100); // Reduced delay for faster prefetch
    
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);
  
  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="px-6">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-md">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-slate-900">GPS Installation Management</h1>
                <p className="text-xs text-slate-600">Vehicle Tracking System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Memo Guidelines Button */}
              <MemoButton variant="icon" size="md" />
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-4 h-4 text-slate-600" />
                ) : (
                  <Menu className="w-4 h-4 text-slate-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className={`bg-white border-b border-slate-200 ${
        isMobileMenuOpen ? 'block' : 'hidden md:block'
      }`}>
        <div className="px-6">
          <div className="flex flex-col md:flex-row">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  prefetch={true}
                  onMouseEnter={() => handleNavHover(item.href)}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={`flex items-center space-x-2 py-3 px-4 md:px-6 border-b-2 text-sm font-medium w-full md:w-auto transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
});

OptimizedDashboardLayout.displayName = 'OptimizedDashboardLayout';

export default OptimizedDashboardLayout;