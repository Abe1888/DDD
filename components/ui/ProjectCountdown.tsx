'use client';

import React, { useState, useEffect, memo, useCallback } from 'react';
import { Calendar, Clock, Play, Pause, Activity, CheckCircle2 } from 'lucide-react';

interface ProjectCountdownProps {
  startDate: string;
  className?: string;
  onCountdownComplete?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

interface LiveProjectTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

const ProjectCountdown: React.FC<ProjectCountdownProps> = memo(({ 
  startDate, 
  className = '',
  onCountdownComplete 
}) => {
  const [currentStartDate, setCurrentStartDate] = useState(startDate);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  });
  const [liveProjectTime, setLiveProjectTime] = useState<LiveProjectTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0
  });
  const [isActive, setIsActive] = useState(true);

  // Update internal state when startDate prop changes
  useEffect(() => {
    setCurrentStartDate(startDate);
  }, [startDate]);
  const calculateTimeRemaining = (targetDate: string): TimeRemaining => {
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    const difference = target - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, total: difference };
  };

  const calculateLiveProjectTime = useCallback((startDate: string): LiveProjectTime => {
    const now = new Date().getTime();
    const start = new Date(startDate).getTime();
    const difference = now - start;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
    }

    const totalSeconds = Math.floor(difference / 1000);
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, totalSeconds };
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining(currentStartDate);
      setTimeRemaining(remaining);

      // If project has started, calculate live project time
      if (remaining.total <= 0) {
        const liveTime = calculateLiveProjectTime(currentStartDate);
        setLiveProjectTime(liveTime);
      }

      if (remaining.total <= 0 && onCountdownComplete) {
        onCountdownComplete();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStartDate, isActive, onCountdownComplete, calculateLiveProjectTime]);

  // Initial calculation
  useEffect(() => {
    const remaining = calculateTimeRemaining(currentStartDate);
    setTimeRemaining(remaining);
    
    if (remaining.total <= 0) {
      const liveTime = calculateLiveProjectTime(currentStartDate);
      setLiveProjectTime(liveTime);
    }
  }, [currentStartDate, calculateLiveProjectTime]);

  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, '0');
  };

  const isProjectStarted = timeRemaining.total <= 0;
  const isStartingSoon = timeRemaining.days <= 7 && timeRemaining.total > 0;

  return (
    <div className={`bg-white border border-slate-200 rounded-lg overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
              isProjectStarted ? 'bg-green-600' : isStartingSoon ? 'bg-orange-600' : 'bg-blue-600'
            }`}>
              {isProjectStarted ? (
                <Activity className="w-4 h-4 text-white" />
              ) : (
                <Calendar className="w-4 h-4 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {isProjectStarted ? 'Project is Live!' : 'Project Countdown'}
              </h3>
              <p className="text-sm text-slate-600">
                {isProjectStarted 
                  ? `Live since ${new Date(startDate).toLocaleDateString()}`
                  : `Time until project start: ${new Date(startDate).toLocaleDateString()}`
                }
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsActive(!isActive)}
            className={`p-2 rounded-md transition-colors ${
              isActive 
                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            aria-label={isActive ? 'Pause timer' : 'Resume timer'}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="p-6">
        {isProjectStarted ? (
          <>
            {/* Live Project Status */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-green-800 mb-2">Project is Live!</h4>
              <p className="text-sm text-green-700">
                Installation work is now active and in progress.
              </p>
            </div>

            {/* Real-time Project Duration Counter */}
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <div className="text-center mb-4">
                <h5 className="text-sm font-semibold text-green-800 mb-1">Project Running Time</h5>
                <p className="text-xs text-green-700">Live duration since project start</p>
              </div>
              
              {/* Live Time Display */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(liveProjectTime.days)}
                  </div>
                  <div className="text-xs text-green-600 font-medium">DAYS</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(liveProjectTime.hours)}
                  </div>
                  <div className="text-xs text-green-600 font-medium">HOURS</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(liveProjectTime.minutes)}
                  </div>
                  <div className="text-xs text-green-600 font-medium">MINUTES</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(liveProjectTime.seconds)}
                  </div>
                  <div className="text-xs text-green-600 font-medium">SECONDS</div>
                </div>
              </div>

              {/* Project Progress Indicator */}
              <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Activity className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Active Project</span>
                </div>
                <p className="text-xs text-green-700">
                  Real-time tracking of project duration. Installation teams are working according to schedule.
                </p>
                <div className="mt-3 text-xs text-green-600">
                  Total runtime: {Math.floor(liveProjectTime.totalSeconds / 3600)} hours, {Math.floor((liveProjectTime.totalSeconds % 3600) / 60)} minutes
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Countdown Display */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className={`text-3xl font-bold ${
                  isStartingSoon ? 'text-orange-600' : 'text-blue-600'
                }`}>
                  {formatNumber(timeRemaining.days)}
                </div>
                <div className="text-xs text-slate-600 font-medium">DAYS</div>
              </div>
              
              <div className="text-center">
                <div className={`text-3xl font-bold ${
                  isStartingSoon ? 'text-orange-600' : 'text-blue-600'
                }`}>
                  {formatNumber(timeRemaining.hours)}
                </div>
                <div className="text-xs text-slate-600 font-medium">HOURS</div>
              </div>
              
              <div className="text-center">
                <div className={`text-3xl font-bold ${
                  isStartingSoon ? 'text-orange-600' : 'text-blue-600'
                }`}>
                  {formatNumber(timeRemaining.minutes)}
                </div>
                <div className="text-xs text-slate-600 font-medium">MINUTES</div>
              </div>
              
              <div className="text-center">
                <div className={`text-3xl font-bold ${
                  isStartingSoon ? 'text-orange-600' : 'text-blue-600'
                }`}>
                  {formatNumber(timeRemaining.seconds)}
                </div>
                <div className="text-xs text-slate-600 font-medium">SECONDS</div>
              </div>
            </div>

            {/* Status Indicator */}
            <div className={`text-center p-4 rounded-lg border ${
              isStartingSoon 
                ? 'bg-orange-50 border-orange-200' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Clock className={`w-4 h-4 ${
                  isStartingSoon ? 'text-orange-600' : 'text-blue-600'
                }`} />
                <span className={`text-sm font-medium ${
                  isStartingSoon ? 'text-orange-800' : 'text-blue-800'
                }`}>
                  {isStartingSoon ? 'Starting Soon!' : 'Countdown Active'}
                </span>
              </div>
              <p className={`text-xs ${
                isStartingSoon ? 'text-orange-700' : 'text-blue-700'
              }`}>
                {isStartingSoon 
                  ? 'Project starts in less than a week. Prepare for installation activities.'
                  : 'Monitor the countdown and prepare for the upcoming installation project.'
                }
              </p>
              <div className="mt-2 text-xs text-slate-600">
                Start Date: {new Date(currentStartDate).toLocaleDateString()}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-700">Time Progress</span>
                <span className="text-xs text-slate-600">
                  {timeRemaining.days > 0 ? `${timeRemaining.days} days remaining` : 'Starting today!'}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    isStartingSoon ? 'bg-orange-500' : 'bg-blue-500'
                  }`}
                  style={{ 
                    width: `${Math.max(0, Math.min(100, 100 - (timeRemaining.days / 30) * 100))}%` 
                  }}
                ></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

ProjectCountdown.displayName = 'ProjectCountdown';

export default ProjectCountdown;