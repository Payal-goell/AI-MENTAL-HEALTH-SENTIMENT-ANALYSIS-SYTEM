import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import API from '../api'
import toast from 'react-hot-toast'
import StepProgress from '../components/StepProgress'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { AlertTriangle, CheckCircle, Info, Zap, User, ArrowLeft, BarChart2, RefreshCw, Brain } from 'lucide-react'

const BMI_OPTIONS = ['Healthy Weight', 'Overweight', 'Obese']
const GENDER_OPTIONS = ['Male', 'Female']
const OCCUPATION_OPTIONS = ['Accountant', 'Doctor', 'Engineer', 'Lawyer', 'Manager', 'Nurse', 'Sales_person', 'Scientist', 'Software Engineer', 'Student', 'Teacher']

const THEMES = {
    Low: { color: '#10B981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: 'glow-green', icon: CheckCircle, message: 'Excellent wellness profile! Your habits are contributing to a healthy lifestyle.' },
    Medium: { color: '#F59E0B', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', glow: 'glow-yellow', icon: Info, message: 'Moderate indicators detected. Small adjustments to your routine could significantly improve your balance.' },
    High: { color: '#EF4444', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', glow: 'glow-red', icon: AlertTriangle, message: 'Action required. Your metrics suggest significant physiological or lifestyle stress that needs attention.' }
}

function Slider({ label, name, value, min, max, onChange, colorMap }) {
    const pct = ((value - min) / (max - min)) * 100
    const color = colorMap ? colorMap(pct, value) : '#34d399' // dynamic track color
    return (
        <div className="group">
            <div className="flex justify-between mb-3 items-center">
                <label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest group-hover:text-slate-300 transition-colors">{label}</label>
                <div className="px-3 py-1 bg-black/40 rounded-lg border border-white/5 group-hover:border-white/10 transition-all">
                    <span className="text-sm font-black tabular-nums" style={{ color }}>{value}</span>
                </div>
            </div>
            <div className="relative w-full h-4 flex items-center">
                {/* Track background */}
                <div className="absolute left-0 right-0 h-2 bg-black/60 rounded-full border border-white/[0.02] shadow-inner overflow-hidden">
                    <div className="absolute h-full rounded-full"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}40, ${color})` }} />
                </div>

                {/* Custom Thumb Glow (Visual only) */}
                <div className="absolute w-5 h-5 rounded-full border-2 pointer-events-none group-hover:scale-110 shadow-lg transition-transform"
                    style={{ left: `calc(${pct}% - 10px)`, borderColor: color, backgroundColor: '#05110d', boxShadow: `0 0 15px ${color}60`, zIndex: 5 }} />

                {/* Invisible Native Input (The actual interactive element) */}
                <input type="range" min={min} max={max} value={value}
                    onChange={e => onChange(name, parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
            </div>
        </div>
    )
}

export default function BehaviourTest() {
    const { user } = useAuth()
    const nav = useNavigate()
    const [userInfo, setUserInfo] = useState(null)
    const [form, setForm] = useState({
        bmi_category: 'Healthy Weight', sleep_hours: 7, sleep_quality: 6,
        physical_activity: 50, stress_level: 5, heart_rate: 72,
        daily_steps: 5000, systolic_bp: 120, diastolic_bp: 80
    })
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [manualMode, setManualMode] = useState(false)
    const [showPreloader, setShowPreloader] = useState(true)
    const [manualInfo, setManualInfo] = useState({
        full_name: '', age: 25, gender: 'Male', occupation: 'Engineer'
    })

    useEffect(() => {
        // Handle preloader
        const timer = setTimeout(() => setShowPreloader(false), 1500)

        API.get('/auth/me').then(r => {
            setUserInfo(r.data)
            setManualInfo({
                full_name: r.data.full_name,
                age: r.data.age,
                gender: r.data.gender,
                occupation: r.data.occupation
            })
        }).catch(() => { })

        return () => clearTimeout(timer)
    }, [])

    const updateLabel = (k, v) => setManualInfo(p => ({ ...p, [k]: v }))
    const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

    // Dynamic Slider Colors
    const sleepHoursColor = (pct, val) => val >= 7 ? '#10B981' : val >= 5 ? '#F59E0B' : '#EF4444' // Green -> Yellow -> Red
    const sleepQualityColor = (pct, val) => val >= 7 ? '#10B981' : val >= 4 ? '#F59E0B' : '#EF4444'
    const stressColor = (pct, val) => val <= 3 ? '#10B981' : val <= 7 ? '#F59E0B' : '#EF4444' // Red for high stress

    const handleSubmit = async () => {
        if (loading) return

        // Validation logic
        if (form.physical_activity < 1 || form.physical_activity > 100) {
            toast.error('Physical Activity must be between 1 and 100', { id: 'validation-error' })
            return
        }

        // Additional field validations
        const fields = [
            { name: 'heart_rate', label: 'Heart Rate', min: 40, max: 200 },
            { name: 'daily_steps', label: 'Daily Steps', min: 0, max: 50000 },
            { name: 'systolic_bp', label: 'Systolic BP', min: 70, max: 250 },
            { name: 'diastolic_bp', label: 'Diastolic BP', min: 40, max: 150 }
        ]

        for (const field of fields) {
            if (form[field.name] < field.min || form[field.name] > field.max) {
                toast.error(`${field.label} must be between ${field.min} and ${field.max}`, { id: 'validation-error' })
                return
            }
        }

        setLoading(true)
        const toastId = 'prediction-flow'
        toast.loading('Processing Intelligence Analysis...', { id: toastId })

        try {
            const endpoint = manualMode ? '/behaviour/analyse-manual' : '/behaviour/analyse'
            const payload = manualMode ? { ...form, ...manualInfo } : form

            console.log("Sending Analysis Request:", payload)

            const { data } = await API.post(endpoint, payload)
            setResult(data)
            toast.success('Intelligence Analysis complete!', { id: toastId })
        } catch (err) {
            console.error("Analysis Error:", err)
            const msg = err.response?.data?.detail
            const errorMsg = Array.isArray(msg) ? msg.map(m => `${m.loc.join('.')}: ${m.msg}`).join(', ') : (msg || err.message)
            toast.error(errorMsg || 'Analysis failed', { id: toastId })
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <AnimatePresence>
                {showPreloader && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="fixed inset-0 z-[9999] bg-[#05110d] flex items-center justify-center pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center gap-6"
                        >
                            <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-900/20 border border-emerald-500/30 overflow-hidden shadow-[0_0_40px_rgba(0,255,136,0.2)]">
                                <motion.div
                                    animate={{ top: ['100%', '-10%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                    className="absolute left-0 right-0 h-1 bg-emerald-400 shadow-[0_0_20px_#34d399]"
                                />
                                <Brain size={32} className="text-emerald-400 z-10" />
                            </div>
                            <h2 className="text-white font-display text-2xl md:text-3xl font-bold tracking-[0.2em] relative">
                                STEP <span className="text-emerald-400">1</span> : BEHAVIOUR TEST
                            </h2>
                            <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 1.4, ease: "easeInOut" }}
                                    className="h-full bg-emerald-400"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative flex flex-col items-center justify-center min-h-screen py-16 px-4 bg-[#05110d] overflow-hidden font-sans">
                {/* Premium Dark Background Orbs */}
                <div className="absolute inset-0 z-0 pointer-events-none print:hidden">
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

                <div className="w-full max-w-[1000px] mx-auto z-10 relative">
                    {/* Premium Branded Header - SCALED UP */}
                    <div className="flex items-center justify-center gap-6 mb-12 mt-4 print:hidden">
                        <motion.div
                            animate={{
                                boxShadow: [
                                    '0 0 30px rgba(0,255,136,0.3)',
                                    '0 0 80px rgba(0,255,136,0.7)',
                                    '0 0 30px rgba(0,255,136,0.3)',
                                ],
                            }}
                            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                            style={{
                                width: 72, height: 72,
                                borderRadius: 20,
                                background: 'linear-gradient(135deg, rgba(0,255,136,0.22) 0%, rgba(0,204,106,0.07) 100%)',
                                border: '2px solid rgba(0,255,136,0.45)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <Brain size={38} style={{ color: '#00ff88' }} />
                        </motion.div>
                        <span style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: '52px',
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

                    <div className="print:hidden">
                        <StepProgress current={0} />
                    </div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                        <div className="text-center mb-10 print:hidden">
                            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 mb-3 tracking-tight font-display">Behaviour Analysis</h1>
                            <p className="text-slate-400 text-lg font-medium opacity-80">Step 1/4 — AI-powered mental health behaviour prediction</p>
                        </div>

                        {!result ? (
                            <div className="bg-[#0a0f12]/80 backdrop-blur-2xl border border-white/[0.04] shadow-[0_0_50px_rgba(0,0,0,0.6)] rounded-[2rem] p-10 md:p-12 space-y-8 relative overflow-hidden mx-auto w-full at-noise">
                                {/* Inner glow */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[500px] bg-emerald-500/5 blur-[120px] rounded-[100%] pointer-events-none" />

                                {/* Header Section with Manual Mode Toggle */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-white/[0.05] relative z-10">
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3 font-display">
                                            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                                <User className="text-emerald-400" size={20} />
                                            </div>
                                            Personal Metrics
                                        </h2>
                                        <p className="text-slate-500 text-[11px] uppercase tracking-widest mt-2 font-bold">Precision parameters for deep evaluation</p>
                                    </div>
                                    {/* <button
                                        onClick={() => setManualMode(!manualMode)}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all border ${manualMode ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'bg-white/5 border-white/10 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30'}`}
                                    >
                                        <Zap size={14} fill={manualMode ? 'currentColor' : 'none'} />
                                        {manualMode ? 'Disable Manual Mode' : 'Enable Manual Mode'}
                                    </button> */}
                                </div>

                                <div className="space-y-10">
                                    {/* Identity Section */}
                                    <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 p-8 rounded-2xl border transition-all ${manualMode ? 'bg-black/20 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]' : 'bg-black/40 border-white/5 opacity-50 pointer-events-none'}`}>
                                        <div className="field-group">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.1em] block mb-2">Full Name</label>
                                            <input type="text" className="bg-transparent border-none text-white font-bold w-full focus:ring-0 p-0 text-xl tracking-wide"
                                                value={manualMode ? manualInfo.full_name : (userInfo?.full_name || 'Loading...')}
                                                onChange={e => updateLabel('full_name', e.target.value)}
                                                readOnly={!manualMode} />
                                        </div>
                                        <div className="field-group">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.1em] block mb-2">Age</label>
                                            <input type="number" className="bg-transparent border-none text-white font-bold w-full focus:ring-0 p-0 text-xl tracking-wide"
                                                value={manualMode ? manualInfo.age : (userInfo?.age || 0)}
                                                onChange={e => updateLabel('age', parseInt(e.target.value) || '')}
                                                readOnly={!manualMode} />
                                        </div>
                                        <div className="field-group">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.1em] block mb-2">Gender</label>
                                            {manualMode ? (
                                                <select className="bg-transparent border-none text-white font-bold w-full focus:ring-0 p-0 appearance-none text-xl tracking-wide cursor-pointer"
                                                    value={manualInfo.gender} onChange={e => updateLabel('gender', e.target.value)}>
                                                    {GENDER_OPTIONS.map(o => <option key={o} value={o} className="bg-[#05110d] text-white">{o}</option>)}
                                                </select>
                                            ) : (
                                                <input type="text" className="bg-transparent border-none text-white font-bold w-full focus:ring-0 p-0 text-xl tracking-wide" value={userInfo?.gender || '...'} readOnly />
                                            )}
                                        </div>
                                        <div className="field-group">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.1em] block mb-2">Occupation</label>
                                            {manualMode ? (
                                                <select className="bg-transparent border-none text-white font-bold w-full focus:ring-0 p-0 appearance-none text-xl tracking-wide cursor-pointer"
                                                    value={manualInfo.occupation} onChange={e => updateLabel('occupation', e.target.value)}>
                                                    {OCCUPATION_OPTIONS.map(o => <option key={o} value={o} className="bg-[#05110d] text-white">{o}</option>)}
                                                </select>
                                            ) : (
                                                <input type="text" className="bg-transparent border-none text-white font-bold w-full focus:ring-0 p-0 text-xl tracking-wide" value={userInfo?.occupation || '...'} readOnly />
                                            )}
                                        </div>
                                    </div>

                                    {/* Health & Activity Section */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="field-group">
                                            <label className="text-slate-300 text-sm font-bold block mb-4 flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                                Weight Profile (BMI)
                                            </label>
                                            <div className="flex gap-3">
                                                {BMI_OPTIONS.map(o => (
                                                    <button key={o} onClick={() => update('bmi_category', o)}
                                                        className={`flex-1 py-3.5 text-[10px] font-black rounded-xl border transition-all ${form.bmi_category === o ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400/50' : 'bg-white/5 border-white/10 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30'}`}>
                                                        {o}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="field-group">
                                            <label className="text-slate-300 text-sm font-bold block mb-4 flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]" />
                                                Physical Activity Level (1-100)
                                            </label>
                                            <div className="relative">
                                                <input type="number"
                                                    className={`w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans pr-12 ${(form.physical_activity < 1 || form.physical_activity > 100) ? 'border-red-500/50 focus:ring-red-500/30' : ''}`}
                                                    value={form.physical_activity} min="1" max="100"
                                                    onChange={e => update('physical_activity', parseInt(e.target.value) || '')}
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 uppercase tracking-widest pointer-events-none">%</span>
                                            </div>
                                            {(form.physical_activity < 1 || form.physical_activity > 100) && (
                                                <p className="text-red-400 text-[9px] uppercase font-bold mt-2 tracking-[0.2em]">⚠️ Must be between 1 and 100</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Lifestyle Sliders */}
                                    <div className="grid grid-cols-1 gap-12 bg-black/20 p-8 rounded-3xl border border-white/[0.05] shadow-inner relative z-10">
                                        <Slider label="Daily Sleep Duration (Hours)" name="sleep_hours" value={form.sleep_hours} min={1} max={12} onChange={update} colorMap={sleepHoursColor} />
                                        <Slider label={`Sleep Quality Assessment Index (1-10)`} name="sleep_quality" value={form.sleep_quality} min={1} max={10} onChange={update} colorMap={sleepQualityColor} />
                                        <Slider label={`Perceived Stress Level Magnitude (1-10)`} name="stress_level" value={form.stress_level} min={1} max={10} onChange={update} colorMap={stressColor} />
                                    </div>

                                    {/* Vital Signs Grid */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                        {[
                                            ['Heart Rate', 'heart_rate', 40, 200, 'BPM'],
                                            ['Daily Steps', 'daily_steps', 0, 50000, 'Steps'],
                                            ['Systolic BP', 'systolic_bp', 70, 250, 'mmHg'],
                                            ['Diastolic BP', 'diastolic_bp', 40, 150, 'mmHg'],
                                        ].map(([label, key, min, max, unit]) => (
                                            <div key={key} className="bg-black/20 p-8 rounded-2xl border border-white/5 text-center transition-all hover:border-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] group">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] block mb-2">{label}</label>
                                                <div className="flex items-baseline justify-center gap-1">
                                                    <input type="number" className="bg-transparent border-none text-white font-black text-4xl w-28 text-center focus:outline-none focus:ring-0 p-0 group-hover:text-emerald-400 transition-colors"
                                                        value={form[key]} min={min} max={max} onChange={e => update(key, parseInt(e.target.value) || '')} />
                                                    <span className="text-[10px] text-slate-600 font-bold uppercase">{unit}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Action Button */}
                                    <div className="pt-6">
                                        <motion.button onClick={handleSubmit} disabled={loading}
                                            className="w-full py-5 flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-extrabold rounded-xl transition-all shadow-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide font-display text-sm"
                                            whileHover={!loading ? { scale: 1.02 } : {}} whileTap={!loading ? { scale: 0.98 } : {}}>
                                            {loading ? (
                                                <>
                                                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                                    Decrypting Neural Patterns...
                                                </>
                                            ) : <>🧠 Run AI Behaviour Intelligence Analysis <Zap size={18} fill="currentColor" /></>}
                                        </motion.button>
                                        <div className="flex items-center justify-center gap-3 mt-8 opacity-30">
                                            <div className="h-[1px] w-10 bg-slate-600" />
                                            <p className="text-slate-500 text-[8px] font-black uppercase tracking-[0.2em]">SECURE AI CORE v2.0</p>
                                            <div className="h-[1px] w-10 bg-slate-600" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 print:block print:bg-white print:shadow-none print:border-none print:m-0 print:p-0" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                {(() => {
                                    const theme = THEMES[result?.behaviour_risk] || THEMES.Medium
                                    const Icon = theme.icon
                                    return (
                                        <div className={`bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-3xl p-8 ${theme.border} ${theme.glow} print:border print:border-gray-300 print:bg-transparent print:shadow-none print:break-inside-avoid print:p-6`}>
                                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-16 h-16 rounded-2xl ${theme.bg} flex items-center justify-center border ${theme.border}`}>
                                                        <Icon size={32} className={theme.text} />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-3xl font-display font-bold text-white print:text-black">Prediction: <span className={theme.text}>{result?.behaviour_risk} Risk</span></h2>
                                                        <p className="text-slate-400 text-sm mt-1 print:text-gray-700">{theme.message}</p>
                                                    </div>
                                                </div>
                                                <div className="text-center md:text-right">
                                                    <div className={`text-5xl font-black ${theme.text} leading-tight`}>{result?.severity_score}<span className="text-xl text-slate-500 font-normal print:text-gray-700">/10</span></div>
                                                    <div className="text-slate-500 text-xs font-bold uppercase tracking-widest print:text-gray-700">Global Severity</div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-black/20 p-5 rounded-2xl border border-white/5 space-y-4 print:border print:border-gray-300 print:bg-transparent print:shadow-none print:break-inside-avoid">
                                                    <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest print:text-gray-700">
                                                        <span>AI Confidence</span>
                                                        <span className="text-emerald-400 font-black">{result?.confidence?.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden print:bg-gray-200">
                                                        <motion.div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
                                                            initial={{ width: 0 }} animate={{ width: `${result?.confidence}%` }} transition={{ duration: 1.5 }} />
                                                    </div>
                                                </div>
                                                <div className="bg-black/20 p-6 rounded-2xl border border-white/5 flex flex-col justify-center gap-5 print:border print:border-gray-300 print:bg-transparent print:shadow-none print:break-inside-avoid">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400"><User size={14} /></div>
                                                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest print:text-gray-700">User Profile</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                                                        <div>
                                                            <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1 print:text-gray-700">Name</p>
                                                            <p className="font-medium text-white text-sm truncate print:text-black">{(manualMode ? manualInfo.full_name : userInfo?.full_name) || "Anonymous"}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1 print:text-gray-700">Age</p>
                                                            <p className="font-medium text-white text-sm print:text-black">{manualMode ? manualInfo.age : userInfo?.age}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1 print:text-gray-700">Gender</p>
                                                            <p className="font-medium text-white text-sm print:text-black">{manualMode ? manualInfo.gender : userInfo?.gender}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1 print:text-gray-700">Occupation</p>
                                                            <p className="font-medium text-white text-sm truncate print:text-black">{manualMode ? manualInfo.occupation : userInfo?.occupation}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })()}

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.3)] print:border print:border-gray-300 print:bg-transparent print:shadow-none print:break-inside-avoid">
                                        <h3 className="font-bold text-slate-200 mb-6 flex items-center gap-2 text-sm uppercase tracking-widest opacity-80 print:text-black"><BarChart2 className="text-emerald-400" size={16} /> Metric Visualization</h3>
                                        <div className="h-[240px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={[
                                                    { name: 'Sleep Q', val: form.sleep_quality, max: 10, color: '#10B981' },
                                                    { name: 'Stress', val: form.stress_level, max: 10, color: '#F59E0B' },
                                                    { name: 'Activity', val: form.physical_activity / 10, max: 10, color: '#00F5FF' },
                                                    { name: 'Steps', val: form.daily_steps / 1500, max: 10, color: '#8B5CF6' }
                                                ]} barSize={40}>
                                                    <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 10 }} />
                                                    <YAxis domain={[0, 10]} stroke="#475569" tick={{ fontSize: 10 }} />
                                                    <Tooltip contentStyle={{ background: '#05110d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                                                    <Bar dataKey="val" radius={[6, 6, 0, 0]}>
                                                        {[0, 1, 2, 3].map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={['#10B981', '#F59E0B', '#2dd4bf', '#8B5CF6'][index]} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.3)] space-y-4 print:border print:border-gray-300 print:bg-transparent print:shadow-none print:break-inside-avoid">
                                        <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2 text-sm uppercase tracking-widest opacity-80 print:text-black"><Zap className="text-emerald-400" size={16} /> Key Factors</h3>
                                        {[
                                            { label: 'Stress', val: form.stress_level, threshold: 7, bad: 'High' },
                                            { label: 'Sleep', val: form.sleep_quality, threshold: 4, bad: 'Low', reverse: true },
                                            { label: 'Steps', val: form.daily_steps, threshold: 4000, bad: 'Inactive', reverse: true }
                                        ].map(f => {
                                            const isBad = f.reverse ? f.val <= f.threshold : f.val >= f.threshold
                                            return (
                                                <div key={f.label} className={`p-4 rounded-xl border ${isBad ? 'border-red-500/20 bg-red-500/5' : 'border-white/5 bg-black/20'} print:border-gray-200 print:bg-transparent`}>
                                                    <div className="flex justify-between items-center mb-1 text-[10px] uppercase font-bold tracking-widest">
                                                        <span className="text-slate-400 print:text-gray-700">{f.label}</span>
                                                        <span className={isBad ? 'text-red-500 print:text-red-500' : 'text-emerald-500 print:text-emerald-500'}>{isBad ? 'Alert' : 'Good'}</span>
                                                    </div>
                                                    <p className={`text-sm font-black ${isBad ? 'text-red-400 print:text-red-600' : 'text-white print:text-black'}`}>{f.val} {isBad ? `(${f.bad})` : ''}</p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 border border-white/10 flex flex-col justify-between shadow-[0_0_30px_rgba(0,0,0,0.3)] print:border print:border-gray-300 print:bg-transparent print:shadow-none print:break-inside-avoid">
                                        <div>
                                            <h3 className="font-bold text-slate-200 mb-4 text-xs uppercase tracking-widest opacity-80 italic print:text-black">🔍 Prediction Insight</h3>
                                            <p className="text-slate-300 text-sm leading-relaxed print:text-gray-800">
                                                Your pattern indicates a <span className="text-emerald-400 font-bold">{result?.behaviour_risk?.toLowerCase()}</span> risk.
                                                {result?.behaviour_risk === 'High' ? " High stress and poor sleep are the primary triggers. Focus on recovery." :
                                                    result?.behaviour_risk === 'Medium' ? " Metrics are stable but have room for lifestyle optimization." :
                                                        " Habits are well-maintained. Continue your current self-care routine."}
                                            </p>
                                        </div>
                                        <button onClick={() => window.print()} className="w-full py-3 mt-6 rounded-xl bg-white/5 text-[10px] font-bold text-slate-400 uppercase border border-white/10 hover:text-white hover:bg-white/10 hover:border-emerald-500/30 transition-all print:hidden">Export Analysis Report</button>
                                    </div>
                                    <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.3)] print:border print:border-gray-300 print:bg-transparent print:shadow-none print:break-inside-avoid">
                                        <h3 className="font-bold text-slate-200 mb-4 text-xs uppercase tracking-widest opacity-80 italic print:text-black">💡 AI Recommendations</h3>
                                        <div className="space-y-3">
                                            {result?.recommendations?.slice(0, 3).map((r, i) => (
                                                <div key={i} className="flex gap-3 text-xs text-slate-300 leading-normal p-3 rounded-xl bg-black/20 border border-white/5 print:border-gray-200 print:bg-transparent print:text-gray-800">
                                                    <span className="text-emerald-400 text-sm mt-[1px]">✦</span> {r}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="pt-4 flex flex-col sm:flex-row gap-4 print:hidden">
                                    <button onClick={() => setResult(null)} className="flex-[0.6] py-3 md:py-4 text-[11px] md:text-sm uppercase tracking-widest font-bold flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-slate-500 transition-all"><RefreshCw size={16} /> Retake Test</button>
                                    <button onClick={() => nav('/chat')} className="flex-[2] py-4 text-[11px] md:text-sm uppercase tracking-widest font-extrabold flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-xl hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all">Continue to Counselling <Zap size={16} fill="currentColor" /></button>
                                </motion.div>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </div>
        </>
    )
}
