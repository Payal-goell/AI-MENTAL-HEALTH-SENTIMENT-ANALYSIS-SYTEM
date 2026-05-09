import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Mic, StopCircle, RefreshCw, ArrowLeft, Brain } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import API from '../api'
import toast from 'react-hot-toast'
import StepProgress from '../components/StepProgress'

// True PCM WAV Encoder to satisfy backend ML requirements
const interleave = (inputL, inputR) => {
    const length = inputL.length + inputR.length;
    const result = new Float32Array(length);
    let index = 0, inputIndex = 0;
    while (index < length) {
        result[index++] = inputL[inputIndex];
        result[index++] = inputR[inputIndex];
        inputIndex++;
    }
    return result;
}

const encodeWAV = (samples, format, sampleRate, numChannels, bitDepth) => {
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
    const view = new DataView(buffer);

    const writeString = (view, offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * bytesPerSample, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * bytesPerSample, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return new Blob([view], { type: 'audio/wav' });
}

const audioBufferToWav = (buffer) => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    let result;
    if (numChannels === 2) {
        result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
    } else {
        result = buffer.getChannelData(0);
    }
    return encodeWAV(result, format, sampleRate, numChannels, bitDepth);
}

const RECORD_SECONDS = 15
const STRESS_COLOR = { Low: '#10B981', Medium: '#F59E0B', High: '#EF4444' }

