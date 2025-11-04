export interface OnboardingTask {
  id: string;
  name: string;
  category: 'daily' | 'weekly' | 'monthly';
  domain: 'kitchen' | 'maintenance' | 'care' | 'planning' | 'cleaning' | 'outdoor';
  estimatedMinutes: number;
  defaultPoints: number;
}

export type SwipeRating = 'love' | 'hate' | 'neutral' | 'untried';

export interface TaskRating {
  taskId: string;
  memberId: string;
  rating: number; // 1-5 scale (converted from swipe)
  swipeRating?: SwipeRating; // Original swipe action
}

export interface TaskAssignment {
  taskId: string;
  assignedTo: string;
  reason: 'preference' | 'balance' | 'rotation' | 'manual' | 'inferred';
  alternateAssignee?: string; // For rotation
}

export interface OnboardingMember {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role: 'manager' | 'member' | 'child';
}

export interface SamplerRound {
  roundNumber: number;
  tasks: OnboardingTask[]; // Mixed tasks from different domains
}

export interface OnboardingState {
  step: number;
  householdName: string;
  members: OnboardingMember[];
  tasks: OnboardingTask[];
  sampledTasks: OnboardingTask[]; // Tasks selected for rating
  ratings: TaskRating[];
  assignments: TaskAssignment[];
  currentRatingMember: number;
  currentRound: number;
  totalRounds: number;
  isComplete: boolean;
}

// Helper to convert swipe rating to numeric scale
export const swipeToNumeric = (swipe: SwipeRating): number => {
  switch (swipe) {
    case 'love': return 5;
    case 'neutral': return 3;
    case 'untried': return 3; // Neutral default for untried
    case 'hate': return 1;
    default: return 3;
  }
};

// Helper to get emoji for swipe rating
export const getSwipeEmoji = (swipe: SwipeRating): string => {
  switch (swipe) {
    case 'love': return '❤️';
    case 'neutral': return '👍';
    case 'untried': return '✨';
    case 'hate': return '👎';
    default: return '👍';
  }
};