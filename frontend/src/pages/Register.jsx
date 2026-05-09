import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Brain, User, Mail, Lock, Phone, MapPin, ChevronRight, ChevronLeft, Eye, EyeOff } from 'lucide-react'
import API from '../api'
import toast from 'react-hot-toast'


const OCCUPATIONS = ['Accountant', 'Doctor', 'Engineer', 'Lawyer', 'Manager', 'Nurse',
    'Sales_person', 'Scientist', 'Software Engineer', 'Student', 'Teacher']

const steps = ['Personal Info', 'Contact Info', 'Account Setup']

const Err = ({ name, errors }) => errors[name]
    ? <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1 font-sans"><span className="text-[10px]">⚠</span> {errors[name]}</p>
    : null

const InputWrapper = ({ icon: Icon, children }) => (
    <div className="relative group">
        <Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors pointer-events-none z-10" />
        {children}
    </div>
)

export default function Register() {
    const [step, setStep] = useState(0)
    const [form, setForm] = useState({
        full_name: '', age: '', gender: 'Male', occupation: 'Student',
        phone: '', location: '', email: '', password: '', confirm_password: ''
    })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [showPwd, setShowPwd] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const nav = useNavigate()

    const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

    const validateStep = () => {
        const e = {}
        if (step === 0) {
            if (!form.full_name.trim()) e.full_name = 'Full name is required'
            if (!form.age || form.age < 10 || form.age > 100) e.age = 'Age must be 10–100'
        }
        if (step === 1) {
            if (form.phone && !/^\d{10}$/.test(form.phone)) e.phone = '10-digit number required'
        }
        if (step === 2) {
            if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required'
            if (form.password.length < 8) e.password = 'Min 8 characters'
            else if (!/[A-Z]/.test(form.password)) e.password = 'Need an uppercase letter'
            else if (!/[a-z]/.test(form.password)) e.password = 'Need a lowercase letter'
            else if (!/[0-9]/.test(form.password)) e.password = 'Need a number'
            else if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) e.password = 'Need a special character'

            if (form.password && form.confirm_password && form.password !== form.confirm_password) {
                e.confirm_password = 'Passwords do not match'
            }
        }
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const next = () => { if (validateStep()) setStep(s => s + 1) }
    const back = () => setStep(s => s - 1)

    const handleSubmit = async () => {
        if (!validateStep()) return
        setLoading(true)
        const payload = { ...form, age: parseInt(form.age) }

        try {
            const res = await API.post('/auth/register', payload)
            toast.dismiss()
            toast.success(res.data?.message || 'Registration successful! Taking you to your first assessment.')
            nav('/behaviour')
        } catch (err) {
            toast.dismiss()
            if (!err.response) {
                toast.error('Network error. Is the backend running?')
                return
            }
            const status = err.response.status
            const detail = err.response.data?.detail
            if (status === 422) {
                if (Array.isArray(detail)) {
                    toast.error(`Validation error: ${detail[0]?.msg || 'check fields'}`)
                } else {
                    toast.error('Invalid data format.')
                }
            } else if (status === 400) {
                toast.error(detail || 'Registration failed.')
            } else {
                toast.error('Server error. Please try again later.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen bg-[#05110d] overflow-hidden font-sans flex items-center justify-center p-4 py-12 md:py-20">
            {/* Background Animations to match Landing.jsx */}
            <div className="fixed inset-0 z-0 pointer-events-none">
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
                className="w-full max-w-[520px] relative z-10"
            >
                {/* ── Brand / Header ─────────────────────────────────── */}
                <div className="text-center mb-8 flex flex-col items-center">
                    <motion.div
                        className="flex items-center justify-center w-16 h-16 rounded-2xl mb-5 border border-emerald-500/30"
                        style={{
                            background: 'linear-gradient(135deg, rgba(0,255,136,0.22) 0%, rgba(0,204,106,0.07) 100%)',
                            boxShadow: '0 0 24px rgba(0,255,136,0.25)'
                        }}
                        whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0,255,136,0.45)' }}
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <Brain size={32} className="text-[#00ff88]" />
                    </motion.div>
                    <h1 className="font-display text-slate-100 font-extrabold text-3xl tracking-tight mb-2">
                        Create Account
                    </h1>
                    <p className="font-sans font-light text-slate-400 text-sm tracking-wide">
                        Join MindCare AI for personalized wellness support
                    </p>
                </div>

                {/* ── Progress Indicator Tabs UI ──────────────────────── */}
                <div className="mb-8 overflow-x-auto hide-scrollbar">
                    <div className="flex justify-between items-end border-b border-white/10 min-w-[340px]">
                        {steps.map((s, i) => (
                            <div key={s} className={`flex-1 flex justify-center pb-2.5 border-b-2 transition-all duration-300 ${i === step ? 'border-emerald-400' : 'border-transparent'}`}>
                                <p className={`uppercase tracking-widest text-[9px] font-bold text-center transition-colors ${i === step ? 'text-emerald-400' : (i < step ? 'text-emerald-400/50' : 'text-slate-500')}`}>
                                    {s}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Main Form Card ──────────────────────────────────── */}
                <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-3xl p-8 md:p-10 mb-6 at-noise">
                    <div className="min-h-[320px]">
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div key={step}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="space-y-5"
                            >
                                {/* Step 0: Personal Info */}
                                {step === 0 && <>
                                    <div className="flex flex-col gap-2">
                                        <label className="uppercase tracking-widest text-xs font-bold text-emerald-500/80 pl-1">Full Name *</label>
                                        <InputWrapper icon={User}>
                                            <input className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans" placeholder="John Doe"
                                                value={form.full_name} onChange={e => update('full_name', e.target.value)} />
                                        </InputWrapper>
                                        <Err name="full_name" errors={errors} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="flex flex-col gap-2">
                                            <label className="uppercase tracking-widest text-xs font-bold text-emerald-500/80 pl-1">Age *</label>
                                            <input type="number" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans" placeholder="25"
                                                value={form.age} onChange={e => update('age', e.target.value)} min={10} max={100} />
                                            <Err name="age" errors={errors} />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="uppercase tracking-widest text-xs font-bold text-emerald-500/80 pl-1">Gender *</label>
                                            <div className="relative group">
                                                <select className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans appearance-none cursor-pointer" value={form.gender}
                                                    onChange={e => update('gender', e.target.value)}>
                                                    <option className="bg-[#05110d] text-white">Male</option>
                                                    <option className="bg-[#05110d] text-white">Female</option>
                                                    <option className="bg-[#05110d] text-white">Other</option>
                                                </select>
                                                <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none rotate-90" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="uppercase tracking-widest text-xs font-bold text-emerald-500/80 pl-1">Occupation *</label>
                                        <div className="relative group">
                                            <select className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans appearance-none cursor-pointer" value={form.occupation}
                                                onChange={e => update('occupation', e.target.value)}>
                                                {OCCUPATIONS.map(o => <option key={o} className="bg-[#05110d] text-white">{o}</option>)}
                                            </select>
                                            <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none rotate-90" />
                                        </div>
                                    </div>
                                </>}

                                {/* Step 1: Health Details */}
                                {step === 1 && <>
                                    <div className="flex flex-col gap-2">
                                        <label className="uppercase tracking-widest text-xs font-bold text-emerald-500/80 pl-1">Phone Number <span className="text-slate-500 ml-1 lowercase font-normal tracking-normal">(optional)</span></label>
                                        <InputWrapper icon={Phone}>
                                            <input className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans" placeholder="9876543210"
                                                value={form.phone} onChange={e => update('phone', e.target.value)} />
                                        </InputWrapper>
                                        <Err name="phone" errors={errors} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="uppercase tracking-widest text-xs font-bold text-emerald-500/80 pl-1">Location <span className="text-slate-500 ml-1 lowercase font-normal tracking-normal">(optional)</span></label>
                                        <InputWrapper icon={MapPin}>
                                            <input className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans" placeholder="City, Country"
                                                value={form.location} onChange={e => update('location', e.target.value)} />
                                        </InputWrapper>
                                    </div>
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 mt-2 backdrop-blur-sm">
                                        <p className="font-sans font-light text-emerald-100/70 text-xs leading-relaxed flex gap-2">
                                            <Lock size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                            Your personal data is encrypted and used exclusively for personalized mental health analysis.
                                        </p>
                                    </div>
                                </>}

                                {/* Step 2: Account Setup */}
                                {step === 2 && <>
                                    <div className="flex flex-col gap-2">
                                        <label className="uppercase tracking-widest text-xs font-bold text-emerald-500/80 pl-1">Email Address *</label>
                                        <InputWrapper icon={Mail}>
                                            <input type="email" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans" placeholder="you@example.com"
                                                value={form.email} onChange={e => update('email', e.target.value)} />
                                        </InputWrapper>
                                        <Err name="email" errors={errors} />
                                    </div>
                                    <div className="flex flex-col gap-2 relative">
                                        <label className="uppercase tracking-widest text-xs font-bold text-emerald-500/80 pl-1">Password *</label>
                                        <InputWrapper icon={Lock}>
                                            <input type={showPwd ? 'text' : 'password'} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pl-11 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans tracking-wider"
                                                placeholder="••••••••"
                                                value={form.password} onChange={e => update('password', e.target.value)} />
                                        </InputWrapper>
                                        <button type="button" onClick={() => setShowPwd(!showPwd)}
                                            className="absolute right-4 top-[35px] md:top-[38px] text-slate-500 hover:text-emerald-400 transition-colors z-20">
                                            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                        <Err name="password" errors={errors} />
                                    </div>
                                    <div className="flex flex-col gap-2 relative">
                                        <label className="uppercase tracking-widest text-xs font-bold text-emerald-500/80 pl-1">Confirm Password *</label>
                                        <InputWrapper icon={Lock}>
                                            <input type={showConfirm ? 'text' : 'password'} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pl-11 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans tracking-wider"
                                                placeholder="••••••••"
                                                value={form.confirm_password} onChange={e => update('confirm_password', e.target.value)} />
                                        </InputWrapper>
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute right-4 top-[35px] md:top-[38px] text-slate-500 hover:text-emerald-400 transition-colors z-20">
                                            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                        <Err name="confirm_password" errors={errors} />
                                    </div>
                                </>}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-4 mt-8 pt-8 border-t border-white/10">
                        {step > 0 && (
                            <motion.button
                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-sans font-medium text-sm transition-all"
                                onClick={back}
                            >
                                <ChevronLeft size={16} /> Back
                            </motion.button>
                        )}
                        {step < 2 ? (
                            <motion.button
                                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-[2] flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-bold rounded-xl transition-all font-display tracking-wide uppercase text-sm"
                                onClick={next}
                            >
                                Next Step <ChevronRight size={16} />
                            </motion.button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: loading ? 1 : 1.02, boxShadow: loading ? 'none' : '0 0 20px rgba(16,185,129,0.4)' }}
                                whileTap={{ scale: loading ? 1 : 0.98 }}
                                disabled={loading}
                                className="flex-[2] flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-bold rounded-xl transition-all font-display tracking-wide uppercase text-sm"
                                onClick={handleSubmit}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                        Creating...
                                    </>
                                ) : 'Create Account'}
                            </motion.button>
                        )}
                    </div>
                </div>

                <p className="text-center text-slate-400 text-sm font-sans font-light pb-8">
                    Already have an account?{' '}
                    <Link to="/login" className="text-emerald-400 font-medium hover:text-emerald-300 transition-colors">
                        Sign In
                    </Link>
                </p>
            </motion.div>
        </div>
    )
}
