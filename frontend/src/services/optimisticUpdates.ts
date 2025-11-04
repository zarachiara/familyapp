/**
 * Optimistic Updates Service
 * Provides utilities for optimistic UI updates with rollback capability
 */

export interface OptimisticUpdate<T = any> {
  id: string;
  type: string;
  timestamp: number;
  previousState: T;
  optimisticState: T;
  rollbackFn?: () => void;
}

class OptimisticUpdatesService {
  private updates: Map<string, OptimisticUpdate> = new Map();
  private rollbackCallbacks: Map<string, () => void> = new Map();

  /**
   * Register an optimistic update
   */
  register<T>(
    id: string,
    type: string,
    previousState: T,
    optimisticState: T,
    rollbackFn?: () => void
  ): void {
    const update: OptimisticUpdate<T> = {
      id,
      type,
      timestamp: Date.now(),
      previousState,
      optimisticState,
      rollbackFn,
    };

    this.updates.set(id, update);
    
    if (rollbackFn) {
      this.rollbackCallbacks.set(id, rollbackFn);
    }
  }

  /**
   * Confirm an optimistic update (remove from tracking)
   */
  confirm(id: string): void {
    this.updates.delete(id);
    this.rollbackCallbacks.delete(id);
  }

  /**
   * Rollback an optimistic update
   */
  rollback(id: string): boolean {
    const update = this.updates.get(id);
    
    if (!update) {
      return false;
    }

    // Execute rollback callback if provided
    const rollbackFn = this.rollbackCallbacks.get(id);
    if (rollbackFn) {
      rollbackFn();
    }

    this.updates.delete(id);
    this.rollbackCallbacks.delete(id);
    
    return true;
  }

  /**
   * Get an optimistic update by ID
   */
  get(id: string): OptimisticUpdate | undefined {
    return this.updates.get(id);
  }

  /**
   * Check if an update is pending
   */
  isPending(id: string): boolean {
    return this.updates.has(id);
  }

  /**
   * Get all pending updates
   */
  getPending(): OptimisticUpdate[] {
    return Array.from(this.updates.values());
  }

  /**
   * Clear all pending updates
   */
  clear(): void {
    this.updates.clear();
    this.rollbackCallbacks.clear();
  }

  /**
   * Rollback all pending updates
   */
  rollbackAll(): void {
    const ids = Array.from(this.updates.keys());
    ids.forEach(id => this.rollback(id));
  }
}

// Export singleton instance
export const optimisticUpdates = new OptimisticUpdatesService();

/**
 * Helper function to create an optimistic update wrapper
 */
export async function withOptimisticUpdate<T, R>(
  id: string,
  type: string,
  previousState: T,
  optimisticState: T,
  asyncOperation: () => Promise<R>,
  rollbackFn: () => void
): Promise<R> {
  // Register the optimistic update
  optimisticUpdates.register(id, type, previousState, optimisticState, rollbackFn);

  try {
    // Execute the async operation
    const result = await asyncOperation();
    
    // Confirm the update on success
    optimisticUpdates.confirm(id);
    
    return result;
  } catch (error) {
    // Rollback on failure
    optimisticUpdates.rollback(id);
    throw error;
  }
}

/**
 * Helper to create a temporary ID for optimistic creates
 */
export function createTempId(prefix: string = 'temp'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if an ID is a temporary optimistic ID
 */
export function isTempId(id: string): boolean {
  return id.startsWith('temp_');
}