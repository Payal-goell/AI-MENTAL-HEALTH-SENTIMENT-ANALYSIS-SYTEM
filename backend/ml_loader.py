"""
ML Model Loader - Loads all pre-trained models once at startup.
Models are only used for inference, never retrained.
"""
import os
import pickle
import json
import numpy as np
import logging
import sys
from sklearn.preprocessing import LabelEncoder

logger = logging.getLogger(__name__)


# Global model holders
behaviour_model = None
behaviour_encoders = None
face_model = None
voice_cnn_model = None
voice_scaler = None
voice_encoder = None

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "Pre-trained_Models"))

# Compatibility patch for scikit-learn models
try:
    import sklearn._loss.loss as sklearn_loss
    # Fix for "__pyx_unpickle_CyHalfMultinomialLoss" missing in some sklearn versions
    if not hasattr(sklearn_loss, "__pyx_unpickle_CyHalfMultinomialLoss"):
        def __pyx_unpickle_CyHalfMultinomialLoss(*args):
            return None
        sklearn_loss.__pyx_unpickle_CyHalfMultinomialLoss = __pyx_unpickle_CyHalfMultinomialLoss
    sys.modules['_loss'] = sklearn_loss
except ImportError:
    try:
        import sklearn.ensemble._hist_gradient_boosting.loss as hgb_loss
        sys.modules['_loss'] = hgb_loss
    except ImportError:
        pass

def load_behaviour_models():
    """Load the pre-trained mental behaviour model and encoders."""
    global behaviour_model, behaviour_encoders
    try:
        import joblib
        model_path = os.path.join(MODELS_DIR, "Step1_Behaviour", "Best_Mental_Behaviour_Model.pkl")
        encoder_path = os.path.join(MODELS_DIR, "Step1_Behaviour", "Model_Encoders.pkl")
        
        # Verify files exist
        if not os.path.exists(model_path):
            logger.error(f"❌ Behaviour model file not found: {model_path}")
            return False
        if not os.path.exists(encoder_path):
            logger.error(f"❌ Behaviour encoders file not found: {encoder_path}")
            return False

        # Try joblib first as it's more standard for sklearn models
        try:
            behaviour_model = joblib.load(model_path)
            behaviour_encoders = joblib.load(encoder_path)
        except Exception as e:
            logger.warning(f"Joblib load failed: {e}. Trying standard pickle...")
            with open(model_path, "rb") as f:
                behaviour_model = pickle.load(f)
            with open(encoder_path, "rb") as f:
                behaviour_encoders = pickle.load(f)
        
        logger.info("✅ Behaviour models loaded successfully")
        return True
    except Exception as e:
        logger.exception(f"⚠️ Behaviour models failed to load: {e}")
        return False

def load_face_model():
    global face_model
    try:
        import tensorflow as tf
        model_path = os.path.join(MODELS_DIR, "Step3_Face", "Resnet_model_version_2.keras")

        if not os.path.exists(model_path):
            logger.error(f"❌ Face model file not found: {model_path}")
            return False

        # Try loading with compile=False first (more lenient)
        try:
            face_model = tf.keras.models.load_model(model_path, compile=False)
        except Exception as e1:
            # Try with custom_objects to handle legacy batch_shape argument
            try:
                class LegacyInputLayer(tf.keras.layers.InputLayer):
                    def __init__(self, **kwargs):
                        if 'batch_shape' in kwargs:
                            kwargs['shape'] = kwargs.pop('batch_shape')[1:]
                        super().__init__(**kwargs)
                face_model = tf.keras.models.load_model(
                    model_path,
                    compile=False,
                    custom_objects={'InputLayer': LegacyInputLayer}
                )
            except Exception as e2:
                logger.error(f"Face model load failed. Primary: {e1} | Fallback: {e2}")
                return False

        logger.info("✅ Face emotion model loaded successfully")
        return True
    except Exception as e:
        logger.exception(f"⚠️ Face model failed to load: {e}")
        return False

