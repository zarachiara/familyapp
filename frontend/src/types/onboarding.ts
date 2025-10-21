export interface OnboardingTask {
  id: string;
  name: string;
  category: 'daily' | 'weekly' | 'monthly';
  estimatedMinutes: number;
  defaultPoints: number;
}

export interface TaskRating {
  taskId: string;
  memberId: string;
  rating: number; // 1-5 scale
}

export interface TaskAssignment {
  taskId: string;
  assignedTo: string;
  reason: 'preference' | 'balance' | 'rotation' | 'manual';
  alternateAssignee?: string; // For rotation
}

export interface OnboardingMember {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role: 'manager' | 'member' | 'child';
}

export interface OnboardingState {
  step: number;
  householdName: string;
  members: OnboardingMember[];
  tasks: OnboardingTask[];
  ratings: TaskRating[];
  assignments: TaskAssignment[];
  currentRatingMember: number;
  isComplete: boolean;
}