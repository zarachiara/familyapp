import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Bell, Calendar, Trash2, RefreshCw, Mail, Loader2, TestTube } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { showSuccess, showError } from '@/utils/toast';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface NotificationPreferences {
  daily_reminders: boolean;
  weekly_fairness_summary: boolean;
  task_due_reminders: boolean;
  overdue_follow_ups: boolean;
  fair_flow_updates: boolean;
}

const Settings = () => {
  const { initializeApp } = useApp();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    daily_reminders: true,
    weekly_fairness_summary: true,
    task_due_reminders: true,
    overdue_follow_ups: true,
    fair_flow_updates: true,
  });
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);

  useEffect(() => {
    if (token) {
      fetchPreferences();
    }
  }, [token]);

  const fetchPreferences = async () => {
    setIsLoadingPreferences(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setIsLoadingPreferences(false);
    }
  };

  const updatePreferences = async (newPreferences: NotificationPreferences) => {
    setIsSavingPreferences(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPreferences),
      });

      if (response.ok) {
        setPreferences(newPreferences);
        showSuccess('Notification preferences updated!');
      } else {
        showError('Failed to update preferences');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      showError('Failed to update preferences');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    updatePreferences(newPreferences);
  };

  const handleSendTestEmail = async () => {
    setIsSendingTestEmail(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/notifications/test-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess(data.message || 'Test email sent successfully!');
      } else {
        const error = await response.json();
        showError(error.detail || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      showError('Failed to send test email. Please check your email configuration.');
    } finally {
      setIsSendingTestEmail(false);
    }
  };

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
            <span>Email Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-6">
            Configure your email notification preferences. You'll receive emails at{' '}
            <span className="font-semibold">{user?.email || 'your email'}</span>.
          </p>

          {isLoadingPreferences ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">Daily Task Reminders</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Get a daily summary of your tasks
                  </div>
                </div>
                <Switch
                  checked={preferences.daily_reminders}
                  onCheckedChange={(checked) => handlePreferenceChange('daily_reminders', checked)}
                  disabled={isSavingPreferences}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">Weekly Fairness Summary</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Weekly report on household task distribution
                  </div>
                </div>
                <Switch
                  checked={preferences.weekly_fairness_summary}
                  onCheckedChange={(checked) => handlePreferenceChange('weekly_fairness_summary', checked)}
                  disabled={isSavingPreferences}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">Task Due Reminders</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Reminders when tasks are due soon
                  </div>
                </div>
                <Switch
                  checked={preferences.task_due_reminders}
                  onCheckedChange={(checked) => handlePreferenceChange('task_due_reminders', checked)}
                  disabled={isSavingPreferences}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">Overdue Task Follow-ups</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Notifications for overdue tasks
                  </div>
                </div>
                <Switch
                  checked={preferences.overdue_follow_ups}
                  onCheckedChange={(checked) => handlePreferenceChange('overdue_follow_ups', checked)}
                  disabled={isSavingPreferences}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">FairFlow Updates</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Notifications when task rebalancing occurs
                  </div>
                </div>
                <Switch
                  checked={preferences.fair_flow_updates}
                  onCheckedChange={(checked) => handlePreferenceChange('fair_flow_updates', checked)}
                  disabled={isSavingPreferences}
                />
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={handleSendTestEmail}
                  disabled={isSendingTestEmail}
                  variant="outline"
                  className="w-full"
                >
                  {isSendingTestEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending Test Email...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Test Email
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Test your email configuration by sending a test email
                </p>
              </div>
            </div>
          )}
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

      {user?.email === 'zarachiara@gmail.com' && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-purple-700">
              <TestTube className="w-5 h-5" />
              <span>Email Testing Dashboard</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-purple-900 mb-4">
              Access the email testing dashboard to send test emails for all notification types.
              This is only visible to admin users.
            </p>
            <Button
              onClick={() => navigate('/email-testing')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <TestTube className="w-4 h-4 mr-2" />
              Open Email Testing Dashboard
            </Button>
          </CardContent>
        </Card>
      )}

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