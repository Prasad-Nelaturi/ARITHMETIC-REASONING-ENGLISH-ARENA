import React from 'react'
import { Link } from 'react-router-dom'
import {
    Calculator, ArrowRight, Divide, SquareFunction, Search,
    ListOrdered, BarChart3, Sparkles, BookOpen, Zap,
} from 'lucide-react'
import { ARITHMETIC_TOPICS } from '../data/arithmeticTopics.js'

const TOPIC_ICONS = { Divide, SquareFunction, Search, ListOrdered, BarChart3 }

const TOPIC_STYLES = {
    violet: {
        gradient: 'from-violet-500/20 via-violet-600/10 to-transparent',
        border: 'border-violet-400/40',
        iconBg: 'bg-violet-500/20',
        iconRing: 'ring-violet-400/40',
        icon: 'text-violet-300',
        glow: 'hover:shadow-[0_8px_32px_rgba(139,92,246,0.35)]',
        badge: 'bg-violet-500/25 text-violet-200 border-violet-400/40',
        accent: 'bg-violet-400',
    },
    pink: {
        gradient: 'from-pink-500/20 via-pink-600/10 to-transparent',
        border: 'border-pink-400/40',
        iconBg: 'bg-pink-500/20',
        iconRing: 'ring-pink-400/40',
        icon: 'text-pink-300',
        glow: 'hover:shadow-[0_8px_32px_rgba(236,72,153,0.35)]',
        badge: 'bg-pink-500/25 text-pink-200 border-pink-400/40',
        accent: 'bg-pink-400',
    },
    blue: {
        gradient: 'from-blue-500/20 via-blue-600/10 to-transparent',
        border: 'border-blue-400/40',
        iconBg: 'bg-blue-500/20',
        iconRing: 'ring-blue-400/40',
        icon: 'text-blue-300',
        glow: 'hover:shadow-[0_8px_32px_rgba(96,165,250,0.35)]',
        badge: 'bg-blue-500/25 text-blue-200 border-blue-400/40',
        accent: 'bg-blue-400',
    },
    emerald: {
        gradient: 'from-emerald-500/20 via-emerald-600/10 to-transparent',
        border: 'border-emerald-400/40',
        iconBg: 'bg-emerald-500/20',
        iconRing: 'ring-emerald-400/40',
        icon: 'text-emerald-300',
        glow: 'hover:shadow-[0_8px_32px_rgba(34,197,94,0.35)]',
        badge: 'bg-emerald-500/25 text-emerald-200 border-emerald-400/40',
        accent: 'bg-emerald-400',
    },
    amber: {
        gradient: 'from-amber-500/20 via-amber-600/10 to-transparent',
        border: 'border-amber-400/40',
        iconBg: 'bg-amber-500/20',
        iconRing: 'ring-amber-400/40',
        icon: 'text-amber-300',
        glow: 'hover:shadow-[0_8px_32px_rgba(251,191,36,0.35)]',
        badge: 'bg-amber-500/25 text-amber-200 border-amber-400/40',
        accent: 'bg-amber-400',
    },
}

