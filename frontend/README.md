<div align="center">

# 🧠 MindCare AI — Frontend Application

**A Smart Mental Health Counselling System powered by Multimodal AI**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-000000?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-EF0086?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![GSAP](https://img.shields.io/badge/GSAP-3-88CE02?style=for-the-badge&logo=greensock&logoColor=white)](https://gsap.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

</div>

---

## 📖 Description

This is the **React Single Page Application (SPA)** frontend for the MindCare AI platform — a multimodal mental health counselling system. It guides users through a fully animated assessment journey covering **behavioural questionnaires**, **facial emotion detection**, **voice mood analysis**, and **AI-powered counselling chat** to produce a personalised mental wellness report.

The application features a premium **glassmorphism dark UI**, a **WebGL particle background** on the landing page (Three.js + React Three Fiber), **cinematic page transitions** (Framer Motion + GSAP), and connects to a **FastAPI backend** hosted on Hugging Face Spaces.

---

## 🛠️ Frontend Tech Stack

| Category | Technology |
|---|---|
| **UI Framework** | React 19 + React DOM |
| **Build Tool** | Vite 7 |
| **Styling** | Tailwind CSS v4 (glassmorphism dark theme) |
| **3D / WebGL** | Three.js + React Three Fiber + React Three Drei |
| **Animations** | Framer Motion 12 + GSAP 3 + @gsap/react |
| **Routing** | React Router DOM v7 |
| **HTTP Client** | Axios |
| **Authentication** | `@react-oauth/google` (Google OAuth 2.0) + JWT |
| **Charts & Analytics** | Recharts |
| **Icons** | Lucide React + React Icons |
| **Face Detection** | `@vladmandic/face-api` (client-side, in-browser) |
| **Notifications** | React Hot Toast |
| **Progress UI** | React Circular Progressbar |

---

## 📁 Project Structure

```
frontend/
│
├── public/                        # Static assets served at root
├── src/
│   │
│   ├── main.jsx                   # React app entry point
│   ├── App.jsx                    # Root component — BrowserRouter, all routes, providers
│   ├── App.css                    # Root-level global styles
│   ├── index.css                  # Tailwind base, custom CSS variables, glassmorphism utilities
│   │
│   ├── pages/                     # Full-page route components
│   │   ├── Landing.jsx            # Hero landing page — Three.js WebGL background, GSAP scroll animations
│   │   ├── Login.jsx              # Login form — email/password + Google OAuth
│   │   ├── Register.jsx           # Multi-field registration with validation
│   │   ├── ForgotPassword.jsx     # 3-step OTP password reset flow
│   │   ├── BehaviourTest.jsx      # Multi-step behavioural questionnaire
│   │   ├── ChatCounselling.jsx    # Real-time AI counsellor chat (streaming)
│   │   ├── FaceEmotion.jsx        # Webcam/upload facial emotion analysis
│   │   ├── VoiceAnalysis.jsx      # Audio recording/upload voice mood analysis
│   │   ├── FinalSeverity.jsx      # Multimodal severity score results & suggestions
│   │   └── Dashboard.jsx          # User analytics dashboard — charts, history, PDF export
│   │
│   ├── components/                # Reusable UI components
│   │   ├── AnimatedBackground.jsx # Reusable animated gradient background
│   │   ├── CinematicTransition.jsx# Page entry/exit transition wrapper (Framer Motion)
│   │   ├── CustomCursor.jsx       # Custom animated cursor with magnetic hover effect
│   │   ├── GlitchText.jsx         # Glitch text animation effect component
│   │   ├── PageTransition.jsx     # Lightweight fade transition wrapper
│   │   ├── Particles.jsx          # Lightweight CSS particle backdrop for inner pages
│   │   └── StepProgress.jsx       # Animated step progress indicator for multi-step flows
│   │
│   ├── contexts/
│   │   └── AuthContext.jsx        # Global authentication state (JWT token, user object)
│   │
│   ├── services/
│   │   └── api.js                 # Axios instance — hardcoded HF Space baseURL, JWT interceptor
│   │
│   ├── hooks/
│   │   └── useScrollTimeline.js   # Custom GSAP scroll-triggered animation hook
│   │
│   └── api.js                     # Legacy Axios instance (kept for compatibility)
│
├── .env                           # Local environment variables (never committed)
├── .env.example                   # Environment variable template
├── vercel.json                    # Vercel SPA routing config (rewrites all paths to index.html)
├── vite.config.js                 # Vite build configuration
├── tailwind.config.js             # Tailwind v4 configuration
└── package.json                   # NPM dependencies and scripts
```

---

## ⚙️ Setup & Installation

### Prerequisites
- **Node.js** v18 or higher
- **npm** v9 or higher

### 1. Clone the repository

```bash
git clone https://github.com/Hashmil-Muhammed/Smart-Mental-Health-Counselling-System-Using-Multimodal-AI.git
cd Smart-Mental-Health-Counselling-System-Using-Multimodal-AI/frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the `frontend/` directory (see [Environment Variables](#-environment-variables) below).

### 4. Start the development server

```bash
npm run dev
```

The app will be available at **`http://localhost:5173`** with hot module replacement (HMR) enabled.

### Other available scripts

```bash
npm run build      # Production build → outputs to dist/
npm run preview    # Preview the production build locally
npm run lint       # Run ESLint across all source files
```

---

## 🔐 Environment Variables

Create a `.env` file inside the `frontend/` directory with the following variables:

```env
# ── Backend API ────────────────────────────────────────────────
# Base URL of the FastAPI backend (Hugging Face Spaces)
VITE_API_BASE_URL=https://hashmil-muahmmed08-mindcare-backend.hf.space

# ── Google OAuth ───────────────────────────────────────────────
# Google Client ID from Google Cloud Console
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

> **Note:** All Vite environment variables **must** be prefixed with `VITE_` to be accessible in the browser bundle via `import.meta.env`.

> **For Vercel deployment:** Set these variables under  
> `Vercel Dashboard → Project → Settings → Environment Variables`.

---

## 🗺️ Routing & Pages

All routes are defined in `src/App.jsx` and wrapped with **Framer Motion** cinematic transitions. Protected routes redirect unauthenticated users to `/login`.

| Route | Page Component | Auth Required | Description |
|---|---|---|---|
| `/` | `Landing.jsx` | ❌ | Hero landing — WebGL background, animated sections, feature showcase |
| `/login` | `Login.jsx` | ❌ | Email/password login + Google OAuth one-tap |
| `/register` | `Register.jsx` | ❌ | Full registration form with real-time validation |
| `/forgot-password` | `ForgotPassword.jsx` | ❌ | 3-step flow: email → OTP verify → new password |
| `/behaviour` | `BehaviourTest.jsx` | ✅ | Multi-step psychological behaviour questionnaire |
| `/chat` | `ChatCounselling.jsx` | ✅ | Live AI counselling chat with streaming responses |
| `/face` | `FaceEmotion.jsx` | ✅ | Webcam capture or image upload for emotion detection |
| `/voice` | `VoiceAnalysis.jsx` | ✅ | Microphone recording or audio upload for mood analysis |
| `/severity` | `FinalSeverity.jsx` | ✅ | Final multimodal severity score, AI suggestions, session summary |
| `/dashboard` | `Dashboard.jsx` | ✅ | Personal analytics — charts, session history, PDF report export |

---

## 🚀 Deployment

This frontend is optimised for deployment on **[Vercel](https://vercel.com/)**.

### SPA Routing Fix

Since this is a client-side SPA using React Router, a `vercel.json` is included at the root of the `frontend/` directory to rewrite all URL paths back to `index.html`, preventing 404 errors on page refresh or direct URL access:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Deploy to Vercel

```bash
# Option 1 — via Vercel CLI
npm install -g vercel
vercel --prod

# Option 2 — Connect your GitHub repository to Vercel
# Set the Root Directory to: frontend/
# Framework Preset: Vite
# Build Command: npm run build
# Output Directory: dist
```

> **Important:** Set all required environment variables in the Vercel dashboard before deploying. The backend URL is currently **hardcoded** in `src/services/api.js` as a production fallback — update this to use `VITE_API_BASE_URL` once the backend URL is stable.

---

## 🎨 Design System

The UI is built on a **dark glassmorphism** design language with the following core principles:

- **Colour Palette:** Deep navy (`#05110d`) base, emerald accent (`#00ff88`), cyan highlights (`#00f5ff`)
- **Glass Cards:** `backdrop-filter: blur()` with semi-transparent backgrounds and coloured border glows
- **Typography:** System font stack with consistent weight hierarchy
- **Motion:** Every page entry/exit is a cinematic fade-slide transition; micro-animations on all interactive elements
- **WebGL Landing:** Three.js particle field rendered via React Three Fiber with GSAP scroll-driven camera animations

---

## 📄 License

This project is developed as part of an academic research initiative. All rights reserved © 2025 MindCare AI.
