export type SyncScope = 'week' | 'month' | 'custom';

export interface CustomDateRange {
  startDate: string;
  endDate: string;
}

export interface SyncReason {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export interface MemberCapacity {
  memberId: string;
  memberName: string;
  workloadLevel: number; // 1-5 scale (1=light, 5=heavy)
  energyLevel: number; // 1-5 scale (1=exhausted, 5=energized)
  emotionalCapacity: number; // 1-5 scale (1=overwhelmed, 5=great)
  reason?: string;
  notes?: string;
}

export interface SyncSession {
  id: string;
  timestamp: Date;
  reason: string;
  memberCapacities: MemberCapacity[];
  previousAssignments: Record<string, string[]>; // memberId -> taskIds
  newAssignments: Record<string, string[]>; // memberId -> taskIds
  fairnessScoreBefore: number;
  fairnessScoreAfter: number;
}

export interface SyncState {
  currentStep: number;
  scope: SyncScope;
  customDateRange?: CustomDateRange;
  reason: string;
  customReason?: string;
  memberCapacities: MemberCapacity[];
  currentCapacityMember: number;
  isComplete: boolean;
}

export const SYNC_REASONS: SyncReason[] = [
  {
    id: 'weekly-reset',
    label: 'Weekly Reset',
    description: 'Regular weekly recalibration for the upcoming week',
    icon: '📅'
  },
  {
    id: 'workload-change',
    label: 'Workload Change',
    description: 'Someone has increased or decreased work responsibilities',
    icon: '💼'
  },
  {
    id: 'health-issue',
    label: 'Health or Wellness',
    description: 'A family member is dealing with illness or recovery',
    icon: '🏥'
  },
  {
    id: 'life-event',
    label: 'Life Event',
    description: 'Major life changes like new baby, moving, etc.',
    icon: '🎉'
  },
  {
    id: 'schedule-shift',
    label: 'Schedule Change',
    description: 'Changes in work hours, school, or other commitments',
    icon: '⏰'
  },
  {
    id: 'feeling-overwhelmed',
    label: 'Feeling Overwhelmed',
    description: 'Someone needs immediate task redistribution',
    icon: '😰'
  },
  {
    id: 'custom',
    label: 'Other Reason',
    description: 'Custom reason for recalibration',
    icon: '✏️'
  }
];

export const CAPACITY_LABELS = {
  workload: {
    1: 'Very Light',
    2: 'Light',
    3: 'Moderate',
    4: 'Heavy',
    5: 'Very Heavy'
  },
  energy: {
    1: 'Exhausted',
    2: 'Low Energy',
    3: 'Moderate',
    4: 'Good Energy',
    5: 'Highly Energized'
  },
  emotional: {
    1: 'Overwhelmed',
    2: 'Stressed',
    3: 'Managing',
    4: 'Good',
    5: 'Excellent'
  }
};