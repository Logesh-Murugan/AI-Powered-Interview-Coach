"""Email service for sending emails via SMTP."""

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
from jinja2 import Environment, FileSystemLoader, select_autoescape
import os
from pathlib import Path

from app.email_config.email_config import email_config


class EmailService:
    """Service for sending emails with HTML templates."""
    
    def __init__(self):
        """Initialize email service with Jinja2 template engine."""
        # Set up Jinja2 template environment
        template_dir = Path(__file__).parent.parent / "templates" / "emails"
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(template_dir)),
            autoescape=select_autoescape(['html', 'xml'])
        )
        self.config = email_config
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        plain_text_content: Optional[str] = None,
        max_retries: int = 3
    ) -> Dict[str, Any]:
        """
        Send an email via SMTP with retry logic.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML email body
            plain_text_content: Plain text email body (optional)
            max_retries: Maximum number of retry attempts
            
        Returns:
            Dictionary with success status and message
        """
        import asyncio
        last_error = None
        
        for attempt in range(max_retries):
            smtp_client = None
            try:
                # Create message
                message = MIMEMultipart("alternative")
                message["From"] = f"{self.config.EMAIL_FROM_NAME} <{self.config.EMAIL_FROM_ADDRESS}>"
                message["To"] = to_email
                message["Subject"] = subject
                
                # Add plain text part (fallback)
                if plain_text_content:
                    text_part = MIMEText(plain_text_content, "plain")
                    message.attach(text_part)
                
                # Add HTML part
                html_part = MIMEText(html_content, "html")
                message.attach(html_part)
                
                # Send email via SMTP with proper TLS handling
                # For port 587, use STARTTLS (connect without TLS, then upgrade)
                # For port 465, use implicit TLS (connect with TLS)
                use_tls = (self.config.SMTP_PORT == 465)
                start_tls = (self.config.SMTP_PORT == 587 and self.config.SMTP_USE_TLS)
                
                # Shorter timeout to fail faster and retry
                smtp_client = aiosmtplib.SMTP(
                    hostname=self.config.SMTP_HOST,
                    port=self.config.SMTP_PORT,
                    timeout=30,  # Reduced from 60 to 30 seconds
                    use_tls=use_tls,  # Only True for port 465
                    start_tls=start_tls  # True for port 587 with TLS
                )
                
                # Connect to SMTP server with timeout (this will handle STARTTLS automatically)
                await asyncio.wait_for(smtp_client.connect(), timeout=15)
                
                # Login with timeout
                if self.config.SMTP_USERNAME and self.config.SMTP_PASSWORD:
                    await asyncio.wait_for(
                        smtp_client.login(
                            self.config.SMTP_USERNAME,
                            self.config.SMTP_PASSWORD
                        ),
                        timeout=15
                    )
                
                # Send message with timeout
                await asyncio.wait_for(smtp_client.send_message(message), timeout=30)
                
                # Close connection gracefully
                try:
                    await asyncio.wait_for(smtp_client.quit(), timeout=5)
                except:
                    pass
                
                print(f"Email sent successfully to {to_email} (attempt {attempt + 1})")
                
                return {
                    "success": True,
                    "message": f"Email sent successfully to {to_email}"
                }
                
            except asyncio.TimeoutError:
                last_error = "Connection timeout"
                print(f"Timeout sending email to {to_email} (attempt {attempt + 1}/{max_retries})")
                
                # Force close connection on timeout
                if smtp_client:
                    try:
                        await smtp_client.close()
                    except:
                        pass
                
            except aiosmtplib.SMTPException as e:
                last_error = f"SMTP error: {str(e)}"
                print(f"SMTP error sending email to {to_email} (attempt {attempt + 1}/{max_retries}): {str(e)}")
                
                # Close connection on error
                if smtp_client:
                    try:
                        await smtp_client.close()
                    except:
                        pass
                
                # Don't retry on authentication errors
                if "authentication" in str(e).lower() or "auth" in str(e).lower():
                    break
                    
            except Exception as e:
                last_error = f"Unexpected error: {str(e)}"
                print(f"Unexpected error sending email to {to_email} (attempt {attempt + 1}/{max_retries}): {str(e)}")
                
                # Close connection on error
                if smtp_client:
                    try:
                        await smtp_client.close()
                    except:
                        pass
            
            # Wait before retry (exponential backoff)
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # 1s, 2s, 4s
                print(f"Waiting {wait_time}s before retry...")
                await asyncio.sleep(wait_time)
        
        # All retries failed
        error_msg = f"Failed to send email to {to_email} after {max_retries} attempts: {last_error}"
        print(error_msg)
        return {
            "success": False,
            "message": error_msg
        }
    
    async def send_password_reset_email(
        self,
        to_email: str,
        reset_token: str,
        user_name: str,
        expiration_hours: int = 1
    ) -> Dict[str, Any]:
        """
        Send password reset email with reset link.
        
        Args:
            to_email: User's email address
            reset_token: Password reset token
            user_name: User's name
            expiration_hours: Token expiration time in hours
            
        Returns:
            Dictionary with success status and message
        """
        # Generate reset link
        reset_link = f"{self.config.FRONTEND_URL}/reset-password?token={reset_token}"
        
        # Render HTML template
        template = self.jinja_env.get_template("password_reset.html")
        html_content = template.render(
            user_name=user_name,
            reset_link=reset_link,
            expiration_hours=expiration_hours
        )
        
        # Plain text fallback
        plain_text = f"""
Hello {user_name},

You requested to reset your password for InterviewMaster AI.

Click the link below to reset your password:
{reset_link}

This link will expire in {expiration_hours} hour(s).

If you didn't request this, please ignore this email.

Best regards,
InterviewMaster AI Team
        """.strip()
        
        # Send email
        return await self.send_email(
            to_email=to_email,
            subject="Reset Your Password - InterviewMaster AI",
            html_content=html_content,
            plain_text_content=plain_text
        )
    
    async def send_welcome_email(
        self,
        to_email: str,
        user_name: str
    ) -> Dict[str, Any]:
        """
        Send welcome email to new users.
        
        Args:
            to_email: User's email address
            user_name: User's name
            
        Returns:
            Dictionary with success status and message
        """
        # Render HTML template
        template = self.jinja_env.get_template("welcome.html")
        html_content = template.render(
            user_name=user_name,
            dashboard_link=f"{self.config.FRONTEND_URL}/dashboard"
        )
        
        # Plain text fallback
        plain_text = f"""
Hello {user_name},

Welcome to InterviewMaster AI!

We're excited to help you prepare for your next interview.

Get started by visiting your dashboard:
{self.config.FRONTEND_URL}/dashboard

Best regards,
InterviewMaster AI Team
        """.strip()
        
        # Send email
        return await self.send_email(
            to_email=to_email,
            subject="Welcome to InterviewMaster AI!",
            html_content=html_content,
            plain_text_content=plain_text
        )
    
    async def send_notification_email(
        self,
        to_email: str,
        user_name: str,
        notification_title: str,
        notification_message: str,
        action_link: Optional[str] = None,
        action_text: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send generic notification email.
        
        Args:
            to_email: User's email address
            user_name: User's name
            notification_title: Title of the notification
            notification_message: Main notification message
            action_link: Optional link for action button
            action_text: Optional text for action button
            
        Returns:
            Dictionary with success status and message
        """
        # Render HTML template
        template = self.jinja_env.get_template("notification.html")
        html_content = template.render(
            user_name=user_name,
            notification_title=notification_title,
            notification_message=notification_message,
            action_link=action_link,
            action_text=action_text
        )
        
        # Plain text fallback
        plain_text = f"""
Hello {user_name},

{notification_title}

{notification_message}
"""
        if action_link:
            plain_text += f"\n\n{action_text or 'Click here'}: {action_link}"
        
        plain_text += "\n\nBest regards,\nInterviewMaster AI Team"
        
        # Send email
        return await self.send_email(
            to_email=to_email,
            subject=f"{notification_title} - InterviewMaster AI",
            html_content=html_content,
            plain_text_content=plain_text
        )


# Global email service instance
email_service = EmailService()
