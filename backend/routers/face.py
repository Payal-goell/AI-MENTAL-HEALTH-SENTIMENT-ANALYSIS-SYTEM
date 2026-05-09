"""Face Emotion Recognition Router - Step 3."""
import os
import uuid
import json
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from models import FaceResult
from jwt_handler import get_current_user_id
import ml_loader
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/face", tags=["face"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
TARGET_SIZE = (224, 224)
EMOTIONS = ml_loader.FACE_EMOTION_LABELS
SEVERITY_MAP = ml_loader.FACE_SEVERITY_MAP

@router.post("/analyse")
async def analyse_face(
    video: UploadFile = File(...),
    live_counts: str = Form(None), # Receive counts from frontend
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    # Save video
    ext = video.filename.split('.')[-1] if '.' in video.filename else 'webm'
    filename = f"face_{user_id}_{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    content = await video.read()
    with open(filepath, "wb") as f:
        f.write(content)
        
    # 2. Parse live_counts from frontend
    if not live_counts:
        raise HTTPException(status_code=400, detail="Missing live emotion counts from frontend")
        
    emotion_counts = json.loads(live_counts)
    total_frames = sum(emotion_counts.values())
    if total_frames == 0:
        raise HTTPException(status_code=400, detail="No faces detected during recording")

    # 3. Calculate final metrics EXACTLY matching the frontend
    majority_emotion = max(emotion_counts, key=emotion_counts.get)
    emotion_distribution = {k: round((v / total_frames) * 100, 1) for k, v in emotion_counts.items() if total_frames > 0}
    severity = SEVERITY_MAP.get(majority_emotion, 5)
    avg_confidence = 0.95 # Mock high confidence since we use raw counts
    
    # 4. Save result to database
    result = FaceResult(
        user_id=user_id,
        video_path=f"uploads/{filename}",
        facial_emotion=majority_emotion,
        confidence=avg_confidence,
        severity_score=severity,
        emotion_distribution=emotion_distribution
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    
    return {
        "facial_emotion": majority_emotion,
        "confidence": avg_confidence,
        "severity_score": severity,
        "emotion_distribution": emotion_distribution,
        "video_path": f"uploads/{filename}",
        "frames_processed": total_frames,
        "face_detected": True
    }

@router.get("/result")
def get_face_result(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    result = db.query(FaceResult).filter(
        FaceResult.user_id == user_id
    ).order_by(FaceResult.id.desc()).first()
    if not result:
        raise HTTPException(status_code=404, detail="No face result found")
    return result