const ArithmeticTopics = () => {
    return (
        <div className="relative min-h-screen w-full px-3.5 sm:px-5 pb-10 pt-[76px] z-10">

            {/* Ambient background glow */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 left-1/4 w-96 h-96 rounded-full bg-violet-500/10 blur-[120px]" />
                <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-pink-500/10 blur-[120px]" />
            </div>

            <div className="relative max-w-5xl mx-auto">

                {/* ===== HERO HEADER ===== */}
                <div className="relative mb-8 text-center">
                    {/* Top pill */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 rounded-full bg-slate-900/70 border border-violet-500/30 backdrop-blur-md">
                        <Sparkles size={11} className="text-violet-300" strokeWidth={2.8} />
                        <span className="text-[9px] font-black tracking-[1.8px] uppercase text-violet-200">
                            AI-Powered Learning
                        </span>
                    </div>

                    {/* Icon */}
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl grid place-items-center bg-gradient-to-br from-violet-500/25 to-pink-500/25 border border-violet-400/50 shadow-[0_0_40px_rgba(139,92,246,0.4)]">
                        <Calculator size={30} className="text-violet-200" strokeWidth={2} />
                    </div>

                    {/* Title */}
                    <h1 className="text-[clamp(26px,7vw,40px)] font-black tracking-tight leading-none mb-2">
                        <span className="bg-gradient-to-r from-violet-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
                            Arithmetic Topics
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-[12px] sm:text-sm text-slate-400 font-semibold tracking-wide max-w-md mx-auto">
                        Master bank exam concepts with AI-generated lessons, examples, and practice questions
                    </p>

                    {/* Stat chips */}
                    <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/70 border border-slate-500/20 backdrop-blur-sm">
                            <BookOpen size={11} className="text-violet-300" strokeWidth={2.8} />
                            <span className="text-[10px] font-black tracking-wide text-slate-300">
                                {ARITHMETIC_TOPICS.length} Topics
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/70 border border-slate-500/20 backdrop-blur-sm">
                            <Zap size={11} className="text-pink-300" strokeWidth={2.8} />
                            <span className="text-[10px] font-black tracking-wide text-slate-300">
                                Instant AI Lesson
                            </span>
                        </div>
                    </div>
                </div>

                {/* ===== TOPICS GRID ===== */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                    {ARITHMETIC_TOPICS.map((topic, idx) => {
                        const Icon = TOPIC_ICONS[topic.icon] || Calculator
                        const s = TOPIC_STYLES[topic.color] || TOPIC_STYLES.violet

                        return (
                            <Link
                                key={topic.id}
                                to={`/arithmetic/${topic.id}`}
                                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.gradient} border ${s.border} backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${s.glow} active:scale-[0.99]`}
                            >
                                {/* Left accent strip */}
                                <div className={`absolute top-0 left-0 w-1 h-full ${s.accent} opacity-60 group-hover:opacity-100 transition-opacity`} />

                                <div className="relative p-5">

                                    {/* Top row: number + icon + category pill */}
                                    <div className="flex items-start justify-between mb-4">
                                        {/* Number + icon */}
                                        <div className="flex items-center gap-3">
                                            <div className={`relative w-12 h-12 rounded-xl grid place-items-center shrink-0 bg-slate-950/60 border ${s.border} ring-1 ${s.iconRing}`}>
                                                <Icon size={22} className={s.icon} strokeWidth={2.2} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black tracking-[2px] uppercase text-slate-500">
                                                    Topic {String(idx + 1).padStart(2, '0')}
                                                </span>
                                                <span className={`text-[10px] font-black tracking-[1.2px] uppercase ${s.icon}`}>
                                                    {topic.subtitle}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Arrow bubble */}
                                        <div className={`w-8 h-8 rounded-full grid place-items-center bg-slate-950/60 border ${s.border} transition-all duration-300 group-hover:scale-110 group-hover:bg-slate-950/80`}>
                                            <ArrowRight size={14} className={`${s.icon} transition-transform group-hover:translate-x-0.5`} strokeWidth={3} />
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-xl font-black tracking-tight text-slate-100 mb-2 leading-tight">
                                        {topic.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-[12.5px] text-slate-400 leading-relaxed line-clamp-2">
                                        {topic.shortDesc}
                                    </p>

                                </div>

                                {/* Hover gradient highlight */}
                                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.03] to-transparent" />
                                </div>
                            </Link>
                        )
                    })}
                </div>

                {/* ===== FOOTER NOTE ===== */}
                <div className="mt-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/60 border border-slate-500/20 backdrop-blur-sm">
                        <Sparkles size={11} className="text-violet-300" strokeWidth={2.8} />
                        <span className="text-[10px] font-black tracking-[1.4px] uppercase text-slate-400">
                            Fresh content each visit · Powered by AI
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ArithmeticTopics