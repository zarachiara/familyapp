import { useState } from 'react';
import { SyncState, MemberCapacity, SyncScope, CustomDateRange } from '@/types/sync';
import { FamilyMember } from '@/types';

export const useSyncState = (members: FamilyMember[]) => {
  const [state, setState] = useState<SyncState>({
    currentStep: 1,
    scope: 'week',
    customDateRange: undefined,
    reason: '',
    customReason: undefined,
    memberCapacities: members.map(member => ({
      memberId: member.id,
      memberName: member.name,
      workloadLevel: 3,
      energyLevel: 3,
      emotionalCapacity: 3,
      notes: '',
    })),
    currentCapacityMember: 0,
    isComplete: false,
  });

  const setScope = (scope: SyncScope) => {
    setState(prev => ({ ...prev, scope }));
  };

  const setCustomDateRange = (dateRange: CustomDateRange) => {
    setState(prev => ({ ...prev, customDateRange: dateRange }));
  };

  const setReason = (reason: string) => {
    setState(prev => ({ ...prev, reason }));
  };

  const setCustomReason = (customReason: string) => {
    setState(prev => ({ ...prev, customReason }));
  };

  const updateMemberCapacity = (memberId: string, updates: Partial<MemberCapacity>) => {
    setState(prev => ({
      ...prev,
      memberCapacities: prev.memberCapacities.map(cap =>
        cap.memberId === memberId ? { ...cap, ...updates } : cap
      ),
    }));
  };

  const nextStep = () => {
    setState(prev => {
      // If on capacity step and not the last member, move to next member
      if (prev.currentStep === 2 && prev.currentCapacityMember < members.length - 1) {
        return {
          ...prev,
          currentCapacityMember: prev.currentCapacityMember + 1,
        };
      }
      // Otherwise move to next step
      return {
        ...prev,
        currentStep: prev.currentStep + 1,
        currentCapacityMember: prev.currentStep === 2 ? 0 : prev.currentCapacityMember,
      };
    });
  };

  const prevStep = () => {
    setState(prev => {
      // If on capacity step and not the first member, go to previous member
      if (prev.currentStep === 2 && prev.currentCapacityMember > 0) {
        return {
          ...prev,
          currentCapacityMember: prev.currentCapacityMember - 1,
        };
      }
      // Otherwise go to previous step
      return {
        ...prev,
        currentStep: Math.max(1, prev.currentStep - 1),
        currentCapacityMember: prev.currentStep === 3 ? members.length - 1 : prev.currentCapacityMember,
      };
    });
  };

  const canProceed = (): boolean => {
    switch (state.currentStep) {
      case 1:
        // Must select a reason, and if custom, must provide text
        return state.reason !== '' && (state.reason !== 'custom' || (state.customReason?.trim().length || 0) > 0);
      case 2:
        // All capacity fields must be set (they have defaults, so always true)
        return true;
      case 3:
        // Can always proceed from recalibration
        return true;
      case 4:
        // Complete step
        return true;
      default:
        return false;
    }
  };

  const completeSync = () => {
    setState(prev => ({ ...prev, isComplete: true }));
  };

  return {
    state,
    setScope,
    setCustomDateRange,
    setReason,
    setCustomReason,
    updateMemberCapacity,
    nextStep,
    prevStep,
    canProceed,
    completeSync,
  };
};