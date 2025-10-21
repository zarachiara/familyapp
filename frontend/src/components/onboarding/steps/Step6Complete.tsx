import { Card, CardContent } from '@/components/ui/card';

interface Step6Props {
  taskCount: number;
  memberCount: number;
  fairnessScore: number;
}

const Step6Complete = ({ taskCount, memberCount, fairnessScore }: Step6Props) => {
  return (
    <div className="space-y-6 text-center py-8">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-3xl font-bold text-gray-900">You're All Set!</h2>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        Your household tasks have been fairly distributed based on everyone's preferences.
        FamilyFlow will help you track progress, celebrate achievements, and maintain balance.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl mb-2">📋</div>
            <p className="font-semibold">{taskCount} Tasks</p>
            <p className="text-sm text-gray-600">Ready to manage</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl mb-2">👥</div>
            <p className="font-semibold">{memberCount} Members</p>
            <p className="text-sm text-gray-600">Working together</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl mb-2">⚖️</div>
            <p className="font-semibold">{fairnessScore}% Fair</p>
            <p className="text-sm text-gray-600">Balanced workload</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mt-8">
        <h3 className="font-semibold text-purple-900 mb-2">💡 Pro Tips</h3>
        <ul className="text-sm text-purple-800 space-y-2 text-left max-w-xl mx-auto">
          <li>• Review task distribution monthly to adjust as life changes</li>
          <li>• Use the Fairness Dashboard to track workload balance</li>
          <li>• Send appreciation notes to celebrate each other's contributions</li>
          <li>• Earn points and badges to make household work fun!</li>
        </ul>
      </div>
    </div>
  );
};

export default Step6Complete;