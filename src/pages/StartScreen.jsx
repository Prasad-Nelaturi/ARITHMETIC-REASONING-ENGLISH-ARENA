import React, { useState } from 'react'
import {
    User, Heart, Sparkles, Zap, Flame, Play, AlertCircle, Gauge, Trophy,
    Users, Clock, Brain, Puzzle, UserCircle, UserPlus, Calculator,
    BookOpen, Shuffle, Layers,
} from 'lucide-react'
import FloatingHearts from '../components/FloatingHearts.jsx'

const LEVELS = [
    { id: 'easy', label: 'Easy', Icon: Sparkles, cls: 'from-green-400 to-green-600', text: 'text-green-400' },
    { id: 'medium', label: 'Medium', Icon: Zap, cls: 'from-amber-400 to-amber-600', text: 'text-amber-400' },
    { id: 'extreme', label: 'Extreme', Icon: Flame, cls: 'from-red-400 to-red-600', text: 'text-red-400' },
]

const TIMES = [30, 40, 50, 60]

const MODES = [
    { id: 'single', label: 'Single', desc: 'Beat the clock', Icon: UserCircle, cls: 'from-green-400 to-green-600', text: 'text-green-400' },
    { id: 'double', label: 'Two', desc: 'Race head-to-head', Icon: UserPlus, cls: 'from-pink-400 to-pink-600', text: 'text-pink-400' },
]

const CATEGORIES = [
    { id: 'arithmetic', label: 'Arithmetic', Icon: Calculator, cls: 'from-violet-400 to-violet-600', text: 'text-violet-400' },
    { id: 'reasoning', label: 'Reasoning', Icon: Brain, cls: 'from-pink-400 to-pink-600', text: 'text-pink-400' },
    { id: 'english', label: 'English', Icon: BookOpen, cls: 'from-blue-400 to-blue-600', text: 'text-blue-400' },
    { id: 'mixed', label: 'Mixed', Icon: Shuffle, cls: 'from-amber-400 to-amber-600', text: 'text-amber-400' },
]

