import streamlit as st
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import os
from datetime import datetime

# ==============================================================================
# 1. PAGE CONFIGURATION & UI STYLING
# ==============================================================================
st.set_page_config(page_title="Pro Mental Health AI", page_icon="🧠", layout="wide")

# Custom CSS for modern UI and severity badges
st.markdown("""
    <style>
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .main { animation: fadeIn 1.5s; background-color: #f8f9fa; }
    .stButton>button { 
        width: 100%; border-radius: 12px; height: 3.5em; 
        background: linear-gradient(45deg, #e74c3c, #ff6b6b); color: white; 
        font-weight: bold; transition: all 0.3s ease;
    }
    .stButton>button:hover { transform: scale(1.02); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
    .res-card { 
        background: white; padding: 25px; border-radius: 15px; 
        box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-left: 10px solid #3498db;
    }
    .severity-badge {
        padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 0.9em;
        display: inline-block; margin-top: 10px;
    }
    </style>
    """, unsafe_allow_html=True)

# ==============================================================================
# 2. SECURE ASSET LOADING (DEFINED GLOBALLY)
# ==============================================================================
@st.cache_resource
def load_assets():
    # Detect absolute path to prevent 'File Not Found' errors
    base_path = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_path, 'Best_Mental_Behaviour_Model.pkl')
    encoder_path = os.path.join(base_path, 'Model_Encoders.pkl')
    
    if os.path.exists(model_path) and os.path.exists(encoder_path):
        try:
            # Re-loading using absolute paths and ensuring compatibility
            model = joblib.load(model_path)
            encoders = joblib.load(encoder_path)
            return model, encoders
        except Exception as e:
            st.error(f"⚠️ Version Compatibility Error: {e}")
            st.info("💡 Try running: `pip install --upgrade 'numpy<2.0.0'`")
            return None, None
    else:
        return None, None

# Load assets globally so they are available BEFORE any functions call them
model, encoders = load_assets()

# Initialize session history
if 'history' not in st.session_state:
    st.session_state.history = []

# --- CRITICAL STARTUP GUARD ---
if model is None or encoders is None:
    st.error("## ❌ System Startup Failed: Required Files Missing or Incompatible")
    st.info(f"Please ensure your .pkl files are in the folder: `{os.path.dirname(os.path.abspath(__file__))}`")
    st.stop() 

# ==============================================================================
# 3. SIDEBAR: PATIENT VITALS
# ==============================================================================
def get_user_inputs():
    st.sidebar.header("📋 Patient Vitals")
    with st.sidebar:
        st.subheader("👤 Personal Details")
        # Encoders is now guaranteed to exist globally
        gender = st.selectbox("Gender", encoders['le_gender'].classes_)
        age = st.number_input("Age", 1, 100, 25)
        occupation = st.selectbox("Occupation", encoders['le_occ'].classes_)
        bmi = st.selectbox("BMI Category", encoders['le_bmi'].classes_)
        
        st.divider()
        st.subheader("🌙 Daily Habits")
        sleep_dur = st.number_input("Sleep Duration (Hours)", 1.0, 15.0, 7.0, 0.5)
        sleep_qual = st.number_input("Sleep Quality (1-10)", 1, 10, 7)
        activity = st.number_input("Physical Activity (Min/Day)", 0, 120, 30)
        
        st.divider()
        st.subheader("💓 Clinical Metrics")
        stress = st.number_input("Current Stress Level (1-10)", 1, 10, 5)
        hr = st.number_input("Heart Rate (BPM)", 40, 160, 72)
        steps = st.number_input("Daily Steps", 0, 40000, 5000)
        sys_bp = st.number_input("Systolic BP", 80, 220, 120)
        dia_bp = st.number_input("Diastolic BP", 50, 140, 80)
        
        return {
            "Gender": gender, "Age": age, "Occupation": occupation, "BMI": bmi,
            "Sleep Duration": sleep_dur, "Sleep Quality": sleep_qual, "Activity": activity,
            "Stress": stress, "Heart Rate": hr, "Steps": steps, "Systolic": sys_bp, "Diastolic": dia_bp
        }

# Calling the function to gather data
user_data = get_user_inputs()

# ==============================================================================
# 4. MAIN DASHBOARD: ANALYTICS & VISUALIZATION
# ==============================================================================
st.title("🧠 Smart Mental Health Counselling System")
st.caption("Advanced AI assessment based on clinical behavioral metrics.")
st.markdown("---")

# Visual overview of current inputs
m1, m2, m3, m4 = st.columns(4)
m1.metric("Stress Level", f"{user_data['Stress']}/10")
m2.metric("Sleep Time", f"{user_data['Sleep Duration']} Hrs")
m3.metric("Heart Rate", f"{user_data['Heart Rate']} BPM")
m4.metric("Blood Pressure", f"{user_data['Systolic']}/{user_data['Diastolic']}")

st.divider()

col_results, col_graphs = st.columns([1, 1.2])

