import React from 'react'

const STEPS = ['Behaviour', 'Chat', 'Face', 'Voice']

export default function StepProgress({ current }) {
    return (
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl px-6 py-5 mb-10 w-full at-noise shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between relative max-w-[800px] mx-auto w-full">

                {/* Lines Container — pushed inward by exactly half the circle width (w-8 = 32px → 16px = left-4 right-4) */}
                <div className="absolute left-4 right-4 top-4 -translate-y-1/2 h-[2px] z-0">
                    {/* Background Line */}
                    <div className="absolute inset-0 bg-slate-800 rounded-full" />

                    {/* Active Line (Progress) */}
                    <div
                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700 ease-in-out shadow-[0_0_15px_rgba(16,185,129,0.5)] rounded-full"
                        style={{ width: `${(current / (STEPS.length - 1)) * 100}%` }}
                    />
                </div>

                {STEPS.map((s, i) => (
                    <div key={s} className="relative z-10 flex flex-col items-center gap-3">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-500 ${i < current
                                ? 'bg-[#05110d] border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                : i === current
                                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                                    : 'bg-[#05110d] border-slate-800 text-slate-600'
                                }`}
                        >
                            {i < current ? '✓' : i + 1}
                        </div>
                        <span
                            className={`text-[9px] font-black uppercase tracking-widest hidden sm:block ${i <= current ? 'text-emerald-400/90' : 'text-slate-600'
                                }`}
                        >
                            {s}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
