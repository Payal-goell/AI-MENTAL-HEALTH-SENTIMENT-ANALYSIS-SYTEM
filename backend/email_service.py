import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from dotenv import load_dotenv

load_dotenv(override=False)

logger = logging.getLogger(__name__)

def send_otp_email(receiver_email: str, otp: str):
    # ── Always log OTP first so it's visible in HF Space logs ──────────────
    print(f"🚨 DEMO MODE: OTP for {receiver_email} is {otp} 🚨", flush=True)
    logger.info(f"🚨 DEMO MODE: OTP for {receiver_email} is {otp} 🚨")

    smtp_server   = os.environ.get("SMTP_SERVER")
    smtp_port     = os.environ.get("SMTP_PORT", 587)
    smtp_user     = os.environ.get("SMTP_USERNAME")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    smtp_from     = os.environ.get("SMTP_FROM_EMAIL", smtp_user)

    # ── If SMTP creds are absent, skip sending but don't crash ─────────────
    if not smtp_server or not smtp_user or not smtp_password:
        print("⚠️  SMTP credentials not configured — email skipped. Use OTP from logs above.", flush=True)
        logger.warning("SMTP credentials missing — OTP email not sent, but OTP is printed in server logs.")
        return True  # Return success so the frontend flow continues normally

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

    # ── Attempt to send — log failures silently, never raise to frontend ────
    try:
        server = smtplib.SMTP(smtp_server, int(smtp_port))
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_from, receiver_email, msg.as_string())
        server.quit()
        logger.info(f"✅ OTP email sent successfully to {receiver_email}")
    except Exception as e:
        # SMTP failed (likely port blocked on HF free tier) — log and continue
        print(f"⚠️  SMTP send failed: {e}. OTP is still available in the logs above.", flush=True)
        logger.error(f"❌ Failed to send OTP email to {receiver_email}: {e}")
        # Do NOT re-raise — frontend receives a clean success response

    return True
