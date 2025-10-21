import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Fairness = () => {
  const { household, tasks } = useApp();

  // Calculate task distribution by member
  const memberStats = household?.members.map(member => {
    const memberTasks = tasks.filter(t => t.assigneeId === member.id);
    const completedTasks = memberTasks.filter(t => t.status === 'done');
    const totalPoints = completedTasks.reduce((sum, t) => sum + t.points, 0);
    const totalMinutes = completedTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);

    return {
      name: member.name,
      avatar: member.avatar,
      color: member.color,
      taskCount: memberTasks.length,
      completedCount: completedTasks.length,
      points: totalPoints,
      hours: Math.round(totalMinutes / 60 * 10) / 10,
    };
  }) || [];

  // Calculate task distribution by room
  const roomStats = tasks.reduce((acc, task) => {
    const room = task.room || 'General';
    if (!acc[room]) {
      acc[room] = { name: room, count: 0, points: 0 };
    }
    acc[room].count++;
    if (task.status === 'done') {
      acc[room].points += task.points;
    }
    return acc;
  }, {} as Record<string, { name: string; count: number; points: number }>);

  const roomData = Object.values(roomStats);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fairness Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Making invisible work visible - see how tasks are distributed across your family
        </p>
      </div>

      {/* Member Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {memberStats.map(member => (
          <Card key={member.name}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <span className="text-2xl">{member.avatar}</span>
                <span>{member.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tasks Assigned:</span>
                  <span className="font-semibold">{member.taskCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completed:</span>
                  <span className="font-semibold text-green-600">{member.completedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Points Earned:</span>
                  <span className="font-semibold" style={{ color: member.color }}>
                    {member.points}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Time Invested:</span>
                  <span className="font-semibold">{member.hours}h</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Task Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Task Distribution by Family Member</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={memberStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="taskCount" fill="#8B5CF6" name="Total Tasks" />
              <Bar dataKey="completedCount" fill="#10B981" name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Points Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Points Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={memberStats}
                  dataKey="points"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {memberStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time Investment (Hours)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={memberStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Bar dataKey="hours" fill="#3B82F6" name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Room Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks by Room/Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={roomData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#EC4899" name="Task Count" />
              <Bar dataKey="points" fill="#F59E0B" name="Points Earned" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Fairness;