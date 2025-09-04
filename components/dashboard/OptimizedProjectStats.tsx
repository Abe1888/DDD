'use client';

import React, { memo, useMemo } from 'react';
import { Calendar, MapPin, Truck, Navigation, Fuel, Users, BarChart3, AlertTriangle } from 'lucide-react';
import { useVehiclesOptimized, useLocationsOptimized, useTeamMembersOptimized } from '@/lib/hooks/useOptimizedSWR';

const OptimizedProjectStats = memo(() => {
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehiclesOptimized();
  const { data: locations = [], isLoading: locationsLoading } = useLocationsOptimized();
  const { data: teamMembers = [], isLoading: teamLoading } = useTeamMembersOptimized();
  
  const loading = vehiclesLoading || locationsLoading || teamLoading;
  
  // Memoize expensive calculations with dependency tracking
  const stats = useMemo(() => {
    const totalGpsDevices = locations.reduce((sum, loc) => sum + (loc.gps_devices || 0), 0);
    const totalFuelSensors = locations.reduce((sum, loc) => sum + (loc.fuel_sensors || 0), 0);
    const totalVehicles = vehicles.length;
    const completedVehicles = vehicles.filter(v => v.status === 'Completed').length;
    const progressPercentage = totalVehicles > 0 ? Math.round((completedVehicles / totalVehicles) * 100) : 0;
    const specialRequirements = vehicles.filter(v => (v.fuel_tanks || 0) > 1);
    
    return {
      totalGpsDevices,
      totalFuelSensors,
      totalVehicles,
      completedVehicles,
      progressPercentage,
      specialRequirements: specialRequirements.length
    };
  }, [vehicles, locations]);
  
  // Show cached data immediately, even while loading
  if (loading && stats.totalVehicles === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
        <div className="text-sm text-slate-600">Loading project statistics...</div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg animate-slide-up">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-purple-600 rounded-md flex items-center justify-center">
            <BarChart3 className="w-3 h-3 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Project Statistics</h3>
            <p className="text-sm text-slate-600">Comprehensive project overview</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vehicle Statistics */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700">Vehicle Fleet</h4>
            
            <div className="bg-blue-50 rounded-md p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Total Vehicles</span>
                </div>
                <span className="text-xl font-semibold text-blue-900">{stats.totalVehicles}</span>
              </div>
              <div className="text-xs text-blue-700">Across 3 major locations</div>
            </div>

            <div className="bg-orange-50 rounded-md p-4 border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">Special Requirements</span>
                </div>
                <span className="text-xl font-semibold text-orange-900">{stats.specialRequirements}</span>
              </div>
              <div className="text-xs text-orange-700">Double fuel tank vehicles</div>
            </div>
          </div>

          {/* Equipment Statistics */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700">Equipment</h4>
            
            <div className="bg-green-50 rounded-md p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Navigation className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">GPS Devices</span>
                </div>
                <span className="text-xl font-semibold text-green-900">{stats.totalGpsDevices}</span>
              </div>
              <div className="text-xs text-green-700">One per vehicle</div>
            </div>

            <div className="bg-teal-50 rounded-md p-4 border border-teal-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Fuel className="w-4 h-4 text-teal-600" />
                  <span className="text-sm font-medium text-teal-800">Fuel Sensors</span>
                </div>
                <span className="text-xl font-semibold text-teal-900">{stats.totalFuelSensors}</span>
              </div>
              <div className="text-xs text-teal-700">Including double-tank configs</div>
            </div>
          </div>

          {/* Timeline Statistics */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700">Timeline</h4>
            
            <div className="bg-purple-50 rounded-md p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Project Duration</span>
                </div>
                <span className="text-xl font-semibold text-purple-900">14</span>
              </div>
              <div className="text-xs text-purple-700">Working days</div>
            </div>

            <div className="bg-indigo-50 rounded-md p-4 border border-indigo-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-800">Team Members</span>
                </div>
                <span className="text-xl font-semibold text-indigo-900">{teamMembers.length}</span>
              </div>
              <div className="text-xs text-indigo-700">Installation technicians</div>
            </div>
          </div>
        </div>

        {/* Location Breakdown */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h4 className="text-sm font-medium text-slate-700 mb-4">Location Breakdown</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((location) => (
              <div key={location.name} className="bg-slate-50 rounded-md p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-900">{location.name}</span>
                  </div>
                  <span className="text-xs text-slate-600 bg-slate-200 px-2 py-1 rounded">{location.duration}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">{location.vehicles}</div>
                    <div className="text-xs text-slate-600">Vehicles</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-600">{location.gps_devices}</div>
                    <div className="text-xs text-blue-600">GPS</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-green-600">{location.fuel_sensors}</div>
                    <div className="text-xs text-green-600">Sensors</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

OptimizedProjectStats.displayName = 'OptimizedProjectStats';

export default OptimizedProjectStats;