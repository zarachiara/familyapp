import { useState, useEffect } from 'react';
import { Task, TaskStatus, FamilyMember } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronRight, ChevronDown, TrendingUp, Calendar, Target, Scale } from 'lucide-react';
import CelebrationAnimation from './CelebrationAnimation';
import EditableTaskCard from './EditableTaskCard';
import { startOfWeek, endOfWeek, addWeeks, isWithinInterval, differenceInDays, subWeeks, format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface WeeklyCommitment {
  week_key: string; // Format: "YYYY-WW" (e.g., "2024-44")
  task_count: number;
  committed_at: string;
  fairness_score?: number; // Fairness score at time of commitment
}

export type TaskFilter =
  | 'incomplete'
  | 'completed'
  | 'due-this-week'
  | 'due-next-week'
  | { type: 'member'; memberId: string };

interface TaskBoardProps {
  activeFilters?: TaskFilter[];
}

const TaskBoard = ({ activeFilters = [] }: TaskBoardProps) => {
  const { tasks, household, updateTask } = useApp();
  const { token } = useAuth();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedTask, setCompletedTask] = useState<Task | null>(null);
  const [weeklyCommitment, setWeeklyCommitment] = useState<WeeklyCommitment | null>(null);
  const [isLoadingCommitment, setIsLoadingCommitment] = useState(false);

  // Initialize expanded state for all members
  const initializeExpandedState = () => {
    if (!household?.members) return {};
    const state: Record<string, boolean> = {};
    household.members.forEach(member => {
      state[member.id] = true;
    });
    return state;
  };

  // Set initial expanded state
  useState(() => {
    setExpandedSections(initializeExpandedState());
  });

  // Get current week key in format "YYYY-WW"
  const getCurrentWeekKey = (): string => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    return format(weekStart, 'yyyy-II'); // ISO week format
  };

  // Load commitment from backend on mount
  useEffect(() => {
    const loadCommitment = async () => {
      if (!token) return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/household/commitment`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const commitment = data.commitment as WeeklyCommitment | null;
          
          if (commitment) {
            const currentWeekKey = getCurrentWeekKey();
            
            // Only load if it's for the current week
            if (commitment.week_key === currentWeekKey) {
              setWeeklyCommitment(commitment);
              // Also save to localStorage for offline access
              localStorage.setItem('weeklyCommitment', JSON.stringify(commitment));
            } else {
              // Clear old commitment if week has changed
              setWeeklyCommitment(null);
              localStorage.removeItem('weeklyCommitment');
            }
          }
        }
      } catch (error) {
        console.error('Error loading weekly commitment:', error);
        
        // Fallback to localStorage if backend fails
        const stored = localStorage.getItem('weeklyCommitment');
        if (stored) {
          try {
            const commitment: WeeklyCommitment = JSON.parse(stored);
            const currentWeekKey = getCurrentWeekKey();
            
            if (commitment.week_key === currentWeekKey) {
              setWeeklyCommitment(commitment);
            } else {
              localStorage.removeItem('weeklyCommitment');
              setWeeklyCommitment(null);
            }
          } catch (parseError) {
            console.error('Error parsing stored commitment:', parseError);
            localStorage.removeItem('weeklyCommitment');
          }
        }
      }
    };

    loadCommitment();
  }, [token]);

  const toggleSection = (memberId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
  };

  const handleTaskCheck = (task: Task, checked: boolean) => {
    const newStatus: TaskStatus = checked ? 'done' : 'todo';
    
    // Check if it's a complex task (high points or long duration)
    const isComplexTask = task.points >= 30 || task.estimatedMinutes >= 60;
    
    if (checked && isComplexTask) {
      setCompletedTask(task);
      setShowCelebration(true);
    }

    updateTask(task.id, {
      status: newStatus,
      ...(checked && { completedAt: new Date().toISOString() }),
    });
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    updateTask(taskId, updates);
  };

  const applyFilters = (tasksToFilter: Task[]): Task[] => {
    if (activeFilters.length === 0) return tasksToFilter;

    return tasksToFilter.filter(task => {
      // Check each active filter
      for (const filter of activeFilters) {
        if (typeof filter === 'string') {
          // Status filters
          if (filter === 'incomplete' && task.status === 'done') return false;
          if (filter === 'completed' && task.status !== 'done') return false;

          // Date filters
          const taskDate = new Date(task.dueDate);
          const now = new Date();

          if (filter === 'due-this-week') {
            const weekStart = startOfWeek(now, { weekStartsOn: 0 });
            const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
            if (!isWithinInterval(taskDate, { start: weekStart, end: weekEnd })) return false;
          }

          if (filter === 'due-next-week') {
            const nextWeekStart = startOfWeek(addWeeks(now, 1), { weekStartsOn: 0 });
            const nextWeekEnd = endOfWeek(addWeeks(now, 1), { weekStartsOn: 0 });
            if (!isWithinInterval(taskDate, { start: nextWeekStart, end: nextWeekEnd })) return false;
          }
        } else {
          // Member filter
          if (filter.type === 'member' && task.assigneeId !== filter.memberId) return false;
        }
      }

      return true;
    });
  };

  const getTasksByMember = (memberId: string) => {
    const memberTasks = tasks.filter(task => task.assigneeId === memberId);
    const filteredTasks = applyFilters(memberTasks);
    
    return filteredTasks.sort((a, b) => {
      // Sort by status priority (todo > in-progress > done), then by due date
      const statusOrder = { 'todo': 0, 'in-progress': 1, 'done': 2 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  };

  const getTaskCountsByStatus = (memberId: string) => {
    const memberTasks = tasks.filter(task => task.assigneeId === memberId);
    return {
      todo: memberTasks.filter(t => t.status === 'todo').length,
      inProgress: memberTasks.filter(t => t.status === 'in-progress').length,
      done: memberTasks.filter(t => t.status === 'done').length,
      total: memberTasks.length,
    };
  };

  // Calculate key metrics
  const calculateMetrics = () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
    
    // Tasks this week
    const thisWeekTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return isWithinInterval(taskDate, { start: weekStart, end: weekEnd });
    });
    
    // Completed tasks this week
    const completedThisWeek = thisWeekTasks.filter(t => t.status === 'done').length;
    
    // Days left in week
    const daysLeft = differenceInDays(weekEnd, now);
    
    // Calculate velocity (average points completed per week over past 6 weeks)
    const sixWeeksAgo = subWeeks(now, 6);
    const pastTasks = tasks.filter(task => {
      if (!task.completedAt) return false;
      const completedDate = new Date(task.completedAt);
      return completedDate >= sixWeeksAgo && completedDate <= now;
    });
    const totalPointsCompleted = pastTasks.reduce((sum, task) => sum + task.points, 0);
    const velocity = Math.round(totalPointsCompleted / 6);
    
    // Total points for all tasks this week
    const totalPoints = thisWeekTasks.reduce((sum, task) => sum + task.points, 0);
    
    // Committed points (locked when commitment was made)
    const committedPoints = weeklyCommitment
      ? thisWeekTasks
          .slice(0, weeklyCommitment.task_count)
          .reduce((sum, task) => sum + task.points, 0)
      : totalPoints;
    
    // Forecasted points (same as committed points when commitment exists)
    const forecastedPoints = committedPoints;
    
    // Fairness calculation
    let fairnessScore: number;
    
    if (weeklyCommitment?.fairness_score !== undefined) {
      // Use committed fairness score if it exists
      fairnessScore = weeklyCommitment.fairness_score;
    } else {
      // Calculate current fairness (standard deviation of points per member)
      const memberPoints = household?.members.map(m => {
        const memberTasks = thisWeekTasks.filter(t => t.assigneeId === m.id && t.status === 'done');
        return memberTasks.reduce((sum, t) => sum + t.points, 0);
      }) || [];
      
      const avgPoints = memberPoints.reduce((a, b) => a + b, 0) / (memberPoints.length || 1);
      const variance = memberPoints.reduce((sum, p) => sum + Math.pow(p - avgPoints, 2), 0) / (memberPoints.length || 1);
      const stdDev = Math.sqrt(variance);
      fairnessScore = Math.max(0, 100 - (stdDev / avgPoints) * 100);
    }
    
    return {
      completedThisWeek,
      totalThisWeek: thisWeekTasks.length,
      daysLeft,
      velocity,
      totalPoints,
      committedPoints,
      forecastedPoints,
      fairnessScore: isNaN(fairnessScore) ? 100 : Math.round(fairnessScore),
    };
  };

  const metrics = calculateMetrics();

  // Get unassigned tasks
  const getUnassignedTasks = () => {
    const unassignedTasks = tasks.filter(task => !task.assigneeId || task.assigneeId === '');
    return applyFilters(unassignedTasks).sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  };

  const handleCommit = async () => {
    if (!token || isLoadingCommitment) return;
    
    setIsLoadingCommitment(true);
    try {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
      
      const thisWeekTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return isWithinInterval(taskDate, { start: weekStart, end: weekEnd });
      });
      
      // Calculate fairness score at commitment time
      const memberPoints = household?.members.map(m => {
        const memberTasks = thisWeekTasks.filter(t => t.assigneeId === m.id && t.status === 'done');
        return memberTasks.reduce((sum, t) => sum + t.points, 0);
      }) || [];
      
      const avgPoints = memberPoints.reduce((a, b) => a + b, 0) / (memberPoints.length || 1);
      const variance = memberPoints.reduce((sum, p) => sum + Math.pow(p - avgPoints, 2), 0) / (memberPoints.length || 1);
      const stdDev = Math.sqrt(variance);
      const calculatedFairness = Math.max(0, 100 - (stdDev / avgPoints) * 100);
      const fairnessAtCommit = isNaN(calculatedFairness) ? 100 : Math.round(calculatedFairness);
      
      const commitment: WeeklyCommitment = {
        week_key: getCurrentWeekKey(),
        task_count: thisWeekTasks.length,
        committed_at: new Date().toISOString(),
        fairness_score: fairnessAtCommit,
      };
      
      const response = await fetch(`${API_BASE_URL}/api/v1/household/commitment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commitment),
      });
      
      if (response.ok) {
        setWeeklyCommitment(commitment);
        // Save to localStorage for offline access
        localStorage.setItem('weeklyCommitment', JSON.stringify(commitment));
      } else {
        console.error('Failed to save commitment');
      }
    } catch (error) {
      console.error('Error saving weekly commitment:', error);
    } finally {
      setIsLoadingCommitment(false);
    }
  };

  if (!household?.members || household.members.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
        <p className="text-gray-500">No family members found. Please complete onboarding first.</p>
      </div>
    );
  }

  return (
    <>
      {/* Key Metrics Section */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {/* Completed Tasks */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {metrics.completedThisWeek}/{weeklyCommitment ? weeklyCommitment.task_count : metrics.totalThisWeek}
              </div>
              <div className="text-xs text-gray-500">
                {weeklyCommitment ? 'Committed' : 'Completed'}
              </div>
            </div>

            {/* Days Left */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{metrics.daysLeft}</div>
              <div className="text-xs text-gray-500">Days Left</div>
            </div>

            {/* Velocity */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{metrics.velocity}</div>
              <div className="text-xs text-gray-500">Pts/Week</div>
            </div>

            {/* Forecast Points */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{metrics.forecastedPoints}</div>
              <div className="text-xs text-gray-500">
                {weeklyCommitment ? 'Goal Pts' : 'Total Pts'}
              </div>
            </div>

            {/* Total Points */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{metrics.totalPoints}</div>
              <div className="text-xs text-gray-500">Total Pts</div>
            </div>

            {/* Fairness */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Scale className="w-5 h-5 text-teal-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{metrics.fairnessScore}%</div>
              <div className="text-xs text-gray-500">Fairness</div>
            </div>
          </div>

          {/* Commitment Button */}
          {!weeklyCommitment && (
            <div className="mt-4 pt-4 border-t text-center">
              <Button
                onClick={handleCommit}
                variant="outline"
                size="sm"
                disabled={isLoadingCommitment}
              >
                <Target className="w-4 h-4 mr-2" />
                {isLoadingCommitment ? 'Committing...' : 'Commit to This Week\'s Tasks'}
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Lock in your weekly commitment. New tasks added after will be stretch goals.
              </p>
            </div>
          )}

          {weeklyCommitment && (
            <div className="mt-4 pt-4 border-t text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
                <Target className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Committed to {weeklyCommitment.task_count} tasks this week
                </span>
              </div>
              {metrics.totalThisWeek > weeklyCommitment.task_count && (
                <p className="text-xs text-orange-600 mt-2">
                  ⚠️ {metrics.totalThisWeek - weeklyCommitment.task_count} stretch goal(s) added after commitment
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Unassigned Tasks Section */}
        {getUnassignedTasks().length > 0 && (
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection('unassigned')}
              className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedSections['unassigned'] !== false ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
                
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-amber-200">
                    📋
                  </AvatarFallback>
                </Avatar>
                
                <h2 className="text-sm font-semibold text-gray-900">
                  Unassigned Tasks
                </h2>
                
                <Badge variant="secondary" className="ml-2">
                  {getUnassignedTasks().length}
                </Badge>
              </div>
            </button>

            {expandedSections['unassigned'] !== false && (
              <div>
                {getUnassignedTasks().map(task => (
                  <EditableTaskCard
                    key={task.id}
                    task={task}
                    members={household.members}
                    onUpdate={handleTaskUpdate}
                    onCheck={handleTaskCheck}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {household.members.map(member => {
          const memberTasks = getTasksByMember(member.id);
          const taskCounts = getTaskCountsByStatus(member.id);
          const isExpanded = expandedSections[member.id] !== false; // Default to expanded

          return (
            <div key={member.id} className="border-b border-gray-200 last:border-b-0">
              {/* Member Header */}
              <button
                onClick={() => toggleSection(member.id)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  
                  {/* Member Avatar */}
                  <Avatar className="h-8 w-8">
                    <AvatarFallback style={{ backgroundColor: member.color }}>
                      {member.avatar}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Member Name */}
                  <h2 className="text-sm font-semibold text-gray-900">
                    {member.name}
                  </h2>
                  
                  {/* Task Count Badge */}
                  <Badge variant="secondary" className="ml-2">
                    {taskCounts.total}
                  </Badge>
                  
                  {/* Status Breakdown */}
                  {taskCounts.total > 0 && (
                    <div className="flex items-center gap-2 ml-2 text-xs text-gray-500">
                      {taskCounts.todo > 0 && (
                        <span className="flex items-center gap-1">
                          <span>⭕</span>
                          <span>{taskCounts.todo}</span>
                        </span>
                      )}
                      {taskCounts.inProgress > 0 && (
                        <span className="flex items-center gap-1">
                          <span>🔄</span>
                          <span>{taskCounts.inProgress}</span>
                        </span>
                      )}
                      {taskCounts.done > 0 && (
                        <span className="flex items-center gap-1">
                          <span>✅</span>
                          <span>{taskCounts.done}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Total Points */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {member.points} pts
                  </Badge>
                </div>
              </button>

              {/* Member's Tasks */}
              {isExpanded && (
                <div>
                  {memberTasks.length > 0 ? (
                    memberTasks.map(task => (
                      <EditableTaskCard
                        key={task.id}
                        task={task}
                        members={household.members}
                        onUpdate={handleTaskUpdate}
                        onCheck={handleTaskCheck}
                      />
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-400">
                      <p className="text-sm">No tasks assigned to {member.name}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Celebration Animation */}
      <CelebrationAnimation
        show={showCelebration}
        onComplete={() => {
          setShowCelebration(false);
          setCompletedTask(null);
        }}
      />
    </>
  );
};

export default TaskBoard;