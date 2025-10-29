import { MemberCapacity } from '../types/sync';
import { Task, FamilyMember } from '../types';

export interface RecalibrationResult {
  newAssignments: Record<string, string[]>;
  fairnessScore: number;
  changes: {
    memberId: string;
    memberName: string;
    tasksAdded: Task[];
    tasksRemoved: Task[];
    loadChange: number;
  }[];
}

/**
 * Calculate a member's effective capacity based on workload, energy, and emotional capacity
 */
export function calculateEffectiveCapacity(capacity: MemberCapacity): number {
  const workloadWeight = 0.4;
  const energyWeight = 0.35;
  const emotionalWeight = 0.25;
  
  // CORRECT LOGIC:
  // Higher workload (5/5) = person is BUSY = LOW capacity to take MORE = should get LESS work
  // Lower workload (1/5) = person is FREE = HIGH capacity to take MORE = should get MORE work
  // So we INVERT workload: (6 - workloadLevel) / 5
  
  // Higher energy (5/5) = person is ENERGIZED = HIGH capacity = should get MORE work
  // Lower energy (1/5) = person is TIRED = LOW capacity = should get LESS work
  // So we use energy directly: energyLevel / 5
  
  // Higher emotional (5/5) = person is STABLE = HIGH capacity = should get MORE work
  // Lower emotional (1/5) = person is STRESSED = LOW capacity = should get LESS work
  // So we use emotional directly: emotionalCapacity / 5
  
  const workloadScore = (6 - capacity.workloadLevel) / 5; // Inverted: high workload = low score
  const energyScore = capacity.energyLevel / 5; // Direct: high energy = high score
  const emotionalScore = capacity.emotionalCapacity / 5; // Direct: high emotional = high score
  
  const effectiveCapacity = (
    workloadScore * workloadWeight +
    energyScore * energyWeight +
    emotionalScore * emotionalWeight
  );
  
  // Debug: Log capacity calculation
  console.log(`Capacity for member:`, {
    workloadLevel: capacity.workloadLevel,
    energyLevel: capacity.energyLevel,
    emotionalCapacity: capacity.emotionalCapacity,
    workloadScore,
    energyScore,
    emotionalScore,
    effectiveCapacity,
    memberName: capacity.memberName,
    interpretation: effectiveCapacity > 0.7 ? 'HIGH capacity - should get MORE work' :
                    effectiveCapacity > 0.4 ? 'MODERATE capacity' :
                    'LOW capacity - should get LESS work'
  });
  
  return effectiveCapacity;
}

/**
 * Recalibrate task assignments based on member capacities
 */
