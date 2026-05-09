import os
import joblib
import logging
import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODELS_DIR = os.path.abspath(r"d:\MindCare-AI\backend\Pre-trained_Models")
model_path = os.path.join(MODELS_DIR, "Step1_Behaviour", "Best_Mental_Behaviour_Model.pkl")
encoder_path = os.path.join(MODELS_DIR, "Step1_Behaviour", "Model_Encoders.pkl")

print(f"Loading from: {MODELS_DIR}")

try:
    model = joblib.load(model_path)
    encoders = joblib.load(encoder_path)
    print("\n✅ Successfully loaded model and encoders")
    
    print("\n--- Encoders Info ---")
    if isinstance(encoders, dict):
        for key, enc in encoders.items():
            if hasattr(enc, 'classes_'):
                print(f"{key}: {enc.classes_}")
            else:
                print(f"{key}: {type(enc)}")
    else:
        print(f"Encoders is not a dict: {type(encoders)}")

    # Test prediction
    # Features: Gender, Age, Occupation, Sleep Duration, Quality of Sleep, 
    # Physical Activity Level, Stress Level, BMI Category, Heart Rate, Daily Steps, Systolic, Diastolic
    # Based on ml_loader.py:
    # safe_encode("le_gender", gender), # 0
    # age, # 1
    # safe_encode("le_occ", occupation), # 2
    # sleep_hours, # 3
    # sleep_quality, # 4
    # physical_activity, # 5
    # stress_level, # 6
    # safe_encode("le_bmi", bmi_category), # 7
    # heart_rate, # 8
    # daily_steps, # 9
    # systolic_bp, # 10
    # diastolic_bp, # 11
    
    test_features = [0, 30, 0, 7.0, 6, 50, 5, 0, 72, 5000, 120, 80]
    X = np.array(test_features).reshape(1, -1)
    
    print("\n--- Testing Prediction ---")
    pred = model.predict(X)
    print(f"Prediction: {pred}")
    
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X)
        print(f"Probabilities: {proba}")

except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
