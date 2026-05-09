import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

def send_otp_email(receiver_email: str, otp: str):
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = os.getenv("SMTP_PORT", 587)
    smtp_user = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM_EMAIL", smtp_user)

    if not smtp_server or not smtp_user or not smtp_password:
        raise ValueError("SMTP credentials missing in .env file")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your MindCare AI Password Reset OTP"
    msg["From"] = f"MindCare AI <{smtp_from}>"
    msg["To"] = receiver_email

    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #05110d; color: #ffffff; padding: 20px; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #0a1f18; padding: 30px; border-radius: 12px; border: 1px solid rgba(0,255,136,0.3);">
            <h2 style="color: #00ff88; margin-bottom: 10px;">MindCare AI</h2>
            <h3 style="color: #ffffff;">Password Reset Request</h3>
            <p style="color: #cbd5e1; font-size: 14px;">You requested a password reset. Use the OTP below to proceed. It is valid for 10 minutes.</p>
            <div style="margin: 30px 0; padding: 15px; background: rgba(0,0,0,0.4); border-radius: 8px; letter-spacing: 5px; font-size: 24px; font-weight: bold; color: #00ff88;">
                {otp}
            </div>
            <p style="color: #94a3b8; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      </body>
    </html>
    """
    msg.attach(MIMEText(html_content, "html"))

    try:
        server = smtplib.SMTP(smtp_server, int(smtp_port))
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_from, receiver_email, msg.as_string())
        server.quit()
        logger.info(f"✅ OTP email sent successfully to {receiver_email}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send OTP email: {e}")
        raise e
