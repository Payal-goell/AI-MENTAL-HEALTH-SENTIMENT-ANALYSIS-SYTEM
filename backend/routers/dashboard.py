"""Dashboard + Suggestions + AI Doctor Router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import (User, BehaviourResult, ChatAnalysis, FaceResult, VoiceResult,
                    FinalSeverityResult, EmergencyEvent, Suggestion, DailyTask, DoctorChatMessage)
from jwt_handler import get_current_user_id
import ai_service
from datetime import datetime, date
import logging
import random

logger = logging.getLogger(__name__)
router = APIRouter(tags=["dashboard"])

DEFAULT_TASKS = [
    "Drink 8 glasses of water",
    "10-minute breathing exercise",
    "Write 1 positive thought",
    "15-minute walk or light exercise",
    "Connect with a friend or family member"
]

class DoctorMessageRequest(BaseModel):
    message: str

class ToggleTaskRequest(BaseModel):
    task_id: int
    completed: bool

from typing import Optional

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None

@router.get("/dashboard-data")
def get_dashboard_data(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    behaviour = db.query(BehaviourResult).filter(BehaviourResult.user_id == user_id).order_by(BehaviourResult.id.desc()).first()
    chat = db.query(ChatAnalysis).filter(ChatAnalysis.user_id == user_id).first()
    face = db.query(FaceResult).filter(FaceResult.user_id == user_id).order_by(FaceResult.id.desc()).first()
    voice = db.query(VoiceResult).filter(VoiceResult.user_id == user_id).order_by(VoiceResult.id.desc()).first()
    severity = db.query(FinalSeverityResult).filter(FinalSeverityResult.user_id == user_id).order_by(FinalSeverityResult.id.desc()).first()
    emergency = db.query(EmergencyEvent).filter(EmergencyEvent.user_id == user_id).order_by(EmergencyEvent.id.desc()).first()
    
    today = str(date.today())
    daily_tasks = db.query(DailyTask).filter(DailyTask.user_id == user_id, DailyTask.date == today).all()
    if not daily_tasks:
        daily_tasks = []
        for task in DEFAULT_TASKS:
            t = DailyTask(user_id=user_id, task=task, completed=False, date=today)
            db.add(t)
            daily_tasks.append(t)
        db.commit()
        db.refresh(daily_tasks[0]) if daily_tasks else None
        daily_tasks = db.query(DailyTask).filter(DailyTask.user_id == user_id, DailyTask.date == today).all()
    
    # History - last 5 assessments
    history = db.query(FinalSeverityResult).filter(
        FinalSeverityResult.user_id == user_id).order_by(FinalSeverityResult.id.desc()).limit(5).all()
    
    # Format historical_trends specifically for Recharts
    historical_trends = []
    # Reverse so oldest is first for the line chart (left to right)
    for h in reversed(history):
        if h.created_at:
            # Format as MM/DD
            date_str = h.created_at.strftime("%m/%d")
        else:
            date_str = "Unknown"
        historical_trends.append({"date": date_str, "score": h.final_severity})

    return {
        "user": {
            "id": user.id, "full_name": user.full_name, "email": user.email,
            "age": user.age, "gender": user.gender, "occupation": user.occupation,
            "phone": getattr(user, 'phone', '') or '',
            "location": getattr(user, 'location', '') or '',
            "created_at": user.created_at.isoformat() if user.created_at else None
        } if user else None,
        "behaviour": {
            "risk": behaviour.behaviour_risk, "confidence": behaviour.confidence,
            "severity_score": behaviour.severity_score, "recommendations": getattr(behaviour, 'recommendations', '')
        } if behaviour else None,
        "chat": {
            "problem": chat.problem, "duration": chat.duration, "sentiment": chat.sentiment,
            "severity": chat.severity, "risk_flag": chat.risk_flag, "triggers": chat.triggers
        } if chat else None,
        "face": {
            "emotion": face.facial_emotion, "confidence": getattr(face, 'confidence', 0),
            "severity_score": face.severity_score, "emotion_distribution": getattr(face, 'emotion_distribution', {}),
            "video_path": getattr(face, 'video_path', '')
        } if face else None,
        "voice": {
            "emotion": voice.voice_emotion, "stress": voice.voice_stress, "mood": voice.voice_mood,
            "confidence": getattr(voice, 'confidence', 0), "severity_score": voice.severity_score, "audio_path": getattr(voice, 'audio_path', '')
        } if voice else None,
        "severity": {
            "final_severity": severity.final_severity, "risk_level": severity.risk_level,
            "summary_note": severity.summary_note, "behaviour_score": severity.behaviour_score,
            "chat_score": severity.chat_score, "face_score": severity.face_score, "voice_score": severity.voice_score
        } if severity else None,
        "emergency": {
            "active": bool(emergency), "severity": emergency.severity_score if emergency else 0,
            "reason": emergency.triggered_reason if emergency else None
        },
        "daily_tasks": [{"id": t.id, "task": t.task, "completed": t.completed} for t in daily_tasks],
        "historical_trends": historical_trends
    }

@router.put("/update-profile")
def update_profile(req: UpdateProfileRequest, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if req.full_name is not None:
        user.full_name = req.full_name
    if req.email is not None:
        user.email = req.email
    if req.age is not None:
        user.age = req.age
    if req.gender is not None:
        user.gender = req.gender
    if req.occupation is not None:
        user.occupation = req.occupation
    if req.phone is not None:
        user.phone = req.phone
    if req.location is not None:
        user.location = req.location
        
    db.commit()
    db.refresh(user)
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": user.id, "full_name": user.full_name, "email": user.email,
            "age": user.age, "gender": user.gender, "occupation": user.occupation,
            "phone": getattr(user, 'phone', '') or '', "location": getattr(user, 'location', '') or ''
        }
    }

@router.get("/smart-suggestions")
async def get_smart_suggestions(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    severity_result = db.query(FinalSeverityResult).filter(
        FinalSeverityResult.user_id == user_id).order_by(FinalSeverityResult.id.desc()).first()
    chat = db.query(ChatAnalysis).filter(ChatAnalysis.user_id == user_id).first()
    voice = db.query(VoiceResult).filter(VoiceResult.user_id == user_id).order_by(VoiceResult.id.desc()).first()
    
    severity = severity_result.final_severity if severity_result else 5
    risk_level = severity_result.risk_level if severity_result else "Moderate"
    problem = chat.problem if chat else "general stress"
    mood = voice.voice_mood if voice else "Stable"
    triggers = chat.triggers if chat else []
    
    suggestions = await ai_service.generate_suggestions(severity, risk_level, problem, mood, triggers or [])
    
    # Save suggestions
    s = Suggestion(user_id=user_id, severity_level=risk_level, suggestion_data=suggestions)
    db.add(s)
    db.commit()
    
    # Pick a random quote specific to today
    random.seed(date.today().toordinal() + user_id)
    daily_quotes = [
        "Every day is a new beginning. Take a deep breath, smile, and start again.",
        "You don't have to be positive all the time. It's perfectly okay to feel sad, angry, annoyed, frustrated. You are human.",
        "It's okay to ask for help. Every storm runs out of rain. You are stronger than you know.",
        "Your mental health is a priority. Your happiness is an essential. Your self-care is a necessity.",
        "Progress is not linear. Be proud of yourself for trying.",
        "Healing takes time, and asking for help is a courageous step.",
        "The strongest people are those who win battles we know nothing about."
    ]
    if isinstance(suggestions, dict):
        suggestions["quote"] = random.choice(daily_quotes)
        
    return suggestions

@router.post("/toggle-task")
def toggle_task(req: ToggleTaskRequest, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    task = db.query(DailyTask).filter(DailyTask.id == req.task_id, DailyTask.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.completed = req.completed
    db.commit()
    return {"message": "Task updated", "completed": req.completed}

@router.get("/daily-progress")
def daily_progress(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    today = str(date.today())
    tasks = db.query(DailyTask).filter(DailyTask.user_id == user_id, DailyTask.date == today).all()
    completed = sum(1 for t in tasks if t.completed)
    total = len(tasks)
    return {"total": total, "completed": completed, "percentage": (completed / total * 100) if total else 0}

@router.post("/doctor-chat")
async def doctor_chat(req: DoctorMessageRequest, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # Gather context
    severity_result = db.query(FinalSeverityResult).filter(
        FinalSeverityResult.user_id == user_id).order_by(FinalSeverityResult.id.desc()).first()
    chat = db.query(ChatAnalysis).filter(ChatAnalysis.user_id == user_id).first()
    face = db.query(FaceResult).filter(FaceResult.user_id == user_id).order_by(FaceResult.id.desc()).first()
    voice = db.query(VoiceResult).filter(VoiceResult.user_id == user_id).order_by(VoiceResult.id.desc()).first()
    
    context = {
        "final_severity": severity_result.final_severity if severity_result else 5,
        "risk_level": severity_result.risk_level if severity_result else "Moderate",
        "problem": chat.problem if chat else "general stress",
        "triggers": chat.triggers if chat else [],
        "risk_flag": chat.risk_flag if chat else False,
        "facial_emotion": face.facial_emotion if face else "Neutral",
        "voice_mood": voice.voice_mood if voice else "Stable"
    }
    
    # Get doctor chat history
    history = db.query(DoctorChatMessage).filter(
        DoctorChatMessage.user_id == user_id).order_by(DoctorChatMessage.timestamp.desc()).limit(10).all()
    chat_history = [{"role": "user" if m.sender == "user" else "assistant", "content": m.message}
                    for m in reversed(history)]
    
    # Save user message
    user_msg = DoctorChatMessage(user_id=user_id, sender="user", message=req.message)
    db.add(user_msg)
    db.commit()
    
    response = await ai_service.doctor_chat_response(req.message, context, chat_history)
    
    # Save doctor reply
    doctor_msg = DoctorChatMessage(user_id=user_id, sender="doctor", message=response["reply"])
    db.add(doctor_msg)
    db.commit()
    
    return response

@router.get("/doctor-chat/history")
def get_doctor_history(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    messages = db.query(DoctorChatMessage).filter(
        DoctorChatMessage.user_id == user_id).order_by(DoctorChatMessage.timestamp).all()
    return [{"id": m.id, "sender": m.sender, "message": m.message,
             "timestamp": m.timestamp.isoformat() if m.timestamp else None} for m in messages]

@router.get("/progress-history")
def progress_history(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    results = db.query(FinalSeverityResult).filter(
        FinalSeverityResult.user_id == user_id).order_by(FinalSeverityResult.id).all()
    return [{"date": r.created_at.isoformat() if r.created_at else None,
             "severity": r.final_severity, "risk_level": r.risk_level} for r in results]
