# Email Notification Setup Guide

## Quick Start

The email notification feature has been successfully integrated with the UI! Follow these steps to test it:

## Prerequisites

1. **Brevo Account** (formerly Sendinblue)
   - Sign up for free at https://www.brevo.com/
   - Free tier includes 300 emails/day

2. **Backend Running**
   - The backend should be running on `http://localhost:8000`

3. **Frontend Running**
   - The frontend should be running on `http://localhost:5173` or `http://localhost:5138`

## Setup Steps

### 1. Get Your Brevo API Key

1. Go to https://www.brevo.com/ and sign up or log in
2. Navigate to **Settings** → **API Keys**
3. Click **Create a new API key**
4. Give it a name (e.g., "FairShare Development")
5. Copy the generated API key

### 2. Configure Backend Environment

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a `.env` file if it doesn't exist:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file and add your Brevo API key:
   ```env
   # Email Configuration (Brevo)
   BREVO_API_KEY=your-actual-brevo-api-key-here
   SENDER_EMAIL=noreply@fairshare.app
   SENDER_NAME=FairShare
   ```

   **Note:** For testing, you can use any sender email. For production, you'll need to verify your domain in Brevo.

4. Restart the backend server (it should auto-reload if using `--reload` flag)

### 3. Test the Email Feature

1. **Log in to the application** (or create an account if needed)

2. **Navigate to Settings**
   - Click on the Settings page in the navigation

3. **Configure Email Preferences**
   - You'll see 5 toggle switches for different notification types:
     - Daily Task Reminders
     - Weekly Fairness Summary
     - Task Due Reminders
     - Overdue Task Follow-ups
     - FairFlow Updates
   - Toggle them on/off as desired
   - Changes are saved automatically

4. **Send a Test Email**
   - Click the "Send Test Email" button at the bottom of the Email Notifications card
   - You should see a success message
   - Check your email inbox (the email address you used to log in)
   - The test email should arrive within a few seconds

## What You'll See

### In the UI

- **Email Notifications Card**: Shows your current email address and notification preferences
- **Toggle Switches**: Interactive switches for each notification type
- **Test Email Button**: Sends a test email to verify configuration
- **Loading States**: Spinners while saving preferences or sending emails
- **Success/Error Messages**: Toast notifications for all actions

### In Your Email

The test email will include:
- Professional FairShare branding
- Gradient header design
- Confirmation that your email configuration is working
- Responsive design that works on mobile and desktop

## Troubleshooting

### "Failed to send test email"

1. **Check API Key**: Verify your Brevo API key is correct in `.env`
2. **Check Backend Logs**: Look for error messages in the terminal running the backend
3. **Verify Email**: Make sure you're logged in with a valid email address
4. **Check Brevo Dashboard**: Log in to Brevo and check if there are any issues with your account

### "Failed to update preferences"

1. **Check Authentication**: Make sure you're logged in
2. **Check Backend**: Verify the backend is running on port 8000
3. **Check Console**: Open browser DevTools and check for any error messages

### Email Not Arriving

1. **Check Spam Folder**: Test emails might be filtered as spam
2. **Check Brevo Limits**: Free tier has 300 emails/day limit
3. **Verify Sender Domain**: For production, verify your domain in Brevo settings
4. **Check Email Logs**: The backend logs all email attempts to MongoDB

## API Endpoints

The following endpoints are now available:

### Get Notification Preferences
```bash
GET http://localhost:8000/api/v1/notifications/preferences
Authorization: Bearer <your-token>
```

### Update Notification Preferences
```bash
PUT http://localhost:8000/api/v1/notifications/preferences
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "daily_reminders": true,
  "weekly_fairness_summary": true,
  "task_due_reminders": true,
  "overdue_follow_ups": true,
  "fair_flow_updates": true
}
```

### Send Test Email
```bash
POST http://localhost:8000/api/v1/notifications/test-email
Authorization: Bearer <your-token>
```

## Features Implemented

✅ **Frontend Integration**
- Email notification settings in Settings page
- Toggle switches for each notification type
- Test email button
- Real-time preference updates
- Loading states and error handling

✅ **Backend API**
- Get/Update notification preferences
- Send test email endpoint
- Email service with Brevo integration
- Email logging to database

✅ **Email Templates**
- Professional HTML email templates
- Responsive design
- Consistent branding
- Multiple email types (reminders, digests, alerts)

## Next Steps

Once you've verified the email system is working:

1. **Customize Email Templates**: Edit templates in `backend/app/templates/emails/`
2. **Add More Email Types**: Extend the email service with new notification types
3. **Set Up Scheduled Tasks**: Implement automated email sending (daily/weekly)
4. **Add Email Analytics**: Track open rates and click-through rates
5. **Implement Unsubscribe**: Add unsubscribe functionality for compliance

## Production Considerations

Before deploying to production:

1. **Verify Domain**: Verify your sender domain in Brevo
2. **Update Sender Email**: Use your verified domain email
3. **Set Up DKIM/SPF**: Configure email authentication
4. **Implement Rate Limiting**: Protect against email abuse
5. **Add Unsubscribe Links**: Required for compliance
6. **Monitor Delivery**: Set up alerts for failed deliveries

## Support

For more information:
- Brevo Documentation: https://developers.brevo.com/
- Email Implementation Details: See `EMAIL_NOTIFICATION_IMPLEMENTATION.md`
- Email System Architecture: See `EMAIL_SYSTEM_ARCHITECTURE.md`

## Demo Mode Removed

The "Demo Mode" labels have been removed from the Email Notifications section. The feature is now fully functional and connected to the backend API!