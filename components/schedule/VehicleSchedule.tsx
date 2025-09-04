'use client';

import React, { useState, memo, useMemo, useCallback, useRef } from 'react';
import { 
  Calendar, Clock, MapPin, Truck, Navigation, Fuel, CheckCircle2, AlertTriangle, 
  Activity, Target, RefreshCw, Filter, Search, Loader2, ChevronDown, ChevronUp
} from 'lucide-react';
import { useVehiclesSWR, useLocationsSWR, useTeamMembersSWR } from '@/lib/hooks/useSWR';
import { supabase } from '@/lib/supabaseClient';
import dynamic from 'next/dynamic';

// Lazy load the heavy VehicleTaskManager component
const VehicleTaskManager = dynamic(() => import('./VehicleTaskManager'), {
  loading: () => <div className="animate-pulse bg-slate-100 h-20 rounded-md"></div>,
  ssr: false,
});

const VehicleSchedule = memo(() => {
  const { data: vehicles = [], isLoading: vehiclesLoading, error: vehiclesError, mutate: refetch } = useVehiclesSWR();
  const { data: locations = [], isLoading: locationsLoading } = useLocationsSWR();
  const { data: teamMembers = [], isLoading: teamLoading } = useTeamMembersSWR();
  
  // Local state
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedVehicles, setExpandedVehicles] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'day' | 'location' | 'status' | 'type'>('day');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const filterCache = useRef<Map<string, any[]>>(new Map());
  
  const loading = vehiclesLoading || locationsLoading || teamLoading;

  // Toggle vehicle expansion for task management
  const toggleVehicleExpansion = useCallback((vehicleId: string) => {
    const newExpanded = new Set(expandedVehicles);
    if (expandedVehicles.has(vehicleId)) {
      newExpanded.delete(vehicleId);
    } else {
      newExpanded.add(vehicleId);
    }
    setExpandedVehicles(newExpanded);
  }, [expandedVehicles]);

  // Optimized status update with local mutation
  const updateVehicleStatus = useCallback(async (vehicleId: string, status: Vehicle['status']) => {
    try {
      // Optimistic update
      const updatedVehicles = vehicles.map(v => 
        v.id === vehicleId ? { ...v, status, updated_at: new Date().toISOString() } : v
      );
      
      // Update cache immediately
      refetch(updatedVehicles, false);
      
      // Update database
      const { error } = await supabase
        .from('vehicles')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', vehicleId);

      if (error) throw error;
      
      // Revalidate from server
      refetch();
    } catch (error) {
      console.error('Failed to update vehicle status:', error);
      // Revert optimistic update on error
      refetch();
    }
  }, [vehicles, refetch]);
  
  // Handle refresh with loading state
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Enhanced filter and sort with aggressive caching
  const getFilteredAndSortedVehicles = useMemo(() => {
    const cacheKey = `${selectedLocation}-${selectedDay}-${selectedStatus}-${searchTerm}-${sortBy}-${sortOrder}-${vehicles.length}`;
    
    if (filterCache.current.has(cacheKey)) {
      return filterCache.current.get(cacheKey);
    }
    
    let filtered = vehicles.filter(vehicle => {
      const locationMatch = selectedLocation === 'All' || vehicle.location === selectedLocation;
      const dayMatch = selectedDay === null || vehicle.day === selectedDay;
      const statusMatch = selectedStatus === 'All' || vehicle.status === selectedStatus;
      const searchMatch = searchTerm === '' || 
        vehicle.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      return locationMatch && dayMatch && statusMatch && searchMatch;
    });

    // Sort vehicles
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'day':
          aValue = a.day;
          bValue = b.day;
          break;
        case 'location':
          aValue = a.location;
          bValue = b.location;
          break;
        case 'status':
          const statusOrder = { 'In Progress': 3, 'Pending': 2, 'Completed': 1 };
          aValue = statusOrder[a.status as keyof typeof statusOrder];
          bValue = statusOrder[b.status as keyof typeof statusOrder];
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Cache the result
    filterCache.current.set(cacheKey, filtered);
    return filtered;
  }, [vehicles, selectedLocation, selectedDay, selectedStatus, searchTerm, sortBy, sortOrder]);

  // Clear cache when vehicles change
  React.useEffect(() => {
    filterCache.current.clear();
  }, [vehicles]);

  // Get unique days for filter
  const uniqueDays = useMemo(() => 
    [...new Set(vehicles.map(v => v.day))].sort((a, b) => a - b),
    [vehicles]
  );

  // Calculate schedule statistics
  const getScheduleStats = useMemo(() => {
    const total = vehicles.length;
    const completed = vehicles.filter(v => v.status === 'Completed').length;
    const inProgress = vehicles.filter(v => v.status === 'In Progress').length;
    const pending = vehicles.filter(v => v.status === 'Pending').length;
    const totalGps = vehicles.reduce((sum, v) => sum + v.gps_required, 0);
    const totalSensors = vehicles.reduce((sum, v) => sum + v.fuel_sensors, 0);
    
    return { total, completed, inProgress, pending, totalGps, totalSensors };
  }, [vehicles]);

  // Utility functions
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'In Progress':
        return <Activity className="w-4 h-4 text-blue-600" />;
      case 'Pending':
        return <Clock className="w-4 h-4 text-slate-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-sm text-slate-600">Loading vehicle schedule...</span>
          </div>
        </div>
      </div>
    );
  }

  if (vehiclesError) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Schedule</h3>
          <p className="text-sm text-slate-600 mb-4">{typeof vehiclesError === 'string' ? vehiclesError : 'Failed to load vehicle schedule'}</p>
          <button
            onClick={handleRefresh}
            className="btn-primary"
          >
            Try Again
          </button>
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
        <p className="text-sm text-slate-600 mb-4">Vehicle data format is invalid. Please refresh the page.</p>
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
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Vehicle Schedule</h2>
                <p className="text-sm text-slate-600">GPS installation schedule with task management</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn-secondary flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-md border border-blue-200">
              <Truck className="w-4 h-4 text-blue-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-blue-800">{getScheduleStats.total}</div>
              <div className="text-xs text-blue-600">Total</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-md border border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-green-800">{getScheduleStats.completed}</div>
              <div className="text-xs text-green-600">Completed</div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-md border border-orange-200">
              <Activity className="w-4 h-4 text-orange-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-orange-800">{getScheduleStats.inProgress}</div>
              <div className="text-xs text-orange-600">In Progress</div>
            </div>
            
            <div className="text-center p-3 bg-slate-50 rounded-md border border-slate-200">
              <Clock className="w-4 h-4 text-slate-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-slate-800">{getScheduleStats.pending}</div>
              <div className="text-xs text-slate-600">Pending</div>
            </div>
            
            <div className="text-center p-3 bg-slate-50 rounded-md border border-slate-200">
              <Navigation className="w-4 h-4 text-slate-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-slate-800">{getScheduleStats.totalGps}</div>
              <div className="text-xs text-slate-600">GPS Devices</div>
            </div>
            
            <div className="text-center p-3 bg-slate-50 rounded-md border border-slate-200">
              <Fuel className="w-4 h-4 text-slate-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-slate-800">{getScheduleStats.totalSensors}</div>
              <div className="text-xs text-slate-600">Fuel Sensors</div>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Filters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-md"
                />
              </div>

              {/* Location Filter */}
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

              {/* Day Filter */}
              <select
                value={selectedDay || ''}
                onChange={(e) => setSelectedDay(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-md"
              >
                <option value="">All Days</option>
                {uniqueDays.map(day => (
                  <option key={day} value={day}>Day {day}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-md"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>

              {/* Sort Options */}
              <div className="flex space-x-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-l-md"
                >
                  <option value="day">Day</option>
                  <option value="location">Location</option>
                  <option value="status">Status</option>
                  <option value="type">Type</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-2 py-2 bg-slate-100 text-slate-600 rounded-r-md hover:bg-slate-200"
                  aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                >
                  {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle List - Virtualized for performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {getFilteredAndSortedVehicles.map((vehicle) => {
          const isExpanded = expandedVehicles.has(vehicle.id);
          
          return (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              isExpanded={isExpanded}
              onToggleExpansion={() => toggleVehicleExpansion(vehicle.id)}
              onStatusUpdate={updateVehicleStatus}
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
            />
          );
        })}
      </div>

      {/* Empty State */}
      {getFilteredAndSortedVehicles.length === 0 && !loading && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Vehicles Found</h3>
          <p className="text-sm text-slate-600 mb-4">
            {searchTerm || selectedLocation !== 'All' || selectedDay !== null || selectedStatus !== 'All'
              ? 'Try adjusting your filters to see more vehicles.'
              : 'No vehicles are currently scheduled for installation.'}
          </p>
          {(searchTerm || selectedLocation !== 'All' || selectedDay !== null || selectedStatus !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedLocation('All');
                setSelectedDay(null);
                setSelectedStatus('All');
              }}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
});

// Separate memoized component for vehicle cards
const VehicleCard = memo(({ vehicle, isExpanded, onToggleExpansion, onStatusUpdate, getStatusIcon, getStatusColor }: {
  vehicle: any;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onStatusUpdate: (id: string, status: any) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
}) => (
  <div className={`bg-white border border-slate-200 rounded-lg overflow-hidden transition-all duration-200 ${
    isExpanded ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
  }`}>
    {/* Installation Date Header - Prominent Display */}
    <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-blue-100 uppercase tracking-wide">Installation Date</div>
          <div className="text-lg font-bold">
            {vehicle.installation_date 
              ? new Date(vehicle.installation_date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })
              : vehicle.start_date 
                ? new Date(vehicle.start_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })
                : (() => {
                    // Calculate date based on project start date and vehicle day
                    const projectStartDate = new Date(); // This should come from project settings
                    const vehicleDate = new Date(projectStartDate);
                    vehicleDate.setDate(vehicleDate.getDate() + vehicle.day - 1);
                    return vehicleDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    });
                  })()
            }
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium text-blue-100 uppercase tracking-wide">Day</div>
          <div className="text-2xl font-bold">{vehicle.day}</div>
        </div>
      </div>
    </div>

    {/* Vehicle Header */}
    <div className="p-4 border-b border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center">
            <Truck className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{vehicle.id}</h3>
            <p className="text-xs text-slate-600">{vehicle.type}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(vehicle.status)}`}>
            {vehicle.status}
          </span>
          <button
            onClick={onToggleExpansion}
            className="p-1 hover:bg-slate-100 rounded-md"
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} vehicle details`}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Vehicle Info Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <MapPin className="w-3 h-3 text-slate-400" />
          <span className="text-slate-600">{vehicle.location}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-3 h-3 text-slate-400" />
          <span className="text-slate-600">{vehicle.time_slot}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Fuel className="w-3 h-3 text-slate-400" />
          <span className="text-slate-600">{vehicle.fuel_tanks} Tank{vehicle.fuel_tanks > 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>

    {/* Equipment Requirements */}
    <div className="p-4 bg-slate-50">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Navigation className="w-3 h-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-800">GPS Devices</span>
          </div>
          <div className="text-lg font-semibold text-blue-900">{vehicle.gps_required}</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Fuel className="w-3 h-3 text-green-600" />
            <span className="text-xs font-medium text-green-800">Fuel Sensors</span>
          </div>
          <div className="text-lg font-semibold text-green-900">{vehicle.fuel_sensors}</div>
        </div>
      </div>
    </div>

    {/* Status Actions */}
    <div className="p-4 border-t border-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon(vehicle.status)}
          <span className="text-sm font-medium text-slate-700">Status</span>
        </div>
        
        <div className="flex space-x-1">
          {vehicle.status !== 'Completed' && (
            <button
              onClick={() => onStatusUpdate(vehicle.id, 'In Progress')}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
              disabled={vehicle.status === 'In Progress'}
            >
              Start
            </button>
          )}
          {vehicle.status === 'In Progress' && (
            <button
              onClick={() => onStatusUpdate(vehicle.id, 'Completed')}
              className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-md hover:bg-green-200"
            >
              Complete
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Expanded Task Management */}
    {isExpanded && (
      <div className="border-t border-slate-200 animate-fade-in">
        <VehicleTaskManager vehicleId={vehicle.id} />
      </div>
    )}
  </div>
));

VehicleCard.displayName = 'VehicleCard';
VehicleSchedule.displayName = 'VehicleSchedule';

export default VehicleSchedule;