export function recalibrateTaskAssignments(
  tasks: Task[],
  members: FamilyMember[],
  capacities: MemberCapacity[],
  currentAssignments: Record<string, string[]>
): RecalibrationResult {
  // Create capacity map
  const capacityMap = new Map<string, number>();
  capacities.forEach(cap => {
    capacityMap.set(cap.memberId, calculateEffectiveCapacity(cap));
  });

  // Calculate current loads in minutes for each member
  const currentMinuteLoads = new Map<string, number>();
  members.forEach(member => {
    const taskIds = currentAssignments[member.id] || [];
    const totalMinutes = taskIds.reduce((sum, id) => {
      const task = tasks.find(t => t.id === id);
      return sum + (task?.estimatedMinutes || 0);
    }, 0);
    currentMinuteLoads.set(member.id, totalMinutes);
  });

  // Calculate total minutes across all tasks
  const totalMinutes = tasks.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0);
  const totalCapacity = Array.from(capacityMap.values()).reduce((sum, cap) => sum + cap, 0);

  // Calculate target minutes for each member based on their capacity
  // Higher capacity = should handle MORE minutes
  // Lower capacity = should handle LESS minutes
  const targetMinutes = new Map<string, number>();
  members.forEach(member => {
    const capacity = capacityMap.get(member.id) || 0.5;
    
    // Direct proportion: higher capacity = higher target
    const target = (capacity / totalCapacity) * totalMinutes;
    targetMinutes.set(member.id, target);
    
    console.log(`Target for ${member.name}:`, {
      capacity: `${Math.round(capacity * 100)}%`,
      currentMinutes: currentMinuteLoads.get(member.id),
      targetMinutes: Math.round(target),
      difference: Math.round(target - (currentMinuteLoads.get(member.id) || 0)),
      interpretation: capacity > 0.6 ? 'HIGH capacity - should get MORE' : capacity < 0.4 ? 'LOW capacity - should get LESS' : 'MODERATE capacity'
    });
  });

  // Start with current assignments
  const newAssignments: Record<string, string[]> = {};
  members.forEach(member => {
    newAssignments[member.id] = [...(currentAssignments[member.id] || [])];
  });

  // Iteratively move tasks from overloaded (low capacity) to underloaded (high capacity) members
  let improved = true;
  let iterations = 0;
  const maxIterations = 50;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    // Find member most over their target (needs relief)
    let maxOverload = 0;
    let overloadedMember: string | null = null;
    
    members.forEach(member => {
      const current = newAssignments[member.id].reduce((sum, id) => {
        const task = tasks.find(t => t.id === id);
        return sum + (task?.estimatedMinutes || 0);
      }, 0);
      const target = targetMinutes.get(member.id) || 0;
      const overload = current - target;
      
      if (overload > maxOverload) {
        maxOverload = overload;
        overloadedMember = member.id;
      }
    });

    // Find member most under their target (can take more)
    let maxUnderload = 0;
    let underloadedMember: string | null = null;
    
    members.forEach(member => {
      const current = newAssignments[member.id].reduce((sum, id) => {
        const task = tasks.find(t => t.id === id);
        return sum + (task?.estimatedMinutes || 0);
      }, 0);
      const target = targetMinutes.get(member.id) || 0;
      const underload = target - current;
      
      if (underload > maxUnderload) {
        maxUnderload = underload;
        underloadedMember = member.id;
      }
    });

    // If we found a good swap opportunity, move a task
    if (overloadedMember && underloadedMember && maxOverload > 10 && maxUnderload > 10) {
      const tasksToMove = newAssignments[overloadedMember];
      
      // Find best task to move (closest to the gap we need to fill)
      let bestTask: string | null = null;
      let bestFit = Infinity;
      
      tasksToMove.forEach(taskId => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          const fit = Math.abs(task.estimatedMinutes - Math.min(maxOverload, maxUnderload));
          if (fit < bestFit) {
            bestFit = fit;
            bestTask = taskId;
          }
        }
      });

      if (bestTask) {
        // Move the task
        newAssignments[overloadedMember] = newAssignments[overloadedMember].filter(id => id !== bestTask);
        newAssignments[underloadedMember].push(bestTask);
        improved = true;
        
        const taskTitle = tasks.find(t => t.id === bestTask)?.title;
        const fromName = members.find(m => m.id === overloadedMember)?.name;
        const toName = members.find(m => m.id === underloadedMember)?.name;
        console.log(`Iteration ${iterations}: Moved "${taskTitle}" from ${fromName} to ${toName}`);
      }
    }
  }
  
  console.log(`Recalibration completed in ${iterations} iterations`);

  // Calculate fairness score based on actual minutes (not weights)
  const actualMinuteLoads = members.map(member => {
    const taskIds = newAssignments[member.id] || [];
    return taskIds.reduce((sum, id) => {
      const task = tasks.find(t => t.id === id);
      return sum + (task?.estimatedMinutes || 0);
    }, 0);
  });
  
  const avgMinutes = actualMinuteLoads.reduce((sum, load) => sum + load, 0) / actualMinuteLoads.length;
  const minuteVariance = actualMinuteLoads.reduce((sum, load) => sum + Math.pow(load - avgMinutes, 2), 0) / actualMinuteLoads.length;
  const minuteStdDev = Math.sqrt(minuteVariance);
  const maxStdDev = avgMinutes * 0.5; // Allow 50% deviation
  const fairnessScore = avgMinutes > 0 ? Math.max(0, Math.round(100 - (minuteStdDev / maxStdDev) * 100)) : 100;
  
  console.log('Fairness calculation:', {
    actualMinuteLoads,
    avgMinutes,
    minuteStdDev,
    maxStdDev,
    fairnessScore
  });

  // Calculate changes for each member
  const changes = members.map(member => {
    const oldTaskIds = currentAssignments[member.id] || [];
    const newTaskIds = newAssignments[member.id] || [];
    
    const tasksAdded = tasks.filter(t => newTaskIds.includes(t.id) && !oldTaskIds.includes(t.id));
    const tasksRemoved = tasks.filter(t => oldTaskIds.includes(t.id) && !newTaskIds.includes(t.id));
    
    const oldLoad = oldTaskIds.reduce((sum, id) => {
      const task = tasks.find(t => t.id === id);
      return sum + (task?.estimatedMinutes || 0);
    }, 0);
    
    const newLoad = newTaskIds.reduce((sum, id) => {
      const task = tasks.find(t => t.id === id);
      return sum + (task?.estimatedMinutes || 0);
    }, 0);
    
    return {
      memberId: member.id,
      memberName: member.name,
      tasksAdded,
      tasksRemoved,
      loadChange: newLoad - oldLoad
    };
  });

  return {
    newAssignments,
    fairnessScore,
    changes
  };
}

