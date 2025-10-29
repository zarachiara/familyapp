import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, RefreshCw, Users, TrendingUp, CheckCircle } from 'lucide-react';
import StepIndicator from '@/components/onboarding/StepIndicator';
import SyncStep1Reason from '@/components/sync/steps/SyncStep1Reason';
import SyncStep2Capacity from '@/components/sync/steps/SyncStep2Capacity';
import SyncStep3Recalibration from '@/components/sync/steps/SyncStep3Recalibration';
import SyncStep4Complete from '@/components/sync/steps/SyncStep4Complete';
import { useSyncState } from '@/hooks/useSyncState';
import { useApp } from '@/contexts/AppContext';
import { showSuccess } from '@/utils/toast';
import { filterTasksByScope } from '@/utils/taskFilters';
import { Task } from '@/types';

const STEP_LABELS = ['Reason', 'Capacity', 'Recalibrate', 'Complete'];

const STEP_ICONS = {
  1: RefreshCw,
  2: Users,
  3: TrendingUp,
  4: CheckCircle,
};

const STEP_TITLES = {
  1: 'Why Are You Syncing?',
  2: (memberName: string) => `${memberName}'s Capacity Check`,
  3: 'Review Recalibration',
  4: 'Sync Complete!',
};

const STEP_COLORS = {
  1: 'text-blue-600',
  2: 'text-yellow-600',
  3: 'text-green-600',
  4: 'text-green-600',
};

const FairnessSync = () => {
  const navigate = useNavigate();
  const { household, tasks, batchUpdateTasks } = useApp();

  if (!household) {
    navigate('/');
    return null;
  }

  const {
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
  } = useSyncState(household.members);

  // Filter tasks by scope - only include unstarted tasks within the time window
  const scopedTasks = filterTasksByScope(tasks, state.scope, state.customDateRange);

  // Get current assignments (only for scoped tasks)
  const currentAssignments: Record<string, string[]> = {};
  household.members.forEach(member => {
    currentAssignments[member.id] = scopedTasks
      .filter(task => task.assigneeId === member.id)
      .map(task => task.id);
  });

  const applyRecalibration = (newAssignments: Record<string, string[]>) => {
    // Collect all task updates that need to be applied
    const taskUpdates: Array<{ taskId: string; updates: Partial<Task> }> = [];
    
    // For each member's new task list, update the assigneeId
    Object.entries(newAssignments).forEach(([memberId, taskIds]) => {
      taskIds.forEach(taskId => {
        const task = tasks.find(t => t.id === taskId);
        // Only update if the assignee actually changed
        if (task && task.assigneeId !== memberId) {
          taskUpdates.push({
            taskId,
            updates: { assigneeId: memberId }
          });
        }
      });
    });
    
    // Apply all updates in a single batch operation
    if (taskUpdates.length > 0) {
      batchUpdateTasks(taskUpdates);
    }

    // Calculate tasks affected
    let tasksAffected = 0;
    Object.entries(newAssignments).forEach(([memberId, taskIds]) => {
      const oldTaskIds = currentAssignments[memberId] || [];
      const added = taskIds.filter(id => !oldTaskIds.includes(id));
      const removed = oldTaskIds.filter(id => !taskIds.includes(id));
      tasksAffected += added.length + removed.length;
    });

    // Save sync session to localStorage
    const syncSession = {
      id: `sync-${Date.now()}`,
      timestamp: new Date(),
      reason: state.reason === 'custom' ? state.customReason : state.reason,
      memberCapacities: state.memberCapacities,
      previousAssignments: currentAssignments,
      newAssignments,
      tasksAffected: tasksAffected / 2, // Divide by 2 since we count both add and remove
    };

    const syncHistory = JSON.parse(localStorage.getItem('familyflow_sync_history') || '[]');
    syncHistory.push(syncSession);
    localStorage.setItem('familyflow_sync_history', JSON.stringify(syncHistory));

    showSuccess('✨ Tasks have been recalibrated successfully!');
    completeSync();
    nextStep();
  };

  const finishSync = () => {
    navigate('/tasks');
  };

  const currentMember = household.members[state.currentCapacityMember];
  const StepIcon = STEP_ICONS[state.currentStep as keyof typeof STEP_ICONS];
  const stepTitle = typeof STEP_TITLES[state.currentStep as keyof typeof STEP_TITLES] === 'function'
    ? (STEP_TITLES[state.currentStep as keyof typeof STEP_TITLES] as Function)(currentMember?.name)
    : STEP_TITLES[state.currentStep as keyof typeof STEP_TITLES];
  const stepColor = STEP_COLORS[state.currentStep as keyof typeof STEP_COLORS];

  // Calculate tasks affected for completion step
  const tasksAffected = state.currentStep === 4 
    ? JSON.parse(localStorage.getItem('familyflow_sync_history') || '[]').slice(-1)[0]?.tasksAffected || 0
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-4xl">🔄</span>
            <h1 className="text-4xl font-bold text-gray-900">Fairness Sync</h1>
          </div>
          <p className="text-lg text-gray-600">
            Recalibrate your household tasks based on current capacity and workload
          </p>
        </div>

        {/* Progress Indicator */}
        <StepIndicator currentStep={state.currentStep} totalSteps={4} stepLabels={STEP_LABELS} />

        {/* Step Content */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <StepIcon className={`w-6 h-6 ${stepColor}`} />
              <span>{stepTitle}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {state.currentStep === 1 && (
              <SyncStep1Reason
                selectedScope={state.scope}
                customDateRange={state.customDateRange}
                selectedReason={state.reason}
                customReason={state.customReason}
                onSelectScope={setScope}
                onCustomDateRangeChange={setCustomDateRange}
                onSelectReason={setReason}
                onCustomReasonChange={setCustomReason}
              />
            )}

            {state.currentStep === 2 && (
              <SyncStep2Capacity
                members={household.members}
                currentMember={currentMember}
                currentMemberIndex={state.currentCapacityMember}
                capacity={state.memberCapacities[state.currentCapacityMember]}
                onUpdateCapacity={(updates) => 
                  updateMemberCapacity(currentMember.id, updates)
                }
              />
            )}

            {state.currentStep === 3 && (
              <SyncStep3Recalibration
                tasks={scopedTasks}
                members={household.members}
                capacities={state.memberCapacities}
                currentAssignments={currentAssignments}
                onApplyRecalibration={applyRecalibration}
              />
            )}

            {state.currentStep === 4 && (
              <SyncStep4Complete
                fairnessScore={95} // This would come from the recalibration result
                memberCount={household.members.length}
                tasksAffected={tasksAffected}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={state.currentStep === 1 || (state.currentStep === 2 && state.currentCapacityMember === 0)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {state.currentStep < 3 ? (
            <Button onClick={nextStep} disabled={!canProceed()}>
              {state.currentStep === 2 && state.currentCapacityMember < household.members.length - 1
                ? `Next Member (${household.members[state.currentCapacityMember + 1]?.name})`
                : 'Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : state.currentStep === 3 ? (
            <div className="text-sm text-gray-500">
              Review and apply recalibration above
            </div>
          ) : (
            <Button onClick={finishSync} size="lg" className="px-8">
              Go to Tasks
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Cancel Button */}
        {state.currentStep < 4 && (
          <div className="text-center mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/tasks')}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel Sync
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FairnessSync;