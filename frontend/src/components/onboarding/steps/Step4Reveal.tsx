import { Badge } from '@/components/ui/badge';
import { OnboardingTask, OnboardingMember, TaskRating, TaskAssignment } from '@/types/onboarding';

interface Step4Props {
  tasks: OnboardingTask[];
  members: OnboardingMember[];
  ratings: TaskRating[];
  assignments: TaskAssignment[];
}

const Step4Reveal = ({ tasks, members, ratings, assignments }: Step4Props) => {
  // Group tasks by assigned member
  const tasksByMember = members.map(member => {
    const memberTasks = assignments
      .filter(a => a.assignedTo === member.id)
      .map(assignment => {
        const task = tasks.find(t => t.id === assignment.taskId)!;
        const taskRatings = ratings.filter(r => r.taskId === task.id);
        return { task, assignment, taskRatings };
      });
    
    return { member, tasks: memberTasks };
  });

  return (
    <div className="space-y-6">
      <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
        <p className="text-sm text-pink-800">
          <strong>✨ Magic moment!</strong> Here's how tasks were assigned based on everyone's preferences.
          Tasks went to whoever rated them highest, with workload balance considered for ties.
        </p>
      </div>

      <div className="space-y-6">
        {tasksByMember.map(({ member, tasks: memberTasks }) => (
          <div key={member.id} className="border-2 rounded-lg p-4" style={{ borderColor: member.color }}>
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-3xl">{member.avatar}</span>
              <div>
                <h3 className="text-xl font-bold" style={{ color: member.color }}>
                  {member.name}'s Tasks
                </h3>
                <p className="text-sm text-gray-600">
                  {memberTasks.length} task{memberTasks.length !== 1 ? 's' : ''} •
                  {' '}{memberTasks.reduce((sum, { task }) => sum + task.estimatedMinutes, 0)} min/week •
                  {' '}{memberTasks.reduce((sum, { task }) => sum + task.defaultPoints, 0)} points
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {memberTasks.map(({ task, assignment, taskRatings }) => (
                <div key={task.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{task.name}</h4>
                      <p className="text-xs text-gray-500">
                        {task.category} • ~{task.estimatedMinutes} min • {task.defaultPoints} pts
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {assignment.reason === 'preference' && '🎯 Top choice'}
                      {assignment.reason === 'balance' && '⚖️ Balanced'}
                      {assignment.reason === 'rotation' && '🔄 Rotation'}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-600">Ratings:</span>
                    {members.map(m => {
                      const rating = taskRatings.find(r => r.memberId === m.id);
                      return (
                        <div key={m.id} className="flex items-center space-x-1">
                          <span>{m.avatar}</span>
                          <span className="font-medium">
                            {'⭐'.repeat(rating?.rating || 0)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Step4Reveal;