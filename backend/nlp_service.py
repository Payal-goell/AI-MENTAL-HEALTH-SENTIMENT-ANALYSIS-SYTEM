"""NLP Service - Extracts problem, duration, sentiment, severity, risk from chat text."""
import re
from typing import Optional, List, Dict
import logging

logger = logging.getLogger(__name__)

RISK_WORDS = [
    "suicide", "suicidal", "kill myself", "killing myself", "want to die", 
    "end my life", "ending my life", "self harm", "self-harm", "hurt myself",
    "take my own life", "no reason to live", "don't want to live"
]

PROBLEM_KEYWORDS = {
    "Exam": ["exam", "test", "study", "grades", "fail", "assignment", "college", "university", "midterm", "final", "academic"],
    "Work": ["work", "job", "boss", "deadline", "office", "career", "salary", "fired", "corporate", "meeting", "manager"],
    "Relationship": ["relationship", "breakup", "partner", "boyfriend", "girlfriend", "divorce", "cheating", "love", "heartbreak", "dating"],
    "Family": ["family", "parents", "mother", "father", "siblings", "home", "domestic", "relative", "cousin"],
    "Financial": ["money", "debt", "financial", "loan", "poor", "bills", "broke", "rent", "expense", "bankruptcy"],
    "Health": ["sick", "disease", "health", "hospital", "pain", "illness", "doctor", "medical", "symptom", "virus"],
    "Social": ["people", "social", "friends", "lonely", "alone", "anxiety", "crowd", "public", "introvert", "shy"],
    "Sleep": ["sleep", "insomnia", "nightmare", "tired", "fatigue", "rest", "awake", "toss", "turn"],
    "Grief": ["death", "lost", "passed", "funeral", "missing", "grief", "mourning"],
    "Stress": ["stress", "depressed", "anxiety", "worried", "overwhelmed", "sad", "unhappy", "hopeless", "heavy"]
}

TRIGGER_MAP = {
    "exams": ["exam", "test", "study", "grades", "fail", "assignment", "college", "university", "midterm", "final"],
    "work": ["work", "job", "boss", "deadline", "office", "career", "salary", "fired", "corporate", "meeting", "manager"],
    "relationship": ["relationship", "breakup", "partner", "boyfriend", "girlfriend", "divorce", "cheating", "love", "heartbreak", "dating"],
    "family": ["family", "parents", "mother", "father", "siblings", "home", "domestic", "relative", "cousin"],
    "financial": ["money", "debt", "financial", "loan", "poor", "bills", "broke", "rent", "expense", "bankruptcy"],
    "health": ["sick", "disease", "health", "hospital", "pain", "illness", "doctor", "medical", "symptom", "virus"]
}

def detect_risk(text: str) -> bool:
    text_lower = text.lower()
    for word in RISK_WORDS:
        # Use regex for word boundaries to avoid partial matches
        if re.search(rf"\b{re.escape(word)}\b", text_lower):
            return True
    return False

def detect_triggers(text: str) -> List[str]:
    text_lower = text.lower()
    found = []
    for label, keywords in TRIGGER_MAP.items():
        if any(kw in text_lower for kw in keywords):
            found.append(label)
    return found

def detect_problem(text: str) -> str:
    text_lower = text.lower()
    
    # 1. Detect triggers first
    triggers = detect_triggers(text)
    
    # 2. Find primary problem keyword
    primary = None
    for problem, keywords in PROBLEM_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            primary = problem
            break
    
    if triggers:
        # User specified a trigger (e.g., exams)
        trigger_label = triggers[0].capitalize()
        # Simple singularization for "Exams" -> "Exam"
        if trigger_label.lower().endswith('s') and trigger_label.lower() != "stress": 
            trigger_label = trigger_label[:-1]
            
        # If user explicitly mentioned "stress" or if primary is Stress/None
        if primary == "Anxiety":
            return f"{trigger_label} Anxiety"
            
        if "stress" in text_lower or primary in ["Stress", None]:
            return f"{trigger_label} Stress"
            
        # If trigger matches primary (e.g. trigger 'work' and primary 'Work')
        if trigger_label.lower() == (primary.lower() if primary else ""):
            return f"{trigger_label} Stress"
            
        return f"{trigger_label} {primary}"

    
    if primary:
        return primary
    
    return "General Concern"