def load_voice_models():
    global voice_cnn_model, voice_scaler, voice_encoder
    try:
        import tensorflow as tf
        scaler_path = os.path.join(MODELS_DIR, "Step4_Voice", "scaler2.pickle")
        encoder_path = os.path.join(MODELS_DIR, "Step4_Voice", "encoder2.pickle")
        model_json_path = os.path.join(MODELS_DIR, "Step4_Voice", "CNN_model.json")
        model_weights_path = os.path.join(MODELS_DIR, "Step4_Voice", "CNN_model.weights.h5")
        
        # Verify paths
        paths = [scaler_path, encoder_path, model_json_path, model_weights_path]
        for p in paths:
            if not os.path.exists(p):
                logger.error(f"❌ Voice component not found: {p}")
                return False

        with open(scaler_path, "rb") as f:
            voice_scaler = pickle.load(f)
        with open(encoder_path, "rb") as f:
            voice_encoder = pickle.load(f)
        
        with open(model_json_path, "r") as f:
            model_json = f.read()
        voice_cnn_model = tf.keras.models.model_from_json(model_json)
        voice_cnn_model.load_weights(model_weights_path)
        logger.info("✅ Voice models loaded successfully")
        return True
    except Exception as e:
        logger.exception(f"⚠️ Voice models failed to load: {e}")
        return False

def load_all_models():
    logger.info(f"Loading all pre-trained models from: {MODELS_DIR}")
    
    # Behaviour model is CRITICAL for the requested fix
    if not load_behaviour_models():
        logger.critical("🚨 CRITICAL: Behaviour models failed to load at startup!")
        raise RuntimeError("CRITICAL: Behaviour model files not found or corrupted.")
    
    # Others are optional (mock mode allowed in their load functions)
    load_face_model()
    load_voice_models()
    
    logger.info("Model loading complete.")


# ─────────────────────────────────────────────
# Behaviour Prediction
# ─────────────────────────────────────────────
BEHAVIOUR_SEVERITY_MAP = {"Low": 3, "Medium": 6, "High": 8}
BEHAVIOUR_RECOMMENDATIONS = {
    "Low": ["Maintain your current healthy lifestyle", "Continue regular sleep schedule", "Keep up with physical activity"],
    "Medium": ["Improve sleep quality", "Increase physical activity", "Practice stress management techniques", "Monitor blood pressure regularly"],
    "High": ["Seek professional mental health support", "Urgently improve sleep schedule", "Reduce stress through meditation or therapy", "Consult a doctor about blood pressure", "Limit screen time before bed"]
}

