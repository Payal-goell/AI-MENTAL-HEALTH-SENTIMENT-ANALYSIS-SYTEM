import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { RadialBarChart, RadialBar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { CheckCircle, Circle, Send, Loader2, Sparkles, Activity, MessageSquare, Flame, Quote, User, LogOut, Settings, RefreshCw, X, Mail, Phone, MapPin, Book, PlayCircle, Smile, Brain } from 'lucide-react'
import API from '../api'
import toast from 'react-hot-toast'

// ── Hoisted outside Dashboard to prevent remounting on every render ──────────
const getScoreColorClass = (score) => {
    if (score === undefined || score === null) return 'text-slate-400';
    if (score <= 3) return 'text-emerald-400';
    if (score <= 7) return 'text-amber-400';
    return 'text-rose-500';
}

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-emerald-500/30 p-3 rounded-xl shadow-xl">
                <p className="text-slate-400 text-xs mb-1">{label}</p>
                <p className="text-emerald-400 font-bold text-sm">
                    Severity Score: <span className="text-white text-base">{payload[0].value}</span>
                </p>
            </div>
        );
    }
    return null;
};

export default function Dashboard() {
    const [data, setData] = useState(null)
    const [suggestions, setSuggestions] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showPreloader, setShowPreloader] = useState(true)

    // Chatbot State
    const [chatMessages, setChatMessages] = useState([
        { role: 'assistant', text: "Hello! I am Dr. MindCare. How are you feeling today?" }
    ])
    const [chatInput, setChatInput] = useState('')
    const [chatLoading, setChatLoading] = useState(false)
    const messagesEndRef = useRef(null)

    // Additional UI State
    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editForm, setEditForm] = useState({ full_name: '', email: '', age: '', gender: '', occupation: '', phone: '', location: '' })

    useEffect(() => {
        Promise.all([
            API.get('/dashboard-data'),
            API.get('/smart-suggestions').catch(() => ({ data: { lifestyle: ["Maintain a regular sleep schedule", "Stay socially connected"], quotes: ["Every day is a new beginning."], daily_tasks: [] } }))
        ]).then(([dashRes, sugRes]) => {
            setData(dashRes.data)
            setSuggestions(sugRes.data)
            setEditForm({
                full_name: dashRes.data.user?.full_name || '',
                email: dashRes.data.user?.email || '',
                age: dashRes.data.user?.age || '',
                gender: dashRes.data.user?.gender || '',
                occupation: dashRes.data.user?.occupation || '',
                phone: dashRes.data.user?.phone || '',
                location: dashRes.data.user?.location || ''
            })
            setLoading(false)
        }).catch(err => {
            console.error(err)
            toast.error("Failed to load dashboard")
            setLoading(false)
        })

        // Preloader transition out
        const timer = setTimeout(() => setShowPreloader(false), 1500)
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatMessages])

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!chatInput.trim()) return

        const userMsg = { role: 'user', text: chatInput }
        setChatMessages(prev => [...prev, userMsg])
        setChatInput('')
        setChatLoading(true)

        try {
            const res = await API.post('/doctor-chat', { message: userMsg.text })
            setChatMessages(prev => [...prev, { role: 'assistant', text: res.data.reply }])
        } catch (err) {
            console.error(err)
            toast.error("Failed to reach AI Doctor")
        } finally {
            setChatLoading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('mindcare_token')
        localStorage.removeItem('mindcare_user')
        window.location.href = '/login'
    }

    const handleEditSave = async (e) => {
        e.preventDefault()
        try {
            const res = await API.put('/update-profile', {
                full_name: editForm.full_name,
                email: editForm.email,
                age: parseInt(editForm.age) || null,
                gender: editForm.gender,
                occupation: editForm.occupation,
                phone: editForm.phone,
                location: editForm.location
            })
            toast.success("Profile updated!")
            setShowEditModal(false)
            setData(prev => ({
                ...prev,
                user: {
                    ...prev.user,
                    ...res.data.user
                }
            }))
        } catch (err) {
            toast.error("Failed to update profile")
        }
    }

    const toggleTask = (taskId) => {
        if (!data || !data.daily_tasks) return

        const taskToUpdate = data.daily_tasks.find(t => t.id === taskId)
        if (!taskToUpdate) return
        const updatedCompleted = !taskToUpdate.completed

        const updatedTasks = data.daily_tasks.map(t =>
            t.id === taskId ? { ...t, completed: updatedCompleted } : t
        )
        setData({ ...data, daily_tasks: updatedTasks })

        API.post('/toggle-task', { task_id: taskId, completed: updatedCompleted })
            .catch(err => {
                console.error("Failed to update task", err)
                toast.error("Failed to update task")
                // Revert on failure
                setData(data)
            })
    }

    if (loading) {
        return (
            <div className="fixed inset-0 z-[9999] bg-[#04100c] flex flex-col items-center justify-center">
                <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-900/20 border border-emerald-500/30 mb-6 shadow-[0_0_40px_rgba(0,255,136,0.2)]">
                    <Loader2 size={32} className="text-emerald-400 animate-spin z-10" />
                </div>
                <h2 className="text-white font-display text-2xl font-bold tracking-[0.2em]">
                    LOADING <span className="text-emerald-400">DATA</span>
                </h2>
            </div>
        )
    }

    if (!data) return null

    const score = data.severity?.final_severity || 0
    let color = '#34d399' // emerald-400
    if (score >= 4 && score <= 7) color = '#fbbf24' // amber-400
    if (score > 7) color = '#f87171' // red-400

    const radialData = [{ name: 'Severity', value: score, fill: color }]

    const breakdown = {
        behaviour: data.severity?.behaviour_score || 0,
        chat: data.severity?.chat_score || 0,
        face: data.severity?.face_score || 0,
        voice: data.severity?.voice_score || 0
    }

    // --- Daily Tasks Helpers ---
    const getWeekDays = () => {
        const days = [];
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() + diffToMonday);

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            days.push({
                dayName: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
                dayNumber: date.getDate(),
                isToday: date.toDateString() === today.toDateString()
            });
        }
        return days;
    };
    const weekDays = getWeekDays();
    const currentMonthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // CustomTooltip is defined at module scope (above) to avoid remounting

    return (
        <>
            <motion.div
                initial={showPreloader ? { opacity: 1 } : false}
                animate={{ opacity: showPreloader ? 1 : 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className={`fixed inset-0 z-[9999] bg-[#04100c] flex items-center justify-center pointer-events-none ${!showPreloader ? 'pointer-events-none opacity-0' : ''}`}
                style={{ display: showPreloader ? 'flex' : 'none' }} // Quick fix so it exits DOM visually after fade
            >
                {showPreloader && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center gap-6"
                    >
                        <div className="flex items-center justify-center gap-4 mb-2">
                            <motion.div animate={{ boxShadow: ['0 0 24px rgba(0,255,136,0.25)', '0 0 64px rgba(0,255,136,0.65)', '0 0 24px rgba(0,255,136,0.25)'] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }} style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, rgba(0,255,136,0.22) 0%, rgba(0,204,106,0.07) 100%)', border: '1.5px solid rgba(0,255,136,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Brain size={26} style={{ color: '#00ff88' }} />
                            </motion.div>
                            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '32px', fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', background: 'linear-gradient(170deg, #ffffff 10%, #d1fae5 55%, #6ee7b7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block' }}>
                                MINDCARE AI
                            </span>
                        </div>
                        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 1.4, ease: "easeInOut" }}
                                className="h-full bg-emerald-400"
                            />
                        </div>
                    </motion.div>
                )}
            </motion.div>

            <div className="min-h-screen bg-[#04100c] text-slate-200 font-sans relative overflow-x-hidden">
                {/* 1. The 3D Wave Background */}
                <div className="fixed inset-0 z-0 pointer-events-none">
                </div>

                {/* 2. The Dark Gradient Overlay (for depth) */}
                <div className="fixed inset-0 z-[1] pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#04100c_80%)] opacity-80" />

                {/* Main Content */}
                <div className="relative z-10 px-4 sm:px-10 xl:px-16 pb-32 max-w-[1600px] w-full mx-auto pt-24">

                    {/* Premium Branded Header - Clickable */}
                    <div
                        onClick={() => window.location.href = '/'}
                        className="flex items-center justify-center gap-6 mb-12 mt-2 print:hidden w-full cursor-pointer hover:scale-[1.02] hover:opacity-90 transition-all duration-300"
                        title="Go to Home"
                    >
                        <motion.div animate={{ boxShadow: ['0 0 30px rgba(0,255,136,0.3)', '0 0 80px rgba(0,255,136,0.7)', '0 0 30px rgba(0,255,136,0.3)'] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }} style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, rgba(0,255,136,0.22) 0%, rgba(0,204,106,0.07) 100%)', border: '2px solid rgba(0,255,136,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Brain size={38} style={{ color: '#00ff88' }} />
                        </motion.div>
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '52px', fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', background: 'linear-gradient(170deg, #ffffff 10%, #d1fae5 55%, #6ee7b7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block' }}>
                            MINDCARE AI
                        </span>
                    </div>

                    {/* Welcome / Nav Header */}
                    <div className="flex justify-between items-center mb-10 relative">
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="font-display text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                                    Welcome back, {data.user?.full_name?.split(' ')[0] || "Friend"}
                                </h1>
                                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Live
                                </span>
                            </div>
                            <p className="text-slate-400 text-base">Your personalized mental wellness overview — updated in real time.</p>
                        </motion.div>

                        <div className="flex items-center gap-4">
                            <button onClick={() => window.location.href = '/behaviour'} className="hidden sm:flex items-center gap-2 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] text-black shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:shadow-[0_0_30px_rgba(0,255,136,0.5)] px-5 py-2.5 rounded-full font-bold transition-all">
                                <RefreshCw size={18} /> New Assessment
                            </button>

                            <div className="relative">
                                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="w-12 h-12 rounded-full bg-slate-800 border-2 border-emerald-500/50 flex items-center justify-center hover:bg-slate-700 transition-colors">
                                    <User className="text-emerald-400" />
                                </button>

                                {showProfileMenu && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute right-0 mt-3 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                                        <div className="p-4 border-b border-white/5 bg-white/5">
                                            <h3 className="font-bold text-white truncate">{data.user?.full_name}</h3>
                                            <p className="text-sm text-slate-400">{data.user?.age} yrs • {data.user?.occupation || 'No occupation'}</p>
                                        </div>
                                        <div className="p-3 border-b border-white/5 space-y-2">
                                            {data.user?.email && (
                                                <div className="flex items-center gap-2 text-xs text-slate-300">
                                                    <Mail size={14} className="text-emerald-400 shrink-0" />
                                                    <span className="truncate">{data.user.email}</span>
                                                </div>
                                            )}
                                            {data.user?.phone && (
                                                <div className="flex items-center gap-2 text-xs text-slate-300">
                                                    <Phone size={14} className="text-emerald-400 shrink-0" />
                                                    <span>{data.user.phone}</span>
                                                </div>
                                            )}
                                            {data.user?.gender && (
                                                <div className="flex items-center gap-2 text-xs text-slate-300">
                                                    <User size={14} className="text-emerald-400 shrink-0" />
                                                    <span>{data.user.gender}</span>
                                                </div>
                                            )}
                                            {data.user?.location && (
                                                <div className="flex items-center gap-2 text-xs text-slate-300">
                                                    <MapPin size={14} className="text-emerald-400 shrink-0" />
                                                    <span className="truncate">{data.user.location}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-2">
                                            <button onClick={() => { setShowProfileMenu(false); setShowEditModal(true); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 rounded-lg transition-colors">
                                                <Settings size={16} /> Edit Profile
                                            </button>
                                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors mt-1">
                                                <LogOut size={16} /> Sign Out
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── MAIN WIDGET GRID ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:items-start relative">

                        {/* LEFT & CENTER COLUMNS */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Section Label */}
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-[0.3em]">Assessment Summary</span>
                                <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/20 to-transparent" />
                            </div>

                            {/* Top Row: Hero Meter & Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Final Severity Meter */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white/[0.03] border border-white/[0.07] backdrop-blur-xl transform-gpu will-change-transform rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden p-6 flex flex-col items-center justify-center relative transition-all duration-500 hover:bg-white/[0.05] hover:border-emerald-500/30 hover:shadow-[0_0_50px_rgba(52,211,153,0.12)] group"
                                >
                                    <h2 className="text-lg font-bold text-slate-300 absolute top-6 left-6">Current Status</h2>
                                    <div className="absolute top-6 right-6">
                                        <span
                                            className="px-3 py-1 rounded-full text-xs font-bold bg-black/40 backdrop-blur-md"
                                            style={{ color: color, borderColor: `${color}40`, border: `1px solid ${color}40`, boxShadow: `0 0 20px ${color}20, inset 0 0 10px ${color}10` }}
                                        >
                                            <span className="inline-block w-2 h-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
                                            {data.severity?.risk_level || "Moderate"} Risk
                                        </span>
                                    </div>

                                    <div className="relative mt-8 w-56 h-56 flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadialBarChart
                                                cx="50%" cy="50%"
                                                innerRadius="70%" outerRadius="100%"
                                                barSize={15} data={radialData}
                                                startAngle={180} endAngle={0}
                                            >
                                                <RadialBar minAngle={15} cornerRadius={10} background={{ fill: '#ffffff10' }} clockWise dataKey="value" />
                                            </RadialBarChart>
                                        </ResponsiveContainer>
                                        <div className="absolute flex flex-col items-center justify-center -translate-y-4">
                                            <span className="text-5xl font-black text-white">{score}</span>
                                            <span className="text-sm text-slate-400 font-medium tracking-widest mt-1">/ 10</span>
                                        </div>
                                    </div>

                                    {/* AI Quick Insight Box */}
                                    <div className="mt-6 w-full p-4 rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/[0.05] flex items-start gap-3 relative z-10 transition-colors hover:bg-white/[0.02]">
                                        <Sparkles size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                            Based on your score, a 10-minute mindfulness session is recommended today to maintain balance.
                                        </p>
                                    </div>
                                </motion.div>

                                {/* Modality Breakdown Grid */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                                    className="grid grid-cols-2 gap-3"
                                >
                                    {[
                                        { label: 'Behaviour', icon: <Activity size={16} />, color: 'emerald', value: breakdown.behaviour },
                                        { label: 'Chat', icon: <MessageSquare size={16} />, color: 'cyan', value: breakdown.chat },
                                        { label: 'Facial', icon: <span className="text-sm">😐</span>, color: 'purple', value: breakdown.face },
                                        { label: 'Voice', icon: <span className="text-sm">🎙️</span>, color: 'yellow', value: breakdown.voice },
                                    ].map(({ label, icon, color, value }) => (
                                        <div key={label} className={`bg-white/[0.03] border border-white/[0.07] backdrop-blur-md rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.3)] p-4 flex flex-col justify-between hover:bg-white/[0.06] hover:border-${color}-500/30 transition-all duration-300 relative overflow-hidden group`}>
                                            <div className={`absolute -right-3 -top-3 w-16 h-16 bg-${color}-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-${color}-500/20 transition-colors`} />
                                            <div className={`flex items-center gap-2 text-${color}-400 mb-3 relative z-10`}>
                                                {icon}
                                                <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
                                            </div>
                                            <div className="relative z-10 flex items-end gap-1">
                                                <span className={`text-3xl font-black ${getScoreColorClass(value)}`}>{value}</span>
                                                <span className="text-sm font-medium text-slate-600 mb-0.5">/10</span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Triggers Banner */}
                                    <div className="col-span-2 bg-white/[0.02] border border-red-500/20 backdrop-blur-md transform-gpu will-change-transform rounded-3xl shadow-[0_0_30px_rgba(239,68,68,0.1)] p-4 flex items-start gap-3 overflow-hidden relative group hover:border-red-500/40 transition-colors">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 to-transparent" />
                                        <Flame size={20} className="text-red-400 flex-shrink-0 ml-2 mt-0.5" />
                                        <div className="relative z-10 w-full">
                                            <span className="block text-[10px] text-red-300/70 font-bold uppercase tracking-widest mb-2">Known Triggers</span>
                                            <div className="flex flex-wrap gap-2">
                                                {data.chat?.triggers ? (
                                                    String(data.chat.triggers).replace(/([A-Z])/g, ' $1').trim().split(',').map((t, i) => (
                                                        <span key={i} className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-xs text-red-300 capitalize text-center">
                                                            {t.trim()}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-red-100 font-medium tracking-wide">None identified</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Historical Trends */}
                            {data.historical_trends && data.historical_trends.length > 0 && (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white/[0.03] border border-white/[0.07] backdrop-blur-xl transform-gpu will-change-transform rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden p-6 md:p-8 relative transition-all duration-500 hover:border-emerald-500/30 hover:shadow-[0_0_50px_rgba(52,211,153,0.12)] group">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-bold flex items-center gap-2.5"><Activity className="text-emerald-400" size={18} /> Progress Over Time</h3>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assessment History</span>
                                    </div>

                                    {data.historical_trends.length === 1 && (
                                        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none mb-10">
                                            <div className="bg-black/60 backdrop-blur-md border border-emerald-500/30 text-emerald-200 px-6 py-3 rounded-full text-sm font-bold tracking-wide shadow-[0_0_30px_rgba(52,211,153,0.2)]">
                                                Take more assessments to unlock your progress trend line!
                                            </div>
                                        </div>
                                    )}

                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={data.historical_trends} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.6} />
                                                        <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                                    </linearGradient>
                                                    <filter id="glow">
                                                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                                        <feMerge>
                                                            <feMergeNode in="coloredBlur" />
                                                            <feMergeNode in="SourceGraphic" />
                                                        </feMerge>
                                                    </filter>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                <XAxis dataKey="date" stroke="rgba(255,255,255,0.1)" tick={{ fill: '#94a3b8', fontSize: 12 }} tickMargin={10} axisLine={false} />
                                                <YAxis domain={[0, 10]} stroke="rgba(255,255,255,0.1)" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} allowDataOverflow={true} />
                                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                                <Area type="monotone" dataKey="score" name="Severity" stroke="#34d399" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" activeDot={{ r: 8, fill: '#04100c', stroke: '#34d399', strokeWidth: 3 }} dot={{ fill: '#04100c', stroke: '#34d399', strokeWidth: 2, r: 5 }} filter="url(#glow)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </motion.div>
                            )}

                            {/* Bottom Row: Suggestions & Tasks */}
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-[0.3em]">Wellness Tools</span>
                                <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/20 to-transparent" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Smart Suggestions */}
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
                                    <h3 className="text-lg font-bold flex items-center gap-2.5"><Sparkles className="text-emerald-400" size={18} /> Smart Suggestions</h3>
                                    <div className="bg-white/[0.03] border border-white/[0.07] backdrop-blur-xl transform-gpu will-change-transform rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden p-6 space-y-3 relative min-h-[150px]">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                                        {!suggestions ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                                <Loader2 className="animate-spin mb-2" size={24} />
                                                <span className="text-sm tracking-widest uppercase text-[10px] font-bold">AI Generating Insights...</span>
                                            </div>
                                        ) : (
                                            <>
                                                {suggestions.lifestyle?.map((sug) => (
                                                    <div key={sug} className="flex gap-3 text-slate-300 text-sm bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors p-4 rounded-2xl relative z-10">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0 shadow-[0_0_8px_#34d399]" />
                                                        <span className="leading-relaxed">{sug}</span>
                                                    </div>
                                                ))}
                                                {suggestions.quotes?.[0] ? (
                                                    <div className="mt-6 pt-5 border-t border-white/[0.05] flex gap-4 text-emerald-200/80 italic text-sm relative z-10">
                                                        <Quote size={20} className="flex-shrink-0 text-emerald-500/50 fill-emerald-500/20" />
                                                        <span className="leading-relaxed font-light">"{suggestions.quotes[0]}"</span>
                                                    </div>
                                                ) : suggestions.quote && (
                                                    <div className="mt-6 pt-5 border-t border-white/[0.05] flex gap-4 text-emerald-200/80 italic text-sm relative z-10">
                                                        <Quote size={20} className="flex-shrink-0 text-emerald-500/50 fill-emerald-500/20" />
                                                        <span className="leading-relaxed font-light">"{suggestions.quote}"</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Quick Mood Check-in */}
                                    <div className="mt-6 space-y-3">
                                        <h3 className="text-lg font-bold flex items-center gap-2.5"><Smile className="text-emerald-400" size={18} /> Quick Check-in</h3>
                                        <div className="bg-white/[0.03] border border-white/[0.07] backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-6 flex flex-col justify-center">
                                            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mb-4">How are you feeling right now?</p>
                                            <div className="flex justify-between items-center">
                                                {['😫', '😟', '😐', '🙂', '🤩'].map((emoji, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => toast.success('Mood logged successfully!')}
                                                        className="w-12 h-12 flex items-center justify-center text-2xl bg-white/5 border border-white/10 rounded-full hover:scale-110 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer shadow-lg"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Daily Tasks */}
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">

                                    {/* Widget header */}
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-bold flex items-center gap-2">
                                            <CheckCircle className="text-emerald-400" size={20} />
                                            Daily Tasks
                                        </h3>
                                        <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">{currentMonthYear}</span>
                                    </div>

                                    <div className="bg-white/[0.03] border border-white/[0.07] backdrop-blur-xl transform-gpu will-change-transform rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-4 mb-3">
                                        <div className="grid grid-cols-7 gap-1 md:gap-2">
                                            {weekDays.map((d, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`flex flex-col items-center justify-center py-3 px-1 rounded-2xl transition-all ${d.isToday
                                                        ? 'bg-gradient-to-b from-[#00ff88] to-[#00cc6a] text-black shadow-[0_0_20px_rgba(0,255,136,0.3)]'
                                                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'
                                                        }`}
                                                >
                                                    <span className={`text-[10px] font-bold tracking-widest ${d.isToday ? 'text-black/60' : ''}`}>{d.dayName}</span>
                                                    <span className={`text-xl font-black mt-1 ${d.isToday ? 'text-black' : ''}`}>{d.dayNumber}</span>
                                                    {d.isToday && <span className="w-1.5 h-1.5 rounded-full bg-black mt-1.5" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white/[0.03] border border-white/[0.07] backdrop-blur-xl transform-gpu will-change-transform rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-6 md:p-8">
                                        {/* Progress bar */}
                                        {data.daily_tasks?.length > 0 && (() => {
                                            const done = data.daily_tasks.filter(t => t.completed).length
                                            const pct = Math.round((done / data.daily_tasks.length) * 100)
                                            return (
                                                <div className="mb-6">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs text-slate-400 font-medium">{done} of {data.daily_tasks.length} completed</span>
                                                        <span className="text-xs font-bold text-emerald-400">{pct}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${pct}%` }}
                                                            transition={{ duration: 0.6, ease: 'easeOut' }}
                                                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                                                            style={{ boxShadow: pct > 0 ? '0 0 8px rgba(52,211,153,0.6)' : 'none' }}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })()}

                                        {/* Timeline items */}
                                        <div className="relative">
                                            {/* Continuous left line */}
                                            <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-gradient-to-b from-emerald-500/40 via-slate-700/60 to-transparent" />

                                            <div className="space-y-3">
                                                {data.daily_tasks?.map((task, idx) => (
                                                    <motion.div
                                                        key={task.id}
                                                        layout
                                                        className="flex items-start gap-4"
                                                    >
                                                        {/* Node on the line */}
                                                        <div className="relative flex-shrink-0 z-10 mt-3.5">
                                                            <motion.button
                                                                whileTap={{ scale: 0.85 }}
                                                                onClick={() => toggleTask(task.id)}
                                                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${task.completed
                                                                    ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_16px_rgba(52,211,153,0.5)]'
                                                                    : 'border-slate-600 bg-slate-900 hover:border-emerald-500/60'
                                                                    }`}
                                                            >
                                                                {task.completed
                                                                    ? <CheckCircle size={18} className="text-emerald-400" />
                                                                    : <Circle size={18} className="text-slate-600" />
                                                                }
                                                            </motion.button>
                                                        </div>

                                                        {/* Task card */}
                                                        <motion.div
                                                            onClick={() => toggleTask(task.id)}
                                                            whileHover={{ x: 3 }}
                                                            transition={{ duration: 0.15 }}
                                                            className={`flex-1 cursor-pointer p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 ${task.completed
                                                                ? 'bg-emerald-500/[0.07] border-emerald-500/30 shadow-[0_0_20px_rgba(52,211,153,0.12)]'
                                                                : 'bg-white/[0.03] border-white/10 hover:border-emerald-500/30 hover:bg-white/[0.06]'
                                                                }`}
                                                        >
                                                            <div className="flex items-center justify-between gap-3">
                                                                <span className={`text-sm font-medium leading-snug transition-colors ${task.completed ? 'text-slate-500 line-through' : 'text-slate-200'
                                                                    }`}>
                                                                    {task.task}
                                                                </span>
                                                                {task.completed && (
                                                                    <motion.span
                                                                        initial={{ scale: 0, opacity: 0 }}
                                                                        animate={{ scale: 1, opacity: 1 }}
                                                                        className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex-shrink-0 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20"
                                                                    >
                                                                        Done ✓
                                                                    </motion.span>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                        </div>

                        {/* RIGHT COLUMN: AI Doctor Chatbot & SOS */}
                        <div className="sticky top-28 z-20 flex flex-col gap-5">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-[0.3em]">AI Support</span>
                                <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/20 to-transparent" />
                            </div>
                            <motion.div
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                                className="bg-white/[0.03] border border-white/[0.07] backdrop-blur-xl transform-gpu will-change-transform rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col h-[500px] lg:h-[calc(100vh-14rem)] lg:max-h-[650px] transition-all duration-500 hover:border-emerald-500/20"
                            >
                                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                                {/* Chat Header */}
                                <div className="p-5 bg-gradient-to-r from-white/[0.03] to-transparent border-b border-white/[0.07] flex items-center gap-4 relative z-10">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-[#0a1511] border border-emerald-500/20 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(52,211,153,0.15)]">👨‍⚕️</div>
                                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-[3px] border-[#0a1511] rounded-full shadow-[0_0_10px_#34d399]"></div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-100 text-lg tracking-wide">Dr. MindCare</h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            <span className="text-xs text-emerald-400/80 font-medium uppercase tracking-widest">AI Therapist Online</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Messages Area */}
                                <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar relative z-10 scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent hover:scrollbar-thumb-emerald-500/40">
                                    {chatMessages.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                                            <div className={`max-w-[85%] p-4 rounded-2xl text-[15px] leading-relaxed relative ${msg.role === 'assistant'
                                                ? 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-sm shadow-md backdrop-blur-md'
                                                : 'bg-emerald-500/20 text-emerald-50 border border-emerald-500/30 rounded-tr-sm shadow-[0_0_15px_rgba(52,211,153,0.1)] backdrop-blur-md'
                                                }`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))}
                                    {chatLoading && (
                                        <div className="flex justify-start">
                                            <div className="max-w-[85%] p-5 rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 backdrop-blur-md">
                                                <div className="flex gap-2">
                                                    <div className="w-2h h-2 rounded-full bg-emerald-400/50 animate-pulse" style={{ animationDelay: '0ms' }} />
                                                    <div className="w-2 h-2 rounded-full bg-emerald-400/50 animate-pulse" style={{ animationDelay: '150ms' }} />
                                                    <div className="w-2 h-2 rounded-full bg-emerald-400/50 animate-pulse" style={{ animationDelay: '300ms' }} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Chat Input */}
                                <div className="p-4 bg-black/40 border-t border-white/[0.05] shadow-[inset_0_20px_20px_-20px_rgba(0,0,0,0.5)] relative z-10">
                                    <form onSubmit={handleSendMessage} className="relative flex items-center">
                                        <input
                                            type="text"
                                            value={chatInput}
                                            onChange={e => setChatInput(e.target.value)}
                                            placeholder="Type your message..."
                                            disabled={chatLoading}
                                            className="w-full bg-white/[0.03] border border-white/10 text-slate-200 rounded-2xl pl-5 pr-14 py-4 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!chatInput.trim() || chatLoading}
                                            className="absolute right-2 p-3 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] hover:from-[#00cc6a] hover:to-[#00ff88] text-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,255,136,0.3)]"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </form>
                                </div>
                            </motion.div>

                            {/* Quick Support & SOS */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                                className="bg-white/[0.03] border border-white/[0.07] backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 flex justify-between items-center gap-3"
                            >
                                <a href="tel:18005990019" className="flex-1 py-3.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 rounded-2xl font-bold tracking-wide text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.08)] hover:shadow-[0_0_30px_rgba(244,63,94,0.2)]">
                                    <Phone size={16} /> Call Helpline
                                </a>
                                <button onClick={() => toast.success('Journal module opening soon...')} className="flex-1 py-3.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 text-cyan-400 rounded-2xl font-bold tracking-wide text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.08)] hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                                    <Book size={16} /> Log Journal
                                </button>
                            </motion.div>

                            {/* Breathing Zone */}
                            <div className="bg-white/[0.03] border border-white/[0.07] backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 text-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <span className="text-[10px] font-bold text-cyan-400/60 uppercase tracking-[0.3em] mb-2 block">Mindfulness</span>
                                <h4 className="text-slate-200 font-bold text-base mb-1">1-Minute Reset</h4>
                                <p className="text-xs text-slate-500 mb-5">Sync your breathing to the circle</p>

                                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                                    {/* Pulsing rings */}
                                    <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
                                    <div className="absolute inset-2 border-2 border-emerald-500/30 rounded-full animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]" />

                                    {/* Core circle */}
                                    <div className="relative w-16 h-16 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.4)] animate-[pulse_4s_ease-in-out_infinite] flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-black uppercase tracking-widest">Breathe</span>
                                    </div>
                                </div>
                            </div>

                            {/* Recommended Videos */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-base font-bold flex items-center gap-2"><PlayCircle className="text-emerald-400" size={16} /> Recommended</h3>
                                    <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/20 to-transparent" />
                                </div>

                                {/* Video 1 */}
                                <a
                                    href="https://www.youtube.com/watch?v=inpok4MKVLM"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl rounded-2xl p-3 flex gap-4 items-center hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all cursor-pointer group"
                                >
                                    <div className="w-28 h-16 rounded-xl relative flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-emerald-500/50 transition-colors flex-shrink-0">
                                        <img
                                            src="https://img.youtube.com/vi/inpok4MKVLM/hqdefault.jpg"
                                            alt="Meditation Thumbnail"
                                            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                                        <PlayCircle size={24} className="text-white relative z-10 drop-shadow-lg group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition-colors line-clamp-1">5-Minute Meditation You Can Do Anywhere</h4>
                                        <p className="text-xs text-emerald-500/70 mt-1">{data.severity?.risk_level || "Moderate"} Risk Suggestion</p>
                                    </div>
                                </a>

                                {/* Video 2 */}
                                <a
                                    href="https://www.youtube.com/watch?v=O-6f5wQXSu8"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl rounded-2xl p-3 flex gap-4 items-center hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all cursor-pointer group"
                                >
                                    <div className="w-28 h-16 rounded-xl relative flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-emerald-500/50 transition-colors flex-shrink-0">
                                        <img
                                            src="https://img.youtube.com/vi/O-6f5wQXSu8/hqdefault.jpg"
                                            alt="Anxiety Relief Thumbnail"
                                            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                                        <PlayCircle size={24} className="text-white relative z-10 drop-shadow-lg group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition-colors line-clamp-1">10-Minute Relief from Stress & Anxiety</h4>
                                        <p className="text-xs text-emerald-500/70 mt-1">{data.severity?.risk_level || "Moderate"} Risk Suggestion</p>
                                    </div>
                                </a>
                                {/* Video 3 */}
                                <a
                                    href="https://www.youtube.com/watch?v=8TuRYHQTrZA"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl rounded-2xl p-3 flex gap-4 items-center hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all cursor-pointer group"
                                >
                                    <div className="w-28 h-16 rounded-xl relative flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-emerald-500/50 transition-colors flex-shrink-0">
                                        <img
                                            src="https://img.youtube.com/vi/8TuRYHQTrZA/hqdefault.jpg"
                                            alt="Yoga for Stress Thumbnail"
                                            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                                        <PlayCircle size={24} className="text-white relative z-10 drop-shadow-lg group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition-colors line-clamp-1">15-Minute Relaxing Yoga for Stress</h4>
                                        <p className="text-xs text-emerald-500/70 mt-1">{data.severity?.risk_level || "Moderate"} Risk Suggestion</p>
                                    </div>
                                </a>

                                {/* Video 4 */}
                                <a
                                    href="https://www.youtube.com/watch?v=1ZYbU82GVz4"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl rounded-2xl p-3 flex gap-4 items-center hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all cursor-pointer group"
                                >
                                    <div className="w-28 h-16 rounded-xl relative flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-emerald-500/50 transition-colors flex-shrink-0">
                                        <img
                                            src="https://img.youtube.com/vi/1ZYbU82GVz4/hqdefault.jpg"
                                            alt="Deep Sleep Music Thumbnail"
                                            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                                        <PlayCircle size={24} className="text-white relative z-10 drop-shadow-lg group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition-colors line-clamp-1">Deep Sleep & Relaxation Music</h4>
                                        <p className="text-xs text-emerald-500/70 mt-1">{data.severity?.risk_level || "Moderate"} Risk Suggestion</p>
                                    </div>
                                </a>
                            </div>

                        </div>
                    </div>
                </div>
                {/* End Main Content wrapper */}

                {/* Edit Profile Modal */}
                {showEditModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0a1511] border border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-[0_40px_80px_rgba(0,0,0,0.5)] relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <button onClick={() => setShowEditModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                            <h2 className="text-3xl font-bold text-white mb-8 font-display tracking-tight">Edit Profile</h2>
                            <form onSubmit={handleEditSave} className="space-y-4">
                                <div>
                                    <label htmlFor="edit-fullname" className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                                    <input id="edit-fullname" type="text" value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500" required />
                                </div>
                                <div>
                                    <label htmlFor="edit-email" className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                                    <input id="edit-email" type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="edit-age" className="block text-sm font-medium text-slate-400 mb-1">Age</label>
                                        <input id="edit-age" type="number" value={editForm.age} onChange={e => setEditForm({ ...editForm, age: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500" required />
                                    </div>
                                    <div>
                                        <label htmlFor="edit-gender" className="block text-sm font-medium text-slate-400 mb-1">Gender</label>
                                        <select id="edit-gender" value={editForm.gender} onChange={e => setEditForm({ ...editForm, gender: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 appearance-none bg-slate-800" required>
                                            <option value="" disabled>Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                            <option value="Prefer not to say">Prefer not to say</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="edit-occupation" className="block text-sm font-medium text-slate-400 mb-1">Occupation</label>
                                    <select
                                        id="edit-occupation"
                                        value={editForm.occupation}
                                        onChange={e => setEditForm({ ...editForm, occupation: e.target.value })}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 appearance-none bg-slate-800"
                                        required
                                    >
                                        <option value="" disabled>Select Occupation</option>
                                        <option value="Accountant">Accountant</option>
                                        <option value="Doctor">Doctor</option>
                                        <option value="Engineer">Engineer</option>
                                        <option value="Lawyer">Lawyer</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Nurse">Nurse</option>
                                        <option value="Sales_person">Sales_person</option>
                                        <option value="Scientist">Scientist</option>
                                        <option value="Software Engineer">Software Engineer</option>
                                        <option value="Student">Student</option>
                                        <option value="Teacher">Teacher</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="edit-phone" className="block text-sm font-medium text-slate-400 mb-1">Phone</label>
                                        <input id="edit-phone" type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="edit-location" className="block text-sm font-medium text-slate-400 mb-1">Location</label>
                                        <input id="edit-location" type="text" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500" />
                                    </div>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors font-medium">Cancel</button>
                                    <button type="submit" className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 transition-colors font-bold">Save Changes</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </div>
        </>
    )
}