def detect_duration(text: str) -> Optional[str]:
    text_lower = text.lower()
    
    # Fuzzy mapping
    fuzzy_map = {
        "almost a month": "1 Month", "about a month": "1 Month", "a month": "1 Month",
        "couple of weeks": "2 Weeks", "past few weeks": "2-4 Weeks", "few weeks": "2-3 Weeks", "several weeks": "3-4 Weeks",
        "almost a year": "1 Year", "about a year": "1 Year", "a year": "1 Year",
        "couple of days": "2 Days", "few days": "2-3 Days", "several days": "3-4 Days",
        "three or four weeks": "3-4 Weeks", "two or three weeks": "2-3 Weeks",
        "three or four days": "3-4 Days", "two or three days": "2-3 Days",
        "three or four months": "3-4 Months", "two or three months": "2-3 Months",
        "few months": "2-3 Months", "couple of months": "2 Months"
    }

    for fuzzy, exact in fuzzy_map.items():
        if fuzzy in text_lower:
            return exact

    word_to_num = {"one": "1", "two": "2", "three": "3", "four": "4", "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10"}
    for word, num in word_to_num.items():
        text_lower = re.sub(rf"\b{word}\b", num, text_lower)

    pattern = r'(\d+)\s*(days|day|weeks|week|months|month|years|year)'
    match = re.search(pattern, text_lower)
    if match:
        unit = match.group(2).capitalize()
        if not unit.endswith('s') and int(match.group(1)) > 1:
            unit += 's'
        elif unit.endswith('s') and int(match.group(1)) == 1:
            unit = unit[:-1]
        return f"{match.group(1)} {unit}"
        
    return None

def detect_severity(text: str) -> Optional[int]:
    # Check for explicit number 1-10
    pattern = r'\b([1-9]|10)\b'
    match = re.search(pattern, text)
    if match:
        val = int(match.group(1))
        if 1 <= val <= 10:
            return val
            
    text_lower = text.lower()
    word_to_num = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10}
    for w, n in word_to_num.items():
        if re.search(rf"\b{w}\b", text_lower):
            return n

    # Also detect phrases to avoid infinite loops when users type words instead of numbers
    if any(phrase in text_lower for phrase in ["very severe", "extreme", "a lot", "too much", "high"]):
        return 8
    elif any(phrase in text_lower for phrase in ["moderate", "somewhat", "not sure", "don't know", "average"]):
        return 5
    elif any(phrase in text_lower for phrase in ["mild", "a little", "not much", "low", "barely"]):
        return 3

    return None

def analyze_sentiment(text: str) -> tuple:
    """Returns (sentiment_label, intensity_score)"""
    try:
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
        analyzer = SentimentIntensityAnalyzer()
        scores = analyzer.polarity_scores(text)
        compound = scores['compound']
        intensity = abs(compound)
        if compound >= 0.05:
            return "Positive", round(intensity, 2)
        elif compound <= -0.05:
            return "Negative", round(intensity, 2)
        else:
            return "Neutral", round(intensity, 2)
    except Exception:
        # Fallback
        text_lower = text.lower()
        neg_words = ["sad", "stress", "bad", "die", "hurt", "fail", "hard", "stressed"]
        pos_words = ["good", "happy", "better", "hope", "well"]
        neg_count = sum(1 for w in neg_words if w in text_lower)
        pos_count = sum(1 for w in pos_words if w in text_lower)
        if neg_count > pos_count: return "Negative", 0.7
        if pos_count > neg_count: return "Positive", 0.7
        return "Neutral", 0.3

EMOTION_KEYWORDS = {
    "anxiety": ["anxiety", "anxious", "worried", "nervous", "panic", "restless", "tense"],
    "sadness": ["sad", "depressed", "unhappy", "low", "miserable", "heartbroken", "gloomy"],
    "frustration": ["frustrated", "frustrating", "annoyed", "annoying"],
    "anger": ["angry", "furious", "mad", "bitter"],
    "fear": ["fear", "scared", "afraid", "terrified", "frightened", "dread"],
    "guilt": ["guilt", "ashamed", "remorse", "regret", "sorry"],
    "loneliness": ["lonely", "alone", "isolated", "empty", "abandoned"]
}

