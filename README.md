<div align="center">

<img src="https://img.shields.io/badge/MindCare%20AI-Smart%20Mental%20Health%20Counselling-00f5ff?style=for-the-badge&logo=brain&logoColor=white" alt="MindCare AI" />

# 🧠 MindCare AI
### *A Smart Mental Health Counselling System Using Multimodal AI*

[![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite_7-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-FF6F00?style=flat-square&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://smart-mental-health-counselling-sys.vercel.app)
[![Backend on Hugging Face](https://img.shields.io/badge/Backend-Hugging_Face-FFD21E?style=flat-square&logo=huggingface&logoColor=black)](https://hashmil-muahmmed08-mindcare-backend.hf.space/docs)

<br/>

> **MindCare AI** is a full-stack intelligent mental health counselling platform that leverages **four distinct AI modalities** — behavioural data, facial emotion recognition, voice emotion detection, and NLP-driven chat analysis — to deliver a holistic, real-time mental wellness assessment and a personalized therapeutic experience.

<br/>

---

</div>

### 🎥 Project Working Demo

https://github.com/user-attachments/assets/af17f69e-6d1a-4be5-aa71-79579b7e0fb5

<div align="center">
  <em>▶ MINDCARE-AI - Complete Project Walkthrough (Click Play to watch)</em>
</div>

---

## 📋 Table of Contents

- [🌟 Project Overview](#-project-overview)
- [✨ Key Features](#-key-features)
- [🏗️ System Architecture](#️-system-architecture)
- [🤖 AI & Machine Learning Models](#-ai--machine-learning-models)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [⚙️ Project Setup & Machine Learning Resources](#️-project-setup--machine-learning-resources)
- [🚀 Running the Application](#-running-the-application)
- [🔌 API Reference](#-api-reference)
- [🗃️ Database Schema](#️-database-schema)
- [🖥️ Application Screens](#️-application-screens)
- [🔒 Security & Authentication](#-security--authentication)
- [🤝 Contributing](#-contributing)

---

## 🌟 Project Overview

Mental health disorders are a global crisis, yet timely and accurate assessment remains a major challenge. Traditional methods rely on subjective self-reporting, which is insufficient for detecting the true severity of a user's mental state.

**MindCare AI** solves this by combining **four independent AI modalities** into a single, unified platform. Rather than relying on one signal, the system fuses insights from:

1. 📊 **Behavioural Data** — Lifestyle and physiological metrics (sleep, BMI, stress, heart rate, BP)
2. 😐 **Facial Emotion** — Deep learning-based facial expression analysis from a live video feed
3. 🎙️ **Voice Emotion** — Acoustic feature analysis from audio recordings to detect emotional tone
4. 💬 **Chat Text (NLP)** — Conversational AI that extracts mental health indicators from natural language

The results are fused into a **Final Severity Score** (0–100) and a **Risk Level** (Low / Moderate / High / Critical), powering a personalized wellness dashboard with an AI therapist chatbot, daily tasks, mindfulness exercises, and curated video recommendations.

---

## 🌐 Live Demo

The project is fully deployed and accessible online. You can test the multimodal AI features without installing anything locally.

- **Frontend Application (Vercel):** [MindCare AI Web App](https://smart-mental-health-counselling-sys.vercel.app)
- **Backend API & Docs (Hugging Face):** [FastAPI Swagger UI](https://hashmil-muahmmed08-mindcare-backend.hf.space/docs)

*(Note: The backend is hosted on a free Hugging Face Space and may take 1-2 minutes to wake up from sleep upon initial load. The OTP email service is currently in DEMO mode; OTPs are generated and can be viewed in the backend logs or network response).*

---

## ✨ Key Features

### 🧪 Multimodal Assessment Pipeline

| Step | Module | Technology | Output |
|------|--------|------------|--------|
| 1 | Behavioural Test | Scikit-learn (Gradient Boosting) | Risk category + Severity score |
| 2 | Chat Counselling | OpenRouter | Sentiment, triggers, intensity score |
| 3 | Facial Emotion Detection | ResNet (`.keras`) + OpenCV | Dominant emotion + Confidence |
| 4 | Voice Emotion Detection | CNN (`.h5`/`.json`) + Librosa | Voice emotion + Stress level |
| 5 | Final Severity Report | Weighted fusion of all 4 modalities | Risk Level (Low → Critical) |

### 🩺 Personalised Wellness Dashboard

- **Real-Time Severity Gauge** — Animated circular progress bar showing the fused mental health score
- **Risk Level Indicator** — Color-coded badge (🟢 Low / 🟡 Moderate / 🟠 High / 🔴 Critical)
- **Historical Trends** — Area chart showing severity score evolution over time
- **Modality Score Breakdown** — Individual scores for each of the four AI channels
- **Dr. MindCare Chatbot** — An empathetic AI therapist powered by OpenRouter
- **Daily Wellness Tasks** — Personalized, severity-adaptive task checklist
- **Mindfulness Breathing Exercises** — Interactive guided breathing animations
- **YouTube Video Recommendations** — Curated mental health content based on risk profile
- **User Profile Management** — Edit demographic info with occupation/gender dropdowns

### 🔐 Authentication & Access Control

- **JWT-based authentication** with secure token storage
- **Google OAuth 2.0** single sign-on integration
- **3-Step Password Reset** via OTP sent to registered email (SMTP)
- **Route guards** — All assessment and dashboard routes are protected

### 🎨 Premium UI / UX

- **Dark Glassmorphism** design system throughout
- **Framer Motion** cinematic page transitions and micro-animations
- **Three.js/React Three Fiber** WebGL background on the landing page
- **GSAP animations** for scroll-driven reveals
- **Custom animated cursor** across the entire application
- **Responsive** layouts for desktop and large screens

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND  (React + Vite)                     │
│                                                                     │
│  Landing → Login/Register → Assessment Pipeline → Dashboard         │
│      │           │               │                    │             │
│  React.js    Google OAuth    4 Modality Pages    Recharts / FM      │
│  WebGL BG    JWT Tokens      (Behaviour, Chat,   Dr. MindCare Bot   │
│                               Face, Voice)       Daily Tasks        │
└───────────────────────────┬─────────────────────────────────────────┘
                            │  HTTP / REST (Axios)
                            │  Port 5173 → 8000
┌───────────────────────────▼─────────────────────────────────────────┐
│                        BACKEND  (FastAPI + Python)                  │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────┐  ┌─────────┐   │
│  │  /auth   │  │/behaviour│  │  /chat   │  │/face  │  │ /voice  │   │
│  └──────────┘  └──────────┘  └──────────┘  └───────┘  └─────────┘   │
│  ┌──────────┐  ┌──────────────────────────────────────────────────┐ │
│  │/severity │  │              /dashboard                          │ │
│  └──────────┘  └──────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    ML / AI Services Layer                       ││
│  │  ml_loader.py │ ai_service.py │ nlp_service.py │ email_service  ││
│  └─────────────────────────────────────────────────────────────────┘│
└───────────────────────────┬─────────────────────────────────────────┘
                            │
           ┌────────────────┼─────────────────┐
           ▼                ▼                 ▼
    ┌─────────────┐  ┌────────────┐  ┌──────────────────┐
    │  SQLite DB  │  │ Pre-trained│  │  OpenRouter API  │
    │ mindcare.db │  │   Models   │  │  (Gemini LLM)    │
    └─────────────┘  └────────────┘  └──────────────────┘
```

### Data Flow — Assessment Pipeline

```
User Registers/Logs In
        │
        ▼
[Step 1] Behaviour Test  ──► ML Model (Random Forest) ──► Behaviour Severity Score
        │
        ▼
[Step 2] Chat Counselling ──► LLM + NLP Analysis ──────► Chat Severity Score
        │
        ▼
[Step 3] Facial Emotion  ──► ResNet Deep Learning ─────► Face Severity Score
        │
        ▼
[Step 4] Voice Analysis  ──► CNN + Librosa ─────────────► Voice Severity Score
        │
        ▼
[Step 5] Final Severity  ──► Weighted Fusion Algorithm ─► Risk Level + Dashboard
```

---

## 🤖 AI & Machine Learning Models

### Step 1 — Behavioural Analysis (`Best_Mental_Behaviour_Model.pkl`)
- **Type:** Scikit-learn ensemble classifier (Gradient Boosting)
- **Input Features:** BMI category, sleep hours, sleep quality, physical activity level, stress level, heart rate, daily steps, systolic BP, diastolic BP
- **Output:** Risk category (`Low` / `Moderate` / `High`) + confidence score + severity integer (0–100)
- **Encoders:** `Model_Encoders.pkl` — handles label encoding and one-hot encoding for categorical inputs

### Step 3 — Facial Emotion Detection (`Resnet_model_version_2.keras`)
- **Type:** Fine-tuned ResNet Convolutional Neural Network (~303 MB)
- **Input:** Video frames captured via the user's webcam, preprocessed with OpenCV
- **Output:** Dominant facial emotion (e.g., `Sad`, `Angry`, `Neutral`, `Happy`, `Fear`, `Disgust`, `Surprise`) with per-class confidence scores
- **Severity Mapping:** Emotions are mapped to a severity integer; negative valence emotions score higher

### Step 4 — Voice Emotion Detection (`CNN_model.json` + `CNN_model.weights.h5`)
- **Type:** Custom 1D/2D CNN trained on acoustic features
- **Feature Extraction:** Librosa extracts MFCCs, chroma, spectral contrast, and mel-spectrogram features
- **Preprocessing:** `scaler2.pickle` (StandardScaler) + `encoder2.pickle` (LabelEncoder)
- **Output:** Voice emotion label + voice stress (`Normal` / `Stressed` / `Highly Stressed`) + voice mood + severity score

### Step 2 — Chat NLP Analysis (`nlp_service.py`)
- **Sentiment Analysis:** VADER (`vaderSentiment`) for rapid valence scoring + TextBlob for subjectivity
- **LLM Integration:** OpenRouter API (Gemini model) for structured mental health Q&A
- **Extracted Signals:** Problem description, duration, triggers, emotions, physical symptoms, coping strategy, support availability, daily life impact, intensity score
- **Risk Flagging:** Automatic High/Critical flag for detected crisis indicators

### Final Severity Fusion (`severity.py`)
- Combines all four modality scores using a **weighted average** algorithm
- Calculates overall risk level: `Low (0–30)` / `Moderate (31–55)` / `High (56–79)` / `Critical (80–100)`
- Generates a natural language summary note for the dashboard

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | Core UI framework |
| Vite | 7.x | Build tool & dev server |
| Tailwind CSS | 4.x | Utility-first styling |
| Framer Motion | 12.x | Page transitions & animations |
| React Router DOM | 7.x | Client-side routing |
| Recharts | 3.x | Dashboard data visualization |
| Three.js / R3F | 0.183 / 9.x | WebGL 3D landing page background |
| GSAP | 3.x | Scroll-triggered animations |
| Lucide React | 0.575 | Icon library |
| React Hot Toast | 2.x | Notification system |
| Axios | 1.x | HTTP client |
| `@react-oauth/google` | 0.13 | Google OAuth 2.0 |
| `react-circular-progressbar` | 2.x | Severity gauge widget |
| `@vladmandic/face-api` | 1.7 | Client-side face detection helper |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| FastAPI | 0.115 | REST API framework |
| Uvicorn | 0.32 | ASGI server |
| SQLAlchemy | 2.0 | ORM & database abstraction |
| SQLite | — | Lightweight local database |
| TensorFlow / Keras | ≥2.15 | Deep learning inference (Face & Voice) |
| Scikit-learn | 1.6 | ML model inference (Behaviour) |
| Librosa | 0.10 | Audio feature extraction |
| OpenCV Headless | 4.10 | Video frame processing |
| VADER Sentiment | 3.3 | NLP sentiment analysis |
| TextBlob | 0.18 | NLP subjectivity analysis |
| Passlib + Bcrypt | 1.7 / 4.2 | Password hashing |
| python-jose | 3.3 | JWT token generation & validation |
| python-dotenv | 1.0 | Environment variable management |
| ReportLab | 4.2 | PDF generation |
| Soundfile + Noisereduce | 0.12 / 3.0 | Audio preprocessing |
| httpx | 0.27 | Async HTTP client (OpenRouter API) |

### Deployment & Infrastructure
| Technology | Purpose |
|------------|---------|
| Vercel | Frontend hosting & CI/CD pipeline |
| Hugging Face Spaces | Backend hosting (Dockerized FastAPI) |
| Docker | Containerization for ML backend environment |
| Git & GitHub | Version control and source code management |

---

## 📁 Project Structure

```
MindCare-AI/
│
├── backend/                        # FastAPI Python Backend
│   ├── main.py                     # App entry point, CORS, lifespan
│   ├── database.py                 # SQLAlchemy engine & session
│   ├── models.py                   # All ORM table definitions
│   ├── ml_loader.py                # Model loading at startup
│   ├── ai_service.py               # OpenRouter/Gemini LLM service
│   ├── nlp_service.py              # NLP analysis (VADER + TextBlob)
│   ├── jwt_handler.py              # JWT encode/decode utilities
│   ├── email_service.py            # SMTP OTP email sender
│   ├── requirements.txt            # Python dependencies
│   ├── mindcare.db                 # SQLite database file
│   ├── routers/
│   │   ├── auth.py                 # Register, login, Google OAuth, OTP reset
│   │   ├── behaviour.py            # Behaviour test submission & history
│   │   ├── chat.py                 # Chat counselling & NLP analysis
│   │   ├── face.py                 # Facial emotion video upload & inference
│   │   ├── voice.py                # Voice audio upload & inference
│   │   ├── severity.py             # Final severity fusion & report
│   │   └── dashboard.py            # Dashboard data, tasks, Dr. MindCare chat
│   ├── Pre-trained_Models/         # ← Place downloaded models here
│   │   ├── Step1_Behaviour/
│   │   │   ├── Best_Mental_Behaviour_Model.pkl
│   │   │   └── Model_Encoders.pkl
│   │   ├── Step3_Face/
│   │   │   └── Resnet_model_version_2.keras
│   │   └── Step4_Voice/
│   │       ├── CNN_model.json
│   │       ├── CNN_model.weights.h5
│   │       ├── encoder2.pickle
│   │       └── scaler2.pickle
│   └── uploads/                    # Uploaded audio/video files
│
├── frontend/                       # React + Vite Frontend
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── App.jsx                 # Root router with protected routes
│       ├── main.jsx                # React DOM entry point
│       ├── index.css               # Global styles & design tokens
│       ├── api.js                  # Axios base URL configuration
│       ├── contexts/
│       │   └── AuthContext.jsx     # JWT auth state management
│       ├── components/
│       │   ├── Particles.jsx       # Animated particle backdrop
│       │   ├── CustomCursor.jsx    # Custom cursor effect
│       │   └── CinematicTransition.jsx  # Page transition wrapper
│       ├── hooks/                  # Custom React hooks
│       ├── services/               # API service functions
│       └── pages/
│           ├── Landing.jsx         # Hero page (Three.js WebGL)
│           ├── Login.jsx           # JWT + Google OAuth login
│           ├── Register.jsx        # Multi-step registration
│           ├── ForgotPassword.jsx  # 3-step OTP password reset
│           ├── BehaviourTest.jsx   # Step 1: Lifestyle questionnaire
│           ├── ChatCounselling.jsx # Step 2: AI chat assessment
│           ├── FaceEmotion.jsx     # Step 3: Webcam facial analysis
│           ├── VoiceAnalysis.jsx   # Step 4: Microphone voice analysis
│           ├── FinalSeverity.jsx   # Fusion report & severity score
│           └── Dashboard.jsx       # Main wellness dashboard
│
├── model_training/                 # ← Place downloaded training resources here
│   ├── (Jupyter notebooks for each modality)
│   └── (Training datasets)
│
├── run_backend.bat                 # One-click backend launcher (Windows)
├── run_frontend.bat                # One-click frontend launcher (Windows)
├── .gitignore
└── README.md
```

---

## ⚙️ Project Setup & Machine Learning Resources

Due to GitHub's file size limits, the large pre-trained multimodal models and the training datasets/scripts are hosted externally on Google Drive. To fully run or explore this project, please download the resource file below:

📥 **[Download MindCare Resources (Models & Training Data)](https://drive.google.com/file/d/1DdFOl4IC7EVLnwpmbJZWrMve3frvxyzX/view?usp=sharing)**

### How to Setup the Downloaded Resources:
Once you download and extract `MindCare_Resources.zip`, you will find two folders inside. Please place them as instructed below:

1. **`Pre-trained_Models/`**: Move this entire folder directly inside the `backend/` directory of this project. (These are the `.keras`, `.h5`, and `.pkl` files required for the FastAPI backend to run).
2. **`model_training/`**: Move this folder to the root directory of the project. (This contains the Jupyter notebooks, scripts, and datasets used to train the multimodal AI models).

---

## 🚀 Running the Application

### Prerequisites

- **Python** 3.10 or higher
- **Node.js** 18 or higher (with npm)
- **Git**
- A webcam and microphone (required for Face & Voice analysis modules)

### 1. Clone the Repository

```bash
git clone https://github.com/Hashmil-Muhammed/Smart-Mental-Health-Counselling-System-Using-Multimodal-AI.git
cd Smart-Mental-Health-Counselling-System-Using-Multimodal-AI
```

### 2. Download & Place ML Resources

Follow the [instructions above](#️-project-setup--machine-learning-resources) to download and correctly place the `Pre-trained_Models/` folder inside `backend/`.

### 3. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install all Python dependencies
pip install -r requirements.txt
```

**Configure Backend Environment Variables:**

Create a `.env` file inside the `backend/` directory:

```env
SECRET_KEY=your_super_secret_jwt_key_here
DATABASE_URL=sqlite:///./mindcare.db
OPENROUTER_API_KEY=your_openrouter_api_key_here
SMTP_EMAIL=your_gmail_address@gmail.com
SMTP_PASSWORD=your_gmail_app_password
GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

**Start the Backend Server:**

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be live at `http://localhost:8000`
Interactive API docs available at `http://localhost:8000/docs`

### 4. Frontend Setup

```bash
cd frontend

# Install Node.js dependencies
npm install
```

**Configure Frontend Environment Variables:**

Create a `.env` file inside the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

**Start the Frontend Dev Server:**

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 5. Quick Launch (Windows)

For convenience, use the provided batch scripts from the project root:

```bash
# Terminal 1 — Start Backend
run_backend.bat

# Terminal 2 — Start Frontend
run_frontend.bat
```

---

## 🔌 API Reference

The FastAPI backend automatically generates interactive documentation. Once the server is running, visit:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

### Core Endpoint Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/register` | Register a new user account | ❌ |
| `POST` | `/auth/login` | Login with email/password → JWT | ❌ |
| `POST` | `/auth/google` | Login with Google OAuth | ❌ |
| `POST` | `/auth/forgot-password` | Request OTP for password reset | ❌ |
| `POST` | `/auth/verify-otp` | Verify OTP code | ❌ |
| `POST` | `/auth/reset-password` | Set new password | ❌ |
| `POST` | `/behaviour/submit` | Submit behavioural assessment | ✅ |
| `GET` | `/behaviour/history` | Get past behaviour results | ✅ |
| `POST` | `/chat/send` | Send message to AI counsellor | ✅ |
| `GET` | `/chat/history` | Retrieve chat message history | ✅ |
| `POST` | `/face/analyze` | Upload video → facial emotion | ✅ |
| `POST` | `/voice/analyze` | Upload audio → voice emotion | ✅ |
| `GET` | `/severity/final` | Get fused final severity report | ✅ |
| `GET` | `/dashboard/summary` | Full dashboard data payload | ✅ |
| `GET` | `/dashboard/tasks` | Get daily wellness tasks | ✅ |
| `POST` | `/dashboard/tasks/complete` | Mark a task as completed | ✅ |
| `POST` | `/dashboard/doctor-chat` | Chat with Dr. MindCare bot | ✅ |
| `GET` | `/health` | Backend & model health check | ❌ |

> ✅ = Requires `Authorization: Bearer <token>` header

---

## 🗃️ Database Schema

The SQLite database (`mindcare.db`) is managed by SQLAlchemy and contains the following tables:

| Table | Description |
|-------|-------------|
| `register_database` | User profiles (name, age, gender, occupation, email, Google ID) |
| `behaviour_results` | Behavioural test submissions with ML predictions |
| `chat_messages` | Raw chat counselling message history |
| `chat_analysis` | Structured NLP analysis results from counselling sessions |
| `face_results` | Facial emotion detection results with emotion distribution |
| `voice_results` | Voice emotion results with stress and mood labels |
| `final_severity_results` | Fused severity scores and risk level per session |
| `emergency_events` | High-severity / crisis trigger event log |
| `suggestions` | Personalized recommendations stored per severity level |
| `daily_tasks` | Daily wellness task list with completion tracking |
| `doctor_chat_messages` | Dr. MindCare AI therapist conversation history |
| `password_reset_otps` | Time-limited OTP records for password reset flow |

---

## 🖥️ Application Screens

| Screen | Route | Description |
|--------|-------|-------------|
| **Landing Page** | `/` | Hero page with Three.js WebGL background, GSAP scroll animations, and feature showcase |
| **Login** | `/login` | JWT + Google OAuth sign-in with glassmorphic card |
| **Register** | `/register` | Multi-step registration with profile details |
| **Forgot Password** | `/forgot-password` | 3-step OTP-based password reset via email |
| **Behaviour Test** | `/behaviour` | Lifestyle questionnaire form → ML prediction |
| **Chat Counselling** | `/chat` | NLP-powered AI chat assessment session |
| **Facial Emotion** | `/face` | Live webcam capture → ResNet emotion analysis |
| **Voice Analysis** | `/voice` | Microphone recording → CNN emotion analysis |
| **Final Severity** | `/severity` | Fused multimodal report with risk level |
| **Dashboard** | `/dashboard` | Main wellness hub with charts, tasks, Dr. MindCare, and video recommendations |

---

Here is a glimpse of the MindCare AI platform in action:

| Landing Page |
| :---: |
| <img src="assets/1_landing.png" alt="Landing Page" width="925"/> |

| Register Account | Login |
| :---: | :---: |
| <img src="assets/3_register.png" alt="Register" width="450"/> | <img src="assets/2_login.png" alt="Login" width="450"/> |

| Behaviour Test Input | Behaviour Test Result |
| :---: | :---: |
| <img src="assets/4_behaviour-input.png" alt="Behaviour Input" width="450"/> | <img src="assets/5_behaviour-result.png" alt="Behaviour Result" width="450"/> |

| AI Chat Counselling | Chat Summary |
| :---: | :---: |
| <img src="assets/6_chat-counselling.png" alt="Chat Counselling" width="450"/> | <img src="assets/7_chat-summary.png" alt="Chat Summary" width="450"/> |

| Face Emotion (Recording) | Face Emotion (Result) |
| :---: | :---: |
| <img src="assets/8_face-emotion-record.png" alt="Face Recording" width="450"/> | <img src="assets/9_face-emotion-result.png" alt="Face Result" width="450"/> |

| Voice Stress (Recording) | Voice Stress (Result) |
| :---: | :---: |
| <img src="assets/10_voice-record.png" alt="Voice Recording" width="450"/> | <img src="assets/11_voice-result.png" alt="Voice Result" width="450"/> |

| Final Assessment Report | Main Dashboard |
| :---: | :---: |
| <img src="assets/12_final-report.png" alt="Final Report" width="450"/> |  <img src="assets/13_dashboard.png" alt="Main Dashboard" width="450"/> |

---

## 🔒 Security & Authentication

- **Password Hashing:** Bcrypt via `passlib` — passwords are never stored in plaintext
- **JWT Tokens:** Signed with `python-jose`, validated on every protected route
- **Google OAuth 2.0:** Token verified server-side using Google's public key infrastructure
- **OTP Expiry:** Password reset OTPs are time-limited and invalidated after use
- **CORS:** Configured to allow only specified frontend origins
- **Environment Variables:** All secrets (API keys, SMTP credentials, JWT secret) are stored in `.env` files — never committed to version control

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature-name`
3. **Commit** your changes: `git commit -m 'feat: add some feature'`
4. **Push** to the branch: `git push origin feature/your-feature-name`
5. **Open** a Pull Request

Please ensure your code follows the existing project structure and styling conventions.

---

<div align="center">

**Built with ❤️ for better mental wellness**

*MindCare AI — Because your mind matters.*

</div>
