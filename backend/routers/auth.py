"""Auth Router - Register, Login, JWT, Google OAuth."""
import hashlib
import logging
import os
import random
import re
from datetime import timedelta, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, field_validator
import httpx
from database import get_db
from models import User, PasswordResetOTP
from jwt_handler import create_access_token, get_current_user_id
from passlib.context import CryptContext
import bcrypt
from email_service import send_otp_email

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])
# Using bcrypt directly to avoid passlib/bcrypt 4.0+ compatibility issues
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

OCCUPATIONS = ['Accountant','Doctor','Engineer','Lawyer','Manager','Nurse',
               'Sales_person','Scientist','Software Engineer','Student','Teacher','Other']

class RegisterRequest(BaseModel):
    full_name: str
    age: int
    gender: str
    occupation: str
    phone: str = ""
    location: str = ""
    email: str
    password: str
    confirm_password: str

    @field_validator('age')
    def validate_age(cls, v):
        if not (10 <= v <= 100):
            raise ValueError("Age must be between 10 and 100")
        return v

    @field_validator('phone')
    def validate_phone(cls, v):
        if v and not re.match(r'^\d{10}$', v):
            raise ValueError("Phone must be 10 digits")
        return v

    @field_validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r'[A-Z]', v):
            raise ValueError("Password must contain at least 1 uppercase letter")
        if not re.search(r'[a-z]', v):
            raise ValueError("Password must contain at least 1 lowercase letter")
        if not re.search(r'\d', v):
            raise ValueError("Password must contain at least 1 number")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError("Password must contain at least 1 special character")
        return v

class LoginRequest(BaseModel):
    email: str
    password: str

class GoogleLoginRequest(BaseModel):
    token: str

class ForgotPasswordRequest(BaseModel):
    email: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

class ResetPasswordRequest(BaseModel):
    email: str
    newPassword: str

def hash_password(password: str) -> str:
    # Pre-hash with sha256 to avoid bcrypt 72-byte limit
    pre_hash = hashlib.sha256(password.encode()).hexdigest()
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pre_hash.encode(), salt)
    return hashed.decode()

def verify_password(password: str, hashed: str) -> bool:
    try:
        pre_hash = hashlib.sha256(password.encode()).hexdigest()
        return bcrypt.checkpw(pre_hash.encode(), hashed.encode())
    except Exception:
        return False

@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    if req.occupation not in OCCUPATIONS:
        raise HTTPException(status_code=400, detail="Invalid occupation")
    
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    try:
        hashed = hash_password(req.password)
        user = User(
            full_name=req.full_name,
            age=req.age,
            gender=req.gender,
            occupation=req.occupation,
            phone=req.phone,
            location=req.location,
            email=req.email,
            hashed_password=hashed
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return {"message": "Registration successful! You can now login.", "user_id": user.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.hashed_password or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": str(user.id)}, timedelta(minutes=60))
    return {"access_token": token, "token_type": "bearer", "user": {
        "id": user.id, "full_name": user.full_name, "email": user.email
    }}

@router.post("/google-login")
async def google_login(req: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Verify Google OAuth token and create/login user."""
    try:
        async with httpx.AsyncClient() as client:
            # First try verifying as ID Token (OpenID Connect)
            id_token_resp = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={req.token}")
            
            if id_token_resp.status_code == 200:
                info = id_token_resp.json()
            else:
                # Fallback: Try as Access Token (Userinfo endpoint)
                userinfo_resp = await client.get(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    headers={"Authorization": f"Bearer {req.token}"}
                )
                if userinfo_resp.status_code != 200:
                    raise HTTPException(status_code=401, detail="Invalid Google token (tried ID and Access tokens)")
                info = userinfo_resp.json()
            
            email = info.get("email")
            name = info.get("name") or info.get("given_name") or email
            google_id = info.get("sub")
            
            if not email:
                raise HTTPException(status_code=400, detail="Google account has no email")
            
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    full_name=name, age=25, gender="Not specified",
                    occupation="Other", email=email, google_id=google_id
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            else:
                # Update google_id if it was missing
                if not user.google_id:
                    user.google_id = google_id
                    db.commit()
            
            token = create_access_token({"sub": str(user.id)}, timedelta(minutes=120))
            return {"access_token": token, "token_type": "bearer", "user": {
                "id": user.id, "full_name": user.full_name, "email": user.email
            }}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth Error: {str(e)}")

@router.post("/forgot-password", response_model=None)
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        # Explicit debug error — bypasses generic security message for now
        return {"error": "User email not found in database"}

    otp = str(random.randint(100000, 999999))
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)

    # ── Log OTP immediately — visible in Uvicorn/HF Space logs at WARNING level ──
    logger.warning(f"🚨 DEMO MODE: OTP for requested email is {otp} 🚨")

    existing_otp = db.query(PasswordResetOTP).filter(PasswordResetOTP.email == req.email).first()
    if existing_otp:
        existing_otp.otp = otp
        existing_otp.expires_at = expires
    else:
        new_otp = PasswordResetOTP(email=req.email, otp=otp, expires_at=expires)
        db.add(new_otp)

    # Commit OTP to DB first — guaranteed even if email sending fails
    db.commit()

    # Attempt email — failures are logged silently, never returned as 500
    try:
        send_otp_email(req.email, otp)
    except Exception as e:
        logger.error(f"❌ Email send exception in route (non-fatal): {e}")

    return {"message": "Success", "demo_otp": otp}

@router.post("/verify-otp")
def verify_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    otp_record = db.query(PasswordResetOTP).filter(
        PasswordResetOTP.email == req.email,
        PasswordResetOTP.otp == req.otp
    ).first()
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    now = datetime.now(timezone.utc)
    expires_at = otp_record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if now > expires_at:
        raise HTTPException(status_code=400, detail="Expired OTP")
        
    return {"message": "OTP Verified"}

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    otp_record = db.query(PasswordResetOTP).filter(PasswordResetOTP.email == req.email).first()
    if not otp_record:
        raise HTTPException(status_code=400, detail="No active password reset request")
        
    now = datetime.now(timezone.utc)
    expires_at = otp_record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if now > expires_at:
        raise HTTPException(status_code=400, detail="Password reset request expired")
    
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    hashed = hash_password(req.newPassword)
    user.hashed_password = hashed
    
    db.delete(otp_record)
    db.commit()
    
    return {"message": "Password reset successfully"}

@router.get("/me")
def get_me(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id, "full_name": user.full_name, "email": user.email,
        "age": user.age, "gender": user.gender, "occupation": user.occupation,
        "phone": user.phone, "location": user.location
    }