export default function VoiceAnalysis() {
    const nav = useNavigate()
    const [recording, setRecording] = useState(false)
    const [countdown, setCountdown] = useState(RECORD_SECONDS)
    const [audioBlob, setAudioBlob] = useState(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [activeTab, setActiveTab] = useState('live') // 'live' or 'upload'

    // Web Audio API states
    const [audioData, setAudioData] = useState(new Array(24).fill(6))
    const [vocalStatus, setVocalStatus] = useState("Listening...")
    const [statusColor, setStatusColor] = useState("text-slate-400")

    // Inline preloader — same 1.5s pattern as Face Emotion page
    const [isLoading, setIsLoading] = useState(true)
    React.useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1500)
        return () => clearTimeout(timer)
    }, [])

    const mediaRecRef = useRef(null)
    const chunksRef = useRef([])
    const authContextRef = useRef(null)
    const analyserRef = useRef(null)
    const animationRef = useRef(null)

    // Cleanup Web Audio handles safely
    const cleanupAudioBlocks = () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
        if (authContextRef.current && authContextRef.current.state !== 'closed') {
            authContextRef.current.close().catch(() => { })
        }
        setAudioData(new Array(24).fill(6))
        setVocalStatus("Listening...")
        setStatusColor("text-slate-400")
    }

    React.useEffect(() => {
        return () => cleanupAudioBlocks()
    }, [])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    autoGainControl: false,
                    noiseSuppression: false,
                    channelCount: 1 // Mono audio is best for Librosa/CNN models
                }
            })
            chunksRef.current = []

            // 1. Setup Web Audio API
            const AudioContext = window.AudioContext || window.webkitAudioContext
            authContextRef.current = new AudioContext()
            analyserRef.current = authContextRef.current.createAnalyser()
            const source = authContextRef.current.createMediaStreamSource(stream)
            source.connect(analyserRef.current)
            analyserRef.current.fftSize = 64 // 32 frequency bins
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

            // 2. Loop & sample Data
            const drawWaveform = () => {
                if (!analyserRef.current) return
                analyserRef.current.getByteFrequencyData(dataArray)

                // Keep 24 items for our 24 bars
                const mappedData = Array.from(dataArray).slice(0, 24).map(val => Math.max(6, (val / 255) * 50))
                setAudioData(mappedData)

                // 3. Vocal Energy Heuristic Calculation
                const avgVolume = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length
                const percent = (avgVolume / 255) * 100

                if (percent > 60) {
                    setVocalStatus("High Energy / Potential Stress detected...")
                    setStatusColor("text-red-400")
                } else if (percent > 30) {
                    setVocalStatus("Normal Conversational Tone...")
                    setStatusColor("text-cyan-400")
                } else if (percent > 5) {
                    setVocalStatus("Calm / Quiet Tone...")
                    setStatusColor("text-green-400")
                } else {
                    setVocalStatus("Listening...")
                    setStatusColor("text-slate-400")
                }

                animationRef.current = requestAnimationFrame(drawWaveform)
            }
            drawWaveform()

            // Original Media Recorder logic
            const mr = new MediaRecorder(stream)
            mr.ondataavailable = e => chunksRef.current.push(e.data)
            mr.onstop = async () => {
                const tempBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
                try {
                    const arrayBuffer = await tempBlob.arrayBuffer()
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
                    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
                    const wavBlob = audioBufferToWav(audioBuffer)
                    setAudioBlob(wavBlob)
                } catch (err) {
                    console.error("WAV conversion failed", err)
                    setAudioBlob(tempBlob) // fallback
                }
                stream.getTracks().forEach(t => t.stop())
                cleanupAudioBlocks()
            }
            mediaRecRef.current = mr
            mr.start()
            setRecording(true); setCountdown(RECORD_SECONDS)

            let sec = RECORD_SECONDS
            const iv = setInterval(() => {
                sec--; setCountdown(sec)
                if (sec <= 0) { clearInterval(iv); mr.stop(); setRecording(false) }
            }, 1000)
        } catch {
            toast.error('Microphone permission denied')
        }
    }

    const stopRecording = () => {
        mediaRecRef.current?.stop();
        setRecording(false);
    }

    const upload = async () => {
        if (!audioBlob) return
        setLoading(true)
        const fd = new FormData()
        fd.append('audio', audioBlob, 'voice.wav')
        try {
            const { data } = await API.post('/voice/analyse', fd)
            setResult(data)
            toast.success('Voice analysis complete!')
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Analysis failed')
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (event) => {
        const file = event.target.files[0]
        if (!file) return

        try {
            const arrayBuffer = await file.arrayBuffer()
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)

            // Use the existing audioBufferToWav utility to encode it
            const wavBlob = audioBufferToWav(audioBuffer)
            setAudioBlob(wavBlob)
            toast.success("File processed! Click Analyze Voice to detect stress.")
        } catch (err) {
            console.error("Upload error:", err)
            toast.error("Could not process this audio file. Please try a standard MP3 or WAV file.")
        }
    }

    const handleRetry = () => {
        setResult(null)
        setAudioBlob(null)
        setCountdown(RECORD_SECONDS)
        setAudioData(new Array(24).fill(6))
        setVocalStatus("Listening...")
        setStatusColor("text-slate-400")
    }

    const bars = result ? [{ name: 'Confidence', value: parseFloat((result.confidence * 100).toFixed(1)), fill: '#00F5FF' }] : []

    return (
        <>
            {/* ── 1.5s Inline Preloader ── */}
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

            {/* ── Root Wrapper with Hero Background ── */}
            <div
                className="min-h-screen text-slate-200 font-sans selection:bg-emerald-500/30 overflow-x-hidden relative flex flex-col pt-24 pb-12"
                style={{ minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: '#04100c' }}
            >
                {/* Dark radial-gradient overlay */}
                <div
                    className="fixed inset-0 z-0 pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle at 50% 0%, rgba(0, 255, 136, 0.08) 0%, transparent 70%), radial-gradient(circle at 80% 80%, rgba(0, 204, 106, 0.05) 0%, transparent 50%)',
                    }}
                />


                <div className="fixed inset-0 z-[1] bg-black/40 pointer-events-none" />

                {/* Noise/gradient overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(8,8,8,0.9) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 0% 50%, rgba(8,8,8,0.5) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 100% 20%, rgba(0,255,136,0.04) 0%, transparent 60%)',
                        zIndex: 0
                    }}
                    aria-hidden="true"
                />

                {/* Page content — delayed entrance to play after preloader */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.5 }}
                    className="w-full max-w-4xl mx-auto z-10 relative flex flex-col items-center space-y-10 px-4"
                >
                    {/* Back button + Step Progress */}
                    <div className="flex flex-col gap-6 w-full">
                        {/* Premium Branded Header - SCALED UP */}
                        <div className="flex items-center justify-center gap-6 mb-2 mt-4 print:hidden w-full">
                            <motion.div animate={{ boxShadow: ['0 0 30px rgba(0,255,136,0.3)', '0 0 80px rgba(0,255,136,0.7)', '0 0 30px rgba(0,255,136,0.3)'] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }} style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, rgba(0,255,136,0.22) 0%, rgba(0,204,106,0.07) 100%)', border: '2px solid rgba(0,255,136,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Brain size={38} style={{ color: '#00ff88' }} />
                            </motion.div>
                            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '52px', fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', background: 'linear-gradient(170deg, #ffffff 10%, #d1fae5 55%, #6ee7b7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block' }}>
                                MINDCARE AI
                            </span>
                        </div>
                        <button
                            onClick={() => nav('/face')}
                            className="flex items-center gap-2 text-slate-400 transition-colors text-xs font-bold uppercase tracking-widest w-fit group"
                            style={{ transition: 'color 0.3s ease' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#00ff88'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgb(148, 163, 184)'}
                        >
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Step 3 – Facial Analysis
                        </button>
                        <div className="w-full max-w-4xl mx-auto mb-8 px-4">
                            <StepProgress current={3} />
                        </div>
                    </div>

                    {/* Heading */}
                    <div className="text-center space-y-3 w-full">
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
                            Voice Stress Analysis
                        </h1>
                        <p className="text-lg font-medium opacity-80" style={{ color: 'rgba(148,163,184,0.72)' }}>
                            Step 4/4 — 15-second voice recording for stress detection
                        </p>
                        <div className="h-px w-24 mx-auto mt-4" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    </div>

                    {/* ── Signature Glass Card ── */}
                    <div
                        className="w-full h-auto mx-auto flex flex-col overflow-hidden p-6 lg:p-8"
                        style={{
                            position: 'relative', zIndex: 10,
                            background: 'rgba(255,255,255,0.025)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            borderRadius: '24px',
                            boxShadow: '0 40px 80px rgba(0,0,0,0.5)'
                        }}
                    >
                        {!result ? (
                            <div className="space-y-6">
                                {/* Premium Microphone Module */}
                                <div
                                    className="rounded-2xl p-8 text-center"
                                    style={{
                                        background: recording ? 'rgba(239,68,68,0.06)' : 'rgba(0,0,0,0.4)',
                                        border: recording ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.07)',
                                        transition: 'all 0.4s ease'
                                    }}
                                >
                                    {activeTab === 'live' && (
                                        <>
                                            {/* Mic icon with glow when recording */}
                                            <div className="flex justify-center mb-6">
                                                <div className="relative">
                                                    <motion.div
                                                        className="w-24 h-24 rounded-full flex items-center justify-center"
                                                        style={{
                                                            background: recording ? 'rgba(239,68,68,0.15)' : 'rgba(0,255,136,0.08)',
                                                            border: recording ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(0,255,136,0.2)',
                                                        }}
                                                        animate={recording ? {
                                                            scale: [1, 1.12, 1],
                                                            boxShadow: [
                                                                '0 0 0 0 rgba(239,68,68,0.4)',
                                                                '0 0 0 20px rgba(239,68,68,0)',
                                                                '0 0 0 0 rgba(239,68,68,0)'
                                                            ]
                                                        } : {
                                                            boxShadow: '0 0 30px rgba(0,255,136,0.15)'
                                                        }}
                                                        transition={{ duration: 1, repeat: Infinity }}
                                                    >
                                                        <Mic
                                                            size={44}
                                                            style={{ color: recording ? '#f87171' : '#00ff88' }}
                                                        />
                                                    </motion.div>
                                                    {recording && (
                                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full record-pulse block" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Waveform visualizer */}
                                            <div className="flex justify-center gap-1 mb-6 h-16 items-end">
                                                {audioData.map((heightVal, i) => (
                                                    <motion.div
                                                        key={i}
                                                        className="w-1.5 rounded-full"
                                                        style={{ background: recording ? '#00ff88' : 'rgba(255,255,255,0.12)' }}
                                                        animate={{ height: heightVal }}
                                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                                    />
                                                ))}
                                            </div>

                                            {/* Countdown & Energy Status */}
                                            {recording && (
                                                <>
                                                    <div className="text-5xl font-bold text-red-400 mb-2 tabular-nums">{countdown}s</div>
                                                    <div className={`text-sm font-bold tracking-widest uppercase mb-4 ${statusColor} drop-shadow-md transition-colors duration-300`}>
                                                        {vocalStatus}
                                                    </div>
                                                </>
                                            )}
                                            {!recording && audioBlob && (
                                                <div className="text-emerald-400 font-bold mb-4 flex items-center justify-center gap-2">
                                                    <span className="text-xl">✅</span> Recording saved! Ready to analyze.
                                                </div>
                                            )}

                                            {/* Premium Instruction Text */}
                                            <p
                                                className="mb-6"
                                                style={{
                                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                                    fontSize: '15px',
                                                    fontWeight: 600,
                                                    color: 'rgba(240,240,240,0.95)'
                                                }}
                                            >
                                                {recording
                                                    ? '🎙️ Keep speaking clearly. AI is mapping your acoustic energy...'
                                                    : audioBlob
                                                        ? 'Click Analyze to detect voice stress patterns'
                                                        : <>
                                                            <span className="text-emerald-400 font-bold">💡 Instruction:</span>{' '}
                                                            Click Start and speak for 15 seconds about your current mood.
                                                        </>
                                                }
                                            </p>

                                            {/* Action Buttons */}
                                            <div className="flex gap-3 justify-center flex-wrap">
                                                {!recording && !audioBlob && (
                                                    <motion.button
                                                        onClick={startRecording}
                                                        className="px-10 py-4 text-lg rounded-xl flex items-center gap-2"
                                                        style={{
                                                            background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
                                                            color: '#000000',
                                                            fontWeight: 800,
                                                            boxShadow: '0 8px 25px rgba(0,255,136,0.3)'
                                                        }}
                                                        whileHover={{ scale: 1.05, boxShadow: '0 12px 35px rgba(0,255,136,0.4)' }}
                                                    >
                                                        <Mic size={22} /> Start Recording
                                                    </motion.button>
                                                )}
                                                {recording && (
                                                    <motion.button
                                                        onClick={stopRecording}
                                                        className="px-8 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-2 transition-colors"
                                                        whileHover={{ scale: 1.05 }}
                                                    >
                                                        <StopCircle size={20} /> Stop
                                                    </motion.button>
                                                )}
                                                {audioBlob && !recording && (
                                                    <div className="flex gap-3 justify-center">
                                                        {/* Dark glass Retry button */}
                                                        <button
                                                            onClick={() => setAudioBlob(null)}
                                                            className="px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all"
                                                            style={{
                                                                background: 'rgba(255,255,255,0.05)',
                                                                color: '#fff',
                                                                border: '1px solid rgba(255,255,255,0.1)'
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                        >
                                                            <RefreshCw size={15} /> Retry
                                                        </button>
                                                        {/* Signature gradient Analyze button */}
                                                        <motion.button
                                                            onClick={upload}
                                                            disabled={loading}
                                                            className="px-8 py-3 rounded-xl flex items-center gap-2"
                                                            style={{
                                                                background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
                                                                color: '#000000',
                                                                fontWeight: 800,
                                                                boxShadow: '0 8px 25px rgba(0,255,136,0.3)'
                                                            }}
                                                            whileHover={{ scale: 1.05, boxShadow: '0 12px 35px rgba(0,255,136,0.4)' }}
                                                        >
                                                            {loading
                                                                ? <><div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />Analyzing...</>
                                                                : '🔍 Analyze Voice'}
                                                        </motion.button>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <motion.div
                                className="space-y-4"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                {/* Results card */}
                                <div className="glass-card p-6">
                                    <div className="flex items-center justify-between mb-5">
                                        <h2 className="text-2xl font-bold text-white">Voice Analysis Result</h2>
                                        <span className="text-4xl">🎙️</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                                        {[
                                            ['Emotion', result.voice_emotion, '#00F5FF'],
                                            ['Mood', result.voice_mood, '#8B5CF6'],
                                            ['Stress', result.voice_stress, STRESS_COLOR[result.voice_stress]],
                                            ['Severity', `${result.severity_score}/10`, result.severity_score >= 7 ? '#EF4444' : '#F59E0B'],
                                        ].map(([k, v, c]) => (
                                            <div key={k} className="glass-card p-3 text-center">
                                                <div className="text-xl font-bold" style={{ color: c }}>{v}</div>
                                                <div className="text-slate-400 text-xs mt-1">{k}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Render Detailed Sliding Window Counts if provided */}
                                    {result.emotion_counts && Object.keys(result.emotion_counts).length > 0 && (
                                        <div className="mb-5 bg-white/5 rounded-xl p-4 border border-white/10">
                                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">
                                                15s Sliding Window Detection
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(result.emotion_counts)
                                                    .sort(([, a], [, b]) => b - a)
                                                    .map(([emotionLabel, count]) => (
                                                        <div key={emotionLabel} className="bg-white/10 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
                                                            <span className="text-white font-medium">{emotionLabel}</span>
                                                            <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded text-xs font-bold">
                                                                {count} {count === 1 ? 'frame' : 'frames'}
                                                            </span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-sm text-slate-400 mb-2">
                                        <span>AI Confidence</span>
                                        <span className="font-medium text-white">{(result.confidence * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-purple-600 to-cyan-400 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${result.confidence * 100}%` }}
                                            transition={{ duration: 1.2 }}
                                        />
                                    </div>
                                </div>

                                {/* Stress badge */}
                                <div
                                    className={`glass-card p-4 text-center font-bold text-sm ${'badge-' + result.voice_stress.toLowerCase()}`}
                                    style={{ borderRadius: '12px' }}
                                >
                                    🎯 Stress Level: {result.voice_stress}
                                </div>

                                <div className="flex gap-4 mt-6">
                                    {/* Dark glass Retry button */}
                                    <motion.button
                                        onClick={handleRetry}
                                        className="w-full py-4 text-lg flex items-center justify-center gap-2 rounded-xl font-bold transition-all"
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            color: '#fff',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                        whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.1)' }}
                                    >
                                        <RefreshCw size={20} /> Retry / Record Again
                                    </motion.button>

                                    {/* Signature gradient Continue button */}
                                    <motion.button
                                        onClick={() => nav('/severity')}
                                        className="w-full py-4 text-lg font-bold rounded-xl flex items-center justify-center gap-2"
                                        style={{
                                            background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
                                            color: '#000000',
                                            fontWeight: 800,
                                            boxShadow: '0 8px 25px rgba(0,255,136,0.3)'
                                        }}
                                        whileHover={{ scale: 1.02, boxShadow: '0 12px 35px rgba(0,255,136,0.4)' }}
                                    >
                                        Continue to Final Severity →
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>
        </>
    )
}
