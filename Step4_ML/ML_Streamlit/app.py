import streamlit as st
import pandas as pd
import joblib

# -----------------------------------
# Load saved ML files
# -----------------------------------
model = joblib.load("behaviour_risk_xgb_model.pkl")
label_encoder = joblib.load("behaviour_risk_label_encoder.pkl")
model_features = joblib.load("model_features.pkl")

# -----------------------------------
# Page config
# -----------------------------------
st.set_page_config(
    page_title="Behaviour Risk Prediction",
    layout="centered"
)

st.title("🧠 AI-Based Behaviour Risk Prediction")
st.write("Enter your lifestyle and health details below")

# -----------------------------------
# User Inputs
# -----------------------------------
gender = st.selectbox("Gender", ["Male", "Female"])
age = st.number_input("Age", min_value=10, max_value=100, value=22)

occupation = st.selectbox(
    "Occupation",
    ["Student", "Employee", "Self-employed", "Other"]
)

sleep_duration = st.slider("Sleep Duration (hours)", 0.0, 10.0, 6.0)
quality_sleep = st.slider("Quality of Sleep (1–10)", 1, 10, 5)
physical_activity = st.slider(
    "Physical Activity Level (minutes/day)", 0, 120, 30
)
stress_level = st.slider("Stress Level (1–10)", 1, 10, 5)

bmi = st.selectbox(
    "BMI Category",
    ["Underweight", "Normal", "Overweight", "Obese"]
)

blood_pressure = st.selectbox(
    "Blood Pressure",
    ["Normal", "120/80", "130/85", "140/90"]
)

heart_rate = st.slider("Heart Rate", 50, 120, 75)
daily_steps = st.slider("Daily Steps", 0, 20000, 4000)

# -----------------------------------
# Prediction Button
# -----------------------------------
if st.button("🔍 Predict Behaviour Risk"):

    user_data = pd.DataFrame([{
        "Gender": gender,
        "Age": age,
        "Occupation": occupation,
        "Sleep Duration": sleep_duration,
        "Quality of Sleep": quality_sleep,
        "Physical Activity Level": physical_activity,
        "Stress Level": stress_level,
        "BMI Category": bmi,
        "Blood Pressure": blood_pressure,
        "Heart Rate": heart_rate,
        "Daily Steps": daily_steps
    }])

    user_data = pd.get_dummies(user_data)

    user_data = user_data.reindex(
        columns=model_features,
        fill_value=0
    )

    prediction = model.predict(user_data)
    result = label_encoder.inverse_transform(prediction)[0]

    if result == "Low":
        st.success("🟢 Behaviour Risk: LOW")
    elif result == "Medium":
        st.warning("🟡 Behaviour Risk: MEDIUM")
    else:
        st.error("🔴 Behaviour Risk: HIGH")


