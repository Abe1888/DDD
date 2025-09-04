'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Vehicle } from '@/lib/supabase/types';
import { RealtimeChannel } from '@supabase/supabase-js';
import { handleSupabaseError, logError, isSupabaseConfigured } from '@/lib/utils/errorHandler';

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef(true);

  const fetchVehicles = async () => {
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
        .from('vehicles')
        .select('*')
        .order('day', { ascending: true });

      if (fetchError) {
        throw new Error(`Failed to fetch vehicles: ${fetchError.message}`);
      }
      
      if (isMountedRef.current) {
        setVehicles(data || []);
        console.log('Vehicles fetched successfully:', data?.length || 0);
      }
    } catch (err: unknown) {
      const appError = handleSupabaseError(err);
      logError('fetchVehicles', err);
      if (isMountedRef.current) {
        setError(appError.message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const updateVehicleStatus = async (vehicleId: string, status: Vehicle['status']) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }
    
    try {
      setError(null);
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', vehicleId);

      if (updateError) {
        throw new Error(`Failed to update vehicle status: ${updateError.message}`);
      }
      
      if (isMountedRef.current) {
        setVehicles(prev => 
          prev.map(vehicle => 
            vehicle.id === vehicleId 
              ? { ...vehicle, status, updated_at: new Date().toISOString() }
              : vehicle
          )
        );
      }
      
      console.log(`Vehicle ${vehicleId} status updated to ${status}`);
    } catch (err: unknown) {
      const appError = handleSupabaseError(err);
      logError('updateVehicleStatus', err);
      if (isMountedRef.current) {
        setError(appError.message);
      }
      throw err;
    }
  };

  const addVehicle = async (vehicle: Omit<Vehicle, 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      const { error: insertError } = await supabase
        .from('vehicles')
        .insert([{
          ...vehicle,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (insertError) {
        throw new Error(`Failed to add vehicle: ${insertError.message}`);
      }
      
      console.log('Vehicle added successfully:', vehicle.id);
      await fetchVehicles();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add vehicle to database';
      if (isMountedRef.current) {
        setError(errorMessage);
        console.error('Error adding vehicle:', err);
      }
      throw err;
    }
  };

  const updateVehicle = async (vehicleId: string, updates: Partial<Vehicle>) => {
    try {
      setError(null);
      
      if (updates.duration_days && updates.start_date) {
        const startDate = new Date(updates.start_date);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + updates.duration_days - 1);
        updates.end_date = endDate.toISOString().split('T')[0];
        // Also update installation_date to match start_date
        updates.installation_date = updates.start_date;
      }
      
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({ 
          ...updates,
          updated_at: new Date().toISOString() 
        })
        .eq('id', vehicleId);

      if (updateError) {
        throw new Error(`Failed to update vehicle: ${updateError.message}`);
      }
      
      if (isMountedRef.current) {
        setVehicles(prev => 
          prev.map(vehicle => 
            vehicle.id === vehicleId 
              ? { ...vehicle, ...updates, updated_at: new Date().toISOString() }
              : vehicle
          )
        );
      }
      
      console.log(`Vehicle ${vehicleId} updated successfully`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update vehicle in database';
      if (isMountedRef.current) {
        setError(errorMessage);
        console.error('Error updating vehicle:', err);
      }
      throw err;
    }
  };

  const deleteVehicle = async (vehicleId: string) => {
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (deleteError) {
        throw new Error(`Failed to delete vehicle: ${deleteError.message}`);
      }
      
      if (isMountedRef.current) {
        setVehicles(prev => prev.filter(vehicle => vehicle.id !== vehicleId));
      }
      
      console.log(`Vehicle ${vehicleId} deleted successfully`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete vehicle from database';
      if (isMountedRef.current) {
        setError(errorMessage);
        console.error('Error deleting vehicle:', err);
      }
      throw err;
    }
  };

  // Initial data fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchVehicles();
    
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
          .channel('vehicles-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'vehicles' },
            (payload) => {
              try {
                console.log('Real-time vehicle update:', payload);
                if (!isMountedRef.current) return;

                if (payload.eventType === 'INSERT') {
                  setVehicles((prev) => [...prev, payload.new as Vehicle]);
                } else if (payload.eventType === 'UPDATE') {
                  setVehicles((prev) =>
                    prev.map((vehicle) =>
                      vehicle.id === payload.new.id ? (payload.new as Vehicle) : vehicle
                    )
                  );
                } else if (payload.eventType === 'DELETE') {
                  setVehicles((prev) =>
                    prev.filter((vehicle) => vehicle.id !== payload.old.id)
                  );
                }
              } catch (err: unknown) {
                console.error('Error handling real-time vehicle update:', err);
              }
            }
          )
          .subscribe();

        channelRef.current = channel;
        console.log('Real-time subscription for vehicles established');
      } catch (err: unknown) {
        console.error('Failed to setup real-time subscription for vehicles:', err);
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current).catch((err) => {
          console.error('Error removing vehicles channel:', err);
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
    vehicles,
    loading,
    error,
    refetch: fetchVehicles,
    updateVehicleStatus,
    addVehicle,
    updateVehicle,
    deleteVehicle
  };
};
