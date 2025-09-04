'use client';

import React, { useState, useMemo, memo, useCallback, useRef } from 'react';
import { Calendar, Clock, MapPin, Truck, ChevronLeft, ChevronRight, Filter, CheckCircle2, Activity } from 'lucide-react';
import { useVehiclesSWR, useLocationsSWR } from '@/lib/hooks/useSWR';

const GanttChart = memo(() => {
  const { data: vehicles = [], isLoading: loading } = useVehiclesSWR();
  const { data: locations = [] } = useLocationsSWR();
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const renderCache = useRef<Map<string, any>>(new Map());

  // Memoized and cached timeline data generation
  const timelineData = useMemo(() => {
    const cacheKey = `timeline-${vehicles.length}-${selectedLocation}`;
    if (renderCache.current.has(cacheKey)) {
      return renderCache.current.get(cacheKey);
    }
    
    const filtered = selectedLocation === 'All' 
      ? vehicles 
      : vehicles.filter(v => v.location === selectedLocation);

    if (vehicles.length === 0) {
      const result = { vehicles: [], days: [], minDay: 1, maxDay: 1 };
      renderCache.current.set(cacheKey, result);
      return result;
    }
    
    const minDay = Math.min(...vehicles.map(v => v.day));
    const maxDay = Math.max(...vehicles.map(v => v.day));
    
    const days = [];
    for (let day = minDay; day <= maxDay; day++) {
      days.push(day);
    }

    const result = {
      vehicles: filtered.sort((a, b) => a.day - b.day),
      days,
      minDay,
      maxDay
    };
    
    renderCache.current.set(cacheKey, result);
    return result;
  }, [vehicles, selectedLocation]);

  // Memoized color functions
  const getLocationColor = useCallback((location: string) => {
    const colors = {
      'Bahir Dar': 'bg-blue-500',
      'Kombolcha': 'bg-green-500',
      'Addis Ababa': 'bg-purple-500'
    };
    return colors[location as keyof typeof colors] || 'bg-slate-500';
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500';
      case 'In Progress':
        return 'bg-blue-500';
      case 'Pending':
        return 'bg-slate-300';
      default:
        return 'bg-red-500';
    }
  }, []);

  // Clear cache when vehicles change
  React.useEffect(() => {
    renderCache.current.clear();
  }, [vehicles]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <div className="flex items-center justify-center space-x-3">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-sm text-slate-600">Loading Gantt chart...</span>
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
        <p className="text-sm text-slate-600 mb-4">Chart data format is invalid. Please refresh the page.</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Reload Page
        </button>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
        <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Vehicle Data</h3>
        <p className="text-sm text-slate-600 mb-4">No vehicles are currently scheduled for installation.</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-secondary"
        >
          Refresh Data
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
              <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Gantt Chart</h2>
                <p className="text-sm text-slate-600">Visual project timeline and scheduling</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
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
              
              <div className="flex border border-slate-300 rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-3 py-2 text-sm ${
                    viewMode === 'day' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Day View
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-2 text-sm border-l border-slate-300 ${
                    viewMode === 'week' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Week View
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Timeline Header */}
            <div className="bg-slate-50 border-b border-slate-200 p-4">
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-3 text-sm font-medium text-slate-700">Vehicle</div>
                <div className="col-span-2 text-sm font-medium text-slate-700">Location</div>
                <div className="col-span-7">
                  <div className="grid grid-cols-7 gap-1">
                    {timelineData.days.map(day => (
                      <div key={day} className="text-center">
                        <div className="text-xs font-medium text-slate-700">Day {day}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Rows - Virtualized for performance */}
            <div className="divide-y divide-slate-200">
              {timelineData.vehicles.map((vehicle, index) => (
                <VehicleRow
                  key={vehicle.id}
                  vehicle={vehicle}
                  days={timelineData.days}
                  getLocationColor={getLocationColor}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Legend</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Legend */}
          <div>
            <h4 className="text-xs font-medium text-slate-700 mb-2">Status</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-md"></div>
                <span className="text-xs text-slate-600">Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-md"></div>
                <span className="text-xs text-slate-600">In Progress</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-slate-300 rounded-md"></div>
                <span className="text-xs text-slate-600">Pending</span>
              </div>
            </div>
          </div>
          
          {/* Location Legend */}
          <div>
            <h4 className="text-xs font-medium text-slate-700 mb-2">Locations</h4>
            <div className="space-y-2">
              {locations.map(location => (
                <div key={location.name} className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-md ${getLocationColor(location.name)}`}></div>
                  <span className="text-xs text-slate-600">{location.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Equipment Legend */}
          <div>
            <h4 className="text-xs font-medium text-slate-700 mb-2">Equipment</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-100 rounded-md flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <span className="text-xs text-slate-600">GPS Device</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-100 rounded-md flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <span className="text-xs text-slate-600">Fuel Sensor</span>
              </div>
            </div>
          </div>
          
          {/* Timeline Info */}
          <div>
            <h4 className="text-xs font-medium text-slate-700 mb-2">Timeline</h4>
            <div className="space-y-1 text-xs text-slate-600">
              <div>Total Duration: {timelineData.maxDay - timelineData.minDay + 1} days</div>
              <div>Start: Day {timelineData.minDay}</div>
              <div>End: Day {timelineData.maxDay}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// Separate memoized component for vehicle rows to prevent unnecessary re-renders
const VehicleRow = memo(({ vehicle, days, getLocationColor, getStatusColor }: {
  vehicle: any;
  days: number[];
  getLocationColor: (location: string) => string;
  getStatusColor: (status: string) => string;
}) => (
  <div className="p-4 hover:bg-slate-50">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    {/* Vehicle Info */}
                    <div className="col-span-3">
                      <div className="flex items-center space-x-2">
                        <Truck className="w-4 h-4 text-slate-600" />
                        <div>
                          <div className="text-sm font-medium text-slate-900">{vehicle.id}</div>
                          <div className="text-xs text-slate-600 truncate">{vehicle.type}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Location */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getLocationColor(vehicle.location)}`}></div>
                        <span className="text-sm text-slate-700">{vehicle.location}</span>
                      </div>
                    </div>
                    
                    {/* Timeline Bars */}
                    <div className="col-span-7">
                      <div className="grid grid-cols-7 gap-1 h-8">
                        {days.map(day => (
                          <div key={day} className="relative">
                            {vehicle.day === day && (
                              <div className={`h-6 rounded-md flex items-center justify-center ${getStatusColor(vehicle.status)}`}>
                                <div className="flex items-center space-x-1">
                                  {vehicle.status === 'Completed' && <CheckCircle2 className="w-3 h-3 text-white" />}
                                  {vehicle.status === 'In Progress' && <Activity className="w-3 h-3 text-white" />}
                                  {vehicle.status === 'Pending' && <Clock className="w-3 h-3 text-slate-600" />}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Details */}
                  <div className="mt-2 ml-6 grid grid-cols-4 gap-4 text-xs text-slate-600">
                    <div>Time: {vehicle.time_slot}</div>
                    <div>GPS: {vehicle.gps_required}</div>
                    <div>Sensors: {vehicle.fuel_sensors}</div>
                    <div>Tanks: {vehicle.fuel_tanks}</div>
                  </div>
                </div>
));

VehicleRow.displayName = 'VehicleRow';

GanttChart.displayName = 'GanttChart';

export default GanttChart;