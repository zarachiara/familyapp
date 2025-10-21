import { Task, FamilyMember, Template, AppreciationNote, Badge, Household } from '@/types';

const STORAGE_KEYS = {
  HOUSEHOLD: 'familyflow_household',
  TASKS: 'familyflow_tasks',
  TEMPLATES: 'familyflow_templates',
  NOTES: 'familyflow_notes',
  BADGES: 'familyflow_badges',
};

// Household
export const getHousehold = (): Household | null => {
  const data = localStorage.getItem(STORAGE_KEYS.HOUSEHOLD);
  return data ? JSON.parse(data) : null;
};

export const saveHousehold = (household: Household): void => {
  localStorage.setItem(STORAGE_KEYS.HOUSEHOLD, JSON.stringify(household));
};

// Tasks
export const getTasks = (): Task[] => {
  const data = localStorage.getItem(STORAGE_KEYS.TASKS);
  return data ? JSON.parse(data) : [];
};

export const saveTasks = (tasks: Task[]): void => {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
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
  const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
  return data ? JSON.parse(data) : [];
};

export const saveTemplates = (templates: Template[]): void => {
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
};

// Appreciation Notes
export const getNotes = (): AppreciationNote[] => {
  const data = localStorage.getItem(STORAGE_KEYS.NOTES);
  return data ? JSON.parse(data) : [];
};

export const saveNotes = (notes: AppreciationNote[]): void => {
  localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
};

export const addNote = (note: AppreciationNote): void => {
  const notes = getNotes();
  notes.push(note);
  saveNotes(notes);
};

// Badges
export const getBadges = (): Badge[] => {
  const data = localStorage.getItem(STORAGE_KEYS.BADGES);
  return data ? JSON.parse(data) : [];
};

export const saveBadges = (badges: Badge[]): void => {
  localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(badges));
};