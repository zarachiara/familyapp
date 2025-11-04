import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, FamilyMember, Template, AppreciationNote, Badge, Household, EquilibriumSnapshot, MemberCapacitySnapshot } from '@/types';
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
  addNote as addNoteToStorage,
  isOnboardingComplete,
  setOnboardingComplete as setOnboardingCompleteStorage,
} from '@/utils/storage';
import {
  getCurrentEquilibrium,
  getEquilibriumHistory,
  saveEquilibrium,
  restoreEquilibrium as restoreEquilibriumStorage,
  isCurrentDistributionEquilibrium,
  calculateEquilibriumDrift,
} from '@/utils/equilibriumStorage';
import { processRecurringTasks } from '@/utils/recurringTasks';
import { useAuth } from './AuthContext';

interface AppContextType {
  household: Household | null;
  tasks: Task[];
  templates: Template[];
  notes: AppreciationNote[];
  badges: Badge[];
  isOnboardingComplete: boolean;
  currentEquilibrium: EquilibriumSnapshot | null;
  equilibriumHistory: EquilibriumSnapshot[];
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  batchUpdateTasks: (updates: Array<{ taskId: string; updates: Partial<Task> }>) => void;
  deleteTask: (taskId: string) => void;
  addTemplate: (template: Template) => void;
  addAppreciationNote: (note: AppreciationNote) => void;
  updateMemberPoints: (memberId: string, points: number) => void;
  setHousehold: (household: Household) => void;
  setOnboardingComplete: (complete: boolean) => void;
  initializeApp: () => void;
  saveCurrentAsEquilibrium: (fairnessScore: number, capacities: MemberCapacitySnapshot[], description?: string) => EquilibriumSnapshot;
  restoreToEquilibrium: (snapshotId?: string) => void;
  isAtEquilibrium: () => boolean;
  getEquilibriumDrift: () => number;
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

  const initializeApp = () => {
    // Load existing data only - don't create mock data
    const householdData = getHousehold();
    setHouseholdState(householdData);

    let tasksData = getTasks();
    
    // Process recurring tasks and reset any that are due
    const recurringUpdates = processRecurringTasks(tasksData);
    if (recurringUpdates.length > 0) {
      tasksData = tasksData.map(task => {
        const update = recurringUpdates.find(u => u.taskId === task.id);
        return update ? { ...task, ...update.updates } : task;
      });
      saveTasks(tasksData);
    }
    
    setTasks(tasksData);

    const templatesData = getTemplates();
    setTemplates(templatesData);

    const notesData = getNotes();
    setNotes(notesData);

    const badgesData = getBadges();
    setBadges(badgesData);

    // Get onboarding status from user data (backend) if available, otherwise fall back to localStorage
    const onboardingStatus = user?.onboarding_completed ?? isOnboardingComplete();
    setOnboardingCompleteState(onboardingStatus);

    // Load equilibrium data
    const equilibrium = getCurrentEquilibrium();
    setCurrentEquilibrium(equilibrium);

    const history = getEquilibriumHistory();
    setEquilibriumHistory(history);
  };

  // Initialize app when user changes (login/logout)
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
    }
  }, [user?.id]); // Re-run when user ID changes

  const setHousehold = (household: Household) => {
    setHouseholdState(household);
    saveHousehold(household);
  };

  const setOnboardingComplete = async (complete: boolean) => {
    setOnboardingCompleteState(complete);
    setOnboardingCompleteStorage(complete);
    
    // Also update backend if user is logged in
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
        // Continue anyway - localStorage is updated
      }
    }
  };

  const addTask = (task: Task) => {
    const newTasks = [...tasks, task];
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const newTasks = tasks.map(t => (t.id === taskId ? { ...t, ...updates } : t));
    setTasks(newTasks);
    saveTasks(newTasks);

    // Award points if task is completed
    if (updates.status === 'done' && household) {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.status !== 'done') {
        updateMemberPoints(task.assigneeId, task.points);
      }
    }
  };

  const batchUpdateTasks = (updates: Array<{ taskId: string; updates: Partial<Task> }>) => {
    // Apply all updates in a single operation
    const newTasks = tasks.map(task => {
      const update = updates.find(u => u.taskId === task.id);
      return update ? { ...task, ...update.updates } : task;
    });
    
    setTasks(newTasks);
    saveTasks(newTasks);

    // Award points for any completed tasks
    if (household) {
      updates.forEach(({ taskId, updates: taskUpdates }) => {
        if (taskUpdates.status === 'done') {
          const task = tasks.find(t => t.id === taskId);
          if (task && task.status !== 'done') {
            updateMemberPoints(task.assigneeId, task.points);
          }
        }
      });
    }
  };

  const deleteTask = (taskId: string) => {
    const newTasks = tasks.filter(t => t.id !== taskId);
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  const addTemplate = (template: Template) => {
    const newTemplates = [...templates, template];
    setTemplates(newTemplates);
    saveTemplates(newTemplates);
  };

  const addAppreciationNote = (note: AppreciationNote) => {
    const newNotes = [...notes, note];
    setNotes(newNotes);
    addNoteToStorage(note);
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
    saveHousehold(updatedHousehold);
  };

  const saveCurrentAsEquilibrium = (
    fairnessScore: number,
    capacities: MemberCapacitySnapshot[],
    description?: string
  ): EquilibriumSnapshot => {
    if (!household) {
      throw new Error('Cannot save equilibrium without a household');
    }

    // Build current assignments from tasks
    const assignments: Record<string, string[]> = {};
    household.members.forEach(member => {
      assignments[member.id] = tasks
        .filter(task => task.assigneeId === member.id)
        .map(task => task.id);
    });

    const snapshot = saveEquilibrium(assignments, fairnessScore, capacities, description);
    setCurrentEquilibrium(snapshot);
    setEquilibriumHistory(getEquilibriumHistory());

    return snapshot;
  };

  const restoreToEquilibrium = (snapshotId?: string) => {
    let snapshot: EquilibriumSnapshot | null;

    if (snapshotId) {
      // Restore specific snapshot from history
      snapshot = restoreEquilibriumStorage(snapshotId);
    } else {
      // Restore current equilibrium
      snapshot = currentEquilibrium;
    }

    if (!snapshot) {
      console.error('No equilibrium to restore');
      return;
    }

    // Apply the equilibrium assignments to tasks
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
      batchUpdateTasks(updates);
    }

    // Update state
    setCurrentEquilibrium(snapshot);
    setEquilibriumHistory(getEquilibriumHistory());
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