'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Location } from '@/lib/supabase/types';
import { RealtimeChannel } from '@supabase/supabase-js';
import { handleSupabaseError, logError, isSupabaseConfigured } from '@/lib/utils/errorHandler';

export const useLocations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef(true);

  const fetchLocations = async () => {
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
        .from('locations')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) {
        throw new Error(`Failed to fetch locations: ${fetchError.message}`);
      }
      
      if (isMountedRef.current) {
        setLocations(data || []);
        console.log('Locations fetched successfully:', data?.length || 0);
      }
    } catch (err: unknown) {
      const appError = handleSupabaseError(err);
      logError('fetchLocations', err);
      if (isMountedRef.current) {
        setError(appError.message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const addLocation = async (location: Omit<Location, 'id' | 'created_at'>) => {
    try {
      setError(null);
      const { error: insertError } = await supabase
        .from('locations')
        .insert([{
          ...location,
          created_at: new Date().toISOString()
        }]);

      if (insertError) {
        throw new Error(`Failed to add location: ${insertError.message}`);
      }
      
      console.log('Location added successfully:', location.name);
      await fetchLocations();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add location to database';
      if (isMountedRef.current) {
        setError(errorMessage);
        console.error('Error adding location:', err);
      }
      throw err;
    }
  };

  const updateLocation = async (locationId: string, updates: Partial<Location>) => {
    try {
      setError(null);
      const { error: updateError } = await supabase
        .from('locations')
        .update(updates)
        .eq('id', locationId);

      if (updateError) {
        throw new Error(`Failed to update location: ${updateError.message}`);
      }
      
      if (isMountedRef.current) {
        setLocations(prev => 
          prev.map(location => 
            location.id === locationId 
              ? { ...location, ...updates }
              : location
          )
        );
      }
      
      console.log(`Location ${locationId} updated successfully`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update location in database';
      if (isMountedRef.current) {
        setError(errorMessage);
        console.error('Error updating location:', err);
      }
      throw err;
    }
  };

  const deleteLocation = async (locationId: string) => {
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationId);

      if (deleteError) {
        throw new Error(`Failed to delete location: ${deleteError.message}`);
      }
      
      if (isMountedRef.current) {
        setLocations(prev => prev.filter(location => location.id !== locationId));
      }
      
      console.log(`Location ${locationId} deleted successfully`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete location from database';
      if (isMountedRef.current) {
        setError(errorMessage);
        console.error('Error deleting location:', err);
      }
      throw err;
    }
  };

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchLocations();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fixed real-time subscription
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setupRealtimeSubscription = async () => {
      try {
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        const channel = supabase
          .channel('locations-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'locations' },
            (payload) => {
              try {
                console.log('Real-time location update:', payload);
                if (!isMountedRef.current) return;

                if (payload.eventType === 'INSERT') {
                  setLocations((prev) => [...prev, payload.new as Location]);
                } else if (payload.eventType === 'UPDATE') {
                  setLocations((prev) =>
                    prev.map((location) =>
                      location.id === payload.new.id ? (payload.new as Location) : location
                    )
                  );
                } else if (payload.eventType === 'DELETE') {
                  setLocations((prev) =>
                    prev.filter((location) => location.id !== payload.old.id)
                  );
                }
              } catch (err: unknown) {
                console.error('Error handling real-time location update:', err);
              }
            }
          )
          .subscribe();

        channelRef.current = channel;
        console.log('Real-time subscription for locations established');
      } catch (err: unknown) {
        console.error('Failed to setup real-time subscription for locations:', err);
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current).catch((err) => {
          console.error('Error removing locations channel:', err);
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
    locations,
    loading,
    error,
    refetch: fetchLocations,
    addLocation,
    updateLocation,
    deleteLocation
  };
};
