'use client';

import React, { useState, memo, useMemo, useCallback } from 'react';
import { 
  CheckSquare, Clock, User, AlertTriangle, Plus, Search, Filter,
  Calendar, Target, MessageSquare, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { useTasksOptimized, useTeamMembersOptimized, useVehiclesOptimized } from '@/lib/hooks/useOptimizedSWR';
import { Task } from '@/lib/supabase/types';
import { supabase } from '@/lib/supabaseClient';

const OptimizedTaskManagement = memo(() => {
  const { data: tasks = [], isLoading: loading, error, mutate: refetch } = useTasksOptimized();
  const { data: teamMembers = [] } = useTeamMembersOptimized();
  const { data: vehicles = [] } = useVehiclesOptimized();
  
  // Local state
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'priority' | 'status' | 'assigned_to' | 'created_at'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // New task form state
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    vehicle_id: '',
    assigned_to: '',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    estimated_duration: 60,
    start_date: new Date().toISOString().split('T')[0],
    duration_days: 1,
  });

  const toggleTaskExpansion = useCallback((taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (expandedTasks.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  }, [expandedTasks]);

  // Optimized task operations with instant UI updates
  const updateTaskStatus = useCallback(async (taskId: string, status: Task['status']) => {
    try {
      // Instant optimistic update
      const updatedTasks = tasks.map(t => 
        t.id === taskId ? { ...t, status, updated_at: new Date().toISOString() } : t
      );
      refetch(updatedTasks, false);
      
      // Background database update
      const { error } = await supabase
        .from('tasks')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update task status:', error);
      refetch(); // Revert on error
    }
  }, [tasks, refetch]);

  const addTask = useCallback(async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{
          ...task,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Failed to add task:', error);
      throw error;
    }
  }, [refetch]);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      // Instant optimistic update
      const updatedTasks = tasks.filter(t => t.id !== taskId);
      refetch(updatedTasks, false);
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete task:', error);
      refetch(); // Revert on error
    }
  }, [tasks, refetch]);

  // Filter and sort tasks with memoization
  const getFilteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      const statusMatch = selectedStatus === 'All' || task.status === selectedStatus;
      const assigneeMatch = selectedAssignee === 'All' || task.assigned_to === selectedAssignee;
      const priorityMatch = selectedPriority === 'All' || task.priority === selectedPriority;
      const searchMatch = searchTerm === '' || 
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assigned_to.toLowerCase().includes(searchTerm.toLowerCase());
      
      return statusMatch && assigneeMatch && priorityMatch && searchMatch;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
          break;
        case 'status':
          const statusOrder = { 'In Progress': 3, 'Pending': 2, 'Completed': 1, 'Blocked': 0 };
          aValue = statusOrder[a.status as keyof typeof statusOrder];
          bValue = statusOrder[b.status as keyof typeof statusOrder];
          break;
        case 'assigned_to':
          aValue = a.assigned_to;
          bValue = b.assigned_to;
          break;
        case 'created_at':
          aValue = new Date(a.created_at || '').getTime();
          bValue = new Date(b.created_at || '').getTime();
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

    return filtered;
  }, [tasks, selectedStatus, selectedAssignee, selectedPriority, searchTerm, sortBy, sortOrder]);

  const handleAddTask = useCallback(async () => {
    if (!newTask.name.trim() || !newTask.assigned_to) return;

    try {
      await addTask({
        ...newTask,
        status: 'Pending',
        end_date: new Date(new Date(newTask.start_date).getTime() + (newTask.duration_days - 1) * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0],
      });

      // Reset form
      setNewTask({
        name: '',
        description: '',
        vehicle_id: '',
        assigned_to: '',
        priority: 'Medium',
        estimated_duration: 60,
        start_date: new Date().toISOString().split('T')[0],
        duration_days: 1,
      });
      setShowAddTask(false);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('Failed to add task:', error);
    }
  }, [newTask, addTask]);

  const getTaskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const pending = tasks.filter(t => t.status === 'Pending').length;
    const blocked = tasks.filter(t => t.status === 'Blocked').length;
    const highPriority = tasks.filter(t => t.priority === 'High').length;
    
    return { total, completed, inProgress, pending, blocked, highPriority };
  }, [tasks]);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckSquare className="w-4 h-4 text-green-600" />;
      case 'In Progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'Blocked':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Target className="w-4 h-4 text-slate-500" />;
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Blocked':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  }, []);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  }, []);

  // Show cached data immediately
  if (loading && tasks.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <div className="text-sm text-slate-600">Loading task management...</div>
        </div>
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
              <div className="w-8 h-8 bg-purple-600 rounded-md flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Task Management</h2>
                <p className="text-sm text-slate-600">Manage installation and maintenance tasks</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => refetch()}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowAddTask(!showAddTask)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {/* Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mb-6">
            <div className="text-center p-3 bg-slate-50 rounded-md border border-slate-200">
              <Target className="w-4 h-4 text-slate-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-slate-800">{getTaskStats.total}</div>
              <div className="text-xs text-slate-600">Total</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-md border border-green-200">
              <CheckSquare className="w-4 h-4 text-green-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-green-800">{getTaskStats.completed}</div>
              <div className="text-xs text-green-600">Completed</div>
            </div>
            
            <div className="text-center p-3 bg-blue-50 rounded-md border border-blue-200">
              <Clock className="w-4 h-4 text-blue-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-blue-800">{getTaskStats.inProgress}</div>
              <div className="text-xs text-blue-600">In Progress</div>
            </div>
            
            <div className="text-center p-3 bg-slate-50 rounded-md border border-slate-200">
              <Target className="w-4 h-4 text-slate-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-slate-800">{getTaskStats.pending}</div>
              <div className="text-xs text-slate-600">Pending</div>
            </div>
            
            <div className="text-center p-3 bg-red-50 rounded-md border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-red-800">{getTaskStats.blocked}</div>
              <div className="text-xs text-red-600">Blocked</div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-md border border-orange-200">
              <AlertTriangle className="w-4 h-4 text-orange-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-orange-800">{getTaskStats.highPriority}</div>
              <div className="text-xs text-orange-600">High Priority</div>
            </div>
          </div>

          {/* Filters */}
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
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-md"
                />
              </div>

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
                <option value="Blocked">Blocked</option>
              </select>

              {/* Assignee Filter */}
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-md"
              >
                <option value="All">All Assignees</option>
                {teamMembers.map(member => (
                  <option key={member.id} value={member.name}>{member.name}</option>
                ))}
              </select>

              {/* Priority Filter */}
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-md"
              >
                <option value="All">All Priorities</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>

              {/* Sort Options */}
              <div className="flex space-x-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-l-md"
                >
                  <option value="priority">Priority</option>
                  <option value="status">Status</option>
                  <option value="assigned_to">Assignee</option>
                  <option value="created_at">Created</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-2 py-2 bg-slate-100 text-slate-600 rounded-r-md hover:bg-slate-200"
                >
                  {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Task Form */}
      {showAddTask && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 animate-slide-up">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Add New Task</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Task Name</label>
              <input
                type="text"
                value={newTask.name}
                onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                placeholder="Enter task name..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle</label>
              <select
                value={newTask.vehicle_id}
                onChange={(e) => setNewTask({ ...newTask, vehicle_id: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              >
                <option value="">Select vehicle...</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.id} - {vehicle.type}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assigned To</label>
              <select
                value={newTask.assigned_to}
                onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              >
                <option value="">Select assignee...</option>
                {teamMembers.map(member => (
                  <option key={member.id} value={member.name}>{member.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              rows={3}
              placeholder="Task description..."
            />
          </div>
          
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowAddTask(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTask}
              disabled={!newTask.name.trim() || !newTask.assigned_to}
              className="btn-primary"
            >
              Add Task
            </button>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {getFilteredAndSortedTasks.map((task) => {
          const isExpanded = expandedTasks.has(task.id);
          const vehicle = vehicles.find(v => v.id === task.vehicle_id);
          
          return (
            <div
              key={task.id}
              className={`bg-white border border-slate-200 rounded-lg overflow-hidden transition-all duration-200 ${
                isExpanded ? 'ring-2 ring-purple-500 shadow-lg' : 'hover:shadow-md'
              }`}
            >
              {/* Task Header */}
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    {getStatusIcon(task.status)}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{task.name}</h3>
                      <p className="text-xs text-slate-600">
                        {vehicle ? `${vehicle.id} - ${vehicle.type}` : 'No vehicle assigned'}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleTaskExpansion(task.id)}
                    className="p-1 hover:bg-slate-100 rounded-md"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-600">{task.assigned_to}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Task Actions */}
              <div className="p-4 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-slate-600">
                    <Calendar className="w-3 h-3" />
                    <span>{task.start_date || 'No date set'}</span>
                    {task.estimated_duration && (
                      <>
                        <Clock className="w-3 h-3 ml-2" />
                        <span>{task.estimated_duration}min</span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex space-x-1">
                    {task.status === 'Pending' && (
                      <button
                        onClick={() => updateTaskStatus(task.id, 'In Progress')}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                      >
                        Start
                      </button>
                    )}
                    {task.status === 'In Progress' && (
                      <button
                        onClick={() => updateTaskStatus(task.id, 'Completed')}
                        className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="p-4 border-t border-slate-200 animate-fade-in">
                  {task.description && (
                    <div className="mb-3">
                      <h5 className="text-xs font-medium text-slate-700 mb-1">Description</h5>
                      <p className="text-xs text-slate-600">{task.description}</p>
                    </div>
                  )}
                  
                  {task.notes && (
                    <div className="mb-3">
                      <h5 className="text-xs font-medium text-slate-700 mb-1">Notes</h5>
                      <p className="text-xs text-slate-600">{task.notes}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center space-x-1 text-xs text-slate-600">
                      <MessageSquare className="w-3 h-3" />
                      <span>Comments</span>
                    </div>
                    
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Delete Task
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {getFilteredAndSortedTasks.length === 0 && !loading && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Tasks Found</h3>
          <p className="text-sm text-slate-600 mb-4">
            {searchTerm || selectedStatus !== 'All' || selectedAssignee !== 'All' || selectedPriority !== 'All'
              ? 'Try adjusting your filters to see more tasks.'
              : 'No tasks have been created yet.'}
          </p>
          <button
            onClick={() => setShowAddTask(true)}
            className="btn-primary"
          >
            Create First Task
          </button>
        </div>
      )}
    </div>
  );
});

OptimizedTaskManagement.displayName = 'OptimizedTaskManagement';

export default OptimizedTaskManagement;