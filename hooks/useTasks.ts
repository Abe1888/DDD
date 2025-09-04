'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Task, Comment } from '@/lib/supabase/types';
import { RealtimeChannel } from '@supabase/supabase-js';
import { handleSupabaseError, logError, isSupabaseConfigured } from '@/lib/utils/errorHandler';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef(true);

  const fetchTasks = async () => {
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
        .from('tasks')
        .select('*')
        .order('priority', { ascending: false });

      if (fetchError) {
        throw new Error(`Failed to fetch tasks: ${fetchError.message}`);
      }
      
      if (isMountedRef.current) {
        setTasks(data || []);
        console.log('Tasks fetched successfully:', data?.length || 0);
      }
    } catch (err: unknown) {
      const appError = handleSupabaseError(err);
      logError('fetchTasks', err);
      if (isMountedRef.current) {
        setError(appError.message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      setError(null);
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', taskId);

      if (updateError) {
        throw new Error(`Failed to update task status: ${updateError.message}`);
      }
      
      // Update local state optimistically
      if (isMountedRef.current) {
        setTasks(prev => 
          prev.map(task => 
            task.id === taskId 
              ? { ...task, status, updated_at: new Date().toISOString() }
              : task
          )
        );
      }
      
      console.log(`Task ${taskId} status updated to ${status}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task status in database';
      if (isMountedRef.current) {
        setError(errorMessage);
        console.error('Error updating task status:', err);
      }
      throw err;
    }
  };

  const addTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      const { error: insertError } = await supabase
        .from('tasks')
        .insert([{
          ...task,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (insertError) {
        throw new Error(`Failed to add task: ${insertError.message}`);
      }
      
      console.log('Task added successfully:', task.name);
      await fetchTasks(); // Refresh the list
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add task to database';
      if (isMountedRef.current) {
        setError(errorMessage);
        console.error('Error adding task:', err);
      }
      throw err;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      setError(null);
      
      // If duration is being updated, recalculate end date
      if (updates.duration_days && updates.start_date) {
        const startDate = new Date(updates.start_date);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + updates.duration_days - 1);
        updates.end_date = endDate.toISOString().split('T')[0];
      }
      
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ 
          ...updates,
          updated_at: new Date().toISOString() 
        })
        .eq('id', taskId);

      if (updateError) {
        throw new Error(`Failed to update task: ${updateError.message}`);
      }
      
      // Update local state optimistically
      if (isMountedRef.current) {
        setTasks(prev => 
          prev.map(task => 
            task.id === taskId 
              ? { ...task, ...updates, updated_at: new Date().toISOString() }
              : task
          )
        );
      }
      
      console.log(`Task ${taskId} updated successfully`);
      
      // If this task has dependents, update them too
      if (updates.end_date) {
        await updateDependentTasks(taskId, updates.end_date);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task in database';
      if (isMountedRef.current) {
        setError(errorMessage);
        console.error('Error updating task:', err);
      }
      throw err;
    }
  };

  const updateDependentTasks = async (taskId: string, newEndDate: string) => {
    try {
      // Find tasks that depend on this task
      const { data: dependentTasks, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .contains('depends_on', [taskId]);

      if (fetchError) {
        throw new Error(`Failed to fetch dependent tasks: ${fetchError.message}`);
      }

      if (dependentTasks && dependentTasks.length > 0) {
        for (const dependentTask of dependentTasks) {
          const newStartDate = new Date(newEndDate);
          newStartDate.setDate(newStartDate.getDate() + 1);
          
          const newTaskEndDate = new Date(newStartDate);
          newTaskEndDate.setDate(newTaskEndDate.getDate() + (dependentTask.duration_days || 1) - 1);

          const { error: updateError } = await supabase
            .from('tasks')
            .update({
              start_date: newStartDate.toISOString().split('T')[0],
              end_date: newTaskEndDate.toISOString().split('T')[0],
              updated_at: new Date().toISOString()
            })
            .eq('id', dependentTask.id);

          if (updateError) {
            console.error(`Failed to update dependent task ${dependentTask.id}:`, updateError);
          }
        }
        
        // Refresh tasks to get updated data
        await fetchTasks();
      }
    } catch (err: unknown) {
      console.error('Error updating dependent tasks:', err);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (deleteError) {
        throw new Error(`Failed to delete task: ${deleteError.message}`);
      }
      
      // Update local state optimistically
      if (isMountedRef.current) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
      }
      
      console.log(`Task ${taskId} deleted successfully`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task from database';
      if (isMountedRef.current) {
        setError(errorMessage);
        console.error('Error deleting task:', err);
      }
      throw err;
    }
  };

  const addComment = async (taskId: string, text: string, author: string) => {
    try {
      setError(null);
      const { error: insertError } = await supabase
        .from('comments')
        .insert([{
          task_id: taskId,
          text,
          author,
          created_at: new Date().toISOString()
        }]);

      if (insertError) {
        throw new Error(`Failed to add comment: ${insertError.message}`);
      }
      
      console.log(`Comment added to task ${taskId}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add comment to database';
      if (isMountedRef.current) {
        setError(errorMessage);
        console.error('Error adding comment:', err);
      }
      throw err;
    }
  };

  const fetchTaskComments = async (taskId: string): Promise<Comment[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        throw new Error(`Failed to fetch comments: ${fetchError.message}`);
      }
      
      console.log(`Comments fetched for task ${taskId}:`, data?.length || 0);
      return data || [];
    } catch (err: unknown) {
      console.error('Failed to fetch comments from database:', err);
      return [];
    }
  };

  // Initial data fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchTasks();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Set up real-time subscription with proper error handling
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;
    
    const setupRealtimeSubscription = () => {
      try {
        const channel = supabase
          .channel('tasks-changes')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'tasks' },
            (payload) => {
              try {
                console.log('Real-time task update:', payload);
                
                if (!isMountedRef.current) return;
                
                if (payload.eventType === 'INSERT') {
                  setTasks(prev => [...prev, payload.new as Task]);
                } else if (payload.eventType === 'UPDATE') {
                  setTasks(prev => 
                    prev.map(task => 
                      task.id === payload.new.id ? payload.new as Task : task
                    )
                  );
                } else if (payload.eventType === 'DELETE') {
                  setTasks(prev => prev.filter(task => task.id !== payload.old.id));
                }
              } catch (err: unknown) {
                console.error('Error handling real-time task update:', err);
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Real-time subscription for tasks established');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Real-time subscription error for tasks');
            } else if (status === 'TIMED_OUT') {
              console.warn('Real-time subscription timed out for tasks');
            } else if (status === 'CLOSED') {
              console.log('Real-time subscription closed for tasks');
            }
          });
        
        channelRef.current = channel;
      } catch (err: unknown) {
        console.error('Failed to setup real-time subscription for tasks:', err);
      }
    };
    
    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        } catch (err: unknown) {
          console.error('Error removing tasks channel:', err);
        }
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
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    updateTaskStatus,
    addTask,
    updateTask,
    deleteTask,
    addComment,
    fetchTaskComments
  };
};