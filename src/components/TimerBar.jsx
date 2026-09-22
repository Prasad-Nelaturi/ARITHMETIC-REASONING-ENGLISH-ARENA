import React, { useEffect, useRef, useState } from 'react'
import { Timer, Zap, AlertOctagon } from 'lucide-react'

const TimerBar = ({ duration, running = false, onExpire }) => {
    const [remaining, setRemaining] = useState(duration)
    const intervalRef = useRef(null)
    const startRef = useRef(0)
    const firedRef = useRef(false)
    const durationRef = useRef(duration)

    useEffect(() => {
        durationRef.current = duration
        setRemaining(duration)
    }, [duration])

    useEffect(() => {
        if (!running) {
            setRemaining(durationRef.current)
            firedRef.current = false
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            return
        }

        startRef.current = Date.now()
        firedRef.current = false

        if (intervalRef.current) clearInterval(intervalRef.current)

        intervalRef.current = setInterval(() => {
            const elapsed = (Date.now() - startRef.current) / 1000
            const left = Math.max(0, durationRef.current - elapsed)
            setRemaining(left)

            if (left <= 0) {
                if (intervalRef.current) clearInterval(intervalRef.current)
                intervalRef.current = null
                if (!firedRef.current) {
                    firedRef.current = true
                    onExpire?.()
                }
            }
        }, 100)

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [running])

    const pct = duration > 0 ? Math.max(0, (remaining / duration) * 100) : 0
    const seconds = Math.max(0, Math.ceil(remaining))

    let state = 'safe'
    if (pct <= 20) state = 'danger'
    else if (pct <= 50) state = 'warn'

    const THEME = {
        safe: {
            trackCls: 'bg-gradient-to-r from-emerald-500/25 to-green-500/15',
            fillCls: 'bg-gradient-to-r from-emerald-500 via-green-500 to-green-400',
            glow: '0 0 18px rgba(34,197,94,0.55)',
            borderCls: 'border-green-500/35',
            textCls: 'text-green-500',
            badgeCls: 'bg-green-500/15 border-green-500/40',
            label: 'SAFE',
            Icon: Timer,
        },
        warn: {
            trackCls: 'bg-gradient-to-r from-amber-500/25 to-amber-400/15',
            fillCls: 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300',
            glow: '0 0 20px rgba(251,191,36,0.6)',
            borderCls: 'border-amber-400/45',
            textCls: 'text-amber-400',
            badgeCls: 'bg-amber-400/15 border-amber-400/45',
            label: 'HURRY',
            Icon: Zap,
        },
        danger: {
            trackCls: 'bg-gradient-to-r from-red-500/30 to-red-400/18',
            fillCls: 'bg-gradient-to-r from-red-600 via-red-500 to-red-400',
            glow: '0 0 28px rgba(239,68,68,0.85)',
            borderCls: 'border-red-500/55',
            textCls: 'text-red-500',
            badgeCls: 'bg-red-500/15 border-red-500/40',
            label: 'CRITICAL',
            Icon: AlertOctagon,
        },
    }
    const t = THEME[state]
    const Icon = t.Icon

    return (
        <div
            className={`bg-gradient-to-b from-slate-900/90 to-slate-950/85 backdrop-blur-md rounded-2xl px-3.5 pt-3 pb-3.5 border transition-colors duration-300 ${t.borderCls} ${state === 'danger' && running ? 'animate-[pulseRed_1.2s_ease-in-out_infinite]' : ''
                }`}
        >
            <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg grid place-items-center border ${t.badgeCls}`}>
                        <Icon size={14} className={t.textCls} strokeWidth={2.8} />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="text-[9px] font-bold tracking-[1.6px] text-slate-500 mb-0.5">
                            TIME LIMIT
                        </span>
                        <span className={`text-[13px] font-black tracking-wider ${t.textCls}`}>
                            {running ? t.label : 'READY'}
                        </span>
                    </div>
                </div>
                <div className="flex items-baseline gap-0.5">
                    <span
                        className={`text-[26px] font-black tabular-nums tracking-tight leading-none [text-shadow:0_0_18px_currentColor] ${t.textCls}`}
                    >
                        {seconds}
                    </span>
                    <span className="text-xs font-bold text-slate-400">s</span>
                </div>
            </div>

            <div
                className={`relative w-full h-3 rounded-full overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] ${t.trackCls}`}
            >
                <div
                    className={`relative h-full rounded-full overflow-hidden ${t.fillCls}`}
                    style={{
                        width: `${pct}%`,
                        boxShadow: t.glow,
                        transition: 'width 100ms linear',   // 👈 explicit CSS transition
                    }}
                >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/45 to-transparent animate-[scanline_2.2s_ease-in-out_infinite]" />
                </div>
                {[...Array(9)].map((_, i) => (
                    <span
                        key={i}
                        className="absolute top-0 bottom-0 w-px bg-white/8 pointer-events-none"
                        style={{ left: `${(i + 1) * 10}%` }}
                    />
                ))}
            </div>
        </div>
    )
}

export default TimerBar