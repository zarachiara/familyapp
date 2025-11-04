# Email Notification System Architecture

This document outlines the architecture for implementing an email notification system in the FairShare application.

## 1. Database Schema Changes

### 1.1. New `NotificationPreference` Model

A new model will be created to store user-specific notification preferences.

```python
# backend/app/models/notification.py

from pydantic import BaseModel

class NotificationPreferences(BaseModel):
    daily_reminders: bool = True
    weekly_fairness_summary: bool = True
    task_due_reminders: bool = True
    overdue_follow_ups: bool = True
    fair_flow_updates: bool = True
```

### 1.2. `User` Model Update

The `User` model will be updated to include a field for notification preferences.

```python
# backend/app/models/user.py

# ... existing imports
from app.models.notification import NotificationPreferences

class UserInDB(UserBase):
    # ... existing fields
    notification_preferences: NotificationPreferences = Field(default_factory=NotificationPreferences)
```

## 2. Backend API Endpoints

New endpoints will be created to manage user notification preferences.

-   **`GET /api/v1/users/me/notification-preferences`**: Fetches the current user's notification preferences.
-   **`PUT /api/v1/users/me/notification-preferences`**: Updates the current user's notification preferences.

These will be implemented in a new router file: `backend/app/routers/notifications.py`.

## 3. Email Service Integration

We will use Brevo for sending emails.

### 3.1. New `EmailService`

A new service will be created at `backend/app/services/email_service.py` to handle all email-related logic.

```python
# backend/app/services/email_service.py

class EmailService:
    def __init__(self, api_key: str):
        # ... initialization logic for Brevo SDK

    def send_email(self, to: str, subject: str, template: str, context: dict):
        # ... logic to send email using Brevo
```

### 3.2. Configuration

The Brevo API key will be stored in the `.env` file.

```
# .env
BREVO_API_KEY=your_api_key
```

## 4. Cron Job Setup

The existing scheduler service (`backend/app/services/scheduler.py`) will be used to schedule email notifications. New task handlers will be created in `backend/app/services/task_handlers.py` for each scheduled email type.

-   **Upcoming task due:** Runs every 5 minutes to check for tasks due in the next 1-2 hours.
-   **Missed/overdue task:** Runs daily to send a summary of overdue tasks.
-   **Weekly fairness update:** Runs every Sunday evening.

## 5. Frontend UI for Notification Preferences

A new settings page will be created in the frontend at `frontend/src/pages/Settings.tsx` to allow users to manage their notification preferences. This page will use a form with toggles for each preference.

## 6. Email Templates Structure

Email templates will be created as HTML files in a new `backend/app/templates` directory.

-   `task_reminder.html`
-   `new_assignment.html`
-   `weekly_digest.html`
-   `overdue_tasks.html`
-   `fairflow_completion.html`

These templates will use a templating engine like Jinja2 to inject dynamic content.