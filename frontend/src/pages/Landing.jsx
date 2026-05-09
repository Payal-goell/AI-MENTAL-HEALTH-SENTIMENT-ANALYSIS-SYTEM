import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, useScroll, useTransform, useSpring, AnimatePresence, useMotionValue } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
    Brain, MessageCircle, Camera, Mic, TrendingUp, Shield,
    ArrowRight, ChevronDown, ChevronRight, Zap,
    Lock, Server, Eye, Star, CheckCircle2,
} from 'lucide-react'
import AnimatedBackground from '../components/AnimatedBackground'
import GlitchText from '../components/GlitchText'
import { initLandingScrollAnimations } from '../hooks/useScrollTimeline'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)

/* ─── Feature data ──────────────────────────────────────────────────────── */
const features = [
    {
        icon: Brain, title: 'Behaviour AI', num: '01',
        desc: 'ML-powered stress pattern analysis from lifestyle data and daily behavioural signals.',
        accent: '#00ff88',
    },
    {
        icon: MessageCircle, title: 'Smart Chatbot', num: '02',
        desc: 'NLP-powered counselling with real-time crisis detection and empathetic responses.',
        accent: '#00cc9a',
    },
    {
        icon: Camera, title: 'Facial Emotion', num: '03',
        desc: 'CNN deep-learning analysis of video frames to decode micro-expressions.',
        accent: '#00dda0',
    },
    {
        icon: Mic, title: 'Voice Stress', num: '04',
        desc: 'Audio feature extraction using MFCCs for precise voice-based mood detection.',
        accent: '#00ffaa',
    },
    {
        icon: TrendingUp, title: 'Severity Engine', num: '05',
        desc: 'Multi-modal fusion scoring with intelligent clinical risk classification.',
        accent: '#00ee88',
    },
    {
        icon: Shield, title: 'Emergency Safety', num: '06',
        desc: 'Automatic high-risk detection with instant emergency helpline routing.',
        accent: '#22ffaa',
    },
]

const steps = [
    { n: '01', title: 'Create Account', desc: 'Sign up for free in under 30 seconds.', icon: Zap },
    { n: '02', title: 'Behaviour Test', desc: 'Complete a short lifestyle questionnaire.', icon: Brain },
    { n: '03', title: 'Chat Session', desc: 'Talk freely with your AI counsellor.', icon: MessageCircle },
    { n: '04', title: 'Face & Voice Scan', desc: 'Brief multimodal emotion analysis.', icon: Camera },
    { n: '05', title: 'AI Assessment', desc: 'Receive your personalised mental health score.', icon: TrendingUp },
    { n: '06', title: 'Dashboard & Insights', desc: 'Track trends and access tailored resources.', icon: Shield },
]

/* ─── Animation variants ─────────────────────────────────────────────────── */
const fadeUp = {
    hidden: { opacity: 0, y: 40, filter: 'blur(6px)' },
    show: (i = 0) => ({
        opacity: 1, y: 0, filter: 'blur(0px)',
        transition: { duration: 0.75, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
    }),
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }

const letterVariant = {
    hidden: { opacity: 0, y: 60, rotateX: -40 },
    show: (i) => ({
        opacity: 1, y: 0, rotateX: 0,
        transition: { duration: 0.7, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] },
    }),
}

/* ─── Character-split animated heading ──────────────────────────────────── */
function AnimatedHeading({ text, className, delay = 0 }) {
    const words = text.split(' ')
    return (
        <span className={className} style={{ display: 'block' }}>
            {words.map((word, wi) => (
                <span key={wi} style={{ display: 'inline-block', overflow: 'hidden', marginRight: '0.25em' }}>
                    {word.split('').map((char, ci) => (
                        <motion.span
                            key={ci}
                            custom={delay + wi * word.length + ci}
                            variants={letterVariant}
                            style={{ display: 'inline-block', transformOrigin: 'bottom' }}
                        >
                            {char}
                        </motion.span>
                    ))}
                </span>
            ))}
        </span>
    )
}

