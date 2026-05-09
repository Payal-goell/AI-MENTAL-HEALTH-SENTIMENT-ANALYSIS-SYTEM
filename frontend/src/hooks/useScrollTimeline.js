import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ─────────────────────────────────────────────────────────────────────────
   useScrollTimeline
   Returns a `ctx` (GSAP context) ref that auto-cleans on unmount.
───────────────────────────────────────────────────────────────────────── */
export function useScrollTimeline(scope) {
    const ctx = useRef(null)

    useEffect(() => {
        ctx.current = gsap.context(() => { }, scope)
        return () => {
            ctx.current?.revert()
            ScrollTrigger.getAll().forEach(t => t.kill())
        }
    }, [])

    return ctx
}

/* ─────────────────────────────────────────────────────────────────────────
   initLandingScrollAnimations
   IMPORTANT: Only animate elements NOT already handled by Framer Motion's
   whileInView to avoid opacity conflicts that leave content invisible.
   - Hero text parallax exit: GSAP (no Framer Motion conflict)
   - Feature cards, step cards, CTA, headings: Framer Motion (removed from GSAP)
───────────────────────────────────────────────────────────────────────── */
export function initLandingScrollAnimations() {
    // ── Hero text parallax exit ────────────────────────────────────────
    // This targets .hero-text-layer which is a Framer Motion element,
    // but we only animate y/scale here — opacity is handled by Framer Motion.
    // Using 'none' ease and will-change so there's no conflict.
    gsap.to('.hero-text-layer', {
        scrollTrigger: {
            trigger: '.hero-section',
            start: 'top top',
            end: 'bottom top',
            scrub: 1.2,
        },
        y: -60,
        scale: 0.96,
        ease: 'none',
    })

    // ── Hero stats subtle entrance (only y, no opacity — Framer handles that) ──
    gsap.from('.hero-stats', {
        scrollTrigger: {
            trigger: '.hero-section',
            start: 'top 40%',
            toggleActions: 'play none none none',
        },
        y: 20,
        duration: 0.6,
        ease: 'power2.out',
    })
}
