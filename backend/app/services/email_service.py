import logging
from typing import Dict, Any, Optional
from datetime import datetime
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from jinja2 import Environment, FileSystemLoader, select_autoescape
import os
from pathlib import Path

from app.config import settings
from app.database import get_database

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via Brevo (formerly Sendinblue)."""
    
    def __init__(self):
        """Initialize the email service with Brevo API configuration."""
        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key['api-key'] = settings.brevo_api_key
        self.api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
            sib_api_v3_sdk.ApiClient(configuration)
        )
        
        # Setup Jinja2 template environment
        template_dir = Path(__file__).parent.parent / "templates" / "emails"
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(template_dir)),
            autoescape=select_autoescape(['html', 'xml'])
        )
        
        logger.info("Email service initialized with Brevo")
    
    async def send_email(
        self,
        to_email: str,
        to_name: str,
        subject: str,
        template_name: str,
        context: Dict[str, Any],
        user_id: Optional[str] = None,
        email_type: str = "general"
    ) -> bool:
        """
        Send an email using a template.
        
        Args:
            to_email: Recipient email address
            to_name: Recipient name
            subject: Email subject
            template_name: Name of the template file (without .html extension)
            context: Dictionary of variables to pass to the template
            user_id: Optional user ID for logging
            email_type: Type of email for logging purposes
            
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        try:
            # Render the email template
            template = self.jinja_env.get_template(f"{template_name}.html")
            html_content = template.render(**context)
            
            # Create email object
            send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                to=[{"email": to_email, "name": to_name}],
                sender={"email": settings.sender_email, "name": settings.sender_name},
                subject=subject,
                html_content=html_content
            )
            
            # Send the email
            api_response = self.api_instance.send_transac_email(send_smtp_email)
            
            # Log the email
            await self._log_email(
                user_id=user_id,
                email_type=email_type,
                recipient_email=to_email,
                subject=subject,
                status="sent"
            )
            
            logger.info(f"Email sent successfully to {to_email}. Message ID: {api_response.message_id}")
            return True
            
        except ApiException as e:
            error_msg = f"Brevo API error: {e}"
            logger.error(error_msg)
            
            # Log the failed email
            await self._log_email(
                user_id=user_id,
                email_type=email_type,
                recipient_email=to_email,
                subject=subject,
                status="failed",
                error_message=str(e)
            )
            return False
            
        except Exception as e:
            error_msg = f"Error sending email: {e}"
            logger.error(error_msg)
            
            # Log the failed email
            await self._log_email(
                user_id=user_id,
                email_type=email_type,
                recipient_email=to_email,
                subject=subject,
                status="failed",
                error_message=str(e)
            )
            return False
    
    async def _log_email(
        self,
        email_type: str,
        recipient_email: str,
        subject: str,
        status: str,
        user_id: Optional[str] = None,
        error_message: Optional[str] = None
    ):
        """Log email send attempt to database."""
        try:
            db = get_database()
            email_log = {
                "user_id": user_id,
                "email_type": email_type,
                "recipient_email": recipient_email,
                "subject": subject,
                "sent_at": datetime.utcnow(),
                "status": status,
                "error_message": error_message
            }
            
            await db.email_logs.insert_one(email_log)
            
        except Exception as e:
            logger.error(f"Error logging email: {e}")
    
    async def send_task_reminder(
        self,
        user_email: str,
        user_name: str,
        task_name: str,
        task_due: datetime,
        household_name: str,
        user_id: Optional[str] = None
    ) -> bool:
        """Send a task reminder email."""
        context = {
            "user_name": user_name,
            "task_name": task_name,
            "task_due": task_due.strftime("%B %d, %Y at %I:%M %p"),
            "household_name": household_name
        }
        
        return await self.send_email(
            to_email=user_email,
            to_name=user_name,
            subject=f"Reminder: {task_name} is due soon",
            template_name="task_reminder",
            context=context,
            user_id=user_id,
            email_type="task_reminder"
        )
    
    async def send_new_assignment(
        self,
        user_email: str,
        user_name: str,
        task_name: str,
        task_description: str,
        household_name: str,
        user_id: Optional[str] = None
    ) -> bool:
        """Send a new task assignment email."""
        context = {
            "user_name": user_name,
            "task_name": task_name,
            "task_description": task_description,
            "household_name": household_name
        }
        
        return await self.send_email(
            to_email=user_email,
            to_name=user_name,
            subject=f"New Task Assigned: {task_name}",
            template_name="new_assignment",
            context=context,
            user_id=user_id,
            email_type="new_assignment"
        )
    
    async def send_weekly_digest(
        self,
        user_email: str,
        user_name: str,
        household_name: str,
        tasks_completed: int,
        points_earned: int,
        fairness_score: float,
        upcoming_tasks: list,
        user_id: Optional[str] = None
    ) -> bool:
        """Send a weekly digest email."""
        context = {
            "user_name": user_name,
            "household_name": household_name,
            "tasks_completed": tasks_completed,
            "points_earned": points_earned,
            "fairness_score": fairness_score,
            "upcoming_tasks": upcoming_tasks
        }
        
        return await self.send_email(
            to_email=user_email,
            to_name=user_name,
            subject=f"Your Weekly FairShare Summary",
            template_name="weekly_digest",
            context=context,
            user_id=user_id,
            email_type="weekly_digest"
        )
    
    async def send_overdue_tasks(
        self,
        user_email: str,
        user_name: str,
        household_name: str,
        overdue_tasks: list,
        user_id: Optional[str] = None
    ) -> bool:
        """Send an overdue tasks notification email."""
        context = {
            "user_name": user_name,
            "household_name": household_name,
            "overdue_tasks": overdue_tasks,
            "task_count": len(overdue_tasks)
        }
        
        return await self.send_email(
            to_email=user_email,
            to_name=user_name,
            subject=f"You have {len(overdue_tasks)} overdue task(s)",
            template_name="overdue_tasks",
            context=context,
            user_id=user_id,
            email_type="overdue_tasks"
        )
    
    async def send_fairflow_completion(
        self,
        user_email: str,
        user_name: str,
        household_name: str,
        rebalance_summary: Dict[str, Any],
        user_id: Optional[str] = None
    ) -> bool:
        """Send a FairFlow completion notification email."""
        context = {
            "user_name": user_name,
            "household_name": household_name,
            "rebalance_summary": rebalance_summary
        }
        
        return await self.send_email(
            to_email=user_email,
            to_name=user_name,
            subject="FairFlow Rebalancing Complete",
            template_name="fairflow_completion",
            context=context,
            user_id=user_id,
            email_type="fairflow_completion"
        )


# Global email service instance
email_service = EmailService()