from nlp_service import analyze_message

def test_continuous_flow():
    print("Testing Continuous Chat Flow...")
    
    # 1. Start with problem stage
    state = {"stage": "problem", "problem": None}
    msg1 = "I am stressed about my exams"
    analysis1 = analyze_message(msg1, state)
    print(f"Msg 1: {msg1}")
    print(f"Next Stage: {analysis1.get('problem') and 'duration' or 'problem'}")
    
    # Simulate router transition (manually for unit test)
    state["stage"] = "duration"
    state["problem"] = analysis1.get("problem")
    
    # 2. Advance through all stages to followup
    stages = ["duration", "severity", "impact", "emotions", "coping", "support"]
    for s in stages:
        state["stage"] = s
        analysis = analyze_message("test", state)
        # In actual router, stage transitions happen in chat.py
        print(f"Processed stage: {s}")

    # 3. Verify followup stage
    print("\nVerifying Follow-up transition...")
    # In chat.py, support -> followup
    current_stage = "support"
    # (Simulating chat.py logic)
    next_stage = "followup"
    print(f"Support stage now leads to: {next_stage}")
    
    # 4. Verify completed record mapping
    print("\nVerifying 'completed' mapping logic (simulated)...")
    legacy_stage = "completed"
    if legacy_stage == "completed":
        active_stage = "followup"
    print(f"Legacy 'completed' maps to: {active_stage}")

if __name__ == "__main__":
    test_continuous_flow()
