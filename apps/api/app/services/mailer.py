"""Transactional email delivery.

Password reset emails are only sent when SMTP is configured. When it is not,
the API returns a single-use reset link to the caller (development mode) so the
flow stays fully functional without pretending an email was delivered.
"""

import smtplib
from email.message import EmailMessage

from app.core.config import get_settings


def smtp_configured() -> bool:
    settings = get_settings()
    return bool(settings.SMTP_HOST and settings.SMTP_FROM)


def send_password_reset_email(to_email: str, reset_url: str) -> bool:
    """Send the reset email. Returns False when SMTP is not configured."""
    settings = get_settings()
    if not smtp_configured():
        return False

    message = EmailMessage()
    message["Subject"] = "SENTINELA AI — Password reset"
    message["From"] = settings.SMTP_FROM
    message["To"] = to_email
    message.set_content(
        "A password reset was requested for your SENTINELA AI account.\n\n"
        f"Open this link to choose a new password (valid for {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes):\n"
        f"{reset_url}\n\n"
        "If you did not request this, you can ignore this message."
    )

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
        if settings.SMTP_USE_TLS:
            server.starttls()
        if settings.SMTP_USERNAME:
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.send_message(message)
    return True
