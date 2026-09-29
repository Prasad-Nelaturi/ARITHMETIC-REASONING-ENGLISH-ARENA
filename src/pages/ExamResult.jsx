import React, { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
    Trophy, Target, Award, CheckCircle2, XCircle, Minus,
    ChevronRight, Home, AlertTriangle, TrendingUp, BarChart3,
    BookOpen, Calculator, Brain, Landmark, ShieldCheck, X,
} from 'lucide-react'

const ICONS = { BookOpen, Calculator, Brain, Landmark }

const ExamResult = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const payload = location.state

    if (!payload) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center pt-[76px] px-4">
                <div className="text-center">
                    <h2 className="text-xl font-black text-slate-200 mb-3">No result data</h2>
                    <button
                        onClick={() => navigate('/exam')}
                        className="px-4 py-2 text-[11px] font-black text-white bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg"
                    >
                        Back to Exams
                    </button>
                </div>
            </div>
        )
    }

    const { type, stage, sections, questionsBySection, answers } = payload

    /* =========================================================
       Compute results per section
       ========================================================= */
    const sectionResults = useMemo(() => {
        return sections.map((sec) => {
            const qs = questionsBySection[sec.id] || []
            let correct = 0
            let wrong = 0
            let unattempted = 0

            qs.forEach((q, i) => {
                const key = `${sec.id}-${i}`
                const chosen = answers[key]
                if (chosen === undefined) {
                    unattempted++
                } else if (chosen === q.correct) {
                    correct++
                } else {
                    wrong++
                }
            })

            const marksScored = correct * 1 - wrong * 0.25
            const maxMarks = sec.marks
            const pct = (marksScored / maxMarks) * 100
            const cutoff = sec.cutoffRange[0]   // use lower end for qualification
            const cleared = marksScored >= cutoff

            return {
                ...sec,
                correct,
                wrong,
                unattempted,
                total: qs.length,
                marksScored: +marksScored.toFixed(2),
                pct: +pct.toFixed(1),
                cutoff,
                cleared,
            }
        })
    }, [sections, questionsBySection, answers])

    /* =========================================================
       Overall
       ========================================================= */
    const overall = useMemo(() => {
        const totalMarks = sectionResults.reduce((a, s) => a + s.marksScored, 0)
        const maxMarks = sectionResults.reduce((a, s) => a + s.marks, 0)
        const totalCorrect = sectionResults.reduce((a, s) => a + s.correct, 0)
        const totalWrong = sectionResults.reduce((a, s) => a + s.wrong, 0)
        const totalUnattempted = sectionResults.reduce((a, s) => a + s.unattempted, 0)
        const totalQs = sectionResults.reduce((a, s) => a + s.total, 0)

        const allSectionalCleared = sectionResults.every((s) => s.cleared)

        // Overall cutoff: prelims ~60-65%, mains ~55-60%
        const overallCutoffPct = stage === 'prelims' ? 60 : 55
        const overallCutoff = Math.round((maxMarks * overallCutoffPct) / 100)
        const overallCleared = totalMarks >= overallCutoff

        const qualified = allSectionalCleared && overallCleared

        return {
            totalMarks: +totalMarks.toFixed(2),
            maxMarks,
            totalCorrect,
            totalWrong,
            totalUnattempted,
            totalQs,
            overallCutoff,
            overallCleared,
            allSectionalCleared,
            qualified,
            accuracy: totalCorrect + totalWrong > 0
                ? +((totalCorrect / (totalCorrect + totalWrong)) * 100).toFixed(1)
                : 0,
        }
    }, [sectionResults, stage])

    const qualified = overall.qualified

    return (
        <div className="min-h-screen w-full px-3.5 pb-10 pt-[76px]">
            <div className="max-w-4xl mx-auto flex flex-col gap-4">

                {/* ===== Result banner ===== */}
                <div className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 text-center ${qualified
                    ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/10 border-emerald-400/50'
                    : 'bg-gradient-to-br from-red-500/20 to-pink-500/10 border-red-400/50'
                    }`}>
                    <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-white/5 blur-[60px]" />

                    <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl grid place-items-center ${qualified
                        ? 'bg-emerald-500/25 border border-emerald-400/60'
                        : 'bg-red-500/25 border border-red-400/60'
                        }`}>
                        {qualified
                            ? <Trophy size={30} className="text-emerald-300" strokeWidth={2.2} />
                            : <X size={30} className="text-red-300" strokeWidth={2.6} />}
                    </div>

                    <div className="text-[10px] font-black tracking-[1.8px] uppercase text-slate-400 mb-1">
                        {type.toUpperCase()} · {stage.toUpperCase()}
                    </div>

                    <h1 className={`text-[clamp(22px,5.5vw,30px)] font-black tracking-tight ${qualified ? 'text-emerald-300' : 'text-red-300'
                        }`}>
                        {qualified ? 'QUALIFIED' : 'NOT QUALIFIED'}
                    </h1>

                    <p className="text-[12px] text-slate-400 mt-1.5">
                        {qualified
                            ? 'Congratulations! You cleared both sectional and overall cutoffs.'
                            : !overall.allSectionalCleared
                                ? 'One or more sections below cutoff.'
                                : 'Overall score below required cutoff.'}
                    </p>

                    {/* Big numbers */}
                    <div className="flex items-center justify-center gap-6 mt-5">
                        <div className="text-center">
                            <div className="text-[9px] font-black tracking-wider uppercase text-slate-500 mb-1">
                                Your Score
                            </div>
                            <div className="text-3xl font-black text-slate-100 tabular-nums">
                                {overall.totalMarks}
                                <span className="text-base text-slate-500">/{overall.maxMarks}</span>
                            </div>
                        </div>
                        <div className="w-px h-10 bg-slate-500/20" />
                        <div className="text-center">
                            <div className="text-[9px] font-black tracking-wider uppercase text-slate-500 mb-1">
                                Cutoff
                            </div>
                            <div className="text-3xl font-black text-amber-300 tabular-nums">
                                {overall.overallCutoff}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== Quick stats ===== */}
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                    <StatBox icon={Target} label="Attempted" value={`${overall.totalQs - overall.totalUnattempted}/${overall.totalQs}`} color="text-violet-300" bg="bg-violet-500/15" border="border-violet-500/40" />
                    <StatBox icon={CheckCircle2} label="Correct" value={overall.totalCorrect} color="text-green-300" bg="bg-green-500/15" border="border-green-500/40" />
                    <StatBox icon={XCircle} label="Wrong" value={overall.totalWrong} color="text-red-300" bg="bg-red-500/15" border="border-red-500/40" />
                    <StatBox icon={TrendingUp} label="Accuracy" value={`${overall.accuracy}%`} color="text-amber-300" bg="bg-amber-500/15" border="border-amber-500/40" />
                </div>

                {/* ===== Section breakdown ===== */}
                <div>
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <BarChart3 size={14} className="text-violet-400" strokeWidth={2.8} />
                        <span className="text-[11px] font-black tracking-[1.6px] text-slate-400 uppercase">
                            Sectional Performance
                        </span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                        {sectionResults.map((s) => {
                            const Icon = ICONS[s.icon] || BookOpen
                            return (
                                <div
                                    key={s.id}
                                    className={`rounded-xl border p-4 ${s.cleared
                                        ? 'bg-gradient-to-br from-emerald-500/10 to-green-500/5 border-emerald-400/40'
                                        : 'bg-gradient-to-br from-red-500/10 to-pink-500/5 border-red-400/40'
                                        }`}
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 border ${s.cleared
                                                ? 'bg-emerald-500/20 border-emerald-400/50'
                                                : 'bg-red-500/20 border-red-400/50'
                                                }`}>
                                                <Icon size={16} className={s.cleared ? 'text-emerald-300' : 'text-red-300'} strokeWidth={2.4} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[13px] font-black text-slate-100 truncate">
                                                    {s.name}
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                    Cutoff: {s.cutoffRange[0]}–{s.cutoffRange[1]} marks
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg shrink-0 ${s.cleared
                                            ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300'
                                            : 'bg-red-500/20 border border-red-400/50 text-red-300'
                                            }`}>
                                            {s.cleared
                                                ? <ShieldCheck size={12} strokeWidth={3} />
                                                : <AlertTriangle size={12} strokeWidth={3} />}
                                            <span className="text-[10px] font-black tracking-wider uppercase">
                                                {s.cleared ? 'Cleared' : 'Failed'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Marks row */}
                                    <div className="grid grid-cols-4 gap-2 mb-2.5">
                                        <Cell label="Marks" value={`${s.marksScored}/${s.marks}`} color="text-slate-100" />
                                        <Cell label="Correct" value={s.correct} color="text-green-400" />
                                        <Cell label="Wrong" value={s.wrong} color="text-red-400" />
                                        <Cell label="Skipped" value={s.unattempted} color="text-slate-500" />
                                    </div>

                                    {/* Progress bar */}
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 rounded-full bg-slate-800/70 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${s.cleared
                                                    ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                                                    : 'bg-gradient-to-r from-red-500 to-red-400'
                                                    }`}
                                                style={{ width: `${Math.min(100, Math.max(0, s.pct))}%` }}
                                            />
                                        </div>
                                        <span className={`text-[11px] font-black tabular-nums ${s.cleared ? 'text-emerald-300' : 'text-red-300'
                                            }`}>
                                            {s.pct}%
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* ===== Actions ===== */}
                <div className="grid grid-cols-2 gap-2.5 mt-2">
                    <button
                        type="button"
                        onClick={() => navigate('/exam')}
                        className="flex items-center justify-center gap-1.5 py-3 text-[11px] font-black tracking-wider uppercase text-slate-300 bg-slate-800/60 border border-slate-500/25 rounded-xl hover:border-slate-400/40"
                    >
                        <Home size={12} strokeWidth={3} />
                        <span>New Exam</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="flex items-center justify-center gap-1.5 py-3 text-[11px] font-black tracking-wider uppercase text-white bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl shadow-[0_6px_18px_rgba(139,92,246,0.4)]"
                    >
                        <span>Go Home</span>
                        <ChevronRight size={12} strokeWidth={3} />
                    </button>
                </div>
            </div>
        </div>
    )
}

const StatBox = ({ icon: Icon, label, value, color, bg, border }) => (
    <div className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl border ${bg} ${border}`}>
        <Icon size={14} className={color} strokeWidth={2.8} />
        <div className="text-[8px] font-black tracking-wider uppercase text-slate-500">
            {label}
        </div>
        <div className={`text-base font-black tabular-nums ${color}`}>
            {value}
        </div>
    </div>
)

const Cell = ({ label, value, color }) => (
    <div className="flex flex-col items-center">
        <div className="text-[8px] font-black tracking-wider uppercase text-slate-500 mb-0.5">
            {label}
        </div>
        <div className={`text-[13px] font-black tabular-nums ${color}`}>
            {value}
        </div>
    </div>
)

export default ExamResult