if st.sidebar.button("🚀 Analyze Risk Status"):
    try:
        # Preprocessing using the globally loaded encoders
        g_enc = encoders['le_gender'].transform([user_data["Gender"]])[0]
        o_enc = encoders['le_occ'].transform([user_data["Occupation"]])[0]
        b_enc = encoders['le_bmi'].transform([user_data["BMI"]])[0]
        
        features = np.array([[
            g_enc, user_data["Age"], o_enc, b_enc, 
            user_data["Sleep Duration"], user_data["Sleep Quality"], 
            user_data["Activity"], user_data["Stress"], 
            user_data["Heart Rate"], user_data["Steps"], 
            user_data["Systolic"], user_data["Diastolic"]
        ]])

        # Model Prediction and Probability Calculation
        res_idx = model.predict(features)[0]
        result_label = encoders['le_target'].inverse_transform([res_idx])[0]
        probs = model.predict_proba(features)[0]
        confidence = np.max(probs) * 100
        class_labels = encoders['le_target'].classes_

        # Severity mapping for visual UI elements
        severity_map = {
            "Low": {"level": "MINIMAL", "color": "#27ae60", "icon": "✅", "bg": "#e8f5e9"},
            "Normal": {"level": "STABLE", "color": "#2ecc71", "icon": "🟢", "bg": "#e8fdf0"},
            "Medium": {"level": "MODERATE", "color": "#f39c12", "icon": "⚠️", "bg": "#fff3e0"},
            "High": {"level": "SEVERE", "color": "#e74c3c", "icon": "🚨", "bg": "#ffebee"},
            "Critical": {"level": "EXTREME", "color": "#8e44ad", "icon": "🛑", "bg": "#f3e5f5"}
        }
        sev_data = severity_map.get(result_label, {"level": "UNCERTAIN", "color": "#34495e", "icon": "❓", "bg": "#f0f0f0"})

        with col_results:
            st.subheader("Diagnostic Outcome")
            # The result card using the severity color coding
            st.markdown(f"""
                <div class="res-card" style="border-left-color: {sev_data['color']};">
                    <p style="color: gray; margin: 0;">AI Risk Assessment</p>
                    <h1 style="color: {sev_data['color']}; margin: 0;">{sev_data['icon']} {result_label}</h1>
                    <div class="severity-badge" style="background-color: {sev_data['bg']}; color: {sev_data['color']};">
                        SEVERITY: {sev_data['level']}
                    </div>
                </div>
            """, unsafe_allow_html=True)
            
            st.write("")
            st.write(f"**AI Confidence Level**")
            st.progress(int(confidence))
            st.markdown(f"<p style='text-align: right; color: {sev_data['color']}; font-weight: bold; font-size: 1.2em;'>{confidence:.2f}%</p>", unsafe_allow_html=True)
            
            st.subheader("💡 Expert Recommendations")
            if "High" in result_label or "Medium" in result_label:
                st.warning(f"**Action Required:** {sev_data['level']} markers detected. Improve sleep and monitor stress.")
            else:
                st.success("**Health Check:** Profile stable. Keep up your routine!")

        with col_graphs:
            st.subheader("Visual Health Profile")
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
            
            # Radar Chart Visualization 
            radar_labels = ['Stress', 'Sleep Q.', 'Activity', 'Sleep D.', 'Steps']
            radar_vals = [user_data["Stress"], user_data["Sleep Quality"], user_data["Activity"]/10, 
                          user_data["Sleep Duration"], (user_data["Steps"]/4000)]
            
            angles = np.linspace(0, 2 * np.pi, len(radar_labels), endpoint=False).tolist()
            radar_vals += radar_vals[:1]
            angles += angles[:1]
            
            ax1 = plt.subplot(121, polar=True)
            ax1.fill(angles, radar_vals, color='teal', alpha=0.3)
            ax1.plot(angles, radar_vals, color='teal', linewidth=2)
            ax1.set_xticks(angles[:-1])
            ax1.set_xticklabels(radar_labels)
            ax1.set_title("Health Overview\n")

            # Probability Distribution Chart 
            ax2.barh(class_labels, probs, color='skyblue')
            ax2.set_title('Risk Probability per Category')
            ax2.set_xlim(0, 1)
            
            plt.tight_layout()
            st.pyplot(fig)

        # Logging assessment history for the session
        st.session_state.history.append({
            "Timestamp": datetime.now().strftime("%H:%M:%S"),
            "Status": result_label,
            "Severity": sev_data['level'],
            "Confidence": f"{confidence:.1f}%"
        })

    except Exception as e:
        st.error(f"Prediction Error: {e}")

# ==============================================================================
# 5. HISTORY & EXPORT
# ==============================================================================
st.divider()
tab_hist, tab_exp = st.tabs(["📜 Assessment History", "📥 Export Data"])

with tab_hist:
    if st.session_state.history:
        st.dataframe(pd.DataFrame(st.session_state.history).iloc[::-1], use_container_width=True)
    else:
        st.info("No assessments logged yet.")

with tab_exp:
    if st.session_state.history:
        csv = pd.DataFrame(st.session_state.history).to_csv(index=False).encode('utf-8')
        st.download_button("Download History (.CSV)", data=csv, file_name="Mental_Health_Log.csv", mime="text/csv")