const StartScreen = ({ onStart }) => {
    const [mode, setMode] = useState('single')
    const [category, setCategory] = useState('mixed')
    const [p1, setP1] = useState('PRASAD NELATURI')
    const [p2, setP2] = useState('CHANTI NELATURI')
    const [level, setLevel] = useState('easy')
    const [timer, setTimer] = useState(30)
    const [error, setError] = useState('')

    const handleStart = () => {
        if (!p1.trim()) { setError('Please enter Player 1 name!'); return }
        if (mode === 'double' && !p2.trim()) { setError('Please enter Player 2 name!'); return }
        const finalP2 = mode === 'single' ? 'SOLO' : p2.trim()
        onStart(p1.trim(), finalP2, level, timer, mode, category)
    }

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center pt-10 pb-5 px-5 z-10">
            <FloatingHearts />
            <div className="w-full max-w-md flex flex-col gap-4 animate-slide-up">

                <div className="text-center">
                    <div className="w-[72px] h-[72px] mx-auto mb-2.5 rounded-[20px] grid place-items-center bg-gradient-to-br from-pink-500/20 to-violet-500/20 border border-pink-500/40 shadow-[0_0_40px_rgba(236,72,153,0.35)] animate-heartbeat">
                        <Puzzle size={44} className="text-pink-500" strokeWidth={1.6} />
                    </div>
                    <h1 className="text-[clamp(28px,7.5vw,38px)] font-black tracking-[2px] bg-gradient-to-br from-pink-400 via-violet-500 to-blue-400 bg-clip-text text-transparent mb-1 leading-none">
                        PUZZLE
                    </h1>
                    <p className="text-[10px] font-bold tracking-[2.4px] text-slate-400">
                        ARITHMETIC · REASONING · ENGLISH
                    </p>
                </div>

                <div className="flex items-center justify-center gap-3 px-3 py-2 bg-slate-900/60 border border-violet-500/20 rounded-xl backdrop-blur-md">
                    <div className="flex items-center gap-1.5">
                        <Users size={13} className="text-violet-500" strokeWidth={2.6} />
                        <span className="text-[9px] font-extrabold tracking-[1.2px] text-slate-300">1 OR 2</span>
                    </div>
                    <div className="w-px h-3 bg-slate-500/20" />
                    <div className="flex items-center gap-1.5">
                        <Brain size={13} className="text-violet-500" strokeWidth={2.6} />
                        <span className="text-[9px] font-extrabold tracking-[1.2px] text-slate-300">10 Q/ROUND</span>
                    </div>
                    <div className="w-px h-3 bg-slate-500/20" />
                    <div className="flex items-center gap-1.5">
                        <Trophy size={13} className="text-violet-500" strokeWidth={2.6} />
                        <span className="text-[9px] font-extrabold tracking-[1.2px] text-slate-300">3 ROUNDS</span>
                    </div>
                </div>

                <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/85 backdrop-blur-xl rounded-[20px] p-5 border border-violet-500/25 shadow-[0_20px_60px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)] flex flex-col gap-3.5">

                    {/* MODE */}
                    <div className="flex flex-col gap-1.5">
                        <label className="flex items-center gap-1.5 text-[9px] font-extrabold tracking-[1.4px] text-slate-400">
                            <Users size={12} className="text-violet-500" strokeWidth={2.8} />
                            GAME MODE
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                            {MODES.map((m) => {
                                const active = mode === m.id
                                const Icon = m.Icon
                                return (
                                    <button key={m.id} type="button" onClick={() => { setMode(m.id); setError('') }}
                                        className={`flex flex-col items-center gap-0.5 px-2.5 py-2.5 rounded-[10px] cursor-pointer transition-all duration-200 touch-manipulation ${active ? `bg-gradient-to-br ${m.cls} border border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.15)] -translate-y-px` : 'bg-slate-800/50 border border-slate-500/15 hover:border-slate-400/30'}`}>
                                        <Icon size={18} strokeWidth={2.4} className={active ? 'text-white' : m.text} />
                                        <span className={`text-[10px] font-black tracking-[0.4px] ${active ? 'text-white' : 'text-slate-300'}`}>{m.label}</span>
                                        <span className={`text-[8px] font-semibold ${active ? 'text-white/75' : 'text-slate-500'}`}>{m.desc}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* CATEGORY */}
                    <div className="flex flex-col gap-1.5">
                        <label className="flex items-center gap-1.5 text-[9px] font-extrabold tracking-[1.4px] text-slate-400">
                            <Layers size={12} className="text-violet-500" strokeWidth={2.8} />
                            PUZZLE CATEGORY
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                            {CATEGORIES.map((c) => {
                                const active = category === c.id
                                const Icon = c.Icon
                                return (
                                    <button key={c.id} type="button" onClick={() => setCategory(c.id)}
                                        className={`flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-[10px] cursor-pointer transition-all duration-200 touch-manipulation ${active ? `bg-gradient-to-br ${c.cls} border border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.15)] -translate-y-px` : 'bg-slate-800/50 border border-slate-500/15 hover:border-slate-400/30'}`}>
                                        <Icon size={16} strokeWidth={2.4} className={active ? 'text-white' : c.text} />
                                        <span className={`text-[10px] font-black tracking-[0.4px] ${active ? 'text-white' : 'text-slate-300'}`}>{c.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                        <div className="text-[9px] text-slate-500 text-center italic mt-0.5">
                            {category === 'mixed' ? 'Rotates through all 3 each round' : `Only ${category} every round`}
                        </div>
                    </div>

                    {/* PLAYER 1 */}
                    <div className="flex flex-col gap-1.5">
                        <label className="flex items-center gap-1.5 text-[9px] font-extrabold tracking-[1.4px] text-slate-400">
                            <User size={12} className="text-blue-400" strokeWidth={2.8} />
                            PLAYER 1
                        </label>
                        <input type="text" value={p1} onChange={(e) => { setP1(e.target.value); setError('') }}
                            placeholder="Enter your name" maxLength={12}
                            className="w-full px-3.5 py-2.5 text-sm font-semibold uppercase rounded-[10px] border border-blue-400/35 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 outline-none transition-colors focus:border-blue-500"
                        />
                    </div>

                    {/* PLAYER 2 */}
                    {mode === 'double' && (
                        <div className="flex flex-col gap-1.5 animate-slide-up">
                            <label className="flex items-center gap-1.5 text-[9px] font-extrabold tracking-[1.4px] text-slate-400">
                                <Heart size={12} className="text-pink-400" strokeWidth={2.8} />
                                PLAYER 2
                            </label>
                            <input type="text" value={p2} onChange={(e) => { setP2(e.target.value); setError('') }}
                                placeholder="Enter opponent name" maxLength={12}
                                className="w-full px-3.5 py-2.5 text-sm font-semibold uppercase rounded-[10px] border border-pink-400/35 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 outline-none transition-colors focus:border-pink-500"
                            />
                        </div>
                    )}

                    {/* LEVEL */}
                    <div className="flex flex-col gap-1.5">
                        <label className="flex items-center gap-1.5 text-[9px] font-extrabold tracking-[1.4px] text-slate-400">
                            <Gauge size={12} className="text-violet-500" strokeWidth={2.8} />
                            DIFFICULTY
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                            {LEVELS.map((lv) => {
                                const active = level === lv.id
                                const Icon = lv.Icon
                                return (
                                    <button key={lv.id} type="button" onClick={() => setLevel(lv.id)}
                                        className={`flex flex-col items-center gap-0.5 px-1 py-2.5 rounded-[10px] cursor-pointer transition-all duration-200 touch-manipulation ${active ? `bg-gradient-to-br ${lv.cls} border border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.15)] -translate-y-px` : 'bg-slate-800/50 border border-slate-500/15 hover:border-slate-400/30'}`}>
                                        <Icon size={16} strokeWidth={2.6} className={active ? 'text-white' : lv.text} />
                                        <span className={`text-[10px] font-black tracking-[0.4px] ${active ? 'text-white' : 'text-slate-300'}`}>{lv.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* TIMER */}
                    <div className="flex flex-col gap-1.5">
                        <label className="flex items-center gap-1.5 text-[9px] font-extrabold tracking-[1.4px] text-slate-400">
                            <Clock size={12} className="text-violet-500" strokeWidth={2.8} />
                            TIME PER QUESTION
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                            {TIMES.map((t) => {
                                const active = timer === t
                                return (
                                    <button key={t} type="button" onClick={() => setTimer(t)}
                                        className={`flex items-baseline justify-center gap-px px-1 py-2.5 rounded-[10px] cursor-pointer transition-all duration-200 touch-manipulation ${active ? 'bg-gradient-to-br from-violet-500 to-pink-500 border border-pink-500/80 shadow-[0_0_20px_rgba(139,92,246,0.55)] -translate-y-px text-white' : 'bg-slate-800/50 border border-slate-500/15 hover:border-slate-400/30 text-slate-300'}`}>
                                        <span className="text-sm font-black tabular-nums">{t}</span>
                                        <span className="text-[10px] font-bold opacity-75">s</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center justify-center gap-1.5 text-red-300 text-[11px] font-bold p-2 bg-red-500/15 border border-red-500/35 rounded-[10px] animate-shake">
                            <AlertCircle size={14} strokeWidth={2.8} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button onClick={handleStart}
                        className="w-full flex items-center justify-center gap-1.5 py-3 text-[13px] font-black tracking-[1.5px] text-white bg-gradient-to-br from-pink-500 to-violet-600 border border-pink-500/80 rounded-xl cursor-pointer shadow-[0_12px_32px_rgba(236,72,153,0.45),inset_0_1px_0_rgba(255,255,255,0.2)] transition-transform active:scale-[0.98] touch-manipulation">
                        <Play size={17} strokeWidth={3} fill="#fff" />
                        <span>START PUZZLE</span>
                    </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-500 tracking-[0.6px]">
                    <Sparkles size={11} strokeWidth={2.4} />
                    <span>Fresh puzzles every session</span>
                </div>
            </div>
        </div>
    )
}

export default StartScreen