import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import TaskInput from '../TaskInput';
import { OnboardingTask } from '@/types/onboarding';

interface Step2Props {
  tasks: OnboardingTask[];
  onAddTask: (task: OnboardingTask) => void;
  onRemoveTask: (taskId: string) => void;
}

const Step2TaskList = ({ tasks, onAddTask, onRemoveTask }: Step2Props) => {
  const categories: Array<'daily' | 'weekly' | 'monthly'> = ['daily', 'weekly', 'monthly'];

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <p className="text-sm text-purple-800">
          <strong>📋 Review and customize:</strong> We've pre-loaded common household tasks.
          Remove any that don't apply and add your own!
        </p>
      </div>

      <TaskInput onAdd={onAddTask} />

      {categories.map(category => {
        const categoryTasks = tasks.filter(t => t.category === category);
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
                    onClick={() => onRemoveTask(task.id)}
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
  );
};

export default Step2TaskList;