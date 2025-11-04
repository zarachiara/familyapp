import { Task, FamilyMember } from '@/types';
import { Calendar, Clock, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  member?: FamilyMember;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}

const TaskCard = ({ task, member, onClick, draggable = false, onDragStart }: TaskCardProps) => {
  // Safely parse the due date
  const dueDate = new Date(task.dueDate);
  const isValidDate = !isNaN(dueDate.getTime());
  const isOverdue = isValidDate && dueDate < new Date() && task.status !== 'done';

  return (
    <Card
      className={cn(
        'p-4 cursor-pointer hover:shadow-md transition-shadow',
        isOverdue && 'border-red-300 bg-red-50'
      )}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-gray-900">{task.title}</h3>
          <Badge variant="secondary" className="ml-2">
            {task.points} pts
          </Badge>
        </div>

        {task.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          {member && (
            <div className="flex items-center space-x-1">
              <span className="text-lg">{member.avatar}</span>
              <span>{member.name}</span>
            </div>
          )}

          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span className={cn(isOverdue && 'text-red-600 font-medium')}>
              {isValidDate ? format(dueDate, 'MMM d') : 'Invalid date'}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{task.estimatedMinutes} min</span>
          </div>

          {task.room && (
            <Badge variant="outline" className="text-xs">
              {task.room}
            </Badge>
          )}
        </div>

        {task.recurrence !== 'none' && (
          <Badge variant="secondary" className="text-xs">
            🔄 {task.recurrence}
          </Badge>
        )}
      </div>
    </Card>
  );
};

export default TaskCard;