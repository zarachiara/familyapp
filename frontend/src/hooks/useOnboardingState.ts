import { useState } from 'react';
import { OnboardingState, OnboardingMember, OnboardingTask, TaskRating } from '@/types/onboarding';
import { defaultOnboardingTasks, sampleTasksForRounds } from '@/utils/onboardingTasks';
import { calculateOptimalAssignments } from '@/utils/taskAssignment';

const AVATAR_OPTIONS = ['👨‍💼', '👩‍💼', '👨', '👩', '👦', '👧', '🧑', '👴', '👵'];
const COLOR_OPTIONS = ['#8B5CF6', '#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'];

export const useOnboardingState = () => {
  const [state, setState] = useState<OnboardingState>({
    step: 1,
    householdName: '',
    members: [],
    tasks: defaultOnboardingTasks,
    sampledTasks: [],
    ratings: [],
    assignments: [],
    currentRatingMember: 0,
    currentRound: 0,
    totalRounds: 0,
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

  // Infer ratings for unrated tasks based on domain patterns and category similarity
  const inferRatingsForUnratedTasks = () => {
    const allTasks = state.tasks;
    const sampledTaskIds = new Set(state.sampledTasks.map(t => t.id));
    const unratedTasks = allTasks.filter(t => !sampledTaskIds.has(t.id));

    const inferredRatings: TaskRating[] = [];

    state.members.forEach(member => {
      // Get member's ratings for sampled tasks
      const memberRatings = state.ratings.filter(r => r.memberId === member.id);
      
      // Calculate average rating per domain
      const domainAverages = new Map<string, { sum: number; count: number }>();
      // Calculate average rating per category
      const categoryAverages = new Map<string, { sum: number; count: number }>();
      
      memberRatings.forEach(rating => {
        const task = state.sampledTasks.find(t => t.id === rating.taskId);
        if (task) {
          // Domain averages
          const domainCurrent = domainAverages.get(task.domain) || { sum: 0, count: 0 };
          domainAverages.set(task.domain, {
            sum: domainCurrent.sum + rating.rating,
            count: domainCurrent.count + 1,
          });
          
          // Category averages
          const categoryCurrent = categoryAverages.get(task.category) || { sum: 0, count: 0 };
          categoryAverages.set(task.category, {
            sum: categoryCurrent.sum + rating.rating,
            count: categoryCurrent.count + 1,
          });
        }
      });

      // Infer ratings for unrated tasks using weighted average of domain and category
      unratedTasks.forEach(task => {
        const domainAvg = domainAverages.get(task.domain);
        const categoryAvg = categoryAverages.get(task.category);
        
        let inferredRating = 3; // Default neutral
        
        if (domainAvg && categoryAvg) {
          // Weight domain more heavily (70%) than category (30%)
          const domainScore = domainAvg.sum / domainAvg.count;
          const categoryScore = categoryAvg.sum / categoryAvg.count;
          inferredRating = Math.round(domainScore * 0.7 + categoryScore * 0.3);
        } else if (domainAvg) {
          // Only domain data available
          inferredRating = Math.round(domainAvg.sum / domainAvg.count);
        } else if (categoryAvg) {
          // Only category data available
          inferredRating = Math.round(categoryAvg.sum / categoryAvg.count);
        }
        
        // Ensure rating is within valid range
        inferredRating = Math.max(1, Math.min(5, inferredRating));
        
        inferredRatings.push({
          taskId: task.id,
          memberId: member.id,
          rating: inferredRating,
        });
      });
    });

    return inferredRatings;
  };

  const nextRatingMember = () => {
    if (state.currentRatingMember < state.members.length - 1) {
      setState(prev => ({ ...prev, currentRatingMember: prev.currentRatingMember + 1 }));
    } else {
      // All members have rated sampled tasks, infer the rest
      const inferredRatings = inferRatingsForUnratedTasks();
      const allRatings = [...state.ratings, ...inferredRatings];
      
      // Calculate assignments with all ratings (sampled + inferred)
      const assignments = calculateOptimalAssignments(state.tasks, allRatings, state.members);
      setState(prev => ({ ...prev, ratings: allRatings, assignments, step: 4 }));
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
    if (state.step === 2) {
      // Moving from task list to rating - sample max 10 tasks to avoid user fatigue
      const sampledTasks = sampleTasksForRounds(10); // Max 10 tasks for rating
      setState(prev => ({
        ...prev,
        step: 3,
        sampledTasks,
        totalRounds: 1, // Single round with all sampled tasks
      }));
    } else if (state.step === 3) {
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
        return memberRatings.length === state.sampledTasks.length;
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