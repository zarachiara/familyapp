export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type RecurrencePattern = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
export type FamilyRole = 'manager' | 'member' | 'child';

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  dueDate: string;
  status: TaskStatus;
  recurrence: RecurrencePattern;
  room: string;
  points: number;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
  estimatedMinutes: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: FamilyRole;
  avatar: string;
  points: number;
  tasksCompleted: number;
  color: string;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  tasks: Omit<Task, 'id' | 'createdAt' | 'assigneeId' | 'status'>[];
  isCustom: boolean;
  createdBy?: string;
}

export interface AppreciationNote {
  id: string;
  fromId: string;
  toId: string;
  message: string;
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  threshold: number;
  earnedBy: string[];
}

export interface Household {
  id: string;
  name: string;
  members: FamilyMember[];
  managerId: string;
}