def predict_behaviour(input_data: dict):
    """Predict mental behaviour risk from input features."""
    if behaviour_model is None or behaviour_encoders is None:
        logger.error("❌ Behaviour model or encoders not loaded!")
        raise RuntimeError("Model files not loaded. Please check backend logs.")
    
    try:
        # 0. Log incoming data for debugging
        logger.info(f"Incoming prediction data: {input_data}")

        # 1. Extract inputs with exact fallbacks
        gender = input_data.get("gender", "Male")
        occupation = input_data.get("occupation", "Engineer")
        bmi_category = input_data.get("bmi_category", "Healthy Weight")
        
        # 2. Encode categorical features using pre-loaded encoders
        enc = behaviour_encoders
        
        def safe_encode(col, val):
            try:
                if enc is None:
                    return 0
                
                transformer = None
                if isinstance(enc, dict):
                    transformer = enc.get(col)
                elif hasattr(enc, col):
                    transformer = getattr(enc, col)
                
                if transformer and hasattr(transformer, 'transform'):
                    try:
                        val_str = str(val if val is not None else "")
                        return int(transformer.transform([val_str])[0])
                    except Exception as te:
                        logger.warning(f"Transform failed for {col}={val}: {te}. Returning 0.")
                        return 0
                else:
                    try:
                        return int(float(val)) if val is not None else 0
                    except (ValueError, TypeError):
                        return 0
            except Exception as e:
                logger.error(f"Encoding error for {col} with value {val}: {e}")
                return 0

        # Construct feature vector in EXACT order expected by the trained model
        # 1. Gender, 2. Age, 3. Occupation, 4. Sleep Duration, 5. Quality of Sleep, 
        # 6. Physical Activity Level, 7. Stress Level, 8. BMI Category, 9. Heart Rate, 10. Daily Steps, 11. Systolic, 12. Diastolic
        
        feature_names = [
            "Gender", "Age", "Occupation", "Sleep Duration", "Quality of Sleep",
            "Physical Activity Level", "Stress Level", "BMI Category", "Heart Rate",
            "Daily Steps", "Systolic", "Diastolic"
        ]
        
        try:
            features = [
                safe_encode("le_gender", gender),            # 0: Gender
                int(input_data.get("age", 30)),              # 1: Age
                safe_encode("le_occ", occupation),           # 2: Occupation
                float(input_data.get("sleep_hours", 7.0)),   # 3: Sleep Duration
                int(input_data.get("sleep_quality", 6)),    # 4: Quality of Sleep
                int(input_data.get("physical_activity", 60)),# 5: Physical Activity Level
                int(input_data.get("stress_level", 5)),      # 6: Stress Level
                safe_encode("le_bmi", bmi_category),         # 7: BMI Category
                int(input_data.get("heart_rate", 72)),      # 8: Heart Rate
                int(input_data.get("daily_steps", 8000)),   # 9: Daily Steps
                int(input_data.get("systolic_bp", 120)),    # 10: Systolic
                int(input_data.get("diastolic_bp", 80)),     # 11: Diastolic
            ]
            
            # Log named features for clarity in terminal
            named_features = dict(zip(feature_names, features))
            logger.info(f"Generated named features: {named_features}")
            logger.info(f"Final feature vector: {features}")
        except Exception as fe:
            logger.error(f"Feature construction failed: {fe}")
            raise ValueError(f"Feature construction error: {str(fe)}")
        
        # 3. Create input array and predict
        X = np.array(features).reshape(1, -1)
        
        try:
            pred = behaviour_model.predict(X)[0]
            proba = behaviour_model.predict_proba(X)[0]
            logger.info(f"Raw Prediction: {pred}, Probabilities: {proba}")
        except Exception as pe:
            logger.exception(f"Model prediction failed: {pe}")
            raise RuntimeError(f"ML Model Prediction Failure: {str(pe)}")
        
        # Determine risk label
        risk = "Medium" 
        try:
            if isinstance(enc, dict) and 'le_target' in enc:
                risk = enc['le_target'].inverse_transform([pred])[0]
            elif hasattr(enc, 'le_target'):
                risk = getattr(enc, 'le_target').inverse_transform([pred])[0]
            else:
                # Fallback map if encoder missing (Based on: ['High', 'Low', 'Medium'])
                risk_map = {0: "High", 1: "Low", 2: "Medium"}
                risk = risk_map.get(int(pred), "Medium")
            
            logger.info(f"Mapped risk label: {risk}")
        except Exception as e:
            logger.error(f"Error mapping risk label: {e}")

        risk = str(risk).capitalize()
        confidence = float(max(proba)) * 100
        
        result = {
            "behaviour_risk": risk,
            "risk_level": risk, 
            "confidence": round(float(confidence), 1),
            "severity_score": int(BEHAVIOUR_SEVERITY_MAP.get(risk, 5)),
            "recommendations": list(BEHAVIOUR_RECOMMENDATIONS.get(risk, ["Maintain a healthy routine"]))
        }
        logger.info(f"Final Prediction result dictionary: {result}")
        return result
    except Exception as e:
        logger.exception(f"Behaviour prediction top-level error: {e}")
        raise e

# ─────────────────────────────────────────────
# Face Emotion Prediction
# ─────────────────────────────────────────────
FACE_EMOTION_LABELS = ["Happy", "Neutral", "Sad", "Angry", "Surprise", "Fear", "Disgust"]
FACE_SEVERITY_MAP = {"Happy": 2, "Neutral": 4, "Surprise": 4, "Sad": 6, "Angry": 7, "Fear": 8, "Disgust": 7}