/* ─── 3D tilt card ───────────────────────────────────────────────────────── */
function TiltCard({ children, className, style }) {
    const ref = useRef(null)

    const handleMouseMove = useCallback((e) => {
        if (!ref.current) return
        const rect = ref.current.getBoundingClientRect()
        const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
        const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)
        ref.current.style.transform = `perspective(900px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateZ(4px)`
    }, [])

    const handleMouseLeave = useCallback(() => {
        if (!ref.current) return
        ref.current.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
        ref.current.style.transition = 'transform 0.6s cubic-bezier(0.22,1,0.36,1)'
    }, [])

    const handleMouseEnter = useCallback(() => {
        if (!ref.current) return
        ref.current.style.transition = 'transform 0.1s ease'
    }, [])

    return (
        <div
            ref={ref}
            className={className}
            style={{ ...style, transformStyle: 'preserve-3d' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
        >
            {children}
        </div>
    )
}

/* ─── Floating orb decorations ───────────────────────────────────────────── */
function FloatingOrb({ size, x, y, opacity, delay, color = '#00ff88' }) {
    return (
        <motion.div
            className="absolute rounded-full pointer-events-none"
            animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 8 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
            style={{
                width: size, height: size,
                left: x, top: y,
                background: `radial-gradient(circle at 35% 35%, ${color}22 0%, transparent 70%)`,
                border: `1px solid ${color}18`,
                filter: `blur(1px)`,
                opacity,
            }}
        />
    )
}

/* ─── Kinetic Brand Title ────────────────────────────────────────────────── */
/* Active Theory–style: per-char 3D entry + live cursor-reactive tilt + chromatic aberration */
const BRAND_CHARS = 'MINDCARE\u00a0AI'.split('')

const charEntry = {
    hidden: (i) => ({
        opacity: 0,
        y: 48,
        rotateX: -55,
        rotateY: i % 2 === 0 ? -18 : 18,
        filter: 'blur(8px)',
    }),
    show: (i) => ({
        opacity: 1,
        y: 0,
        rotateX: 0,
        rotateY: 0,
        filter: 'blur(0px)',
        transition: {
            duration: 0.85,
            delay: 0.05 + i * 0.055,
            ease: [0.16, 1, 0.3, 1],
        },
    }),
}

function KineticBrandTitle({ mouseX, mouseY }) {
    const [hovered, setHovered] = useState(null)

    // Smoothed tilt driven by parent mouse MotionValues
    const tiltX = useSpring(useTransform(mouseY, [-1, 1], [6, -6]), { stiffness: 80, damping: 18 })
    const tiltY = useSpring(useTransform(mouseX, [-1, 1], [-7, 7]), { stiffness: 80, damping: 18 })

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Logo orb with pulsing glow */}
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
                    width: 60, height: 60,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, rgba(0,255,136,0.22) 0%, rgba(0,204,106,0.07) 100%)',
                    border: '1.5px solid rgba(0,255,136,0.45)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                <Brain size={28} style={{ color: '#00ff88' }} />
            </motion.div>

            {/* Kinetic wordmark — cursor-tilted container, per-char anims */}
            <motion.div
                style={{
                    perspective: 900,
                    rotateX: tiltX,
                    rotateY: tiltY,
                    transformStyle: 'preserve-3d',
                    display: 'flex',
                    alignItems: 'baseline',
                    userSelect: 'none',
                }}
            >
                {BRAND_CHARS.map((char, i) => (
                    <motion.span
                        key={i}
                        custom={i}
                        variants={charEntry}
                        initial="hidden"
                        animate="show"
                        onHoverStart={() => setHovered(i)}
                        onHoverEnd={() => setHovered(null)}
                        style={{
                            display: 'inline-block',
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: 'clamp(26px, 3.5vw, 44px)',
                            fontWeight: 800,
                            letterSpacing: '0.09em',
                            textTransform: 'uppercase',
                            lineHeight: 1,
                            transformStyle: 'preserve-3d',
                            transformOrigin: 'bottom center',
                            // Split gradient: first 8 chars white→emerald, space+AI deeper emerald
                            background: i < 8
                                ? 'linear-gradient(170deg, #ffffff 10%, #d1fae5 55%, #6ee7b7 100%)'
                                : 'linear-gradient(170deg, #a7f3d0 0%, #34d399 50%, #059669 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            // Chromatic aberration: full on hovered char, partial on neighbours
                            textShadow: hovered === i
                                ? '-2px 0 2px rgba(255,0,80,0.5), 2px 0 2px rgba(0,200,255,0.5), 0 0 18px rgba(0,255,136,0.4)'
                                : hovered !== null && Math.abs(hovered - i) <= 2
                                    ? '-1px 0 1px rgba(255,0,80,0.22), 1px 0 1px rgba(0,200,255,0.22)'
                                    : 'none',
                            transition: 'text-shadow 0.15s ease',
                        }}
                        whileHover={{
                            y: -6,
                            rotateY: 12,
                            transition: { duration: 0.18, ease: 'easeOut' },
                        }}
                    >
                        {char}
                    </motion.span>
                ))}
            </motion.div>
        </div>
    )
}

/* ─── Hero Geometric Particles ───────────────────────────────────────────── */
/* Pure CSS + Framer Motion — glowing rings, squares, lines drifting for depth */
const HERO_PARTICLES = [
    { type: 'ring', w: 220, h: 220, x: '72%', y: '8%', opacity: 0.18, dur: 14, delay: 0 },
    { type: 'ring', w: 120, h: 120, x: '88%', y: '55%', opacity: 0.12, dur: 11, delay: 2.5 },
    { type: 'ring', w: 60, h: 60, x: '6%', y: '20%', opacity: 0.10, dur: 9, delay: 1 },
    { type: 'square', w: 14, h: 14, x: '15%', y: '70%', opacity: 0.22, dur: 7, delay: 0.5 },
    { type: 'square', w: 8, h: 8, x: '60%', y: '88%', opacity: 0.18, dur: 8, delay: 3 },
    { type: 'square', w: 10, h: 10, x: '82%', y: '30%', opacity: 0.15, dur: 10, delay: 1.8 },
    { type: 'line', w: 80, h: 1, x: '5%', y: '55%', opacity: 0.12, dur: 12, delay: 0.8 },
    { type: 'line', w: 50, h: 1, x: '75%', y: '75%', opacity: 0.10, dur: 13, delay: 2 },
]

function HeroParticles() {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }} aria-hidden="true">
            {HERO_PARTICLES.map((p, i) => (
                <motion.div
                    key={i}
                    animate={{
                        y: [0, p.type === 'ring' ? -18 : -10, 0],
                        rotate: p.type === 'line' ? [0, 5, 0] : p.type === 'square' ? [0, 45, 0] : [0, 0, 0],
                    }}
                    transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
                    style={{
                        position: 'absolute',
                        left: p.x, top: p.y,
                        width: p.w, height: p.h,
                        opacity: p.opacity,
                        borderRadius: p.type === 'ring' ? '50%' : p.type === 'square' ? 2 : 0,
                        border: p.type !== 'line' ? '1px solid rgba(0,255,136,0.6)' : 'none',
                        background: p.type === 'line'
                            ? 'linear-gradient(90deg, transparent, rgba(0,255,136,0.5), transparent)'
                            : p.type === 'square'
                                ? 'rgba(0,255,136,0.15)'
                                : 'transparent',
                        boxShadow: p.type === 'ring'
                            ? `0 0 ${Math.round(p.w * 0.15)}px rgba(0,255,136,0.25)`
                            : p.type === 'square'
                                ? '0 0 8px rgba(0,255,136,0.35)'
                                : 'none',
                        filter: p.type === 'ring' ? 'blur(0.5px)' : 'none',
                    }}
                />
            ))}
        </div>
    )
}

