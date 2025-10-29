import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { OnboardingTask, OnboardingMember, TaskAssignment, TaskRating } from '@/types/onboarding';
import { getWorkloadBalance, calculateFairnessScore } from '@/utils/taskAssignment';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Step5Props {
  tasks: OnboardingTask[];
  members: OnboardingMember[];
  assignments: TaskAssignment[];
  ratings: TaskRating[];
  onReassignTask: (taskId: string, newAssignee: string) => void;
}

const Step5Balance = ({ tasks, members, assignments, ratings, onReassignTask }: Step5Props) => {
  const [showAllTasks, setShowAllTasks] = useState(false);
  const workloads = getWorkloadBalance(assignments, tasks, members);
  const fairnessScore = calculateFairnessScore(workloads);

  // Calculate optimal reassignments to reach ~100% fairness
  const getOptimalReassignments = () => {
    if (fairnessScore >= 95) return { recommendations: [], projectedScore: fairnessScore };

    const recommendations: Array<{
      taskId: string;
      taskName: string;
      taskMinutes: number;
      taskPoints: number;
      fromMemberId: string;
      toMemberId: string;
      reason: string;
      impact: string;
    }> = [];

    // Create a simulation of workloads
    const simulatedWorkloads = new Map(
      workloads.map(w => [w.memberId, { ...w }])
    );

    // Find tasks that can be reassigned
    const reassignableTasks = assignments.map(a => {
      const task = tasks.find(t => t.id === a.taskId)!;
      const fromRating = ratings.find(r => r.taskId === a.taskId && r.memberId === a.assignedTo);
      
      // Get ratings from all other members
      const otherRatings = members
        .filter(m => m.id !== a.assignedTo)
        .map(m => ({
          memberId: m.id,
          rating: ratings.find(r => r.taskId === a.taskId && r.memberId === m.id)?.rating || 0,
        }));

      return {
        assignment: a,
        task,
        fromRating: fromRating?.rating || 0,
        otherRatings,
      };
    });

    // Iteratively find best reassignments
    let currentScore = fairnessScore;
    let iterations = 0;
    const maxIterations = 10;

    while (currentScore < 95 && iterations < maxIterations) {
      const sortedWorkloads = Array.from(simulatedWorkloads.values())
        .sort((a, b) => b.totalMinutes - a.totalMinutes);
      
      const overloaded = sortedWorkloads[0];
      const underloaded = sortedWorkloads[sortedWorkloads.length - 1];
      
      if (overloaded.totalMinutes - underloaded.totalMinutes < 10) break;

      // Find best task to move
      let bestTask: typeof reassignableTasks[0] | null = null;
      let bestImpact = 0;

      for (const taskInfo of reassignableTasks) {
        if (taskInfo.assignment.assignedTo !== overloaded.memberId) continue;
        if (recommendations.some(r => r.taskId === taskInfo.task.id)) continue;

        const toRating = taskInfo.otherRatings.find(r => r.memberId === underloaded.memberId);
        
        // Calculate impact (prefer neutral/positive ratings and tasks that balance workload)
        const ratingDiff = (toRating?.rating || 0) - taskInfo.fromRating;
        const balanceImprovement = Math.abs(overloaded.totalMinutes - underloaded.totalMinutes) -
          Math.abs((overloaded.totalMinutes - taskInfo.task.estimatedMinutes) -
          (underloaded.totalMinutes + taskInfo.task.estimatedMinutes));
        
        const impact = balanceImprovement + (ratingDiff * 10);
        
        if (impact > bestImpact && (toRating?.rating || 0) >= 2) {
          bestTask = taskInfo;
          bestImpact = impact;
        }
      }

      if (!bestTask) break;

      // Apply the reassignment to simulation
      const fromWorkload = simulatedWorkloads.get(overloaded.memberId)!;
      const toWorkload = simulatedWorkloads.get(underloaded.memberId)!;
      
      fromWorkload.totalMinutes -= bestTask.task.estimatedMinutes;
      fromWorkload.totalPoints -= bestTask.task.defaultPoints;
      fromWorkload.taskCount -= 1;
      
      toWorkload.totalMinutes += bestTask.task.estimatedMinutes;
      toWorkload.totalPoints += bestTask.task.defaultPoints;
      toWorkload.taskCount += 1;

      const toRating = bestTask.otherRatings.find(r => r.memberId === underloaded.memberId);
      const fromMember = members.find(m => m.id === overloaded.memberId)!;
      const toMember = members.find(m => m.id === underloaded.memberId)!;

      recommendations.push({
        taskId: bestTask.task.id,
        taskName: bestTask.task.name,
        taskMinutes: bestTask.task.estimatedMinutes,
        taskPoints: bestTask.task.defaultPoints,
        fromMemberId: overloaded.memberId,
        toMemberId: underloaded.memberId,
        reason: toRating && toRating.rating >= 3
          ? `${toMember.name} rated this ${toRating.rating}/5`
          : toRating && toRating.rating === 2
          ? `${toMember.name} is neutral (2/5)`
          : 'Improves workload balance',
        impact: `Reduces ${fromMember.name}'s time by ${bestTask.task.estimatedMinutes}min, increases ${toMember.name}'s by ${bestTask.task.estimatedMinutes}min`,
      });

      // Recalculate fairness score
      currentScore = calculateFairnessScore(Array.from(simulatedWorkloads.values()));
      iterations++;
    }

    return {
      recommendations,
      projectedScore: Math.round(currentScore),
      projectedWorkloads: Array.from(simulatedWorkloads.values()),
    };
  };

  const optimalPlan = getOptimalReassignments();

  const applyRecommendation = (taskId: string, toMemberId: string) => {
    onReassignTask(taskId, toMemberId);
  };

  const applyAllRecommendations = () => {
    optimalPlan.recommendations.forEach(rec => {
      onReassignTask(rec.taskId, rec.toMemberId);
    });
  };

  // Calculate time per day for each task category
  const calculateDailyTime = (totalMinutes: number, category: 'daily' | 'weekly' | 'monthly') => {
    const memberTasks = assignments.map(a => tasks.find(t => t.id === a.taskId)!);
    const dailyMinutes = memberTasks
      .filter(t => t.category === 'daily')
      .reduce((sum, t) => sum + t.estimatedMinutes, 0);
    const weeklyMinutes = memberTasks
      .filter(t => t.category === 'weekly')
      .reduce((sum, t) => sum + t.estimatedMinutes, 0);
    const monthlyMinutes = memberTasks
      .filter(t => t.category === 'monthly')
      .reduce((sum, t) => sum + t.estimatedMinutes, 0);
    
    return dailyMinutes + (weeklyMinutes / 7) + (monthlyMinutes / 30);
  };

  return (
    <div className="space-y-6">
      <div className={`border rounded-lg p-4 ${
        fairnessScore >= 95 ? 'bg-green-50 border-green-200' :
        fairnessScore >= 70 ? 'bg-blue-50 border-blue-200' :
        'bg-yellow-50 border-yellow-200'
      }`}>
        <p className={`text-sm ${
          fairnessScore >= 95 ? 'text-green-800' :
          fairnessScore >= 70 ? 'text-blue-800' :
          'text-yellow-800'
        }`}>
          <strong>⚖️ Fairness Score: {fairnessScore}/100</strong>
          {fairnessScore >= 95 && ' - Perfect balance! 🎉'}
          {fairnessScore >= 80 && fairnessScore < 95 && ' - Excellent balance!'}
          {fairnessScore >= 70 && fairnessScore < 80 && ' - Good balance'}
          {fairnessScore < 70 && ' - Can be improved'}
        </p>
      </div>

      {fairnessScore < 95 && optimalPlan.recommendations.length > 0 && (
        <Alert className="border-2 border-purple-200 bg-purple-50">
          <AlertCircle className="h-4 w-4 text-purple-600" />
          <AlertDescription>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-purple-900">🎯 Optimal Fairness Plan</p>
                  <p className="text-sm text-purple-800">
                    Apply these {optimalPlan.recommendations.length} reassignment{optimalPlan.recommendations.length !== 1 ? 's' : ''} to reach <strong>{optimalPlan.projectedScore}% fairness</strong>
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={applyAllRecommendations}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Apply All
                </Button>
              </div>
              <div className="space-y-2">
                {optimalPlan.recommendations.map((rec, index) => {
                  const fromMember = members.find(m => m.id === rec.fromMemberId);
                  const toMember = members.find(m => m.id === rec.toMemberId);
                  return (
                    <div key={rec.taskId} className="flex items-start justify-between p-3 bg-white rounded border border-purple-200">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                            #{index + 1}
                          </span>
                          <p className="font-medium text-sm">{rec.taskName}</p>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">
                          {fromMember?.avatar} {fromMember?.name} → {toMember?.avatar} {toMember?.name}
                        </p>
                        <p className="text-xs text-gray-500 mb-1">{rec.reason}</p>
                        <p className="text-xs text-purple-600">
                          📊 {rec.taskMinutes} min • {rec.taskPoints} pts
                        </p>
                        <p className="text-xs text-gray-400 italic">{rec.impact}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyRecommendation(rec.taskId, rec.toMemberId)}
                        className="ml-2"
                      >
                        Apply
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workload Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={workloads}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="memberId" 
                tickFormatter={(id) => members.find(m => m.id === id)?.name || ''} 
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(id) => members.find(m => m.id === id)?.name || ''}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {workloads.map(workload => {
          const member = members.find(m => m.id === workload.memberId)!;
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
                    <span className="text-gray-600">Time/Day:</span>
                    <span className="font-semibold">
                      {Math.round(calculateDailyTime(workload.totalMinutes, 'daily'))}min
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time/Week:</span>
                    <span className="font-semibold">
                      {Math.round(workload.totalMinutes / 60 * 10) / 10}h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Points/Week:</span>
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

      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold">Manual Task Reassignment</h3>
            <p className="text-sm text-gray-600">
              Adjust task assignments manually to achieve better balance
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllTasks(!showAllTasks)}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {showAllTasks ? 'Show Less' : 'Show All Tasks'}
          </Button>
        </div>
        <div className="space-y-2">
          {(showAllTasks ? tasks : tasks.slice(0, 5)).map(task => {
            const assignment = assignments.find(a => a.taskId === task.id);
            const assignedMember = members.find(m => m.id === assignment?.assignedTo);

            return (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{task.name}</p>
                  <p className="text-xs text-gray-500">
                    {task.category} • {task.estimatedMinutes} min • {task.defaultPoints} pts
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Assigned to:</span>
                  <select
                    value={assignment?.assignedTo}
                    onChange={e => onReassignTask(task.id, e.target.value)}
                    className="px-3 py-2 border rounded text-sm"
                    style={{
                      borderColor: assignedMember?.color,
                      backgroundColor: `${assignedMember?.color}10`
                    }}
                  >
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.avatar} {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
          {!showAllTasks && tasks.length > 5 && (
            <p className="text-sm text-gray-500 text-center pt-2">
              {tasks.length - 5} more task{tasks.length - 5 !== 1 ? 's' : ''} available
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step5Balance;