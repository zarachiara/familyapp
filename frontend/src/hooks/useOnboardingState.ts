import { useState } from 'react';
import { OnboardingState, OnboardingMember, OnboardingTask, TaskRating } from '@/types/onboarding';
import { defaultOnboardingTasks } from '@/utils/onboardingTasks';
import { calculateOptimalAssignments } from '@/utils/taskAssignment';

const AVATAR_OPTIONS = ['👨‍💼', '👩‍💼', '👨', '👩', '👦', '👧', '🧑', '👴', '👵'];
const COLOR_OPTIONS = ['#8B5CF6', '#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'];

export const useOnboardingState = () => {
  const [state, setState] = useState<OnboardingState>({
    step: 1,
    householdName: '',
    members: [],
    tasks: defaultOnboardingTasks,
    ratings: [],
    assignments: [],
    currentRatingMember: 0,
    isComplete: false,
  });

  const setHouseholdName = (name: string) => {
    setState(prev => ({ ...prev, householdName: name }));
  };

  const addMember = (name: string) => {
    if (!name.trim()) return;

    const newMember: OnboardingMember = {
      id: `member-${Date.now()}`,
      name: name.trim(),
      avatar: AVATAR_OPTIONS[state.members.length % AVATAR_OPTIONS.length],
      color: COLOR_OPTIONS[state.members.length % COLOR_OPTIONS.length],
      role: state.members.length === 0 ? 'manager' : 'member',
    };

    setState(prev => ({
      ...prev,
      members: [...prev.members, newMember],
    }));
  };

  const removeMember = (memberId: string) => {
    setState(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== memberId),
    }));
  };

  const addTask = (task: OnboardingTask) => {
    setState(prev => ({
      ...prev,
      tasks: [...prev.tasks, task],
    }));
  };

  const removeTask = (taskId: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId),
    }));
  };

  const setTaskRating = (taskId: string, rating: number) => {
    const currentMember = state.members[state.currentRatingMember];
    
    setState(prev => {
      const existingRatingIndex = prev.ratings.findIndex(
        r => r.taskId === taskId && r.memberId === currentMember.id
      );

      let newRatings = [...prev.ratings];
      
      if (existingRatingIndex >= 0) {
        newRatings[existingRatingIndex] = { taskId, memberId: currentMember.id, rating };
      } else {
        newRatings.push({ taskId, memberId: currentMember.id, rating });
      }

      return { ...prev, ratings: newRatings };
    });
  };

  const getTaskRating = (taskId: string): number => {
    const currentMember = state.members[state.currentRatingMember];
    const rating = state.ratings.find(r => r.taskId === taskId && r.memberId === currentMember.id);
    return rating?.rating || 0;
  };

  const nextRatingMember = () => {
    if (state.currentRatingMember < state.members.length - 1) {
      setState(prev => ({ ...prev, currentRatingMember: prev.currentRatingMember + 1 }));
    } else {
      // All members have rated, calculate assignments
      const assignments = calculateOptimalAssignments(state.tasks, state.ratings, state.members);
      setState(prev => ({ ...prev, assignments, step: 4 }));
    }
  };

  const prevRatingMember = () => {
    if (state.currentRatingMember > 0) {
      setState(prev => ({ ...prev, currentRatingMember: prev.currentRatingMember - 1 }));
    }
  };

  const reassignTask = (taskId: string, newAssignee: string) => {
    setState(prev => ({
      ...prev,
      assignments: prev.assignments.map(a =>
        a.taskId === taskId ? { ...a, assignedTo: newAssignee, reason: 'manual' } : a
      ),
    }));
  };

  const nextStep = () => {
    if (state.step === 3) {
      nextRatingMember();
    } else {
      setState(prev => ({ ...prev, step: prev.step + 1 }));
    }
  };

  const prevStep = () => {
    if (state.step === 3 && state.currentRatingMember > 0) {
      prevRatingMember();
    } else if (state.step > 1) {
      setState(prev => ({ ...prev, step: prev.step - 1 }));
    }
  };

  const canProceed = (): boolean => {
    switch (state.step) {
      case 1:
        return state.householdName.trim() !== '' && state.members.length >= 2;
      case 2:
        return state.tasks.length > 0;
      case 3:
        const currentMember = state.members[state.currentRatingMember];
        const memberRatings = state.ratings.filter(r => r.memberId === currentMember.id);
        return memberRatings.length === state.tasks.length;
      case 4:
      case 5:
        return true;
      default:
        return false;
    }
  };

  return {
    state,
    setHouseholdName,
    addMember,
    removeMember,
    addTask,
    removeTask,
    setTaskRating,
    getTaskRating,
    reassignTask,
    nextStep,
    prevStep,
    canProceed,
  };
};