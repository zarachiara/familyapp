import { EquilibriumSnapshot, EquilibriumState, MemberCapacitySnapshot } from '@/types';

const EQUILIBRIUM_STORAGE_KEY = 'fairshare_equilibrium';
const MAX_HISTORY_LENGTH = 10;

/**
 * Get the current equilibrium state from localStorage
 */
export function getEquilibriumState(): EquilibriumState {
  try {
    const stored = localStorage.getItem(EQUILIBRIUM_STORAGE_KEY);
    if (!stored) {
      return {
        currentEquilibrium: null,
        history: [],
      };
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading equilibrium state:', error);
    return {
      currentEquilibrium: null,
      history: [],
    };
  }
}

/**
 * Save a new equilibrium snapshot as the current default
 */
export function saveEquilibrium(
  assignments: Record<string, string[]>,
  fairnessScore: number,
  capacities: MemberCapacitySnapshot[],
  description?: string
): EquilibriumSnapshot {
  const state = getEquilibriumState();
  
  // Deactivate current equilibrium if it exists
  if (state.currentEquilibrium) {
    state.currentEquilibrium.isActive = false;
    // Add to history
    state.history.unshift(state.currentEquilibrium);
  }
  
  // Create new equilibrium snapshot
  const newEquilibrium: EquilibriumSnapshot = {
    id: `eq_${Date.now()}`,
    timestamp: new Date().toISOString(),
    assignments,
    fairnessScore,
    capacities,
    description,
    isActive: true,
  };
  
  // Set as current
  state.currentEquilibrium = newEquilibrium;
  
  // Trim history to max length
  if (state.history.length > MAX_HISTORY_LENGTH) {
    state.history = state.history.slice(0, MAX_HISTORY_LENGTH);
  }
  
  // Save to localStorage
  localStorage.setItem(EQUILIBRIUM_STORAGE_KEY, JSON.stringify(state));
  
  return newEquilibrium;
}

/**
 * Get the current active equilibrium
 */
export function getCurrentEquilibrium(): EquilibriumSnapshot | null {
  const state = getEquilibriumState();
  return state.currentEquilibrium;
}

/**
 * Get equilibrium history
 */
export function getEquilibriumHistory(): EquilibriumSnapshot[] {
  const state = getEquilibriumState();
  return state.history;
}

/**
 * Restore a specific equilibrium snapshot as the current one
 */
export function restoreEquilibrium(snapshotId: string): EquilibriumSnapshot | null {
  const state = getEquilibriumState();
  
  // Find the snapshot in history
  const snapshot = state.history.find(s => s.id === snapshotId);
  if (!snapshot) {
    console.error('Equilibrium snapshot not found:', snapshotId);
    return null;
  }
  
  // Deactivate current equilibrium
  if (state.currentEquilibrium) {
    state.currentEquilibrium.isActive = false;
    // Add to history if not already there
    if (!state.history.some(h => h.id === state.currentEquilibrium!.id)) {
      state.history.unshift(state.currentEquilibrium);
    }
  }
  
  // Remove from history and set as current
  state.history = state.history.filter(s => s.id !== snapshotId);
  snapshot.isActive = true;
  state.currentEquilibrium = snapshot;
  
  // Trim history
  if (state.history.length > MAX_HISTORY_LENGTH) {
    state.history = state.history.slice(0, MAX_HISTORY_LENGTH);
  }
  
  // Save to localStorage
  localStorage.setItem(EQUILIBRIUM_STORAGE_KEY, JSON.stringify(state));
  
  return snapshot;
}

/**
 * Delete an equilibrium snapshot from history
 */
export function deleteEquilibriumSnapshot(snapshotId: string): boolean {
  const state = getEquilibriumState();
  
  // Don't allow deleting the current equilibrium
  if (state.currentEquilibrium?.id === snapshotId) {
    console.error('Cannot delete the current active equilibrium');
    return false;
  }
  
  // Remove from history
  const initialLength = state.history.length;
  state.history = state.history.filter(s => s.id !== snapshotId);
  
  if (state.history.length === initialLength) {
    return false; // Snapshot not found
  }
  
  // Save to localStorage
  localStorage.setItem(EQUILIBRIUM_STORAGE_KEY, JSON.stringify(state));
  
  return true;
}

/**
 * Clear all equilibrium data (use with caution)
 */
export function clearEquilibriumData(): void {
  localStorage.removeItem(EQUILIBRIUM_STORAGE_KEY);
}

/**
 * Check if current task distribution matches the saved equilibrium
 */
export function isCurrentDistributionEquilibrium(
  currentAssignments: Record<string, string[]>
): boolean {
  const equilibrium = getCurrentEquilibrium();
  if (!equilibrium) return false;
  
  // Compare assignments
  const currentKeys = Object.keys(currentAssignments).sort();
  const equilibriumKeys = Object.keys(equilibrium.assignments).sort();
  
  if (currentKeys.length !== equilibriumKeys.length) return false;
  
  for (const key of currentKeys) {
    const currentTasks = [...(currentAssignments[key] || [])].sort();
    const equilibriumTasks = [...(equilibrium.assignments[key] || [])].sort();
    
    if (currentTasks.length !== equilibriumTasks.length) return false;
    
    for (let i = 0; i < currentTasks.length; i++) {
      if (currentTasks[i] !== equilibriumTasks[i]) return false;
    }
  }
  
  return true;
}

/**
 * Calculate the percentage of tasks that differ from equilibrium
 */
export function calculateEquilibriumDrift(
  currentAssignments: Record<string, string[]>
): number {
  const equilibrium = getCurrentEquilibrium();
  if (!equilibrium) return 0;
  
  let totalTasks = 0;
  let differentTasks = 0;
  
  // Count all tasks in current assignments
  Object.values(currentAssignments).forEach(tasks => {
    totalTasks += tasks.length;
  });
  
  if (totalTasks === 0) return 0;
  
  // Compare with equilibrium
  Object.entries(currentAssignments).forEach(([memberId, tasks]) => {
    const equilibriumTasks = equilibrium.assignments[memberId] || [];
    
    tasks.forEach(taskId => {
      if (!equilibriumTasks.includes(taskId)) {
        differentTasks++;
      }
    });
  });
  
  return Math.round((differentTasks / totalTasks) * 100);
}