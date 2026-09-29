import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    GraduationCap, Clock, Target, ShieldCheck, ArrowRight,
    BookOpen, Calculator, Brain, Landmark, Info, Award,
} from 'lucide-react'
import {
    EXAM_TYPES, EXAM_STAGES, getExamSummary,
} from '../data/examPatterns.js'

const ICONS = { BookOpen, Calculator, Brain, Landmark }

const TYPE_COLORS = {
    blue: { border: 'border-blue-400/40', box: 'bg-blue-500/15', icon: 'text-blue-300', accent: 'bg-blue-400' },
    violet: { border: 'border-violet-400/40', box: 'bg-violet-500/15', icon: 'text-violet-300', accent: 'bg-violet-400' },
    pink: { border: 'border-pink-400/40', box: 'bg-pink-500/15', icon: 'text-pink-300', accent: 'bg-pink-400' },
}

const ExamHome = () => {
    const navigate = useNavigate()
    const [stage, setStage] = useState('prelims')
    const summary = getExamSummary(stage)

    return (
        <div className="min-h-screen w-full px-4 pb-10 pt-[76px]">
            <div className="max-w-3xl mx-auto flex flex-col gap-5">

                {/* Hero */}
                <div className="text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 rounded-full bg-slate-900/70 border border-violet-500/30">
                        <GraduationCap size={11} className="text-violet-300" strokeWidth={2.8} />
                        <span className="text-[9px] font-black tracking-[1.8px] uppercase text-violet-200">
                            Bank Exam Simulator
                        </span>
                    </div>
                    <h1 className="text-[clamp(24px,6.5vw,34px)] font-black tracking-tight bg-gradient-to-r from-violet-300 via-pink-300 to-blue-300 bg-clip-text text-transparent mb-1">
                        Online Mock Exam
                    </h1>
                    <p className="text-[12px] text-slate-400 font-semibold max-w-md mx-auto">
                        Real IBPS / SBI pattern · Sectional timers · Negative marking · Cutoffs
                    </p>
                </div>

                {/* Stage selector */}
                <div className="flex justify-center">
                    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-900/70 border border-violet-500/30">
                        {EXAM_STAGES.map((s) => {
                            const active = stage === s.id
                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setStage(s.id)}
                                    className={`flex flex-col items-center gap-0 px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${active
                                            ? 'bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-[0_4px_14px_rgba(139,92,246,0.45)]'
                                            : 'text-slate-400 hover:text-slate-100'
                                        }`}
                                >
                                    <span>{s.label}</span>
                                    <span className="text-[8px] font-bold opacity-75 tracking-[0.5px] mt-0.5">
                                        {s.id === 'prelims' ? '3 sections' : '4 sections'}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Exam summary strip */}
                <div className="rounded-2xl bg-slate-900/70 border border-slate-500/20 p-4 grid grid-cols-3 gap-3">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Target size={11} className="text-violet-300" strokeWidth={2.8} />
                            <span className="text-[9px] font-black tracking-wider uppercase text-slate-500">
                                Questions
                            </span>
                        </div>
                        <div className="text-xl font-black text-slate-100 tabular-nums">
                            {summary.totalQuestions}
                        </div>
                    </div>
                    <div className="text-center border-l border-r border-slate-500/15">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Award size={11} className="text-pink-300" strokeWidth={2.8} />
                            <span className="text-[9px] font-black tracking-wider uppercase text-slate-500">
                                Max Marks
                            </span>
                        </div>
                        <div className="text-xl font-black text-slate-100 tabular-nums">
                            {summary.totalMarks}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Clock size={11} className="text-amber-300" strokeWidth={2.8} />
                            <span className="text-[9px] font-black tracking-wider uppercase text-slate-500">
                                Time
                            </span>
                        </div>
                        <div className="text-xl font-black text-slate-100 tabular-nums">
                            {summary.totalTimeMin}m
                        </div>
                    </div>
                </div>

                {/* Section breakdown */}
                <div>
                    <div className="text-[11px] font-black tracking-wider uppercase text-slate-500 mb-2.5">
                        Section Structure
                    </div>
                    <div className="flex flex-col gap-2">
                        {summary.sections.map((sec) => {
                            const Icon = ICONS[sec.icon] || BookOpen
                            return (
                                <div
                                    key={sec.id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-500/20"
                                >
                                    <div className="w-9 h-9 rounded-lg grid place-items-center bg-violet-500/15 border border-violet-500/35 shrink-0">
                                        <Icon size={16} className="text-violet-300" strokeWidth={2.4} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[13px] font-black text-slate-100">
                                            {sec.name}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-bold tracking-wide">
                                            {sec.questions} Q · {sec.marks} marks · {Math.round(sec.timeSec / 60)} min
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-[8px] font-black tracking-wider uppercase text-slate-500">
                                            Cutoff
                                        </div>
                                        <div className="text-[11px] font-black text-amber-300 tabular-nums">
                                            {sec.cutoffRange[0]}–{sec.cutoffRange[1]}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Exam type cards */}
                <div>
                    <div className="text-[11px] font-black tracking-wider uppercase text-slate-500 mb-2.5">
                        Choose Exam Type
                    </div>
                    <div className="flex flex-col gap-2.5">
                        {EXAM_TYPES.map((t) => {
                            const c = TYPE_COLORS[t.color]
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => navigate(`/exam/${t.id}/${stage}`)}
                                    className={`group relative overflow-hidden flex items-center gap-3.5 p-4 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-950/70 border ${c.border} backdrop-blur-md transition-all hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.99] text-left`}
                                >
                                    <div className={`absolute top-0 left-0 w-1 h-full ${c.accent} opacity-60 group-hover:opacity-100`} />

                                    <div className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 ${c.box} border ${c.border}`}>
                                        <ShieldCheck size={20} className={c.icon} strokeWidth={2.4} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="text-[15px] font-black text-slate-100">
                                            {t.label} · {stage === 'prelims' ? 'Prelims' : 'Mains'}
                                        </div>
                                        <div className="text-[11px] text-slate-400 mt-0.5">
                                            {t.desc}
                                        </div>
                                    </div>

                                    <ArrowRight size={16} className="text-slate-500 shrink-0 group-hover:translate-x-0.5" strokeWidth={2.8} />
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Rules note */}
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 flex items-start gap-2.5">
                    <Info size={14} className="text-amber-300 shrink-0 mt-0.5" strokeWidth={2.6} />
                    <div className="text-[11px] text-amber-200 leading-relaxed">
                        <b>Exam rules:</b> Sectional timers cannot be paused. Once a section's time ends, you cannot
                        return to it. Negative marking of −0.25 per wrong answer applies. You must clear both
                        sectional and overall cutoffs to qualify.
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ExamHome