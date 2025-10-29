import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, FamilyMember, Template, AppreciationNote, Badge, Household } from '@/types';
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
} from '@/utils/storage';
import {
  createMockHousehold,
  createMockTasks,
  createMockTemplates,
  createMockBadges,
} from '@/utils/mockData';

interface AppContextType {
  household: Household | null;
  tasks: Task[];
  templates: Template[];
  notes: AppreciationNote[];
  badges: Badge[];
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  batchUpdateTasks: (updates: Array<{ taskId: string; updates: Partial<Task> }>) => void;
  deleteTask: (taskId: string) => void;
  addTemplate: (template: Template) => void;
  addAppreciationNote: (note: AppreciationNote) => void;
  updateMemberPoints: (memberId: string, points: number) => void;
  initializeApp: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [household, setHousehold] = useState<Household | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [notes, setNotes] = useState<AppreciationNote[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);

  const initializeApp = () => {
    let householdData = getHousehold();
    if (!householdData) {
      householdData = createMockHousehold();
      saveHousehold(householdData);
    }
    setHousehold(householdData);

    let tasksData = getTasks();
    if (tasksData.length === 0) {
      tasksData = createMockTasks();
      saveTasks(tasksData);
    }
    setTasks(tasksData);

    let templatesData = getTemplates();
    if (templatesData.length === 0) {
      templatesData = createMockTemplates();
      saveTemplates(templatesData);
    }
    setTemplates(templatesData);

    const notesData = getNotes();
    setNotes(notesData);

    let badgesData = getBadges();
    if (badgesData.length === 0) {
      badgesData = createMockBadges();
      saveBadges(badgesData);
    }
    setBadges(badgesData);
  };

  useEffect(() => {
    initializeApp();
  }, []);

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

  return (
    <AppContext.Provider
      value={{
        household,
        tasks,
        templates,
        notes,
        badges,
        addTask,
        updateTask,
        batchUpdateTasks,
        deleteTask,
        addTemplate,
        addAppreciationNote,
        updateMemberPoints,
        initializeApp,
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