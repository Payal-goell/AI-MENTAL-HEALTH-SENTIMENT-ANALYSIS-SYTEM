import React from 'react'
import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'

const variants = {
    initial: { opacity: 0, y: 16, filter: 'blur(4px)' },
    animate: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
    exit: {
        opacity: 0,
        y: -12,
        filter: 'blur(4px)',
        transition: { duration: 0.35, ease: [0.4, 0, 1, 1] },
    },
}

export default function PageTransition({ children }) {
    const location = useLocation()
    return (
        <motion.div
            key={location.pathname}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ width: '100%' }}
        >
            {children}
        </motion.div>
    )
}
