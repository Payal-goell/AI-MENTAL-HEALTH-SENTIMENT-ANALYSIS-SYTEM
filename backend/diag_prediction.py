import os
import joblib
import numpy as np
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Mock the ml_loader environment
sys.path.append(os.path.dirname(__file__))
import ml_loader

def diag():
    print("Starting diagnostics...")
    
    # Load models
    success = ml_loader.load_behaviour_models()
    print(f"Model Load Success: {success}")
    if not success:
        print("Failed to load models. Exiting.")
        return

    print("\n--- Model Details ---")
    model = ml_loader.behaviour_model
    if hasattr(model, "feature_names_in_"):
        print(f"Feature Names: {model.feature_names_in_}")
    else:
        print("Model has no feature_names_in_")
    if hasattr(model, "n_features_in_"):
        print(f"Number of Features: {model.n_features_in_}")

    print("\n--- Encoders Details ---")
    encs = ml_loader.behaviour_encoders
    if isinstance(encs, dict):
        for k, v in encs.items():
            classes = v.classes_ if hasattr(v, "classes_") else "no classes_"
            print(f"Key: {k}, Type: {type(v)}, Classes: {classes}")
    else:
        print(f"Encoders is not a dict: {type(encs)}")

    # Mock input data similar to what routers/behaviour.py sends
    input_data = {
        "gender": "Male",
        "occupation": "Engineer",
        "age": 30,
        "bmi_category": "Healthy Weight",
        "sleep_hours": 7.0,
        "sleep_quality": 8,
        "physical_activity": 50,
        "stress_level": 5,
        "heart_rate": 72,
        "daily_steps": 5000,
        "systolic_bp": 120,
        "diastolic_bp": 80,
    }

    try:
        print("\nAttempting prediction with mock data...")
        result = ml_loader.predict_behaviour(input_data)
        print("\nPrediction Result:")
        print(result)
    except Exception as e:
        print(f"\nCaught Exception during prediction: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    diag()
