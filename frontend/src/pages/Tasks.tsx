import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import TaskBoard from '@/components/tasks/TaskBoard';
import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Task, RecurrencePattern } from '@/types';
import { showSuccess } from '@/utils/toast';

const Tasks = () => {
  const { household, addTask } = useApp();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeId: '',
    dueDate: '',
    recurrence: 'none' as RecurrencePattern,
    room: '',
    points: 20,
    estimatedMinutes: 30,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newTask: Task = {
      id: `task-${Date.now()}`,
      ...formData,
      status: 'todo',
      createdBy: household?.managerId || '',
      createdAt: new Date().toISOString(),
    };

    addTask(newTask);
    showSuccess('Task created successfully!');
    setOpen(false);
    setFormData({
      title: '',
      description: '',
      assigneeId: '',
      dueDate: '',
      recurrence: 'none',
      room: '',
      points: 20,
      estimatedMinutes: 30,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Board</h1>
          <p className="text-gray-600 mt-1">Manage your family's tasks and responsibilities</p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Laundry"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add details about this task..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="assignee">Assign To *</Label>
                    <Select
                      value={formData.assigneeId}
                      onValueChange={value => setFormData({ ...formData, assigneeId: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent>
                        {household?.members.map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.avatar} {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dueDate">Due Date *</Label>
                    <Input
                      id="dueDate"
                      type="datetime-local"
                      value={formData.dueDate}
                      onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="room">Room/Category</Label>
                    <Input
                      id="room"
                      value={formData.room}
                      onChange={e => setFormData({ ...formData, room: e.target.value })}
                      placeholder="e.g., Kitchen"
                    />
                  </div>

                  <div>
                    <Label htmlFor="recurrence">Recurrence</Label>
                    <Select
                      value={formData.recurrence}
                      onValueChange={value =>
                        setFormData({ ...formData, recurrence: value as RecurrencePattern })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">One-time</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="points">Points</Label>
                    <Input
                      id="points"
                      type="number"
                      value={formData.points}
                      onChange={e =>
                        setFormData({ ...formData, points: parseInt(e.target.value) })
                      }
                      min="5"
                      step="5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="estimatedMinutes">Estimated Time (minutes)</Label>
                    <Input
                      id="estimatedMinutes"
                      type="number"
                      value={formData.estimatedMinutes}
                      onChange={e =>
                        setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) })
                      }
                      min="5"
                      step="5"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Task</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <TaskBoard />
    </div>
  );
};

export default Tasks;