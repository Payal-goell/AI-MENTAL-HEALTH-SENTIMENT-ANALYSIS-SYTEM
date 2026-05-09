"""Voice Stress Detection Router - Step 4."""
import os
import uuid
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from models import VoiceResult
from jwt_handler import get_current_user_id
import ml_loader
import logging
from collections import Counter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/voice", tags=["voice"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
STRESS_MAP = ml_loader.VOICE_STRESS_MAP
MOOD_MAP = ml_loader.VOICE_MOOD_MAP
SEVERITY_MAP = ml_loader.VOICE_SEVERITY_MAP

def extract_features(audio_path: str, sr: int = 22050, offset: float = 0.6) -> np.ndarray:
    """Extract MFCC + Mel + Chroma features from audio."""
    import librosa
    try:
        # 1. Exact Match to Training Notebook Load (duration=2.5, offset=0.6)
        # Note: In live inference, offset=0.6 might trim user speech, but if the scaler 
        # heavily depends on it, we match it. If the audio is shorter, librosa handles it.
        # However, to be safe for live 15s clips, we will just use the entire array 
        # and enforce the 2.5sec slice via the length fix, matching the original notebook's approach.
        y, sr = librosa.load(audio_path, sr=sr, duration=2.5, offset=offset)
        
        # 2. Extract Features EXACTLY as done in training
        # ZCR: shape (time_steps,)
        zcr = np.squeeze(librosa.feature.zero_crossing_rate(y=y))
        
        # RMSE: shape (time_steps,)
        rmse_feat = np.squeeze(librosa.feature.rms(y=y))
        
        # MFCC: shape (time_steps * n_mfcc,)
        # Note: sr was passed explicitly, and default n_mfcc is 20 in librosa
        mfcc = np.ravel(librosa.feature.mfcc(y=y, sr=sr).T)
        
        # 3. Concatenate (hstack equivalent)
        features = np.hstack((zcr, rmse_feat, mfcc))
        
        # 4. FIX LENGTH (Must be exactly 2376 as per training)
        if len(features) > 2376:
            features = features[:2376]
        else:
            features = np.pad(features, (0, 2376 - len(features)), 'constant')
        
        return features
    except Exception as e:
        logger.error(f"Feature extraction error: {e}")
        raise

@router.post("/analyse")
async def analyse_voice(
    audio: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    # Save audio
    ext = audio.filename.split('.')[-1] if '.' in audio.filename else 'wav'
    filename = f"voice_{user_id}_{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    content = await audio.read()
    if len(content) < 1000:
        raise HTTPException(status_code=400, detail="Audio file too small or empty")
    
    with open(filepath, "wb") as f:
        f.write(content)
    # Sliding Window Emotion Tally
    try:
        import librosa
        # Get total duration of the uploaded audio
        duration = librosa.get_duration(path=filepath)
        
        if duration <= 5.0:
            # --- PATH A: AUTHENTIC RAVDESS UPLOAD (Single Pass) ---
            # Bypass sliding window completely. Use the strict 1:1 training extraction.
            features = extract_features(filepath, offset=0.6)
            emotion, confidence = ml_loader.predict_voice_emotion(features)
            
            final_emotion = emotion.capitalize()
            avg_confidence = float(confidence)
            
            # Mock the emotion_counts for the UI so it doesn't break
            emotion_scores = {final_emotion: avg_confidence}
            emotion_frame_counts = {final_emotion: 1}
        else:
            # --- PATH B: 15-SECOND LIVE MIC (Sliding Window & Soft Voting) ---
            emotion_scores = {}
            emotion_frame_counts = {}
            
            # Slide a 2.5s window with a 1.0s hop
            window_size = 2.5
            hop_length = 1.0
            
            offsets = np.arange(0.0, duration - window_size + 0.1, hop_length)
                
            for offset in offsets:
                try:
                    features = extract_features(filepath, offset=float(offset))
                    emotion, confidence = ml_loader.predict_voice_emotion(features)
                    emotion = emotion.capitalize()
                    
                    if emotion not in emotion_scores:
                        emotion_scores[emotion] = 0.0
                        emotion_frame_counts[emotion] = 0
                        
                    emotion_scores[emotion] += float(confidence)
                    emotion_frame_counts[emotion] += 1
                except Exception as slide_err:
                    logger.warning(f"Failed to process window at offset {offset}: {slide_err}")
                    continue

            if not emotion_scores:
                raise ValueError("Could not extract features from any audio window.")
                
            # Soft Voting: Winner is the emotion with highest total confidence score
            final_emotion = max(emotion_scores, key=emotion_scores.get)
            avg_confidence = emotion_scores[final_emotion] / emotion_frame_counts[final_emotion]
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feature extraction failed: {str(e)}")
    
    stress = STRESS_MAP.get(final_emotion.lower(), "Medium")
    mood = MOOD_MAP.get(final_emotion.lower(), "Stable")
    severity = SEVERITY_MAP.get(final_emotion.lower(), 5)
    
    # Save to DB
    result = VoiceResult(
        user_id=user_id,
        audio_path=f"uploads/{filename}",
        voice_emotion=final_emotion,
        confidence=round(float(avg_confidence), 3),
        voice_stress=stress,
        voice_mood=mood,
        severity_score=severity
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    
    return {
        "voice_emotion": final_emotion,
        "confidence": round(float(avg_confidence), 3),
        "voice_stress": stress,
        "voice_mood": mood,
        "severity_score": severity,
        "audio_path": f"uploads/{filename}",
        "emotion_counts": emotion_frame_counts
    }

@router.get("/result")
def get_voice_result(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    result = db.query(VoiceResult).filter(
        VoiceResult.user_id == user_id
    ).order_by(VoiceResult.id.desc()).first()
    if not result:
        raise HTTPException(status_code=404, detail="No voice result found")
    return result
