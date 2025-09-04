'use client';

import React, { useState, memo } from 'react';
import { RotateCcw, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

interface ProjectResetButtonProps {
  onReset: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

const ProjectResetButton: React.FC<ProjectResetButtonProps> = memo(({ 
  onReset, 
  disabled = false,
  className = '' 
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await onReset();
      setResetComplete(true);
      setShowConfirm(false);
      
      // Auto-hide success state after 3 seconds
      setTimeout(() => {
        setResetComplete(false);
      }, 3000);
    } catch (error) {
      console.error('Reset failed:', error);
      alert('Failed to reset project. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  if (resetComplete) {
    return (
      <button
        className={`btn-success flex items-center space-x-2 ${className}`}
        disabled
      >
        <CheckCircle2 className="w-4 h-4" />
        <span>Reset Complete!</span>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={disabled || isResetting}
        className={`btn-danger flex items-center space-x-2 ${className}`}
      >
        {isResetting ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <RotateCcw className="w-4 h-4" />
        )}
        <span>{isResetting ? 'Resetting...' : 'Reset Project'}</span>
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 animate-slide-up">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Confirm Project Reset</h3>
                <p className="text-sm text-slate-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4 border border-red-200 mb-6">
              <h4 className="text-sm font-semibold text-red-800 mb-2">This will permanently:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Reset all vehicle statuses to "Pending"</li>
                <li>• Reset all task statuses to "Pending"</li>
                <li>• Clear all installation progress data</li>
                <li>• Remove all comments and history records</li>
                <li>• Clear maintenance and document records</li>
                <li>• Reset all timestamps and tracking data</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-6">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">What will be preserved:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Vehicle registration information</li>
                <li>• Team member data and assignments</li>
                <li>• Location configurations</li>
                <li>• Project schedule structure</li>
                <li>• System settings and preferences</li>
              </ul>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-secondary"
                disabled={isResetting}
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="btn-danger flex items-center space-x-2"
              >
                {isResetting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                <span>{isResetting ? 'Resetting...' : 'Confirm Reset'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

ProjectResetButton.displayName = 'ProjectResetButton';

export default ProjectResetButton;