# Email Notification System - Implementation Summary

## Overview

This document summarizes the implementation of the email notification system for the FairShare household task management application. The system uses Brevo (formerly Sendinblue) for sending transactional emails and includes comprehensive notification preferences for users.

## What Was Implemented

### 1. Database Models

#### NotificationPreferences Model
**File:** [`backend/app/models/notification.py`](backend/app/models/notification.py)

A new Pydantic model for managing user notification preferences:
- `daily_reminders`: Toggle for daily task reminders
- `weekly_fairness_summary`: Toggle for weekly fairness reports
- `task_due_reminders`: Toggle for upcoming task notifications
- `overdue_follow_ups`: Toggle for overdue task alerts
- `fair_flow_updates`: Toggle for FairFlow rebalancing notifications

#### EmailLog Model
**File:** [`backend/app/models/notification.py`](backend/app/models/notification.py)

Tracks all sent emails for debugging and analytics:
- User ID, email type, recipient, subject
- Sent timestamp and delivery status
- Error messages for failed deliveries

#### Updated User Model
**File:** [`backend/app/models/user.py`](backend/app/models/user.py)

Added `notification_preferences` field to the `UserInDB` and `UserResponse` models with default values enabled.

### 2. Email Service

**File:** [`backend/app/services/email_service.py`](backend/app/services/email_service.py)

A comprehensive email service with the following features:

#### Core Functionality
- Integration with Brevo API for sending emails
- Jinja2 template rendering for dynamic email content
- Automatic email logging to database
- Error handling and retry logic

#### Email Methods
- `send_task_reminder()`: Sends reminders for upcoming tasks
- `send_new_assignment()`: Notifies users of new task assignments
- `send_weekly_digest()`: Sends weekly summary of tasks and fairness scores
- `send_overdue_tasks()`: Alerts users about overdue tasks
- `send_fairflow_completion()`: Notifies about FairFlow rebalancing completion

### 3. API Endpoints

**File:** [`backend/app/routers/notifications.py`](backend/app/routers/notifications.py)

Three new REST API endpoints:

#### GET `/api/v1/notifications/preferences`
Retrieves the current user's notification preferences.

**Response:**
```json
{
  "daily_reminders": true,
  "weekly_fairness_summary": true,
  "task_due_reminders": true,
  "overdue_follow_ups": true,
  "fair_flow_updates": true
}
```

#### PUT `/api/v1/notifications/preferences`
Updates the current user's notification preferences.

**Request Body:**
```json
{
  "daily_reminders": false,
  "weekly_fairness_summary": true,
  "task_due_reminders": true,
  "overdue_follow_ups": false,
  "fair_flow_updates": true
}
```

#### POST `/api/v1/notifications/test-email`
Sends a test email to verify the email configuration is working correctly.

**Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully to user@example.com"
}
```

### 4. Email Templates

**Directory:** [`backend/app/templates/emails/`](backend/app/templates/emails/)

Six professionally designed HTML email templates:

1. **task_reminder.html** - Upcoming task reminders
2. **new_assignment.html** - New task assignment notifications
3. **weekly_digest.html** - Weekly summary with stats and upcoming tasks
4. **overdue_tasks.html** - Overdue task alerts
5. **fairflow_completion.html** - FairFlow rebalancing completion
6. **test_email.html** - Test email for configuration verification

All templates feature:
- Responsive design
- Consistent branding with gradient headers
- Clear call-to-action buttons
- Professional styling

### 5. Configuration Updates

#### Environment Variables
**File:** [`backend/.env.example`](backend/.env.example)

Added three new environment variables:
```env
BREVO_API_KEY=your-brevo-api-key-here
SENDER_EMAIL=noreply@fairshare.app
SENDER_NAME=FairShare
```

#### Application Config
**File:** [`backend/app/config.py`](backend/app/config.py)

Added email settings to the Settings class:
- `brevo_api_key`: Brevo API key for authentication
- `sender_email`: Default sender email address
- `sender_name`: Default sender name

#### Dependencies
**File:** [`backend/requirements.txt`](backend/requirements.txt)

Added two new dependencies:
- `sib-api-v3-sdk==7.6.0` - Brevo Python SDK
- `jinja2==3.1.4` - Template engine for email rendering

### 6. Router Registration

**File:** [`backend/app/main.py`](backend/app/main.py)

Registered the notifications router in the main FastAPI application.

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Brevo

1. Sign up for a free Brevo account at https://www.brevo.com/
2. Navigate to Settings > API Keys
3. Create a new API key
4. Copy the API key

### 3. Update Environment Variables

Create or update your `.env` file:

```env
BREVO_API_KEY=your-actual-api-key-here
SENDER_EMAIL=noreply@yourdomain.com
SENDER_NAME=FairShare
```

### 4. Verify Email Domain (Production)

For production use, verify your sender domain in Brevo:
1. Go to Settings > Senders & IP
2. Add and verify your domain
3. Update `SENDER_EMAIL` to use your verified domain

## Testing the Implementation

### 1. Test Email Configuration

Use the test endpoint to verify your setup:

```bash
curl -X POST http://localhost:8000/api/v1/notifications/test-email \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Update Notification Preferences

