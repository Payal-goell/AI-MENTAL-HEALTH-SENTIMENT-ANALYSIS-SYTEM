"""Behaviour Analysis Router - Step 1."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from database import get_db
from models import BehaviourResult, User
from jwt_handler import get_current_user_id
import ml_loader
import os
import logging

router = APIRouter(prefix="/behaviour", tags=["behaviour"])

class BehaviourInput(BaseModel):
    bmi_category: str  # Underweight / Normal / Overweight / Obese
    sleep_hours: float = Field(..., ge=0, le=24)
    sleep_quality: int = Field(..., ge=1, le=10)
    physical_activity: int = Field(..., ge=1, le=100)
    stress_level: int = Field(..., ge=1, le=10)
    heart_rate: int = Field(..., ge=30, le=250)
    daily_steps: int = Field(..., ge=0, le=100000)
    systolic_bp: int = Field(..., ge=70, le=250)
    diastolic_bp: int = Field(..., ge=40, le=150)

class ManualBehaviourInput(BehaviourInput):
    full_name: str
    age: int
    gender: str
    occupation: str

def get_bmi_hint(bmi: str) -> str:
    hints = {
        "Underweight": "⚠️ Being underweight can affect energy and mental health. Consider nutritional support.",
        "Normal": "✅ Healthy BMI range. Keep maintaining balanced nutrition.",
        "Healthy Weight": "✅ Healthy BMI range. Keep maintaining balanced nutrition.",
        "Overweight": "⚠️ Being overweight can increase stress. Light exercise recommended.",
        "Obese": "⚠️ Obesity significantly impacts mental and physical health. Medical guidance recommended."
    }
    return hints.get(bmi, "")

def get_sleep_warning(hours: float, quality: int) -> str:
    if hours < 6:
        return "⚠️ Sleep deficiency detected. Less than 6 hours is insufficient for mental recovery."
    elif quality < 5:
        return "⚠️ Poor sleep quality detected. Consider improving sleep hygiene."
    return ""

def get_hr_warning(hr: int) -> str:
    if hr < 60:
        return "⚠️ Bradycardia detected. Heart rate below 60 BPM may indicate stress or cardiac issues."
    elif hr > 100:
        return "⚠️ Tachycardia detected. Elevated heart rate may indicate stress or anxiety."
    return ""

@router.post("/analyse")
def analyse_behaviour(
    data: BehaviourInput,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"--- START Behaviour Analysis request for user {user_id} ---")
    logger.info(f"Form payload received: {data.dict()}")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.error(f"User {user_id} not found in database.")
        raise HTTPException(status_code=404, detail="User not found")
    
    input_data = {
        "gender": user.gender,
        "occupation": user.occupation,
        "age": user.age,
        "bmi_category": data.bmi_category,
        "sleep_hours": data.sleep_hours,
        "sleep_quality": data.sleep_quality,
        "physical_activity": data.physical_activity,
        "stress_level": data.stress_level,
        "heart_rate": data.heart_rate,
        "daily_steps": data.daily_steps,
        "systolic_bp": data.systolic_bp,
        "diastolic_bp": data.diastolic_bp,
    }
    
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Analyse Behaviour for user {user_id}: {input_data}")
    
    # Log individual components to catch None values
    for k, v in input_data.items():
        if v is None:
            logger.warning(f"Field '{k}' is None for user {user_id}")
    
    try:
        result = ml_loader.predict_behaviour(input_data)
        if not result:
            raise ValueError("Empty prediction result returned from AI model.")
    except Exception as e:
        error_detail = f"AI Prediction Error: {str(e)}"
        logger.error(f"Prediction failed for user {user_id}: {error_detail}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_detail)
    
    try:
        # Save to DB
        behaviour = BehaviourResult(
            user_id=user_id,
            snapshot_name=user.full_name,
            snapshot_age=user.age,
            snapshot_gender=user.gender,
            snapshot_occupation=user.occupation,
            bmi_category=data.bmi_category,
            sleep_hours=data.sleep_hours,
            sleep_quality=data.sleep_quality,
            physical_activity=data.physical_activity,
            stress_level=data.stress_level,
            heart_rate=data.heart_rate,
            daily_steps=data.daily_steps,
            systolic_bp=data.systolic_bp,
            diastolic_bp=data.diastolic_bp,
            behaviour_risk=result["behaviour_risk"],
            confidence=result["confidence"],
            severity_score=result["severity_score"],
            recommendations=result["recommendations"]
        )
        db.add(behaviour)
        db.commit()
        db.refresh(behaviour)
    except Exception as e:
        logger.error(f"Database save failed for user {user_id}: {str(e)}")
        # We can still return the result even if DB save fails, but log it
    
    return {
        **result,
        "bmi_hint": get_bmi_hint(data.bmi_category),
        "sleep_warning": get_sleep_warning(data.sleep_hours, data.sleep_quality),
        "hr_warning": get_hr_warning(data.heart_rate),
        "user_info": {
            "full_name": user.full_name,
            "age": user.age,
            "gender": user.gender,
            "occupation": user.occupation
        }
    }

@router.post("/analyse-manual")
def analyse_behaviour_manual(
    data: ManualBehaviourInput,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Manual testing mode: Prediction WITH database storage."""
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"--- START Behaviour Manual Analysis request for user {user_id} ---")
    logger.info(f"Manual Payload: {data.dict()}")
    input_data = {
        "gender": data.gender,
        "occupation": data.occupation,
        "age": data.age,
        "bmi_category": data.bmi_category,
        "sleep_hours": data.sleep_hours,
        "sleep_quality": data.sleep_quality,
        "physical_activity": data.physical_activity,
        "stress_level": data.stress_level,
        "heart_rate": data.heart_rate,
        "daily_steps": data.daily_steps,
        "systolic_bp": data.systolic_bp,
        "diastolic_bp": data.diastolic_bp,
    }
    
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Analyse Behaviour Manual for user {user_id}: {input_data}")
    
    try:
        result = ml_loader.predict_behaviour(input_data)
    except Exception as e:
        logger.error(f"Manual Prediction failed for user {user_id}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        status_code = 400 if isinstance(e, (ValueError, TypeError)) else 500
        raise HTTPException(status_code=status_code, detail=f"AI Prediction Error (Manual): {str(e)}")

    try:
        # Save to DB
        behaviour = BehaviourResult(
            user_id=user_id,
            snapshot_name=data.full_name,
            snapshot_age=data.age,
            snapshot_gender=data.gender,
            snapshot_occupation=data.occupation,
            bmi_category=data.bmi_category,
            sleep_hours=data.sleep_hours,
            sleep_quality=data.sleep_quality,
            physical_activity=data.physical_activity,
            stress_level=data.stress_level,
            heart_rate=data.heart_rate,
            daily_steps=data.daily_steps,
            systolic_bp=data.systolic_bp,
            diastolic_bp=data.diastolic_bp,
            behaviour_risk=result["behaviour_risk"],
            confidence=result["confidence"],
            severity_score=result["severity_score"],
            recommendations=result["recommendations"]
        )
        db.add(behaviour)
        db.commit()
    except Exception as e:
        logger.error(f"Manual Database save failed for user {user_id}: {str(e)}")
    
    return {
        **result,
        "bmi_hint": get_bmi_hint(data.bmi_category),
        "sleep_warning": get_sleep_warning(data.sleep_hours, data.sleep_quality),
        "hr_warning": get_hr_warning(data.heart_rate),
        "user_info": {
            "full_name": data.full_name,
            "age": data.age,
            "gender": data.gender,
            "occupation": data.occupation
        },
        "manual_mode": True
    }

@router.get("/stats")
def get_behaviour_stats(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    from sqlalchemy import func
    results = db.query(BehaviourResult).filter(BehaviourResult.user_id == user_id).all()
    
    # Risk Distribution
    dist = {"Low": 0, "Medium": 0, "High": 0}
    for r in results:
        risk = r.behaviour_risk.capitalize() if r.behaviour_risk else "Medium"
        if risk in dist:
            dist[risk] += 1
            
    # Trend
    trend = [
        {"date": r.created_at.strftime("%m/%d"), "score": r.severity_score, "risk": r.behaviour_risk}
        for r in results[-10:]
    ]
    
    return {
        "distribution": [{"name": k, "value": v} for k, v in dist.items()],
        "trend": trend,
        "total": len(results)
    }

@router.get("/result")
def get_behaviour_result(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    result = db.query(BehaviourResult).filter(
        BehaviourResult.user_id == user_id
    ).order_by(BehaviourResult.id.desc()).first()
    if not result:
        raise HTTPException(status_code=404, detail="No behaviour result found")
    return result
