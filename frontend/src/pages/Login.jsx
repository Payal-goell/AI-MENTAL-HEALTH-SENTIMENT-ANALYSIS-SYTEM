import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { Eye, EyeOff, Brain, Mail, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import API from '../api'
import toast from 'react-hot-toast'


export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' })
    const [showPwd, setShowPwd] = useState(false)
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const nav = useNavigate()

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const { data } = await API.post('/auth/google-login', { token: tokenResponse.access_token || tokenResponse.credential })
                login(data.user, data.access_token)
                toast.success(`Welcome back, ${data.user.full_name}! 🧠`)

                // Conditional Routing
                try {
                    const dashRes = await API.get('/dashboard-data');
                    if (dashRes.data && dashRes.data.severity && dashRes.data.severity.final_severity) {
                        nav('/dashboard');
                    } else {
                        nav('/behaviour');
                    }
                } catch {
                    nav('/behaviour');
                }
            } catch (err) {
                toast.error('Google Login failed')
            }
        },
        onError: () => toast.error('Google Login Failed'),
    })

    const handleSubmit = async e => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await API.post('/auth/login', form)
            login(data.user, data.access_token)
            toast.success(`Welcome back, ${data.user.full_name}! 🧠`)

            // Conditional Routing
            try {
                const dashRes = await API.get('/dashboard-data');
                if (dashRes.data && dashRes.data.severity && dashRes.data.severity.final_severity) {
                    nav('/dashboard');
                } else {
                    nav('/behaviour');
                }
            } catch {
                nav('/behaviour');
            }
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Login failed. Check credentials.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen bg-[#05110d] overflow-hidden font-sans flex items-center justify-center p-4">
            {/* Background Animations to match Landing.jsx */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0"
                    style={{
                        background: `
                        radial-gradient(ellipse 80% 60% at 50% 100%, rgba(8,8,8,0.9) 0%, transparent 70%),
                        radial-gradient(ellipse 60% 50% at 0% 50%, rgba(8,8,8,0.5) 0%, transparent 60%),
                        radial-gradient(ellipse 40% 40% at 100% 20%, rgba(0,255,136,0.04) 0%, transparent 60%)
                        `
                    }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[440px] relative z-10"
            >
                {/* ── Brand header ─────────────────────────────────── */}
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        {/* Animated Orb */}
                        <motion.div
                            animate={{
                                boxShadow: [
                                    '0 0 24px rgba(0,255,136,0.25)',
                                    '0 0 64px rgba(0,255,136,0.65)',
                                    '0 0 24px rgba(0,255,136,0.25)',
                                ],
                            }}
                            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                            style={{
                                width: 52, height: 52,
                                borderRadius: 14,
                                background: 'linear-gradient(135deg, rgba(0,255,136,0.22) 0%, rgba(0,204,106,0.07) 100%)',
                                border: '1.5px solid rgba(0,255,136,0.45)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <Brain size={26} style={{ color: '#00ff88' }} />
                        </motion.div>

                        {/* Stylized Brand Text */}
                        <span style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: '32px',
                            fontWeight: 800,
                            letterSpacing: '0.09em',
                            textTransform: 'uppercase',
                            background: 'linear-gradient(170deg, #ffffff 10%, #d1fae5 55%, #6ee7b7 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            display: 'inline-block'
                        }}>
                            MINDCARE AI
                        </span>
                    </div>
                    <h1 className="font-display text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 font-extrabold text-3xl tracking-tight mb-2">
                        Welcome Back
                    </h1>
                    <p className="font-sans font-light text-slate-500 text-sm tracking-wide">
                        Secure access to your MindCare AI dashboard.
                    </p>
                </div>

                {/* ── Card ─────────────────────────────────────────── */}
                <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-3xl p-8 md:p-10 at-noise">

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        {/* Email */}
                        <div className="flex flex-col gap-2">
                            <label className="uppercase tracking-[0.15em] text-[10px] font-bold text-emerald-500/80 pl-1 mb-1">Email Address</label>
                            <div className="relative group">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/5 focus:ring-1 focus:ring-emerald-500/50 transition-all font-sans text-sm"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="flex flex-col gap-2">
                            <label className="uppercase tracking-[0.15em] text-[10px] font-bold text-emerald-500/80 pl-1 mb-1">Password</label>
                            <div className="relative group">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
                                <input
                                    type={showPwd ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pl-11 pr-12 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/5 focus:ring-1 focus:ring-emerald-500/50 transition-all font-sans text-sm tracking-wider"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd(!showPwd)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-400 transition-colors"
                                >
                                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <div className="text-right mt-1">
                                <Link to="/forgot-password" className="text-xs text-slate-500 hover:text-emerald-400 transition-colors font-sans font-medium">
                                    Forgot Password?
                                </Link>
                            </div>
                        </div>

                        {/* Sign In button */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: loading ? 1 : 1.02, boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                            className="mt-2 w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-white font-bold rounded-xl transition-all font-display tracking-widest uppercase text-xs shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    Authenticating...
                                </>
                            ) : 'Sign In'}
                        </motion.button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-7">
                        <div className="flex-1 h-[1px] bg-white/10" />
                        <span className="uppercase tracking-widest text-[10px] font-bold text-slate-500">Or</span>
                        <div className="flex-1 h-[1px] bg-white/10" />
                    </div>

                    {/* Google button */}
                    <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => googleLogin()}
                        className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-slate-200 font-sans font-medium text-sm transition-all shadow-sm"
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18">
                            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-1.07 2.978-4.844 2.978-2.921 0-5.4-2.373-5.4-5.4 0-3.026 2.479-5.4 5.4-5.4 1.713 0 2.865.632 3.536 1.244l2.433-2.375C13.9.84 11.665 0 9 0 4.02 0 0 4.024 0 9s4.02 9 9 9c5.16 0 8.44-3.672 8.44-8.8 0-.6-.068-1.058-.16-1.448l-.16-.352z" />
                        </svg>
                        Continue with Google
                    </motion.button>

                    {/* Sign up link */}
                    <p className="text-center mt-7 text-slate-400 text-sm font-sans font-light">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-emerald-400 font-medium hover:text-emerald-300 transition-colors">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
