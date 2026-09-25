import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
    ArrowLeft, Loader2, AlertCircle, RefreshCw, Lightbulb,
    CheckCircle2, XCircle, Timer, Play, Pause, Languages,
    Award, ChevronRight,
} from 'lucide-react'
import { generateGKQuestion } from '../utils/aiGenerator.js'
import { getGKTopicById } from '../data/gkTopics.js'
import {
    LANGUAGES, getLanguageById, getSavedLanguage, saveLanguage,
} from '../data/arithmeticTopics.js'

const TIMES = [30, 40, 60]

const LEVELS = [
    { id: 'easy', label: 'Easy', cls: 'from-green-400 to-green-600', ring: 'ring-green-400/40' },
    { id: 'medium', label: 'Medium', cls: 'from-amber-400 to-amber-600', ring: 'ring-amber-400/40' },
    { id: 'extreme', label: 'Extreme', cls: 'from-red-400 to-red-600', ring: 'ring-red-400/40' },
]

const GKPractice = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    const gkTopic = getGKTopicById(id)
    const urlLang = searchParams.get('lang') || getSavedLanguage()
    const [lang, setLang] = useState(urlLang)
    const language = getLanguageById(lang) || { id: 'english', aiName: 'English', nativeLabel: 'English' }

    const [level, setLevel] = useState('medium')
    const [duration, setDuration] = useState(30)

    const [question, setQuestion] = useState(null)
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState(null)

    const [chosen, setChosen] = useState(null)
    const [timedOut, setTimedOut] = useState(false)
    const [showExplanation, setShowExplanation] = useState(false)
    const [score, setScore] = useState({ correct: 0, wrong: 0 })

    const [remaining, setRemaining] = useState(duration)
    const [paused, setPaused] = useState(false)

    const startTimeRef = useRef(0)
    const pausedRemainingRef = useRef(duration)
    const rafRef = useRef(null)
    const askedRef = useRef([])

    /* =========================================================
       Load a question (new or next)
       ========================================================= */
    const loadQuestion = useCallback(async () => {
        if (!gkTopic) return

        setLoading(true)
        setLoadError(null)
        setQuestion(null)
        setChosen(null)
        setTimedOut(false)
        setShowExplanation(false)
        setPaused(false)
        setRemaining(duration)
        pausedRemainingRef.current = duration

        try {
            const q = await generateGKQuestion(gkTopic, level, language.aiName, askedRef.current)
            askedRef.current.push(q.question)
            setQuestion(q)

            // Reset timer only after question has arrived
            startTimeRef.current = Date.now()
            pausedRemainingRef.current = duration
            setRemaining(duration)
        } catch (err) {
            setLoadError(err.message)
        } finally {
            setLoading(false)
        }
    }, [gkTopic, level, language.aiName, duration])

    // Load when topic / level / language changes
    useEffect(() => {
        loadQuestion()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [level, language.aiName])

    /* =========================================================
       Timer loop — single source of truth
       Runs only when: question is loaded, not answered, not paused
       ========================================================= */
    useEffect(() => {
        if (!question) return
        if (chosen !== null) return
        if (paused) return

        startTimeRef.current = Date.now() - (duration - pausedRemainingRef.current) * 1000
        let cancelled = false

        const tick = () => {
            if (cancelled) return
            const elapsed = (Date.now() - startTimeRef.current) / 1000
            const left = Math.max(0, duration - elapsed)
            setRemaining(left)

            if (left <= 0) {
                setTimedOut(true)
                setChosen('__TIMEOUT__')
                setScore((s) => ({ ...s, wrong: s.wrong + 1 }))
                return
            }
            rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)

        return () => {
            cancelled = true
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [question, chosen, paused, duration])

    /* =========================================================
       Handlers
       ========================================================= */
    const togglePause = () => {
        if (chosen !== null) return
        if (!paused) {
            pausedRemainingRef.current = remaining
            setPaused(true)
        } else {
            setShowExplanation(false)
            setPaused(false)
        }
    }

    const handleAnswer = (opt) => {
        if (chosen !== null) return
        setChosen(opt)
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        if (opt === question.correct) setScore((s) => ({ ...s, correct: s.correct + 1 }))
        else setScore((s) => ({ ...s, wrong: s.wrong + 1 }))
    }

    const handleLang = (newLang) => {
        setLang(newLang)
        saveLanguage(newLang)
        setSearchParams({ lang: newLang })
    }

    // 🆕 Handle duration change — resets timer cleanly
    const handleDurationChange = (newDuration) => {
        setDuration(newDuration)
        setRemaining(newDuration)
        pausedRemainingRef.current = newDuration
        startTimeRef.current = Date.now()
        setPaused(false)   // auto-resume if paused
    }

    if (!gkTopic) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center px-4 pt-[76px]">
                <div className="text-center">
                    <h2 className="text-xl font-black text-slate-200 mb-3">Topic not found</h2>
                    <p className="text-slate-500 text-sm mb-4">ID: {id}</p>
                    <button
                        onClick={() => navigate('/gk')}
                        className="px-4 py-2 text-[11px] font-black text-white bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg"
                    >
                        Back to GK Topics
                    </button>
                </div>
            </div>
        )
    }

    const pct = duration > 0 ? Math.max(0, (remaining / duration) * 100) : 0
    const secs = Math.max(0, Math.ceil(remaining))
    const timeState = pct <= 20 ? 'danger' : pct <= 50 ? 'warn' : 'safe'
    const isCorrect = chosen === question?.correct
    const answered = chosen !== null

    return (
        <div className="min-h-screen w-full pb-6 pt-[68px]">
            <div className="w-full max-w-lg mx-auto px-3 flex flex-col gap-3">

                {/* ===== HEADER ===== */}
                <div className="flex items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={() => navigate('/gk')}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-500/20 hover:border-slate-400/40 text-[10px] font-black tracking-wider uppercase text-slate-300 active:scale-95 shrink-0"
                    >
                        <ArrowLeft size={11} strokeWidth={3} />
                        <span>Back</span>
                    </button>

                    <div className="flex-1 min-w-0 text-center">
                        <div className="text-[9px] font-black tracking-[1.6px] uppercase text-violet-300 leading-none">
                            GK Practice
                        </div>
                        <div className="text-[14px] font-black text-slate-100 truncate leading-tight">
                            {gkTopic.title}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-1 rounded-md bg-green-500/15 border border-green-500/40 text-green-300 text-[10px] font-black tabular-nums">
                            ✓ {score.correct}
                        </span>
                        <span className="px-2 py-1 rounded-md bg-red-500/15 border border-red-500/40 text-red-300 text-[10px] font-black tabular-nums">
                            ✗ {score.wrong}
                        </span>
                    </div>
                </div>

                {/* ===== CONTROLS ===== */}
                <div className="rounded-xl bg-slate-900/80 border border-slate-500/20 p-2 flex flex-col gap-2">

                    {/* Language */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                            <Languages size={11} className="text-slate-500" strokeWidth={2.8} />
                            <span className="text-[9px] font-black tracking-wider uppercase text-slate-500">
                                Language
                            </span>
                        </div>
                        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-950/60 border border-slate-500/20">
                            {LANGUAGES.map((l) => {
                                const active = lang === l.id
                                return (
                                    <button
                                        key={l.id}
                                        type="button"
                                        onClick={() => handleLang(l.id)}
                                        className={`px-2.5 py-1 rounded-md text-[10px] font-black transition-all ${active
                                                ? 'bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-[0_2px_8px_rgba(139,92,246,0.4)]'
                                                : 'text-slate-400 hover:text-slate-100'
                                            }`}
                                    >
                                        {l.nativeLabel}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="h-px bg-slate-500/10" />

                    {/* Level */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                            <Award size={11} className="text-slate-500" strokeWidth={2.8} />
                            <span className="text-[9px] font-black tracking-wider uppercase text-slate-500">
                                Level
                            </span>
                        </div>
                        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-950/60 border border-slate-500/20">
                            {LEVELS.map((lv) => {
                                const active = level === lv.id
                                return (
                                    <button
                                        key={lv.id}
                                        type="button"
                                        onClick={() => setLevel(lv.id)}
                                        className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${active
                                                ? `bg-gradient-to-br ${lv.cls} text-white shadow-[0_2px_8px_rgba(0,0,0,0.3)]`
                                                : 'text-slate-400 hover:text-slate-100'
                                            }`}
                                    >
                                        {lv.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="h-px bg-slate-500/10" />

                    {/* Time — 🆕 uses handleDurationChange */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                            <Timer size={11} className="text-slate-500" strokeWidth={2.8} />
                            <span className="text-[9px] font-black tracking-wider uppercase text-slate-500">
                                Time
                            </span>
                        </div>
                        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-950/60 border border-slate-500/20">
                            {TIMES.map((t) => {
                                const active = duration === t
                                return (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => handleDurationChange(t)}
                                        className={`px-2.5 py-1 rounded-md text-[11px] font-black tabular-nums transition-all ${active
                                                ? 'bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-[0_2px_8px_rgba(139,92,246,0.4)]'
                                                : 'text-slate-400 hover:text-slate-100'
                                            }`}
                                    >
                                        {t}s
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* ===== TIMER BAR ===== */}
                {question && (
                    <div className={`rounded-xl bg-slate-900/80 border transition-colors ${timeState === 'danger' ? 'border-red-500/55' :
                            timeState === 'warn' ? 'border-amber-400/45' :
                                'border-green-500/35'
                        } px-3 py-2.5`}>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                                <Timer
                                    size={13}
                                    className={
                                        timeState === 'danger' ? 'text-red-400' :
                                            timeState === 'warn' ? 'text-amber-400' :
                                                'text-green-400'
                                    }
                                    strokeWidth={2.8}
                                />
                                <span className="text-[10px] font-black tracking-wider uppercase text-slate-400">
                                    {paused ? 'Paused' : 'Time left'}
                                </span>
                                <button
                                    type="button"
                                    onClick={togglePause}
                                    disabled={answered}
                                    className={`ml-0.5 w-7 h-7 rounded-md grid place-items-center border transition-all ${answered
                                            ? 'bg-slate-800/40 border-slate-500/15 opacity-40 cursor-not-allowed'
                                            : paused
                                                ? 'bg-emerald-500/20 border-emerald-400/60 hover:bg-emerald-500/30'
                                                : 'bg-slate-800/70 border-slate-500/25 hover:border-slate-400/50'
                                        }`}
                                    aria-label={paused ? 'Resume timer' : 'Pause timer'}
                                >
                                    {paused
                                        ? <Play size={11} className="text-emerald-300" strokeWidth={3} fill="#34d399" />
                                        : <Pause size={11} className="text-slate-300" strokeWidth={3} />}
                                </button>
                            </div>
                            <span className={`text-lg font-black tabular-nums leading-none ${timeState === 'danger' ? 'text-red-400' :
                                    timeState === 'warn' ? 'text-amber-400' :
                                        'text-green-400'
                                }`}>
                                {secs}s
                            </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800/70 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-[width] duration-100 ${timeState === 'danger' ? 'bg-gradient-to-r from-red-600 to-red-400' :
                                        timeState === 'warn' ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                                            'bg-gradient-to-r from-green-500 to-emerald-400'
                                    }`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* ===== LOADING ===== */}
                {loading && (
                    <div className="flex flex-col items-center gap-2 py-12 rounded-xl bg-slate-900/60 border border-slate-500/20">
                        <Loader2 size={24} className="animate-spin text-violet-300" strokeWidth={2.6} />
                        <span className="text-[11px] text-slate-400 font-bold text-center px-4">
                            Generating question in {language.nativeLabel}…
                        </span>
                    </div>
                )}

                {/* ===== ERROR ===== */}
                {loadError && !loading && (
                    <div className="flex flex-col items-center gap-3 py-8 rounded-xl bg-red-500/5 border border-red-500/30">
                        <AlertCircle size={24} className="text-red-400" strokeWidth={2.4} />
                        <span className="text-[12px] text-red-300 font-bold text-center max-w-xs px-4">
                            {loadError}
                        </span>
                        <button
                            type="button"
                            onClick={loadQuestion}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-black tracking-wider uppercase text-white bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg"
                        >
                            <RefreshCw size={12} strokeWidth={2.8} /> Retry
                        </button>
                    </div>
                )}

                {/* ===== QUESTION ===== */}
                {question && !loading && (
                    <div className="rounded-xl bg-slate-900/80 border border-slate-500/25 p-3 sm:p-4">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-500/15 border border-violet-500/40 mb-2.5">
                            <span className="text-[9px] font-black tracking-wider uppercase text-violet-300">
                                {question.topic}
                            </span>
                        </div>

                        <p className="text-[14px] font-extrabold text-slate-100 leading-snug mb-3.5">
                            {question.question}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3.5">
                            {question.options.map((opt, i) => {
                                const isChosen = chosen === opt
                                const isRight = opt === question.correct

                                let cls = 'bg-slate-950/60 border-slate-500/20 text-slate-300 hover:border-slate-400/40 hover:bg-slate-800/50'
                                if (answered) {
                                    if (isRight) cls = 'bg-green-500/20 border-green-500/60 text-green-200'
                                    else if (isChosen) cls = 'bg-red-500/20 border-red-500/60 text-red-200'
                                    else cls = 'bg-slate-950/60 border-slate-500/20 text-slate-500 opacity-60'
                                }

                                return (
                                    <button
                                        key={opt}
                                        type="button"
                                        disabled={answered}
                                        onClick={() => handleAnswer(opt)}
                                        className={`relative flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[12.5px] font-bold text-left transition-all ${cls} ${!answered ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'
                                            }`}
                                    >
                                        <span className="w-5 h-5 rounded-md grid place-items-center shrink-0 bg-slate-800/70 border border-slate-500/25 text-[10px] font-black text-slate-400">
                                            {String.fromCharCode(65 + i)}
                                        </span>
                                        <span className="flex-1 min-w-0 break-words">{opt}</span>
                                        {answered && isRight && (
                                            <CheckCircle2 size={13} className="text-green-400 shrink-0" strokeWidth={3} />
                                        )}
                                        {answered && isChosen && !isRight && (
                                            <XCircle size={13} className="text-red-400 shrink-0" strokeWidth={3} />
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {(answered || paused) && (
                            <div className="flex flex-col gap-2.5">
                                {answered && (
                                    <>
                                        {timedOut ? (
                                            <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] font-black">
                                                <Timer size={13} strokeWidth={3} className="shrink-0" />
                                                <span>
                                                    Time's up — correct answer is{' '}
                                                    <span className="text-amber-200">{question.correct}</span>
                                                </span>
                                            </div>
                                        ) : isCorrect ? (
                                            <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-green-500/15 border border-green-500/40 text-green-300 text-[11px] font-black">
                                                <CheckCircle2 size={13} strokeWidth={3} />
                                                <span>Correct! Well done.</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-[11px] font-black">
                                                <XCircle size={13} strokeWidth={3} />
                                                <span>Not quite — see the explanation.</span>
                                            </div>
                                        )}
                                    </>
                                )}

                                {!answered && paused && (
                                    <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-slate-800/60 border border-slate-500/30 text-slate-300 text-[11px] font-black">
                                        <Pause size={13} strokeWidth={3} className="shrink-0 text-slate-400" />
                                        <span>Timer paused — you can peek at the explanation</span>
                                    </div>
                                )}

                                {!showExplanation ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowExplanation(true)}
                                        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black tracking-wider uppercase text-amber-200 bg-amber-500/15 border border-amber-500/40 rounded-lg hover:bg-amber-500/25 active:scale-[0.98]"
                                    >
                                        <Lightbulb size={12} strokeWidth={3} />
                                        <span>Show Explanation</span>
                                    </button>
                                ) : (
                                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <Lightbulb size={11} className="text-amber-300" strokeWidth={3} />
                                            <span className="text-[9px] font-black tracking-wider uppercase text-amber-300">
                                                Explanation
                                            </span>
                                        </div>
                                        <p className="text-[12px] text-slate-300 leading-relaxed whitespace-pre-line">
                                            {question.explanation || 'No explanation available.'}
                                        </p>
                                    </div>
                                )}

                                {answered && (
                                    <button
                                        type="button"
                                        onClick={loadQuestion}
                                        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-black tracking-wider uppercase text-white bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-[0_6px_18px_rgba(16,185,129,0.35)] active:scale-[0.98]"
                                    >
                                        <span>Next Question</span>
                                        <ChevronRight size={13} strokeWidth={3} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default GKPractice