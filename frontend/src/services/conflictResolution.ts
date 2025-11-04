/**
 * Conflict Resolution Service
 * Handles sync conflicts between local and server data
 */

import { Task, Template, AppreciationNote, EquilibriumSnapshot } from '@/types';

export type ConflictResolutionStrategy = 
  | 'server-wins'      // Server data takes precedence
  | 'client-wins'      // Client data takes precedence
  | 'merge'            // Attempt to merge changes
  | 'manual';          // Require manual resolution

export interface ConflictInfo<T = any> {
  id: string;
  type: 'task' | 'template' | 'note' | 'equilibrium' | 'household';
  localVersion: T;
  serverVersion: T;
  localTimestamp: number;
  serverTimestamp: number;
  conflictFields: string[];
}

export interface ConflictResolution<T = any> {
  strategy: ConflictResolutionStrategy;
  resolvedData: T;
  appliedAt: number;
}

class ConflictResolutionService {
  private pendingConflicts: Map<string, ConflictInfo> = new Map();
  private resolutionHistory: ConflictResolution[] = [];

  /**
   * Detect conflicts between local and server data
   */
  detectConflict<T extends Record<string, any>>(
    id: string,
    type: ConflictInfo['type'],
    localData: T,
    serverData: T,
    localTimestamp: number,
    serverTimestamp: number
  ): ConflictInfo<T> | null {
    const conflictFields: string[] = [];

    // Compare all fields
    const allKeys = new Set([...Object.keys(localData), ...Object.keys(serverData)]);
    
    for (const key of allKeys) {
      // Skip metadata fields
      if (['id', 'createdAt', 'created_at', 'updatedAt', 'updated_at'].includes(key)) {
        continue;
      }

      const localValue = localData[key];
      const serverValue = serverData[key];

      // Deep comparison for objects and arrays
      if (JSON.stringify(localValue) !== JSON.stringify(serverValue)) {
        conflictFields.push(key);
      }
    }

    // No conflict if data is identical
    if (conflictFields.length === 0) {
      return null;
    }

    const conflict: ConflictInfo<T> = {
      id,
      type,
      localVersion: localData,
      serverVersion: serverData,
      localTimestamp,
      serverTimestamp,
      conflictFields,
    };

    this.pendingConflicts.set(id, conflict);
    return conflict;
  }

  /**
   * Resolve a conflict using the specified strategy
   */
  resolveConflict<T extends Record<string, any>>(
    conflictId: string,
    strategy: ConflictResolutionStrategy = 'server-wins'
  ): ConflictResolution<T> | null {
    const conflict = this.pendingConflicts.get(conflictId);
    
    if (!conflict) {
      return null;
    }

    let resolvedData: T;

    switch (strategy) {
      case 'server-wins':
        resolvedData = conflict.serverVersion as T;
        break;

      case 'client-wins':
        resolvedData = conflict.localVersion as T;
        break;

      case 'merge':
        resolvedData = this.mergeData(
          conflict.localVersion,
          conflict.serverVersion,
          conflict.localTimestamp,
          conflict.serverTimestamp
        ) as T;
        break;

      case 'manual':
        // Manual resolution requires external handling
        return null;

      default:
        resolvedData = conflict.serverVersion as T;
    }

    const resolution: ConflictResolution<T> = {
      strategy,
      resolvedData,
      appliedAt: Date.now(),
    };

    this.resolutionHistory.push(resolution);
    this.pendingConflicts.delete(conflictId);

    return resolution;
  }

  /**
   * Merge local and server data intelligently
   */
  private mergeData<T extends Record<string, any>>(
    localData: T,
    serverData: T,
    localTimestamp: number,
    serverTimestamp: number
  ): T {
    const merged: Record<string, any> = { ...serverData }; // Start with server data as base

    // For each field, use the most recent version
    for (const key of Object.keys(localData)) {
      // Skip metadata fields
      if (['id', 'createdAt', 'created_at', 'updatedAt', 'updated_at'].includes(key)) {
        continue;
      }

      const localValue = localData[key];
      const serverValue = serverData[key];

      // If values differ, use the one from the more recent timestamp
      if (JSON.stringify(localValue) !== JSON.stringify(serverValue)) {
        if (localTimestamp > serverTimestamp) {
          merged[key] = localValue;
        }
        // Otherwise keep server value (already in merged)
      }
    }

    return merged as T;
  }

