import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Save, RotateCcw, History, TrendingUp, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { MemberCapacitySnapshot } from '@/types';
import SaveEquilibriumModal from '@/components/equilibrium/SaveEquilibriumModal';
import RestoreEquilibriumModal from '@/components/equilibrium/RestoreEquilibriumModal';
import EquilibriumHistory from '@/components/equilibrium/EquilibriumHistory';

const Fairness = () => {
  const {
    household,
    tasks,
    currentEquilibrium,
    equilibriumHistory,
    saveCurrentAsEquilibrium,
    restoreToEquilibrium,
    isAtEquilibrium,
    getEquilibriumDrift,
  } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

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

  // Calculate fairness score
  const calculateFairnessScore = (): number => {
    if (!memberStats || memberStats.length === 0) return 100;
    
    const taskCounts = memberStats.map(m => m.taskCount);
    const avg = taskCounts.reduce((a, b) => a + b, 0) / taskCounts.length;
    const variance = taskCounts.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) / taskCounts.length;
    const stdDev = Math.sqrt(variance);
    const maxStdDev = avg * 0.5;
    
    return Math.max(0, Math.round(100 - (stdDev / maxStdDev) * 100));
  };

  const fairnessScore = calculateFairnessScore();
  const atEquilibrium = isAtEquilibrium();
  const equilibriumDrift = getEquilibriumDrift();

  const handleSaveEquilibrium = (description?: string) => {
    if (!household) return;

    // Create capacity snapshots (default to balanced for now)
    const capacities: MemberCapacitySnapshot[] = household.members.map(member => ({
      memberId: member.id,
      memberName: member.name,
      workloadLevel: 3,
      energyLevel: 3,
      emotionalCapacity: 3,
    }));

    saveCurrentAsEquilibrium(fairnessScore, capacities, description);
    
    toast({
      title: "✅ Default distribution saved",
      description: "You can now reset to it anytime after temporary changes.",
    });
  };

  const handleRestoreEquilibrium = () => {
    restoreToEquilibrium();
    
    toast({
      title: "⚖️ Household restored to equilibrium",
      description: "Everyone's tasks are back to normal.",
    });
  };

  const handleRestoreFromHistory = (snapshotId: string) => {
    restoreToEquilibrium(snapshotId);
    
    toast({
      title: "⚖️ Equilibrium restored",
      description: "Task distribution has been updated.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fairness Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Making invisible work visible - see how tasks are distributed across your family
        </p>
      </div>

      {/* Equilibrium Status Alert */}
      {currentEquilibrium && equilibriumDrift > 25 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong className="text-orange-900">
                {equilibriumDrift}% of tasks have been reassigned
              </strong>
              <p className="text-sm text-orange-800 mt-1">
                Your household has drifted from its default balance. Consider restoring to equilibrium.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRestoreModal(true)}
              className="ml-4 border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Restore
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {atEquilibrium && currentEquilibrium && (
        <Alert className="border-green-200 bg-green-50">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>✅ At Equilibrium</strong> - Your household is at its saved default balance.
          </AlertDescription>
        </Alert>
      )}

      {/* Equilibrium Controls */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg">🏠 Back to Our Usual Flow</span>
            <Badge variant="secondary" className="bg-blue-100">
              Equilibrium Mode
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-700">
            Think of this as your home base — your household's natural balance.
            Whenever life gets hectic, you can always come back to it.
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              onClick={() => navigate('/sync')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Run Fairness ReSync
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowSaveModal(true)}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <Save className="w-4 h-4 mr-2" />
              Save as Default Distribution
            </Button>
            
            {currentEquilibrium && (
              <Button
                variant="outline"
                onClick={() => setShowRestoreModal(true)}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Return to Default Distribution
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
              className="border-gray-300"
            >
              <History className="w-4 h-4 mr-2" />
              {showHistory ? 'Hide' : 'View'} Snapshot History
            </Button>
          </div>

          {currentEquilibrium && (
            <div className="pt-3 border-t border-blue-200">
              <p className="text-xs text-gray-600">
                <strong>Current Default:</strong> Saved on{' '}
                {new Date(currentEquilibrium.timestamp).toLocaleDateString()} with{' '}
                <strong className="text-green-600">{currentEquilibrium.fairnessScore}% fairness</strong>
                {currentEquilibrium.description && ` - ${currentEquilibrium.description}`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Equilibrium History */}
      {showHistory && (
        <EquilibriumHistory
          history={equilibriumHistory}
          currentEquilibrium={currentEquilibrium}
          onRestore={handleRestoreFromHistory}
        />
      )}

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

      {/* Modals */}
      <SaveEquilibriumModal
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveEquilibrium}
        fairnessScore={fairnessScore}
      />

      <RestoreEquilibriumModal
        open={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onRestore={handleRestoreEquilibrium}
        equilibrium={currentEquilibrium}
        currentDrift={equilibriumDrift}
      />
    </div>
  );
};

export default Fairness;