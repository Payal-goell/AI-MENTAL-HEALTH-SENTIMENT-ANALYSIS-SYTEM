import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import BehaviourTest from './pages/BehaviourTest'
import ChatCounselling from './pages/ChatCounselling'
import FaceEmotion from './pages/FaceEmotion'
import VoiceAnalysis from './pages/VoiceAnalysis'
import FinalSeverity from './pages/FinalSeverity'
import Dashboard from './pages/Dashboard'
import Particles from './components/Particles'
import CustomCursor from './components/CustomCursor'
import CinematicTransition from './components/CinematicTransition'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

/* Separate component so useLocation hook works inside BrowserRouter */
function AppRoutes() {
  const location = useLocation()
  const isLanding = location.pathname === '/'

  return (
    <div className="relative min-h-screen">
      {/* Particle backdrop only on inner pages (Landing has its own WebGL bg) */}
      {!isLanding && <Particles />}

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={
              <CinematicTransition><Landing /></CinematicTransition>
            } />
            <Route path="/login" element={
              <CinematicTransition><Login /></CinematicTransition>
            } />
            <Route path="/register" element={
              <CinematicTransition><Register /></CinematicTransition>
            } />
            <Route path="/forgot-password" element={
              <CinematicTransition><ForgotPassword /></CinematicTransition>
            } />
            <Route path="/behaviour" element={
              <ProtectedRoute><CinematicTransition><BehaviourTest /></CinematicTransition></ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute><CinematicTransition><ChatCounselling /></CinematicTransition></ProtectedRoute>
            } />
            <Route path="/face" element={
              <ProtectedRoute><CinematicTransition><FaceEmotion /></CinematicTransition></ProtectedRoute>
            } />
            <Route path="/voice" element={
              <ProtectedRoute><CinematicTransition><VoiceAnalysis /></CinematicTransition></ProtectedRoute>
            } />
            <Route path="/severity" element={
              <ProtectedRoute><CinematicTransition><FinalSeverity /></CinematicTransition></ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute><CinematicTransition><Dashboard /></CinematicTransition></ProtectedRoute>
            } />
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <BrowserRouter>
          {/* Custom cursor — rendered above everything */}
          <CustomCursor />

          <AppRoutes />

          <Toaster position="top-right"
            containerStyle={{ top: 40, right: 40 }}
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(15,23,42,0.95)',
                color: '#e2e8f0',
                border: '1px solid rgba(0,245,255,0.2)',
                backdropFilter: 'blur(12px)',
                padding: '16px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500'
              }
            }} />
        </BrowserRouter>
      </GoogleOAuthProvider>
    </AuthProvider>
  )
}

export default App
