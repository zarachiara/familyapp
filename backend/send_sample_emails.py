"""
Script to send sample emails for all notification types.
Run this to preview how each email notification will look.
"""
import asyncio
from datetime import datetime, timedelta
from app.services.email_service import email_service

async def send_all_samples():
    """Send sample emails for all notification types."""
    
    recipient_email = "zarachiara@gmail.com"
    recipient_name = "Zara"
    
    print(f"Sending sample emails to {recipient_email}...\n")
    
    # 1. Test Email
    print("1. Sending Test Email...")
    success = await email_service.send_email(
        to_email=recipient_email,
        to_name=recipient_name,
        subject="Test Email from FairShare",
        template_name="test_email",
        context={
            "user_name": recipient_name,
            "test_message": "This is a test email to verify your email notification settings."
        },
        user_id="sample_user_id",
        email_type="test"
    )
    print(f"   {'✅ Sent' if success else '❌ Failed'}\n")
    
    # 2. New Task Assignment
    print("2. Sending New Task Assignment Email...")
    success = await email_service.send_email(
        to_email=recipient_email,
        to_name=recipient_name,
        subject="New Task Assigned: Clean the Kitchen",
        template_name="new_assignment",
        context={
            "user_name": recipient_name,
            "task_name": "Clean the Kitchen",
            "task_description": "Wipe down counters, do dishes, and sweep the floor",
            "due_date": (datetime.now() + timedelta(days=2)).strftime("%B %d, %Y"),
            "points": 15,
            "app_url": "http://localhost:5173"
        },
        user_id="sample_user_id",
        email_type="new_assignment"
    )
    print(f"   {'✅ Sent' if success else '❌ Failed'}\n")
    
    # 3. Task Reminder
    print("3. Sending Task Reminder Email...")
    success = await email_service.send_email(
        to_email=recipient_email,
        to_name=recipient_name,
        subject="Reminder: Clean the Kitchen is due soon",
        template_name="task_reminder",
        context={
            "user_name": recipient_name,
            "task_name": "Clean the Kitchen",
            "due_date": (datetime.now() + timedelta(days=1)).strftime("%B %d, %Y at %I:%M %p"),
            "time_remaining": "1 day",
            "app_url": "http://localhost:5173"
        },
        user_id="sample_user_id",
        email_type="task_reminder"
    )
    print(f"   {'✅ Sent' if success else '❌ Failed'}\n")
    
    # 4. Overdue Tasks
    print("4. Sending Overdue Tasks Email...")
    success = await email_service.send_email(
        to_email=recipient_email,
        to_name=recipient_name,
        subject="You have 2 overdue tasks",
        template_name="overdue_tasks",
        context={
            "user_name": recipient_name,
            "overdue_count": 2,
            "tasks": [
                {
                    "name": "Take out the trash",
                    "due_date": (datetime.now() - timedelta(days=2)).strftime("%B %d, %Y"),
                    "days_overdue": 2
                },
                {
                    "name": "Water the plants",
                    "due_date": (datetime.now() - timedelta(days=1)).strftime("%B %d, %Y"),
                    "days_overdue": 1
                }
            ],
            "app_url": "http://localhost:5173"
        },
        user_id="sample_user_id",
        email_type="overdue_alert"
    )
    print(f"   {'✅ Sent' if success else '❌ Failed'}\n")
    
    # 5. Weekly Digest
    print("5. Sending Weekly Digest Email...")
    success = await email_service.send_email(
        to_email=recipient_email,
        to_name=recipient_name,
        subject="Your Weekly FairShare Summary",
        template_name="weekly_digest",
        context={
            "user_name": recipient_name,
            "week_start": (datetime.now() - timedelta(days=7)).strftime("%B %d"),
            "week_end": datetime.now().strftime("%B %d, %Y"),
            "tasks_completed": 8,
            "points_earned": 120,
            "current_rank": 2,
            "total_members": 4,
            "upcoming_tasks": [
                {
                    "name": "Grocery shopping",
                    "due_date": (datetime.now() + timedelta(days=2)).strftime("%B %d")
                },
                {
                    "name": "Vacuum living room",
                    "due_date": (datetime.now() + timedelta(days=3)).strftime("%B %d")
                }
            ],
            "fairness_score": 85,
            "app_url": "http://localhost:5173"
        },
        user_id="sample_user_id",
        email_type="weekly_digest"
    )
    print(f"   {'✅ Sent' if success else '❌ Failed'}\n")
    
    # 6. FairFlow Rebalancing Complete
    print("6. Sending FairFlow Rebalancing Complete Email...")
    success = await email_service.send_email(
        to_email=recipient_email,
        to_name=recipient_name,
        subject="🔄 FairFlow Rebalancing Complete",
        template_name="fairflow_completion",
        context={
            "user_name": recipient_name,
            "household_name": "The Smith Family",
            "rebalance_summary": {
                "Tasks Redistributed": "15 tasks",
                "Members Affected": "4 members",
                "Fairness Score": "92%",
                "Balance Improvement": "+12%"
            },
            "app_url": "http://localhost:5173"
        },
        user_id="sample_user_id",
        email_type="fairflow_completion"
    )
    print(f"   {'✅ Sent' if success else '❌ Failed'}\n")
    
    print("=" * 50)
    print("All sample emails sent!")
    print(f"Check your inbox at {recipient_email}")
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(send_all_samples())