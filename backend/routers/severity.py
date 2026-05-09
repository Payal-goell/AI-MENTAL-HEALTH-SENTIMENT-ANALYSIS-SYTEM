"""Final Severity Calculation + Emergency Router - Steps 5 & 6."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, BehaviourResult, ChatAnalysis, FaceResult, VoiceResult, FinalSeverityResult, EmergencyEvent
from jwt_handler import get_current_user_id
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["severity"])

SUMMARY_MAP = {
    "Low": "User appears emotionally stable with minor stress indicators. Maintain healthy habits.",
    "Moderate": "User shows moderate stress patterns. Recommend relaxation practices and monitoring.",
    "High": "User exhibits high stress indicators. Immediate intervention and counselling recommended."
}

def get_risk_level(score: float) -> str:
    if score <= 4:
        return "Low"
    elif score <= 7:
        return "Moderate"
    return "High"

def parse_risk_flag(flag) -> bool:
    if isinstance(flag, str):
        return flag.lower() in ('true', 'yes', '1', 'high')
    return bool(flag)

def model_to_dict(obj):
    if not obj:
        return {}
    ignore_keys = {"id", "user_id", "created_at"}
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns 
            if c.name not in ignore_keys and getattr(obj, c.name) is not None}

@router.get("/final-severity")
def calculate_final_severity(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    behaviour = db.query(BehaviourResult).filter(
        BehaviourResult.user_id == user_id).order_by(BehaviourResult.id.desc()).first()
    chat = db.query(ChatAnalysis).filter(ChatAnalysis.user_id == user_id).first()
    face = db.query(FaceResult).filter(FaceResult.user_id == user_id).order_by(FaceResult.id.desc()).first()
    voice = db.query(VoiceResult).filter(VoiceResult.user_id == user_id).order_by(VoiceResult.id.desc()).first()
    
    missing = []
    if not behaviour: missing.append("Behaviour Analysis")
    if not chat: missing.append("Chat Counselling")
    if not face: missing.append("Facial Emotion")
    if not voice: missing.append("Voice Analysis")
    
    def safe_float(val, default=5.0):
        try:
            if isinstance(val, str):
                import re
                match = re.search(r'^(\d+(?:\.\d+)?)', val.strip())
                if match:
                    return float(match.group(1))
            return float(val) if val is not None else default
        except (ValueError, TypeError):
            return default

    if missing:
        # Use defaults for missing steps instead of blocking
        behaviour_score = safe_float(behaviour.severity_score if behaviour else 5)
        chat_score = safe_float(chat.severity if chat else 5)
        face_score = safe_float(face.severity_score if face else 5)
        voice_score = safe_float(voice.severity_score if voice else 5)
    else:
        behaviour_score = safe_float(behaviour.severity_score)
        chat_score = safe_float(chat.severity or 5)
        face_score = safe_float(face.severity_score)
        voice_score = safe_float(voice.severity_score)
    
    final = round((behaviour_score + chat_score + face_score + voice_score) / 4)
    risk_level = get_risk_level(final)
    summary = SUMMARY_MAP.get(risk_level, "")
    
    # Save or update
    existing = db.query(FinalSeverityResult).filter(
        FinalSeverityResult.user_id == user_id).order_by(FinalSeverityResult.id.desc()).first()
    
    if not existing:
        result = FinalSeverityResult(
            user_id=user_id, chat_score=chat_score, face_score=face_score,
            voice_score=voice_score, behaviour_score=behaviour_score,
            final_severity=final, risk_level=risk_level, summary_note=summary
        )
        db.add(result)
    else:
        existing.chat_score = chat_score; existing.face_score = face_score
        existing.voice_score = voice_score; existing.behaviour_score = behaviour_score
        existing.final_severity = final; existing.risk_level = risk_level
        existing.summary_note = summary
    db.commit()
    
    # Check emergency
    risk_flag = parse_risk_flag(chat.risk_flag) if chat else False
    emergency = final >= 8 and risk_flag
    
    if emergency:
        # Check cooldown (1 minute)
        recent = db.query(EmergencyEvent).filter(
            EmergencyEvent.user_id == user_id,
            EmergencyEvent.created_at >= datetime.utcnow() - timedelta(minutes=1)
        ).first()
        
        if not recent:
            reason = "Both" if (final >= 8 and risk_flag) else ("High Severity" if final >= 8 else "Risk Words Detected")
            event = EmergencyEvent(
                user_id=user_id, severity_score=final,
                risk_flag=risk_flag, triggered_reason=reason
            )
            db.add(event)
            db.commit()
    
    return {
        "user_profile": {
            "name": user.full_name if user else "Unknown",
            "age": user.age if user else "N/A",
            "gender": user.gender if user else "N/A",
            "occupation": user.occupation if user else "N/A",
        },
        "behaviour_score": behaviour_score,
        "chat_score": chat_score,
        "face_score": face_score,
        "voice_score": voice_score,
        "detailed_records": {
            "behaviour": model_to_dict(behaviour),
            "chat": model_to_dict(chat),
            "face": model_to_dict(face),
            "voice": model_to_dict(voice)
        },
        "final_severity": final,
        "risk_level": risk_level,
        "summary_note": summary,
        "emergency": emergency,
        "missing_steps": missing
    }

@router.get("/emergency-status")
def emergency_status(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    severity_result = db.query(FinalSeverityResult).filter(
        FinalSeverityResult.user_id == user_id).order_by(FinalSeverityResult.id.desc()).first()
    chat = db.query(ChatAnalysis).filter(ChatAnalysis.user_id == user_id).first()
    
    final_severity = severity_result.final_severity if severity_result else 0
    risk_flag = parse_risk_flag(chat.risk_flag) if chat else False
    emergency = final_severity >= 8 and risk_flag
    
    triggered_reason = None
    if emergency:
        if final_severity >= 8 and risk_flag:
            triggered_reason = "Both"
        elif final_severity >= 8:
            triggered_reason = "High Severity"
        else:
            triggered_reason = "Risk Words Detected"
    
    return {
        "emergency": emergency,
        "severity": final_severity,
        "risk_flag": risk_flag,
        "triggered_reason": triggered_reason
    }
