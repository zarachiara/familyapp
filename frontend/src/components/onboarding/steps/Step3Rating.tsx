import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
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
  const progress = (ratedTasksCount / tasks.length) * 100;

  const getDomainColor = (domain: OnboardingTask['domain']) => {
    const colors = {
      kitchen: 'bg-orange-100 text-orange-700',
      maintenance: 'bg-blue-100 text-blue-700',
      care: 'bg-pink-100 text-pink-700',
      planning: 'bg-purple-100 text-purple-700',
      cleaning: 'bg-green-100 text-green-700',
      outdoor: 'bg-teal-100 text-teal-700',
    };
    return colors[domain];
  };

  const getDomainEmoji = (domain: OnboardingTask['domain']) => {
    const emojis = {
      kitchen: '🥘',
      maintenance: '🧺',
      care: '🐶',
      planning: '💻',
      cleaning: '🧹',
      outdoor: '🌳',
    };
    return emojis[domain];
  };

  return (
    <div className="space-y-6">
      {/* Member Info Banner */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currentMember.avatar}</span>
            <div>
              <p className="font-semibold text-gray-900">
                {currentMember.name}'s Turn
              </p>
              <p className="text-sm text-gray-600">
                Rate tasks honestly - your ratings are private!
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            Member {currentMemberIndex + 1} of {totalMembers}
          </Badge>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {ratedTasksCount} of {tasks.length} tasks rated
          </span>
          <span className="font-semibold text-purple-600">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Task List */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
        {tasks.map((task) => {
          const currentRating = getTaskRating(task.id);
          
          return (
            <Card 
              key={task.id} 
              className={`p-4 transition-all ${
                currentRating > 0 
                  ? 'border-purple-300 bg-purple-50/50' 
                  : 'border-gray-200 hover:border-purple-200'
              }`}
            >
              <div className="space-y-4">
                {/* Task Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-3xl">{getDomainEmoji(task.domain)}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{task.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${getDomainColor(task.domain)}`}>
                          {task.domain.charAt(0).toUpperCase() + task.domain.slice(1)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          ⏱️ ~{task.estimatedMinutes} min
                        </span>
                        <span className="text-xs text-gray-500">
                          📅 {task.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-sm px-2 py-1">
                    {task.defaultPoints} pts
                  </Badge>
                </div>

                {/* Rating Scale */}
                <div className="pt-2">
                  <RatingScale
                    value={currentRating}
                    onChange={(rating) => onSetRating(task.id, rating)}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="bg-white border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{ratedTasksCount}</div>
          <div className="text-sm text-gray-600">Rated</div>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{tasks.length - ratedTasksCount}</div>
          <div className="text-sm text-gray-600">Remaining</div>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{tasks.length}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
      </div>
    </div>
  );
};

export default Step3Rating;