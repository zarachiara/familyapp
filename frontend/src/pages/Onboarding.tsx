import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Users, ListTodo, Star, BarChart3, CheckCircle, Sparkles } from 'lucide-react';
import StepIndicator from '@/components/onboarding/StepIndicator';
import Step1HouseholdSetup from '@/components/onboarding/steps/Step1HouseholdSetup';
import Step2TaskList from '@/components/onboarding/steps/Step2TaskList';
import Step3Rating from '@/components/onboarding/steps/Step3Rating';
import Step4Reveal from '@/components/onboarding/steps/Step4Reveal';
import Step5Balance from '@/components/onboarding/steps/Step5Balance';
import Step6Complete from '@/components/onboarding/steps/Step6Complete';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { useApp } from '@/contexts/AppContext';
import { showSuccess } from '@/utils/toast';
import { getWorkloadBalance, calculateFairnessScore } from '@/utils/taskAssignment';

const STEP_LABELS = ['Setup', 'Tasks', 'Rate', 'Reveal', 'Balance', 'Complete'];

const STEP_ICONS = {
  1: Users,
  2: ListTodo,
  3: Star,
  4: Sparkles,
  5: BarChart3,
  6: CheckCircle,
};

const STEP_TITLES = {
  1: 'Setup Your Household',
  2: 'List Your Tasks',
  3: (memberName: string) => `Rate Tasks - ${memberName}'s Turn`,
  4: 'Reveal Ratings & Assignments',
  5: 'Balance Workload',
  6: 'All Set!',
};

const STEP_COLORS = {
  1: 'text-purple-600',
  2: 'text-blue-600',
  3: 'text-yellow-600',
  4: 'text-pink-600',
  5: 'text-green-600',
  6: 'text-green-600',
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { initializeApp } = useApp();
  
  const {
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
  } = useOnboardingState();

  const completeOnboarding = () => {
    const household = {
      id: 'household-1',
      name: state.householdName,
      managerId: state.members[0].id,
      members: state.members.map(m => ({
        ...m,
        points: 0,
        tasksCompleted: 0,
      })),
    };

    const tasks = state.assignments.map((assignment, index) => {
      const task = state.tasks.find(t => t.id === assignment.taskId)!;
      const dueDate = new Date();
      
      if (task.category === 'daily') {
        dueDate.setHours(dueDate.getHours() + 12);
      } else if (task.category === 'weekly') {
        dueDate.setDate(dueDate.getDate() + 3);
      } else {
        dueDate.setDate(dueDate.getDate() + 14);
      }

      return {
        id: `task-${Date.now()}-${index}`,
        title: task.name,
        description: `${task.category.charAt(0).toUpperCase() + task.category.slice(1)} household task`,
        assigneeId: assignment.assignedTo,
        dueDate: dueDate.toISOString(),
        status: 'todo' as const,
        recurrence: task.category === 'daily' ? 'daily' : task.category === 'weekly' ? 'weekly' : 'monthly',
        room: 'General',
        points: task.defaultPoints,
        createdBy: household.managerId,
        createdAt: new Date().toISOString(),
        estimatedMinutes: task.estimatedMinutes,
      };
    });

    localStorage.setItem('familyflow_household', JSON.stringify(household));
    localStorage.setItem('familyflow_tasks', JSON.stringify(tasks));
    
    showSuccess('🎉 Welcome to FamilyFlow! Your household is all set up.');
    initializeApp();
    navigate('/');
  };

  const currentMember = state.members[state.currentRatingMember];
  const StepIcon = STEP_ICONS[state.step as keyof typeof STEP_ICONS];
  const stepTitle = typeof STEP_TITLES[state.step as keyof typeof STEP_TITLES] === 'function'
    ? (STEP_TITLES[state.step as keyof typeof STEP_TITLES] as Function)(currentMember?.name)
    : STEP_TITLES[state.step as keyof typeof STEP_TITLES];
  const stepColor = STEP_COLORS[state.step as keyof typeof STEP_COLORS];

  const workloads = getWorkloadBalance(state.assignments, state.tasks, state.members);
  const fairnessScore = calculateFairnessScore(workloads);
  const ratedTasksCount = state.ratings.filter(r => r.memberId === currentMember?.id).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-4xl">🏠</span>
            <h1 className="text-4xl font-bold text-gray-900">FamilyFlow</h1>
          </div>
          <p className="text-lg text-gray-600">
            Let's set up your household for fair and balanced task management
          </p>
        </div>

        {/* Progress Indicator */}
        <StepIndicator currentStep={state.step} totalSteps={6} stepLabels={STEP_LABELS} />

        {/* Step Content */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <StepIcon className={`w-6 h-6 ${stepColor}`} />
              <span>{stepTitle}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {state.step === 1 && (
              <Step1HouseholdSetup
                householdName={state.householdName}
                members={state.members}
                onHouseholdNameChange={setHouseholdName}
                onAddMember={addMember}
                onRemoveMember={removeMember}
              />
            )}

            {state.step === 2 && (
              <Step2TaskList
                tasks={state.tasks}
                onAddTask={addTask}
                onRemoveTask={removeTask}
              />
            )}

            {state.step === 3 && (
              <Step3Rating
                tasks={state.tasks}
                currentMember={currentMember}
                currentMemberIndex={state.currentRatingMember}
                totalMembers={state.members.length}
                ratedTasksCount={ratedTasksCount}
                getTaskRating={getTaskRating}
                onSetRating={setTaskRating}
              />
            )}

            {state.step === 4 && (
              <Step4Reveal
                tasks={state.tasks}
                members={state.members}
                ratings={state.ratings}
                assignments={state.assignments}
              />
            )}

            {state.step === 5 && (
              <Step5Balance
                tasks={state.tasks}
                members={state.members}
                assignments={state.assignments}
                onReassignTask={reassignTask}
              />
            )}

            {state.step === 6 && (
              <Step6Complete
                taskCount={state.tasks.length}
                memberCount={state.members.length}
                fairnessScore={fairnessScore}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={state.step === 1 || (state.step === 3 && state.currentRatingMember === 0)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {state.step < 6 ? (
            <Button onClick={nextStep} disabled={!canProceed()}>
              {state.step === 3 && state.currentRatingMember < state.members.length - 1
                ? `Next Member (${state.members[state.currentRatingMember + 1]?.name})`
                : 'Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={completeOnboarding} size="lg" className="px-8">
              Start Using FamilyFlow
              <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;