<div align="center">

# 🧠 MindCare AI — Backend API

**A Smart Mental Health Counselling System powered by Multimodal AI**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.5-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-CPU-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/)
[![SQLite](https://img.shields.io/badge/SQLite-SQLAlchemy-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlalchemy.org/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-NLP_API-6C47FF?style=for-the-badge&logo=openai&logoColor=white)](https://openrouter.ai/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![HuggingFace](https://img.shields.io/badge/HuggingFace-Spaces-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)](https://huggingface.co/spaces)

</div>

---

## 📖 Description

This is the **REST API backend** for the MindCare AI platform — a multimodal mental health counselling system that analyses a user's **facial emotion**, **voice mood**, **behavioural patterns**, and **natural language** to generate a personalised mental wellness assessment and AI-driven counselling experience.

The backend is built with **FastAPI** and deployed as a Docker container on **Hugging Face Spaces**. It exposes endpoints for authentication, ML inference (face, voice, behaviour), real-time AI chat (via OpenRouter), session management, and dashboard analytics.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Web Framework** | FastAPI 0.115.5 + Uvicorn |
| **Database** | SQLite via SQLAlchemy 2.0 |
| **Authentication** | JWT (`python-jose`) + bcrypt + Google OAuth |
| **Face Analysis** | TensorFlow/Keras (`.keras` CNN model) + OpenCV + Pillow |
| **Voice Analysis** | TensorFlow/Keras (`.h5` CNN model) + Librosa + SoundFile + NoiseReduce |
| **Behaviour Analysis** | Scikit-learn (`.pkl` model) + NumPy |
| **NLP / Chat** | OpenRouter API (via `httpx`) + TextBlob + VADER Sentiment |
| **Email / OTP** | `smtplib` + `python-dotenv` |
| **PDF Reports** | ReportLab |
| **Containerisation** | Docker (Python 3.10-slim) |

---

## 📁 Project Structure

```
backend/
│
├── main.py                  # FastAPI app entry point, lifespan, CORS, router registration
├── database.py              # SQLAlchemy engine & session setup
├── models.py                # ORM models (User, ChatSession, PasswordResetOTP, etc.)
├── ml_loader.py             # Loads all ML models at startup into memory
├── ai_service.py            # OpenRouter API integration (chat, streaming, assessment extraction)
├── nlp_service.py           # NLP analysis helpers (TextBlob, VADER, keyword extraction)
├── email_service.py         # OTP email sending via SMTP
├── jwt_handler.py           # JWT token creation & verification
│
├── routers/
│   ├── auth.py              # /auth  — Register, Login, Google OAuth, Forgot Password, OTP
│   ├── behaviour.py         # /behaviour — Questionnaire submission & ML prediction
│   ├── chat.py              # /chat  — AI counselling chat (streaming & non-streaming)
│   ├── face.py              # /face  — Facial emotion analysis from uploaded image
│   ├── voice.py             # /voice — Voice mood analysis from uploaded audio
│   ├── severity.py          # /severity — Severity score calculation & session finalisation
│   └── dashboard.py         # /dashboard — User stats, history, trend data, PDF export
│
├── Pre-trained_Models/      # ⚠️ NOT in Git — must be downloaded separately (see below)
│   ├── face_emotion_model.keras
│   ├── voice_mood_model.h5
│   └── behaviour_model.pkl
│
├── uploads/                 # Temporary storage for uploaded face/voice files
├── requirements.txt         # Python dependencies
├── Dockerfile               # Docker build instructions for HF Spaces deployment
└── .env                     # Local environment variables (never committed to Git)
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Python **3.10 or higher**
- `pip` package manager
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Hashmil-Muhammed/Smart-Mental-Health-Counselling-System-Using-Multimodal-AI.git
cd Smart-Mental-Health-Counselling-System-Using-Multimodal-AI/backend
```

### 2. Create & activate a virtual environment

```bash
# Create the virtual environment
python -m venv venv

# Activate — Windows (PowerShell)
venv\Scripts\Activate.ps1

# Activate — macOS / Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

> **Note:** TensorFlow CPU build is used (`tensorflow-cpu`). If you have a CUDA-capable GPU, replace it with `tensorflow` in `requirements.txt` for better inference performance.

### 4. Configure environment variables

Create a `.env` file inside the `backend/` directory (see [Environment Variables](#-environment-variables) below).

### 5. Place the ML models

Download the pre-trained model files and place them inside `backend/Pre-trained_Models/`  
(see the [Important Note on ML Models](#-important-note-on-ml-models) section).

---

## 🔐 Environment Variables

Create a file named `.env` inside the `backend/` directory with the following variables:

```env
# ── JWT Authentication ─────────────────────────────────────────
SECRET_KEY=your_super_secret_jwt_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# ── Database ───────────────────────────────────────────────────
DATABASE_URL=sqlite:///./mindcare.db

# ── OpenRouter AI API ──────────────────────────────────────────
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_MODEL=openrouter/free

# ── SMTP Email (for OTP delivery) ─────────────────────────────
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password_here
SMTP_FROM_EMAIL=your_email@gmail.com

# ── Google OAuth (optional) ────────────────────────────────────
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

> **For Hugging Face Spaces deployment:** Set all of the above as **Repository Secrets** under  
> `Settings → Variables and Secrets` in your HF Space. Do **not** commit the `.env` file.

---

## 🚀 Running the Server

### Development (with auto-reload)

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production

```bash
uvicorn main:app --host 0.0.0.0 --port 7860 --workers 1
```

Once running, the interactive API docs are available at:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **Health Check:** `http://localhost:8000/health`

---

## 🗺️ API Endpoints Overview

| Prefix | Router File | Description |
|---|---|---|
| `GET /` | `main.py` | Root health ping — returns server status and version |
| `GET /health` | `main.py` | Model load status check (behaviour, face, voice) |
| `/auth` | `routers/auth.py` | Register, Login, Google OAuth, Forgot Password, OTP verify, Reset Password |
| `/behaviour` | `routers/behaviour.py` | Submit behavioural questionnaire answers; returns ML-predicted risk score |
| `/chat` | `routers/chat.py` | Send messages to AI counsellor; stream or non-stream responses; save sessions |
| `/face` | `routers/face.py` | Upload a face image; returns detected emotion label and confidence |
| `/voice` | `routers/voice.py` | Upload an audio clip; returns predicted voice mood label |
| `/severity` | `routers/severity.py` | Calculate final severity score from multimodal inputs; finalise session |
| `/dashboard` | `routers/dashboard.py` | Fetch user stats, session history, trend data; export PDF report |

---

## ⚠️ Important Note on ML Models

> [!CAUTION]
> **The pre-trained model files are NOT included in this repository** due to their large file sizes (often hundreds of MB). The backend **will fail to start** if these files are missing.

You must **manually download** the following files and place them inside the `backend/Pre-trained_Models/` directory before running the server:

```
backend/
└── Pre-trained_Models/
    ├── face_emotion_model.keras   # TensorFlow/Keras CNN — facial emotion classifier
    ├── voice_mood_model.h5        # TensorFlow/Keras CNN — voice mood classifier
    └── behaviour_model.pkl        # Scikit-learn pipeline — behavioural risk predictor
```

The model files are loaded into memory at application startup via `ml_loader.py`. If any model file is missing or corrupt, the server will raise a `FATAL` error and refuse to start. Ensure all three files are present and correctly named before launching.

---

## 🐳 Docker Deployment

A `Dockerfile` is included for containerised deployment (used for Hugging Face Spaces).

```bash
# Build the image
docker build -t mindcare-backend .

# Run the container (pass secrets as env vars)
docker run -p 7860:7860 \
  -e OPENROUTER_API_KEY=sk-or-v1-xxx \
  -e SECRET_KEY=your_secret \
  mindcare-backend
```

---

## 📄 License

This project is developed as part of an academic research initiative. All rights reserved © 2025 MindCare AI.
