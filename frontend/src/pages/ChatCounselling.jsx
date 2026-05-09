import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Send, AlertTriangle, CheckCircle, ArrowLeft, Trash2, Zap, Loader2, Brain, Copy, Check, ArrowDown, Square, MessageSquare } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import StepProgress from '../components/StepProgress'

export default function ChatCounselling() {
    const { user } = useAuth()
    const nav = useNavigate()
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    // Focus state for input inline styling
    const [isFocused, setIsFocused] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1500)
        return () => clearTimeout(timer)
    }, [])

    const [loading, setLoading] = useState(false)
    const [emergency, setEmergency] = useState(false)
    const [chatComplete, setChatComplete] = useState(false)
    const bottomRef = useRef(null)
    const chatContainerRef = useRef(null)
    const abortControllerRef = useRef(null)

    const [showScrollTop, setShowScrollTop] = useState(false)
    const [copiedId, setCopiedId] = useState(null)

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
        setShowScrollTop(!isNearBottom)
    }

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const handleCopy = (text, id) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const stopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            setLoading(false)
        }
    }

    const handleInputResize = (e) => {
        e.target.style.height = 'auto'
        e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            send()
        }
    }

    const [analysisResults, setAnalysisResults] = useState(null)
    const [showSummary, setShowSummary] = useState(false)

    useEffect(() => {
        api.get('/api/chat/history').then(r => {
            if (r.data.length > 0) {
                setMessages(r.data.map(m => ({ ...m, id: m.id || Date.now() })))
            } else {
                setMessages([{
                    id: 1, sender: 'bot',
                    message: `Hi ${user?.full_name || 'there'}! 👋 I'm your MindCare AI counsellor.\n\nI'm here to listen and help you. **What is your problem?**`,
                    timestamp: new Date().toISOString()
                }])
            }
        }).catch(() => {
            setMessages([{
                id: 1, sender: 'bot',
                message: `Hi ${user?.full_name}! 👋 I'm your MindCare AI counsellor. I'm here to listen and help you. What is your problem?`,
                timestamp: new Date().toISOString()
            }])
        })

        // Check if chat is already complete
        api.get('/api/chat/analysis').then(r => {
            if (r.data.stage === 'completed') {
                setChatComplete(true)
            }
        }).catch(() => { })
    }, [user?.full_name])

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

    const send = async () => {
        if (!input.trim() || loading || showSummary) return

        const userMsg = { id: Date.now(), sender: 'user', message: input.trim(), timestamp: new Date().toISOString() }
        setMessages(p => [...p, userMsg])
        const sentInput = input.trim()
        setInput('')
        setLoading(true)

        // Abort controller logic for stopping the stream
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        abortControllerRef.current = new AbortController()

        let botMsgId = null;
        try {
            const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
            const token = localStorage.getItem("mindcare_token") || localStorage.getItem("access_token");

            const response = await fetch(`${API_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: sentInput }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                const is401 = response.status === 401;
                if (is401) {
                    localStorage.removeItem("mindcare_token");
                    localStorage.removeItem("mindcare_user");
                    window.location.href = "/login";
                }
                throw new Error("HTTP Error " + response.status);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            botMsgId = Date.now() + 1;
            setMessages(p => [...p, { id: botMsgId, sender: 'bot', message: '', timestamp: new Date().toISOString() }]);
            setLoading(false);

            let accumulatedReply = "";
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split('\n\n');
                buffer = parts.pop();

                for (const ev of parts) {
                    if (ev.startsWith('data: ')) {
                        try {
                            const parsed = JSON.parse(ev.substring(6));
                            if (parsed.type === 'chunk') {
                                accumulatedReply += parsed.text;
                                setMessages(p => p.map(m => m.id === botMsgId ? { ...m, message: accumulatedReply } : m));
                            } else if (parsed.type === 'done') {
                                const finalData = parsed.final_data;
                                if (finalData?.emergency) setEmergency(true);
                                if (finalData?.stage === 'completed') setChatComplete(true);
                            }
                        } catch (err) { }
                    }
                }
            }

            if (!accumulatedReply.trim()) {
                throw new Error("Empty response received from AI service");
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Stream stopped by user');
                return;
            }
            console.error("Chat send error:", error)
            toast.error('Failed to send message. Please try again.')

            // Revert optimistic UI on failure and remove empty bot message
            setMessages(p => {
                let filtered = p.filter(m => m.id !== userMsg.id);
                if (botMsgId) {
                    filtered = filtered.filter(m => !(m.id === botMsgId && (!m.message || m.message === '')));
                }
                return [...filtered, { id: Date.now() + 2, sender: 'bot', message: "⚠️ Request failed. Please try again.", timestamp: new Date().toISOString() }];
            });
            setInput(sentInput);
        } finally {
            setLoading(false);
            abortControllerRef.current = null;
        }
    }


    const finishChat = async () => {
        setLoading(true)
        try {
            const { data } = await api.post('/api/chat/finalize')
            setAnalysisResults(data)
            setShowSummary(true)
            toast.success('Assessment complete!')
        } catch {
            toast.error('Failed to finalize assessment')
        } finally {
            setLoading(false)
        }
    }

    const formatMessage = (text) => text.split('\n').map((line, i) => {
        const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        return <p key={i} dangerouslySetInnerHTML={{ __html: boldLine || '&nbsp;' }}
            className={line === '' ? 'mb-1' : 'leading-relaxed'} />
    })

    const resetChat = async () => {
        try {
            const response = await api.delete('/api/chat/clear')
            if (response.data && response.data.success === false) {
                throw new Error("Backend failed to clear chat")
            }

            setMessages([{
                id: Date.now(),
                sender: 'bot',
                message: `Hi ${user?.full_name || 'there'}! 👋 I'm resetting our session to give us a fresh start. What would you like to talk about?`,
                timestamp: new Date().toISOString()
            }])
            setEmergency(false)
            setChatComplete(false)
            setShowSummary(false)
            setAnalysisResults(null)
            toast.success('Chat history cleared')
        } catch (err) {
            console.error("Clear chat error:", err)
            toast.error('Failed to clear chat history')
        }
    }

    const getEmotionEmoji = (text) => {
        const lower = text.toLowerCase();
        if (lower.includes('sad') || lower.includes('unhappy') || lower.includes('lonely') || lower.includes('depressed')) return '😢';
        if (lower.includes('happy') || lower.includes('glad') || lower.includes('great') || lower.includes('good')) return '😊';
        if (lower.includes('angry') || lower.includes('mad') || lower.includes('frustrat')) return '😠';
        if (lower.includes('anxious') || lower.includes('worry') || lower.includes('scared') || lower.includes('fear')) return '😰';
        return null;
    }

    const SummaryCard = ({ data }) => (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-[950px] mx-auto mt-6 bg-[#0a0f12]/80 backdrop-blur-2xl p-8 space-y-6 relative overflow-hidden group shadow-[0_0_50px_rgba(0,0,0,0.6)] border border-white/[0.04] rounded-[2rem]"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-colors duration-700 pointer-events-none" />

            <div className="flex items-center gap-4 mb-2 relative z-10">
                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <Zap size={24} className="text-emerald-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight font-display">AI Assessment Summary</h2>
                    <p className="text-[10px] text-emerald-400/80 font-black uppercase tracking-[0.2em] mt-1">Based on your conversation</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {[
                    { label: 'Problem', value: data.problem },
                    { label: 'Duration', value: data.duration },
                    { label: 'Severity', value: data.severity },
                    { label: 'Sentiment', value: data.sentiment },
                    { label: 'Risk Level', value: data.risk_level || 'Low', color: data.risk_level === 'High' ? 'text-red-400' : data.risk_level === 'Medium' ? 'text-yellow-400' : 'text-emerald-400' },
                    { label: 'Triggers', value: data.triggers?.join(', ') || 'None' },
                    { label: 'Impact on Life', value: data.impact_on_daily_life ? 'Yes' : 'No' },
                    { label: 'Emotions', value: data.emotions?.join(', ') || 'Not specified' },
                    { label: 'Physical Symptoms', value: data.physical_symptoms?.join(', ') || 'None reported' },
                    { label: 'Coping Methods', value: data.coping_strategy || 'None identified' },
                    { label: 'Support Available', value: data.support_available ? 'Yes' : 'No' }
                ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-2xl hover:bg-white/5 transition-colors group/item">
                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                        <span className={`text-sm font-bold ${item.color || 'text-white'} group-hover/item:text-emerald-400 transition-colors`}>
                            {item.value || 'N/A'}
                        </span>
                    </div>
                ))}

                {data.additional_notes && data.additional_notes.trim() !== '' && (
                    <div className="col-span-1 md:col-span-2 flex flex-col items-start p-4 bg-black/20 border border-white/5 rounded-2xl hover:bg-white/5 transition-colors group/item mt-2">
                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Additional Notes</span>
                        <span className="text-sm font-medium text-slate-200 group-hover/item:text-emerald-400 transition-colors leading-relaxed">
                            {data.additional_notes}
                        </span>
                    </div>
                )}
            </div>

            <div className="pt-4 relative z-10">
                <p className="text-xs text-slate-500 italic mb-6 text-center opacity-60">
                    "This summary is an AI-generated assessment. Please proceed to the next step for a multi-modal analysis."
                </p>
                <button
                    onClick={() => nav('/face')}
                    className="w-full py-5 text-sm font-bold uppercase tracking-widest bg-emerald-500 text-[#000000] rounded-xl shadow-[0_0_16px_rgba(0,255,136,0.35)] flex items-center justify-center gap-4 group hover:shadow-[0_0_24px_rgba(0,255,136,0.5)] transition-all"
                >
                    <span className="relative z-10 flex items-center gap-3">
                        Proceed to Next Step → Face Analysis <CheckCircle size={18} fill="currentColor" />
                    </span>
                </button>
            </div>
        </motion.div>
    )

    return (
        <>
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
                        style={{ background: '#04100c' }}
                    >
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
                            <div className="w-48 h-1 rounded-full overflow-hidden mt-2" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 1.4, ease: "easeInOut" }}
                                    className="h-full"
                                    style={{ background: '#00ff88' }}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* The root wrapper using exact inline styles from Landing */}
            <div className="relative flex flex-col items-center justify-center py-16 px-4 overflow-hidden" style={{ minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: '#04100c' }}>
                {/* The Root Background */}
                <div className="absolute inset-0 z-0 pointer-events-none print:hidden">
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(8,8,8,0.9) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 0% 50%, rgba(8,8,8,0.5) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 100% 20%, rgba(0,255,136,0.04) 0%, transparent 60%)',
                            zIndex: 0
                        }}
                        aria-hidden="true"
                    />
                </div>

                {/* Framer Motion Page Entrance */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.5 }}
                    className="w-full max-w-5xl mx-auto z-10 relative flex flex-col items-center space-y-10"
                >
                    <div className="flex flex-col gap-6 w-full">
                        <button
                            onClick={() => nav('/behaviour')}
                            className="flex items-center gap-2 text-slate-400 transition-colors text-xs font-bold uppercase tracking-widest w-fit group"
                            style={{ transition: 'color 0.3s ease' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#00ff88'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgb(148, 163, 184)'}
                        >
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Step 1 – Behaviour Analysis
                        </button>
                        {/* Premium Branded Header - SCALED UP */}
                        <div className="flex items-center justify-center gap-6 mb-6 mt-4 print:hidden">
                            <motion.div animate={{ boxShadow: ['0 0 30px rgba(0,255,136,0.3)', '0 0 80px rgba(0,255,136,0.7)', '0 0 30px rgba(0,255,136,0.3)'] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }} style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, rgba(0,255,136,0.22) 0%, rgba(0,204,106,0.07) 100%)', border: '2px solid rgba(0,255,136,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Brain size={38} style={{ color: '#00ff88' }} />
                            </motion.div>
                            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '52px', fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', background: 'linear-gradient(170deg, #ffffff 10%, #d1fae5 55%, #6ee7b7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block' }}>
                                MINDCARE AI
                            </span>
                        </div>
                        <div className="w-full flex justify-center">
                            <StepProgress current={1} />
                        </div>
                    </div>

                    <div className="text-center space-y-3">
                        <h1
                            className="text-4xl md:text-5xl tracking-tight mb-3"
                            style={{
                                fontFamily: "'Space Grotesk', sans-serif",
                                fontWeight: 900,
                                lineHeight: 0.95,
                                letterSpacing: '-0.03em',
                                background: 'linear-gradient(120deg, #00ff88 0%, #00cc6a 40%, #ffffff 70%, #00ff88 100%)',
                                backgroundSize: '250% auto',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}
                        >
                            AI Counselling Chat
                        </h1>
                        <p className="text-lg font-medium opacity-80" style={{ color: 'rgba(148,163,184,0.72)' }}>Step 2/4 — Share your thoughts in a safe and private space</p>
                        <div className="h-px w-24 mx-auto mt-4" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    </div>

                    {/* The Main Glassmorphic Chat Card - EXACT Feature card inline styles */}
                    <div className="w-full max-w-4xl mx-auto h-[80vh] flex flex-col overflow-hidden"
                        style={{ position: 'relative', zIndex: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRadius: '24px', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>

                        {/* The Chat Header */}
                        <div className="p-6 flex items-center justify-between z-10 relative" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="flex flex-col">
                                <h3 className="leading-tight flex items-center gap-2 text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: '#f0f0f0' }}>
                                    AI Counsellor
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 10px rgba(0,255,136,0.8)' }} className="animate-pulse" />
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={resetChat}
                                    className="p-2.5 rounded-xl transition-all"
                                    style={{ color: 'rgba(255,255,255,0.5)' }}
                                    onMouseEnter={e => { e.currentTarget.style.color = '#ff4d4d'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)' }}
                                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.backgroundColor = 'transparent' }}
                                    title="Reset Chat"
                                >
                                    <motion.div whileHover={{ rotate: 15 }} whileTap={{ scale: 0.9 }}>
                                        <Trash2 size={20} />
                                    </motion.div>
                                </button>
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div
                            className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-transparent relative"
                            ref={chatContainerRef}
                            onScroll={handleScroll}
                        >
                            {/* Emergency banner inside chat */}
                            <AnimatePresence>
                                {emergency && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="p-5 rounded-2xl border border-dashed"
                                        style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)', boxShadow: '0 4px 15px rgba(239,68,68,0.1)' }}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)' }}>
                                                <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                                            </div>
                                            <div>
                                                <p className="font-black text-[10px] uppercase tracking-widest mb-2" style={{ color: '#fecaca' }}>Emergency Crisis Support</p>
                                                <p className="text-xs leading-relaxed font-medium" style={{ color: 'rgba(203,213,225,0.8)' }}>
                                                    If you are in immediate danger, please reach out: <br />
                                                    <span className="font-bold" style={{ color: '#ef4444' }}>KIRAN: 1800-599-0019</span> | <span className="font-bold" style={{ color: '#ef4444' }}>iCALL: 9152987821</span>
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`flex w-full items-start ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.sender === 'bot' && (
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mr-3 mt-1">
                                            <Brain size={14} className="text-emerald-400" />
                                        </div>
                                    )}

                                    <div className={`flex flex-col w-fit max-w-[85%] md:max-w-[70%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div
                                            className="relative group transition-all duration-300"
                                            style={msg.sender === 'user'
                                                ? { background: 'linear-gradient(135deg, #00ff88, #00cc6a)', color: '#000000', borderRadius: '16px 0 16px 16px', padding: '16px 20px', fontSize: '15px', fontWeight: 500, boxShadow: '0 4px 20px rgba(0,255,136,0.15)' }
                                                : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0 16px 16px 16px', color: 'rgba(240,240,240,0.9)', padding: '16px 20px', fontSize: '15px', lineHeight: 1.6, fontWeight: 400 }
                                            }
                                        >
                                            {msg.sender === 'bot' && !loading && msg.message && (
                                                <button
                                                    onClick={() => handleCopy(msg.message, msg.id)}
                                                    className="absolute -right-12 top-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                    style={{ background: 'rgba(255,255,255,0.1)', color: copiedId === msg.id ? '#00ff88' : '#cbd5e1' }}
                                                    title="Copy Message"
                                                >
                                                    {copiedId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                                                </button>
                                            )}
                                            <div className="whitespace-pre-wrap">
                                                {msg.message ? (
                                                    formatMessage(msg.message)
                                                ) : (
                                                    msg.sender === 'bot' && (
                                                        <div className="flex gap-1.5 h-6 items-center px-1 py-1">
                                                            {[0, 0.2, 0.4].map(d => (
                                                                <motion.div key={d} className="w-1.5 h-1.5 rounded-full"
                                                                    style={{ background: '#00ff88' }}
                                                                    animate={{ y: [0, -4, 0] }}
                                                                    transition={{ duration: 0.6, repeat: Infinity, delay: d }} />
                                                            ))}
                                                        </div>
                                                    )
                                                )}
                                            </div>

                                            {msg.sender === 'user' && getEmotionEmoji(msg.message) && (
                                                <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    {getEmotionEmoji(msg.message)}
                                                </div>
                                            )}
                                        </div>
                                        <div className={`mt-2 flex items-center gap-2 text-[10px] tabular-nums ${msg.sender === 'user' ? 'justify-end pr-1' : 'justify-start pl-1'}`} style={{ opacity: 0.4, fontWeight: 400 }}>
                                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            {msg.sender === 'user' && <CheckCircle size={10} style={{ color: '#00ff88' }} />}
                                        </div>
                                    </div>

                                    {msg.sender === 'user' && (
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center ml-3 mt-1">
                                            <span className="text-xs font-bold text-white">{user?.full_name?.charAt(0) || 'U'}</span>
                                        </div>
                                    )}
                                </motion.div>
                            ))}

                            {loading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start items-start">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mr-3 mt-1">
                                        <Brain size={14} className="text-emerald-400" />
                                    </div>
                                    <div className="flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0 16px 16px 16px', padding: '16px 20px' }}>
                                        <div className="flex gap-1.5 h-3 items-center">
                                            {[0, 0.2, 0.4].map(d => (
                                                <motion.div key={d} className="w-2 h-2 rounded-full"
                                                    style={{ background: '#00ff88' }}
                                                    animate={{ y: [0, -6, 0] }}
                                                    transition={{ duration: 0.6, repeat: Infinity, delay: d }} />
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={bottomRef} />

                            {/* Floating Scroll to Bottom Button */}
                            <AnimatePresence>
                                {showScrollTop && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        onClick={scrollToBottom}
                                        className="absolute bottom-6 right-8 p-3 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 z-20"
                                        style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
                                    >
                                        <ArrowDown size={18} />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* The Input Area */}
                        <div className="px-6 py-5 relative z-10 bg-transparent flex items-end gap-4 w-full" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <textarea
                                value={input}
                                onChange={e => { setInput(e.target.value); handleInputResize(e); }}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                placeholder="Describe how you're feeling today..."
                                className="w-full rounded-xl px-5 py-4 flex-1 outline-none transition-all resize-none custom-scrollbar"
                                style={{
                                    background: 'rgba(0,0,0,0.5)',
                                    border: isFocused ? '1px solid #00ff88' : '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    fontSize: '14px',
                                    lineHeight: '1.5',
                                    minHeight: '52px',
                                    boxShadow: isFocused ? '0 0 0 1px #00ff88' : 'none',
                                    overflowY: 'auto'
                                }}
                                disabled={loading || showSummary}
                                rows={1}
                            />
                            {loading && !showSummary ? (
                                <motion.button
                                    onClick={stopGeneration}
                                    className="p-4 rounded-xl transition-all flex items-center justify-center flex-shrink-0"
                                    style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)', height: '52px' }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = '#ef4444'
                                        e.currentTarget.style.color = '#ffffff'
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
                                        e.currentTarget.style.color = '#ef4444'
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    title="Stop generating"
                                >
                                    <Square fill="currentColor" size={20} />
                                </motion.button>
                            ) : (
                                <motion.button
                                    onClick={send}
                                    disabled={!input.trim() || showSummary}
                                    className="p-4 rounded-xl transition-all flex items-center justify-center flex-shrink-0"
                                    style={(!input.trim() || showSummary)
                                        ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', height: '52px' }
                                        : { background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.4)', color: '#00ff88', boxShadow: '0 0 15px rgba(0,255,136,0.3)', height: '52px' }
                                    }
                                    onMouseEnter={e => {
                                        if (input.trim() && !showSummary) {
                                            e.currentTarget.style.background = '#00ff88'
                                            e.currentTarget.style.color = '#000000'
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (input.trim() && !showSummary) {
                                            e.currentTarget.style.background = 'rgba(0,255,136,0.15)'
                                            e.currentTarget.style.color = '#00ff88'
                                        }
                                    }}
                                    whileHover={input.trim() && !showSummary ? { scale: 1.05 } : {}}
                                    whileTap={input.trim() && !showSummary ? { scale: 0.95 } : {}}
                                >
                                    <Send size={20} fill={input.trim() && !showSummary ? "currentColor" : "none"} />
                                </motion.button>
                            )}
                        </div>

                    </div>

                    {/* Bottom Action */}
                    <AnimatePresence>
                        {(messages.length >= 8 || chatComplete) && !showSummary && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex justify-center w-full max-w-4xl pt-4"
                            >
                                <button
                                    onClick={finishChat}
                                    className="w-full max-w-sm py-5 text-sm uppercase tracking-widest rounded-xl flex items-center justify-center gap-4 group transition-all"
                                    style={{ background: 'linear-gradient(135deg, #00ff88, #00cc6a)', color: '#000000', fontWeight: 800, boxShadow: '0 8px 25px rgba(0,255,136,0.3)' }}
                                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 30px rgba(0,255,136,0.5)'}
                                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,255,136,0.3)'}
                                >
                                    <span className="relative z-10 flex items-center gap-3">
                                        Done Chatting <Zap size={18} fill="currentColor" />
                                    </span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Summary Card Display */}
                    <AnimatePresence>
                        {showSummary && analysisResults && (
                            <div className="w-full max-w-4xl">
                                <SummaryCard data={analysisResults} />
                            </div>
                        )}
                    </AnimatePresence>

                </motion.div>
            </div>
        </>
    )
}
