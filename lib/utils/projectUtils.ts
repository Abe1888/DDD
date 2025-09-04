/**
 * Project management utilities for schedule calculations and date handling
 */

export interface ProjectScheduleInfo {
  totalDays: number;
  totalVehicles: number;
  totalLocations: number;
  locationBreakdown: {
    name: string;
    startDay: number;
    endDay: number;
    vehicles: number;
    duration: string;
  }[];
}

export const PROJECT_SCHEDULE: ProjectScheduleInfo = {
  totalDays: 14,
  totalVehicles: 24,
  totalLocations: 3,
  locationBreakdown: [
    {
      name: 'Bahir Dar',
      startDay: 1,
      endDay: 8,
      vehicles: 15,
      duration: '8 Days'
    },
    {
      name: 'Kombolcha',
      startDay: 10,
      endDay: 12,
      vehicles: 6,
      duration: '3 Days'
    },
    {
      name: 'Addis Ababa',
      startDay: 13,
      endDay: 14,
      vehicles: 3,
      duration: '2 Days'
    }
  ]
};

/**
 * Calculate the actual calendar date for a given project day
 */
export const calculateDateForDay = (projectStartDate: string, day: number): string => {
  const startDate = new Date(projectStartDate);
  const targetDate = new Date(startDate);
  targetDate.setDate(startDate.getDate() + day - 1);
  return targetDate.toISOString().split('T')[0];
};

/**
 * Calculate the project day for a given calendar date
 */
export const calculateDayForDate = (projectStartDate: string, targetDate: string): number => {
  const startDate = new Date(projectStartDate);
  const target = new Date(targetDate);
  const diffTime = target.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
};

/**
 * Get project phase information based on current date
 */
export const getProjectPhase = (projectStartDate: string) => {
  const today = new Date();
  const startDate = new Date(projectStartDate);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + PROJECT_SCHEDULE.totalDays - 1);
  
  const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const daysFromStart = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  if (daysUntilStart > 0) {
    return {
      phase: 'planning',
      status: 'Not Started',
      daysUntilStart,
      currentDay: 0,
      progressPercentage: 0,
      description: `Project starts in ${daysUntilStart} day${daysUntilStart > 1 ? 's' : ''}`
    };
  } else if (daysFromStart <= PROJECT_SCHEDULE.totalDays) {
    const progressPercentage = Math.round((daysFromStart / PROJECT_SCHEDULE.totalDays) * 100);
    return {
      phase: 'active',
      status: 'In Progress',
      daysUntilStart: 0,
      currentDay: daysFromStart,
      progressPercentage,
      description: `Day ${daysFromStart} of ${PROJECT_SCHEDULE.totalDays}`
    };
  } else {
    return {
      phase: 'completed',
      status: 'Completed',
      daysUntilStart: 0,
      currentDay: PROJECT_SCHEDULE.totalDays,
      progressPercentage: 100,
      description: 'Project completed'
    };
  }
};

/**
 * Get the current location based on project day
 */
export const getCurrentLocation = (projectDay: number) => {
  for (const location of PROJECT_SCHEDULE.locationBreakdown) {
    if (projectDay >= location.startDay && projectDay <= location.endDay) {
      return location;
    }
  }
  return null;
};

/**
 * Calculate time remaining until project start
 */
export const calculateTimeRemaining = (projectStartDate: string) => {
  const now = new Date().getTime();
  const start = new Date(projectStartDate).getTime();
  const difference = start - now;

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      total: 0,
      isStarted: true
    };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    total: difference,
    isStarted: false
  };
};

/**
 * Format duration for display
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
};

/**
 * Validate project date constraints
 */
export const validateProjectDate = (date: string): { isValid: boolean; error?: string } => {
  if (!date) {
    return { isValid: false, error: 'Date is required' };
  }
  
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    return { isValid: false, error: 'Project start date cannot be in the past' };
  }
  
  // Check if date is too far in the future (optional constraint)
  const maxFutureDate = new Date();
  maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);
  
  if (selectedDate > maxFutureDate) {
    return { isValid: false, error: 'Project start date cannot be more than 1 year in the future' };
  }
  
  return { isValid: true };
};

/**
 * Generate schedule summary for a given start date
 */
export const generateScheduleSummary = (projectStartDate: string) => {
  const summary = PROJECT_SCHEDULE.locationBreakdown.map(location => {
    const startDate = calculateDateForDay(projectStartDate, location.startDay);
    const endDate = calculateDateForDay(projectStartDate, location.endDay);
    
    return {
      ...location,
      startDate,
      endDate,
      formattedStartDate: new Date(startDate).toLocaleDateString(),
      formattedEndDate: new Date(endDate).toLocaleDateString()
    };
  });
  
  return {
    projectStartDate,
    projectEndDate: calculateDateForDay(projectStartDate, PROJECT_SCHEDULE.totalDays),
    locations: summary,
    totalDuration: PROJECT_SCHEDULE.totalDays
  };
};