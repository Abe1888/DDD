'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ProjectSettings } from '@/lib/supabase/types';
import { RealtimeChannel } from '@supabase/supabase-js';
import { handleSupabaseError, logError, isSupabaseConfigured } from '@/lib/utils/errorHandler';

export const useProjectSettings = () => {
  const [projectSettings, setProjectSettings] = useState<ProjectSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef(true);

  const fetchProjectSettings = async () => {
    if (!isSupabaseConfigured()) {
      if (isMountedRef.current) {
        setError('Supabase is not configured. Please check your environment variables.');
        setLoading(false);
      }
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('project_settings')
        .select('*')
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch project settings: ${fetchError.message}`);
      }
      
      if (isMountedRef.current) {
        setProjectSettings(data || null);
        console.log('Project settings fetched successfully:', data);
      }
    } catch (err: unknown) {
      const appError = handleSupabaseError(err);
      logError('fetchProjectSettings', err);
      if (isMountedRef.current) {
        setError(appError.message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const updateProjectStartDate = async (startDate: string) => {
    try {
      setError(null);
      
      // First, check if settings exist
      const { data: existing } = await supabase
        .from('project_settings')
        .select('id')
        .limit(1)
        .single();

      let result;
      if (existing) {
        // Update existing settings
        result = await supabase
          .from('project_settings')
          .update({ 
            project_start_date: startDate,
            updated_at: new Date().toISOString() 
          })
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        // Create new settings
        result = await supabase
          .from('project_settings')
          .insert([{
            project_start_date: startDate,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();
      }

      if (result.error) {
        throw new Error(`Failed to update project start date: ${result.error.message}`);
      }
      
      if (isMountedRef.current) {
        setProjectSettings(result.data);
      }
      
      console.log('Project start date updated successfully:', startDate);
      
      // Update all vehicle and task dates based on new start date
      await updateAllScheduleDates(startDate);
      
      // Force refresh of all cached data
      if (typeof window !== 'undefined') {
        // Clear SWR cache to force fresh data fetch
        const { mutate } = await import('swr');
        await mutate(() => true, undefined, { revalidate: true });
      }
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project start date';
      if (isMountedRef.current) {
        setError(errorMessage);
        console.error('Error updating project start date:', err);
      }
      throw err;
    }
  };

  const updateAllScheduleDates = async (projectStartDate: string) => {
    try {
      // Get all vehicles and update their dates based on their day offset
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, day');

      if (vehiclesError) {
        throw new Error(`Failed to fetch vehicles for date update: ${vehiclesError.message}`);
      }

      if (vehicles && vehicles.length > 0) {
        const updates = vehicles.map(vehicle => {
          const startDate = new Date(projectStartDate);
          startDate.setDate(startDate.getDate() + vehicle.day - 1);
          
          return {
            id: vehicle.id,
            start_date: startDate.toISOString().split('T')[0],
            end_date: startDate.toISOString().split('T')[0],
            installation_date: startDate.toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          };
        });

        // Batch update vehicles
        for (const update of updates) {
          await supabase
            .from('vehicles')
            .update({
              start_date: update.start_date,
              end_date: update.end_date,
              installation_date: update.installation_date,
              updated_at: update.updated_at
            })
            .eq('id', update.id);
        }
        
        console.log(`Updated ${updates.length} vehicles with new installation dates`);
      }

      // Update tasks with new dates
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, vehicle_id, duration_days');

      if (tasksError) {
        console.warn('Failed to fetch tasks for date update:', tasksError.message);
        return;
      }

      if (tasks && tasks.length > 0) {
        for (const task of tasks) {
          if (task.vehicle_id) {
            const vehicle = vehicles?.find(v => v.id === task.vehicle_id);
            if (vehicle) {
              const taskStartDate = new Date(projectStartDate);
              taskStartDate.setDate(taskStartDate.getDate() + vehicle.day - 1);
              
              const taskEndDate = new Date(taskStartDate);
              taskEndDate.setDate(taskEndDate.getDate() + (task.duration_days || 1) - 1);

              await supabase
                .from('tasks')
                .update({
                  start_date: taskStartDate.toISOString().split('T')[0],
                  end_date: taskEndDate.toISOString().split('T')[0],
                  updated_at: new Date().toISOString()
                })
                .eq('id', task.id);
            }
          }
        }
        
        console.log(`Updated ${tasks.length} tasks with new dates`);
      }

      console.log('All schedule dates updated successfully');
    } catch (err: unknown) {
      console.error('Error updating schedule dates:', err);
      throw err; // Re-throw to handle in calling function
    }
  };

  const resetProject = async () => {
    try {
      setError(null);
      
      // Reset all vehicle statuses to 'Pending' with proper WHERE clause
      const { error: vehicleResetError } = await supabase
        .from('vehicles')
        .update({ 
          status: 'Pending',
          installation_status: 'Not Started',
          installation_notes: null,
          technician_assigned: null,
          gps_device_id: null,
          fuel_sensor_ids: null,
          installation_date: null,
          updated_at: new Date().toISOString()
        })
        .neq('id', ''); // This ensures we have a WHERE clause

      if (vehicleResetError) {
        throw new Error(`Failed to reset vehicles: ${vehicleResetError.message}`);
      }

      // Reset all task statuses to 'Pending' with proper WHERE clause
      const { error: taskResetError } = await supabase
        .from('tasks')
        .update({ 
          status: 'Pending',
          actual_duration: null,
          completed_at: null,
          updated_at: new Date().toISOString()
        })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Proper WHERE clause

      if (taskResetError) {
        throw new Error(`Failed to reset tasks: ${taskResetError.message}`);
      }

      // Clear all comments with proper WHERE clause
      const { error: commentsDeleteError } = await supabase
        .from('comments')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (commentsDeleteError) {
        console.warn('Failed to clear comments:', commentsDeleteError.message);
      }

      // Clear vehicle history with proper WHERE clause
      const { error: historyDeleteError } = await supabase
        .from('vehicle_registration_history')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (historyDeleteError) {
        console.warn('Failed to clear vehicle history:', historyDeleteError.message);
      }

      // Clear maintenance records with proper WHERE clause
      const { error: maintenanceDeleteError } = await supabase
        .from('vehicle_maintenance')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (maintenanceDeleteError) {
        console.warn('Failed to clear maintenance records:', maintenanceDeleteError.message);
      }

      // Clear vehicle documents with proper WHERE clause
      const { error: documentsDeleteError } = await supabase
        .from('vehicle_documents')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (documentsDeleteError) {
        console.warn('Failed to clear vehicle documents:', documentsDeleteError.message);
      }

      console.log('Project reset completed successfully');
      
      // Refresh project settings
      await fetchProjectSettings();
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset project';
      if (isMountedRef.current) {
        setError(errorMessage);
        console.error('Error resetting project:', err);
      }
      throw err;
    }
  };

  // Initial data fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchProjectSettings();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const setupRealtimeSubscription = async () => {
      try {
        // Only set up realtime if Supabase is properly configured
        if (!isSupabaseConfigured()) {
          console.warn('Skipping real-time subscription: Supabase not configured');
          return;
        }

        // Clean up any existing channel first
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        const channel = supabase
          .channel('project-settings-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'project_settings' },
            (payload) => {
              try {
                console.log('Real-time project settings update:', payload);
                
                if (!isMountedRef.current) return;
                
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                  setProjectSettings(payload.new as ProjectSettings);
                }
              } catch (err: unknown) {
                console.warn('Error handling real-time project settings update:', err);
              }
            }
          )
          .subscribe();

        channelRef.current = channel;
        console.log('Real-time subscription for project settings established');
      } catch (err: unknown) {
        console.warn('Failed to setup real-time subscription for project settings:', err);
        console.warn('Continuing without real-time updates. Data will sync on page refresh.');
      }
    };
    
    // Add a delay to ensure Supabase client is fully initialized
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        setupRealtimeSubscription();
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current).catch((err) => {
          console.warn('Error removing project settings channel:', err);
        });
        channelRef.current = null;
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    projectSettings,
    loading,
    error,
    refetch: fetchProjectSettings,
    updateProjectStartDate,
    resetProject
  };
};