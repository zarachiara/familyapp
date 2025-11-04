
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Task, FamilyMember, Template, AppreciationNote, Badge, Household, EquilibriumSnapshot, MemberCapacitySnapshot } from '@/types';
import {
  tasksAPI,
  equilibriumAPI,
  templatesAPI,
  notesAPI,
  badgesAPI,
  TaskCreateDTO,
  TaskUpdateDTO,
  NetworkError,
  APIError,
} from '@/services/api';
import { syncQueue, SyncOperation, SyncQueueState } from '@/services/syncQueue';
import { conflictResolver } from '@/services/conflictResolution';
import { optimisticUpdates, withOptimisticUpdate, createTempId, isTempId } from '@/services/optimisticUpdates';
import {
  getHousehold,
  saveHousehold,
  getTasks,
  saveTasks,
  getTemplates,
  saveTemplates,
  getNotes,
  getBadges,
  saveBadges,
  isOnboardingComplete,
  setOnboardingComplete as setOnboardingCompleteStorage,
} from '@/utils/storage';
import {
  getCurrentEquilibrium,
  getEquilibriumHistory,
  saveEquilibrium as saveEquilibriumToStorage,
  restoreEquilibrium as restoreEquilibriumStorage,
  isCurrentDistributionEquilibrium,
  calculateEquilibriumDrift,
} from '@/utils/equilibriumStorage';
import { useAuth } from './AuthContext';
import { toast } from '@/components/ui/use-toast';