def detect_yes_no(text: str) -> Optional[bool]:
    text_lower = text.lower()
    if any(word in text_lower for word in ["yes", "yeah", "definitely", "absolutely", "i do", "it is", "true"]):
        return True
    if any(word in text_lower for word in ["no", "never", "not really", "nope", "i don't", "it isn't", "false"]):
        return False
    return None

def detect_emotions(text: str) -> List[str]:
    text_lower = text.lower()
    found = []
    for emotion, keywords in EMOTION_KEYWORDS.items():
        if any(re.search(rf"\b{kw}\b", text_lower) for kw in keywords):
            # Make sure it explicitly matches the user's text tokens to avoid hallucinating
            found.append(emotion)
    return found

PHYSICAL_SYMPTOMS_KEYWORDS = {
    "racing heart": ["heart races", "racing heart", "fast heart", "palpitations"],
    "chest tightness": ["tightness in chest", "chest tightness", "heavy chest", "tightness in my chest"],
    "restlessness": ["restless", "can't sit still", "fidgety"],
    "fatigue": ["fatigue", "tired", "exhausted"],
    "headache": ["headache", "migraine"]
}

def detect_physical_symptoms(text: str) -> List[str]:
    text_lower = text.lower()
    found = []
    for symptom, keywords in PHYSICAL_SYMPTOMS_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            found.append(symptom)
    return found

def detect_summary_request(text: str) -> bool:
    """Detects if the user is asking the bot to summarize their condition."""
    text_lower = text.lower()
    return any(phrase in text_lower for phrase in [
        "what is my problem", "what do i have", "summarize my issue",
        "can you tell me what is wrong", "what's wrong with me",
        "summary of my", "what are my symptoms", "diagnose me"
    ])

def detect_meta_query(text: str) -> Optional[str]:
    """Detects basic identity/purpose/meta questions based on the required System Prompt."""
    text_lower = text.lower()
    
    # Existing Identity
    if any(kw in text_lower for kw in ["your name", "who are you", "what are you"]):
        return "I'm MindCare AI, your supportive and empathetic mental health companion. 👋"
    if any(kw in text_lower for kw in ["your purpose", "what do you do", "why are you here"]):
        return "My purpose is to listen, provide emotional support, and help you navigate through your thoughts in a safe space."
    if any(kw in text_lower for kw in ["do next", "what should i do", "what's next"]):
        return "We are currently completing your initial assessment. You can continue answering my questions, or if we're done, you can proceed to the 'Done Chatting' button."
        
    # Meta questions about AI function
    if any(kw in text_lower for kw in ["who created", "who made", "developer"]):
        return "I was created by the MindCare team to serve as an intelligent, memory-aware mental health assistant."
    if any(kw in text_lower for kw in ["are you ai", "are you human", "are you a human", "are you an ai", "are you a robot"]):
        return "I am an AI mental health assistant, not a human. I'm here to listen and help structure your thoughts, but I cannot replace professional medical help."
    if any(kw in text_lower for kw in ["are you a therapist", "are you a doctor"]):
        return "I am an AI assistant, not a licensed therapist or doctor. While I can offer support and help clarify your feelings, please seek a professional for medical diagnoses."
    if any(kw in text_lower for kw in ["store data", "save my data", "privacy"]):
        return "Your data is stored securely and privately during our session to help understand your situation, but it is not shared publicly."
    if any(kw in text_lower for kw in ["calculate severity", "how do you score", "assess stress"]):
        return "I calculate severity based primarily on your self-rating (1-10), combined with the functional impact on your daily life, the duration of your issue, and the context you share."
        
    return None

def detect_memory_request(text: str) -> bool:
    """Detects if the user is asking about previously stored information."""
    t = text.lower()
    return any(p in t for p in [
        "what is my name", "what's my name", "my name",
        "severity score", "what is my severity", "my score", 
        "emotions did i", "what emotions", "my emotions",
        "coping method", "coping strateg", "how am i coping",
        "my duration", "how long did i", 
        "high risk", "am i at risk",
        "what triggers", "my triggers"
    ])

