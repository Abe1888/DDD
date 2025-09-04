'use client';

import React, { useState, memo, useMemo, useCallback } from 'react';
import { 
  Users, User, Award, Clock, Target, TrendingUp, Plus, Search, 
  Filter, RefreshCw, ChevronDown, ChevronUp, Star, Activity, AlertTriangle
} from 'lucide-react';
import { useTeamMembersOptimized, useTasksOptimized } from '@/lib/hooks/useOptimizedSWR';
import { TeamMember } from '@/lib/supabase/types';
import { supabase } from '@/lib/supabaseClient';

const OptimizedTeamManagement = memo(() => {
  const { data: teamMembers = [], isLoading: loading, error, mutate: refetch } = useTeamMembersOptimized();
  const { data: tasks = [] } = useTasksOptimized();
  
  // Local state
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'completion_rate' | 'quality_score'>('completion_rate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // New member form state
  const [newMember, setNewMember] = useState({
    id: '',
    name: '',
    role: '',
    specializations: [] as string[],
    completion_rate: 0,
    average_task_time: 0,
    quality_score: 0,
  });

  // Optimized team member operations
  const addTeamMember = useCallback(async (member: Omit<TeamMember, 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .insert([{
          ...member,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Failed to add team member:', error);
      throw error;
    }
  }, [refetch]);

  // Filter and sort team members with memoization
  const getFilteredAndSortedMembers = useMemo(() => {
    let filtered = teamMembers.filter(member => {
      const searchMatch = searchTerm === '' || 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.specializations.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return searchMatch;
    });

    // Sort members
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'completion_rate':
          aValue = a.completion_rate;
          bValue = b.completion_rate;
          break;
        case 'quality_score':
          aValue = a.quality_score;
          bValue = b.quality_score;
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
  }, [teamMembers, searchTerm, sortBy, sortOrder]);

  // Get member task statistics with memoization
  const getMemberStats = useCallback((memberName: string) => {
    const memberTasks = tasks.filter(task => task.assigned_to === memberName);
    const completed = memberTasks.filter(task => task.status === 'Completed').length;
    const inProgress = memberTasks.filter(task => task.status === 'In Progress').length;
    const pending = memberTasks.filter(task => task.status === 'Pending').length;
    
    return {
      total: memberTasks.length,
      completed,
      inProgress,
      pending,
      completionRate: memberTasks.length > 0 ? Math.round((completed / memberTasks.length) * 100) : 0
    };
  }, [tasks]);

  const handleAddMember = useCallback(async () => {
    if (!newMember.name.trim() || !newMember.role.trim()) return;

    try {
      await addTeamMember({
        ...newMember,
        id: `TM${String(teamMembers.length + 1).padStart(3, '0')}`,
      });

      // Reset form
      setNewMember({
        id: '',
        name: '',
        role: '',
        specializations: [],
        completion_rate: 0,
        average_task_time: 0,
        quality_score: 0,
      });
      setShowAddMember(false);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('Failed to add team member:', error);
    }
  }, [newMember, teamMembers, addTeamMember]);

  const getPerformanceColor = useCallback((score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-blue-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  const getPerformanceBadge = useCallback((score: number) => {
    if (score >= 95) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 85) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 75) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  }, []);

  // Show cached data immediately
  if (loading && teamMembers.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
        <div className="text-sm text-slate-600">Loading team data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Team Data</h3>
        <p className="text-sm text-slate-600 mb-4">{typeof error === 'string' ? error : 'Failed to load team data'}</p>
        <button
          onClick={() => refetch()}
          className="btn-primary"
        >
          Try Again
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
              <div className="w-8 h-8 bg-emerald-600 rounded-md flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Team Management</h2>
                <p className="text-sm text-slate-600">Monitor team performance and assignments</p>
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
                onClick={() => setShowAddMember(!showAddMember)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {/* Team Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-md border border-blue-200">
              <Users className="w-5 h-5 text-blue-600 mx-auto mb-2" />
              <div className="text-xl font-semibold text-blue-800">{teamMembers.length}</div>
              <div className="text-xs text-blue-600">Team Members</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-md border border-green-200">
              <Award className="w-5 h-5 text-green-600 mx-auto mb-2" />
              <div className="text-xl font-semibold text-green-800">
                {teamMembers.length > 0 ? Math.round(teamMembers.reduce((sum, m) => sum + m.completion_rate, 0) / teamMembers.length) : 0}%
              </div>
              <div className="text-xs text-green-600">Avg Completion</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-md border border-purple-200">
              <Star className="w-5 h-5 text-purple-600 mx-auto mb-2" />
              <div className="text-xl font-semibold text-purple-800">
                {teamMembers.length > 0 ? Math.round(teamMembers.reduce((sum, m) => sum + m.quality_score, 0) / teamMembers.length) : 0}%
              </div>
              <div className="text-xs text-purple-600">Avg Quality</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-md border border-orange-200">
              <Clock className="w-5 h-5 text-orange-600 mx-auto mb-2" />
              <div className="text-xl font-semibold text-orange-800">
                {teamMembers.length > 0 ? Math.round(teamMembers.reduce((sum, m) => sum + m.average_task_time, 0) / teamMembers.length) : 0}
              </div>
              <div className="text-xs text-orange-600">Avg Time (min)</div>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Filters & Search</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search team members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-md"
                />
              </div>

              {/* Sort Options */}
              <div className="flex space-x-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-l-md"
                >
                  <option value="name">Name</option>
                  <option value="completion_rate">Completion Rate</option>
                  <option value="quality_score">Quality Score</option>
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

      {/* Add Member Form */}
      {showAddMember && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 animate-slide-up">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Add Team Member</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                placeholder="Enter member name..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <input
                type="text"
                value={newMember.role}
                onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                placeholder="Enter role..."
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowAddMember(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleAddMember}
              disabled={!newMember.name.trim() || !newMember.role.trim()}
              className="btn-primary"
            >
              Add Member
            </button>
          </div>
        </div>
      )}

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {getFilteredAndSortedMembers.map((member) => {
          const stats = getMemberStats(member.name);
          const isSelected = selectedMember === member.id;
          
          return (
            <div
              key={member.id}
              className={`bg-white border border-slate-200 rounded-lg overflow-hidden transition-all duration-200 ${
                isSelected ? 'ring-2 ring-emerald-500 shadow-lg' : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedMember(isSelected ? null : member.id)}
            >
              {/* Member Header */}
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-emerald-600" />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-slate-900">{member.name}</h3>
                    <p className="text-sm text-slate-600">{member.role}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Activity className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-600">{stats.total} tasks assigned</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className={`text-lg font-semibold ${getPerformanceColor(member.completion_rate)}`}>
                      {member.completion_rate}%
                    </div>
                    <div className="text-xs text-slate-600">Completion</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-lg font-semibold ${getPerformanceColor(member.quality_score)}`}>
                      {member.quality_score}%
                    </div>
                    <div className="text-xs text-slate-600">Quality</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-semibold text-slate-800">
                      {member.average_task_time}
                    </div>
                    <div className="text-xs text-slate-600">Avg Time</div>
                  </div>
                </div>

                {/* Performance Badge */}
                <div className="flex justify-center mb-4">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${
                    getPerformanceBadge(Math.round((member.completion_rate + member.quality_score) / 2))
                  }`}>
                    {Math.round((member.completion_rate + member.quality_score) / 2)}% Overall Performance
                  </span>
                </div>

                {/* Specializations */}
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-slate-700 mb-2">Specializations</h4>
                  <div className="flex flex-wrap gap-1">
                    {member.specializations.map((spec, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-md"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Current Tasks */}
                <div>
                  <h4 className="text-xs font-medium text-slate-700 mb-2">Current Workload</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-green-50 rounded-md p-2">
                      <div className="text-sm font-semibold text-green-800">{stats.completed}</div>
                      <div className="text-xs text-green-600">Done</div>
                    </div>
                    <div className="bg-blue-50 rounded-md p-2">
                      <div className="text-sm font-semibold text-blue-800">{stats.inProgress}</div>
                      <div className="text-xs text-blue-600">Active</div>
                    </div>
                    <div className="bg-slate-50 rounded-md p-2">
                      <div className="text-sm font-semibold text-slate-800">{stats.pending}</div>
                      <div className="text-xs text-slate-600">Pending</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isSelected && (
                <div className="p-6 border-t border-slate-200 bg-slate-50 animate-fade-in">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Performance Trends</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-600">Task Completion Rate</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${member.completion_rate}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-slate-700">{member.completion_rate}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-600">Quality Score</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${member.quality_score}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-slate-700">{member.quality_score}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Recent Activity</h4>
                      <div className="text-xs text-slate-600">
                        Last updated: {new Date(member.created_at || '').toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {getFilteredAndSortedMembers.length === 0 && !loading && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Team Members Found</h3>
          <p className="text-sm text-slate-600 mb-4">
            {searchTerm 
              ? 'Try adjusting your search to see more team members.'
              : 'No team members have been added yet.'}
          </p>
          <button
            onClick={() => setShowAddMember(true)}
            className="btn-primary"
          >
            Add First Member
          </button>
        </div>
      )}
    </div>
  );
});

OptimizedTeamManagement.displayName = 'OptimizedTeamManagement';

export default OptimizedTeamManagement;