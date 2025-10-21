import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { OnboardingTask } from '@/types/onboarding';

interface TaskInputProps {
  onAdd: (task: OnboardingTask) => void;
}

const TaskInput = ({ onAdd }: TaskInputProps) => {
  const [taskName, setTaskName] = useState('');
  const [category, setCategory] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [minutes, setMinutes] = useState(30);

  const handleAdd = () => {
    if (!taskName.trim()) return;

    const newTask: OnboardingTask = {
      id: `task-custom-${Date.now()}`,
      name: taskName.trim(),
      category,
      estimatedMinutes: minutes,
      defaultPoints: Math.round(minutes / 3),
    };

    onAdd(newTask);
    setTaskName('');
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
      <Label>Add Custom Task</Label>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2">
        <Input
          value={taskName}
          onChange={e => setTaskName(e.target.value)}
          placeholder="Task name"
          className="md:col-span-2"
        />
        <select
          value={category}
          onChange={e => setCategory(e.target.value as any)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <Button onClick={handleAdd} type="button" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>
    </div>
  );
};

export default TaskInput;