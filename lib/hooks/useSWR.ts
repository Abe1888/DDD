'use client';

import useSWR from 'swr';
import { supabase } from '@/lib/supabaseClient';
import { Vehicle, Location, TeamMember, Task } from '@/lib/supabase/types';
import { isSupabaseConfigured } from '@/lib/utils/errorHandler';

// Optimized fetchers with selective field queries and error handling
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

// Enhanced SWR configuration with aggressive caching
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 0, // Disable automatic refresh to prevent loading loops
  dedupingInterval: 10000, // 10 seconds - increased deduping
  errorRetryCount: 3,
  errorRetryInterval: 2000,
  focusThrottleInterval: 5000,
  loadingTimeout: 10000, // Increased timeout
  shouldRetryOnError: true,
  revalidateIfStale: false, // Don't revalidate stale data immediately
  keepPreviousData: true, // Keep previous data while fetching new data
  onError: (error: any) => {
    console.error('SWR Error:', error);
  },
  onSuccess: (data: any, key: string) => {
    console.log(`SWR Success for ${key}:`, data?.length || 'N/A');
  }
};

// Custom hooks with SWR
export const useVehiclesSWR = () => {
  return useSWR('vehicles', vehiclesFetcher, swrConfig);
};

export const useLocationsSWR = () => {
  return useSWR('locations', locationsFetcher, swrConfig);
};

export const useTeamMembersSWR = () => {
  return useSWR('team-members', teamMembersFetcher, swrConfig);
};

export const useTasksSWR = () => {
  return useSWR('tasks', tasksFetcher, swrConfig);
};

// Enhanced prefetch functions with caching
export const prefetchVehicles = () => {
  if (typeof window !== 'undefined') {
    // Use SWR's mutate to prefetch and cache
    import('swr').then(({ mutate }) => {
      mutate('vehicles', vehiclesFetcher(), { revalidate: true });
    }).catch(console.error);
  }
};

export const prefetchLocations = () => {
  if (typeof window !== 'undefined') {
    import('swr').then(({ mutate }) => {
      mutate('locations', locationsFetcher(), { revalidate: true });
    }).catch(console.error);
  }
};

export const prefetchTeamMembers = () => {
  if (typeof window !== 'undefined') {
    import('swr').then(({ mutate }) => {
      mutate('team-members', teamMembersFetcher(), { revalidate: true });
    }).catch(console.error);
  }
};

export const prefetchTasks = () => {
  if (typeof window !== 'undefined') {
    import('swr').then(({ mutate }) => {
      mutate('tasks', tasksFetcher(), { revalidate: true });
    }).catch(console.error);
  }
};

// Prefetch all data for dashboard
export const prefetchAllData = () => {
  if (typeof window !== 'undefined') {
    prefetchVehicles();
    prefetchLocations();
    prefetchTeamMembers();
    prefetchTasks();
  }
};