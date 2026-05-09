import React, { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/* ─────────────────────────────────────────────────────────────────────────
   Enhanced CustomCursor
   Modes:
     default         → ring + dot (green)
     hover           → ring expands + glows           (any button/link)
     [data-cursor=view]  → filled disc with "VIEW" label
     [data-cursor=drag]  → crosshair +
     [data-cursor=text]  → thin I-beam bar
   + Cursor trail    → 8 ghost dots that fade behind the ring
───────────────────────────────────────────────────────────────────────── */

const TRAIL_LENGTH = 8

export default function CustomCursor() {
    const [state, setState] = useState('default') // 'default' | 'hover' | 'view' | 'drag' | 'text'
    const [clicked, setClicked] = useState(false)
    const [visible, setVisible] = useState(false)

    const rawX = useMotionValue(-200)
    const rawY = useMotionValue(-200)

    // Ring — spring lagged
    const ringX = useSpring(rawX, { stiffness: 160, damping: 26 })
    const ringY = useSpring(rawY, { stiffness: 160, damping: 26 })

    // Dot — near-instant
    const dotX = useSpring(rawX, { stiffness: 2200, damping: 90 })
    const dotY = useSpring(rawY, { stiffness: 2200, damping: 90 })

    // Trail positions stored as plain refs (no re-render)
    const trailRef = useRef(
        Array.from({ length: TRAIL_LENGTH }, () => ({ x: -200, y: -200 }))
    )
    const trailEls = useRef([])
    const posRef = useRef({ x: -200, y: -200 })

    useEffect(() => {
        if (typeof window === 'undefined') return
        if (window.matchMedia('(pointer: coarse)').matches) return

        const onMove = (e) => {
            rawX.set(e.clientX)
            rawY.set(e.clientY)
            posRef.current = { x: e.clientX, y: e.clientY }
            if (!visible) setVisible(true)
        }

        const onOver = (e) => {
            const el = e.target
            const cursor = el.closest('[data-cursor]')
            if (cursor) {
                setState(cursor.dataset.cursor)
            } else if (el.closest('button, a, label, input, select, textarea')) {
                setState('hover')
            } else {
                setState('default')
            }
        }

        const onDown = () => setClicked(true)
        const onUp = () => setClicked(false)
        const onLeave = () => setVisible(false)

        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseover', onOver)
        window.addEventListener('mousedown', onDown)
        window.addEventListener('mouseup', onUp)
        document.documentElement.addEventListener('mouseleave', onLeave)

        // Animate trail via rAF — no React state to keep it at 60fps
        let rafId
        const animateTrail = () => {
            const { x, y } = posRef.current
            const trail = trailRef.current
            // Push new position, shift array
            for (let i = TRAIL_LENGTH - 1; i > 0; i--) {
                trail[i].x += (trail[i - 1].x - trail[i].x) * 0.35
                trail[i].y += (trail[i - 1].y - trail[i].y) * 0.35
            }
            trail[0].x += (x - trail[0].x) * 0.55
            trail[0].y += (y - trail[0].y) * 0.55

            trailEls.current.forEach((el, i) => {
                if (!el) return
                el.style.transform = `translate(${trail[i].x - 3}px, ${trail[i].y - 3}px)`
                el.style.opacity = String((1 - i / TRAIL_LENGTH) * 0.18)
            })
            rafId = requestAnimationFrame(animateTrail)
        }
        animateTrail()

        return () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseover', onOver)
            window.removeEventListener('mousedown', onDown)
            window.removeEventListener('mouseup', onUp)
            document.documentElement.removeEventListener('mouseleave', onLeave)
            cancelAnimationFrame(rafId)
        }
    }, [visible])

    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return null

    const isView = state === 'view'
    const isDrag = state === 'drag'
    const isText = state === 'text'
    const isHover = state === 'hover'

    return (
        <>
            {/* ── Trail ghost dots ────────────────────────────────────────────── */}
            {Array.from({ length: TRAIL_LENGTH }, (_, i) => (
                <div
                    key={i}
                    ref={el => { trailEls.current[i] = el }}
                    style={{
                        position: 'fixed',
                        top: 0, left: 0,
                        width: 6, height: 6,
                        borderRadius: '50%',
                        background: '#00ff88',
                        pointerEvents: 'none',
                        zIndex: 9997,
                        willChange: 'transform',
                    }}
                />
            ))}

            {/* ── Outer ring ─────────────────────────────────────────────────── */}
            <motion.div
                style={{
                    x: ringX, y: ringY,
                    translateX: '-50%', translateY: '-50%',
                    opacity: visible ? 1 : 0,
                    position: 'fixed', top: 0, left: 0,
                    pointerEvents: 'none', zIndex: 9998,
                }}
                animate={{
                    width: isView ? 72 : isDrag ? 40 : isText ? 3 : isHover ? 52 : clicked ? 26 : 36,
                    height: isView ? 72 : isDrag ? 40 : isText ? 28 : isHover ? 52 : clicked ? 26 : 36,
                    borderRadius: isText ? '2px' : '50%',
                    backgroundColor:
                        isView ? 'rgba(0,255,136,0.14)' :
                            isDrag ? 'rgba(0,255,136,0.08)' :
                                isHover ? 'rgba(0,255,136,0.09)' : 'transparent',
                    borderColor:
                        isView ? 'rgba(0,255,136,1)' :
                            isDrag ? 'rgba(0,255,136,0.9)' :
                                isText ? 'rgba(0,255,136,0.85)' :
                                    isHover ? 'rgba(0,255,136,0.85)' : 'rgba(0,255,136,0.5)',
                    borderWidth: isView ? 2 : 1.5,
                    boxShadow:
                        isView || isHover
                            ? '0 0 18px rgba(0,255,136,0.3)'
                            : 'none',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="border rounded-full"
            >
                {/* "VIEW" label inside cursor */}
                {isView && (
                    <motion.span
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 8, fontWeight: 700, letterSpacing: '0.1em',
                            color: '#00ff88', textTransform: 'uppercase', userSelect: 'none',
                            fontFamily: 'Inter, system-ui, sans-serif',
                        }}
                    >
                        VIEW
                    </motion.span>
                )}

                {/* Crosshair for drag */}
                {isDrag && (
                    <>
                        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(0,255,136,0.7)', transform: 'translateY(-50%)' }} />
                        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(0,255,136,0.7)', transform: 'translateX(-50%)' }} />
                    </>
                )}
            </motion.div>

            {/* ── Inner dot ──────────────────────────────────────────────────── */}
            <motion.div
                style={{
                    x: dotX, y: dotY,
                    translateX: '-50%', translateY: '-50%',
                    opacity: visible && !isText ? 1 : 0,
                    position: 'fixed', top: 0, left: 0,
                    borderRadius: '50%',
                    pointerEvents: 'none', zIndex: 9999,
                    background: '#00ff88',
                }}
                animate={{
                    width: isView ? 0 : clicked ? 8 : isHover ? 5 : 4,
                    height: isView ? 0 : clicked ? 8 : isHover ? 5 : 4,
                    boxShadow: isHover
                        ? '0 0 10px rgba(0,255,136,0.9), 0 0 22px rgba(0,255,136,0.4)'
                        : '0 0 5px rgba(0,255,136,0.7)',
                }}
                transition={{ type: 'spring', stiffness: 600, damping: 32 }}
            />
        </>
    )
}
