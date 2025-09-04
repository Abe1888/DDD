'use client';

import React, { useState, memo, useMemo, useCallback, useRef } from 'react';
import { MapPin, Truck, Navigation, Fuel, CheckCircle2 } from 'lucide-react';
import { useVehiclesSWR, useLocationsSWR } from '@/lib/hooks/useSWR';

const LocationOverview = memo(() => {
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehiclesSWR();
  const { data: locations = [], isLoading: locationsLoading } = useLocationsSWR();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const calculationCache = useRef<Map<string, any>>(new Map());

  const loading = vehiclesLoading || locationsLoading;
  
  // Add timeout for loading state
  const [hasTimedOut, setHasTimedOut] = useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setHasTimedOut(true);
      }
    }, 15000); // 15 second timeout
    
    return () => clearTimeout(timer);
  }, [loading]);
  
  React.useEffect(() => {
    if (!loading) {
      setHasTimedOut(false);
    }
  }, [loading]);

  // Memoized and cached location progress calculations
  const getLocationProgress = useCallback((locationName: string) => {
    const cacheKey = `${locationName}-${vehicles.length}-${vehicles.filter(v => v.status === 'Completed').length}`;
    if (calculationCache.current.has(cacheKey)) {
      return calculationCache.current.get(cacheKey);
    }
    
    const locationVehicles = vehicles.filter(v => v.location === locationName);
    const completed = locationVehicles.filter(v => v.status === 'Completed').length;
    const total = locationVehicles.length;

    const result = {
      total,
      completed,
      inProgress: locationVehicles.filter(v => v.status === 'In Progress').length,
      pending: locationVehicles.filter(v => v.status === 'Pending').length,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0
    };
    
    calculationCache.current.set(cacheKey, result);
    return result;
  }, [vehicles]);

  const getLocationDays = useCallback((locationName: string) => {
    const cacheKey = `days-${locationName}-${vehicles.length}`;
    if (calculationCache.current.has(cacheKey)) {
      return calculationCache.current.get(cacheKey);
    }
    
    const locationVehicles = vehicles.filter(v => v.location === locationName);
    // ✅ FIX: Use Array.from instead of spread operator on Set
    const days = Array.from(new Set(locationVehicles.map(v => v.day))).sort((a, b) => a - b);
    
    calculationCache.current.set(cacheKey, days);
    return days;
  }, [vehicles]);

  const handleLocationClick = useCallback((locationName: string) => {
    setSelectedLocation(selectedLocation === locationName ? null : locationName);
  }, [selectedLocation]);

  // Clear cache when vehicles data changes
  React.useEffect(() => {
    calculationCache.current.clear();
  }, [vehicles]);
  
  if (loading && !hasTimedOut) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center animate-pulse">
        <div className="text-sm text-slate-600">Loading location data...</div>
      </div>
    );
  }
  
  if (hasTimedOut) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Loading Timeout</h3>
        <p className="text-sm text-slate-600 mb-4">Location data is taking longer than expected to load.</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Reload Page
        </button>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
        <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Locations Available</h3>
        <p className="text-sm text-slate-600 mb-4">Location data is being loaded or not yet configured.</p>
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
    <div className="bg-white border border-slate-200 rounded-lg animate-slide-up">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
            <MapPin className="w-3 h-3 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Location Overview</h3>
            <p className="text-sm text-slate-600">Installation progress by location</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {locations.map((location) => {
            const progress = getLocationProgress(location.name);
            const days = getLocationDays(location.name);
            const isSelected = selectedLocation === location.name;
            
            return (
              <div 
                key={location.name}
                className={`rounded-lg p-6 cursor-pointer border transition-all duration-200 ${
                  isSelected 
                    ? 'bg-blue-600 text-white border-blue-600 transform scale-105' 
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:shadow-md'
                }`}
                onClick={() => handleLocationClick(location.name)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                      isSelected ? 'bg-white bg-opacity-20' : 'bg-white'
                    }`}>
                      <MapPin className={`w-3 h-3 ${isSelected ? 'text-blue-600' : 'text-slate-600'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className={`text-base font-semibold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {location.name}
                      </h4>
                      <p className={`text-sm ${isSelected ? 'text-blue-100' : 'text-slate-600'}`}>
                        {location.duration}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`text-right ${isSelected ? 'text-white' : 'text-slate-600'}`}>
                    <div className="text-xl font-semibold">{progress.progress}%</div>
                    <div className="text-xs">Complete</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className={`w-full rounded-full h-2 mb-4 ${isSelected ? 'bg-white bg-opacity-20' : 'bg-slate-200'}`}>
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isSelected ? 'bg-white' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progress.progress}%` }}
                  ></div>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className={`text-center p-3 rounded-md ${
                    isSelected ? 'bg-white bg-opacity-10' : 'bg-white border border-slate-200'
                  }`}>
                    <div className={`text-lg font-semibold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {location.vehicles}
                    </div>
                    <div className={`text-xs ${isSelected ? 'text-blue-100' : 'text-slate-600'}`}>
                      Vehicles
                    </div>
                  </div>
                  
                  <div className={`text-center p-3 rounded-md ${
                    isSelected ? 'bg-white bg-opacity-10' : 'bg-white border border-slate-200'
                  }`}>
                    <div className={`text-lg font-semibold ${isSelected ? 'text-white' : 'text-blue-600'}`}>
                      {location.gps_devices}
                    </div>
                    <div className={`text-xs ${isSelected ? 'text-blue-100' : 'text-blue-600'}`}>
                      GPS
                    </div>
                  </div>
                  
                  <div className={`text-center p-3 rounded-md ${
                    isSelected ? 'bg-white bg-opacity-10' : 'bg-white border border-slate-200'
                  }`}>
                    <div className={`text-lg font-semibold ${isSelected ? 'text-white' : 'text-green-600'}`}>
                      {location.fuel_sensors}
                    </div>
                    <div className={`text-xs ${isSelected ? 'text-blue-100' : 'text-green-600'}`}>
                      Sensors
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-white border-opacity-20 animate-fade-in">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-100">Working Days</span>
                        <span className="text-sm font-medium text-white">
                          Days {days.length > 0 ? Math.min(...days) : 0} - {days.length > 0 ? Math.max(...days) : 0}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white bg-opacity-10 rounded-md p-2">
                          <div className="text-sm font-semibold text-white">{progress.completed}</div>
                          <div className="text-xs text-blue-100">Done</div>
                        </div>
                        <div className="bg-white bg-opacity-10 rounded-md p-2">
                          <div className="text-sm font-semibold text-white">{progress.inProgress}</div>
                          <div className="text-xs text-blue-100">Active</div>
                        </div>
                        <div className="bg-white bg-opacity-10 rounded-md p-2">
                          <div className="text-sm font-semibold text-white">{progress.pending}</div>
                          <div className="text-xs text-blue-100">Pending</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

LocationOverview.displayName = 'LocationOverview';

export default LocationOverview;
