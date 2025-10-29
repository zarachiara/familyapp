import { Task } from '@/types';
import { SyncScope, CustomDateRange } from '@/types/sync';

/**
 * Get the date range for a given scope
 */
export function getScopeDateRange(
  scope: SyncScope,
  customRange?: CustomDateRange
): { start: Date; end: Date } {
  const now = new Date();
  
  if (scope === 'custom' && customRange) {
    const start = new Date(customRange.startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(customRange.endDate);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  } else if (scope === 'week') {
    // This week: from today to 7 days from now
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(now);
    end.setDate(end.getDate() + 7);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  } else {
    // This month: from first day to last day of current month
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }
}

/**
 * Filter tasks by scope - only include tasks within the time window
 * and exclude tasks that have already been started (in-progress)
 */
export function filterTasksByScope(
  tasks: Task[],
  scope: SyncScope,
  customRange?: CustomDateRange
): Task[] {
  const { start, end } = getScopeDateRange(scope, customRange);
  
  return tasks.filter(task => {
    // Exclude tasks that are already in progress or done
    if (task.status === 'in-progress' || task.status === 'done') {
      return false;
    }
    
    // Only include tasks with due dates within the scope
    const dueDate = new Date(task.dueDate);
    return dueDate >= start && dueDate <= end;
  });
}

/**
 * Get a human-readable description of the scope
 */
export function getScopeDescription(scope: SyncScope, customRange?: CustomDateRange): string {
  const { start, end } = getScopeDateRange(scope, customRange);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  if (scope === 'custom') {
    return `Custom Range (${formatDate(start)} - ${formatDate(end)})`;
  } else if (scope === 'week') {
    return `This Week (${formatDate(start)} - ${formatDate(end)})`;
  } else {
    return `This Month (${formatDate(start)} - ${formatDate(end)})`;
  }
}