/* ─── Horizontal scroll counter ───────────────────────────────────────────── */
function CountUp({ target, suffix = '' }) {
    const [count, setCount] = useState(0)
    const ref = useRef(null)
    const started = useRef(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true
                    let start = 0
                    const duration = 1400
                    const step = (ts) => {
                        if (!start) start = ts
                        const progress = Math.min((ts - start) / duration, 1)
                        setCount(Math.floor(progress * target))
                        if (progress < 1) requestAnimationFrame(step)
                    }
                    requestAnimationFrame(step)
                }
            },
            { threshold: 0.5 }
        )
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [target])

    return <span ref={ref}>{count}{suffix}</span>
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function Landing() {
    const nav = useNavigate()
    const [footerModal, setFooterModal] = useState({ isOpen: false, title: '', message: '' });

    const heroRef = useRef(null)
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })

    // Parallax transforms
    const heroTextY = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])
    const heroBgY = useTransform(scrollYProgress, [0, 1], ['0%', '14%'])

    // Mouse position for kinetic title (normalised -1 to +1)
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    const handleMouseMove = useCallback((e) => {
        if (!heroRef.current) return
        const rect = heroRef.current.getBoundingClientRect()
        mouseX.set(((e.clientX - rect.left) / rect.width) * 2 - 1)
        mouseY.set(((e.clientY - rect.top) / rect.height) * 2 - 1)
    }, [mouseX, mouseY])

    const scrollToFeatures = () => {
        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
    }

    // ── GSAP ScrollTrigger init (runs after DOM mounts) ──────────────────
    useEffect(() => {
        const ctx = gsap.context(() => {
            initLandingScrollAnimations()
        })
        return () => ctx.revert()
    }, [])

    const navLinks = [
        { label: 'Features', id: 'features' },
        { label: 'How It Works', id: 'how-it-works' },
        { label: 'The Problem', id: 'problem' },
        { label: 'The Solution', id: 'solution' },
        { label: 'Technology', id: 'technology' },
        { label: 'Security', id: 'security' },
        { label: 'About', id: 'about' }
    ];

    return (
        <div
            className="w-full font-sans overflow-x-hidden at-dark"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", minHeight: '100vh', overflowY: 'auto' }}
        >
            {/* ── Google font import ──────────────────────────────────────────── */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400&family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes navBorderGlow {
          0%,100% { border-bottom-color: rgba(0,255,136,0.08); }
          50%      { border-bottom-color: rgba(0,255,136,0.22); }
        }
        .nav-glow { animation: navBorderGlow 4s ease-in-out infinite; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

            {/* ━━ NAVBAR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <motion.header
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="fixed top-0 left-0 right-0 z-50"
            >
                <div
                    className="mx-auto nav-glow"
                    style={{
                        background: 'rgba(8,8,8,0.72)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        borderBottom: '1px solid rgba(0,255,136,0.10)',
                    }}
                >
                    <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between px-6 md:px-16 h-16">
                        {/* Brand */}
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <motion.div
                                animate={{ rotate: [0, 8, -8, 0] }}
                                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center at-pulse"
                                style={{
                                    background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
                                    boxShadow: '0 0 16px rgba(0,255,136,0.4)',
                                }}
                            >
                                <Brain size={15} className="text-black" />
                            </motion.div>
                            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.05em', color: '#f0f0f0' }}>
                                Mind<span style={{ color: '#00ff88' }}>Care</span> AI
                            </span>
                        </div>

                        {/* Nav links */}
                        <nav className="hidden xl:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
                            {navLinks.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
                                    style={{
                                        color: 'rgba(255,255,255,0.5)',
                                        fontSize: 10.5,
                                        fontWeight: 600,
                                        letterSpacing: '0.12em',
                                        textTransform: 'uppercase',
                                        transition: 'color 0.25s ease',
                                        background: 'none',
                                        border: 'none',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#00ff88'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                                >
                                    <GlitchText mode="hover" intensity={0.6}>{item.label}</GlitchText>
                                </button>
                            ))}
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => nav('/login')}
                                style={{
                                    fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    color: 'rgba(255,255,255,0.6)',
                                    background: 'none', border: 'none',
                                    padding: '8px 16px',
                                    transition: 'color 0.25s',
                                }}
                                onHoverStart={e => { }}
                            >
                                Sign In
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.03, boxShadow: '0 0 28px rgba(0,255,136,0.45)' }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => nav('/register')}
                                className="at-btn-primary"
                                style={{ padding: '9px 22px', fontSize: 11, borderRadius: 6 }}
                            >
                                Get Started
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* ━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section
                ref={heroRef}
                className="hero-section relative w-full"
                style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}
                onMouseMove={handleMouseMove}
            >
                {/* WebGL 3D backdrop */}
                <AnimatedBackground />

                {/* Deep dark radial vignette */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `
              radial-gradient(ellipse 80% 60% at 50% 100%, rgba(8,8,8,0.9) 0%, transparent 70%),
              radial-gradient(ellipse 60% 50% at 0% 50%, rgba(8,8,8,0.5) 0%, transparent 60%),
              radial-gradient(ellipse 40% 40% at 100% 20%, rgba(0,255,136,0.04) 0%, transparent 60%)
            `,
                    }}
                    aria-hidden="true"
                />

                {/* Hero-level geometric particles */}
                <HeroParticles />

                {/* Floating orbs for depth */}
                <FloatingOrb size={400} x="68%" y="15%" opacity={0.35} delay={0} />
                <FloatingOrb size={200} x="80%" y="60%" opacity={0.2} delay={2} />
                <FloatingOrb size={120} x="10%" y="25%" opacity={0.15} delay={4} />
                <FloatingOrb size={80} x="55%" y="80%" opacity={0.12} delay={1.5} />

                {/* Hero content */}
                <motion.div
                    className="hero-text-layer relative z-10 flex flex-col justify-center"
                    style={{ minHeight: '100vh', y: heroTextY, position: 'relative', zIndex: 10 }}
                >
                    <div className="max-w-7xl mx-auto px-6 md:px-10 pt-20 pb-10">
                        <motion.div
                            variants={stagger}
                            initial="hidden"
                            animate="show"
                            className="flex flex-col gap-5 max-w-4xl"
                        >
                            {/* ── Kinetic brand title ──────────────────────────────────────── */}
                            <motion.div variants={fadeUp}>
                                <KineticBrandTitle mouseX={mouseX} mouseY={mouseY} />
                            </motion.div>

                            {/* Eyebrow */}
                            <motion.div variants={fadeUp} className="flex items-center gap-3">
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 10px rgba(0,255,136,0.8)' }} />
                                <GlitchText
                                    mode="auto"
                                    intensity={0.8}
                                    className="font-overline"
                                    style={{ fontSize: 10, letterSpacing: '0.26em', textTransform: 'uppercase', color: '#00ff88' }}
                                >
                                    Multimodal AI Mental Health
                                </GlitchText>
                            </motion.div>

                            {/* Main headline — character split */}
                            <motion.div
                                variants={stagger}
                                initial="hidden"
                                animate="show"
                                style={{ userSelect: 'none' }}
                            >
                                <div style={{ overflow: 'hidden', marginBottom: 6 }}>
                                    <motion.span
                                        custom={0}
                                        variants={letterVariant}
                                        style={{
                                            display: 'block',
                                            fontFamily: "'Space Grotesk', sans-serif",
                                            fontSize: 11,
                                            fontWeight: 700,
                                            letterSpacing: '0.28em',
                                            textTransform: 'uppercase',
                                            color: 'rgba(52,211,153,0.80)',
                                        }}
                                    >
                                        Understanding
                                    </motion.span>
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                    <motion.span
                                        style={{
                                            fontSize: 'clamp(52px, 9vw, 120px)',
                                            fontWeight: 900,
                                            lineHeight: 0.95,
                                            letterSpacing: '-0.03em',
                                            display: 'block',
                                            background: 'linear-gradient(120deg, #00ff88 0%, #00cc6a 40%, #ffffff 70%, #00ff88 100%)',
                                            backgroundSize: '250% auto',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text',
                                            animation: 'at-shimmer 6s linear infinite',
                                        }}
                                        initial={{ opacity: 0, y: 60 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                    >
                                        Your Mind
                                    </motion.span>
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                    <motion.span
                                        style={{
                                            fontSize: 'clamp(52px, 9vw, 120px)',
                                            fontWeight: 900,
                                            lineHeight: 0.95,
                                            letterSpacing: '-0.03em',
                                            display: 'block',
                                            color: '#f0f0f0',
                                        }}
                                        initial={{ opacity: 0, y: 60 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.9, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
                                    >
                                        At Scale
                                    </motion.span>
                                </div>
                            </motion.div>

                            {/* Subtitle */}
                            <motion.p
                                variants={fadeUp}
                                custom={4}
                                className="font-display"
                                style={{
                                    fontSize: 'clamp(12px, 1.1vw, 14px)',
                                    color: 'rgba(148,163,184,0.72)',
                                    lineHeight: 1.75,
                                    maxWidth: 460,
                                    fontWeight: 400,
                                    letterSpacing: '0.01em',
                                    marginTop: 2,
                                }}
                            >
                                Multimodal AI analyzing{' '}
                                <span style={{ color: 'rgba(167,243,208,0.85)', fontWeight: 500 }}>behavior</span>,{' '}
                                <span style={{ color: 'rgba(167,243,208,0.85)', fontWeight: 500 }}>facial expressions</span>{' '}
                                &amp; <span style={{ color: 'rgba(167,243,208,0.85)', fontWeight: 500 }}>vocal stress</span>{' '}
                                — delivering real-time clinical insights and personalized mental health support.
                            </motion.p>

                            {/* CTAs */}
                            <motion.div variants={fadeUp} custom={5} className="flex items-center gap-4 flex-wrap">
                                <motion.button
                                    whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(0,255,136,0.45), 0 8px 32px rgba(0,0,0,0.3)' }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => nav('/register')}
                                    className="at-btn-primary group flex items-center gap-2.5"
                                    style={{ padding: '14px 32px', fontSize: 12 }}
                                >
                                    Begin Assessment
                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => nav('/login')}
                                    className="at-btn-secondary group flex items-center gap-2"
                                    style={{ padding: '14px 28px', fontSize: 12 }}
                                >
                                    Sign In
                                    <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                                </motion.button>
                            </motion.div>

                            {/* Stats row */}
                            <motion.div
                                variants={stagger}
                                className="hero-stats flex items-center gap-10 flex-wrap pt-4"
                                style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 16 }}
                            >
                                {[
                                    { value: 4, suffix: '', label: 'AI Models' },
                                    { value: 100, suffix: '%', label: 'Private & Secure' },
                                    { value: 2, suffix: 'min', label: 'Per Assessment' },
                                ].map(({ value, suffix, label }, i) => (
                                    <motion.div key={label} variants={fadeUp} custom={i} className="flex flex-col gap-1">
                                        <span style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: '#00ff88', letterSpacing: '-0.02em', lineHeight: 1 }}>
                                            <CountUp target={value} suffix={suffix} />
                                        </span>
                                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                                            {label}
                                        </span>
                                    </motion.div>
                                ))}
                                <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.1)' }} className="hidden sm:block" />
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                                    className="hidden sm:block">
                                    Free to start · No payment required
                                </span>
                            </motion.div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Scroll indicator */}
                <motion.button
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 at-scroll-indicator"
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)' }}
                    onClick={scrollToFeatures}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.5, duration: 0.8 }}
                >
                    <span style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Scroll</span>
                    <ChevronDown size={16} />
                </motion.button>
            </section>

            {/* ━━ FEATURES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section
                id="features"
                className="features-section relative w-full"
                style={{ background: 'linear-gradient(180deg, #05110d 0%, #04100c 100%)', padding: 'clamp(60px, 10vw, 140px) clamp(20px, 5vw, 60px)', position: 'relative', zIndex: 10 }}
            >
                {/* Subtle grid lines */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `
              linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)
            `,
                        backgroundSize: '80px 80px',
                    }}
                    aria-hidden="true"
                />

                <div className="max-w-7xl mx-auto flex flex-col gap-16 relative z-10">
                    {/* Section header */}
                    <motion.div
                        variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}
                        className="flex flex-col gap-4"
                    >
                        <span className="font-overline" style={{ fontSize: 10, letterSpacing: '0.26em', textTransform: 'uppercase', color: '#00ff88' }}>
                            Capabilities
                        </span>
                        <h2 className="scroll-reveal-heading font-display" style={{ fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#f0f0f0', lineHeight: 1.05, maxWidth: 640 }}>
                            Powered by Advanced AI
                        </h2>
                        <p className="at-body" style={{ fontSize: 15, color: 'rgba(203,213,225,0.55)', maxWidth: 480, lineHeight: 1.8, fontWeight: 300 }}>
                            Six specialist AI engines operating in concert to deliver the most accurate picture of your mental wellbeing.
                        </p>
                    </motion.div>

                    {/* Feature grid */}
                    <motion.div
                        variants={stagger} initial="hidden" whileInView="show"
                        viewport={{ once: true, margin: '-60px' }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        {features.map((f, i) => (
                            <motion.div key={f.title} variants={fadeUp} custom={i}>
                                <TiltCard
                                    data-cursor="view"
                                    className="feature-card group relative flex flex-col gap-6 p-6 rounded-xl at-noise"
                                    style={{
                                        background: 'rgba(255,255,255,0.035)',
                                        border: '1px solid rgba(255,255,255,0.07)',
                                        backdropFilter: 'blur(12px)',
                                        cursor: 'default',
                                        transition: 'border-color 0.3s ease, background 0.3s ease',
                                        minHeight: 210,
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = `${f.accent}35`
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.055)'
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.035)'
                                    }}
                                >
                                    {/* Top row */}
                                    <div className="flex items-start justify-between">
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ background: `${f.accent}12`, border: `1px solid ${f.accent}25` }}
                                        >
                                            <f.icon size={18} style={{ color: f.accent }} />
                                        </div>
                                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', fontWeight: 600, letterSpacing: '0.1em' }}>
                                            {f.num}
                                        </span>
                                    </div>

                                    {/* Text */}
                                    <div className="flex flex-col gap-2">
                                        <h3 className="font-display" style={{ fontSize: 14, fontWeight: 600, color: '#f0f0f0', letterSpacing: '-0.01em' }}>
                                            {f.title}
                                        </h3>
                                        <p className="at-body" style={{ fontSize: 12.5, color: 'rgba(203,213,225,0.50)', lineHeight: 1.75, fontWeight: 300 }}>
                                            {f.desc}
                                        </p>
                                    </div>

                                    {/* Bottom accent line */}
                                    <div style={{ position: 'absolute', bottom: 0, left: '16px', right: '16px', height: 1, background: `linear-gradient(90deg, transparent, ${f.accent}30, transparent)` }} />
                                </TiltCard>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ━━ HOW IT WORKS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section
                id="how-it-works"
                className="relative w-full"
                style={{ background: '#04100c', padding: 'clamp(60px, 10vw, 140px) clamp(20px, 5vw, 60px)', position: 'relative', zIndex: 10 }}
            >
                {/* Green ambient bloom */}
                <div
                    className="absolute pointer-events-none"
                    style={{
                        width: 600, height: 600, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 65%)',
                        top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                        filter: 'blur(60px)',
                    }}
                    aria-hidden="true"
                />

                <div className="max-w-7xl mx-auto relative z-10 flex flex-col gap-16">
                    {/* Header */}
                    <motion.div
                        variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                        className="flex flex-col gap-4"
                    >
                        <span className="font-overline" style={{ fontSize: 10, letterSpacing: '0.26em', textTransform: 'uppercase', color: '#00ff88' }}>
                            Process
                        </span>
                        <h2 className="scroll-reveal-heading font-display" style={{ fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#f0f0f0', lineHeight: 1.05 }}>
                            How It Works
                        </h2>
                        <p className="at-body" style={{ fontSize: 15, color: 'rgba(203,213,225,0.55)', maxWidth: 420, lineHeight: 1.8, fontWeight: 300 }}>
                            From sign-up to personalised insight in six guided steps.
                        </p>
                    </motion.div>

                    {/* Steps — two column grid */}
                    <motion.div
                        variants={stagger} initial="hidden" whileInView="show"
                        viewport={{ once: true, margin: '-50px' }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        {steps.map((step, i) => (
                            <motion.div
                                key={step.n}
                                variants={{
                                    hidden: { opacity: 0, x: i % 2 === 0 ? -40 : 40, filter: 'blur(6px)' },
                                    show: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } },
                                }}
                                className={`group flex items-start gap-5 p-5 rounded-xl ${i % 2 === 0 ? 'step-card-even' : 'step-card-odd'}`}
                                style={{
                                    background: 'rgba(255,255,255,0.025)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    backdropFilter: 'blur(8px)',
                                    transition: 'border-color 0.3s ease, background 0.3s ease',
                                }}
                                whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                                onHoverStart={e => { }}
                            >
                                {/* Step number node */}
                                <div
                                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{
                                        background: 'rgba(0,255,136,0.06)',
                                        border: '1px solid rgba(0,255,136,0.2)',
                                        transition: 'background 0.3s ease, border-color 0.3s ease',
                                    }}
                                >
                                    <span style={{ fontSize: 11, fontWeight: 800, color: '#00ff88', letterSpacing: '0.05em' }}>
                                        {step.n}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2">
                                        <step.icon size={13} style={{ color: '#00ff88', opacity: 0.7 }} />
                                        <span className="font-display" style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0', letterSpacing: '-0.01em' }}>
                                            {step.title}
                                        </span>
                                    </div>
                                    <p className="at-body" style={{ fontSize: 12, color: 'rgba(203,213,225,0.48)', lineHeight: 1.75, fontWeight: 300 }}>
                                        {step.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ━━ MULTIMODAL ADVANTAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section
                id="problem"
                className="relative w-full"
                style={{ background: 'linear-gradient(180deg, #04100c 0%, #051209 100%)', padding: 'clamp(80px, 12vw, 160px) clamp(20px, 5vw, 60px)', position: 'relative', zIndex: 10 }}
            >
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0,255,136,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.022) 1px, transparent 1px)', backgroundSize: '100px 100px' }} aria-hidden="true" />

                <div className="max-w-7xl mx-auto flex flex-col gap-24 relative z-10">

                    {/* Row 1 — text left, image right */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
                    >
                        <div className="flex flex-col gap-6">
                            <span className="font-overline" style={{ color: '#00ff88', fontSize: 10, letterSpacing: '0.26em' }}>The Problem</span>
                            <h2 className="font-display" style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#f0f0f0', lineHeight: 1.1 }}>
                                Human emotion is{' '}
                                <span className="at-gradient-text">too complex</span>{' '}
                                for a single signal.
                            </h2>
                            <p className="at-body" style={{ fontSize: 15, color: 'rgba(203,213,225,0.58)', lineHeight: 1.85, maxWidth: 480 }}>
                                A chatbot can read your words — but words are just 7% of human communication.
                                True mental health insight demands reading{' '}
                                <strong style={{ color: 'rgba(167,243,208,0.9)', fontWeight: 600 }}>facial micro-expressions</strong>,{' '}
                                <strong style={{ color: 'rgba(167,243,208,0.9)', fontWeight: 600 }}>vocal tremors</strong>, and{' '}
                                <strong style={{ color: 'rgba(167,243,208,0.9)', fontWeight: 600 }}>behavioural patterns</strong> — simultaneously.
                            </p>
                            <div className="flex flex-col gap-3 mt-2">
                                {[
                                    { icon: Camera, label: 'Facial Analysis', badge: 'Live Capture', desc: 'Captures visual signals: body language, micro-expressions, and eye movement.' },
                                    { icon: Mic, label: 'Voice Stress', badge: 'Real-Time', desc: 'Analyzes vocal signals: tone, pitch, tremors, and speech patterns.' },
                                    { icon: Brain, label: 'Behaviour AI', badge: 'Active', desc: 'Analyzes lifestyle data, habit patterns, and chatbot context for clinical depth.' },
                                ].map(({ icon: Icon, label, badge, desc }) => (
                                    <div key={label}
                                        className="flex items-center gap-4"
                                        style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', transition: 'border-color 0.3s' }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,255,136,0.25)'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                                    >
                                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Icon size={16} style={{ color: '#00ff88' }} />
                                        </div>
                                        <div className="flex flex-col gap-0.5 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-display" style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0' }}>{label}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 20, background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.22)' }}>
                                                    <motion.span
                                                        animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
                                                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                                                        style={{ width: 5, height: 5, borderRadius: '50%', background: '#00ff88', display: 'inline-block', flexShrink: 0 }}
                                                    />
                                                    <span style={{ fontSize: 9, color: '#00ff88', fontFamily: "'Space Mono',monospace", letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1 }}>{badge}</span>
                                                </span>
                                            </div>
                                            <span style={{ fontSize: 11, color: 'rgba(203,213,225,0.45)' }}>{desc}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Image 1 — floating 3D glass frame, natural colors */}
                        <div style={{ perspective: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <motion.div
                                animate={{ y: [0, -14, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                                whileHover={{ scale: 1.03, rotateY: 4 }}
                                style={{
                                    borderRadius: 24,
                                    overflow: 'hidden',
                                    border: '1px solid rgba(255,255,255,0.10)',
                                    boxShadow: '0 0 0 1px rgba(0,255,136,0.08), 0 0 40px rgba(16,185,129,0.15), 0 40px 80px rgba(0,0,0,0.5)',
                                    position: 'relative',
                                    aspectRatio: '4/3',
                                    width: '100%',
                                    transformStyle: 'preserve-3d',
                                }}
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1618044733300-9472054094ee?w=800&q=80"
                                    alt="Abstract AI mind network"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                                />
                                {/* Subtle dark vignette only — no color tint */}
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(4,16,12,0.55) 100%)' }} />
                                {/* Status pill */}
                                <div style={{ position: 'absolute', bottom: 18, left: 18, display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 8, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.10)' }}>
                                    <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', flexShrink: 0 }} />
                                    <span style={{ fontSize: 10, color: '#fff', fontFamily: "'Space Mono', monospace", letterSpacing: '0.12em', opacity: 0.8 }}>MULTIMODAL FUSION ACTIVE</span>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Row 2 — image left, text right */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
                    >
                        {/* Image 2 — floating 3D glass frame, natural colors, offset phase */}
                        <div style={{ perspective: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="lg:order-first order-last">
                            <motion.div
                                animate={{ y: [0, -12, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                                whileHover={{ scale: 1.03, rotateY: -4 }}
                                style={{
                                    borderRadius: 24,
                                    overflow: 'hidden',
                                    border: '1px solid rgba(255,255,255,0.10)',
                                    boxShadow: '0 0 0 1px rgba(0,255,136,0.08), 0 0 40px rgba(16,185,129,0.15), 0 40px 80px rgba(0,0,0,0.5)',
                                    position: 'relative',
                                    aspectRatio: '4/3',
                                    width: '100%',
                                    transformStyle: 'preserve-3d',
                                }}
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80"
                                    alt="Neural network data visualization"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                                />
                                {/* Subtle dark vignette only — no color tint */}
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(4,16,12,0.55) 100%)' }} />
                                {/* Status pill */}
                                <div style={{ position: 'absolute', top: 18, right: 18, display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 8, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.10)' }}>
                                    <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2.2, repeat: Infinity, delay: 0.5 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', flexShrink: 0 }} />
                                    <span style={{ fontSize: 10, color: '#fff', fontFamily: "'Space Mono', monospace", letterSpacing: '0.12em', opacity: 0.8 }}>CLINICAL-GRADE OUTPUT</span>
                                </div>
                            </motion.div>
                        </div>

                        <div id="solution" className="flex flex-col gap-6">
                            <span className="font-overline" style={{ color: '#00ff88', fontSize: 10, letterSpacing: '0.26em' }}>The Solution</span>
                            <h2 className="font-display" style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#f0f0f0', lineHeight: 1.1 }}>
                                One platform.{' '}
                                <span className="at-gradient-text">Four AI models.</span>{' '}
                                Complete picture.
                            </h2>
                            <p className="at-body" style={{ fontSize: 15, color: 'rgba(203,213,225,0.58)', lineHeight: 1.85, maxWidth: 480 }}>
                                MindCare AI fuses all four modalities into a single severity score — giving you the accuracy of a clinical multi-session assessment in under two minutes.
                            </p>
                            <div className="flex flex-col gap-2 mt-2">
                                {[
                                    'Analyzes 4 independent data streams simultaneously',
                                    'Weighted fusion engine normalises cross-modal signals',
                                    'Risk stratification with clinical-grade precision',
                                    'Real-time emergency routing for high-risk detections',
                                ].map((item) => (
                                    <div key={item} className="flex items-start gap-3">
                                        <CheckCircle2 size={15} style={{ color: '#00ff88', marginTop: 2, flexShrink: 0 }} />
                                        <span style={{ fontSize: 13, color: 'rgba(203,213,225,0.65)', lineHeight: 1.6 }}>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ━━ TECHNOLOGY BENTO GRID ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section
                id="technology"
                className="relative w-full"
                style={{ background: '#040f0b', padding: 'clamp(80px, 12vw, 160px) clamp(20px, 5vw, 60px)', position: 'relative', zIndex: 10 }}
            >
                <div className="max-w-7xl mx-auto flex flex-col gap-14 relative z-10">
                    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} className="flex flex-col gap-4">
                        <span className="font-overline" style={{ color: '#00ff88', fontSize: 10, letterSpacing: '0.26em' }}>Under the Hood</span>
                        <h2 className="font-display" style={{ fontSize: 'clamp(28px, 4vw, 56px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#f0f0f0', lineHeight: 1.05, maxWidth: 560 }}>
                            The AI Technology Stack
                        </h2>
                        <p className="at-body" style={{ fontSize: 15, color: 'rgba(203,213,225,0.55)', maxWidth: 500, lineHeight: 1.8 }}>
                            Four specialist engines, each trained on domain-specific datasets, fused by a clinical weighting layer.
                        </p>
                    </motion.div>

                    <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-50px' }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            {
                                icon: Camera, num: '01', title: 'Facial Emotion', subtitle: 'ResNet50V2 Architecture',
                                desc: 'Processes facial image frames to provide baseline emotion detection. Capable of baseline visual recognition with a 63% accuracy rate.',
                                tags: ['ResNet50V2', 'TensorFlow', 'OpenCV'],
                                accent: '#00ff88',
                                img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&q=70',
                            },
                            {
                                icon: Mic, num: '02', title: 'Voice Stress', subtitle: 'Custom CNN Analysis',
                                desc: 'Extracts 22 MFCCs (yielding 2,376 features) per audio frame. A highly stable model identifying 7 emotional states from vocal patterns with 98% accuracy.',
                                tags: ['Custom CNN', 'MFCC', 'LibROSA'],
                                accent: '#00dda0',
                                img: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&q=70',
                            },
                            {
                                icon: Brain, num: '03', title: 'Behaviour AI', subtitle: 'Gradient Boosting',
                                desc: 'Analyzes user behavior patterns and interaction metadata to detect non-linear stress triggers and behavioral shifts with 94% accuracy.',
                                tags: ['Gradient Boosting', 'Metadata', 'Scikit-learn'],
                                accent: '#00cc9a',
                                img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=70',
                            },
                            {
                                icon: MessageCircle, num: '04', title: 'Smart Chatbot & Fusion', subtitle: 'LLM + Weighted Fusion',
                                desc: 'Acts as the central fusion engine. If visual confidence is low, the system compensates using the 98% accurate vocal and 94% accurate behavioral models for ultimate reliability.',
                                tags: ['LLM', 'Fusion Engine', 'OpenRouter', 'NLP'],
                                accent: '#22ffaa',
                                img: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=70',
                            },
                        ].map((card) => (
                            <motion.div
                                key={card.title}
                                variants={fadeUp}
                                className={`relative flex flex-col gap-5 p-6 rounded-2xl h-full`}
                                style={{ background: 'rgba(255,255,255,0.032)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', minHeight: 280, overflow: 'hidden', transition: 'border-color 0.35s ease, box-shadow 0.35s ease' }}
                                whileHover={{ borderColor: `${card.accent}35`, boxShadow: `0 0 40px ${card.accent}12`, transition: { duration: 0.3 } }}
                            >
                                {card.img && (
                                    <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.12 }}>
                                        <img src={card.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'hue-rotate(120deg) saturate(1.5)' }} />
                                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 0%, #040f0b 80%)' }} />
                                    </div>
                                )}
                                <div className="relative z-10 flex items-start justify-between">
                                    <div style={{ width: 42, height: 42, borderRadius: 10, background: `${card.accent}14`, border: `1px solid ${card.accent}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <card.icon size={18} style={{ color: card.accent }} />
                                    </div>
                                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', fontWeight: 700, letterSpacing: '0.1em' }}>{card.num}</span>
                                </div>
                                <div className="relative z-10 flex flex-col gap-1">
                                    <span className="font-overline" style={{ fontSize: 9, color: card.accent, letterSpacing: '0.22em', opacity: 0.7 }}>{card.subtitle}</span>
                                    <h3 className="font-display" style={{ fontSize: 16, fontWeight: 600, color: '#f0f0f0', letterSpacing: '-0.01em' }}>{card.title}</h3>
                                </div>
                                <p className="relative z-10 at-body" style={{ fontSize: 12.5, color: 'rgba(203,213,225,0.48)', lineHeight: 1.75, fontWeight: 300, flexGrow: 1 }}>{card.desc}</p>
                                <div className="relative z-10 flex flex-wrap gap-2">
                                    {card.tags.map(tag => (
                                        <span key={tag} style={{ fontSize: 10, color: card.accent, background: `${card.accent}10`, border: `1px solid ${card.accent}20`, padding: '3px 10px', borderRadius: 20, fontFamily: "'Space Mono', monospace", letterSpacing: '0.06em' }}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <div style={{ position: 'absolute', bottom: 0, left: 16, right: 16, height: 1, background: `linear-gradient(90deg, transparent, ${card.accent}28, transparent)` }} />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ━━ PRIVACY & SECURITY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section
                id="security"
                className="relative w-full"
                style={{ background: 'linear-gradient(180deg, #040f0b 0%, #030e09 100%)', padding: 'clamp(80px, 12vw, 160px) clamp(20px, 5vw, 60px)', position: 'relative', zIndex: 10 }}
            >
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(0,255,136,0.055) 0%, transparent 70%)' }} aria-hidden="true" />
                <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-14 relative z-10">
                    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="flex flex-col items-center gap-5">
                        <span className="font-overline" style={{ color: '#00ff88', fontSize: 10, letterSpacing: '0.26em' }}>Trust &amp; Compliance</span>
                        <h2 className="font-display" style={{ fontSize: 'clamp(28px, 4vw, 56px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#f0f0f0', lineHeight: 1.05, maxWidth: 520 }}>
                            Your data is{' '}
                            <span className="at-gradient-text">never our product.</span>
                        </h2>
                        <p className="at-body" style={{ fontSize: 15, color: 'rgba(203,213,225,0.55)', lineHeight: 1.85, maxWidth: 480 }}>
                            Mental health is deeply personal. MindCare AI is engineered from the ground up to keep your sessions private, your data secure, and your identity protected.
                        </p>
                    </motion.div>

                    <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-50px' }} className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full">
                        {[
                            { icon: Lock, title: 'End-to-End Encryption', desc: 'All session data, assessments, and chat logs are encrypted in transit and at rest using AES-256.' },
                            { icon: Eye, title: 'Zero Data Retention', desc: 'Face and voice streams are processed in real-time and immediately discarded. No biometric data is ever stored.' },
                            { icon: Server, title: 'Secure Architecture', desc: 'Isolated user namespaces, read-only APIs, and role-based access control across every service boundary.' },
                        ].map(({ icon: Icon, title, desc }) => (
                            <motion.div
                                key={title}
                                variants={fadeUp}
                                className="flex flex-col items-center text-center gap-5 p-7 rounded-2xl"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,255,136,0.12)', backdropFilter: 'blur(12px)', transition: 'box-shadow 0.4s ease, border-color 0.4s ease' }}
                                whileHover={{ boxShadow: '0 0 45px rgba(0,255,136,0.18)', borderColor: 'rgba(0,255,136,0.28)', transition: { duration: 0.3 } }}
                            >
                                <motion.div
                                    animate={{ boxShadow: ['0 0 18px rgba(0,255,136,0.2)', '0 0 38px rgba(0,255,136,0.48)', '0 0 18px rgba(0,255,136,0.2)'] }}
                                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                                    style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,204,106,0.06))', border: '1px solid rgba(0,255,136,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Icon size={26} style={{ color: '#00ff88' }} />
                                </motion.div>
                                <h3 className="font-display" style={{ fontSize: 15, fontWeight: 600, color: '#f0f0f0', letterSpacing: '-0.01em' }}>{title}</h3>
                                <p className="at-body" style={{ fontSize: 12.5, color: 'rgba(203,213,225,0.50)', lineHeight: 1.75, fontWeight: 300 }}>{desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ━━ CINEMATIC CTA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section
                id="about"
                className="cta-section relative w-full overflow-hidden"
                style={{ background: '#030e09', padding: 'clamp(100px, 14vw, 200px) clamp(20px, 5vw, 60px)', position: 'relative', zIndex: 10 }}
            >
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,255,136,0.09) 0%, rgba(0,255,136,0.03) 35%, transparent 70%)' }} aria-hidden="true" />
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0,255,136,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px' }} aria-hidden="true" />

                <motion.div
                    variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                    className="cta-content max-w-4xl mx-auto flex flex-col items-center text-center gap-10 relative z-10"
                >
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], boxShadow: ['0 0 40px rgba(0,255,136,0.3)', '0 0 90px rgba(0,255,136,0.6)', '0 0 40px rgba(0,255,136,0.3)'] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,204,106,0.08))', border: '1.5px solid rgba(0,255,136,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Brain size={36} style={{ color: '#00ff88' }} />
                    </motion.div>

                    <div className="flex flex-col gap-5">
                        <span className="font-overline" style={{ color: '#00ff88', fontSize: 10, letterSpacing: '0.26em' }}>Take Control Today</span>
                        <h2 className="font-display" style={{ fontSize: 'clamp(36px, 6vw, 80px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#f0f0f0', lineHeight: 1.0 }}>
                            Take Control of Your{' '}
                            <span className="at-gradient-text">Mental Wellness.</span>
                        </h2>
                        <p className="at-body" style={{ fontSize: 17, color: 'rgba(203,213,225,0.55)', lineHeight: 1.85, maxWidth: 560, margin: '0 auto', fontWeight: 300 }}>
                            A comprehensive AI assessment in under 2 minutes. Free, private, and built with clinical-grade precision. Your journey to clarity starts now.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap justify-center">
                        <motion.button
                            whileHover={{ scale: 1.04, boxShadow: '0 0 60px rgba(0,255,136,0.55), 0 16px 50px rgba(0,0,0,0.5)' }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => nav('/register')}
                            className="at-btn-primary group flex items-center gap-3"
                            style={{ fontSize: 12, padding: '18px 48px' }}
                        >
                            Get Started Free
                            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-200" />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => nav('/login')}
                            className="at-btn-secondary group flex items-center gap-2"
                            style={{ fontSize: 12, padding: '18px 36px' }}
                        >
                            Sign In to Dashboard
                        </motion.button>
                    </div>

                    <div className="flex items-center gap-8 flex-wrap justify-center" style={{ paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        {['100% Private', 'No payment required', 'Free Forever', 'Clinical-Grade AI'].map((item) => (
                            <div key={item} className="flex items-center gap-2">
                                <CheckCircle2 size={13} style={{ color: '#00ff88', opacity: 0.7 }} />
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ━━ FOOTER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <footer style={{ background: '#020b06', borderTop: '1px solid rgba(255,255,255,0.045)', position: 'relative', zIndex: 10 }}>
                <div className="max-w-7xl mx-auto px-6 md:px-10">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 py-12" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="flex items-center gap-3">
                            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, rgba(0,255,136,0.22), rgba(0,204,106,0.08))', border: '1px solid rgba(0,255,136,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Brain size={16} style={{ color: '#00ff88' }} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-display" style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f0', letterSpacing: '0.04em' }}>MINDCARE AI</span>
                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Multimodal Mental Health System</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => nav('/login')}
                                style={{
                                    fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
                                    textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)',
                                    background: 'none', border: 'none', padding: '8px 16px', transition: 'color 0.25s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#00ff88'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                            >
                                Sign In
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.03, boxShadow: '0 0 28px rgba(0,255,136,0.45)' }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => nav('/register')}
                                className="at-btn-primary"
                                style={{ padding: '9px 22px', fontSize: 11, borderRadius: 6 }}
                            >
                                Register
                            </motion.button>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.03em' }}>
                            © 2025 MindCare AI — Smart Mental Health Counselling System
                        </span>
                        <div className="flex items-center gap-6">
                            {[
                                { label: 'Privacy Policy', message: 'MindCare AI ensures 100% data privacy. Your session data is end-to-end encrypted and never stored permanently.' },
                                { label: 'Terms of Use', message: 'By using MindCare AI, you agree to our terms. Please note: This is an AI support tool and not a substitute for clinical medical advice.' },
                                { label: 'Contact', message: 'Need help? Reach out to our mental health support team at support@mindcareai.com' }
                            ].map(item => (
                                <button key={item.label}
                                    onClick={() => setFooterModal({ isOpen: true, title: item.label, message: item.message })}
                                    style={{ background: 'none', border: 'none', fontSize: 11, color: 'rgba(255,255,255,0.22)', cursor: 'pointer', transition: 'color 0.25s', fontFamily: "'Space Grotesk',sans-serif" }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.22)'}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', textAlign: 'center' }}>
                            ⚠ AI support tool only — not a substitute for professional medical advice.
                        </p>
                    </div>
                </div>
            </footer>

            {/* Custom Footer Modal */}
            <AnimatePresence>
                {footerModal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setFooterModal({ ...footerModal, isOpen: false })}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
                        />
                        
                        {/* Modal Card */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#0a1511] border border-emerald-500/20 rounded-3xl p-8 max-w-md w-full shadow-[0_40px_80px_rgba(0,0,0,0.6)] relative z-10 overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-cyan-400" />
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                            
                            <h3 className="font-display text-2xl font-bold text-white mb-4 pr-8">{footerModal.title}</h3>
                            <p className="text-slate-300 text-sm leading-relaxed mb-8">{footerModal.message}</p>
                            
                            <div className="flex justify-end">
                                <button 
                                    onClick={() => setFooterModal({ ...footerModal, isOpen: false })}
                                    className="px-6 py-2.5 bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/50 rounded-xl text-sm font-bold text-white transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

