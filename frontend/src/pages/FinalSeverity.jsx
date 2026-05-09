import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, PhoneCall, CheckCircle, ChevronDown, Sparkles, Brain } from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import API from '../api'
import toast from 'react-hot-toast'
import StepProgress from '../components/StepProgress'

export default function FinalSeverity() {
    const nav = useNavigate()
    const [data, setData] = useState(null)
    const [loadStage, setLoadStage] = useState(1) // 1 = success, 2 = calculating, 3 = ready to unblock
    const [apiDataReady, setApiDataReady] = useState(false)
    const [emergency, setEmergency] = useState(false)
    const [acknowledged, setAcknowledged] = useState(false)
    const [counter, setCounter] = useState(0)
    const [expandedCard, setExpandedCard] = useState(null)

    useEffect(() => {
        // Stage 1 -> Stage 2 (Show Success for 2.5s)
        const timer1 = setTimeout(() => setLoadStage(2), 2500)
        // Stage 2 -> Stage 3 (Force Processing Spinner for another 2s)
        const timer2 = setTimeout(() => setLoadStage(3), 4500) // 2.5s + 2.0s
        return () => { clearTimeout(timer1); clearTimeout(timer2); }
    }, [])

    useEffect(() => {
        // Parallel API Fetch
        API.get('/final-severity').then(r => {
            setData(r.data);
            setEmergency(r.data.emergency);
            setApiDataReady(true);
            
            // Animate counter
            let n = 0
            const iv = setInterval(() => {
                n = Math.min(n + 0.5, r.data.final_severity)
                setCounter(Math.round(n))
                if (n >= r.data.final_severity) clearInterval(iv)
            }, 80)
        }).catch(() => { 
            setApiDataReady(true);
            toast.error('Failed to calculate severity') 
        })
    }, [])

    const RISK_COLOR = { Low: '#10B981', Moderate: '#F59E0B', High: '#EF4444' }
    const color = data ? RISK_COLOR[data.risk_level] : '#6366F1'

    // Strict Conditional Rendering for the chained loader
    // Stage 1: Show the Green Success Tick for the first 2.5 seconds
    if (loadStage === 1) {
        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center"
                    style={{ background: '#04100c' }} // Dark premium bg
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
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
                            <div className="text-center">
                            <p className="text-slate-400 text-sm font-medium tracking-wide">
                                Analyzing multimodal data...
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    }

    // Stage 2: Force the Processing Spinner. 
    // Show this if we are forcibly in Stage 2, OR if we arrived at Stage 3 but the API isn't back yet.
    if (loadStage === 2 || !apiDataReady) {
        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key="calculating"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center"
                    style={{ background: '#04100c' }} // Dark premium bg
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center flex flex-col items-center gap-6"
                    >
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-[#00ff88]/20 border-t-[#00ff88] rounded-full animate-spin" style={{ boxShadow: '0 0 30px rgba(0,255,136,0.2)' }} />
                        </div>
                        <p className="text-slate-300 font-medium tracking-widest uppercase text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                            Processing Multimodal Severity Score...
                        </p>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    }

    return (
        <div className="min-h-screen bg-[#04100c] text-slate-200 font-sans relative overflow-x-hidden">
            {/* 1. The 3D Wave Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
            </div>

            {/* 2. The Dark Gradient Overlay (for depth) */}
            <div className="fixed inset-0 z-[1] pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#04100c_80%)] opacity-80" />

            {/* 3. The Main Content (Must be z-10 and relative) */}
            <div className="relative z-10 flex flex-col items-center justify-start pt-12 pb-24 px-4 min-h-screen">
                <div className="w-full max-w-3xl mx-auto space-y-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
                        {/* Premium Branded Header - SCALED UP */}
                        <div className="flex items-center justify-center gap-6 mb-6 mt-4 print:hidden w-full">
                            <motion.div animate={{ boxShadow: ['0 0 30px rgba(0,255,136,0.3)', '0 0 80px rgba(0,255,136,0.7)', '0 0 30px rgba(0,255,136,0.3)'] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }} style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, rgba(0,255,136,0.22) 0%, rgba(0,204,106,0.07) 100%)', border: '2px solid rgba(0,255,136,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Brain size={38} style={{ color: '#00ff88' }} />
                            </motion.div>
                            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '52px', fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', background: 'linear-gradient(170deg, #ffffff 10%, #d1fae5 55%, #6ee7b7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block' }}>
                                MINDCARE AI
                            </span>
                        </div>
                        <div className="text-center mb-10">
                            <h1 className="font-display tracking-tight text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 text-center mb-2">
                                Final Assessment
                            </h1>
                            <p className="text-slate-400 text-center text-sm md:text-base mb-8">Combined multimodal severity score analyzed.</p>
                        </div>
                    </motion.div>

                    {data && (
                        <div className="space-y-6">
                            {/* User Profile */}
                            {data.user_profile && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                                    className="bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-xl font-bold tracking-wide">{data.user_profile.name}</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold border border-white/5">{data.user_profile.age} YRS</span>
                                            <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold border border-white/5">{data.user_profile.gender}</span>
                                        </div>
                                    </div>
                                    <div className="md:text-right">
                                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] uppercase tracking-[0.2em] font-bold border border-emerald-500/20">{data.user_profile.occupation}</span>
                                    </div>
                                </motion.div>
                            )}

                            {/* Big gauge */}
                            <motion.div 
                                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                className="bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden p-8 md:p-12 text-center"
                            >
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-[rgba(255,255,255,0.03)] to-transparent pointer-events-none" />
                                
                                <div className="relative inline-block w-56 h-56 mb-8 mt-4">
                                    {/* Circular gauge */}
                                    <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90 drop-shadow-2xl">
                                        <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                                        <motion.circle cx="60" cy="60" r="50" fill="none"
                                            stroke={color} strokeWidth="8" strokeLinecap="round"
                                            strokeDasharray={`${(data.final_severity / 10) * 314} 314`}
                                            initial={{ strokeDasharray: '0 314' }}
                                            animate={{ strokeDasharray: `${(data.final_severity / 10) * 314} 314` }}
                                            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }} 
                                            style={{ filter: `drop-shadow(0 0 10px ${color})` }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-6xl font-bold tracking-tighter" style={{ color, textShadow: `0 0 20px ${color}80` }}>
                                            {counter}
                                        </span>
                                        <span className="text-slate-500 text-sm font-medium tracking-widest mt-1">/ 10</span>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col items-center justify-center gap-6">
                                    <div className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-bold tracking-widest uppercase border bg-black/40 backdrop-blur-md"
                                        style={{ borderColor: `${color}40`, color: color, boxShadow: `0 0 30px ${color}20, inset 0 0 10px ${color}10` }}>
                                        <span className="w-2 h-2 rounded-full mr-3 animate-pulse" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
                                        {data.risk_level} Risk Detected
                                    </div>
                                </div>
                            </motion.div>

                            {/* AI Counsellor Insight (Dynamic Recommendations & Note) */}
                            <motion.div 
                                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                className="bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden p-8 group hover:bg-white/[0.04] transition-colors"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Sparkles size={100} className="text-indigo-400" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                                            <Sparkles size={20} className="text-indigo-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-indigo-100 tracking-wide">AI Counsellor Insight</h3>
                                    </div>

                                    {data.summary_note && (
                                        <div className="mb-8 p-6 bg-[#0a0f12]/80 border-l-4 border-cyan-500 rounded-r-3xl relative overflow-hidden shadow-inner flex items-center">
                                            <div className="absolute top-1/2 left-10 -translate-y-1/2 w-32 h-32 bg-cyan-500/10 blur-[40px] rounded-full pointer-events-none" />
                                            <p className="relative z-10 text-slate-300 text-lg italic leading-relaxed font-light">"{data.summary_note}"</p>
                                        </div>
                                    )}

                                    {data.detailed_records && data.detailed_records.recommendations && (
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold text-indigo-400/80 uppercase tracking-widest mb-4">Recommended Actions</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {(Array.isArray(data.detailed_records.recommendations) 
                                                    ? data.detailed_records.recommendations 
                                                    : typeof data.detailed_records.recommendations === 'string'
                                                        ? (() => {
                                                            try { return JSON.parse(data.detailed_records.recommendations); }
                                                            catch(e) { return data.detailed_records.recommendations.split(/[.-]\s+/).filter(Boolean); }
                                                        })()
                                                        : []
                                                ).map((rec, idx) => (
                                                    <div key={idx} className="flex items-start gap-3 bg-white/[0.03] p-4 rounded-xl border border-white/5 hover:bg-white/[0.05] transition-colors">
                                                        <CheckCircle size={18} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                                                        <span className="text-slate-300 text-sm leading-relaxed">{rec}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Score breakdown Accordions */}
                            <motion.div 
                                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                className="grid grid-cols-1 gap-4"
                            >
                                {[
                                    ['🧠 Behaviour Model', data.behaviour_score, 'bg-cyan-500', 'shadow-[0_0_15px_#06b6d4]', 'behaviour', data.detailed_records?.behaviour],
                                    ['💬 Conversational AI', data.chat_score, 'bg-emerald-500', 'shadow-[0_0_15px_#10b981]', 'chat', data.detailed_records?.chat],
                                    ['😐 Facial Emotion', data.face_score, 'bg-purple-500', 'shadow-[0_0_15px_#a855f7]', 'face', data.detailed_records?.face],
                                    ['🎙️ Voice Analysis', data.voice_score, 'bg-amber-500', 'shadow-[0_0_15px_#f59e0b]', 'voice', data.detailed_records?.voice]
                                ].map(([label, score, bgClass, shadowClass, key, details]) => {
                                    const isExpanded = expandedCard === key;
                                    return (
                                        <div key={label} className={`bg-white/[0.03] border backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden transition-all duration-300 hover:bg-white/[0.04] hover:border-white/10 ${isExpanded ? 'border-white/20' : 'border-white/10'}`}>
                                            {/* Header */}
                                            <div
                                                className="p-5 cursor-pointer flex items-center justify-between"
                                                onClick={() => setExpandedCard(isExpanded ? null : key)}
                                            >
                                                <div className="flex-1 mr-6">
                                                    <div className="font-bold text-slate-200 mb-3 flex items-center justify-between tracking-wide">
                                                        <span>{label}</span>
                                                        <span className="text-white bg-white/5 px-2.5 py-1 rounded-md text-xs border border-white/10">{score}/10</span>
                                                    </div>
                                                    <div className="h-1.5 bg-black/40 rounded-full overflow-hidden w-full relative">
                                                        <motion.div className={`absolute top-0 left-0 h-full rounded-full ${bgClass} ${shadowClass}`}
                                                            initial={{ width: 0 }} animate={{ width: `${(score / 10) * 100}%` }} transition={{ duration: 1.5, ease: "easeOut" }} />
                                                    </div>
                                                </div>
                                                <div className={`p-2 rounded-full bg-white/5 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-white/10' : ''}`}>
                                                    <ChevronDown size={20} className="text-slate-400" />
                                                </div>
                                            </div>

                                            {/* Body */}
                                            <AnimatePresence>
                                                {isExpanded && details && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="border-t border-white/[0.05] bg-black/20 overflow-hidden"
                                                    >
                                                        {Object.keys(details || {}).length > 0 ? (
                                                            <div className="p-6 text-sm text-slate-300 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-6">
                                                                {Object.entries(details).filter(([k]) => k !== 'recommendations' && k !== 'notes').map(([k, v]) => {
                                                                    let displayValue = v;
                                                                    
                                                                    // Format arrays smoothly
                                                                    if (Array.isArray(v)) {
                                                                        displayValue = v.join(', ');
                                                                    } 
                                                                    // Format JSON strings smoothly
                                                                    else if (typeof v === 'string' && (v.startsWith('{') || v.startsWith('['))) {
                                                                        try {
                                                                            const parsed = JSON.parse(v);
                                                                            if (Array.isArray(parsed)) displayValue = parsed.join(', ');
                                                                            else if (typeof parsed === 'object') displayValue = Object.entries(parsed).map(([pk, pv]) => `${pk}: ${pv}`).join(' | ');
                                                                        } catch(e) {}
                                                                    } else if (typeof v === 'object' && v !== null) {
                                                                         displayValue = Object.entries(v).map(([pk, pv]) => `${pk}: ${pv}`).join(' | ');
                                                                    }

                                                                    const colSpan = String(displayValue).length > 40 ? 'col-span-1 md:col-span-2 lg:col-span-3' : '';

                                                                    return (
                                                                        <div key={k} className={`flex flex-col ${colSpan}`}>
                                                                            <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-1.5">{k.replace(/_/g, ' ')}</span>
                                                                            {String(displayValue).length > 60 ? (
                                                                                 <span className="block p-3 bg-black/40 rounded-lg border border-white/5 text-slate-300 text-sm leading-relaxed">{displayValue}</span>
                                                                            ) : (
                                                                                 <span className="font-semibold text-slate-200 capitalize tracking-wide">{String(displayValue)}</span>
                                                                            )}
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div className="p-6 text-slate-500 text-sm italic text-center">
                                                                Detailed telemetry for this module is currently unavailable.
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )
                                })}
                            </motion.div>

                            {/* Emergency modal */}
                            <AnimatePresence>
                                {emergency && (
                                    <motion.div className="bg-red-950/40 border border-red-500/50 backdrop-blur-xl rounded-2xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
                                        initial={{ scale: 0.95, opacity: 0 }} 
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: 'spring', stiffness: 300 }}
                                    >
                                        <div className="flex items-center gap-4 mb-5">
                                            <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/30">
                                                <AlertTriangle size={24} className="text-red-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-red-400 font-bold text-lg tracking-wide">Immediate Support Recommended</h3>
                                                <p className="text-red-200/70 text-sm">High risk indicators detected. Please reach out for professional help.</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                                            <a href="tel:18005990019" className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10 transition-all text-sm text-slate-200">
                                                <PhoneCall size={16} className="text-red-400 flex-shrink-0" />
                                                <span>KIRAN <strong className="block text-red-400">1800-599-0019</strong></span>
                                            </a>
                                            <a href="tel:9152987821" className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10 transition-all text-sm text-slate-200">
                                                <PhoneCall size={16} className="text-red-400 flex-shrink-0" />
                                                <span>iCALL <strong className="block text-red-400">9152987821</strong></span>
                                            </a>
                                            <a href="tel:112" className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10 transition-all text-sm text-slate-200">
                                                <PhoneCall size={16} className="text-red-400 flex-shrink-0" />
                                                <span>Emergency <strong className="block text-red-400">112</strong></span>
                                            </a>
                                        </div>
                                        <label className="flex items-center gap-3 cursor-pointer p-3 bg-red-950/50 rounded-lg border border-red-500/20">
                                            <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)}
                                                className="w-5 h-5 accent-red-500 bg-black/50 border-red-500/30 rounded focus:ring-red-500/50" />
                                            <span className="text-sm text-red-200/80 font-medium">I understand and will seek professional support if needed</span>
                                        </label>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {data.risk_level === 'Low' && (
                                <motion.div className="bg-emerald-950/30 border border-emerald-500/30 backdrop-blur-xl rounded-2xl p-6 text-center shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                    <div className="w-16 h-16 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-3">
                                        <CheckCircle size={32} className="text-emerald-400" />
                                    </div>
                                    <h3 className="text-emerald-400 font-bold text-lg mb-1 tracking-wide">Rest & Recovery Optimized</h3>
                                    <p className="text-emerald-200/70 text-sm">Baseline telemetry indicates low stress. Continue maintaining your current behavioral patterns.</p>
                                </motion.div>
                            )}

                            <div className="pt-6">
                                <motion.button onClick={() => nav('/dashboard')}
                                    disabled={emergency && !acknowledged}
                                    className={`w-full py-5 rounded-2xl text-lg flex items-center justify-center gap-3 transition-all duration-300
                                                ${emergency && !acknowledged 
                                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                                                    : 'bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-bold uppercase tracking-widest hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] shadow-[0_0_20px_rgba(0,255,136,0.2)]'
                                                }`}
                                    whileHover={emergency && !acknowledged ? {} : { scale: 1.01 }}
                                    whileTap={emergency && !acknowledged ? {} : { scale: 0.98 }}>
                                    {emergency && !acknowledged ? 'Acknowledge Notice to Proceed' : 'Initialize Dashboard'}
                                </motion.button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
