import { Badge } from '@/components/ui/badge';
import { OnboardingTask, OnboardingMember, TaskRating, TaskAssignment } from '@/types/onboarding';

interface Step4Props {
  tasks: OnboardingTask[];
  members: OnboardingMember[];
  ratings: TaskRating[];
  assignments: TaskAssignment[];
}

const Step4Reveal = ({ tasks, members, ratings, assignments }: Step4Props) => {
  return (
    <div className="space-y-6">
      <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
        <p className="text-sm text-pink-800">
          <strong>✨ Magic moment!</strong> Here's how tasks were assigned based on everyone's preferences.
          Tasks went to whoever rated them highest, with workload balance considered for ties.
        </p>
      </div>

      <div className="space-y-3">
        {tasks.map(task => {
          const assignment = assignments.find(a => a.taskId === task.id);
          const assignedMember = members.find(m => m.id === assignment?.assignedTo);
          const taskRatings = ratings.filter(r => r.taskId === task.id);

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

              <div className="flex items-center space-x-4 text-sm">
                {members.map(member => {
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
  );
};

export default Step4Reveal;