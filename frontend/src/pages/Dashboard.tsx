import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListTodo, CheckCircle2, Clock, TrendingUp, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import TaskCard from '@/components/tasks/TaskCard';

const Dashboard = () => {
  const { household, tasks, notes } = useApp();

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const completedTasks = tasks.filter(t => t.status === 'done');
  const overdueTasks = tasks.filter(
    t => new Date(t.dueDate) < new Date() && t.status !== 'done'
  );

  const recentNotes = notes.slice(-3).reverse();

  const getMemberById = (memberId: string) => {
    return household?.members.find(m => m.id === memberId);
  };

  const upcomingTasks = tasks
    .filter(t => t.status !== 'done')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {household?.members.find(m => m.id === household.managerId)?.name}! 👋
        </h1>
        <p className="text-purple-100">
          You're crushing it, {household?.name}! Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">To Do</CardTitle>
            <ListTodo className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todoTasks.length}</div>
            <p className="text-xs text-gray-500 mt-1">Tasks waiting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
            <Clock className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressTasks.length}</div>
            <p className="text-xs text-gray-500 mt-1">Being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
            <p className="text-xs text-gray-500 mt-1">Tasks done</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
            <TrendingUp className="w-4 h-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueTasks.length}</div>
            <p className="text-xs text-gray-500 mt-1">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Family Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>🏆 Family Leaderboard</span>
            <Link to="/family">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {household?.members
              .sort((a, b) => b.points - a.points)
              .map((member, index) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                    <span className="text-2xl">{member.avatar}</span>
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.tasksCompleted} tasks completed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold" style={{ color: member.color }}>
                      {member.points}
                    </p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>📅 Upcoming Tasks</span>
            <Link to="/tasks">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                member={getMemberById(task.assigneeId)}
              />
            ))}
            {upcomingTasks.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>No upcoming tasks</p>
                <Link to="/tasks">
                  <Button className="mt-4" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Task
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Appreciation */}
      {recentNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>💝 Recent Appreciation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentNotes.map(note => {
                const from = getMemberById(note.fromId);
                const to = getMemberById(note.toId);
                return (
                  <div key={note.id} className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{from?.avatar}</span>
                      <span className="font-medium">{from?.name}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-lg">{to?.avatar}</span>
                      <span className="font-medium">{to?.name}</span>
                    </div>
                    <p className="text-sm text-gray-700">{note.message}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;