```bash
curl -X PUT http://localhost:8000/api/v1/notifications/preferences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "daily_reminders": true,
    "weekly_fairness_summary": true,
    "task_due_reminders": true,
    "overdue_follow_ups": true,
    "fair_flow_updates": true
  }'
```

### 3. Get Current Preferences

```bash
curl -X GET http://localhost:8000/api/v1/notifications/preferences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Next Steps (Not Yet Implemented)

The following components were planned but not yet implemented:

### 1. Scheduled Email Tasks

Create task handlers in [`backend/app/services/task_handlers.py`](backend/app/services/task_handlers.py) for:
- Checking for upcoming tasks (every 5 minutes)
- Sending daily overdue task summaries
- Sending weekly fairness digests (Sunday evenings)

### 2. Frontend Notification Settings Page

Create a React component at `frontend/src/pages/NotificationSettings.tsx` with:
- Toggle switches for each notification preference
- Real-time updates via API
- Test email button
- Success/error notifications

### 3. Integration with Task System

Add email triggers when:
- Tasks are created or assigned
- Tasks become overdue
- FairFlow rebalancing completes
- Task due dates approach

## API Documentation

Once the server is running, view the interactive API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Troubleshooting

### Email Not Sending

1. **Check API Key**: Verify your Brevo API key is correct
2. **Check Logs**: Look for error messages in the server logs
3. **Verify Domain**: Ensure sender email domain is verified in Brevo
4. **Check Limits**: Free tier has 300 emails/day limit

### Template Errors

1. **Check Template Path**: Ensure templates are in `backend/app/templates/emails/`
2. **Check Template Syntax**: Verify Jinja2 syntax is correct
3. **Check Context Variables**: Ensure all required variables are passed

### Database Errors

1. **Check MongoDB Connection**: Verify MongoDB is running and accessible
2. **Check Collections**: Ensure `email_logs` collection exists
3. **Check Permissions**: Verify database user has write permissions

## Architecture Diagram

```
┌─────────────────┐
│   Frontend      │
│  (React/TS)     │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────┐
│   FastAPI       │
│   Backend       │
├─────────────────┤
│ Notifications   │
│   Router        │
└────────┬────────┘
         │
         ├──────────────┐
         │              │
┌────────▼────────┐ ┌──▼──────────┐
│  Email Service  │ │  MongoDB    │
│   (Brevo SDK)   │ │  Database   │
└────────┬────────┘ └─────────────┘
         │
         │ SMTP/API
         │
┌────────▼────────┐
│     Brevo       │
│  Email Service  │
└─────────────────┘
```

## Security Considerations

1. **API Key Protection**: Never commit `.env` file with real API keys
2. **Rate Limiting**: Implement rate limiting on email endpoints
3. **Email Validation**: Validate email addresses before sending
4. **User Consent**: Respect user notification preferences
5. **Unsubscribe**: Implement unsubscribe functionality (future)

## Performance Considerations

1. **Async Operations**: All email operations are async
2. **Background Tasks**: Consider using Celery for large email batches
3. **Template Caching**: Jinja2 templates are cached automatically
4. **Database Indexing**: Index email_logs collection by user_id and sent_at

## Monitoring and Analytics

Track the following metrics:
- Email delivery rate
- Open rate (requires tracking pixels)
- Click-through rate (requires link tracking)
- Bounce rate
- Unsubscribe rate

## Support

For issues or questions:
1. Check the logs in `backend/logs/`
2. Review Brevo dashboard for delivery status
3. Consult Brevo API documentation: https://developers.brevo.com/

## License

This implementation is part of the FairShare application.