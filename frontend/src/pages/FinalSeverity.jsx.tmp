import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, PhoneCall, CheckCircle, ChevronDown, Sparkles } from 'lucide-react'
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
                        <div className="relative flex items-center justify-center w-32 h-32">
                            {/* Subtle pulsing background halo */}
                            <motion.div 
                                className="absolute inset-0 rounded-full"
                                style={{ background: 'rgba(0, 255, 136, 0.1)' }}
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                            {/* The Tick */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                            >
                                <CheckCircle className="w-20 h-20 text-[#00ff88]" style={{ filter: 'drop-shadow(0 0 20px rgba(0,255,136,0.6))' }} />
                            </motion.div>
                        </div>
                        <div className="text-center">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                                All Tests Completed Successfully
                            </h2>
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
        <div className="min-h-screen bg-[#04100c] text-white font-sans overflow-x-hidden relative selection:bg-emerald-500/30">
            {/* Background elements to match Landing page */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[#04100c]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,136,0.05),transparent_50%)]" />
                <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-[#00ff88]/20 to-transparent" />
            </div>

            <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-12 md:py-20">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
                    <div className="text-center mb-10">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                            Final Assessment
                        </h1>
                        <p className="text-slate-400 tracking-wide">Combined multimodal severity score analyzed.</p>
                    </div>

                    {data && (
                        <div className="space-y-6">
                            {/* User Profile */}
                            {data.user_profile && (
                                <div className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-2xl rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-xl font-bold tracking-wide">{data.user_profile.name}</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-300 text-xs tracking-wider uppercase border border-white/5">{data.user_profile.age} yrs</span>
                                            <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-300 text-xs tracking-wider uppercase border border-white/5">{data.user_profile.gender}</span>
                                        </div>
                                    </div>
                                    <div className="md:text-right">
                                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium tracking-wide border border-emerald-500/20">{data.user_profile.occupation}</span>
                                    </div>
                                </div>
                            )}

                            {/* Big gauge */}
                            <div className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-2xl rounded-3xl p-8 md:p-12 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
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
                            </div>

                            {/* AI Counsellor Insight (Dynamic Recommendations & Note) */}
                            <div className="bg-gradient-to-br from-indigo-900/20 to-blue-900/10 border border-indigo-500/20 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
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
                                        <div className="mb-8 p-6 bg-black/40 border-l-4 border-l-indigo-500 rounded-r-xl shadow-inner">
                                            <p className="text-slate-300 text-lg italic leading-relaxed font-light">"{data.summary_note}"</p>
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
                            </div>

                            {/* Score breakdown Accordions */}
                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    ['🧠 Behaviour Model', data.behaviour_score, 'bg-cyan-500', 'shadow-[0_0_15px_#06b6d4]', 'behaviour', data.detailed_records?.behaviour],
                                    ['💬 Conversational AI', data.chat_score, 'bg-emerald-500', 'shadow-[0_0_15px_#10b981]', 'chat', data.detailed_records?.chat],
                                    ['😐 Facial Emotion', data.face_score, 'bg-purple-500', 'shadow-[0_0_15px_#a855f7]', 'face', data.detailed_records?.face],
                                    ['🎙️ Voice Analysis', data.voice_score, 'bg-amber-500', 'shadow-[0_0_15px_#f59e0b]', 'voice', data.detailed_records?.voice]
                                ].map(([label, score, bgClass, shadowClass, key, details]) => {
                                    const isExpanded = expandedCard === key;
                                    return (
                                        <div key={label} className={`bg-white/[0.02] border backdrop-blur-xl rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'border-white/20' : 'border-white/[0.05] hover:border-white/10'}`}>
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

                                })}
                            </div>

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
                </motion.div>
            </div>
        </div>

}
