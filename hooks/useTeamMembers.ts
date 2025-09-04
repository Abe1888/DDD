'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { TeamMember } from '@/lib/supabase/types';
import { RealtimeChannel } from '@supabase/supabase-js';
import { handleSupabaseError, logError, isSupabaseConfigured } from '@/lib/utils/errorHandler';

export const useTeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef(true);

  const fetchTeamMembers = async () => {
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
        .from('team_members')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) {
        throw new Error(`Failed to fetch team members: ${fetchError.message}`);
      }
      
      if (isMountedRef.current) {
        setTeamMembers(data || []);
        console.log('Team members fetched successfully:', data?.length || 0);
      }
    } catch (err: unknown) {
      const appError = handleSupabaseError(err);
      logError('fetchTeamMembers', err);
      if (isMountedRef.current) {
        setError(appError.message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const updateTeamMember = async (memberId: string, updates: Partial<TeamMember>) => {
    try {
      setError(null);
      const { error: updateError } = await supabase
        .from('team_members')
        .update(updates)
        .eq('id', memberId);

      if (updateError) {
        throw new Error(`Failed to update team member: ${updateError.message}`);
      }
      
      // Update local state optimistically
      if (isMountedRef.current) {
        setTeamMembers(prev => 
          prev.map(member => 
            member.id === memberId 
              ? { ...member, ...updates }
              : member
          )
        );
      }
      
      console.log(`Team member ${memberId} updated successfully`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update team member in database';
      if (isMountedRef.current) {
        setError(errorMessage);
        console.error('Error updating team member:', err);
      }
      throw err;
    }
  };

  const addTeamMember = async (member: Omit<TeamMember, 'created_at'>) => {
    try {
      setError(null);
      const { error: insertError } = await supabase
        .from('team_members')
        .insert([{
          ...member,
          created_at: new Date().toISOString()
        }]);

      if (insertError) {
        throw new Error(`Failed to add team member: ${insertError.message}`);
      }
      
      console.log('Team member added successfully:', member.id);
      await fetchTeamMembers(); // Refresh the list
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add team member to database';
      if (isMountedRef.current) {
        setError(errorMessage);
        console.error('Error adding team member:', err);
      }
      throw err;
    }
  };

  const deleteTeamMember = async (memberId: string) => {
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (deleteError) {
        throw new Error(`Failed to delete team member: ${deleteError.message}`);
      }
      
      // Update local state optimistically
      if (isMountedRef.current) {
        setTeamMembers(prev => prev.filter(member => member.id !== memberId));
      }
      
      console.log(`Team member ${memberId} deleted successfully`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete team member from database';
      if (isMountedRef.current) {
        setError(errorMessage);
        console.error('Error deleting team member:', err);
      }
      throw err;
    }
  };

  // Initial data fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchTeamMembers();
    
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
          .channel('team-members-changes')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'team_members' },
            (payload) => {
              try {
                console.log('Real-time team member update:', payload);
                
                if (!isMountedRef.current) return;
                
                if (payload.eventType === 'INSERT') {
                  setTeamMembers(prev => [...prev, payload.new as TeamMember]);
                } else if (payload.eventType === 'UPDATE') {
                  setTeamMembers(prev => 
                    prev.map(member => 
                      member.id === payload.new.id ? payload.new as TeamMember : member
                    )
                  );
                } else if (payload.eventType === 'DELETE') {
                  setTeamMembers(prev => prev.filter(member => member.id !== payload.old.id));
                }
              } catch (err: unknown) {
                console.error('Error handling real-time team member update:', err);
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Real-time subscription for team members established');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Real-time subscription error for team members');
            } else if (status === 'TIMED_OUT') {
              console.warn('Real-time subscription timed out for team members');
            } else if (status === 'CLOSED') {
              console.log('Real-time subscription closed for team members');
            }
          });
        
        channelRef.current = channel;
      } catch (err: unknown) {
        console.error('Failed to setup real-time subscription for team members:', err);
      }
    };
    
    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        } catch (err: unknown) {
          console.error('Error removing team members channel:', err);
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
    teamMembers,
    loading,
    error,
    refetch: fetchTeamMembers,
    updateTeamMember,
    addTeamMember,
    deleteTeamMember
  };
};