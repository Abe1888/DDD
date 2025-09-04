'use client';

import React, { memo, useCallback } from 'react';
import { Calendar, Settings, BarChart3 } from 'lucide-react';
import ProjectCountdown from '@/components/ui/ProjectCountdown';
import ProjectControls from '@/components/ui/ProjectControls';
import { useProjectSettings } from '@/lib/hooks/useProjectSettings';
import { useVehiclesSWR, useTasksSWR } from '@/lib/hooks/useSWR';

const ProjectManagement = memo(() => {
  const { projectSettings } = useProjectSettings();
  const { mutate: refetchVehicles } = useVehiclesSWR();
  const { mutate: refetchTasks } = useTasksSWR();

  const handleProjectReset = useCallback(() => {
    // Refresh all data after project reset
    refetchVehicles();
    refetchTasks();
    
    // Reload the page to ensure all components are refreshed
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }, [refetchVehicles, refetchTasks]);

  const handleStartDateChange = useCallback((newDate: string) => {
    // Refresh all data after date change
    refetchVehicles();
    refetchTasks();
    
    // Force a complete page refresh to ensure all components update
    setTimeout(() => {
      window.location.reload();
    }, 500);
    
    console.log('Project start date changed to:', newDate);
  }, [refetchVehicles, refetchTasks]);

  const handleCountdownComplete = useCallback(() => {
    console.log('Project countdown completed - project has started!');
    // You could trigger notifications or other actions here
  }, []);

  const currentStartDate = projectSettings?.project_start_date || new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Project Management</h2>
              <p className="text-sm text-slate-600">Control project timeline and reset functionality</p>
            </div>
          </div>
        </div>
      </div>

      {/* Project Management Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Countdown */}
        <ProjectCountdown
          startDate={currentStartDate}
          onCountdownComplete={handleCountdownComplete}
        />

        {/* Project Controls */}
        <ProjectControls
          onProjectReset={handleProjectReset}
          onStartDateChange={handleStartDateChange}
        />
      </div>

      {/* Project Information */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Project Information</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <div className="text-lg font-semibold text-blue-800">14 Days</div>
            <div className="text-sm text-blue-600">Total Duration</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <Settings className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-lg font-semibold text-green-800">3 Locations</div>
            <div className="text-sm text-green-600">Installation Sites</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <BarChart3 className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <div className="text-lg font-semibold text-purple-800">24 Vehicles</div>
            <div className="text-sm text-purple-600">Total Fleet</div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h4 className="text-sm font-semibold text-slate-900 mb-2">Project Schedule Overview</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-slate-700">Bahir Dar:</span>
              <span className="text-slate-600 ml-2">Days 1-8 (15 vehicles)</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Kombolcha:</span>
              <span className="text-slate-600 ml-2">Days 10-12 (6 vehicles)</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Addis Ababa:</span>
              <span className="text-slate-600 ml-2">Days 13-14 (3 vehicles)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ProjectManagement.displayName = 'ProjectManagement';

export default ProjectManagement;