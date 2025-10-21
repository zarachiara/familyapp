import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { OnboardingTask, OnboardingMember, TaskAssignment } from '@/types/onboarding';
import { getWorkloadBalance, calculateFairnessScore } from '@/utils/taskAssignment';

interface Step5Props {
  tasks: OnboardingTask[];
  members: OnboardingMember[];
  assignments: TaskAssignment[];
  onReassignTask: (taskId: string, newAssignee: string) => void;
}

const Step5Balance = ({ tasks, members, assignments, onReassignTask }: Step5Props) => {
  const workloads = getWorkloadBalance(assignments, tasks, members);
  const fairnessScore = calculateFairnessScore(workloads);

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          <strong>⚖️ Fairness Score: {fairnessScore}/100</strong>
          {fairnessScore >= 80 && ' - Excellent balance!'}
          {fairnessScore >= 60 && fairnessScore < 80 && ' - Good balance'}
          {fairnessScore < 60 && ' - Consider adjusting assignments'}
        </p>
      </div>

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
                    <span className="text-gray-600">Time/Week:</span>
                    <span className="font-semibold">
                      {Math.round(workload.totalMinutes / 60 * 10) / 10}h
                    </span>
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

      <div>
        <h3 className="text-lg font-semibold mb-3">Fine-tune Assignments</h3>
        <p className="text-sm text-gray-600 mb-4">
          Adjust task assignments if needed to achieve better balance
        </p>
        <div className="space-y-2">
          {tasks.slice(0, 5).map(task => {
            const assignment = assignments.find(a => a.taskId === task.id);

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
                    onChange={e => onReassignTask(task.id, e.target.value)}
                    className="px-2 py-1 border rounded text-sm"
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
        </div>
      </div>
    </div>
  );
};

export default Step5Balance;