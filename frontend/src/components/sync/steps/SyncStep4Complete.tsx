import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Calendar, Users, TrendingUp } from 'lucide-react';

interface SyncStep4Props {
  fairnessScore: number;
  memberCount: number;
  tasksAffected: number;
}

const SyncStep4Complete = ({
  fairnessScore,
  memberCount,
  tasksAffected,
}: SyncStep4Props) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>
        
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Sync Complete! 🎉
          </h2>
          <p className="text-lg text-gray-600">
            Your household tasks have been successfully recalibrated
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-green-600 mb-1">
              {fairnessScore}%
            </div>
            <p className="text-sm text-gray-600">Fairness Score</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {memberCount}
            </div>
            <p className="text-sm text-gray-600">Members Synced</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardContent className="p-6 text-center">
            <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {tasksAffected}
            </div>
            <p className="text-sm text-gray-600">Tasks Redistributed</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            ✨ What's Next?
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start space-x-2">
              <span className="text-purple-600 font-bold">•</span>
              <span>Your updated task assignments are now active on the task board</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-purple-600 font-bold">•</span>
              <span>Each family member can see their new responsibilities</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-purple-600 font-bold">•</span>
              <span>Run another sync anytime workload or capacity changes</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-purple-600 font-bold">•</span>
              <span>We recommend syncing weekly or whenever life circumstances shift</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>💡 Pro Tip:</strong> Set a recurring reminder (like Sunday evenings) to run a weekly sync.
          This keeps your household balanced and prevents burnout!
        </p>
      </div>
    </div>
  );
};

export default SyncStep4Complete;