import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Task, FamilyMember } from '@/types';
import { MemberCapacity } from '@/types/sync';
import { 
  recalibrateTaskAssignments, 
  getCapacityDescription,
  getRecommendedRedistribution 
} from '@/utils/syncCalculations';
import { AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SyncStep3Props {
  tasks: Task[];
  members: FamilyMember[];
  capacities: MemberCapacity[];
  currentAssignments: Record<string, string[]>;
  onApplyRecalibration: (newAssignments: Record<string, string[]>) => void;
}

const SyncStep3Recalibration = ({
  tasks,
  members,
  capacities,
  currentAssignments,
  onApplyRecalibration,
}: SyncStep3Props) => {
  const [showDetails, setShowDetails] = useState(false);

  // Calculate recalibration
  const recalibration = recalibrateTaskAssignments(
    tasks,
    members,
    capacities,
    currentAssignments
  );

  // Get recommendations
  const recommendations = getRecommendedRedistribution(
    tasks,
    members,
    capacities,
    currentAssignments
  );

  // Calculate current fairness
  const currentLoads = members.map(member => {
    const taskIds = currentAssignments[member.id] || [];
    const totalMinutes = taskIds.reduce((sum, id) => {
      const task = tasks.find(t => t.id === id);
      return sum + (task?.estimatedMinutes || 0);
    }, 0);
    return { memberId: member.id, totalMinutes, taskCount: taskIds.length };
  });

  const avgLoad = currentLoads.reduce((sum, l) => sum + l.totalMinutes, 0) / currentLoads.length;
  const variance = currentLoads.reduce((sum, l) => sum + Math.pow(l.totalMinutes - avgLoad, 2), 0) / currentLoads.length;
  const stdDev = Math.sqrt(variance);
  const currentFairness = Math.max(0, Math.round(100 - (stdDev / (avgLoad * 0.5)) * 100));

  // Prepare chart data
  const chartData = members.map(member => {
    const currentTaskIds = currentAssignments[member.id] || [];
    const newTaskIds = recalibration.newAssignments[member.id] || [];
    
    const currentMinutes = currentTaskIds.reduce((sum, id) => {
      const task = tasks.find(t => t.id === id);
      return sum + (task?.estimatedMinutes || 0);
    }, 0);
    
    const newMinutes = newTaskIds.reduce((sum, id) => {
      const task = tasks.find(t => t.id === id);
      return sum + (task?.estimatedMinutes || 0);
    }, 0);

    return {
      name: member.name,
      current: currentMinutes,
      proposed: newMinutes,
    };
  });

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          <strong>🎯 Recalibration Complete!</strong> Based on everyone's capacity, here's the recommended task distribution.
          Review the changes and apply when ready.
        </p>
      </div>

      {/* Fairness Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Current Fairness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-600 mb-2">
                {currentFairness}%
              </div>
              <p className="text-sm text-gray-500">Based on current assignments</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <span>Projected Fairness</span>
              <Badge variant="default" className="bg-green-500">New</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {recalibration.fairnessScore}%
              </div>
              <p className="text-sm text-gray-500">
                {recalibration.fairnessScore > currentFairness ? (
                  <span className="text-green-600 font-medium">
                    +{recalibration.fairnessScore - currentFairness}% improvement
                  </span>
                ) : (
                  <span className="text-gray-600">After recalibration</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workload Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workload Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Minutes/Week', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="current" fill="#9CA3AF" name="Current" />
              <Bar dataKey="proposed" fill="#10B981" name="Proposed" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Member Capacity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {capacities.map(capacity => {
          const member = members.find(m => m.id === capacity.memberId)!;
          const change = recalibration.changes.find(c => c.memberId === member.id)!;
          
          // Calculate current and new totals
          const currentTaskIds = currentAssignments[member.id] || [];
          const newTaskIds = recalibration.newAssignments[member.id] || [];
          
          const currentMinutes = currentTaskIds.reduce((sum, id) => {
            const task = tasks.find(t => t.id === id);
            return sum + (task?.estimatedMinutes || 0);
          }, 0);
          
          const currentPoints = currentTaskIds.reduce((sum, id) => {
            const task = tasks.find(t => t.id === id);
            return sum + (task?.points || 0);
          }, 0);
          
          const newMinutes = newTaskIds.reduce((sum, id) => {
            const task = tasks.find(t => t.id === id);
            return sum + (task?.estimatedMinutes || 0);
          }, 0);
          
          const newPoints = newTaskIds.reduce((sum, id) => {
            const task = tasks.find(t => t.id === id);
            return sum + (task?.points || 0);
          }, 0);
          
          return (
            <Card key={member.id} className="border-2" style={{ borderColor: member.color }}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <span className="text-2xl">{member.avatar}</span>
                  <span>{member.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-gray-600">
                  {getCapacityDescription(capacity)}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Workload:</span>
                    <Badge variant="outline" className="text-xs">
                      {capacity.workloadLevel}/5
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Energy:</span>
                    <Badge variant="outline" className="text-xs">
                      {capacity.energyLevel}/5
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Emotional:</span>
                    <Badge variant="outline" className="text-xs">
                      {capacity.emotionalCapacity}/5
                    </Badge>
                  </div>
                </div>

                <div className="pt-2 border-t space-y-2">
                  {/* Current vs New Minutes */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Minutes:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">{currentMinutes}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium text-green-600">{newMinutes}</span>
                    </div>
                  </div>
                  
                  {/* Current vs New Points */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Points:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">{currentPoints}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium text-green-600">{newPoints}</span>
                    </div>
                  </div>
                  
                  {/* Task Change Summary */}
                  <div className="flex items-center justify-between text-sm pt-1 border-t">
                    <span className="text-gray-600">Change:</span>
                    <div className="flex items-center space-x-1">
                      {change.loadChange > 0 ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-orange-500" />
                          <span className="text-orange-600 font-medium">+{change.loadChange}min</span>
                        </>
                      ) : change.loadChange < 0 ? (
                        <>
                          <TrendingDown className="w-4 h-4 text-green-500" />
                          <span className="text-green-600 font-medium">{change.loadChange}min</span>
                        </>
                      ) : (
                        <>
                          <Minus className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">No change</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Recommendations */}
      {recommendations.recommendations.length > 0 && (
        <Alert className="border-2 border-purple-200 bg-purple-50">
          <AlertCircle className="h-4 w-4 text-purple-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-purple-900">💡 Quick Recommendations</p>
              <div className="space-y-1">
                {recommendations.recommendations.map((rec, index) => {
                  const fromMember = members.find(m => m.id === rec.fromMemberId);
                  const toMember = members.find(m => m.id === rec.toMemberId);
                  return (
                    <p key={index} className="text-sm text-purple-800">
                      • Move "{rec.taskTitle}" from {fromMember?.avatar} {fromMember?.name} to {toMember?.avatar} {toMember?.name}
                    </p>
                  );
                })}
              </div>
              <p className="text-xs text-purple-600 italic">{recommendations.recommendations[0].reason}</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Task Reassignments - Explicit Changes */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <span>📋 Task Reassignments</span>
            <Badge variant="secondary" className="bg-blue-100">
              {recalibration.changes.reduce((sum, c) => sum + c.tasksAdded.length, 0)} changes
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(() => {
            // Build a list of all task movements with from/to information
            const taskMovements: Array<{
              task: Task;
              fromMember: FamilyMember;
              toMember: FamilyMember;
            }> = [];

            recalibration.changes.forEach(change => {
              const toMember = members.find(m => m.id === change.memberId)!;
              
              change.tasksAdded.forEach(task => {
                // Find who had this task before
                const fromMemberId = Object.entries(currentAssignments).find(
                  ([memberId, taskIds]) => taskIds.includes(task.id)
                )?.[0];
                
                if (fromMemberId) {
                  const fromMember = members.find(m => m.id === fromMemberId)!;
                  taskMovements.push({ task, fromMember, toMember });
                }
              });
            });

            if (taskMovements.length === 0) {
              return (
                <div className="text-center py-4 text-gray-600">
                  <p className="text-sm">No task reassignments needed - current distribution is optimal!</p>
                </div>
              );
            }

            return (
              <div className="space-y-2">
                {taskMovements.map((movement, index) => (
                  <div
                    key={`${movement.task.id}-${index}`}
                    className="bg-white rounded-lg p-3 border border-blue-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">
                          {movement.task.title}
                        </p>
                        <div className="flex items-center space-x-2 text-sm">
                          <div className="flex items-center space-x-1">
                            <span className="text-lg">{movement.fromMember.avatar}</span>
                            <span className="text-gray-700 font-medium">{movement.fromMember.name}</span>
                          </div>
                          <span className="text-gray-400">→</span>
                          <div className="flex items-center space-x-1">
                            <span className="text-lg">{movement.toMember.avatar}</span>
                            <span className="text-gray-700 font-medium">{movement.toMember.name}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-3">
                        {movement.task.estimatedMinutes}min
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Detailed Changes by Member */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Changes by Member</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>

        {showDetails && (
          <div className="space-y-4">
            {recalibration.changes.map(change => {
              const member = members.find(m => m.id === change.memberId)!;
              
              if (change.tasksAdded.length === 0 && change.tasksRemoved.length === 0) {
                return (
                  <Card key={member.id} className="border-2 border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{member.avatar}</span>
                        <span className="font-medium">{member.name}</span>
                        <Badge variant="outline" className="ml-auto">No changes</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <Card key={member.id} className="border-2" style={{ borderColor: member.color }}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{member.avatar}</span>
                      <span className="font-medium">{member.name}</span>
                    </div>

                    {change.tasksRemoved.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-red-600 mb-1">
                          ➖ Tasks Removed ({change.tasksRemoved.length})
                        </p>
                        <div className="space-y-1">
                          {change.tasksRemoved.map(task => {
                            // Find who is receiving this task
                            const newOwner = recalibration.changes.find(c =>
                              c.tasksAdded.some(t => t.id === task.id)
                            );
                            const newOwnerMember = newOwner ? members.find(m => m.id === newOwner.memberId) : null;
                            
                            return (
                              <div key={task.id} className="text-sm pl-4">
                                <span className="text-gray-700">• {task.title} ({task.estimatedMinutes}min)</span>
                                {newOwnerMember && (
                                  <span className="text-gray-500 ml-2">
                                    → moved to {newOwnerMember.avatar} {newOwnerMember.name}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {change.tasksAdded.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-green-600 mb-1">
                          ➕ Tasks Added ({change.tasksAdded.length})
                        </p>
                        <div className="space-y-1">
                          {change.tasksAdded.map(task => {
                            // Find who previously had this task
                            const previousOwner = Object.entries(currentAssignments).find(
                              ([_, taskIds]) => taskIds.includes(task.id)
                            )?.[0];
                            const previousOwnerMember = previousOwner ? members.find(m => m.id === previousOwner) : null;
                            
                            return (
                              <div key={task.id} className="text-sm pl-4">
                                <span className="text-gray-700">• {task.title} ({task.estimatedMinutes}min)</span>
                                {previousOwnerMember && (
                                  <span className="text-gray-500 ml-2">
                                    ← from {previousOwnerMember.avatar} {previousOwnerMember.name}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Apply Button */}
      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          onClick={() => onApplyRecalibration(recalibration.newAssignments)}
          className="bg-green-600 hover:bg-green-700 px-8"
        >
          Apply Recalibration
        </Button>
      </div>
    </div>
  );
};

export default SyncStep3Recalibration;