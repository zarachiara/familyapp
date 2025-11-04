/**
 * Recurring Task Management
 * Handles automatic reset/creation of recurring tasks
 */

import { Task, RecurrencePattern } from '@/types';
import { 
  addDays, 
  addWeeks, 
  addMonths, 
  startOfDay, 
  isAfter,
  isSameDay,
  parseISO 
} from 'date-fns';

/**
 * Check if a recurring task should be reset based on its completion date and recurrence pattern
 */
export function shouldResetRecurringTask(task: Task): boolean {
  // Only check completed recurring tasks
  if (task.status !== 'done' || task.recurrence === 'none' || !task.completedAt) {
    return false;
  }

  const completedDate = parseISO(task.completedAt);
  const now = new Date();
  const today = startOfDay(now);
  const completedDay = startOfDay(completedDate);

  switch (task.recurrence) {
    case 'daily':
      // Reset if completed yesterday or earlier
      return !isSameDay(completedDay, today);

    case 'weekly':
      // Reset if completed more than 7 days ago
      const nextWeeklyReset = addWeeks(completedDay, 1);
      return isAfter(today, startOfDay(nextWeeklyReset)) || isSameDay(today, startOfDay(nextWeeklyReset));

    case 'monthly':
      // Reset if completed more than 30 days ago
      const nextMonthlyReset = addMonths(completedDay, 1);
      return isAfter(today, startOfDay(nextMonthlyReset)) || isSameDay(today, startOfDay(nextMonthlyReset));

    case 'custom':
      // For custom recurrence, would need additional logic
      // For now, treat as weekly
      const nextCustomReset = addWeeks(completedDay, 1);
      return isAfter(today, startOfDay(nextCustomReset)) || isSameDay(today, startOfDay(nextCustomReset));

    default:
      return false;
  }
}

/**
 * Calculate the next due date for a recurring task
 */
export function getNextDueDate(task: Task): string {
  const currentDueDate = parseISO(task.dueDate);

  switch (task.recurrence) {
    case 'daily':
      return addDays(currentDueDate, 1).toISOString();

    case 'weekly':
      return addWeeks(currentDueDate, 1).toISOString();

    case 'monthly':
      return addMonths(currentDueDate, 1).toISOString();

    case 'custom':
      // Default to weekly for custom
      return addWeeks(currentDueDate, 1).toISOString();

    default:
      return task.dueDate;
  }
}

/**
 * Reset a recurring task (mark as todo and update due date)
 */
export function resetRecurringTask(task: Task): Partial<Task> {
  return {
    status: 'todo',
    completedAt: undefined,
    dueDate: getNextDueDate(task),
  };
}

/**
 * Process all tasks and return updates for tasks that need to be reset
 */
export function processRecurringTasks(tasks: Task[]): Array<{ taskId: string; updates: Partial<Task> }> {
  const updates: Array<{ taskId: string; updates: Partial<Task> }> = [];

  tasks.forEach(task => {
    if (shouldResetRecurringTask(task)) {
      updates.push({
        taskId: task.id,
        updates: resetRecurringTask(task),
      });
    }
  });

  return updates;
}

/**
 * Get a human-readable description of when a task will recur
 */
export function getRecurrenceDescription(recurrence: RecurrencePattern): string {
  switch (recurrence) {
    case 'daily':
      return 'Resets daily';
    case 'weekly':
      return 'Resets weekly';
    case 'monthly':
      return 'Resets monthly';
    case 'custom':
      return 'Custom recurrence';
    case 'none':
    default:
      return 'One-time task';
  }
}