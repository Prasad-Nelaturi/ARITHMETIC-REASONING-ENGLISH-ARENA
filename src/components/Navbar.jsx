import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
    Puzzle, Home, Calculator, Menu, X, Phone, AlertTriangle,
} from 'lucide-react'

const NAV_ITEMS = [
    { label: 'Home', path: '/', Icon: Home },
    { label: 'Arithmetic', path: '/arithmetic', Icon: Calculator },
]

const Navbar = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const onHomePage = location.pathname === '/'

    const handleHomeClick = () => {
        if (onHomePage) return
        // Only show confirm when leaving a game/result screen
        if (location.pathname === '/game' || location.pathname === '/result') {
            setShowConfirm(true)
        } else {
            navigate('/')
        }
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
            {/* ===== SINGLE NAVBAR ===== */}
            <nav className="fixed top-0 left-0 right-0 z-[90] h-14 bg-slate-950/90 backdrop-blur-xl border-b border-violet-500/80 shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
                <div className="h-full max-w-6xl mx-auto px-3 sm:px-5 flex items-center justify-between gap-3">

                    {/* LEFT — Brand */}
                    <button
                        type="button"
                        onClick={handleHomeClick}
                        className="flex items-center gap-2 shrink-0 active:scale-95 transition-transform"
                    >
                        <div className="w-8 h-8 rounded-lg grid place-items-center bg-gradient-to-br from-pink-500 to-violet-600 border border-pink-500/60 shadow-[0_0_14px_rgba(236,72,153,0.4)]">
                            <Puzzle size={15} strokeWidth={2.8} className="text-white" />
                        </div>
                        <span className="text-[13px] sm:text-sm font-black tracking-[1.6px] bg-gradient-to-r from-pink-200 via-violet-200 to-blue-200 bg-clip-text text-transparent uppercase">
                            Puzzle
                        </span>
                    </button>

                    {/* CENTER — Desktop links */}
                    <div className="hidden md:flex items-center gap-1.5">
                        {NAV_ITEMS.map((item) => {
                            const active =
                                item.path === '/'
                                    ? location.pathname === '/'
                                    : location.pathname.startsWith(item.path)
                            const Icon = item.Icon
                            return (
                                <Link
                                    key={item.label}
                                    to={item.path}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-[1.2px] uppercase transition-all ${active
                                        ? 'bg-gradient-to-br from-violet-500/30 to-pink-500/30 border border-pink-400/50 text-white shadow-[0_0_12px_rgba(236,72,153,0.25)]'
                                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                                        }`}
                                >
                                    <Icon size={11} strokeWidth={2.8} />
                                    <span>{item.label}</span>
                                </Link>
                            )
                        })}
                    </div>

                    {/* RIGHT — Credit + Contact + Menu */}
                    <div className="flex items-center gap-2">

                        {/* Credit — hidden on small screens */}
                        <span className="hidden lg:inline text-[10px] font-black tracking-[1.4px] uppercase text-slate-500 pr-3 border-r border-slate-500/20">
                            Developed by Prasad Nelaturi
                        </span>

                        {/* Contact button */}
                        <a
                            href="https://hireme-pn.netlify.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Contact Prasad Nelaturi"
                            aria-label="Contact Prasad Nelaturi — open portfolio"
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-pink-500/15 border border-pink-500/40 hover:bg-pink-500/30 hover:border-pink-400/70 transition-all active:scale-95 cursor-pointer"
                        >
                            <Phone size={13} strokeWidth={2.8} className="text-pink-300" />
                        </a>

                        {/* Mobile menu button */}
                        <button
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            className="md:hidden w-8 h-8 rounded-lg grid place-items-center bg-slate-800/60 border border-slate-500/25 active:scale-95 transition-transform"
                            aria-label="Toggle menu"
                        >
                            {open ? (
                                <X size={14} strokeWidth={3} className="text-slate-300" />
                            ) : (
                                <Menu size={14} strokeWidth={3} className="text-slate-300" />
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            {/* ===== MOBILE DROPDOWN ===== */}
            {open && (
                <>
                    {/* Full-screen blurred overlay — tap to close */}
                    <div
                        onClick={() => setOpen(false)}
                        className="fixed inset-0 z-[84] md:hidden bg-slate-950/70 backdrop-blur-md animate-[fadeIn_180ms_ease-out]"
                        aria-hidden="true"
                    />

                    {/* Dropdown panel on top of the overlay */}
                    <div className="fixed top-14 left-0 right-0 z-[85] md:hidden bg-slate-950/98 backdrop-blur-xl border-b border-violet-500/80 shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
                        <div className="px-4 py-3 flex flex-col items-center gap-1.5">
                            {NAV_ITEMS.map((item) => {
                                const active = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
                                const Icon = item.Icon
                                return (
                                    <Link
                                        key={item.label}
                                        to={item.path}
                                        onClick={() => setOpen(false)}
                                        className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[12px] font-black tracking-[1.2px] uppercase transition-all max-w-xs ${active
                                            ? 'bg-gradient-to-br from-violet-500/30 to-pink-500/30 border border-pink-400/50 text-white shadow-[0_4px_14px_rgba(236,72,153,0.25)]'
                                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent'
                                            }`}
                                    >
                                        <Icon size={14} strokeWidth={2.8} />
                                        <span>{item.label}</span>
                                    </Link>
                                )
                            })}
                            <div className="h-px my-1.5 w-full max-w-xs bg-gradient-to-r from-transparent via-violet-500/80 to-transparent" />
                            <span className="px-3 py-1 text-[11px] font-black tracking-[1.4px] uppercase text-slate-600 text-center">
                                Developed by Prasad Nelaturi
                            </span>
                        </div>
                    </div>
                </>
            )}

            {/* ===== LEAVE MATCH CONFIRM MODAL ===== */}
            {showConfirm && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center p-5 bg-slate-950/75 backdrop-blur-md"
                    onClick={cancelLeave}
                >
                    <div
                        className="w-full max-w-[340px] bg-gradient-to-b from-slate-900 to-slate-950 border border-pink-500/40 rounded-[22px] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.75),0_0_50px_rgba(236,72,153,0.25)] animate-[bounceIn_0.35s_cubic-bezier(0.68,-0.55,0.265,1.55)]"
                        onClick={(e) => e.stopPropagation()}
                    >
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

                        <p className="text-[13px] text-slate-400 leading-relaxed mb-5">
                            Your current progress in this match will be lost. Are you sure you want to go back to home?
                        </p>

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

export default Navbar