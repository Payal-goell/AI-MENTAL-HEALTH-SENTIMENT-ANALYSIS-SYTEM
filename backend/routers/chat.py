from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
import json
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import ChatMessage, ChatAnalysis
from jwt_handler import get_current_user_id
import nlp_service as nlp
import ai_service

router = APIRouter(prefix="/api/chat", tags=["chat"])

GUIDED_QUESTIONS = [
    "What is your main concern or problem you'd like to talk about?",
    "How long have you been experiencing this issue?",
    "On a scale of 1-10, how serious does this problem feel to you right now?",
    "Are you experiencing sleep disturbances, difficulty concentrating, or other physical symptoms?",
    "Do you feel safe right now? Are you having any thoughts of harming yourself?"
]

class SendMessageRequest(BaseModel):
    message: str
    session_id: str = "default"

@router.post("")
async def send_message(
    req: SendMessageRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    try:
        return await _send_message_internal(req, user_id, db)
    except Exception as e:
        import logging
        import traceback
        logging.getLogger(__name__).error(f"Chat System Error: {str(e)}\n{traceback.format_exc()}")
        return {"success": False, "reply": "I'm experiencing an internal hiccup. Could you try asking that again?"}

async def _send_message_internal(req: SendMessageRequest, user_id: int, db: Session):
    # Get user info for greeting
    from models import User
    user_obj = db.query(User).filter(User.id == user_id).first()
    user_name = user_obj.full_name if user_obj else "Friend"

    # Save user message
    user_msg = ChatMessage(user_id=user_id, sender="user", message=req.message)
    db.add(user_msg)
    db.commit()
    
    # Run NLP analysis
    existing = get_or_create_analysis(user_id, db)
    existing_dict = {
        "problem": existing.problem, "duration": existing.duration,
        "severity": existing.severity, "risk_flag": existing.risk_flag,
        "triggers": existing.triggers or [], "sentiment": existing.sentiment,
        "intensity_score": existing.intensity_score, "stage": existing.stage or "problem",
        "physical_symptoms": existing.physical_symptoms or [],
        "emotions": existing.emotions or [],
        "coping_strategy": existing.coping_strategy,
        "support_available": existing.support_available,
        "impact_on_daily_life": existing.impact_on_daily_life,
        "user_name": user_name
    }
    
    nlp_result = nlp.analyze_message(req.message, existing_dict)
    
    # 1. Update cumulative analysis in DB
    if nlp_result.get("risk_flag"):
        existing.risk_flag = True
    
    if nlp_result.get("triggers"):
        existing.triggers = nlp_result["triggers"]
        
    if nlp_result.get("physical_symptoms"):
        existing.physical_symptoms = nlp_result["physical_symptoms"]
        
    existing.sentiment = nlp_result.get("sentiment", "Neutral")
    existing.intensity_score = nlp_result.get("intensity_score", 0.3)

    # 1.5. Handle Intent Classification
    intent = nlp.classify_intent(req.message)
    
    # 2. Response Logic (Prioritize Current Message Risk)
    bot_reply = ""
    current_message_is_risky = nlp_result.get("current_message_risk", False)
    
    import re
    risk_pattern = r'\b(suicide|die|kill myself|end my life|ending my life)\b'
    if re.search(risk_pattern, req.message.lower()):
        current_message_is_risky = True
    
    if current_message_is_risky:
        bot_reply = ("⚠️ I'm concerned about your safety. You are not alone. "
                     "Please reach out to a crisis helpline immediately:\n"
                     "🆘 KIRAN: 1800-599-0019 (free, 24/7)\n"
                     "🆘 iCALL: 9152987821\n"
                     "Please talk to someone you trust or call emergency services (112).")

    # Retrieve history for LLM
    chat_history = db.query(ChatMessage).filter(ChatMessage.user_id == user_id).order_by(ChatMessage.id.desc()).limit(8).all()
    history_list = [{"sender": m.sender, "message": m.message} for m in reversed(chat_history)]
    
    total_messages = db.query(ChatMessage).filter(ChatMessage.user_id == user_id).count()

    # Stage-based assessment logic (invisible data extraction & determining next question)
    current_stage = existing.stage or "problem"
    if current_stage == "completed":
        current_stage = "followup"
        existing.stage = "followup"
        
    next_stage = current_stage
    next_stage_prompt = None
    
    if current_stage == "problem":
        extracted_problem = nlp_result.get("problem")
        if extracted_problem and extracted_problem != "General Concern":
            existing.problem = extracted_problem
            
            if nlp_result.get("duration") or existing.duration:
                existing.duration = nlp_result.get("duration") or existing.duration
                if nlp_result.get("severity") is not None or existing.severity is not None:
                    existing.severity = nlp_result.get("severity") if nlp_result.get("severity") is not None else existing.severity
                    next_stage = "impact"
                    next_stage_prompt = "Is this affecting your sleep, concentration, or daily activities?"
                else:
                    next_stage = "severity"
                    next_stage_prompt = "On a scale of 1-10, how serious is this problem?"
            else:
                next_stage = "duration"
                next_stage_prompt = "How long have you been feeling this?"
        else:
            if not history_list:
                next_stage_prompt = f"Hi {user_name}! 👋 I'm your MindCare AI counsellor. I'm here to listen. What's been on your mind lately?"
            else:
                next_stage_prompt = "Could you tell me a bit more about the main problem you're dealing with right now?"
            
    elif current_stage == "duration":
        extracted_duration = nlp_result.get("duration")
        if extracted_duration:
            existing.duration = extracted_duration
            if nlp_result.get("severity") is not None or existing.severity is not None:
                existing.severity = nlp_result.get("severity") if nlp_result.get("severity") is not None else existing.severity
                next_stage = "impact"
                next_stage_prompt = "Is this affecting your sleep, concentration, or daily activities?"
            else:
                next_stage = "severity"
                next_stage_prompt = "On a scale of 1-10, how serious is this problem?"
        else:
            next_stage_prompt = "Could you tell me how long (days/weeks/months) this has been going on?"
            
    elif current_stage == "severity":
        extracted_severity = nlp_result.get("severity")
        if extracted_severity is not None:
            existing.severity = extracted_severity
            next_stage = "impact"
            next_stage_prompt = "Is this affecting your sleep, concentration, or daily activities?"
        else:
            existing.severity = 5
            next_stage = "impact"
            next_stage_prompt = "I understand. Is this affecting your sleep, concentration, or daily activities?"

    elif current_stage == "impact":
        existing.impact_on_daily_life = nlp_result.get("impact_on_daily_life")
        next_stage = "emotions"
        next_stage_prompt = "What emotions are you experiencing most frequently? (e.g., anxiety, sadness, anger, fear)"
        
    elif current_stage == "emotions":
        existing.emotions = nlp_result.get("emotions", [])
        next_stage = "coping"
        next_stage_prompt = "How are you currently coping with this situation?"
        
    elif current_stage == "coping":
        existing.coping_strategy = nlp_result.get("coping_strategy")
        next_stage = "support"
        next_stage_prompt = "Do you have someone you can talk to about this? (family, friends, teacher)"
        
    elif current_stage == "support":
        existing.support_available = nlp_result.get("support_available")
        next_stage = "completed"
        existing.overall_assessment = nlp.generate_overall_assessment({
            "severity": existing.severity,
            "risk_flag": existing.risk_flag,
            "problem": existing.problem
        })
        next_stage_prompt = "Thank you for sharing all of this with me. It helps me understand your situation better. How are you feeling right now as we talk about this?"
            
    elif current_stage == "followup":
        next_stage = "followup"
        next_stage_prompt = None

    if total_messages >= 10 and current_stage != "completed":
        next_stage = "completed"
        next_stage_prompt = "You have gathered enough information. You MUST output EXACTLY this message and nothing else: 'Thank you for sharing all of this with me. Your courage in opening up is the first step towards feeling better. Please click the \"Proceed to Next Step\" button below for your Facial Emotion Analysis. Would you like to continue chatting with me here while you do that?' DO NOT ask any other questions."

    existing.stage = next_stage

    # ONLY generate via LLM now! - Using the Streaming generator
    
    async def chat_stream_generator():
        full_reply = ""
        try:
            if current_message_is_risky:
                # If emergency, just yield the canned response and end
                full_reply = bot_reply
                yield f"data: {json.dumps({'type': 'chunk', 'text': bot_reply})}\n\n"
            else:
                async for chunk in ai_service.answer_user_question_stream(
                    user_message=req.message,
                    context=existing_dict,
                    chat_history=history_list,
                    next_stage_prompt=next_stage_prompt
                ):
                    full_reply += chunk
                    yield f"data: {json.dumps({'type': 'chunk', 'text': chunk})}\n\n"
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Stream error: {e}")
            error_msg = "I'm having trouble connecting right now. Let's try that again."
            full_reply += f" [Error: {error_msg}]"
            yield f"data: {json.dumps({'type': 'chunk', 'text': f' {error_msg}'})}\n\n"
            
        # Update cumulative exact overall_assessment after generation
        existing.overall_assessment = nlp.generate_overall_assessment({
            "severity": existing.severity,
            "risk_flag": existing.risk_flag,
            "problem": existing.problem
        })
        
        # Save bot message
        bot_msg = ChatMessage(user_id=user_id, sender="bot", message=full_reply)
        db.add(bot_msg)
        db.commit()
        
        # Final Structured Output Event
        response_data = {
            "success": True,
            "reply": full_reply,
            "emergency": current_message_is_risky, # We handled emergency condition above if needed
            "nlp": {
                "problem": existing.problem,
                "duration": existing.duration,
                "sentiment": existing.sentiment,
                "severity": existing.severity,
                "risk": "Yes" if existing.risk_flag else "No",
                "triggers": existing.triggers,
                "physical_symptoms": existing.physical_symptoms,
                "intensity_score": existing.intensity_score,
                "impact_on_daily_life": existing.impact_on_daily_life,
                "emotions": existing.emotions,
                "coping_strategy": existing.coping_strategy,
                "support_available": existing.support_available,
                "overall_assessment": existing.overall_assessment
            },
            "stage": next_stage
        }
        
        yield f"data: {json.dumps({'type': 'done', 'final_data': response_data})}\n\n"

    return StreamingResponse(chat_stream_generator(), media_type="text/event-stream")


@router.get("/history")
def get_history(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).filter(
        ChatMessage.user_id == user_id
    ).order_by(ChatMessage.timestamp).all()
    return [{"id": m.id, "sender": m.sender, "message": m.message,
             "timestamp": m.timestamp.isoformat() if m.timestamp else None} for m in messages]

@router.get("/analysis")
def get_analysis(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    analysis = db.query(ChatAnalysis).filter(ChatAnalysis.user_id == user_id).first()
    if not analysis:
        return {"problem": None, "duration": None, "sentiment": "Neutral", 
                "severity": 5, "risk_flag": False, "triggers": [], "intensity_score": 0.3, "stage": "problem"}
    
    return {
        "problem": analysis.problem,
        "duration": analysis.duration,
        "sentiment": analysis.sentiment,
        "severity": analysis.severity,
        "risk": "Yes" if analysis.risk_flag else "No",
        "triggers": analysis.triggers,
        "intensity_score": analysis.intensity_score,
        "impact_on_daily_life": analysis.impact_on_daily_life,
        "emotions": analysis.emotions,
        "physical_symptoms": analysis.physical_symptoms,
        "coping_strategy": analysis.coping_strategy,
        "support_available": analysis.support_available,
        "overall_assessment": analysis.overall_assessment,
        "stage": analysis.stage
    }

@router.delete("/clear")
def clear_chat(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Clear all chat messages and analysis for the current user."""
    try:
        db.query(ChatMessage).filter(ChatMessage.user_id == user_id).delete()
        db.query(ChatAnalysis).filter(ChatAnalysis.user_id == user_id).delete()
        db.commit()
        return {"success": True, "message": "Chat history cleared"}
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Error clearing chat: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear chat history")

@router.post("/finalize")
async def finalize_chat(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Finalize NLP analysis and return full structured JSON."""
    analysis = db.query(ChatAnalysis).filter(ChatAnalysis.user_id == user_id).first()
    if not analysis:
        return {"error": "No analysis found"}
        
    # Get all history to extract context
    chat_history = db.query(ChatMessage).filter(ChatMessage.user_id == user_id).order_by(ChatMessage.timestamp).all()
    history_list = [{"sender": m.sender, "message": m.message} for m in chat_history]
    
    extracted = await ai_service.extract_assessment_data(history_list)
    
    if extracted:
        analysis.problem = extracted.get("problem") or analysis.problem
        analysis.duration = extracted.get("duration") or analysis.duration
        if extracted.get("severity") is not None:
            analysis.severity = extracted.get("severity")
        analysis.sentiment = extracted.get("sentiment") or analysis.sentiment
        if extracted.get("risk_level"):
            analysis.risk_flag = extracted.get("risk_level", "Low")
        if extracted.get("triggers"):
            analysis.triggers = extracted.get("triggers")
        if extracted.get("impact_on_daily_life") is not None:
            analysis.impact_on_daily_life = extracted.get("impact_on_daily_life")
        if extracted.get("emotions"):
            analysis.emotions = extracted.get("emotions")
        if extracted.get("physical_symptoms"):
            analysis.physical_symptoms = extracted.get("physical_symptoms")
        if extracted.get("coping_strategy"):
            analysis.coping_strategy = extracted.get("coping_strategy")
        if extracted.get("support_available") is not None:
            analysis.support_available = extracted.get("support_available")
            
    if analysis.severity is None:
        analysis.severity = nlp.estimate_severity_from_context({
            "severity": None, "sentiment": analysis.sentiment,
            "intensity_score": analysis.intensity_score, "risk_flag": analysis.risk_flag
        })
        
    if not analysis.overall_assessment:
        analysis.overall_assessment = nlp.generate_overall_assessment({
            "severity": analysis.severity,
            "risk_flag": analysis.risk_flag,
            "problem": analysis.problem
        })
    
    db.commit()
    
    return {
        "problem": analysis.problem,
        "duration": analysis.duration,
        "sentiment": analysis.sentiment,
        "severity": analysis.severity,
        "risk_level": analysis.risk_flag,
        "triggers": analysis.triggers,
        "intensity_score": analysis.intensity_score,
        "impact_on_daily_life": analysis.impact_on_daily_life,
        "emotions": analysis.emotions,
        "physical_symptoms": analysis.physical_symptoms,
        "coping_strategy": analysis.coping_strategy,
        "support_available": analysis.support_available,
        "overall_assessment": analysis.overall_assessment
    }

def get_or_create_analysis(user_id: int, db: Session) -> ChatAnalysis:
    existing = db.query(ChatAnalysis).filter(ChatAnalysis.user_id == user_id).first()
    if not existing:
        existing = ChatAnalysis(
            user_id=user_id, problem="General Concern",
            sentiment="Neutral", risk_flag="Low", triggers=[], physical_symptoms=[], intensity_score=0.3, stage="problem"
        )
        db.add(existing)
        db.commit()
        db.refresh(existing)
    return existing

