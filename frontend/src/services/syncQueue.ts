/**
 * Sync Queue Service
 * Manages offline operations and syncs them when connection is restored
 */

import { Task, Template, AppreciationNote, EquilibriumSnapshot } from '@/types';

export type SyncOperationType = 
  | 'CREATE_TASK'
  | 'UPDATE_TASK'
  | 'DELETE_TASK'
  | 'CREATE_TEMPLATE'
  | 'DELETE_TEMPLATE'
  | 'CREATE_NOTE'
  | 'DELETE_NOTE'
  | 'CREATE_EQUILIBRIUM'
  | 'RESTORE_EQUILIBRIUM'
  | 'DELETE_EQUILIBRIUM';

export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  timestamp: number;
  data: any;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  error?: string;
}

export interface SyncQueueState {
  operations: SyncOperation[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAttempt?: number;
}

const SYNC_QUEUE_KEY = 'familyflow_sync_queue';
const MAX_RETRIES = 3;
const SYNC_RETRY_DELAY = 5000; // 5 seconds

class SyncQueueService {
  private queue: SyncOperation[] = [];
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private listeners: Set<(state: SyncQueueState) => void> = new Set();
  private syncTimer?: NodeJS.Timeout;

  constructor() {
    this.loadQueue();
    this.setupOnlineListener();
  }

  /**
   * Load queue from localStorage
   */
  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(SYNC_QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.queue = [];
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveQueue(): void {
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  /**
   * Setup online/offline event listeners
   */
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.processPendingOperations();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  /**
   * Add operation to sync queue
   */
  addOperation(
    type: SyncOperationType,
    data: any,
    maxRetries: number = MAX_RETRIES
  ): string {
    const operation: SyncOperation = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      data,
      retryCount: 0,
      maxRetries,
      status: 'pending',
    };

    this.queue.push(operation);
    this.saveQueue();

    // Try to sync immediately if online
    if (this.isOnline && !this.isSyncing) {
      this.processPendingOperations();
    }

    return operation.id;
  }

  /**
   * Get current queue state
   */
  getState(): SyncQueueState {
    return {
      operations: [...this.queue],
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncAttempt: this.queue.length > 0 
        ? Math.max(...this.queue.map(op => op.timestamp))
        : undefined,
    };
  }

  /**
   * Subscribe to queue state changes
   */
  subscribe(listener: (state: SyncQueueState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * Process all pending operations
   */
  async processPendingOperations(): Promise<void> {
    if (!this.isOnline || this.isSyncing || this.queue.length === 0) {
      return;
    }

    this.isSyncing = true;
    this.notifyListeners();

    const pendingOps = this.queue.filter(op => op.status === 'pending' || op.status === 'failed');

    for (const operation of pendingOps) {
      try {
        operation.status = 'syncing';
        this.saveQueue();

        // Execute the operation (will be implemented by the caller)
        await this.executeOperation(operation);

        // Mark as completed and remove from queue
        this.queue = this.queue.filter(op => op.id !== operation.id);
        this.saveQueue();
      } catch (error) {
        operation.retryCount++;
        operation.error = error instanceof Error ? error.message : 'Unknown error';

        if (operation.retryCount >= operation.maxRetries) {
          operation.status = 'failed';
          console.error(`Operation ${operation.id} failed after ${operation.maxRetries} retries:`, error);
        } else {
          operation.status = 'pending';
          console.warn(`Operation ${operation.id} failed, will retry (${operation.retryCount}/${operation.maxRetries})`);
        }

        this.saveQueue();
      }
    }

    this.isSyncing = false;
    this.notifyListeners();

    // Schedule retry for failed operations
    const hasFailedOps = this.queue.some(op => op.status === 'pending');
    if (hasFailedOps && this.isOnline) {
      this.scheduleRetry();
    }
  }

  /**
   * Schedule a retry for pending operations
   */
  private scheduleRetry(): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    this.syncTimer = setTimeout(() => {
      this.processPendingOperations();
    }, SYNC_RETRY_DELAY);
  }

  /**
   * Execute a sync operation (to be overridden by implementation)
   */
  private async executeOperation(operation: SyncOperation): Promise<void> {
    // This will be implemented in the AppContext where we have access to API methods
    throw new Error('executeOperation must be implemented');
  }

  /**
   * Set the operation executor function
   */
  setOperationExecutor(
    executor: (operation: SyncOperation) => Promise<void>
  ): void {
    this.executeOperation = executor;
  }

  /**
   * Clear all completed operations
   */
  clearCompleted(): void {
    this.queue = this.queue.filter(op => op.status !== 'completed');
    this.saveQueue();
  }

  /**
   * Clear all operations (use with caution)
   */
  clearAll(): void {
    this.queue = [];
    this.saveQueue();
  }

  /**
   * Retry a specific failed operation
   */
  retryOperation(operationId: string): void {
    const operation = this.queue.find(op => op.id === operationId);
    if (operation && operation.status === 'failed') {
      operation.status = 'pending';
      operation.retryCount = 0;
      operation.error = undefined;
      this.saveQueue();
      
      if (this.isOnline) {
        this.processPendingOperations();
      }
    }
  }

  /**
   * Remove a specific operation from queue
   */
  removeOperation(operationId: string): void {
    this.queue = this.queue.filter(op => op.id !== operationId);
    this.saveQueue();
  }

  /**
   * Get pending operations count
   */
  getPendingCount(): number {
    return this.queue.filter(op => op.status === 'pending' || op.status === 'syncing').length;
  }

  /**
   * Get failed operations count
   */
  getFailedCount(): number {
    return this.queue.filter(op => op.status === 'failed').length;
  }

  /**
   * Check if there are any pending operations
   */
  hasPendingOperations(): boolean {
    return this.queue.some(op => op.status === 'pending' || op.status === 'syncing');
  }
}

// Export singleton instance
export const syncQueue = new SyncQueueService();