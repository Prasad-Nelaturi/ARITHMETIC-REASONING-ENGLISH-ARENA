import React, { useState } from 'react'
import { Code2, Heart, Home, AlertTriangle, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

const TopMarquee = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const onHomePage = location.pathname === '/'
    const [showConfirm, setShowConfirm] = useState(false)

    const handleBackClick = () => {
        setShowConfirm(true)
    }

    const confirmLeave = () => {
        setShowConfirm(false)
        navigate('/')
    }

    const cancelLeave = () => {
        setShowConfirm(false)
    }

    return (
        <>
            <div className="fixed top-0 left-0 right-0 z-[90] h-8 bg-gradient-to-r from-violet-600/30 via-pink-500/30 to-blue-500/30 backdrop-blur-md border-b border-pink-500/30">
                <div className="h-full w-full flex items-center justify-between px-3">

                    {/* ===== LEFT: Back button (hidden on home) ===== */}
                    <div className="flex items-center">
                        {!onHomePage ? (
                            <button
                                type="button"
                                onClick={handleBackClick}
                                className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-950/40 border border-pink-500/30 hover:border-pink-400/60 hover:bg-pink-500/15 transition-all touch-manipulation active:scale-95"
                                aria-label="Back to home"
                            >
                                <Home size={12} strokeWidth={2.8} className="text-pink-300" />
                                <span className="text-[10px] font-black tracking-[1.4px] uppercase text-pink-200">
                                    Home
                                </span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <Code2 size={12} strokeWidth={2.8} className="text-pink-300" />
                                <span className="hidden sm:inline text-[10px] font-black tracking-[1.6px] uppercase text-pink-200/90">
                                    Puzzle
                                </span>
                            </div>
                        )}
                    </div>

                    {/* ===== CENTER: Credit ===== */}
                    <div className="flex-1 flex items-center justify-center px-3">
                        <span className="text-[10px] sm:text-[12px] font-black tracking-[1.4px] sm:tracking-[1.8px] uppercase bg-gradient-to-r from-pink-200 via-violet-200 to-blue-200 bg-clip-text text-transparent truncate">
                            Developed by Prasad Nelaturi
                        </span>
                    </div>

                    {/* ===== RIGHT: Version + Heart ===== */}
                    <div className="flex items-center gap-1.5 pl-3 border-l border-pink-500/30">
                        <span className="hidden sm:inline text-[10px] font-black tracking-[1.6px] uppercase text-pink-200/90">
                            v1.0
                        </span>
                        <Heart size={12} strokeWidth={2.8} fill="#f9a8d4" className="text-pink-300" />
                    </div>
                </div>
            </div>

            {/* ===== CONFIRM MODAL ===== */}
            {showConfirm && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center p-5 bg-slate-950/75 backdrop-blur-md animate-[fadeIn_180ms_ease-out]"
                    onClick={cancelLeave}
                >
                    <div
                        className="w-full max-w-[340px] bg-gradient-to-b from-slate-900 to-slate-950 border border-pink-500/40 rounded-[22px] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.75),0_0_50px_rgba(236,72,153,0.25)] animate-[bounceIn_0.35s_cubic-bezier(0.68,-0.55,0.265,1.55)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3.5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl grid place-items-center bg-gradient-to-br from-amber-500/20 to-pink-500/20 border border-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.25)]">
                                    <AlertTriangle size={18} className="text-amber-300" strokeWidth={2.6} />
                                </div>
                                <div>
                                    <div className="text-[9px] font-black tracking-[1.6px] text-slate-500 uppercase mb-0.5">
                                        Confirm Action
                                    </div>
                                    <div className="text-base font-black tracking-wide text-slate-100">
                                        Leave Match?
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={cancelLeave}
                                className="w-7 h-7 rounded-lg grid place-items-center bg-slate-800/60 border border-slate-500/20 hover:border-slate-400/40 hover:bg-slate-700/60 transition-all shrink-0"
                                aria-label="Close"
                            >
                                <X size={13} strokeWidth={3} className="text-slate-400" />
                            </button>
                        </div>

                        {/* Body */}
                        <p className="text-[13px] text-slate-400 leading-relaxed mb-5">
                            Your current progress in this match will be lost. Are you sure you want to go back to home?
                        </p>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-2.5">
                            <button
                                type="button"
                                onClick={cancelLeave}
                                className="py-3 px-4 text-[11px] font-black tracking-[1.4px] uppercase text-slate-300 bg-slate-800/60 border border-slate-500/25 rounded-xl cursor-pointer transition-all hover:border-slate-400/50 hover:bg-slate-700/60 active:scale-[0.97] touch-manipulation"
                            >
                                Stay
                            </button>
                            <button
                                type="button"
                                onClick={confirmLeave}
                                className="py-3 px-4 text-[11px] font-black tracking-[1.4px] uppercase text-white bg-gradient-to-br from-pink-500 to-violet-600 border border-pink-500/80 rounded-xl cursor-pointer shadow-[0_8px_22px_rgba(236,72,153,0.45),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all hover:brightness-110 active:scale-[0.97] touch-manipulation"
                            >
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default TopMarquee