def classify_intent(text: str) -> str:
    if detect_summary_request(text):
        return "Summary request"
    if detect_memory_request(text):
        return "Memory request"
    if detect_meta_query(text) is not None:
        return "Meta question"
    
    text_lower = text.lower()
    if any(re.search(rf"\b{w}\b", text_lower) for w in ["hello", "hi", "hey"]):
        if len(text_lower.split()) <= 3 and "start" not in text_lower:
            return "Greeting"
            
    question_words = ["what", "how", "can you", "are you", "do you", "did i", "where", "why", "who", "is it", "am i", "should i"]
    is_question_word_start = any(text_lower.strip().startswith(w) for w in question_words)
    
    if "?" in text or is_question_word_start:
        return "Direct question"
        
    return "Emotional sharing"

def analyze_message(text: str, existing_analysis: Dict = None) -> Dict:
    """Full NLP analysis of a message based on current stage."""
    if existing_analysis is None:
        existing_analysis = {}
    
    stage = existing_analysis.get("stage", "problem")
    result = {}

    # 1. Current Message Risk (Crucial for router response)
    result["current_message_risk"] = detect_risk(text)
    
    # 2. Cumulative Risk (For records)
    result["risk_flag"] = result["current_message_risk"] or existing_analysis.get("risk_flag", False)
    
    result["sentiment"], result["intensity_score"] = analyze_sentiment(text)
    
    new_triggers = detect_triggers(text)
    result["triggers"] = list(set(new_triggers + existing_analysis.get("triggers", [])))

    # Stage-specific extraction with Continuous Capture
    if stage == "problem":
        result["problem"] = detect_problem(text)
        
    # Always try to capture duration, severity, and physical symptoms if mentioned
    dur = detect_duration(text)
    if dur:
        result["duration"] = dur
    elif stage == "duration" and len(text.strip()) >= 2:
        # Fallback to prevent infinite looping if regex fails
        result["duration"] = text.strip()[:50]
        
    sev = detect_severity(text)
    if sev is not None:
        result["severity"] = sev
    elif stage == "severity":
        # Check text length / words if regex fails, default to 5 if user types a sentence without a number
        if len(text.strip()) >= 2:
            result["severity"] = 5

    # Always capture physical symptoms
    new_symptoms = detect_physical_symptoms(text)
    result["physical_symptoms"] = list(set(new_symptoms + existing_analysis.get("physical_symptoms", [])))

    if stage == "impact":
        result["impact_on_daily_life"] = detect_yes_no(text)
    elif stage == "emotions":
        result["emotions"] = detect_emotions(text)
        # Even if not the emotions stage, if we find explicitly stated emotions, append them:
    else:
        explicit_emotions = detect_emotions(text)
        if explicit_emotions:
            result["emotions"] = list(set(explicit_emotions + existing_analysis.get("emotions", [])))

    if stage == "coping":
        result["coping_strategy"] = text.strip()
    elif stage == "support":
        result["support_available"] = detect_yes_no(text)
        
    return result

def generate_overall_assessment(analysis: Dict) -> str:
    """Generates a summary assessment based on severity and risk."""
    severity = analysis.get("severity")
    if severity is None:
        severity = 5
        
    risk = analysis.get("risk_flag", False)
    problem = analysis.get("problem", "Stress")
    
    if risk:
        return f"High Risk {problem}"
    
    if severity <= 3:
        level = "Mild"
    elif severity <= 6:
        level = "Moderate"
    else:
        level = "Severe"
        
    return f"{level} {problem}"

def estimate_severity_from_context(analysis: Dict) -> int:
    """If user never gave numeric severity, estimate from other signals."""
    if analysis.get("severity"):
        return int(analysis["severity"])
    
    score = 5  # baseline
    sentiment = analysis.get("sentiment", "Neutral")
    intensity = analysis.get("intensity_score", 0.3)
    risk = analysis.get("risk_flag", False)
    has_support = analysis.get("support_available", False)
    has_coping = bool(analysis.get("coping_strategy"))
    
    if risk:
        return 9
    elif sentiment == "Negative":
        base_calc = 5 + int(intensity * 4) # Max 9
        # Buffer downward if they have coping or support, making them firmly Moderate
        if has_support or has_coping:
            score = min(base_calc, 6) # Cap moderate
        else:
            score = base_calc
    elif sentiment == "Positive":
        score = max(2, 5 - int(intensity * 3))
    
    return min(10, max(1, score))
