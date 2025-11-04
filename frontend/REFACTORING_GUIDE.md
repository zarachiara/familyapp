# Frontend Refactoring Guide

## Overview

The frontend has been refactored to integrate with backend APIs while maintaining offline support, optimistic updates, and conflict resolution. This guide explains the new architecture and how to migrate from the old AppContext to the new one.

## New Architecture

### 1. **API Service Layer** (`src/services/api.ts`)

Centralized API communication with:
- Type-safe API calls using DTOs
- Automatic authentication token handling
- Network error detection
- Consistent error handling

**Usage:**
```typescript
import { tasksAPI, TaskCreateDTO } from '@/services/api';

// Create a task
const taskDTO: TaskCreateDTO = {
  title: 'Clean kitchen',
  description: 'Deep clean',
  assignee_id: 'member-123',
  due_date: '2025-11-01',
  status: 'todo',
  recurrence: 'none',
  room: 'Kitchen',
  points: 10,
  estimated_minutes: 30,
};

const createdTask = await tasksAPI.create(taskDTO);
```

### 2. **Sync Queue Service** (`src/services/syncQueue.ts`)

Manages offline operations and syncs them when connection is restored:
- Automatic retry with exponential backoff
- Operation queuing for offline scenarios
- Online/offline detection
- Sync status tracking

**Features:**
- Operations are persisted in localStorage
- Automatic sync when connection is restored
- Configurable retry attempts
- Real-time sync status updates

**Usage:**
```typescript
import { syncQueue } from '@/services/syncQueue';

// Add operation to queue (done automatically by AppContext)
syncQueue.addOperation('CREATE_TASK', taskData);

// Subscribe to sync state changes
const unsubscribe = syncQueue.subscribe((state) => {
  console.log('Pending operations:', state.operations.length);
  console.log('Is online:', state.isOnline);
  console.log('Is syncing:', state.isSyncing);
});

// Manually trigger sync
await syncQueue.processPendingOperations();
```

### 3. **Conflict Resolution Service** (`src/services/conflictResolution.ts`)

Handles data conflicts between local and server state:
- Automatic conflict detection
- Multiple resolution strategies (server-wins, client-wins, merge, manual)
- Task-specific conflict resolution logic
- Conflict history tracking

**Resolution Strategies:**
- **server-wins**: Server data takes precedence (default)
- **client-wins**: Client data takes precedence
- **merge**: Intelligent merge based on timestamps
- **manual**: Requires user intervention

**Usage:**
```typescript
import { conflictResolver } from '@/services/conflictResolution';

// Detect conflict
const conflict = conflictResolver.detectConflict(
  taskId,
  'task',
  localTask,
  serverTask,
  localTimestamp,
  serverTimestamp
);

// Resolve conflict
if (conflict) {
  const resolution = conflictResolver.resolveConflict(
    conflict.id,
    'server-wins'
  );
}

// Task-specific resolution
const resolved = conflictResolver.resolveTaskConflict(
  localTask,
  serverTask,
  localTimestamp,
  serverTimestamp
);
```

### 4. **Optimistic Updates Service** (`src/services/optimisticUpdates.ts`)

Provides instant UI feedback with automatic rollback on failure:
- Register optimistic updates
- Automatic rollback on error
- Confirmation on success
- Temporary ID generation for creates

**Usage:**
```typescript
import { withOptimisticUpdate, createTempId } from '@/services/optimisticUpdates';

// Optimistic create
const tempId = createTempId('task');
const optimisticTask = { ...task, id: tempId };

await withOptimisticUpdate(
  tempId,
  'CREATE_TASK',
  previousState,
  optimisticState,
  async () => {
    // Async operation
    return await tasksAPI.create(taskDTO);
  },
  () => {
    // Rollback function
    setState(previousState);
  }
);
```

### 5. **Refactored AppContext** (`src/contexts/AppContext.refactored.tsx`)

Enhanced context with:
- Backend API integration
- Offline support with sync queue
- Optimistic updates
- Conflict resolution
- Real-time sync status
- Automatic data synchronization

**New Features:**
- `syncState`: Current sync queue state
- `isOnline`: Online/offline status
- `syncNow()`: Manual sync trigger
- `retryFailedSync(operationId)`: Retry specific failed operation

## Migration Guide

### Step 1: Replace AppContext

1. Backup the current AppContext:
```bash
mv frontend/src/contexts/AppContext.tsx frontend/src/contexts/AppContext.old.tsx
```

2. Rename the refactored version:
```bash
mv frontend/src/contexts/AppContext.refactored.tsx frontend/src/contexts/AppContext.tsx
```

### Step 2: Update Components

Most components will work without changes, but you can enhance them with new features:

**Before:**
```typescript
const { tasks, addTask } = useApp();

const handleAddTask = (task: Task) => {
  addTask(task);
};
```

