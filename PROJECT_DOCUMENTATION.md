# PROJECT DOCUMENTATION
## Smart Mental Health Counselling System Using Multimodal AI

This document provides a comprehensive, end-to-end architectural and technical analysis of the MindCare AI platform. It covers the frontend React architecture, backend FastAPI structure, and the integration of multimodal machine learning models for holistic mental wellness assessment.

---

## 1. Executive Summary

MindCare AI is a Next-Generation Multimodal Mental Health System. It aggregates data from four distinct modalities—Behavioural Profiling, AI Chat Counselling, Facial Emotion Recognition, and Voice Stress Analysis—to generate a unified severity score map of a user's emotional state. The project emphasizes advanced UI/UX (Active Theory design elements like glassmorphism and smooth animations) coupled with robust, real-time backend ML inference.

---

## 2. Frontend Architecture

The frontend is a Single Page Application (SPA) built for high performance and immersive user experience.

### 2.1 Technology Stack & UI/UX Design System
- **Framework:** React 18 built with Vite for optimal HMR and fast build times.
- **Styling:** Tailwind CSS integrated with customized utility classes to support the "Active Theory" aesthetic.
- **Animations:** Framer Motion (`framer-motion`) heavily utilized for page transitions, glowing pulses, floating badges, and 3D-like depth effects.
- **Data Visualization:** `recharts` for dynamic data rendering (Radial Bars, Area Charts).
- **Design Philosophy:** Dark glassmorphism, deep radial gradients, high-contrast modern typography, and contextual micro-animations to reduce cognitive load while discussing sensitive mental health topics.

### 2.2 Routing & State Management
- **Routing:** `react-router-dom` manages distinct URL paths for each assessment step (`/behaviour`, `/chat`, `/face`, `/voice`, `/final-severity`, `/dashboard`).
- **State Management:** Extensive use of React Hooks (`useState`, `useEffect`, `useRef`). Session integrity and assessment flow are maintained locally and synchronized incrementally with backend endpoints. The `Dashboard.jsx` acts as the single source of truth for the aggregated state post-assessment.

---

## 3. Core Assessment Modules & Data Flow

The assessment strictly follows a sequential multimodal pipeline, aggregating clinical, conversational, physiological, and acoustic data.

### 3.1 Behavioural Assessment (`BehaviourTest.jsx`)
- **Functionality:** A stepped wizard interface collecting critical baseline health data (sleep quality, physical activity, heart rate, BMI, stress levels).
- **Backend Sync:** Submits a JSON payload to `POST /api/behaviour/submit`.
- **ML Processing:** The backend routes this to a Scikit-Learn based pre-trained model (accessed via `ml_loader.predict_behaviour`), mapping outputs to Low/Medium/High risk categories and extracting a baseline severity score (1-10 scale).

### 3.2 AI Chat Counselling (`ChatCounselling.jsx`)
- **Functionality:** A natural, conversational interface using an empathetic AI Persona ("MindCare AI").
- **Backend Sync:** Streams messages using Server-Sent Events (SSE) via `POST /api/chat`.
- **AI Processing:** 
  - Iteratively builds a psychological profile using a sliding context window. 
  - Secretly extracts 11 critical clinical parameters (e.g., core problem, duration, physical symptoms, triggers) via JSON-forced LLM extraction (`ai_service.extract_assessment_data`).
  - Implements an implicit risk-detection engine (e.g., suicide triggers) to immediately intercept the conversation and trigger emergency protocols.

### 3.3 Facial Emotion Analysis (`FaceEmotion.jsx`)
- **Functionality:** Real-time webcam feed with live bounding boxes. Uses client-side `face-api.js` for immediate visual feedback (floating emojis based on highest confidence).
- **Data Pipeline:** Records a WebM video clip and tallies frame-by-frame live emotion counts. uploads via `POST /face/analyse` along with the `live_counts` JSON.
- **Backend Processing:** Validates the payload and securely associates the dominant facial emotion (e.g., Neutral, Sad, Disgust) to the session's multimodal footprint, mapping it to a severity integer.

