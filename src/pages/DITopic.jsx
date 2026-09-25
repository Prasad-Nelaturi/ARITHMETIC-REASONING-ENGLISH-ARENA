import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
    ArrowLeft, Loader2, AlertCircle, RefreshCw, Lightbulb,
    CheckCircle2, XCircle, Eye, EyeOff, BarChart3, Languages,
} from 'lucide-react'
import { generateDIProblem } from '../utils/aiGenerator.js'
import { ChartRenderer } from '../components/charts/Charts.jsx'
import {
    getTopicById, LANGUAGES, getLanguageById, getSavedLanguage, saveLanguage,
} from '../data/arithmeticTopics.js'

const LEVELS = [
    { id: 'easy', label: 'Easy', color: 'from-green-400 to-green-600', ring: 'ring-green-400/40' },
    { id: 'medium', label: 'Medium', color: 'from-amber-400 to-amber-600', ring: 'ring-amber-400/40' },
    { id: 'extreme', label: 'Extreme', color: 'from-red-400 to-red-600', ring: 'ring-red-400/40' },
]

const DITopic = () => {
    const { subtopic } = useParams()
    const navigate = useNavigate()
    const topic = getTopicById('data-interpretation')

    const [level, setLevel] = useState('medium')
    const [lang, setLang] = useState(getSavedLanguage())
    const language = getLanguageById(lang)

    const [problem, setProblem] = useState(null)
    const [loadError, setLoadError] = useState(null)
    const [retryKey, setRetryKey] = useState(0)

    const [selected, setSelected] = useState({}) // qIdx → option
    const [showExp, setShowExp] = useState({})    // qIdx → bool

    const subtopicMeta = topic?.subtopics?.find((s) => s.id === subtopic)

    useEffect(() => {
        let mounted = true
        setProblem(null)
        setLoadError(null)
        setSelected({})
        setShowExp({})
        generateDIProblem(subtopic, level, language.aiName)
            .then((p) => { if (mounted) setProblem(p) })
            .catch((err) => { if (mounted) setLoadError(err.message) })
        return () => { mounted = false }
    }, [subtopic, level, language.aiName, retryKey])

    const handleLang = (id) => {
        setLang(id)
        saveLanguage(id)
    }

    const answer = (qIdx, opt) => {
        if (selected[qIdx] !== undefined) return
        setSelected((s) => ({ ...s, [qIdx]: opt }))
    }

    if (!subtopicMeta) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center px-4 pt-[76px]">
                <div className="text-center">
                    <h2 className="text-xl font-black text-slate-200 mb-3">Subtopic not found</h2>
                    <Link to="/arithmetic/data-interpretation" className="text-violet-300 underline">
                        Back to Data Interpretation
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen w-full px-3.5 sm:px-5 pb-10 pt-[76px]">
            <div className="max-w-3xl mx-auto flex flex-col gap-4">

                {/* Back + Language */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <button
                        type="button"
                        onClick={() => navigate('/arithmetic/data-interpretation')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-500/20 hover:border-slate-400/40 text-[10px] font-black tracking-[1.4px] uppercase text-slate-300 transition-all active:scale-95"
                    >
                        <ArrowLeft size={11} strokeWidth={3} />
                        <span>Back</span>
                    </button>
                    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-900/70 border border-violet-500/30">
                        <Languages size={11} className="text-slate-500 mx-1" strokeWidth={2.8} />
                        {LANGUAGES.map((l) => {
                            const active = lang === l.id
                            return (
                                <button
                                    key={l.id}
                                    type="button"
                                    onClick={() => handleLang(l.id)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${active ? 'bg-gradient-to-br from-violet-500 to-pink-500 text-white' : 'text-slate-400 hover:text-slate-100'
                                        }`}
                                >
                                    {l.nativeLabel}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl grid place-items-center bg-gradient-to-br from-amber-500/25 to-orange-500/15 border border-amber-400/40">
                        <BarChart3 size={22} className="text-amber-300" strokeWidth={2.4} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black tracking-[1.6px] uppercase text-amber-300">
                            Data Interpretation
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-100 leading-tight">
                            {subtopicMeta.label}
                        </h1>
                    </div>
                </div>

                {/* Level selector */}
                <div className="flex gap-1.5">
                    {LEVELS.map((lv) => {
                        const active = level === lv.id
                        return (
                            <button
                                key={lv.id}
                                type="button"
                                onClick={() => setLevel(lv.id)}
                                className={`flex-1 py-2.5 rounded-xl text-[11px] font-black tracking-wider uppercase transition-all ${active
                                        ? `bg-gradient-to-br ${lv.color} text-white shadow-[0_4px_14px_rgba(0,0,0,0.3)] ring-1 ${lv.ring}`
                                        : 'bg-slate-800/50 border border-slate-500/20 text-slate-400 hover:border-slate-400/40'
                                    }`}
                            >
                                {lv.label}
                            </button>
                        )
                    })}
                </div>

                {/* Loading */}
                {!problem && !loadError && (
                    <div className="flex flex-col items-center gap-3 py-14">
                        <Loader2 size={28} className="animate-spin text-amber-300" strokeWidth={2.6} />
                        <span className="text-xs text-slate-400 font-bold">AI is generating your DI problem…</span>
                    </div>
                )}

                {/* Error */}
                {loadError && (
                    <div className="flex flex-col items-center gap-3 py-12 px-4 rounded-2xl bg-red-500/5 border border-red-500/30">
                        <AlertCircle size={32} className="text-red-400" strokeWidth={2.4} />
                        <span className="text-sm text-red-300 font-bold text-center max-w-xs">{loadError}</span>
                        <button
                            type="button"
                            onClick={() => setRetryKey((k) => k + 1)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg"
                        >
                            <RefreshCw size={13} strokeWidth={2.8} /> Try again
                        </button>
                    </div>
                )}

                {/* Problem */}
                {problem && (
                    <>
                        {/* Title + chart */}
                        <div className="rounded-2xl bg-slate-900/60 border border-slate-500/20 p-4">
                            <h2 className="text-sm font-black text-slate-100 text-center mb-3">
                                {problem.title}
                            </h2>
                            <ChartRenderer
                                chartType={problem.chartType}
                                data={problem.data}
                                unit={problem.unit}
                                title={null}
                            />
                        </div>

                        {/* Questions */}
                        <div className="flex flex-col gap-3">
                            {problem.questions.map((q, qi) => {
                                const chosen = selected[qi]
                                const isCorrect = chosen === q.correct
                                const answered = chosen !== undefined

                                return (
                                    <div key={qi} className="rounded-2xl bg-slate-900/60 border border-slate-500/20 p-4">
                                        <div className="flex items-start gap-2.5 mb-3">
                                            <div className="w-6 h-6 rounded-md grid place-items-center shrink-0 bg-violet-500/20 border border-violet-500/40 mt-0.5">
                                                <span className="text-[10px] font-black text-violet-300">Q{qi + 1}</span>
                                            </div>
                                            <p className="text-[13px] font-bold text-slate-100 leading-relaxed">
                                                {q.question}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            {q.options.map((opt) => {
                                                const isSel = chosen === opt
                                                const isRight = opt === q.correct
                                                let cls = 'bg-slate-950/60 border-slate-500/20 text-slate-300 hover:border-slate-400/40'
                                                if (answered) {
                                                    if (isRight) cls = 'bg-green-500/20 border-green-500/60 text-green-200'
                                                    else if (isSel) cls = 'bg-red-500/20 border-red-500/60 text-red-200'
                                                    else cls = 'bg-slate-950/60 border-slate-500/20 text-slate-500 opacity-60'
                                                }
                                                return (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        disabled={answered}
                                                        onClick={() => answer(qi, opt)}
                                                        className={`px-3 py-2 rounded-lg border text-[12px] font-bold transition-all ${cls} ${!answered ? 'cursor-pointer active:scale-[0.97]' : 'cursor-default'
                                                            }`}
                                                    >
                                                        {opt}
                                                        {answered && isRight && <CheckCircle2 size={12} className="inline ml-1.5" strokeWidth={3} />}
                                                        {answered && isSel && !isRight && <XCircle size={12} className="inline ml-1.5" strokeWidth={3} />}
                                                    </button>
                                                )
                                            })}
                                        </div>

                                        {answered && (
                                            <div className="flex flex-col gap-2">
                                                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-black ${isCorrect
                                                        ? 'bg-green-500/15 border border-green-500/40 text-green-300'
                                                        : 'bg-red-500/15 border border-red-500/40 text-red-300'
                                                    }`}>
                                                    {isCorrect ? (
                                                        <><CheckCircle2 size={13} strokeWidth={3} /><span>Correct!</span></>
                                                    ) : (
                                                        <><XCircle size={13} strokeWidth={3} /><span>Not quite.</span></>
                                                    )}
                                                </div>

                                                {!showExp[qi] ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowExp((e) => ({ ...e, [qi]: true }))}
                                                        className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-black tracking-[1.4px] uppercase text-amber-200 bg-amber-500/15 border border-amber-500/40 rounded-lg"
                                                    >
                                                        <Lightbulb size={12} strokeWidth={3} />
                                                        <span>Show Explanation</span>
                                                    </button>
                                                ) : (
                                                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                                        <div className="flex items-center gap-1.5 mb-1.5">
                                                            <Lightbulb size={11} className="text-amber-300" strokeWidth={3} />
                                                            <span className="text-[9px] font-black tracking-[1.4px] uppercase text-amber-300">
                                                                Explanation
                                                            </span>
                                                        </div>
                                                        <p className="text-[12px] text-slate-300 leading-relaxed whitespace-pre-line">
                                                            {q.explanation}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* New problem */}
                        <button
                            type="button"
                            onClick={() => setRetryKey((k) => k + 1)}
                            className="self-center flex items-center gap-1.5 px-5 py-3 text-[11px] font-black tracking-[1.4px] uppercase text-white bg-gradient-to-br from-amber-500 to-pink-500 rounded-xl shadow-[0_8px_22px_rgba(251,191,36,0.4)]"
                        >
                            <RefreshCw size={13} strokeWidth={2.8} />
                            <span>New Problem</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

export default DITopic