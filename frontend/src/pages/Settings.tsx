import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, Trash2, RefreshCw } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { showSuccess } from '@/utils/toast';
import { Link } from 'react-router-dom';

const Settings = () => {
  const { initializeApp } = useApp();

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      localStorage.clear();
      initializeApp();
      showSuccess('Data reset successfully!');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your FamilyFlow preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5" />
            <span>Onboarding</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Want to start fresh with a new household setup? Run through the onboarding process again
            to redistribute tasks fairly using game theory.
          </p>
          <Link to="/onboarding">
            <Button variant="outline">
              Start Onboarding Process
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            In a full implementation, this would connect to push notifications, SMS, and email services.
            For this demo, notifications are simulated in the UI.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Push Notifications</span>
              <span className="text-xs text-gray-500">Demo Mode</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Email Reminders</span>
              <span className="text-xs text-gray-500">Demo Mode</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">SMS Alerts</span>
              <span className="text-xs text-gray-500">Demo Mode</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Calendar Integration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            In a full implementation, this would sync with Google Calendar and Apple Calendar.
            For this demo, calendar integration is simulated.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Google Calendar</span>
              <span className="text-xs text-gray-500">Demo Mode</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Apple Calendar</span>
              <span className="text-xs text-gray-500">Demo Mode</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            <span>Danger Zone</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Reset all data and start fresh with demo data.
          </p>
          <Button variant="destructive" onClick={handleResetData}>
            Reset All Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;