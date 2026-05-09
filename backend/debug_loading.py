import os
import sys
import logging
import pickle

# Setup logging to console
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add backend to path
sys.path.append(os.path.dirname(__file__))

import ml_loader

def debug_load():
    print(f"Current Directory: {os.getcwd()}")
    print(f"Python Executable: {sys.executable}")
    print(f"Python Path: {sys.path}")
    
    MODELS_DIR = os.path.join(os.path.dirname(ml_loader.__file__), "Pre-trained_Models")
    print(f"Expected MODELS_DIR: {MODELS_DIR}")
    print(f"Exists: {os.path.exists(MODELS_DIR)}")
    
    model_path = os.path.join(MODELS_DIR, "Step1_Behaviour", "Best_Mental_Behaviour_Model.pkl")
    print(f"Model Path: {model_path}")
    print(f"Exists: {os.path.exists(model_path)}")
    
    print("\n--- Attempting load_behaviour_models() ---")
    success = ml_loader.load_behaviour_models()
    print(f"Load Success: {success}")
    
    if not success:
        print("\n--- Manual Load Attempt for Detail ---")
        import joblib
        try:
            m = joblib.load(model_path)
            print("Joblib manual load success")
        except Exception as e:
            print(f"Joblib manual load failure: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    debug_load()
