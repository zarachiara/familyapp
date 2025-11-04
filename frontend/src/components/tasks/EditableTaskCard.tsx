import { useState } from 'react';
import { Task, TaskStatus, FamilyMember, RecurrencePattern } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, Edit2, Check, X, User, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import RecurringSchedulerModal from './RecurringSchedulerModal';

interface EditableTaskCardProps {
  task: Task;
  members: FamilyMember[];
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onCheck: (task: Task, checked: boolean) => void;
}

const EditableTaskCard = ({ task, members, onUpdate, onCheck }: EditableTaskCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [showRecurringModal, setShowRecurringModal] = useState(false);

  const isOverdue = task.dueDate ? new Date(task.dueDate) < new Date() && task.status !== 'done' : false;
  const isDone = task.status === 'done';
  const assignedMember = members.find(m => m.id === task.assigneeId);

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'todo': return '⭕';
      case 'in-progress': return '🔄';
      case 'done': return '✅';
    }
  };

  const handleSave = () => {
    onUpdate(task.id, {
      points: editedTask.points,
      estimatedMinutes: editedTask.estimatedMinutes,
      dueDate: editedTask.dueDate,
      recurrence: editedTask.recurrence,
      assigneeId: editedTask.assigneeId,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTask(task);
    setIsEditing(false);
  };

  const handleRecurringSave = (startDate: string, recurrence: RecurrencePattern, daysOfWeek?: number[]) => {
    setEditedTask({
      ...editedTask,
      dueDate: startDate,
      recurrence,
    });
  };

  const getRecurrenceDisplay = () => {
    if (editedTask.recurrence === 'none') return 'One-time';
    return editedTask.recurrence.charAt(0).toUpperCase() + editedTask.recurrence.slice(1);
  };

  if (isEditing) {
    return (
      <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
        <div className="space-y-3">
          {/* Task Title (read-only in edit mode) */}
          <div className="flex items-center gap-2">
            <span className="text-sm">{getStatusIcon(task.status)}</span>
            <h3 className="font-medium text-gray-900">{task.title}</h3>
          </div>

          {/* Editable Fields */}
          <div className="grid grid-cols-2 gap-3">
            {/* Points */}
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Points</label>
              <Input
                type="number"
                value={editedTask.points}
                onChange={(e) => setEditedTask({ ...editedTask, points: parseInt(e.target.value) || 0 })}
                min="5"
                step="5"
                className="h-8"
              />
            </div>

            {/* Minutes */}
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Minutes</label>
              <Input
                type="number"
                value={editedTask.estimatedMinutes}
                onChange={(e) => setEditedTask({ ...editedTask, estimatedMinutes: parseInt(e.target.value) || 0 })}
                min="5"
                step="5"
                className="h-8"
              />
            </div>

            {/* Recurring Schedule Button */}
            <div className="col-span-2">
              <label className="text-xs text-gray-600 mb-1 block">Schedule & Recurrence</label>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRecurringModal(true)}
                className="w-full h-8 justify-start"
              >
                <Repeat className="w-3 h-3 mr-2" />
                <span className="text-xs">
                  {editedTask.dueDate ? format(new Date(editedTask.dueDate), 'MMM d, yyyy') : 'No due date'} • {getRecurrenceDisplay()}
                </span>
              </Button>
            </div>

            {/* Assigned Member */}
            <div className="col-span-2">
              <label className="text-xs text-gray-600 mb-1 block">Assigned To</label>
              <Select
                value={editedTask.assigneeId}
                onValueChange={(value) => setEditedTask({ ...editedTask, assigneeId: value })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {members.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.avatar} {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <Button size="sm" onClick={handleSave} className="h-7">
              <Check className="w-3 h-3 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} className="h-7">
              <X className="w-3 h-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>

        {/* Recurring Scheduler Modal */}
        <RecurringSchedulerModal
          open={showRecurringModal}
          onOpenChange={setShowRecurringModal}
          currentStartDate={editedTask.dueDate}
          currentRecurrence={editedTask.recurrence}
          onSave={handleRecurringSave}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0',
        isOverdue && 'bg-red-50 hover:bg-red-100',
        isDone && 'opacity-60'
      )}
    >
      {/* Checkbox */}
      <div className="pt-0.5">
        <Checkbox
          checked={isDone}
          onCheckedChange={(checked) => onCheck(task, checked as boolean)}
          className={cn(
            'h-5 w-5 rounded-full',
            isDone && 'data-[state=checked]:bg-green-500'
          )}
        />
      </div>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{getStatusIcon(task.status)}</span>
              <h3
                className={cn(
                  'font-medium text-gray-900',
                  isDone && 'line-through text-gray-500'
                )}
              >
                {task.title}
              </h3>
            </div>
            {task.description && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                {task.description}
              </p>
            )}
          </div>

          {/* Points Badge */}
          <Badge
            variant={isDone ? 'secondary' : 'default'}
            className={cn(
              'ml-2 shrink-0',
              task.points >= 30 && !isDone && 'bg-purple-500 hover:bg-purple-600'
            )}
          >
            {task.points} pts
          </Badge>
        </div>

        {/* Task Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          {/* Due Date */}
          {task.dueDate ? (
            <div className={cn(
              'flex items-center gap-1',
              isOverdue && 'text-red-600 font-medium'
            )}>
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(task.dueDate), 'MMM d, h:mm a')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-400">
              <Calendar className="w-3 h-3" />
              <span>No due date</span>
            </div>
          )}

          {/* Duration */}
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{task.estimatedMinutes} min</span>
          </div>

          {/* Assigned Member */}
          {assignedMember ? (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{assignedMember.avatar} {assignedMember.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-400">
              <User className="w-3 h-3" />
              <span>Unassigned</span>
            </div>
          )}

          {/* Room/Category */}
          {task.room && (
            <Badge variant="outline" className="text-xs h-5">
              {task.room}
            </Badge>
          )}

          {/* Recurrence */}
          {task.recurrence !== 'none' && (
            <Badge variant="secondary" className="text-xs h-5">
              🔄 {task.recurrence}
            </Badge>
          )}
        </div>
      </div>

      {/* Edit Button */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
      >
        <Edit2 className="w-3 h-3" />
      </Button>
    </div>
  );
};

export default EditableTaskCard;