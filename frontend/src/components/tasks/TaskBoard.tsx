import { useState } from 'react';
import { Task, TaskStatus, FamilyMember } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronRight, ChevronDown } from 'lucide-react';
import CelebrationAnimation from './CelebrationAnimation';
import EditableTaskCard from './EditableTaskCard';
import { startOfWeek, endOfWeek, addWeeks, isWithinInterval } from 'date-fns';

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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedTask, setCompletedTask] = useState<Task | null>(null);

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


  if (!household?.members || household.members.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
        <p className="text-gray-500">No family members found. Please complete onboarding first.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
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