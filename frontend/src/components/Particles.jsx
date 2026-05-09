import React, { useEffect, useRef } from 'react'

export default function Particles() {
    const ref = useRef(null)

    useEffect(() => {
        const container = ref.current
        if (!container) return

        const particles = []
        for (let i = 0; i < 20; i++) {
            const p = document.createElement('div')
            p.className = 'particle'
            const size = Math.random() * 6 + 2
            p.style.cssText = `
        width: ${size}px; height: ${size}px;
        left: ${Math.random() * 100}%;
        animation-duration: ${Math.random() * 15 + 10}s;
        animation-delay: ${Math.random() * 10}s;
        opacity: ${Math.random() * 0.5 + 0.1};
      `
            container.appendChild(p)
            particles.push(p)
        }
        return () => particles.forEach(p => p.remove())
    }, [])

    return <div ref={ref} className="particles-bg" />
}
