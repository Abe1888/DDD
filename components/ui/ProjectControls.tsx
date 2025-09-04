'use client';

import React, { useState, memo, useCallback } from 'react';
import { 
  Calendar, RotateCcw, AlertTriangle, CheckCircle2, Settings, 
  RefreshCw, Save, X, Clock, Play, Pause 
} from 'lucide-react';
import { useProjectSettings } from '@/lib/hooks/useProjectSettings';

interface ProjectControlsProps {
  onProjectReset?: () => void;
  onStartDateChange?: (date: string) => void;
  className?: string;
}

const ProjectControls: React.FC<ProjectControlsProps> = memo(({ 
  onProjectReset, 
  onStartDateChange,
  className = '' 
}) => {
  const { 
    projectSettings, 
    loading, 
    error, 
    updateProjectStartDate, 
    resetProject 
  } = useProjectSettings();
  
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newStartDate, setNewStartDate] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);

  // Initialize date picker with current project start date
  React.useEffect(() => {
    if (projectSettings?.project_start_date) {
      setNewStartDate(projectSettings.project_start_date);
    } else {
      setNewStartDate(new Date().toISOString().split('T')[0]);
    }
  }, [projectSettings]);

  const handleResetProject = useCallback(async () => {
    setIsResetting(true);
    try {
      await resetProject();
      onProjectReset?.();
      setShowResetConfirm(false);
      
      // Show success message
      setTimeout(() => {
        alert('Project has been successfully reset to initial state.');
      }, 500);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('Failed to reset project:', error);
      alert(`Failed to reset project: ${error.message}`);
    } finally {
      setIsResetting(false);
    }
  }, [resetProject, onProjectReset]);

  const handleUpdateStartDate = useCallback(async () => {
    if (!newStartDate) return;
    
    setIsUpdatingDate(true);
    try {
      await updateProjectStartDate(newStartDate);
      onStartDateChange?.(newStartDate);
      setShowDatePicker(false);
      
      // Force refresh of all data to ensure UI updates
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      // Show success message
      setTimeout(() => {
        alert('Project start date updated successfully. All schedules have been recalculated.');
      }, 100);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('Failed to update start date:', error);
      alert(`Failed to update start date: ${error.message}`);
    } finally {
      setIsUpdatingDate(false);
    }
  }, [newStartDate, updateProjectStartDate, onStartDateChange]);

  const getCurrentStartDate = () => {
    return projectSettings?.project_start_date || new Date().toISOString().split('T')[0];
  };

  const isDateInPast = (date: string) => {
    return new Date(date) < new Date();
  };

  const isDateToday = (date: string) => {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  };

  if (loading) {
    return (
      <div className={`bg-white border border-slate-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center space-x-3">
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-sm text-slate-600">Loading project settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-slate-200 rounded-lg ${className}`}>
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-600 rounded-md flex items-center justify-center">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Project Controls</h3>
            <p className="text-sm text-slate-600">Manage project settings and schedule</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Current Project Status */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Current Project Status</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Calendar className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Start Date</span>
              </div>
              <div className="text-lg font-semibold text-slate-900">
                {new Date(getCurrentStartDate()).toLocaleDateString()}
              </div>
              <div className={`text-xs mt-1 ${
                isDateInPast(getCurrentStartDate()) 
                  ? 'text-green-600' 
                  : isDateToday(getCurrentStartDate())
                    ? 'text-orange-600'
                    : 'text-blue-600'
              }`}>
                {isDateInPast(getCurrentStartDate()) 
                  ? 'Project has started' 
                  : isDateToday(getCurrentStartDate())
                    ? 'Starting today!'
                    : 'Upcoming project'
                }
              </div>
            </div>
            
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Project Phase</span>
              </div>
              <div className="text-lg font-semibold text-slate-900">
                {isDateInPast(getCurrentStartDate()) ? 'Active' : 'Planning'}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                14-day installation schedule
              </div>
            </div>
          </div>
        </div>

        {/* Project Start Date Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">Project Start Date</h4>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Change Date</span>
            </button>
          </div>

          {showDatePicker && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 animate-slide-up">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select New Project Start Date
                  </label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                  />
                  <p className="text-xs text-slate-600 mt-1">
                    All vehicle schedules and tasks will be automatically recalculated based on this date.
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleUpdateStartDate}
                    disabled={isUpdatingDate || !newStartDate || newStartDate === getCurrentStartDate()}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {isUpdatingDate ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isUpdatingDate ? 'Updating...' : 'Update Date'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Project Reset Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">Project Reset</h4>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="btn-danger flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Project</span>
            </button>
          </div>

          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h5 className="text-sm font-semibold text-red-800 mb-1">Reset Project to Clean State</h5>
                <p className="text-xs text-red-700 mb-2">
                  This will reset all vehicles and tasks to their initial pending state, 
                  clear all progress data, comments, and history records.
                </p>
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> The page will refresh automatically after the update to ensure all components display the new dates correctly.
                  </p>
                </div>
                <ul className="text-xs text-red-600 space-y-1">
                  <li>• All vehicle statuses → Pending</li>
                  <li>• All task statuses → Pending</li>
                  <li>• All comments and history → Cleared</li>
                  <li>• Installation progress → Reset</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Error</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 animate-slide-up">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <RotateCcw className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Reset Project</h3>
                <p className="text-sm text-slate-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4 border border-red-200 mb-6">
              <h4 className="text-sm font-semibold text-red-800 mb-2">This will permanently:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Reset all vehicle installation statuses to "Pending"</li>
                <li>• Reset all task statuses to "Pending"</li>
                <li>• Clear all progress tracking data</li>
                <li>• Remove all comments and history records</li>
                <li>• Clear all maintenance and document records</li>
              </ul>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="btn-secondary"
                disabled={isResetting}
              >
                Cancel
              </button>
              <button
                onClick={handleResetProject}
                disabled={isResetting}
                className="btn-danger flex items-center space-x-2"
              >
                {isResetting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                <span>{isResetting ? 'Resetting...' : 'Reset Project'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ProjectControls.displayName = 'ProjectControls';

export default ProjectControls;