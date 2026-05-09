import os
import sys
import logging
import pickle
import traceback
import joblib
import sklearn

print(f"Scikit-learn version: {sklearn.__version__}")

MODELS_DIR = os.path.join(os.getcwd(), "Pre-trained_Models")
model_path = os.path.join(MODELS_DIR, "Step1_Behaviour", "Best_Mental_Behaviour_Model.pkl")
encoder_path = os.path.join(MODELS_DIR, "Step1_Behaviour", "Model_Encoders.pkl")

# No patches initially
try:
    model = joblib.load(model_path)
    print("SUCCESS: Model loaded successfully")
except Exception as e:
    print(f"FAILURE: Model load failed: {e}")
    # Try with patches if fails
    import sklearn.preprocessing
    sys.modules['LabelEncoder'] = sklearn.preprocessing 
    try:
        import sklearn._loss.loss as sklearn_loss
        sys.modules['_loss'] = sklearn_loss
        print("INFO: Patched sys.modules['_loss']")
    except ImportError:
        pass
    
    try:
        model = joblib.load(model_path)
        print("SUCCESS: Model loaded successfully after patching")
    except Exception as e2:
        print(f"FAILURE: Model load failed even after patching: {e2}")

try:
    encoders = joblib.load(encoder_path)
    print("SUCCESS: Encoders loaded successfully")
except Exception as e:
    print(f"FAILURE: Encoders load failed: {e}")