**After (with offline awareness):**
```typescript
const { tasks, addTask, isOnline, syncState } = useApp();

const handleAddTask = async (task: Task) => {
  try {
    await addTask(task);
    if (!isOnline) {
      toast({
        title: 'Saved offline',
        description: 'Will sync when connection is restored',
      });
    }
  } catch (error) {
    toast({
      title: 'Error',
      description: 'Failed to add task',
      variant: 'destructive',
    });
  }
};
```

### Step 3: Add Sync Status UI (Optional)

Create a sync status indicator component:

```typescript
import { useApp } from '@/contexts/AppContext';

export const SyncStatus = () => {
  const { syncState, isOnline, syncNow } = useApp();
  
  const pendingCount = syncState.operations.filter(
    op => op.status === 'pending' || op.status === 'syncing'
  ).length;
  
  const failedCount = syncState.operations.filter(
    op => op.status === 'failed'
  ).length;

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 text-yellow-600">
        <WifiOff className="h-4 w-4" />
        <span>Offline ({pendingCount} pending)</span>
      </div>
    );
  }

  if (syncState.isSyncing) {
    return (
      <div className="flex items-center gap-2 text-blue-600">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  if (failedCount > 0) {
    return (
      <button
        onClick={syncNow}
        className="flex items-center gap-2 text-red-600"
      >
        <AlertCircle className="h-4 w-4" />
        <span>{failedCount} failed - Retry</span>
      </button>
    );
  }

  if (pendingCount > 0) {
    return (
      <button
        onClick={syncNow}
        className="flex items-center gap-2 text-blue-600"
      >
        <Cloud className="h-4 w-4" />
        <span>Sync now ({pendingCount})</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-green-600">
      <Check className="h-4 w-4" />
      <span>Synced</span>
    </div>
  );
};
```

## Key Behaviors

### Offline Mode
- All operations work offline
- Changes are saved to localStorage immediately
- Operations are queued for sync
- User is notified of offline status
- Automatic sync when connection is restored

### Optimistic Updates
- UI updates immediately
- Background sync to server
- Automatic rollback on failure
- Temporary IDs for creates (replaced on success)

### Conflict Resolution
- Automatic detection of conflicts
- Default strategy: server-wins
- Task-specific logic for status/assignment changes
- Manual resolution available for complex conflicts

### Sync Queue
- Persistent across page reloads
- Automatic retry with backoff
- Maximum 3 retry attempts per operation
- Failed operations can be manually retried
- Operations can be removed from queue

## Error Handling

### Network Errors
```typescript
try {
  await addTask(task);
} catch (error) {
  if (error instanceof NetworkError) {
    // Operation queued for sync
    console.log('Saved offline, will sync later');
  } else if (error instanceof APIError) {
    // Server error
    console.error('Server error:', error.message);
  }
}
```

### Sync Failures
```typescript
const { syncState, retryFailedSync } = useApp();

// Get failed operations
const failed = syncState.operations.filter(op => op.status === 'failed');

// Retry specific operation
failed.forEach(op => {
  retryFailedSync(op.id);
});
```

## Testing

### Test Offline Behavior
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Perform operations (create, update, delete)
4. Verify operations are queued
5. Set throttling back to "Online"
6. Verify automatic sync

### Test Conflict Resolution
1. Open app in two tabs
2. Make different changes to same task in both tabs
3. Sync both tabs
4. Verify conflict is detected and resolved

### Test Optimistic Updates
1. Throttle network to "Slow 3G"
2. Create/update a task
3. Verify UI updates immediately
4. Verify background sync completes
5. Test rollback by simulating error

## Performance Considerations

- **localStorage limits**: ~5-10MB per domain
- **Sync queue size**: Monitor and clear completed operations
- **Conflict detection**: Only runs on sync, not on every operation
- **Optimistic updates**: Minimal overhead, instant UI feedback

## Troubleshooting

### Sync Queue Not Processing
```typescript
// Check sync state
console.log(syncQueue.getState());

// Manually trigger sync
await syncQueue.processPendingOperations();

// Clear stuck operations (use with caution)
syncQueue.clearAll();
```

### Conflicts Not Resolving
```typescript
// Check pending conflicts
console.log(conflictResolver.getPendingConflicts());

// Manually resolve
conflictResolver.resolveConflict(conflictId, 'server-wins');

// Clear all conflicts
conflictResolver.clearAllConflicts();
```

### Data Not Syncing
1. Check online status: `navigator.onLine`
2. Check auth token: `localStorage.getItem('token')`
3. Check backend connectivity: Test API endpoints
4. Check sync queue: `syncQueue.getState()`
5. Check browser console for errors

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Batch sync optimization
- [ ] Conflict resolution UI
- [ ] Sync progress indicators
- [ ] Background sync with Service Workers
- [ ] IndexedDB for larger data storage
- [ ] Differential sync (only changed data)
- [ ] Sync analytics and monitoring

## API Reference

See individual service files for detailed API documentation:
- `src/services/api.ts` - API service layer
- `src/services/syncQueue.ts` - Sync queue management
- `src/services/conflictResolution.ts` - Conflict resolution
- `src/services/optimisticUpdates.ts` - Optimistic updates