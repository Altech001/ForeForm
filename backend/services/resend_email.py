import logging
import resend
from config import settings

logger = logging.getLogger(__name__)

# Try to use configuration, otherwise use a fallback
resend.api_key = settings.RESEND_API_KEY

def send_response_confirmation_email(recipient_email: str, form_title: str):
    """
    Sends an email to the person who filled out the form.
    """
    if not recipient_email:
        return
        
    try:
        # Defaulting from email to onboarding@resend.dev as it's safe for Sandbox usage.
        sender_email = settings.FROM_EMAIL
        
        params: resend.Emails.SendParams = {
            "from": f"ForeForm <{sender_email}>",
            "to": [recipient_email],
            "subject": f"Response Confirmation: {form_title}",
            "html": f"<strong>Thank you for filling out '{form_title}'!</strong><p>Your response has been successfully recorded.</p>",
        }
        resend.Emails.send(params)
        logger.info(f"Successfully sent confirmation email to {recipient_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_email}: {e}")