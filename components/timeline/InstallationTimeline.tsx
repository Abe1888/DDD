'use client';

import React, { useState, useMemo, memo, useCallback } from 'react';
import { Calendar, MapPin, Truck, Clock, CheckCircle2, Activity, AlertTriangle } from 'lucide-react';
import { useVehiclesSWR, useLocationsSWR } from '@/lib/hooks/useSWR';

const InstallationTimeline = memo(() => {
  const { data: vehicles = [], isLoading: loading } = useVehiclesSWR();
  const { data: locations = [] } = useLocationsSWR();
  const [selectedLocation, setSelectedLocation] = useState<string>('All');

  // Group vehicles by day and location for timeline view
  const timelineData = useMemo(() => {
    const filtered = selectedLocation === 'All' 
      ? vehicles 
      : vehicles.filter(v => v.location === selectedLocation);

    const grouped = filtered.reduce((acc, vehicle) => {
      const key = `${vehicle.day}-${vehicle.location}`;
      if (!acc[key]) {
        acc[key] = {
          day: vehicle.day,
          location: vehicle.location,
          vehicles: []
        };
      }
      acc[key].vehicles.push(vehicle);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).sort((a: any, b: any) => a.day - b.day);
  }, [vehicles, selectedLocation]);

  const getLocationColor = useCallback((location: string) => {
    const colors = {
      'Bahir Dar': 'bg-blue-500',
      'Kombolcha': 'bg-green-500',
      'Addis Ababa': 'bg-purple-500'
    };
    return colors[location as keyof typeof colors] || 'bg-slate-500';
  }, []);

  const getStatusStats = useCallback((vehicleList: any[]) => {
    return {
      completed: vehicleList.filter(v => v.status === 'Completed').length,
      inProgress: vehicleList.filter(v => v.status === 'In Progress').length,
      pending: vehicleList.filter(v => v.status === 'Pending').length,
      total: vehicleList.length
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <div className="flex items-center justify-center space-x-3">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-sm text-slate-600">Loading installation timeline...</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Add safety check for data
  if (!Array.isArray(vehicles)) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Invalid Data Format</h3>
        <p className="text-sm text-slate-600 mb-4">Timeline data format is invalid. Please refresh the page.</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Installation Timeline</h2>
                <p className="text-sm text-slate-600">Project schedule across all locations</p>
              </div>
            </div>
            
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-md"
            >
              <option value="All">All Locations</option>
              {locations.map(location => (
                <option key={location.name} value={location.name}>{location.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-300"></div>
        
        <div className="space-y-8">
          {timelineData.map((dayData: any, index) => {
            const stats = getStatusStats(dayData.vehicles);
            const progressPercentage = Math.round((stats.completed / stats.total) * 100);
            
            return (
              <div key={`${dayData.day}-${dayData.location}`} className="relative">
                {/* Timeline Dot */}
                <div className={`absolute left-6 w-4 h-4 rounded-full border-2 border-white ${
                  stats.completed === stats.total ? 'bg-green-500' :
                  stats.inProgress > 0 ? 'bg-blue-500' : 'bg-slate-400'
                }`}></div>
                
                {/* Timeline Content */}
                <div className="ml-16">
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    {/* Day Header */}
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${getLocationColor(dayData.location)}`}>
                            <MapPin className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-slate-900">
                              Day {dayData.day} - {dayData.location}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {stats.total} vehicles scheduled
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-semibold text-slate-900">{progressPercentage}%</div>
                          <div className="text-xs text-slate-600">Complete</div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Vehicles Grid */}
                    <div className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dayData.vehicles.map((vehicle: any) => (
                          <div
                            key={vehicle.id}
                            className="border border-slate-200 rounded-md p-3 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Truck className="w-4 h-4 text-slate-600" />
                                <span className="text-sm font-medium text-slate-900">{vehicle.id}</span>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                {vehicle.status === 'Completed' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                                {vehicle.status === 'In Progress' && <Activity className="w-4 h-4 text-blue-600" />}
                                {vehicle.status === 'Pending' && <Clock className="w-4 h-4 text-slate-500" />}
                              </div>
                            </div>
                            
                            <div className="space-y-1 text-xs text-slate-600">
                              <div className="truncate">{vehicle.type}</div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{vehicle.time_slot}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>GPS: {vehicle.gps_required}</span>
                                <span>Sensors: {vehicle.fuel_sensors}</span>
                              </div>
                            </div>
                            
                            <div className="mt-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                                vehicle.status === 'Completed' ? 'bg-green-100 text-green-800 border-green-200' :
                                vehicle.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                'bg-slate-100 text-slate-800 border-slate-200'
                              }`}>
                                {vehicle.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Day Summary */}
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className="grid grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{stats.total}</div>
                            <div className="text-xs text-slate-600">Total</div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-green-600">{stats.completed}</div>
                            <div className="text-xs text-green-600">Done</div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-blue-600">{stats.inProgress}</div>
                            <div className="text-xs text-blue-600">Active</div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-600">{stats.pending}</div>
                            <div className="text-xs text-slate-600">Pending</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

InstallationTimeline.displayName = 'InstallationTimeline';

export default InstallationTimeline;