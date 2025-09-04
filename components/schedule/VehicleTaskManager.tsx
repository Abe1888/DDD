'use client';

import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { 
  Clock, User, AlertCircle, CheckCircle2, Plus, MessageSquare, 
  Edit3, Trash2, Target, Filter, Search, ChevronDown, ChevronUp,
  Activity, AlertTriangle, RefreshCw
} from 'lucide-react';
import { useTasksSWR, useTeamMembersSWR } from '@/lib/hooks/useSWR';
import { Task } from '@/lib/supabase/types';
import { supabase } from '@/lib/supabaseClient';

interface VehicleTaskManagerProps {
  vehicleId: string;
}

const VehicleTaskManager: React.FC<VehicleTaskManagerProps> = memo(({ vehicleId }) => {
  const { data: tasks = [], isLoading: loading, mutate: refetch } = useTasksSWR();
  const { data: teamMembers = [] } = useTeamMembersSWR();
  
  const [showAddTask, setShowAddTask] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'priority' | 'status' | 'assigned_to' | 'created_at'>('priority');
  
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newTaskDuration, setNewTaskDuration] = useState(60);
  
  const [taskComments, setTaskComments] = useState<Record<string, any[]>>({});

  // Filter tasks for this vehicle
  const vehicleTasks = useMemo(() => 
    tasks.filter(task => task.vehicle_id === vehicleId),
    [tasks, vehicleId]
  );

  // Optimized task operations
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

  const updateTaskStatus = useCallback(async (taskId: string, status: Task['status']) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Failed to update task status:', error);
      throw error;
    }
  }, [refetch]);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  }, [refetch]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  }, [refetch]);

  const addComment = useCallback(async (taskId: string, text: string, author: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          task_id: taskId,
          text,
          author,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  }, []);

  const fetchTaskComments = useCallback(async (taskId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      return [];
    }
  }, []);

  // Apply filters and sorting
  const getFilteredAndSortedTasks = useMemo(() => {
    let filtered = vehicleTasks.filter(task => {
      const statusMatch = selectedStatus === 'All' || task.status === selectedStatus;
      const priorityMatch = selectedPriority === 'All' || task.priority === selectedPriority;
      const assigneeMatch = selectedAssignee === 'All' || task.assigned_to === selectedAssignee;
      const searchMatch = searchTerm === '' || 
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return statusMatch && priorityMatch && assigneeMatch && searchMatch;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
        case 'status':
          const statusOrder = { 'In Progress': 3, 'Pending': 2, 'Completed': 1, 'Blocked': 0 };
          return statusOrder[b.status as keyof typeof statusOrder] - statusOrder[a.status as keyof typeof statusOrder];
        case 'assigned_to':
          return a.assigned_to.localeCompare(b.assigned_to);
        case 'created_at':
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [vehicleTasks, selectedStatus, selectedPriority, selectedAssignee, searchTerm, sortBy]);

  // Calculate task statistics
  const getTaskStats = useMemo(() => {
    const total = vehicleTasks.length;
    const completed = vehicleTasks.filter(t => t.status === 'Completed').length;
    const inProgress = vehicleTasks.filter(t => t.status === 'In Progress').length;
    const pending = vehicleTasks.filter(t => t.status === 'Pending').length;
    const blocked = vehicleTasks.filter(t => t.status === 'Blocked').length;
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, inProgress, pending, blocked, completionPercentage };
  }, [vehicleTasks]);

  // Load comments for tasks
  useEffect(() => {
    const loadComments = async () => {
      if (vehicleTasks.length === 0) return;
      
      const commentsData: Record<string, any[]> = {};
      
      try {
        for (const task of vehicleTasks) {
          const comments = await fetchTaskComments(task.id);
          commentsData[task.id] = comments;
        }
        setTaskComments(commentsData);
      } catch (error) {
        console.error('Failed to load task comments:', error);
      }
    };

    loadComments();
  }, [vehicleTasks, fetchTaskComments]);

  const handleGenerateStandardTasks = useCallback(async () => {
    const standardTasks = [
      {
        name: 'Vehicle Inspection',
        description: 'Pre-installation vehicle assessment and documentation',
        priority: 'High' as const,
        estimated_duration: 30,
        tags: ['inspection', 'pre-installation']
      },
      {
        name: 'GPS Device Installation',
        description: 'Install and mount GPS tracking devices',
        priority: 'High' as const,
        estimated_duration: 60,
        tags: ['gps', 'installation']
      },
      {
        name: 'Fuel Sensor Installation',
        description: 'Install fuel level sensors in tanks',
        priority: 'High' as const,
        estimated_duration: 90,
        tags: ['fuel-sensor', 'installation']
      },
      {
        name: 'System Configuration',
        description: 'Configure GPS and sensor settings',
        priority: 'High' as const,
        estimated_duration: 45,
        tags: ['configuration', 'system']
      },
      {
        name: 'Fuel Sensor Calibration',
        description: 'Calibrate fuel sensors for accurate fuel level readings',
        priority: 'High' as const,
        estimated_duration: 60,
        tags: ['calibration', 'fuel-sensor']
      },
      {
        name: 'Quality Assurance',
        description: 'Final system testing and validation',
        priority: 'Medium' as const,
        estimated_duration: 30,
        tags: ['qa', 'testing']
      },
      {
        name: 'Documentation',
        description: 'Complete installation documentation',
        priority: 'Medium' as const,
        estimated_duration: 20,
        tags: ['documentation', 'completion']
      }
    ];

    try {
      for (const taskTemplate of standardTasks) {
        await addTask({
          vehicle_id: vehicleId,
          name: taskTemplate.name,
          description: taskTemplate.description,
          status: 'Pending',
          assigned_to: teamMembers[0]?.name || 'Unassigned',
          priority: taskTemplate.priority,
          estimated_duration: taskTemplate.estimated_duration,
          start_date: new Date().toISOString().split('T')[0],
          duration_days: 1,
          tags: taskTemplate.tags,
        });
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('Failed to generate standard tasks:', error);
    }
  }, [vehicleId, teamMembers, addTask]);

  const handleAddTask = useCallback(async () => {
    if (!newTaskName.trim() || !newTaskAssignee) return;

    try {
      await addTask({
        vehicle_id: vehicleId,
        name: newTaskName,
        description: newTaskDescription,
        status: 'Pending',
        assigned_to: newTaskAssignee,
        priority: newTaskPriority,
        estimated_duration: newTaskDuration,
        start_date: new Date().toISOString().split('T')[0],
        duration_days: 1,
      });

      // Reset form
      setNewTaskName('');
      setNewTaskDescription('');
      setNewTaskAssignee('');
      setNewTaskPriority('Medium');
      setNewTaskDuration(60);
      setShowAddTask(false);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('Failed to add task:', error);
    }
  }, [newTaskName, newTaskDescription, newTaskAssignee, newTaskPriority, newTaskDuration, vehicleId, addTask]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setDeleteConfirm(null);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('Failed to delete task:', error);
    }
  }, [deleteTask]);

  const handleAddComment = useCallback(async (taskId: string, comment: string) => {
    if (!comment.trim()) return;

    try {
      await addComment(taskId, comment, 'Current User');
      // Refresh comments for this task
      const updatedComments = await fetchTaskComments(taskId);
      setTaskComments(prev => ({
        ...prev,
        [taskId]: updatedComments
      }));
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('Failed to add comment:', error);
    }
  }, [addComment, fetchTaskComments]);

  const toggleTaskExpansion = useCallback((taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (expandedTasks.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  }, [expandedTasks]);

  const getTaskStatusColor = useCallback((status: string) => {
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

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-pulse text-sm text-slate-600">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <Target className="w-3 h-3 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Tasks for {vehicleId}</h4>
            <p className="text-xs text-slate-600">Vehicle installation tasks</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddTask(!showAddTask)}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center space-x-1"
          >
            <Plus className="w-3 h-3" />
            <span>Add Task</span>
          </button>
          
          <button
            onClick={handleGenerateStandardTasks}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center space-x-1"
          >
            <Target className="w-3 h-3" />
            <span>Generate Tasks</span>
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          
          <button
            onClick={() => setExpandedTasks(new Set())}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Task Statistics Badges */}
      {vehicleTasks.length > 0 && (
        <div className="grid grid-cols-6 gap-2">
          <div className="text-center p-2 bg-blue-50 rounded-md border border-blue-200">
            <div className="text-sm font-semibold text-blue-800">{getTaskStats.total}</div>
            <div className="text-xs text-blue-600">Total</div>
          </div>
          
          <div className="text-center p-2 bg-green-50 rounded-md border border-green-200">
            <div className="text-sm font-semibold text-green-800">{getTaskStats.completed}</div>
            <div className="text-xs text-green-600">Done</div>
          </div>
          
          <div className="text-center p-2 bg-orange-50 rounded-md border border-orange-200">
            <div className="text-sm font-semibold text-orange-800">{getTaskStats.inProgress}</div>
            <div className="text-xs text-orange-600">Active</div>
          </div>
          
          <div className="text-center p-2 bg-slate-50 rounded-md border border-slate-200">
            <div className="text-sm font-semibold text-slate-800">{getTaskStats.pending}</div>
            <div className="text-xs text-slate-600">Pending</div>
          </div>
          
          <div className="text-center p-2 bg-red-50 rounded-md border border-red-200">
            <div className="text-sm font-semibold text-red-800">{getTaskStats.blocked}</div>
            <div className="text-xs text-red-600">Blocked</div>
          </div>
          
          <div className="text-center p-2 bg-purple-50 rounded-md border border-purple-200">
            <div className="text-sm font-semibold text-purple-800">{getTaskStats.completionPercentage}%</div>
            <div className="text-xs text-purple-600">Complete</div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      {vehicleTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Filters</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2 py-1 text-xs border border-slate-300 rounded-md"
              >
                <option value="priority">Priority</option>
                <option value="status">Status</option>
                <option value="assigned_to">Assignee</option>
                <option value="created_at">Created</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 text-xs border border-slate-300 rounded-md"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2 py-1.5 text-xs border border-slate-300 rounded-md"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Blocked">Blocked</option>
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-2 py-1.5 text-xs border border-slate-300 rounded-md"
            >
              <option value="All">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>

            {/* Assignee Filter */}
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="px-2 py-1.5 text-xs border border-slate-300 rounded-md"
            >
              <option value="All">All Assignees</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.name}>{member.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Add Task Form */}
      {showAddTask && (
        <div className="bg-slate-50 rounded-md p-4 space-y-3 animate-slide-up">
          <h5 className="text-sm font-semibold text-slate-900">Add New Task</h5>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Task name..."
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-md"
            />
            
            <select
              value={newTaskAssignee}
              onChange={(e) => setNewTaskAssignee(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-md"
            >
              <option value="">Select assignee...</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.name}>{member.name}</option>
              ))}
            </select>
          </div>
          
          <textarea
            placeholder="Task description..."
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
            rows={2}
          />
          
          <div className="grid grid-cols-2 gap-3">
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as any)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-md"
            >
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
            
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <input
                type="number"
                placeholder="Duration (min)"
                value={newTaskDuration}
                onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md"
                min="15"
                step="15"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowAddTask(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTask}
              disabled={!newTaskName.trim() || !newTaskAssignee}
              className="btn-primary"
            >
              Add Task
            </button>
          </div>
        </div>
      )}

      {/* Tasks List or Empty State */}
      {getFilteredAndSortedTasks.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-slate-400" />
          </div>
          <h5 className="text-base font-semibold text-slate-900 mb-2">No Tasks Yet</h5>
          <p className="text-sm text-slate-600 mb-6">Get started by creating tasks for this vehicle installation.</p>
          
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={() => setShowAddTask(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Task</span>
            </button>
            
            <button
              onClick={handleGenerateStandardTasks}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
            >
              <Target className="w-4 h-4" />
              <span>Generate Standard Tasks</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {getFilteredAndSortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              comments={taskComments[task.id] || []}
              isExpanded={expandedTasks.has(task.id)}
              isEditing={editingTask === task.id}
              onToggleExpansion={() => toggleTaskExpansion(task.id)}
              onStartEdit={() => setEditingTask(task.id)}
              onCancelEdit={() => setEditingTask(null)}
              onDelete={() => setDeleteConfirm(task.id)}
              onStatusUpdate={updateTaskStatus}
              onAddComment={handleAddComment}
              onUpdateTask={updateTask}
              getTaskStatusColor={getTaskStatusColor}
              getPriorityColor={getPriorityColor}
              teamMembers={teamMembers}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-base font-semibold text-slate-900">Delete Task</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTask(deleteConfirm)}
                className="btn-danger"
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

VehicleTaskManager.displayName = 'VehicleTaskManager';

// Enhanced TaskCard component
interface TaskCardProps {
  task: Task;
  comments: any[];
  isExpanded: boolean;
  isEditing: boolean;
  onToggleExpansion: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onStatusUpdate: (taskId: string, status: Task['status']) => Promise<void>;
  onAddComment: (taskId: string, comment: string) => Promise<void>;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  getTaskStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  teamMembers: any[];
}

const TaskCard: React.FC<TaskCardProps> = memo(({ 
  task, 
  comments, 
  isExpanded,
  isEditing,
  onToggleExpansion,
  onStartEdit,
  onCancelEdit,
  onDelete,
  onStatusUpdate, 
  onAddComment,
  onUpdateTask,
  getTaskStatusColor, 
  getPriorityColor,
  teamMembers
}) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editForm, setEditForm] = useState({
    name: task.name,
    description: task.description || '',
    assigned_to: task.assigned_to,
    priority: task.priority,
    estimated_duration: task.estimated_duration || 60,
  });

  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim()) return;
    
    await onAddComment(task.id, newComment);
    setNewComment('');
  }, [newComment, task.id, onAddComment]);

  const handleSaveEdit = useCallback(async () => {
    try {
      await onUpdateTask(task.id, editForm);
      onCancelEdit();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('Failed to update task:', error);
    }
  }, [task.id, editForm, onUpdateTask, onCancelEdit]);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'In Progress':
        return <Activity className="w-4 h-4 text-blue-600" />;
      case 'Blocked':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
      {/* Task Header */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            {getStatusIcon(task.status)}
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md"
                />
              ) : (
                <h5 className="text-sm font-medium text-slate-900 truncate">{task.name}</h5>
              )}
              <div className="flex items-center space-x-2 mt-1">
                <User className="w-3 h-3 text-slate-400" />
                {isEditing ? (
                  <select
                    value={editForm.assigned_to}
                    onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value })}
                    className="px-2 py-1 text-xs border border-slate-300 rounded-md"
                  >
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.name}>{member.name}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs text-slate-600">{task.assigned_to}</span>
                )}
                {task.estimated_duration && (
                  <>
                    <Clock className="w-3 h-3 text-slate-400 ml-2" />
                    <span className="text-xs text-slate-600">{task.estimated_duration}min</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <div className="flex items-center space-x-1">
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as any })}
                  className="px-2 py-1 text-xs border border-slate-300 rounded-md"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <button
                  onClick={handleSaveEdit}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={onCancelEdit}
                  className="px-2 py-1 text-xs bg-slate-600 text-white rounded-md hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTaskStatusColor(task.status)}`}>
                  {task.status}
                </span>
                <button
                  onClick={onStartEdit}
                  className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-1 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <button
                  onClick={onToggleExpansion}
                  className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                >
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Task Description */}
        {(task.description || isEditing) && (
          <div className="mb-2">
            {isEditing ? (
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md"
                rows={2}
                placeholder="Task description..."
              />
            ) : (
              <p className="text-xs text-slate-600 ml-6">{task.description}</p>
            )}
          </div>
        )}

        {/* Task Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 ml-6 mb-2">
            {task.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Task Actions */}
        {!isEditing && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex space-x-1">
              {task.status === 'Pending' && (
                <button
                  onClick={() => onStatusUpdate(task.id, 'In Progress')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center space-x-1"
                >
                  <Activity className="w-3 h-3" />
                  <span>Start</span>
                </button>
              )}
              {task.status === 'In Progress' && (
                <button
                  onClick={() => onStatusUpdate(task.id, 'Completed')}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Complete</span>
                </button>
              )}
              {task.status === 'Blocked' && (
                <button
                  onClick={() => onStatusUpdate(task.id, 'Pending')}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md text-xs font-medium"
                >
                  Unblock
                </button>
              )}
            </div>
            
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1 text-xs text-slate-600 hover:text-slate-900"
            >
              <MessageSquare className="w-3 h-3" />
              <span>{comments.length}</span>
            </button>
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && !isEditing && (
          <div className="pt-3 border-t border-slate-100 space-y-2 animate-fade-in">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-medium text-slate-700">Start Date:</span>
                <span className="text-slate-600 ml-1">{task.start_date || 'Not set'}</span>
              </div>
              <div>
                <span className="font-medium text-slate-700">Duration:</span>
                <span className="text-slate-600 ml-1">{task.duration_days || 1} day(s)</span>
              </div>
            </div>
            
            {task.notes && (
              <div>
                <span className="text-xs font-medium text-slate-700">Notes:</span>
                <p className="text-xs text-slate-600 mt-1">{task.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Comments Section */}
        {showComments && !isEditing && (
          <div className="pt-3 border-t border-slate-100 space-y-2 animate-slide-up">
            {comments.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {comments.map((comment, index) => (
                  <div key={index} className="bg-slate-50 rounded-md p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-700">{comment.author}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{comment.text}</p>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded-md"
              />
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

TaskCard.displayName = 'TaskCard';

export default VehicleTaskManager;