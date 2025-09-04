'use client';

import React, { memo } from 'react';
import { Calendar, Clock, CheckCircle2, Play, Pause } from 'lucide-react';
import { getProjectPhase } from '@/lib/utils/projectUtils';

interface ProjectStatusBadgeProps {
  startDate: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ProjectStatusBadge: React.FC<ProjectStatusBadgeProps> = memo(({ 
  startDate, 
  className = '',
  size = 'md' 
}) => {
  const [currentStartDate, setCurrentStartDate] = React.useState(startDate);
  const projectPhase = getProjectPhase(startDate);
  
  // Update when startDate prop changes
  React.useEffect(() => {
    setCurrentStartDate(startDate);
  }, [startDate]);
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const getStatusConfig = () => {
    const phase = getProjectPhase(currentStartDate);
    switch (projectPhase.phase) {
      case 'planning':
        return {
          icon: Clock,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200',
          label: phase.daysUntilStart <= 7 ? 'Starting Soon' : 'Scheduled'
        };
      case 'active':
        return {
          icon: Play,
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
          label: 'Active'
        };
      case 'completed':
        return {
          icon: CheckCircle2,
          bgColor: 'bg-slate-100',
          textColor: 'text-slate-800',
          borderColor: 'border-slate-200',
          label: 'Completed'
        };
      default:
        return {
          icon: Pause,
          bgColor: 'bg-slate-100',
          textColor: 'text-slate-800',
          borderColor: 'border-slate-200',
          label: 'Unknown'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center space-x-2 font-medium rounded-full border ${
      config.bgColor
    } ${config.textColor} ${config.borderColor} ${sizeClasses[size]} ${className}`}>
      <Icon className={iconSizes[size]} />
      <span>{config.label}</span>
      {getProjectPhase(currentStartDate).phase === 'active' && (
        <span className="text-xs opacity-75">
          ({getProjectPhase(currentStartDate).progressPercentage}%)
        </span>
      )}
    </div>
  );
});

ProjectStatusBadge.displayName = 'ProjectStatusBadge';

export default ProjectStatusBadge;