import { Badge } from '@/components/ui/badge';
import RatingScale from '../RatingScale';
import { OnboardingTask, OnboardingMember } from '@/types/onboarding';

interface Step3Props {
  tasks: OnboardingTask[];
  currentMember: OnboardingMember;
  currentMemberIndex: number;
  totalMembers: number;
  ratedTasksCount: number;
  getTaskRating: (taskId: string) => number;
  onSetRating: (taskId: string, rating: number) => void;
}

const Step3Rating = ({
  tasks,
  currentMember,
  currentMemberIndex,
  totalMembers,
  ratedTasksCount,
  getTaskRating,
  onSetRating,
}: Step3Props) => {
  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>⭐ {currentMember.name}'s turn:</strong> Rate each task honestly.
          5 = love it, 1 = hate it. Your ratings are private until everyone finishes!
        </p>
      </div>

      <div className="space-y-4">
        {tasks.map(task => (
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
              onChange={rating => onSetRating(task.id, rating)}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
        <span className="text-sm text-gray-600">
          Progress: {ratedTasksCount} / {tasks.length} tasks rated
        </span>
        <span className="text-sm font-semibold text-purple-600">
          {currentMemberIndex + 1} of {totalMembers} members
        </span>
      </div>
    </div>
  );
};

export default Step3Rating;