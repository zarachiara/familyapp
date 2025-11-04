import { Task, FamilyMember, Template, AppreciationNote, Badge, Household } from '@/types';

// Get user-specific storage keys
const getUserStorageKeys = (userId: string) => ({
  HOUSEHOLD: `familyflow_${userId}_household`,
  TASKS: `familyflow_${userId}_tasks`,
  TEMPLATES: `familyflow_${userId}_templates`,
  NOTES: `familyflow_${userId}_notes`,
  BADGES: `familyflow_${userId}_badges`,
  ONBOARDING_COMPLETE: `familyflow_${userId}_onboarding_complete`,
});

// Get current user ID from localStorage
const getCurrentUserId = (): string | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  const user = JSON.parse(userStr);
  return user.id;
};

// Clear all data for a specific user
export const clearUserData = (userId: string): void => {
  const keys = getUserStorageKeys(userId);
  Object.values(keys).forEach(key => {
    localStorage.removeItem(key);
  });
};

// Household
export const getHousehold = (): Household | null => {
  const userId = getCurrentUserId();
  if (!userId) return null;
  const keys = getUserStorageKeys(userId);
  const data = localStorage.getItem(keys.HOUSEHOLD);
  return data ? JSON.parse(data) : null;
};

export const saveHousehold = (household: Household): void => {
  const userId = getCurrentUserId();
  if (!userId) return;
  const keys = getUserStorageKeys(userId);
  localStorage.setItem(keys.HOUSEHOLD, JSON.stringify(household));
};

// Tasks
export const getTasks = (): Task[] => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  const keys = getUserStorageKeys(userId);
  const data = localStorage.getItem(keys.TASKS);
  return data ? JSON.parse(data) : [];
};

export const saveTasks = (tasks: Task[]): void => {
  const userId = getCurrentUserId();
  if (!userId) return;
  const keys = getUserStorageKeys(userId);
  localStorage.setItem(keys.TASKS, JSON.stringify(tasks));
};

export const addTask = (task: Task): void => {
  const tasks = getTasks();
  tasks.push(task);
  saveTasks(tasks);
};

export const updateTask = (taskId: string, updates: Partial<Task>): void => {
  const tasks = getTasks();
  const index = tasks.findIndex(t => t.id === taskId);
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...updates };
    saveTasks(tasks);
  }
};

export const deleteTask = (taskId: string): void => {
  const tasks = getTasks().filter(t => t.id !== taskId);
  saveTasks(tasks);
};

// Templates
export const getTemplates = (): Template[] => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  const keys = getUserStorageKeys(userId);
  const data = localStorage.getItem(keys.TEMPLATES);
  return data ? JSON.parse(data) : [];
};

export const saveTemplates = (templates: Template[]): void => {
  const userId = getCurrentUserId();
  if (!userId) return;
  const keys = getUserStorageKeys(userId);
  localStorage.setItem(keys.TEMPLATES, JSON.stringify(templates));
};

// Appreciation Notes
export const getNotes = (): AppreciationNote[] => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  const keys = getUserStorageKeys(userId);
  const data = localStorage.getItem(keys.NOTES);
  return data ? JSON.parse(data) : [];
};

export const saveNotes = (notes: AppreciationNote[]): void => {
  const userId = getCurrentUserId();
  if (!userId) return;
  const keys = getUserStorageKeys(userId);
  localStorage.setItem(keys.NOTES, JSON.stringify(notes));
};

export const addNote = (note: AppreciationNote): void => {
  const notes = getNotes();
  notes.push(note);
  saveNotes(notes);
};

// Badges
export const getBadges = (): Badge[] => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  const keys = getUserStorageKeys(userId);
  const data = localStorage.getItem(keys.BADGES);
  return data ? JSON.parse(data) : [];
};

export const saveBadges = (badges: Badge[]): void => {
  const userId = getCurrentUserId();
  if (!userId) return;
  const keys = getUserStorageKeys(userId);
  localStorage.setItem(keys.BADGES, JSON.stringify(badges));
};

// Onboarding status
export const isOnboardingComplete = (): boolean => {
  const userId = getCurrentUserId();
  if (!userId) return false;
  const keys = getUserStorageKeys(userId);
  const data = localStorage.getItem(keys.ONBOARDING_COMPLETE);
  return data === 'true';
};

export const setOnboardingComplete = (complete: boolean): void => {
  const userId = getCurrentUserId();
  if (!userId) return;
  const keys = getUserStorageKeys(userId);
  localStorage.setItem(keys.ONBOARDING_COMPLETE, complete.toString());
};