interface AppContextType {
  household: Household | null;
  tasks: Task[];
  templates: Template[];
  notes: AppreciationNote[];
  badges: Badge[];
  isOnboardingComplete: boolean;
  currentEquilibrium: EquilibriumSnapshot | null;
  equilibriumHistory: EquilibriumSnapshot[];
  syncState: SyncQueueState;
  isOnline: boolean;
  addTask: (task: Task) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  batchUpdateTasks: (updates: Array<{ taskId: string; updates: Partial<Task> }>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addTemplate: (template: Template) => Promise<void>;
  addAppreciationNote: (note: AppreciationNote) => Promise<void>;
  updateMemberPoints: (memberId: string, points: number) => void;
  setHousehold: (household: Household) => void;
  setOnboardingComplete: (complete: boolean) => Promise<void>;
  initializeApp: () => Promise<void>;
  saveCurrentAsEquilibrium: (fairnessScore: number, capacities: MemberCapacitySnapshot[], description?: string) => Promise<EquilibriumSnapshot>;
  restoreToEquilibrium: (snapshotId?: string) => Promise<void>;
  isAtEquilibrium: () => boolean;
  getEquilibriumDrift: () => number;
  syncNow: () => Promise<void>;
  retryFailedSync: (operationId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [household, setHouseholdState] = useState<Household | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [notes, setNotes] = useState<AppreciationNote[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [onboardingComplete, setOnboardingCompleteState] = useState<boolean>(false);
  const [currentEquilibrium, setCurrentEquilibrium] = useState<EquilibriumSnapshot | null>(null);
  const [equilibriumHistory, setEquilibriumHistory] = useState<EquilibriumSnapshot[]>([]);
  const [syncState, setSyncState] = useState<SyncQueueState>(syncQueue.getState());
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Setup sync queue operation executor
  useEffect(() => {
    syncQueue.setOperationExecutor(async (operation: SyncOperation) => {
      await executeSyncOperation(operation);
    });

    // Subscribe to sync queue changes
    const unsubscribe = syncQueue.subscribe((state) => {
      setSyncState(state);
    });

    // Setup online/offline listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Execute a sync operation
   */
  const executeSyncOperation = async (operation: SyncOperation): Promise<void> => {
    switch (operation.type) {
      case 'CREATE_TASK':
        await tasksAPI.create(operation.data);
        break;
      case 'UPDATE_TASK':
        await tasksAPI.update(operation.data.taskId, operation.data.updates);
        break;
      case 'DELETE_TASK':
        await tasksAPI.delete(operation.data.taskId);
        break;
      case 'CREATE_TEMPLATE':
        await templatesAPI.create(operation.data);
        break;
      case 'DELETE_TEMPLATE':
        await templatesAPI.delete(operation.data.templateId);
        break;
      case 'CREATE_NOTE':
        await notesAPI.create(operation.data);
        break;
      case 'DELETE_NOTE':
        await notesAPI.delete(operation.data.noteId);
        break;
      case 'CREATE_EQUILIBRIUM':
        await equilibriumAPI.create(operation.data);
        break;
      case 'RESTORE_EQUILIBRIUM':
        await equilibriumAPI.restore(operation.data.equilibriumId);
        break;
      case 'DELETE_EQUILIBRIUM':
        await equilibriumAPI.delete(operation.data.equilibriumId);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  };

  /**
   * Initialize app data
   */
  const initializeApp = useCallback(async () => {
    // Load from localStorage first (instant)
    const householdData = getHousehold();
    setHouseholdState(householdData);

    const tasksData = getTasks();
    setTasks(tasksData);

    const templatesData = getTemplates();
    setTemplates(templatesData);

    const notesData = getNotes();
    setNotes(notesData);

    const badgesData = getBadges();
    setBadges(badgesData);

    const onboardingStatus = user?.onboarding_completed ?? isOnboardingComplete();
    setOnboardingCompleteState(onboardingStatus);

    const equilibrium = getCurrentEquilibrium();
    setCurrentEquilibrium(equilibrium);

    const history = getEquilibriumHistory();
    setEquilibriumHistory(history);

    // If user is logged in and online, sync with backend
    if (user && isOnline) {
      try {
        await syncWithBackend();
      } catch (error) {
        console.error('Failed to sync with backend:', error);
        // Continue with local data
      }
    }
  }, [user, isOnline]);

  /**
   * Sync local data with backend
   */
  const syncWithBackend = async (): Promise<void> => {
    try {
      // Fetch all data from backend
      const [serverTasks, serverTemplates, serverNotes, serverBadges] = await Promise.all([
        tasksAPI.getAll().catch(() => []),
        templatesAPI.getAll().catch(() => []),
        notesAPI.getAll().catch(() => []),
        badgesAPI.getAll().catch(() => []),
      ]);

      // Fetch equilibrium data
      let serverEquilibrium: EquilibriumSnapshot | null = null;
      let serverEquilibriumHistory: EquilibriumSnapshot[] = [];
      
      try {
        const activeEq = await equilibriumAPI.getActive();
        serverEquilibrium = convertEquilibriumFromDTO(activeEq);
      } catch (error) {
        // No active equilibrium
      }

      try {
        const historyData = await equilibriumAPI.getHistory(10);
        serverEquilibriumHistory = historyData.map(convertEquilibriumFromDTO);
      } catch (error) {
        // No history
      }

      // Convert and merge data
      const convertedTasks = serverTasks.map(convertTaskFromDTO);
      const convertedTemplates = serverTemplates.map(convertTemplateFromDTO);
      const convertedNotes = serverNotes.map(convertNoteFromDTO);
      const convertedBadges = serverBadges.map(convertBadgeFromDTO);

      // Merge with local data (resolve conflicts)
      const mergedTasks = mergeTasksWithConflictResolution(tasks, convertedTasks);
      const mergedTemplates = mergeArrays(templates, convertedTemplates);
      const mergedNotes = mergeArrays(notes, convertedNotes);
      const mergedBadges = mergeArrays(badges, convertedBadges);

      // Update state and localStorage
      setTasks(mergedTasks);
      saveTasks(mergedTasks);

      setTemplates(mergedTemplates);
      saveTemplates(mergedTemplates);

      setNotes(mergedNotes);
      
      setBadges(mergedBadges);
      saveBadges(mergedBadges);

      if (serverEquilibrium) {
        setCurrentEquilibrium(serverEquilibrium);
      }

      if (serverEquilibriumHistory.length > 0) {
        setEquilibriumHistory(serverEquilibriumHistory);
      }

      // Process any pending sync operations
      await syncQueue.processPendingOperations();

    } catch (error) {
      if (error instanceof NetworkError) {
        console.warn('Network unavailable, using local data');
      } else {
        console.error('Sync error:', error);
      }
      throw error;
    }
  };

  /**
   * Merge tasks with conflict resolution
   */
  const mergeTasksWithConflictResolution = (localTasks: Task[], serverTasks: Task[]): Task[] => {
    const merged = new Map<string, Task>();

    // Add all server tasks
    serverTasks.forEach(task => {
      merged.set(task.id, task);
    });

    // Process local tasks
    localTasks.forEach(localTask => {
      const serverTask = merged.get(localTask.id);

      if (!serverTask) {
        // Local-only task (might be pending sync)
        if (!isTempId(localTask.id)) {
          merged.set(localTask.id, localTask);
        }
      } else {
        // Resolve conflict
        const localTimestamp = new Date(localTask.createdAt).getTime();
        const serverTimestamp = new Date(serverTask.createdAt).getTime();

        const resolved = conflictResolver.resolveTaskConflict(
          localTask,
          serverTask,
          localTimestamp,
          serverTimestamp
        );

        merged.set(resolved.id, resolved);
      }
    });

    return Array.from(merged.values());
  };

  /**
   * Simple array merge (server wins for duplicates)
   */
  const mergeArrays = <T extends { id: string }>(local: T[], server: T[]): T[] => {
    const merged = new Map<string, T>();

    server.forEach(item => merged.set(item.id, item));
    local.forEach(item => {
      if (!merged.has(item.id) && !isTempId(item.id)) {
        merged.set(item.id, item);
      }
    });

    return Array.from(merged.values());
  };

  // Initialize app when user changes
  useEffect(() => {
    if (user) {
      initializeApp();
    } else {
      // Clear data when user logs out
      setHouseholdState(null);
      setTasks([]);
      setTemplates([]);
      setNotes([]);
      setBadges([]);
      setOnboardingCompleteState(false);
      setCurrentEquilibrium(null);
      setEquilibriumHistory([]);
    }
  }, [user?.id, initializeApp]);

  const setHousehold = (household: Household) => {
    setHouseholdState(household);
    saveHousehold(household);
  };

  const setOnboardingComplete = async (complete: boolean) => {
    setOnboardingCompleteState(complete);
    setOnboardingCompleteStorage(complete);
    
    if (user && complete) {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          await fetch(`${API_BASE_URL}/api/v1/auth/onboarding-status`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        }
      } catch (error) {
        console.error('Failed to update onboarding status on backend:', error);
      }
    }
  };

  const addTask = async (task: Task) => {
    const tempId = isTempId(task.id) ? task.id : createTempId('task');
    const optimisticTask = { ...task, id: tempId };

    // Optimistic update
    const newTasks = [...tasks, optimisticTask];
    setTasks(newTasks);
    saveTasks(newTasks);

    if (!isOnline) {
      // Queue for later sync
      const taskDTO = convertTaskToDTO(task);
      syncQueue.addOperation('CREATE_TASK', taskDTO);
      toast({
        title: 'Task saved offline',
        description: 'Will sync when connection is restored',
      });
      return;
    }

    try {
      await withOptimisticUpdate(
        tempId,
        'CREATE_TASK',
        tasks,
        newTasks,
        async () => {
          const taskDTO = convertTaskToDTO(task);
          const created = await tasksAPI.create(taskDTO);
          const convertedTask = convertTaskFromDTO(created);
          
          // Replace temp task with real one
          const finalTasks = newTasks.map(t => t.id === tempId ? convertedTask : t);
          setTasks(finalTasks);
          saveTasks(finalTasks);
          
          return created;
        },
        () => {
          // Rollback
          setTasks(tasks);
          saveTasks(tasks);
        }
      );
    } catch (error) {
      if (error instanceof NetworkError) {
        // Queue for sync
        const taskDTO = convertTaskToDTO(task);
        syncQueue.addOperation('CREATE_TASK', taskDTO);
        toast({
          title: 'Task saved offline',
          description: 'Will sync when connection is restored',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create task',
          variant: 'destructive',
        });
        throw error;
      }
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const previousTask = tasks[taskIndex];
    const updatedTask = { ...previousTask, ...updates };
    const newTasks = [...tasks];
    newTasks[taskIndex] = updatedTask;

    // Optimistic update
    setTasks(newTasks);
    saveTasks(newTasks);

    // Award points if task is completed
    if (updates.status === 'done' && household && previousTask.status !== 'done') {
      updateMemberPoints(updatedTask.assigneeId, updatedTask.points);
    }

    if (!isOnline) {
      const updateDTO = convertTaskUpdateToDTO(updates);
      syncQueue.addOperation('UPDATE_TASK', { taskId, updates: updateDTO });
      return;
    }

    try {
      await withOptimisticUpdate(
        taskId,
        'UPDATE_TASK',
        tasks,
        newTasks,
        async () => {
          const updateDTO = convertTaskUpdateToDTO(updates);
          const updated = await tasksAPI.update(taskId, updateDTO);
          const convertedTask = convertTaskFromDTO(updated);
          
          const finalTasks = tasks.map(t => t.id === taskId ? convertedTask : t);
          setTasks(finalTasks);
          saveTasks(finalTasks);
          
          return updated;
        },
        () => {
          setTasks(tasks);
          saveTasks(tasks);
        }
      );
    } catch (error) {
      if (error instanceof NetworkError) {
        const updateDTO = convertTaskUpdateToDTO(updates);
        syncQueue.addOperation('UPDATE_TASK', { taskId, updates: updateDTO });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update task',
          variant: 'destructive',
        });
        throw error;
      }
    }
  };

  const batchUpdateTasks = async (updates: Array<{ taskId: string; updates: Partial<Task> }>) => {
    const newTasks = [...tasks];
    
    updates.forEach(({ taskId, updates: taskUpdates }) => {
      const index = newTasks.findIndex(t => t.id === taskId);
      if (index !== -1) {
        newTasks[index] = { ...newTasks[index], ...taskUpdates };
        
        // Award points for completed tasks
        if (taskUpdates.status === 'done' && household && tasks[index].status !== 'done') {
          updateMemberPoints(newTasks[index].assigneeId, newTasks[index].points);
        }
      }
    });

    setTasks(newTasks);
    saveTasks(newTasks);

    // Sync each update
    for (const { taskId, updates: taskUpdates } of updates) {
      if (!isOnline) {
        const updateDTO = convertTaskUpdateToDTO(taskUpdates);
        syncQueue.addOperation('UPDATE_TASK', { taskId, updates: updateDTO });
      } else {
        try {
          const updateDTO = convertTaskUpdateToDTO(taskUpdates);
          await tasksAPI.update(taskId, updateDTO);
        } catch (error) {
          if (error instanceof NetworkError) {
            const updateDTO = convertTaskUpdateToDTO(taskUpdates);
            syncQueue.addOperation('UPDATE_TASK', { taskId, updates: updateDTO });
          }
        }
      }
    }
  };

  const deleteTask = async (taskId: string) => {
    const newTasks = tasks.filter(t => t.id !== taskId);
    
    setTasks(newTasks);
    saveTasks(newTasks);

    if (!isOnline) {
      syncQueue.addOperation('DELETE_TASK', { taskId });
      return;
    }

    try {
      await tasksAPI.delete(taskId);
    } catch (error) {
      if (error instanceof NetworkError) {
        syncQueue.addOperation('DELETE_TASK', { taskId });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete task',
          variant: 'destructive',
        });
        throw error;
      }
    }
  };

  const addTemplate = async (template: Template) => {
    const newTemplates = [...templates, template];
    setTemplates(newTemplates);
    saveTemplates(newTemplates);

    const templateDTO = convertTemplateToDTO(template);

    if (!isOnline) {
      syncQueue.addOperation('CREATE_TEMPLATE', templateDTO);
      return;
    }

    try {
      await templatesAPI.create(templateDTO);
    } catch (error) {
      if (error instanceof NetworkError) {
        syncQueue.addOperation('CREATE_TEMPLATE', templateDTO);
      }
    }
  };

  const addAppreciationNote = async (note: AppreciationNote) => {
    const newNotes = [...notes, note];
    setNotes(newNotes);

    const noteDTO = convertNoteToDTO(note);

    if (!isOnline) {
      syncQueue.addOperation('CREATE_NOTE', noteDTO);
      return;
    }

    try {
      await notesAPI.create(noteDTO);
    } catch (error) {
      if (error instanceof NetworkError) {
        syncQueue.addOperation('CREATE_NOTE', noteDTO);
      }
    }
  };

  const updateMemberPoints = (memberId: string, points: number) => {
    if (!household) return;

    const updatedMembers = household.members.map(m =>
      m.id === memberId
        ? { ...m, points: m.points + points, tasksCompleted: m.tasksCompleted + 1 }
        : m
    );

    const updatedHousehold = { ...household, members: updatedMembers };
    setHousehold(updatedHousehold);
  };

  const saveCurrentAsEquilibrium = async (
    fairnessScore: number,
    capacities: MemberCapacitySnapshot[],
    description?: string
  ): Promise<EquilibriumSnapshot> => {
    if (!household) {
      throw new Error('Cannot save equilibrium without a household');
    }

    const assignments: Record<string, string[]> = {};
    household.members.forEach(member => {
      assignments[member.id] = tasks
        .filter(task => task.assigneeId === member.id)
        .map(task => task.id);
    });

    const snapshot = saveEquilibriumToStorage(assignments, fairnessScore, capacities, description);
    setCurrentEquilibrium(snapshot);
    setEquilibriumHistory(getEquilibriumHistory());

    if (isOnline) {
      try {
        const equilibriumDTO = convertEquilibriumToDTO(snapshot);
        await equilibriumAPI.create(equilibriumDTO);
      } catch (error) {
        if (error instanceof NetworkError) {
          syncQueue.addOperation('CREATE_EQUILIBRIUM', convertEquilibriumToDTO(snapshot));
        }
      }
    } else {
      syncQueue.addOperation('CREATE_EQUILIBRIUM', convertEquilibriumToDTO(snapshot));
    }

    return snapshot;
  };

  const restoreToEquilibrium = async (snapshotId?: string) => {
    let snapshot: EquilibriumSnapshot | null;

    if (snapshotId) {
      snapshot = restoreEquilibriumStorage(snapshotId);
    } else {
      snapshot = currentEquilibrium;
    }

    if (!snapshot) {
      console.error('No equilibrium to restore');
      return;
    }

    const updates: Array<{ taskId: string; updates: Partial<Task> }> = [];

    Object.entries(snapshot.assignments).forEach(([memberId, taskIds]) => {
      taskIds.forEach(taskId => {
        const task = tasks.find(t => t.id === taskId);
        if (task && task.assigneeId !== memberId) {
          updates.push({
            taskId,
            updates: { assigneeId: memberId },
          });
        }
      });
    });

    if (updates.length > 0) {
      await batchUpdateTasks(updates);
    }

    setCurrentEquilibrium(snapshot);
    setEquilibriumHistory(getEquilibriumHistory());

    if (isOnline && snapshotId) {
      try {
        await equilibriumAPI.restore(snapshotId);
      } catch (error) {
        if (error instanceof NetworkError) {
          syncQueue.addOperation('RESTORE_EQUILIBRIUM', { equilibriumId: snapshotId });
        }
      }
    }
  };

  const isAtEquilibrium = (): boolean => {
    if (!household || !currentEquilibrium) return false;

    const currentAssignments: Record<string, string[]> = {};
    household.members.forEach(member => {
      currentAssignments[member.id] = tasks
        .filter(task => task.assigneeId === member.id)
        .map(task => task.id);
    });

    return isCurrentDistributionEquilibrium(currentAssignments);
  };

  const getEquilibriumDrift = (): number => {
    if (!household || !currentEquilibrium) return 0;

    const currentAssignments: Record<string, string[]> = {};
    household.members.forEach(member => {
      currentAssignments[member.id] = tasks
        .filter(task => task.assigneeId === member.id)
        .map(task => task.id);
    });

    return calculateEquilibriumDrift(currentAssignments);
  };

  const syncNow = async () => {
    if (!isOnline) {
      toast({
        title: 'Offline',
        description: 'Cannot sync while offline',
        variant: 'destructive',
      });
      return;
    }

    try {
      await syncWithBackend();
      await syncQueue.processPendingOperations();
      
      toast({
        title: 'Synced',
        description: 'All data synced successfully',
      });
    } catch (error) {
      toast({
        title: 'Sync failed',
        description: 'Some operations could not be synced',
        variant: 'destructive',
      });
    }
  };

  const retryFailedSync = (operationId: string) => {
    syncQueue.retryOperation(operationId);
  };

  return (
    <AppContext.Provider
      value={{
        household,
        tasks,
        templates,
        notes,
        badges,
        isOnboardingComplete: onboardingComplete,
        currentEquilibrium,
        equilibriumHistory,
        syncState,
        isOnline,
        addTask,
        updateTask,
        batchUpdateTasks,
        deleteTask,
        addTemplate,
        addAppreciationNote,
        updateMemberPoints,
        setHousehold,
        setOnboardingComplete,
        initializeApp,
        saveCurrentAsEquilibrium,
        restoreToEquilibrium,
        isAtEquilibrium,
        getEquilibriumDrift,
        syncNow,
        retryFailedSync,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

function convertTaskFromDTO(dto: any): Task {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    assigneeId: dto.assignee_id,
    dueDate: dto.due_date,
    status: dto.status,
    recurrence: dto.recurrence,
    room: dto.room,
    points: dto.points,
    createdBy: dto.created_by,
    createdAt: dto.created_at,
    completedAt: dto.completed_at,
    estimatedMinutes: dto.estimated_minutes,
  };
}

function convertTaskToDTO(task: Task): TaskCreateDTO {
  return {
    title: task.title,
    description: task.description,
    assignee_id: task.assigneeId,
    due_date: task.dueDate,
    status: task.status,
    recurrence: task.recurrence,
    room: task.room,
    points: task.points,
    estimated_minutes: task.estimatedMinutes,
  };
}

function convertTaskUpdateToDTO(updates: Partial<Task>): TaskUpdateDTO {
  const dto: TaskUpdateDTO = {};
  
  if (updates.title !== undefined) dto.title = updates.title;
  if (updates.description !== undefined) dto.description = updates.description;
  if (updates.assigneeId !== undefined) dto.assignee_id = updates.assigneeId;
  if (updates.dueDate !== undefined) dto.due_date = updates.dueDate;
  if (updates.status !== undefined) dto.status = updates.status;
  if (updates.recurrence !== undefined) dto.recurrence = updates.recurrence;
  if (updates.room !== undefined) dto.room = updates.room;
  if (updates.points !== undefined) dto.points = updates.points;
  if (updates.estimatedMinutes !== undefined) dto.estimated_minutes = updates.estimatedMinutes;
  
  return dto;
}

function convertTemplateFromDTO(dto: any): Template {
  return {
    id: dto.id,
    name: dto.name,
    category: dto.category,
    description: dto.description,
    tasks: dto.tasks,
    isCustom: dto.is_custom,
    createdBy: dto.created_by,
  };
}

function convertTemplateToDTO(template: Template): any {
  return {
    name: template.name,
    category: template.category,
    description: template.description,
    tasks: template.tasks,
    is_custom: template.isCustom,
  };
}

function convertNoteFromDTO(dto: any): AppreciationNote {
  return {
    id: dto.id,
    fromId: dto.from_id,
    toId: dto.to_id,
    message: dto.message,
    createdAt: dto.created_at,
  };
}

function convertNoteToDTO(note: AppreciationNote): any {
  return {
    from_id: note.fromId,
    to_id: note.toId,
    message: note.message,
  };
}

function convertBadgeFromDTO(dto: any): Badge {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    icon: dto.icon,
    threshold: dto.threshold,
    earnedBy: dto.earned_by,
  };
}

function convertEquilibriumFromDTO(dto: any): EquilibriumSnapshot {
  return {
    id: dto.id,
    timestamp: dto.timestamp,
    assignments: dto.assignments,
    fairnessScore: dto.fairness_score,
    capacities: dto.capacities.map((c: any) => ({
      memberId: c.member_id,
      memberName: c.member_name,
      workloadLevel: c.workload_level,
      energyLevel: c.energy_level,
      emotionalCapacity: c.emotional_capacity,
    })),
    description: dto.description,
    isActive: dto.is_active,
  };
}

function convertEquilibriumToDTO(snapshot: EquilibriumSnapshot): any {
  return {
    assignments: snapshot.assignments,
    fairness_score: snapshot.fairnessScore,
    capacities: snapshot.capacities.map(c => ({
      member_id: c.memberId,
      member_name: c.memberName,
      workload_level: c.workloadLevel,
      energy_level: c.energyLevel,
      emotional_capacity: c.emotionalCapacity,
    })),
    description: snapshot.description,
    is_active: snapshot.isActive,
  };
}