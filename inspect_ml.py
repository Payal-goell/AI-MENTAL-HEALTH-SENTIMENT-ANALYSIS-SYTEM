import pickle
import joblib
import os
import sklearn.preprocessing
import sys
import numpy as np
import logging

# Setup basic logging to see where it fails
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Mock LabelEncoder for unpickling
sys.modules['LabelEncoder'] = sklearn.preprocessing

MODELS_DIR = 'backend/Pre-trained_Models/Step1_Behaviour'
model_path = os.path.join(MODELS_DIR, 'Best_Mental_Behaviour_Model.pkl')
encoder_path = os.path.join(MODELS_DIR, 'Model_Encoders.pkl')

print("--- Encoders ---")
try:
    with open(encoder_path, 'rb') as f:
        # Try a different unpickling approach if direct load fails
        try:
            enc = pickle.load(f)
        except Exception as e:
            logger.error(f"Pickle load failed: {e}")
            f.seek(0)
            enc = joblib.load(f)
            
    if isinstance(enc, dict):
        for k, v in enc.items():
            if hasattr(v, 'classes_'):
                print(f"{k}: {v.classes_}")
            else:
                print(f"{k}: {type(v)} (no classes_)")
    else:
        print(f"Encoders is not a dict: {type(enc)}")

except Exception as e:
    print(f"Failed to load encoders: {e}")

print("\n--- Model ---")
try:
    model = joblib.load(model_path)
    print(f"Model type: {type(model)}")
    
    if hasattr(model, 'n_features_in_'):
        print(f"Features in: {model.n_features_in_}")
        
    if hasattr(model, 'feature_names_in_'):
        print(f"Feature names: {model.feature_names_in_}")
    
    if hasattr(model, 'classes_'):
        print(f"Model classes: {model.classes_}")
        
except Exception as e:
    print(f"Failed to load model: {e}")
