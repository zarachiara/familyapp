import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ArrowRight, ArrowLeft, Users, ListTodo, Star, BarChart3, CheckCircle, Sparkles } from 'lucide-react';
import StepIndicator from '@/components/onboarding/StepIndicator';
import RatingScale from '@/components/onboarding/RatingScale';
import { OnboardingState, OnboardingMember, OnboardingTask, TaskRating, TaskAssignment } from '@/types/onboarding';
import { defaultOnboardingTasks } from '@/utils/onboardingTasks';
import { calculateOptimalAssignments, getWorkloadBalance, calculateFairnessScore } from '@/utils/taskAssignment';
import { useApp } from '@/contexts/AppContext';
import { showSuccess } from '@/utils/toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AVATAR_OPTIONS = ['👨‍💼', '👩‍💼', '👨', '👩', '👦', '👧', '🧑', '👴', '👵'];
const COLOR_OPTIONS = ['#8B5CF6', '#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'];

const Onboarding = () => {
  const navigate = useNavigate();
  const { initializeApp } = useApp();
  
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

  const [newMemberName, setNewMemberName] = useState('');
  const [customTaskName, setCustomTaskName] = useState('');
  const [customTaskCategory, setCustomTaskCategory] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [customTaskMinutes, setCustomTaskMinutes] = useState(30);

  const stepLabels = ['Setup', 'Tasks', 'Rate', 'Reveal', 'Balance', 'Complete'];

  // Step 1: Household Setup
  const addMember = () => {
    if (!newMemberName.trim()) return;

    const newMember: OnboardingMember = {
      id: `member-${Date.now()}`,
      name: newMemberName.trim(),
      avatar: AVATAR_OPTIONS[state.members.length % AVATAR_OPTIONS.length],
      color: COLOR_OPTIONS[state.members.length % COLOR_OPTIONS.length],
      role: state.members.length === 0 ? 'manager' : 'member',
    };

    setState(prev => ({
      ...prev,
      members: [...prev.members, newMember],
    }));
    setNewMemberName('');
  };

  const removeMember = (memberId: string) => {
    setState(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== memberId),
    }));
  };

  // Step 2: Task List
  const addCustomTask = () => {
    if (!customTaskName.trim()) return;

    const newTask: OnboardingTask = {
      id: `task-custom-${Date.now()}`,
      name: customTaskName.trim(),
      category: customTaskCategory,
      estimatedMinutes: customTaskMinutes,
      defaultPoints: Math.round(customTaskMinutes / 3),
    };

    setState(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }));
    setCustomTaskName('');
  };

  const removeTask = (taskId: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId),
    }));
  };

  // Step 3: Rating
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

  // Step 4 & 5: Reveal and Balance
  const workloads = getWorkloadBalance(state.assignments, state.tasks, state.members);
  const fairnessScore = calculateFairnessScore(workloads);

  const reassignTask = (taskId: string, newAssignee: string) => {
    setState(prev => ({
      ...prev,
      assignments: prev.assignments.map(a =>
        a.taskId === taskId ? { ...a, assignedTo: newAssignee, reason: 'manual' } : a
      ),
    }));
  };

  // Step 6: Complete
  const completeOnboarding = () => {
    // Save to localStorage and initialize app
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
      
      // Set due dates based on category
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

  const nextStep = () => {
    if (state.step === 3) {
      nextRatingMember();
    } else {
      setState(prev => ({ ...prev, step: prev.step + 1 }));
    }
  };

  const prevStep = () => {
    if (state.step === 3 && state.currentRatingMember > 0) {
      setState(prev => ({ ...prev, currentRatingMember: prev.currentRatingMember - 1 }));
    } else if (state.step > 1) {
      setState(prev => ({ ...prev, step: prev.step - 1 }));
    }
  };

  const canProceed = () => {
    switch (state.step) {
      case 1:
        return state.householdName.trim() && state.members.length >= 2;
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
        <StepIndicator currentStep={state.step} totalSteps={6} stepLabels={stepLabels} />

        {/* Step Content */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {state.step === 1 && <Users className="w-6 h-6 text-purple-600" />}
              {state.step === 2 && <ListTodo className="w-6 h-6 text-blue-600" />}
              {state.step === 3 && <Star className="w-6 h-6 text-yellow-600" />}
              {state.step === 4 && <Sparkles className="w-6 h-6 text-pink-600" />}
              {state.step === 5 && <BarChart3 className="w-6 h-6 text-green-600" />}
              {state.step === 6 && <CheckCircle className="w-6 h-6 text-green-600" />}
              <span>
                {state.step === 1 && 'Setup Your Household'}
                {state.step === 2 && 'List Your Tasks'}
                {state.step === 3 && `Rate Tasks - ${state.members[state.currentRatingMember]?.name}'s Turn`}
                {state.step === 4 && 'Reveal Ratings & Assignments'}
                {state.step === 5 && 'Balance Workload'}
                {state.step === 6 && 'All Set!'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Household Setup */}
            {state.step === 1 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="householdName">Household Name</Label>
                  <Input
                    id="householdName"
                    value={state.householdName}
                    onChange={e => setState(prev => ({ ...prev, householdName: e.target.value }))}
                    placeholder="e.g., The Smith Family"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Family Members (minimum 2)</Label>
                  <div className="flex space-x-2 mt-2">
                    <Input
                      value={newMemberName}
                      onChange={e => setNewMemberName(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addMember()}
                      placeholder="Enter name"
                    />
                    <Button onClick={addMember} type="button">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {state.members.map((member, index) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{member.avatar}</span>
                          <div>
                            <p className="font-semibold">{member.name}</p>
                            <Badge variant="secondary" className="text-xs">
                              {index === 0 ? 'Manager' : 'Member'}
                            </Badge>
                          </div>
                        </div>
                        {state.members.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMember(member.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Tip:</strong> Add all adults and older children who will participate in household tasks.
                    The first person will be the household manager.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Task List */}
            {state.step === 2 && (
              <div className="space-y-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-800">
                    <strong>📋 Review and customize:</strong> We've pre-loaded common household tasks.
                    Remove any that don't apply and add your own!
                  </p>
                </div>

                {/* Add Custom Task */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <Label>Add Custom Task</Label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2">
                    <Input
                      value={customTaskName}
                      onChange={e => setCustomTaskName(e.target.value)}
                      placeholder="Task name"
                      className="md:col-span-2"
                    />
                    <select
                      value={customTaskCategory}
                      onChange={e => setCustomTaskCategory(e.target.value as any)}
                      className="px-3 py-2 border rounded-md"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    <Button onClick={addCustomTask} type="button" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>

                {/* Task Categories */}
                {(['daily', 'weekly', 'monthly'] as const).map(category => {
                  const categoryTasks = state.tasks.filter(t => t.category === category);
                  if (categoryTasks.length === 0) return null;

                  return (
                    <div key={category}>
                      <h3 className="text-lg font-semibold capitalize mb-3">
                        {category} Tasks ({categoryTasks.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {categoryTasks.map(task => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{task.name}</p>
                              <p className="text-xs text-gray-500">
                                ~{task.estimatedMinutes} min • {task.defaultPoints} pts
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTask(task.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Step 3: Rating */}
            {state.step === 3 && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>⭐ {state.members[state.currentRatingMember]?.name}'s turn:</strong> Rate each task honestly.
                    5 = love it, 1 = hate it. Your ratings are private until everyone finishes!
                  </p>
                </div>

                <div className="space-y-4">
                  {state.tasks.map(task => (
                    <div key={task.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{task.name}</h4>
                          <p className="text-sm text-gray-500">
                            {task.category} • ~{task.estimatedMinutes} min
                          </p>
                        </div>
                        <Badge variant="outline">{task.defaultPoints} pts</Badge>
                      </div>
                      <RatingScale
                        value={getTaskRating(task.id)}
                        onChange={rating => setTaskRating(task.id, rating)}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                  <span className="text-sm text-gray-600">
                    Progress: {state.ratings.filter(r => r.memberId === state.members[state.currentRatingMember]?.id).length} / {state.tasks.length} tasks rated
                  </span>
                  <span className="text-sm font-semibold text-purple-600">
                    {state.currentRatingMember + 1} of {state.members.length} members
                  </span>
                </div>
              </div>
            )}

            {/* Step 4: Reveal Ratings */}
            {state.step === 4 && (
              <div className="space-y-6">
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <p className="text-sm text-pink-800">
                    <strong>✨ Magic moment!</strong> Here's how tasks were assigned based on everyone's preferences.
                    Tasks went to whoever rated them highest, with workload balance considered for ties.
                  </p>
                </div>

                <div className="space-y-3">
                  {state.tasks.map(task => {
                    const assignment = state.assignments.find(a => a.taskId === task.id);
                    const assignedMember = state.members.find(m => m.id === assignment?.assignedTo);
                    const taskRatings = state.ratings.filter(r => r.taskId === task.id);

                    return (
                      <div key={task.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{task.name}</h4>
                            <p className="text-sm text-gray-500">
                              {task.category} • ~{task.estimatedMinutes} min • {task.defaultPoints} pts
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{assignedMember?.avatar}</span>
                            <div>
                              <p className="font-semibold text-sm">{assignedMember?.name}</p>
                              <Badge variant="secondary" className="text-xs">
                                {assignment?.reason === 'preference' && '🎯 Top choice'}
                                {assignment?.reason === 'balance' && '⚖️ Balanced'}
                                {assignment?.reason === 'rotation' && '🔄 Rotation'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Show all ratings */}
                        <div className="flex items-center space-x-4 text-sm">
                          {state.members.map(member => {
                            const rating = taskRatings.find(r => r.memberId === member.id);
                            return (
                              <div key={member.id} className="flex items-center space-x-1">
                                <span>{member.avatar}</span>
                                <span className="font-medium">
                                  {'⭐'.repeat(rating?.rating || 0)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 5: Balance Workload */}
            {state.step === 5 && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-green-800">
                      <strong>⚖️ Fairness Score: {fairnessScore}/100</strong>
                      {fairnessScore >= 80 && ' - Excellent balance!'}
                      {fairnessScore >= 60 && fairnessScore < 80 && ' - Good balance'}
                      {fairnessScore < 60 && ' - Consider adjusting assignments'}
                    </p>
                  </div>
                </div>

                {/* Workload Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Workload Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={workloads}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="memberId" tickFormatter={(id) => state.members.find(m => m.id === id)?.name || ''} />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(id) => state.members.find(m => m.id === id)?.name || ''}
                          formatter={(value: any, name: string) => {
                            if (name === 'totalMinutes') return [`${value} min`, 'Time'];
                            if (name === 'taskCount') return [value, 'Tasks'];
                            return [value, name];
                          }}
                        />
                        <Legend />
                        <Bar dataKey="totalMinutes" fill="#8B5CF6" name="Minutes/Week" />
                        <Bar dataKey="taskCount" fill="#3B82F6" name="Task Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Member Workload Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {workloads.map(workload => {
                    const member = state.members.find(m => m.id === workload.memberId)!;
                    return (
                      <Card key={member.id}>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center space-x-2 text-base">
                            <span className="text-2xl">{member.avatar}</span>
                            <span>{member.name}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tasks:</span>
                              <span className="font-semibold">{workload.taskCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Time/Week:</span>
                              <span className="font-semibold">{Math.round(workload.totalMinutes / 60 * 10) / 10}h</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Points:</span>
                              <span className="font-semibold" style={{ color: member.color }}>
                                {workload.totalPoints}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Manual Adjustments */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Fine-tune Assignments</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Drag tasks between members or click to reassign if needed
                  </p>
                  <div className="space-y-2">
                    {state.tasks.slice(0, 5).map(task => {
                      const assignment = state.assignments.find(a => a.taskId === task.id);
                      const assignedMember = state.members.find(m => m.id === assignment?.assignedTo);

                      return (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{task.name}</p>
                            <p className="text-xs text-gray-500">{task.estimatedMinutes} min</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Assigned to:</span>
                            <select
                              value={assignment?.assignedTo}
                              onChange={e => reassignTask(task.id, e.target.value)}
                              className="px-2 py-1 border rounded text-sm"
                            >
                              {state.members.map(member => (
                                <option key={member.id} value={member.id}>
                                  {member.avatar} {member.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Complete */}
            {state.step === 6 && (
              <div className="space-y-6 text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-gray-900">You're All Set!</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Your household tasks have been fairly distributed based on everyone's preferences.
                  FamilyFlow will help you track progress, celebrate achievements, and maintain balance.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl mb-2">📋</div>
                      <p className="font-semibold">{state.tasks.length} Tasks</p>
                      <p className="text-sm text-gray-600">Ready to manage</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl mb-2">👥</div>
                      <p className="font-semibold">{state.members.length} Members</p>
                      <p className="text-sm text-gray-600">Working together</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl mb-2">⚖️</div>
                      <p className="font-semibold">{fairnessScore}% Fair</p>
                      <p className="text-sm text-gray-600">Balanced workload</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mt-8">
                  <h3 className="font-semibold text-purple-900 mb-2">💡 Pro Tips</h3>
                  <ul className="text-sm text-purple-800 space-y-2 text-left max-w-xl mx-auto">
                    <li>• Review task distribution monthly to adjust as life changes</li>
                    <li>• Use the Fairness Dashboard to track workload balance</li>
                    <li>• Send appreciation notes to celebrate each other's contributions</li>
                    <li>• Earn points and badges to make household work fun!</li>
                  </ul>
                </div>
              </div>
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