/**
 * Get capacity description for display
 */
export function getCapacityDescription(capacity: MemberCapacity): string {
  const effectiveCapacity = calculateEffectiveCapacity(capacity);
  
  if (effectiveCapacity >= 0.8) {
    return 'High capacity - can take on more tasks';
  } else if (effectiveCapacity >= 0.6) {
    return 'Good capacity - balanced workload';
  } else if (effectiveCapacity >= 0.4) {
    return 'Moderate capacity - approaching limit';
  } else if (effectiveCapacity >= 0.2) {
    return 'Low capacity - needs support';
  } else {
    return 'Very low capacity - requires immediate relief';
  }
}

/**
 * Calculate recommended task redistribution
 */
export function getRecommendedRedistribution(
  tasks: Task[],
  members: FamilyMember[],
  capacities: MemberCapacity[],
  currentAssignments: Record<string, string[]>
): {
  recommendations: Array<{
    taskId: string;
    taskTitle: string;
    fromMemberId: string;
    toMemberId: string;
    reason: string;
  }>;
  projectedFairnessScore: number;
} {
  const recommendations: Array<{
    taskId: string;
    taskTitle: string;
    fromMemberId: string;
    toMemberId: string;
    reason: string;
  }> = [];

  // Find members with lowest and highest capacity
  const capacitiesWithMembers = capacities.map(cap => ({
    ...cap,
    effectiveCapacity: calculateEffectiveCapacity(cap)
  })).sort((a, b) => a.effectiveCapacity - b.effectiveCapacity);

  const lowestCapacity = capacitiesWithMembers[0];
  const highestCapacity = capacitiesWithMembers[capacitiesWithMembers.length - 1];

  // If capacity difference is significant, recommend redistribution
  // Move tasks FROM person with LOW capacity (needs help) TO person with HIGH capacity (can help)
  if (highestCapacity.effectiveCapacity - lowestCapacity.effectiveCapacity > 0.3) {
    // Get tasks from the person with LOW capacity who needs help
    const tasksFromPersonNeedingHelp = currentAssignments[lowestCapacity.memberId] || [];
    const tasksToMove = tasksFromPersonNeedingHelp
      .map(taskId => tasks.find(t => t.id === taskId))
      .filter((t): t is Task => t !== undefined)
      .sort((a, b) => (b.estimatedMinutes || 0) - (a.estimatedMinutes || 0)) // Move heavier tasks first
      .slice(0, 2); // Move up to 2 tasks

    tasksToMove.forEach(task => {
      recommendations.push({
        taskId: task.id,
        taskTitle: task.title,
        fromMemberId: lowestCapacity.memberId, // FROM person who needs help
        toMemberId: highestCapacity.memberId, // TO person who can help
        reason: `${lowestCapacity.memberName} has low capacity (${Math.round(lowestCapacity.effectiveCapacity * 100)}%) and needs support. Moving to ${highestCapacity.memberName} who has higher capacity (${Math.round(highestCapacity.effectiveCapacity * 100)}%).`
      });
    });
  }

  // Calculate projected fairness score after recommendations
  const simulatedAssignments = { ...currentAssignments };
  recommendations.forEach(rec => {
    simulatedAssignments[rec.fromMemberId] = simulatedAssignments[rec.fromMemberId].filter(id => id !== rec.taskId);
    simulatedAssignments[rec.toMemberId] = [...(simulatedAssignments[rec.toMemberId] || []), rec.taskId];
  });

  const result = recalibrateTaskAssignments(tasks, members, capacities, simulatedAssignments);

  return {
    recommendations,
    projectedFairnessScore: result.fairnessScore
  };
}