  /**
   * Auto-resolve conflicts based on timestamps
   */
  autoResolveByTimestamp<T extends Record<string, any>>(
    conflictId: string
  ): ConflictResolution<T> | null {
    const conflict = this.pendingConflicts.get(conflictId);
    
    if (!conflict) {
      return null;
    }

    // Use the most recent version
    const strategy: ConflictResolutionStrategy = 
      conflict.localTimestamp > conflict.serverTimestamp ? 'client-wins' : 'server-wins';

    return this.resolveConflict<T>(conflictId, strategy);
  }

  /**
   * Get all pending conflicts
   */
  getPendingConflicts(): ConflictInfo[] {
    return Array.from(this.pendingConflicts.values());
  }

  /**
   * Get conflict by ID
   */
  getConflict(conflictId: string): ConflictInfo | undefined {
    return this.pendingConflicts.get(conflictId);
  }

  /**
   * Check if there are any pending conflicts
   */
  hasPendingConflicts(): boolean {
    return this.pendingConflicts.size > 0;
  }

  /**
   * Clear a specific conflict without resolving
   */
  clearConflict(conflictId: string): void {
    this.pendingConflicts.delete(conflictId);
  }

  /**
   * Clear all pending conflicts
   */
  clearAllConflicts(): void {
    this.pendingConflicts.clear();
  }

  /**
   * Get resolution history
   */
  getResolutionHistory(): ConflictResolution[] {
    return [...this.resolutionHistory];
  }

  /**
   * Task-specific conflict resolution
   */
  resolveTaskConflict(
    localTask: Task,
    serverTask: Task,
    localTimestamp: number,
    serverTimestamp: number
  ): Task {
    // For tasks, we have special rules:
    // 1. Status changes are always kept (most recent)
    // 2. Completion timestamps are preserved
    // 3. Assignment changes use most recent
    // 4. Other fields merge based on timestamp

    const conflict = this.detectConflict(
      localTask.id,
      'task',
      localTask,
      serverTask,
      localTimestamp,
      serverTimestamp
    );

    if (!conflict) {
      return serverTask; // No conflict, use server version
    }

    // Start with server version
    const resolved: Task = { ...serverTask };

    // Apply local changes if they're more recent
    if (localTimestamp > serverTimestamp) {
      // Keep local status if changed
      if (localTask.status !== serverTask.status) {
        resolved.status = localTask.status;
        resolved.completedAt = localTask.completedAt;
      }

      // Keep local assignment if changed
      if (localTask.assigneeId !== serverTask.assigneeId) {
        resolved.assigneeId = localTask.assigneeId;
      }

      // Keep local due date if changed
      if (localTask.dueDate !== serverTask.dueDate) {
        resolved.dueDate = localTask.dueDate;
      }
    }

    this.pendingConflicts.delete(localTask.id);
    return resolved;
  }

  /**
   * Equilibrium-specific conflict resolution
   */
  resolveEquilibriumConflict(
    localEquilibrium: EquilibriumSnapshot,
    serverEquilibrium: EquilibriumSnapshot
  ): EquilibriumSnapshot {
    // For equilibrium, server always wins as it's the source of truth
    // Local changes should be synced as new equilibrium snapshots
    return serverEquilibrium;
  }
}

// Export singleton instance
export const conflictResolver = new ConflictResolutionService();

/**
 * Helper function to determine if data needs sync
 */
export function needsSync(localTimestamp: number, serverTimestamp: number): boolean {
  // If local is newer, it needs to be synced to server
  return localTimestamp > serverTimestamp;
}

/**
 * Helper function to check if data is stale
 */
export function isStale(timestamp: number, maxAgeMs: number = 5 * 60 * 1000): boolean {
  return Date.now() - timestamp > maxAgeMs;
}