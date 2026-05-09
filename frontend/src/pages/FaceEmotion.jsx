import React, { useState, useRef, useEffect } from 'react'
import * as faceapi from '@vladmandic/face-api'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Camera, StopCircle, Upload, RefreshCw, Brain, Activity, ScanFace, ArrowLeft } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import API from '../api'
import toast from 'react-hot-toast'
import StepProgress from '../components/StepProgress'

const EMOTION_COLORS = {
    Happy: '#10B981', Neutral: '#6366F1', Sad: '#3B82F6',
    Angry: '#EF4444', Surprise: '#F59E0B', Fear: '#8B5CF6', Disgust: '#EC4899'
}

const EMOTION_EMOJI = { Happy: '😊', Sad: '😢', Angry: '😠', Fear: '😨', Surprise: '😲', Neutral: '😐', Disgust: '🤢' }
const INSIGHT_TEXTS = {
    Happy: 'Looking great! Detected a smile.',
    Neutral: 'You appear calm and balanced.',
    Sad: 'Sensing some low energy or sadness.',
    Angry: 'You appear upset or frustrated.',
    Surprise: 'You look surprised by something!',
    Fear: 'Detected signs of anxiety or fear.',
    Disgust: 'Sensing discomfort or disgust.'
}
const RECORD_SECONDS = 20

