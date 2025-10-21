import { OnboardingTask, TaskRating, TaskAssignment, OnboardingMember } from '@/types/onboarding';

interface MemberWorkload {
  memberId: string;
  totalMinutes: number;
  totalPoints: number;
  taskCount: number;
}

export const calculateOptimalAssignments = (
  tasks: OnboardingTask[],
  ratings: TaskRating[],
  members: OnboardingMember[]
): TaskAssignment[] => {
  const assignments: TaskAssignment[] = [];
  const memberWorkloads: Map<string, MemberWorkload> = new Map();

  // Initialize workloads
  members.forEach(member => {
    memberWorkloads.set(member.id, {
      memberId: member.id,
      totalMinutes: 0,
      totalPoints: 0,
      taskCount: 0,
    });
  });

  // Sort tasks by total preference variance (assign high-variance tasks first)
  const tasksWithVariance = tasks.map(task => {
    const taskRatings = ratings.filter(r => r.taskId === task.id);
    const ratingValues = taskRatings.map(r => r.rating);
    const avg = ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length;
    const variance = ratingValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / ratingValues.length;
    
    return { task, variance };
  }).sort((a, b) => b.variance - a.variance);

  // Assign tasks based on preferences and workload balance
  tasksWithVariance.forEach(({ task }) => {
    const taskRatings = ratings.filter(r => r.taskId === task.id);
    
    // Find member(s) with highest rating
    const maxRating = Math.max(...taskRatings.map(r => r.rating));
    const topRaters = taskRatings.filter(r => r.rating === maxRating);

    let assignedTo: string;
    let reason: 'preference' | 'balance' | 'rotation' = 'preference';
    let alternateAssignee: string | undefined;

    if (topRaters.length === 1) {
      // Clear preference winner
      assignedTo = topRaters[0].memberId;
    } else {
      // Tie - assign to person with lower current workload
      const workloads = topRaters.map(r => ({
        memberId: r.memberId,
        workload: memberWorkloads.get(r.memberId)!,
      }));
      
      workloads.sort((a, b) => a.workload.totalMinutes - b.workload.totalMinutes);
      assignedTo = workloads[0].memberId;
      alternateAssignee = workloads[1]?.memberId;
      reason = workloads[0].workload.totalMinutes < workloads[1]?.workload.totalMinutes 
        ? 'balance' 
        : 'rotation';
    }

    // Update workload
    const workload = memberWorkloads.get(assignedTo)!;
    workload.totalMinutes += task.estimatedMinutes;
    workload.totalPoints += task.defaultPoints;
    workload.taskCount += 1;

    assignments.push({
      taskId: task.id,
      assignedTo,
      reason,
      alternateAssignee,
    });
  });

  return assignments;
};

export const getWorkloadBalance = (
  assignments: TaskAssignment[],
  tasks: OnboardingTask[],
  members: OnboardingMember[]
): MemberWorkload[] => {
  const workloads: Map<string, MemberWorkload> = new Map();

  members.forEach(member => {
    workloads.set(member.id, {
      memberId: member.id,
      totalMinutes: 0,
      totalPoints: 0,
      taskCount: 0,
    });
  });

  assignments.forEach(assignment => {
    const task = tasks.find(t => t.id === assignment.taskId);
    if (task) {
      const workload = workloads.get(assignment.assignedTo)!;
      workload.totalMinutes += task.estimatedMinutes;
      workload.totalPoints += task.defaultPoints;
      workload.taskCount += 1;
    }
  });

  return Array.from(workloads.values());
};

export const calculateFairnessScore = (workloads: MemberWorkload[]): number => {
  if (workloads.length === 0) return 100;

  const avgMinutes = workloads.reduce((sum, w) => sum + w.totalMinutes, 0) / workloads.length;
  const variance = workloads.reduce((sum, w) => sum + Math.pow(w.totalMinutes - avgMinutes, 2), 0) / workloads.length;
  const stdDev = Math.sqrt(variance);
  
  // Convert to 0-100 score (lower variance = higher score)
  const maxStdDev = avgMinutes * 0.5; // 50% deviation is worst case
  const score = Math.max(0, 100 - (stdDev / maxStdDev) * 100);
  
  return Math.round(score);
};