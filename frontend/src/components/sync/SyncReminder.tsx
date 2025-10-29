import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { RefreshCw, X } from 'lucide-react';

const SyncReminder = () => {
  const [showReminder, setShowReminder] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if it's Sunday evening (day 0, after 5 PM)
    const now = new Date();
    const isSundayEvening = now.getDay() === 0 && now.getHours() >= 17;
    
    // Check last sync date
    const syncHistory = JSON.parse(localStorage.getItem('familyflow_sync_history') || '[]');
    const lastSync = syncHistory.length > 0 
      ? new Date(syncHistory[syncHistory.length - 1].timestamp)
      : null;
    
    // Show reminder if:
    // 1. It's Sunday evening, OR
    // 2. Last sync was more than 7 days ago, OR
    // 3. Never synced before
    const daysSinceLastSync = lastSync 
      ? (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;
    
    const shouldShow = (isSundayEvening || daysSinceLastSync > 7 || !lastSync) && !dismissed;
    setShowReminder(shouldShow);
  }, [dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    // Store dismissal in session storage (resets on page refresh)
    sessionStorage.setItem('sync_reminder_dismissed', 'true');
  };

  if (!showReminder) return null;

  return (
    <Card className="border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-blue-50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                🔔 Time for a Fairness Sync!
              </h3>
              <p className="text-sm text-gray-700 mb-3">
                It's been a while since your last sync. Take a few minutes to recalibrate tasks 
                based on everyone's current capacity and workload.
              </p>
              <div className="flex items-center space-x-2">
                <Link to="/sync">
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Run Sync Now
                  </Button>
                </Link>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleDismiss}
                  className="text-gray-600"
                >
                  Remind Me Later
                </Button>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0 -mt-1 -mr-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncReminder;