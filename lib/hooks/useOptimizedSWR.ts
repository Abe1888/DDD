'use client';

import useSWR from 'swr';
import { supabase } from '@/lib/supabaseClient';
import { Vehicle, Location, TeamMember, Task } from '@/lib/supabase/types';
import { isSupabaseConfigured } from '@/lib/utils/errorHandler';

// Enhanced fetchers with selective field queries and aggressive caching
const vehiclesFetcher = async (): Promise<Vehicle[]> => {
  if (!isSupabaseConfigured()) return [];
  
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, type, location, fuel_tanks, gps_required, fuel_sensors, day, time_slot, status, updated_at')
      .order('day', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return [];
  }
};

const locationsFetcher = async (): Promise<Location[]> => {
  if (!isSupabaseConfigured()) return [];
  
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, duration, vehicles, gps_devices, fuel_sensors')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
};

const teamMembersFetcher = async (): Promise<TeamMember[]> => {
  if (!isSupabaseConfigured()) return [];
  
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('id, name, role, specializations, completion_rate, average_task_time, quality_score')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
};

const tasksFetcher = async (): Promise<Task[]> => {
  if (!isSupabaseConfigured()) return [];
  
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, vehicle_id, name, description, status, priority, assigned_to, estimated_duration, start_date, end_date, created_at, updated_at')
      .order('priority', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
};

// Ultra-aggressive SWR configuration for instant tab switching
const optimizedSWRConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  refreshInterval: 0,
  dedupingInterval: 30000, // 30 seconds deduping
  errorRetryCount: 2,
  errorRetryInterval: 1000,
  focusThrottleInterval: 10000,
  loadingTimeout: 5000,
  shouldRetryOnError: false,
  revalidateIfStale: false,
  keepPreviousData: true,
  suspense: false,
  fallbackData: [],
  onError: (error: any) => {
    console.warn('SWR Error (non-critical):', error);
  },
  onSuccess: (data: any, key: string) => {
    console.log(`SWR Cache Hit for ${key}:`, data?.length || 'N/A');
  }
};

// Optimized hooks with instant cache returns
export const useVehiclesOptimized = () => {
  return useSWR('vehicles-optimized', vehiclesFetcher, {
    ...optimizedSWRConfig,
    fallbackData: [],
  });
};

export const useLocationsOptimized = () => {
  return useSWR('locations-optimized', locationsFetcher, {
    ...optimizedSWRConfig,
    fallbackData: [],
  });
};

export const useTeamMembersOptimized = () => {
  return useSWR('team-members-optimized', teamMembersFetcher, {
    ...optimizedSWRConfig,
    fallbackData: [],
  });
};

export const useTasksOptimized = () => {
  return useSWR('tasks-optimized', tasksFetcher, {
    ...optimizedSWRConfig,
    fallbackData: [],
  });
};

// Instant prefetch functions with memory caching
export const prefetchVehiclesOptimized = () => {
  if (typeof window !== 'undefined') {
    import('swr').then(({ mutate }) => {
      mutate('vehicles-optimized', vehiclesFetcher(), { revalidate: true });
    }).catch(() => {});
  }
};

export const prefetchLocationsOptimized = () => {
  if (typeof window !== 'undefined') {
    import('swr').then(({ mutate }) => {
      mutate('locations-optimized', locationsFetcher(), { revalidate: true });
    }).catch(() => {});
  }
};

export const prefetchTeamMembersOptimized = () => {
  if (typeof window !== 'undefined') {
    import('swr').then(({ mutate }) => {
      mutate('team-members-optimized', teamMembersFetcher(), { revalidate: true });
    }).catch(() => {});
  }
};

export const prefetchTasksOptimized = () => {
  if (typeof window !== 'undefined') {
    import('swr').then(({ mutate }) => {
      mutate('tasks-optimized', tasksFetcher(), { revalidate: true });
    }).catch(() => {});
  }
};

// Prefetch all data for instant navigation
export const prefetchAllDataOptimized = () => {
  if (typeof window !== 'undefined') {
    prefetchVehiclesOptimized();
    prefetchLocationsOptimized();
    prefetchTeamMembersOptimized();
    prefetchTasksOptimized();
  }
};