### 3.4 Voice Stress Analysis (`VoiceAnalysis.jsx`)
- **Functionality:** Employs the Web Audio API for a live, responsive waveform visualizer.
- **Data Pipeline:** Standardizes browser-captured audio by utilizing a custom `encodeWAV` function (converting float32 arrays and adding standard WAV headers). Uploads via `POST /voice/analyse`.
- **ML Processing:** The backend extracts MFCC, Zero Crossing Rate (ZCR), and Root Mean Square Energy (RMSE) features via `librosa`. These features accurately match the shape expected by a pre-trained 1D Convolutional Neural Network (CNN). Returns the exact voice mood and voice stress (Low, Medium, High).

### 3.5 Final Aggregation (`FinalSeverity.jsx`)
- **Functionality:** The convergence point of the multimodal assessment.
- **Backend Sync:** Connects to `GET /final-severity`. 
- **Business Logic:** Averages the severity scores derived from:
  1. Behaviour Score
  2. Chat Severity Score
  3. Face Emotion mapped severity
  4. Voice mapped severity
- **Emergency Protocol:** If the Final Severity is $\ge 8$ AND an explicit Risk Flag was captured during the NLP chat process, an unstoppable modal freezes the application and forces the user to acknowledge emergency clinical contacts (e.g., KIRAN helpline) before allowing navigation to the Dashboard.

### 3.6 User Dashboard (`Dashboard.jsx`)
- **Functionality:** A premium Bento-box grid displaying real-time aggregated metrics.
- **Features:** 
  - **Historical Trends:** Line/Area charts showing severity drops/spikes over time.
  - **Daily Habits:** A gamified tracker integrated with `POST /toggle-task`.
  - **Dr. MindCare Bot:** A secondary fallback conversational agent strictly for post-assessment daily check-ins.
- **AI Driven Smart Suggestions:** Fetches personalized quotes, breathing exercises, and lifestyle tips dependent heavily on their immediate final severity bracket via `GET /smart-suggestions`.

---

## 4. Backend & AI Architecture

The backend operates as a robust asynchronous API bridging the React frontend, database records, and ML inference engines.

### 4.1 FastAPI Implementation (`main.py`)
- Python FastAPI handles all RESTful requests concurrently. 
- Integrated CORS middleware seamlessly supports React local development (Vite `localhost:5173`).
- **Lifespan Management:** Caches and loads all large ML models inside the app `lifespan` manager into memory on server boot to ensure $O(1)$ low-latency inference for all incoming API requests.

### 4.2 Machine Learning Infrastructure (`ml_loader.py`)
Provides deterministic fallback loading for global model variables:
1. **Behaviour (Scikit-Learn):** Uses custom `LabelEncoder` mappings and constructs a specific 12-feature array for Random Forest/XGBoost classification.
2. **Face (TensorFlow/Keras):** Loads a `Resnet_model_version_2.keras` architecture.
3. **Voice (TensorFlow/Keras):** Loads a 1D CNN via JSON blueprint + `.weights.h5` specifically scaled using a pre-saved Standard Scaler pipeline `scaler2.pickle`.

### 4.3 AI & NLP engine (`ai_service.py` & `nlp_service.py`)
- **OpenRouter Integration:** Proxies LLM generation to cost-effective global models with built-in retry mechanisms, rate limit handling (429/402 responses), and stream generators.
- **Prompt Engineering:** Extensive system prompts bound strictly to clinical intake rules:
  - Forcing the bot to ask nested dual-questions to extract the 11 key fields quickly.
  - Strictly banning the usage of "on a scale of 1-10" to maintain human empathy.
- **Risk Mitigation Regex:** Utilizes both LLM inference AND hardcoded Regex checks for self-harm keywords to act as a fail-safe.

---

## 5. Deployment & Scalability Considerations
- **Stateless ML endpoints:** ML inferences are performed on isolated tensors/arrays making the FastApi nodes easily horizontally scalable.
- **Database:** Uses SQLite initially (`mindcare.db`) but SQLAlchemy ORM enables a trivial 1-line configuration swap to PostgreSQL for production scaling.
- **Static File Serving:** Video and Audio blobs are saved natively to the `uploads/` directory to prevent database bloat, served directly via a statically mounted FastAPI route.

---
**End of Document**
