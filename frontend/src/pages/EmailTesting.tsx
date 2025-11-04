import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Only show this page in development
if (import.meta.env.PROD) {
  throw new Error('Email testing page should not be accessible in production');
}

export default function EmailTesting() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState('zarachiara@gmail.com');
  const [loading, setLoading] = useState<string | null>(null);

  const sendTestEmail = async (emailType: string) => {
    if (!token) {
      toast({
        title: 'Error',
        description: 'You must be logged in to send test emails',
        variant: 'destructive',
      });
      return;
    }

    setLoading(emailType);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/notifications/test/${emailType}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test_email: testEmail,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send test email');
      }

      const data = await response.json();
      toast({
        title: 'Success',
        description: data.message || `${emailType} email sent successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send test email',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const emailTypes = [
    {
      id: 'test',
      title: 'Test Email',
      description: 'Basic test email to verify email settings',
    },
    {
      id: 'new_assignment',
      title: 'New Task Assignment',
      description: 'Email sent when a new task is assigned to a user',
    },
    {
      id: 'task_reminder',
      title: 'Task Reminder',
      description: 'Reminder email sent before a task is due',
    },
    {
      id: 'overdue_tasks',
      title: 'Overdue Tasks',
      description: 'Email sent when tasks become overdue',
    },
    {
      id: 'weekly_digest',
      title: 'Weekly Digest',
      description: 'Weekly summary of tasks, points, and household activity',
    },
    {
      id: 'fairflow_completion',
      title: 'FairFlow Rebalancing',
      description: 'Email sent when FairFlow rebalancing completes',
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📧 Email Testing Dashboard</h1>
        <p className="text-muted-foreground">
          Test all email notification types. Emails will use real data from your account.
        </p>
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Development Only:</strong> This page is only accessible in development mode and will not be deployed to production.
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Email Address</CardTitle>
          <CardDescription>
            Enter the email address where test emails should be sent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="test-email">Email Address</Label>
              <Input
                id="test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
          </div>
          {user && (
            <p className="text-sm text-muted-foreground mt-2">
              Logged in as: <strong>{user.email}</strong>
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {emailTypes.map((type) => (
          <Card key={type.id}>
            <CardHeader>
              <CardTitle className="text-lg">{type.title}</CardTitle>
              <CardDescription>{type.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => sendTestEmail(type.id)}
                disabled={loading === type.id || !token}
                className="w-full"
              >
                {loading === type.id ? 'Sending...' : 'Send Test Email'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Each test email uses <strong>real data</strong> from your logged-in account</p>
          <p>• Task-related emails will use actual tasks from your household</p>
          <p>• Weekly digest will show your actual stats and upcoming tasks</p>
          <p>• If no real data is available, realistic sample data will be used</p>
          <p>• All emails are sent to the address specified above</p>
        </CardContent>
      </Card>
    </div>
  );
}