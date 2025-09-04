'use client';

import React, { useState, memo, useCallback } from 'react';
import { Calendar, Save, X, AlertTriangle, RefreshCw } from 'lucide-react';

interface DatePickerProps {
  currentDate: string;
  onDateChange: (date: string) => Promise<void>;
  onCancel: () => void;
  minDate?: string;
  maxDate?: string;
  className?: string;
}

const DatePicker: React.FC<DatePickerProps> = memo(({ 
  currentDate, 
  onDateChange, 
  onCancel,
  minDate,
  maxDate,
  className = '' 
}) => {
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDateChange = useCallback(async () => {
    if (!selectedDate || selectedDate === currentDate) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      await onDateChange(selectedDate);
      
      // Show success message and refresh page
      setTimeout(() => {
        alert('Project start date updated successfully! The page will refresh to show updated schedules.');
        window.location.reload();
      }, 500);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error.message);
    } finally {
      setIsUpdating(false);
    }
  }, [selectedDate, currentDate, onDateChange]);

  const isDateValid = useCallback((date: string) => {
    if (!date) return false;
    
    const selected = new Date(date);
    const min = minDate ? new Date(minDate) : null;
    const max = maxDate ? new Date(maxDate) : null;
    
    if (min && selected < min) return false;
    if (max && selected > max) return false;
    
    return true;
  }, [minDate, maxDate]);

  const getDateWarning = useCallback((date: string) => {
    if (!date) return null;
    
    const selected = new Date(date);
    const today = new Date();
    const diffDays = Math.ceil((selected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { type: 'error', message: 'Start date cannot be in the past' };
    } else if (diffDays === 0) {
      return { type: 'warning', message: 'Project will start today' };
    } else if (diffDays <= 7) {
      return { type: 'info', message: `Project starts in ${diffDays} day${diffDays > 1 ? 's' : ''}` };
    }
    
    return null;
  }, []);

  const dateWarning = getDateWarning(selectedDate);
  const isValid = isDateValid(selectedDate);

  return (
    <div className={`bg-white border border-slate-200 rounded-lg overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
            <Calendar className="w-3 h-3 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Update Project Start Date</h3>
            <p className="text-sm text-slate-600">All schedules will be automatically recalculated</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Current vs New Date Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h4 className="text-sm font-medium text-slate-700 mb-1">Current Start Date</h4>
            <div className="text-lg font-semibold text-slate-900">
              {new Date(currentDate).toLocaleDateString()}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              {new Date(currentDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-medium text-blue-700 mb-1">New Start Date</h4>
            <div className="text-lg font-semibold text-blue-900">
              {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Select date'}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : 'Choose a new start date'}
            </div>
          </div>
        </div>

        {/* Date Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Project Start Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={minDate || new Date().toISOString().split('T')[0]}
            max={maxDate}
            className={`w-full px-3 py-2 text-sm border rounded-md ${
              isValid ? 'border-slate-300' : 'border-red-300'
            }`}
          />
        </div>

        {/* Date Warning/Info */}
        {dateWarning && (
          <div className={`rounded-lg p-3 border ${
            dateWarning.type === 'error' 
              ? 'bg-red-50 border-red-200' 
              : dateWarning.type === 'warning'
                ? 'bg-orange-50 border-orange-200'
                : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center space-x-2">
              <AlertTriangle className={`w-4 h-4 ${
                dateWarning.type === 'error' 
                  ? 'text-red-600' 
                  : dateWarning.type === 'warning'
                    ? 'text-orange-600'
                    : 'text-blue-600'
              }`} />
              <span className={`text-sm font-medium ${
                dateWarning.type === 'error' 
                  ? 'text-red-800' 
                  : dateWarning.type === 'warning'
                    ? 'text-orange-800'
                    : 'text-blue-800'
              }`}>
                {dateWarning.message}
              </span>
            </div>
          </div>
        )}

        {/* Impact Information */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h4 className="text-sm font-semibold text-slate-900 mb-2">Schedule Impact</h4>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>• All vehicle installation dates will be recalculated</li>
            <li>• Task start and end dates will be updated automatically</li>
            <li>• Timeline and Gantt chart views will reflect new dates</li>
            <li>• Team assignments and schedules remain unchanged</li>
          </ul>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Update Failed</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
          <button
            onClick={onCancel}
            className="btn-secondary flex items-center space-x-2"
            disabled={isUpdating}
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <button
            onClick={handleDateChange}
            disabled={isUpdating || !isValid || selectedDate === currentDate}
            className="btn-primary flex items-center space-x-2"
          >
            {isUpdating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isUpdating ? 'Updating...' : 'Update Date'}</span>
          </button>
        </div>
      </div>
    </div>
  );
});

DatePicker.displayName = 'DatePicker';

export default DatePicker;