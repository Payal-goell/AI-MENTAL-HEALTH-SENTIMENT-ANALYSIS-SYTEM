import pickle
import os
import sys
import sklearn.preprocessing
sys.modules['LabelEncoder'] = sklearn.preprocessing # Fix for weird pickle error
from sklearn.preprocessing import LabelEncoder

encoder_path = r"d:\MindCare-AI\backend\Pre-trained_Models\Step1_Behaviour\Model_Encoders.pkl"
model_path = r"d:\MindCare-AI\backend\Pre-trained_Models\Step1_Behaviour\Best_Mental_Behaviour_Model.pkl"

print("--- Encoders ---")
with open(encoder_path, "rb") as f:
    encoders = pickle.load(f)
    print(f"Type: {type(encoders)}")
    if isinstance(encoders, dict):
        for key, val in encoders.items():
            print(f"Key: {key}, Type: {type(val)}")
            if hasattr(val, 'classes_'):
                print(f"  Classes: {val.classes_}")
            elif hasattr(val, 'categories_'):
                print(f"  Categories: {val.categories_}")
    else:
        print(encoders)

print("\n--- Model ---")
with open(model_path, "rb") as f:
    model = pickle.load(f)
    print(f"Type: {type(model)}")
    if hasattr(model, 'feature_names_in_'):
        print(f"Feature names: {model.feature_names_in_}")
    else:
        print("Feature names not found in model.")
    if hasattr(model, 'classes_'):
        print(f"Classes: {model.classes_}")