def predict_face_emotion(frame_array: np.ndarray):
    """Predict emotion from a single preprocessed frame."""
    if face_model is None:
        import random
        emotion = random.choice(FACE_EMOTION_LABELS)
        probs = np.random.dirichlet(np.ones(len(FACE_EMOTION_LABELS)))
        return emotion, float(max(probs)), dict(zip(FACE_EMOTION_LABELS, probs.tolist()))
    
    try:
        input_tensor = frame_array[np.newaxis, ...]
        preds = face_model.predict(input_tensor, verbose=0)[0]
        emotion_idx = int(np.argmax(preds))
        emotion = FACE_EMOTION_LABELS[emotion_idx] if emotion_idx < len(FACE_EMOTION_LABELS) else "Neutral"
        confidence = float(preds[emotion_idx])
        dist = dict(zip(FACE_EMOTION_LABELS[:len(preds)], [float(p) for p in preds]))
        return emotion, confidence, dist
    except Exception as e:
        logger.error(f"Face prediction error: {e}")
        return "Neutral", 0.5, {e: 0.5 for e in FACE_EMOTION_LABELS}

# ─────────────────────────────────────────────
# Voice Emotion Prediction
# ─────────────────────────────────────────────
VOICE_EMOTION_LABELS = ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]
VOICE_SEVERITY_MAP = {"happy": 2, "neutral": 4, "surprise": 4, "sad": 6, "angry": 7, "fear": 8, "disgust": 7}
VOICE_STRESS_MAP = {
    "happy": "Low", "neutral": "Medium", "surprise": "Medium",
    "sad": "High", "angry": "High", "fear": "High", "disgust": "High"
}
VOICE_MOOD_MAP = {
    "happy": "Calm", "neutral": "Stable", "surprise": "Stable",
    "sad": "Low Mood", "angry": "Stressed", "fear": "Anxious", "disgust": "Distressed"
}

def predict_voice_emotion(features: np.ndarray):
    """Predict voice emotion from extracted audio features."""
    if voice_cnn_model is None or voice_scaler is None or voice_encoder is None:
        import random
        emotion = random.choice(VOICE_EMOTION_LABELS)
        confidence = round(random.uniform(0.55, 0.95), 2)
        return emotion, confidence
    
    try:
        # 1. Reshape for scaler
        features_reshaped = features.reshape(1, -1)
        
        # 2. Apply the loaded scaler (CRITICAL STEP)
        features_scaled = voice_scaler.transform(features_reshaped)
        
        # --- DEBUG LOGGING ---
        print(f"SCALED MAX: {np.max(features_scaled)}")
        print(f"SCALED MIN: {np.min(features_scaled)}")
        # ---------------------
        
        # 3. Reshape for CNN (CNNs expect 3D input: samples, timesteps, channels)
        features_final = np.expand_dims(features_scaled, axis=2)
        
        # 4. Predict
        predictions = voice_cnn_model.predict(features_final, verbose=0)
        predicted_class_index = int(np.argmax(predictions, axis=1)[0])
        
        # 5. Decode label
        try:
            # Reconstruct the one-hot encoded array that inverse_transform expects
            # Since the encoder expects (1, 7) shape (n_samples, n_classes)
            if hasattr(voice_encoder, 'categories_'):
                n_classes = len(voice_encoder.categories_[0])
                pred_onehot = np.zeros((1, n_classes))
                pred_onehot[0, predicted_class_index] = 1.0
                label = voice_encoder.inverse_transform(pred_onehot)[0][0]
            else:
                label = voice_encoder.inverse_transform([[predicted_class_index]])[0]
                if isinstance(label, (list, np.ndarray)):
                    label = label[0]
        except Exception:
            # Generic fallback to exact 7-class string mapping
            if hasattr(voice_encoder, 'categories_'):
                label = voice_encoder.categories_[0][predicted_class_index]
            elif hasattr(voice_encoder, 'classes_'):
                label = voice_encoder.classes_[predicted_class_index]
            else:
                label = VOICE_EMOTION_LABELS[predicted_class_index] if predicted_class_index < len(VOICE_EMOTION_LABELS) else "neutral"
        
        confidence = float(predictions[0][predicted_class_index])
        return str(label).lower(), confidence
    except Exception as e:
        logger.error(f"Voice prediction error: {e}")
        return "neutral", 0.6
