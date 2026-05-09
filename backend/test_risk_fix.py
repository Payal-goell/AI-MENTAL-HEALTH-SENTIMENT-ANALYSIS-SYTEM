from nlp_service import analyze_message, detect_general_query

def test_risk_recalculation():
    print("Testing Risk Recalculation...")
    
    # Message 1: Risky
    msg1 = "I feel hopeless and think there is no reason to live."
    analysis1 = analyze_message(msg1, {"risk_flag": False, "stage": "problem"})
    print(f"Msg 1: {msg1}")
    print(f"Current Risk: {analysis1['current_message_risk']}")
    print(f"Cumulative Risk: {analysis1['risk_flag']}")
    
    # Message 2: Normal (after risky)
    msg2 = "What is your name?"
    analysis2 = analyze_message(msg2, analysis1)
    print(f"\nMsg 2: {msg2}")
    print(f"Current Risk: {analysis2['current_message_risk']}")
    print(f"Cumulative Risk: {analysis2['risk_flag']}")
    
    # Test Identity Query
    identity = detect_general_query(msg2)
    print(f"Bot Reply to Msg 2 (General Query): {identity}")

    # Message 3: Another normal one (stage check)
    msg3 = "I am stressed about exams"
    analysis3 = analyze_message(msg3, analysis2)
    print(f"\nMsg 3: {msg3}")
    print(f"Current Risk: {analysis3['current_message_risk']}")
    print(f"Cumulative Risk: {analysis3['risk_flag']}")
    print(f"Problem Extracted: {analysis3.get('problem')}")

if __name__ == "__main__":
    test_risk_recalculation()
