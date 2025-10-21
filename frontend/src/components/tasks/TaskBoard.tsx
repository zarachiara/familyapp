import { useState } from 'react';
import { Task, TaskStatus } from '@/types';
import { useApp } from '@/contexts/AppContext';
import TaskCard from './TaskCard';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const TaskBoard = () => {
  const { tasks, household, updateTask } = useApp();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const columns: { status: TaskStatus; title: string; color: string }[] = [
    { status: 'todo', title: 'To Do', color: 'bg-gray-100' },
    { status: 'in-progress', title: 'In Progress', color: 'bg-blue-100' },
    { status: 'done', title: 'Done', color: 'bg-green-100' },
  ];

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: TaskStatus) => {
    if (draggedTask) {
      updateTask(draggedTask.id, { 
        status,
        ...(status === 'done' && { completedAt: new Date().toISOString() })
      });
      setDraggedTask(null);
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const getMemberById = (memberId: string) => {
    return household?.members.find(m => m.id === memberId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map(column => {
        const columnTasks = getTasksByStatus(column.status);
        
        return (
          <div key={column.status} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{column.title}</h2>
              <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                {columnTasks.length}
              </span>
            </div>

            <div
              className={cn(
                'min-h-[500px] p-4 rounded-lg border-2 border-dashed transition-colors',
                column.color
              )}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.status)}
            >
              <div className="space-y-3">
                {columnTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    member={getMemberById(task.assigneeId)}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                  />
                ))}

                {columnTasks.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-sm">No tasks yet</p>
                    <p className="text-xs mt-1">Drag tasks here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskBoard;