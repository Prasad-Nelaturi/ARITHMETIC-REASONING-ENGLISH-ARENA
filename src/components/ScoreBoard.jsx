import React, { useEffect, useRef, useState } from 'react'
import { Crown, Swords } from 'lucide-react'

const ScoreBoard = ({ p1Name, p2Name, p1Score, p2Score, round, total = 3, mode = 'double' }) => {
    const prev = useRef({ p1: p1Score, p2: p2Score })
    const [delta, setDelta] = useState({ p1: 0, p2: 0 })
    const isSingle = mode === 'single'

    useEffect(() => {
        const d1 = p1Score - prev.current.p1
        const d2 = p2Score - prev.current.p2
        if (d1 > 0) setDelta((d) => ({ ...d, p1: d1 }))
        if (d2 > 0) setDelta((d) => ({ ...d, p2: d2 }))
        const t = setTimeout(() => setDelta({ p1: 0, p2: 0 }), 900)
        prev.current = { p1: p1Score, p2: p2Score }
        return () => clearTimeout(t)
    }, [p1Score, p2Score])

    const leader = p1Score === p2Score ? 0 : p1Score > p2Score ? 1 : 2
    const pct = total ? ((round - 1) / total) * 100 : 0

    return (
        <div className="relative bg-gradient-to-b from-slate-900/95 to-slate-950/90 backdrop-blur-md rounded-2xl overflow-hidden border border-violet-500/25 shadow-[0_12px_36px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="h-[3px] bg-violet-500/15">
                <div
                    className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-500 shadow-[0_0_12px_rgba(236,72,153,0.6)]"
                    style={{ width: `${pct}%` }}
                />
            </div>

            <div className="flex items-center justify-between gap-2 px-4 py-3">
                {/* P1 */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_12px_#3b82f6]" />
                        <span className="text-xs font-extrabold text-slate-300 tracking-wide truncate max-w-[80px]">
                            {p1Name}
                        </span>
                        {leader === 1 && <Crown size={12} className="text-amber-400" strokeWidth={2.8} />}
                    </div>
                    <div className="flex items-baseline gap-1 relative">
                        <span className="text-[clamp(26px,6.5vw,32px)] font-black leading-none tabular-nums tracking-tight text-blue-400 [text-shadow:0_0_14px_currentColor]">
                            {p1Score}
                        </span>
                        {delta.p1 > 0 && (
                            <span className="text-xs font-black text-green-400 [text-shadow:0_0_10px_#4ade80] animate-delta">
                                +{delta.p1}
                            </span>
                        )}
                    </div>
                </div>

                {/* Center */}
                <div className="flex flex-col items-center px-3.5 border-l border-r border-violet-500/20 min-w-[78px]">
                    <div className="flex items-center gap-1 mb-0.5">
                        <Swords size={12} className="text-slate-400" strokeWidth={2.6} />
                        <span className="text-[9px] font-extrabold text-slate-400 tracking-[1.6px]">ROUND</span>
                    </div>
                    <div className="text-[22px] font-black leading-none tabular-nums">
                        <span className="text-slate-100">{round}</span>
                        <span className="text-slate-600 mx-0.5 font-semibold">/</span>
                        <span className="text-violet-500">{total}</span>
                    </div>
                </div>

                {/* P2 OR SOLO */}
                <div className="flex-1 min-w-0 flex flex-col gap-1 items-end">
                    {isSingle ? (
                        <>
                            <div className="flex items-center gap-1.5 flex-row-reverse">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shadow-[0_0_12px_#64748b]" />
                                <span className="text-xs font-extrabold text-slate-500 tracking-wide uppercase">
                                    Solo
                                </span>
                            </div>
                            <div className="text-[clamp(26px,6.5vw,32px)] font-black leading-none tabular-nums tracking-tight text-slate-600">
                                —
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-1.5 flex-row-reverse">
                                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_12px_#ec4899]" />
                                <span className="text-xs font-extrabold text-slate-300 tracking-wide truncate max-w-[80px]">
                                    {p2Name}
                                </span>
                                {leader === 2 && <Crown size={12} className="text-amber-400" strokeWidth={2.8} />}
                            </div>
                            <div className="flex items-baseline gap-1 flex-row-reverse">
                                {delta.p2 > 0 && (
                                    <span className="text-xs font-black text-green-400 [text-shadow:0_0_10px_#4ade80] animate-delta">
                                        +{delta.p2}
                                    </span>
                                )}
                                <span className="text-[clamp(26px,6.5vw,32px)] font-black leading-none tabular-nums tracking-tight text-pink-400 [text-shadow:0_0_14px_currentColor]">
                                    {p2Score}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ScoreBoard