export default function FaceEmotion() {
    const nav = useNavigate()
    const videoRef = useRef(null)
    const mediaRecorderRef = useRef(null)
    const chunksRef = useRef([])
    const isRecordingRef = useRef(false)
    const emotionCountsRef = useRef({ Happy: 0, Neutral: 0, Sad: 0, Angry: 0, Surprise: 0, Fear: 0, Disgust: 0 })

    const [isLoading, setIsLoading] = useState(true)
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1500)
        return () => clearTimeout(timer)
    }, [])

    const [recording, setRecording] = useState(false)
    const [liveCounts, setLiveCounts] = useState({ Happy: 0, Neutral: 0, Sad: 0, Angry: 0, Surprise: 0, Fear: 0, Disgust: 0 })
    const [dominantEmotion, setDominantEmotion] = useState(null)
    const [floatingEmojis, setFloatingEmojis] = useState([])
    const [countdown, setCountdown] = useState(RECORD_SECONDS)
    const [videoBlob, setVideoBlob] = useState(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [stream, setStream] = useState(null)
    const [permission, setPermission] = useState(false)
    const canvasRef = useRef(null)
    const [modelsLoaded, setModelsLoaded] = useState(false)
    const [liveScores, setLiveScores] = useState({
        Happy: 0, Neutral: 0, Sad: 0, Angry: 0, Surprise: 0, Fear: 0, Disgust: 0
    })
    const liveScoresRef = useRef({ Happy: 0, Neutral: 0, Sad: 0, Angry: 0, Surprise: 0, Fear: 0, Disgust: 0 })

    // REF FOR DECOUPLING UI FROM FACEAPI
    const latestDetectedRef = useRef({
        dominantCapKey: null,
        scoreMap: { Happy: 0, Neutral: 0, Sad: 0, Angry: 0, Surprise: 0, Fear: 0, Disgust: 0 },
        highestScore: 0
    })

    const [timelineData, setTimelineData] = useState([])

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models'
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
                ])
                setModelsLoaded(true)
            } catch (err) {
                console.error("Failed to load face-api models", err)
                toast.error("Failed to load local face tracking models.")
            }
        }
        loadModels()
    }, [])

    // UI UPDATE INTERVAL (Throttles React re-renders)
    useEffect(() => {
        const uiInterval = setInterval(() => {
            if (!stream && !recording) return;

            const { dominantCapKey, scoreMap, highestScore } = latestDetectedRef.current;

            if (dominantCapKey) {
                setDominantEmotion(dominantCapKey);
                setLiveScores(scoreMap);

                if (isRecordingRef.current) {
                    setLiveCounts({ ...emotionCountsRef.current });

                    // Spawn floating emoji if confidence is super high (>85%) AND recording
                    if (highestScore > 0.85 && Math.random() > 0.5) {
                        const newEmoji = {
                            id: Date.now() + Math.random(),
                            emotion: dominantCapKey,
                            left: `${20 + Math.random() * 60}%`, // random horizontal position
                            size: 20 + Math.random() * 20
                        }
                        setFloatingEmojis(prev => [...prev.slice(-10), newEmoji])
                    }
                }
            } else {
                setLiveScores({ Happy: 0, Neutral: 0, Sad: 0, Angry: 0, Surprise: 0, Fear: 0, Disgust: 0 });
            }
        }, 800)

        return () => clearInterval(uiInterval)
    }, [stream, recording])

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream
        }
    }, [stream, permission])

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop())
            }
        }
    }, [stream])

    const requestCamera = async () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
        }
        try {
            const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            setStream(s)
            setPermission(true)
        } catch {
            toast.error('Camera permission denied. Please allow camera access.')
        }
    }

    const startRecording = () => {
        chunksRef.current = []
        emotionCountsRef.current = { Happy: 0, Neutral: 0, Sad: 0, Angry: 0, Surprise: 0, Fear: 0, Disgust: 0 }
        setLiveCounts(emotionCountsRef.current)
        setTimelineData([])

        const mr = new MediaRecorder(stream, { mimeType: 'video/webm' })
        mr.ondataavailable = e => chunksRef.current.push(e.data)
        mr.onstop = () => setVideoBlob(new Blob(chunksRef.current, { type: 'video/webm' }))
        mediaRecorderRef.current = mr
        mr.start()

        setRecording(true)
        isRecordingRef.current = true
        setCountdown(RECORD_SECONDS)

        let sec = RECORD_SECONDS
        const iv = setInterval(() => {
            sec--; setCountdown(sec)

            setTimelineData(prev => {
                const newData = [...prev, { time: `${RECORD_SECONDS - sec}s`, ...liveScoresRef.current }]
                // Keep the last 20 seconds, although the recording is 20s anyway
                return newData;
            })

            if (sec <= 0) {
                clearInterval(iv);
                mr.stop();
                setRecording(false);
                isRecordingRef.current = false;
            }
        }, 1000)
    }

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setRecording(false);
        isRecordingRef.current = false;
    }

    const handleRetry = async () => {
        setResult(null);
        setVideoBlob(null);
        setTimelineData([]);
        setLiveCounts({ Happy: 0, Neutral: 0, Sad: 0, Angry: 0, Surprise: 0, Fear: 0, Disgust: 0 });
        if (stream) stream.getTracks().forEach(t => t.stop());
        await requestCamera();
    };

    const uploadAndAnalyze = async () => {
        if (!videoBlob) return
        setLoading(true)
        const formData = new FormData()
        formData.append('video', videoBlob, 'face_recording.webm')
        // Send the live collected frame counts to override backend ML
        formData.append('live_counts', JSON.stringify(liveCounts))
        try {
            const { data } = await API.post('/face/analyse', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            setResult(data)
            stream?.getTracks().forEach(t => t.stop())
            toast.success('Facial analysis complete!')
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Analysis failed')
        } finally {
            setLoading(false)
        }
    }

    const SEVERITY_COLOR = (s) => s <= 3 ? '#10B981' : s <= 6 ? '#F59E0B' : '#EF4444'
    const pieData = result
        ? Object.entries(result.emotion_distribution || {}).map(([k, v]) => ({ name: k, value: v }))
        : []

    // Helper: Determine Compound Emotion
    const getComplexEmotion = () => {
        const { Sad, Fear, Angry, Disgust, Happy, Surprise } = liveCounts;
        if (Sad > 0 && Fear > 0) return "Anxiety / Distress";
        if (Angry > 0 && Disgust > 0) return "Frustration / Contempt";
        if (Happy > 0 && Surprise > 0) return "Excitement / Awe";
        return "Focused / Singular Emotion";
    };

    // Helper: Calculate Emotional Volatility
    const calculateVolatility = () => {
        let changes = 0;
        let lastDominant = null;
        timelineData.forEach(data => {
            let dominant = null;
            let maxScore = -1;
            ['Happy', 'Neutral', 'Sad', 'Angry', 'Surprise', 'Fear', 'Disgust'].forEach(emp => {
                if (data[emp] > maxScore) {
                    maxScore = data[emp];
                    dominant = emp;
                }
            });
            if (lastDominant && dominant !== lastDominant) {
                changes++;
            }
            lastDominant = dominant;
        });
        if (changes > 5) return "High (Rapid mood shifts detected)";
        if (changes >= 2 && changes <= 5) return "Moderate (Normal emotional flow)";
        return "Stable (Consistent emotional state)";
    };

    const isAppActive = !!stream || recording || !!videoBlob || !!result;

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

            <div className="min-h-screen text-slate-200 font-sans selection:bg-emerald-500/30 overflow-x-hidden relative flex flex-col pt-24 pb-12"
                style={{ backgroundColor: '#020806' }}>
                <div className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-700"
                    style={{
                        background: 'radial-gradient(circle at 50% 0%, rgba(0, 255, 136, 0.08) 0%, transparent 70%), radial-gradient(circle at 80% 80%, rgba(0, 204, 106, 0.05) 0%, transparent 50%)',
                        opacity: stream ? 0.3 : 1
                    }} />

                <div className="fixed inset-0 z-[1] w-full h-full" style={{ pointerEvents: 'none', WebkitAnimationPlayState: isAppActive ? 'paused' : 'running', animationPlayState: isAppActive ? 'paused' : 'running' }}>
                </div>
                <div className="fixed inset-0 z-[1] bg-black/40 pointer-events-none" />
                {/* The Root Background */}
                <div className="absolute inset-0 z-0 pointer-events-none print:hidden" style={{ animationPlayState: !!stream ? 'paused' : 'running' }}>
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
                            onClick={() => nav('/chat')}
                            className="flex items-center gap-2 text-slate-400 transition-colors text-xs font-bold uppercase tracking-widest w-fit group"
                            style={{ transition: 'color 0.3s ease' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#00ff88'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgb(148, 163, 184)'}
                        >
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Step 2 – Chat Analysis
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
                            <StepProgress current={3} />
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
                            Face Emotion Analysis
                        </h1>
                        <p className="text-lg font-medium opacity-80" style={{ color: 'rgba(148,163,184,0.72)' }}>Step 3/4 — Record a 20-second video for AI emotion detection</p>
                        <div className="h-px w-24 mx-auto mt-4" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    </div>

                    <div className="w-full h-auto mx-auto flex flex-col overflow-hidden p-6 lg:p-8"
                        style={{ position: 'relative', zIndex: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRadius: '24px', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>

                        {!result ? (
                            <>
                                <div className={`w-full flex flex-col gap-8 ${recording || videoBlob ? 'lg:grid lg:grid-cols-12 lg:gap-8 items-stretch' : 'items-center'}`}>
                                    {/* Left Column */}
                                    <div className="lg:col-span-7 flex flex-col gap-6 w-full">
                                        {/* Video/Camera container at top */}
                                        <div className="aspect-[4/3] w-full bg-black/40 border border-white/10 rounded-2xl overflow-hidden relative shadow-inner flex items-center justify-center" style={{ willChange: 'transform', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}>

                                            {!permission ? (
                                                <div className="flex flex-col items-center justify-center gap-4 relative z-20 w-full h-full">
                                                    <Camera size={52} className="text-slate-500" />
                                                    <button onClick={requestCamera}
                                                        className="px-8 py-3 rounded-xl transition-all"
                                                        style={{ background: 'linear-gradient(135deg, #00ff88, #00cc6a)', color: '#000000', fontWeight: 800, boxShadow: '0 8px 25px rgba(0,255,136,0.3)' }}
                                                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,255,136,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                                                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,255,136,0.3)'; e.currentTarget.style.transform = 'translateY(0)' }}
                                                    >
                                                        📷 Enable Camera
                                                    </button>
                                                    <p className="text-slate-500 text-sm">Camera permission required for facial analysis</p>
                                                </div>
                                            ) : (
                                                <div className="relative w-full h-full rounded-xl overflow-hidden" style={{ willChange: 'transform', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}>
                                                    <video ref={videoRef} autoPlay muted playsInline
                                                        className="w-full h-full object-cover"
                                                        style={{ transform: 'scaleX(-1) translateZ(0)', willChange: 'transform', backfaceVisibility: 'hidden' }}
                                                        onPlay={() => {
                                                            const canvas = canvasRef.current;
                                                            const video = videoRef.current;
                                                            let tick = 0;
                                                            const interval = setInterval(async () => {
                                                                if (!video || !canvas || video.paused || video.ended) {
                                                                    clearInterval(interval);
                                                                    return;
                                                                }

                                                                // Only perform face tracking if models are successfully loaded and video has frames
                                                                if (modelsLoaded && video.readyState === 4) {
                                                                    const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions()

                                                                    // Update canvas dimensions dynamically to match video layout
                                                                    const displaySize = { width: video.clientWidth, height: video.clientHeight }
                                                                    faceapi.matchDimensions(canvas, displaySize)

                                                                    if (detections) {
                                                                        const resizedDetections = faceapi.resizeResults(detections, displaySize)

                                                                        // Clear previous drawings
                                                                        const ctx = canvas.getContext('2d')
                                                                        ctx.clearRect(0, 0, canvas.width, canvas.height)

                                                                        // Calculate highest expression
                                                                        const sortedExpressions = Object.entries(detections.expressions).sort((a, b) => b[1] - a[1])
                                                                        const [highestEmotion, highestScore] = sortedExpressions[0]
                                                                        let dominantCapKey = highestEmotion.charAt(0).toUpperCase() + highestEmotion.slice(1)
                                                                        if (dominantCapKey === 'Surprised') dominantCapKey = 'Surprise'
                                                                        if (dominantCapKey === 'Fearful') dominantCapKey = 'Fear'
                                                                        if (dominantCapKey === 'Disgusted') dominantCapKey = 'Disgust'

                                                                        // Count dominating emotion if recording is active
                                                                        if (isRecordingRef.current) {
                                                                            emotionCountsRef.current[dominantCapKey] += 1
                                                                        }

                                                                        // update React State for the Live Graph UI below
                                                                        const scoreMap = { Happy: 0, Neutral: 0, Sad: 0, Angry: 0, Surprise: 0, Fear: 0, Disgust: 0 }
                                                                        Object.entries(detections.expressions).forEach(([k, v]) => {
                                                                            // face-api uses lowercase keys (happy, neutral, sad, etc), mapping back to our CamelCase
                                                                            let capKey = k.charAt(0).toUpperCase() + k.slice(1)
                                                                            if (capKey === 'Surprised') capKey = 'Surprise'
                                                                            if (capKey === 'Fearful') capKey = 'Fear'
                                                                            if (capKey === 'Disgusted') capKey = 'Disgust'
                                                                            if (scoreMap[capKey] !== undefined) scoreMap[capKey] = (v * 100).toFixed(1)
                                                                        })
                                                                        liveScoresRef.current = scoreMap

                                                                        // Write to refs ONLY. Do not trigger setState.
                                                                        latestDetectedRef.current = {
                                                                            dominantCapKey,
                                                                            scoreMap,
                                                                            highestScore
                                                                        }

                                                                        // Draw Custom Bounding Box and Flipped Text Label
                                                                        const box = resizedDetections.detection.box

                                                                        // Calculate box coordinates
                                                                        const x = box.x
                                                                        const y = box.y
                                                                        const width = box.width
                                                                        const height = box.height

                                                                        const emotionColor = EMOTION_COLORS[highestEmotion.charAt(0).toUpperCase() + highestEmotion.slice(1)] || '#00F5FF'

                                                                        // 1. Draw the bounding box (keep it mirrored like the video)
                                                                        ctx.strokeStyle = emotionColor
                                                                        ctx.lineWidth = 2
                                                                        ctx.strokeRect(x, y, width, height)

                                                                        // 2. Fix for mirrored text
                                                                        ctx.save() // Save current state
                                                                        // Move to the center point above the box where text should be
                                                                        ctx.translate(x + width / 2, y - 5)
                                                                        // Flip horizontally to counteract the CSS scaleX(-1) on the canvas
                                                                        ctx.scale(-1, 1)

                                                                        // Setup text styling
                                                                        ctx.textAlign = 'center'
                                                                        ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

                                                                        // Text content
                                                                        const labelText = `${dominantCapKey}: ${(highestScore * 100).toFixed(1)}%`

                                                                        // Draw a background for the text for better readability
                                                                        const textMetrics = ctx.measureText(labelText)
                                                                        const bgWidth = textMetrics.width + 12
                                                                        const bgHeight = 24
                                                                        ctx.fillStyle = emotionColor
                                                                        // We draw the background rect centered horizontally above the box
                                                                        ctx.fillRect(-bgWidth / 2, -bgHeight + 4, bgWidth, bgHeight)

                                                                        // Draw the text itself at (0,0) relative to our translated/flipped origin
                                                                        ctx.fillStyle = '#FFFFFF'
                                                                        ctx.fillText(labelText, 0, 0)

                                                                        ctx.restore() // Restore state so next loop isn't affected

                                                                    } else {
                                                                        // Clear if no face detected
                                                                        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
                                                                    }
                                                                }
                                                            }, 150)
                                                            // attach interval ID to stop later during cleanup
                                                            canvasRef.current.intervalId = interval;
                                                        }}
                                                        onPause={() => {
                                                            if (canvasRef.current && canvasRef.current.intervalId) {
                                                                clearInterval(canvasRef.current.intervalId)
                                                            }
                                                            // Clear canvas on pause
                                                            if (canvasRef.current) canvasRef.current.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
                                                        }}
                                                    />

                                                    {recording && (
                                                        <div className="absolute inset-0 border-4 border-red-500 rounded-xl">
                                                            <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/60 rounded-lg px-3 py-1.5 z-10">
                                                                <div className="w-2.5 h-2.5 bg-red-500 rounded-full record-pulse" />
                                                                <span className="text-white text-xs font-bold">REC</span>
                                                            </div>
                                                            {/* Circular countdown */}
                                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 z-10">
                                                                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                                                                    <motion.circle cx="18" cy="18" r="15.9" fill="none" stroke="#EF4444" strokeWidth="2"
                                                                        strokeDasharray={`${(countdown / RECORD_SECONDS) * 100} 100`} strokeLinecap="round" />
                                                                </svg>
                                                                <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg drop-shadow-md">{countdown}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ transform: 'scaleX(-1) translateZ(0)', willChange: 'transform', backfaceVisibility: 'hidden' }} />

                                                    {/* Floating Emojis Overlay */}
                                                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                                                        <AnimatePresence>
                                                            {floatingEmojis.map(emoji => (
                                                                <motion.div
                                                                    key={emoji.id}
                                                                    initial={{ opacity: 0, y: 50, scale: 0.5, x: emoji.left }}
                                                                    animate={{
                                                                        opacity: [0, 1, 0],
                                                                        y: -150 - Math.random() * 100,
                                                                        scale: 1,
                                                                        x: `calc(${emoji.left} + ${Math.random() > 0.5 ? 20 : -20}px)`
                                                                    }}
                                                                    exit={{ opacity: 0 }}
                                                                    transition={{ duration: 2 + Math.random(), ease: 'easeOut' }}
                                                                    className="absolute bottom-0 text-3xl"
                                                                    style={{ fontSize: `${emoji.size}px`, transform: 'translateX(-50%)' }}
                                                                    onAnimationComplete={() => {
                                                                        setFloatingEmojis(prev => prev.filter(e => e.id !== emoji.id))
                                                                    }}
                                                                >
                                                                    {EMOTION_EMOJI[emoji.emotion]}
                                                                </motion.div>
                                                            ))}
                                                        </AnimatePresence>
                                                    </div>

                                                    {videoBlob && !recording && (
                                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                                                            <div className="text-center">
                                                                <p className="text-green-400 font-bold text-xl">✅ Recording Complete!</p>
                                                                <p className="text-slate-300 text-sm mt-1">Click Analyze to detect emotions</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Controls & Instructions below */}
                                        <div className="w-full flex flex-col justify-center">
                                            {permission ? (
                                                <div className="p-6 md:p-8 text-center relative z-10 rounded-2xl border border-white/10 w-full" style={{ background: 'rgba(255,255,255,0.04)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                                                    <h2 className="text-xl font-bold text-white mb-4 flex items-center justify-center gap-2">
                                                        <Brain className="text-emerald-400" size={24} /> AI Analysis
                                                    </h2>
                                                    <p className="mb-6 text-[15px] font-medium text-slate-100 tracking-wide leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'rgba(240,240,240,0.95)' }}>
                                                        {modelsLoaded
                                                            ? <><span className="text-emerald-400 font-bold block mb-2 sm:inline sm:mb-0 text-lg sm:text-[15px]">💡 Instruction:</span> Look directly at the camera and speak naturally about your current feelings or thoughts for 20 seconds. Ensure your face is clearly visible.</>
                                                            : <>⏳ Initializing secure face tracking models...</>
                                                        }
                                                    </p>
                                                    <div className="flex gap-3 justify-center flex-wrap">
                                                        {!recording && !videoBlob && (
                                                            <motion.button onClick={startRecording}
                                                                disabled={!modelsLoaded}
                                                                className={`px-8 py-3.5 flex items-center gap-2 rounded-xl transition-all w-full sm:w-auto justify-center ${!modelsLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                style={{ background: 'linear-gradient(135deg, #00ff88, #00cc6a)', color: '#000000', fontWeight: 800, boxShadow: '0 8px 25px rgba(0,255,136,0.3)' }}
                                                                whileHover={modelsLoaded ? { scale: 1.02, boxShadow: '0 12px 35px rgba(0,255,136,0.4)' } : {}}
                                                            >
                                                                <Camera size={18} /> Start 20-sec Recording
                                                            </motion.button>
                                                        )}
                                                        {recording && (
                                                            <motion.button onClick={stopRecording}
                                                                className="px-8 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
                                                                whileHover={{ scale: 1.02 }}>
                                                                <StopCircle size={20} /> Stop Recording
                                                            </motion.button>
                                                        )}
                                                        {videoBlob && !recording && (
                                                            <div className="flex gap-3 w-full flex-col sm:flex-row justify-center mt-2">
                                                                <button onClick={() => {
                                                                    setVideoBlob(null);
                                                                    if (!stream || !stream.active) {
                                                                        requestCamera().then(() => startRecording());
                                                                    } else {
                                                                        startRecording();
                                                                    }
                                                                }}
                                                                    className="px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all sm:flex-1 max-w-[200px]"
                                                                    style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                                                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                                                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                                                                >
                                                                    <RefreshCw size={18} /> Retake
                                                                </button>
                                                                <motion.button onClick={uploadAndAnalyze} disabled={loading}
                                                                    className="px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all sm:flex-[1.5] max-w-[250px]"
                                                                    style={{ background: 'linear-gradient(135deg, #00ff88, #00cc6a)', color: '#000000', fontWeight: 800, boxShadow: '0 8px 25px rgba(0,255,136,0.3)' }}
                                                                    whileHover={{ scale: 1.02, boxShadow: '0 12px 35px rgba(0,255,136,0.4)' }}>
                                                                    {loading
                                                                        ? <><div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />Analyzing...</>
                                                                        : <><Upload size={18} />Analyze Face</>}
                                                                </motion.button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-6 md:p-8 text-center relative z-10 rounded-2xl border border-white/10 w-full" style={{ background: 'rgba(255,255,255,0.04)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                                                    <h2 className="text-xl font-bold text-white mb-4 flex items-center justify-center gap-2">
                                                        <Brain className="text-slate-400" size={24} /> AI Analysis
                                                    </h2>
                                                    <p className="text-[15px] font-medium text-slate-400 tracking-wide leading-relaxed">
                                                        Please enable your camera to proceed with the facial emotion analysis step. Ensure you are in a well-lit environment.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Column (Conditional) */}
                                    {(recording || videoBlob) && !result && (
                                        <div className="lg:col-span-5 flex flex-col justify-between h-full w-full gap-4">
                                            {/* Live Emotion Graph UI */}
                                            {permission && (
                                                <motion.div className="glass-card p-5 mt-0 w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                    <h3 className="text-sm font-bold text-cyan-400 mb-3 uppercase tracking-wider">Live Emotion Activity</h3>
                                                    <div className="space-y-3">
                                                        {Object.entries(liveScores).map(([emotion, score]) => (
                                                            <div key={emotion} className="flex items-center gap-3">
                                                                <div className="w-24 text-xs text-slate-400 text-right">
                                                                    {emotion} {EMOTION_EMOJI[emotion]}
                                                                </div>
                                                                <div className="flex-1 bg-slate-800/50 rounded-full h-2.5 overflow-hidden">
                                                                    <motion.div
                                                                        className="h-full rounded-full"
                                                                        style={{ backgroundColor: EMOTION_COLORS[emotion] || '#fff' }}
                                                                        animate={{ width: `${score}%` }}
                                                                        transition={{ duration: 0.6, ease: 'linear' }}
                                                                    />
                                                                </div>
                                                                <div className="w-12 text-xs font-mono text-slate-300">{Math.round(score)}%</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Real-time Timeline Graph */}
                                            {permission && timelineData.length > 0 && (
                                                <motion.div className="glass-card p-5 mt-0 w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                    <h3 className="text-sm font-bold text-cyan-400 mb-3 uppercase tracking-wider">Emotional State Timeline</h3>
                                                    <ResponsiveContainer width="100%" height={180}>
                                                        <LineChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                            <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickMargin={8} />
                                                            <YAxis hide domain={[0, 100]} />
                                                            <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px' }} itemStyle={{ fontSize: 12 }} labelStyle={{ color: '#94a3b8', marginBottom: 4 }} />
                                                            {['Happy', 'Neutral', 'Sad', 'Angry', 'Surprise', 'Fear', 'Disgust'].map(emp => (
                                                                <Line key={emp} type="monotone" dataKey={emp} stroke={EMOTION_COLORS[emp]} strokeWidth={2} dot={false} isAnimationActive={false} />
                                                            ))}
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </motion.div>
                                            )}

                                            {/* Live Insight Ticker */}
                                            {recording && dominantEmotion && (
                                                <motion.div
                                                    className="glass-card p-3 text-center border-l-4 mt-0 w-full"
                                                    style={{ borderLeftColor: EMOTION_COLORS[dominantEmotion] }}
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    key={dominantEmotion} // force re-animation when emotion changes
                                                >
                                                    <p className="text-sm font-medium drop-shadow" style={{ color: EMOTION_COLORS[dominantEmotion] }}>
                                                        {INSIGHT_TEXTS[dominantEmotion]}
                                                    </p>
                                                </motion.div>
                                            )}

                                            {/* Live Frame Count Summary Dashboard */}
                                            <motion.div className="glass-card p-5 mt-0 w-full" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                                <h3 className="text-sm font-bold text-cyan-400 mb-3 uppercase tracking-wider">Live Frame Count Summary</h3>
                                                <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
                                                    {Object.entries(liveCounts).map(([emp, count]) => (
                                                        <div key={emp} className="bg-slate-800/40 p-2 rounded-lg border border-slate-700/50 text-center flex flex-col justify-center items-center">
                                                            <div className="text-xl leading-none mb-1">{EMOTION_EMOJI[emp]}</div>
                                                            <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{emp}</div>
                                                            <div className="text-cyan-300 font-mono text-lg font-bold mt-1 leading-none">{count}</div>
                                                            <div className="text-slate-500 text-[9px] uppercase mt-0.5">frames</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <motion.div className="space-y-4"
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>

                                {/* Emotion result card */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    {[
                                        ['Emotion', result.facial_emotion, '#00F5FF'],
                                        ['Severity', `${result.severity_score}/10`, SEVERITY_COLOR(result.severity_score)],
                                        ['Confidence', `${(result.confidence * 100).toFixed(1)}%`, '#10B981'],
                                    ].map(([k, v, c]) => (
                                        <div key={k} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden" style={{ boxShadow: k === 'Severity' ? `0 0 40px ${SEVERITY_COLOR(result.severity_score)}30 inset` : 'none' }}>
                                            <div className="font-display text-3xl lg:text-4xl font-bold text-white mb-1" style={{ textShadow: `0 0 20px ${c}50`, color: c }}>{v}</div>
                                            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mt-2">{k}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* AI Counsellor Insight */}
                                <motion.div className="bg-gradient-to-r from-emerald-500/10 to-transparent border-l-4 border-emerald-400 rounded-r-2xl p-6 my-6">
                                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-2 flex items-center gap-2">
                                        <Brain size={14} className="text-emerald-400" /> AI COUNSELLOR INSIGHT
                                    </h3>
                                    <p className="text-lg text-emerald-50/90 font-medium leading-relaxed italic">
                                        "{
                                            {
                                                'Happy': "You seem to be experiencing positive emotions. It's wonderful to see you in a good space. Hold on to this feeling!",
                                                'Sad': "We detected signs of sadness. It's completely okay to feel this way. Remember to be gentle with yourself right now.",
                                                'Fear': "We noticed expressions that may indicate fear or anxiety. Take a slow, deep breath. You are in a safe space.",
                                                'Disgust': "There are hints of discomfort or aversion. We're here to help you unpack those feelings safely.",
                                                'Surprise': "We saw a reaction of surprise. Whether it's positive or overwhelming, take a moment to process what you're feeling.",
                                                'Angry': "We detected high levels of frustration or anger. Take a deep breath, this is a safe space to express yourself.",
                                                'Neutral': "You're displaying a calm and balanced state. Sometimes neutral is exactly what we need for clarity and focus."
                                            }[result.facial_emotion] || "Let's continue to explore your emotions."
                                        }"
                                    </p>
                                </motion.div>

                                {/* Advanced Psychological Metrics */}
                                <motion.div className="bg-[#0a0f12]/80 backdrop-blur-xl border border-white/[0.04] rounded-[24px] p-6 shadow-2xl mt-4">
                                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                                        <Activity size={14} className="text-cyan-400" /> ADVANCED PSYCHOLOGICAL METRICS
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
                                            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-1">Derived Complex Emotion</div>
                                            <div className="text-cyan-300 font-bold text-sm sm:text-base">{getComplexEmotion()}</div>
                                        </div>
                                        <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
                                            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-1">Emotional Volatility (Mood Swings)</div>
                                            <div className="text-cyan-300 font-bold text-sm sm:text-base">{calculateVolatility()}</div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Pie chart */}
                                {pieData.length > 0 && (
                                    <div className="bg-[#0a0f12]/80 backdrop-blur-xl border border-white/[0.04] rounded-[24px] p-6 shadow-2xl mt-4">
                                        <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-4">📊 EMOTION DISTRIBUTION</h3>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <PieChart>
                                                <Pie data={pieData} dataKey="value" nameKey="name"
                                                    cx="50%" cy="50%" outerRadius={80}
                                                    label={({ name, value }) => value > 0 ? `${name}: ${value}%` : ''}>
                                                    {pieData.map(e => <Cell key={e.name} fill={EMOTION_COLORS[e.name] || '#6366F1'} />)}
                                                </Pie>
                                                <Tooltip formatter={v => `${v}%`}
                                                    contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(0,245,255,0.3)', borderRadius: '8px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* Carried Over: Real-time Timeline Graph */}
                                {timelineData.length > 0 && (
                                    <div className="bg-[#0a0f12]/80 backdrop-blur-xl border border-white/[0.04] rounded-[24px] p-6 shadow-2xl mt-4">
                                        <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-3">SESSION TIMELINE SUMMARY</h3>
                                        <ResponsiveContainer width="100%" height={180}>
                                            <LineChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickMargin={8} />
                                                <YAxis hide domain={[0, 100]} />
                                                <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px' }} itemStyle={{ fontSize: 12 }} labelStyle={{ color: '#94a3b8', marginBottom: 4 }} />
                                                {['Happy', 'Neutral', 'Sad', 'Angry', 'Surprise', 'Fear', 'Disgust'].map(emp => (
                                                    <Line key={emp} type="monotone" dataKey={emp} stroke={EMOTION_COLORS[emp]} strokeWidth={2} dot={false} isAnimationActive={false} />
                                                ))}
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* Carried Over: Live Frame Count Summary */}
                                <div className="bg-[#0a0f12]/80 backdrop-blur-xl border border-white/[0.04] rounded-[24px] p-6 shadow-2xl mt-4">
                                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-4 text-center">SESSION FRAME METRICS</h3>
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {Object.entries(liveCounts).map(([emp, count]) => (
                                            <div key={emp} className="bg-black/40 border border-white/5 rounded-xl py-3 px-4 flex flex-col items-center min-w-[80px]">
                                                <div className="text-xl leading-none mb-1">{EMOTION_EMOJI[emp]}</div>
                                                <div className="text-emerald-400 text-xl font-bold leading-none my-1">{count}</div>
                                                <div className="text-[10px] uppercase tracking-[0.1em] text-slate-500">{emp}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-8 flex-col md:flex-row">
                                    <button onClick={handleRetry}
                                        className="px-6 py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all flex-1"
                                        style={{ background: 'rgba(255,255,255,0.05)', color: '#ffffff' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                                    >
                                        <RefreshCw className="inline" size={20} /> Retake Analysis
                                    </button>
                                    <motion.button onClick={() => nav('/voice')}
                                        className="px-8 py-4 rounded-xl flex items-center justify-center gap-2 transition-all flex-1 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] text-black font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:shadow-[0_0_30px_rgba(0,255,136,0.5)]"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        Proceed to Step 4 → Voice Analysis
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
