import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Clock, AlertTriangle, ChevronLeft, ChevronRight, Check,
    SkipForward, Bookmark, Loader2, AlertCircle, Send,
    BookOpen, Calculator, Brain, Landmark,
} from 'lucide-react'
import { generateWithAI, generateGKQuestion } from '../utils/aiGenerator.js'
import { getExamSections } from '../data/examPatterns.js'
import { GK_TOPICS } from '../data/gkTopics.js'

const ICONS = { BookOpen, Calculator, Brain, Landmark }

// How many questions to request per API call.
const BATCH_SIZE = 10

const ExamRunner = () => {
    const { type, stage } = useParams()
    const navigate = useNavigate()
    const sections = getExamSections(stage)

    const [questionsBySection, setQuestionsBySection] = useState({})
    const [sectionsReady, setSectionsReady] = useState({})

    const [sectionIdx, setSectionIdx] = useState(0)
    const [answers, setAnswers] = useState({})
    const [marked, setMarked] = useState({})
    const [visited, setVisited] = useState({})
    const [currentQ, setCurrentQ] = useState(0)

    const [timeLeft, setTimeLeft] = useState(sections[0].timeSec)
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState(null)
    const [showSubmitModal, setShowSubmitModal] = useState(false)

    const [loadedCount, setLoadedCount] = useState(0)
    const [totalCount, setTotalCount] = useState(sections.reduce((a, s) => a + s.questions, 0))
    const [backgroundLoading, setBackgroundLoading] = useState(false)

    const tickRef = useRef(null)
    const startedRef = useRef(false)
    const cancelledRef = useRef(false)
    const seenTextsRef = useRef(new Set())

    const currentSection = sections[sectionIdx]

    /* =========================================================
       Load one section's questions with live incremental updates
       ========================================================= */
    const loadSectionQuestions = async (section, onEach = () => { }) => {
        const results = []
        let emptyTries = 0

        // Report increment to parent — array grows as each question arrives
        const reportAdd = (q) => {
            results.push(q)
            onEach(1, q, results.length)
        }

        if (section.category === 'gk') {
            let topicIdx = 0
            while (results.length < section.questions && emptyTries < 10 && !cancelledRef.current) {
                const topic = GK_TOPICS[topicIdx % GK_TOPICS.length]
                try {
                    const q = await generateGKQuestion(topic, 'medium', 'English', [])
                    const key = q.question.trim().slice(0, 80)
                    if (!seenTextsRef.current.has(key)) {
                        seenTextsRef.current.add(key)
                        reportAdd({
                            topic: q.topic,
                            question: q.question,
                            options: q.options,
                            correct: q.correct,
                            explanation: q.explanation,
                        })
                        emptyTries = 0
                    } else {
                        emptyTries++
                    }
                } catch (err) {
                    console.warn('[Exam] GK question failed:', err.message)
                    emptyTries++
                }
                topicIdx++
            }
        } else {
            while (results.length < section.questions && emptyTries < 8 && !cancelledRef.current) {
                const need = Math.min(BATCH_SIZE, section.questions - results.length)
                try {
                    const batch = await generateWithAI(section.category, 'medium', need)
                    if (!batch || batch.length === 0) {
                        emptyTries++
                        continue
                    }
                    let added = 0
                    for (const q of batch) {
                        const key = q.question.trim().slice(0, 80)
                        if (!seenTextsRef.current.has(key)) {
                            seenTextsRef.current.add(key)
                            reportAdd(q)
                            added++
                            if (results.length >= section.questions) break
                        }
                    }
                    if (added === 0) emptyTries++
                } catch (err) {
                    console.warn('[Exam] batch failed:', err.message)
                    emptyTries++
                    await new Promise((r) => setTimeout(r, 2000))
                }
            }
        }

        // Pad if AI fell short
        while (results.length < section.questions) {
            reportAdd({
                topic: 'Placeholder',
                question: `Question ${results.length + 1} for ${section.name} — AI could not generate in time.`,
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correct: 'Option A',
                explanation: 'Placeholder question — this slot was not filled by AI.',
            })
        }

        return results
    }

    useEffect(() => {
        if (startedRef.current) return
        startedRef.current = true

            ; (async () => {
                try {
                    // ---- Load the first section ----
                    const first = sections[0]
                    const firstQs = await loadSectionQuestions(first, (n, q, count) => {
                        // Update the section's array as each question arrives
                        setQuestionsBySection((prev) => ({
                            ...prev,
                            [first.id]: [...(prev[first.id] || []), q],
                        }))
                        setLoadedCount((prev) => prev + n)
                    })

                    if (cancelledRef.current) return

                    setSectionsReady({ [first.id]: true })
                    setLoading(false)   // 🎉 exam starts

                    // ---- Load the rest in the background ----
                    setBackgroundLoading(true)
                    for (let i = 1; i < sections.length; i++) {
                        if (cancelledRef.current) break
                        const sec = sections[i]
                        const qs = await loadSectionQuestions(sec, (n, q) => {
                            setQuestionsBySection((prev) => ({
                                ...prev,
                                [sec.id]: [...(prev[sec.id] || []), q],
                            }))
                            setLoadedCount((prev) => prev + n)
                        })
                        if (cancelledRef.current) break
                        setSectionsReady((prev) => ({ ...prev, [sec.id]: true }))
                    }
                    setBackgroundLoading(false)
                } catch (err) {
                    if (!cancelledRef.current) {
                        setLoadError(err.message || 'Failed to generate paper')
                        setLoading(false)
                        setBackgroundLoading(false)
                    }
                }
            })()

        return () => {
            cancelledRef.current = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    /* =========================================================
       Timer
       ========================================================= */
    useEffect(() => {
        if (loading) return
        clearInterval(tickRef.current)
        tickRef.current = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) {
                    clearInterval(tickRef.current)
                    if (sectionIdx < sections.length - 1) {
                        const next = sectionIdx + 1
                        setSectionIdx(next)
                        setCurrentQ(0)
                        setTimeLeft(sections[next].timeSec)
                        return sections[next].timeSec
                    } else {
                        setShowSubmitModal(true)
                        return 0
                    }
                }
                return t - 1
            })
        }, 1000)
        return () => clearInterval(tickRef.current)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sectionIdx, loading])

    /* =========================================================
       Track visited
       ========================================================= */
    useEffect(() => {
        const key = `${currentSection?.id}-${currentQ}`
        setVisited((v) => ({ ...v, [key]: true }))
    }, [currentQ, currentSection])

    const currentQuestions = questionsBySection[currentSection?.id] || []
    const currentReady = !!sectionsReady[currentSection?.id]
    const totalQ = currentReady ? currentQuestions.length : currentSection.questions

    const getKey = (qIdx) => `${currentSection.id}-${qIdx}`
    const isAnswered = (qIdx) => answers[getKey(qIdx)] !== undefined
    const isMarked = (qIdx) => !!marked[getKey(qIdx)]
    const isVisited = (qIdx) => !!visited[getKey(qIdx)]

    const selectAnswer = (opt) => {
        setAnswers((a) => ({ ...a, [getKey(currentQ)]: opt }))
    }
    const clearAnswer = () => {
        const k = getKey(currentQ)
        setAnswers((a) => { const n = { ...a }; delete n[k]; return n })
    }
    const toggleMark = () => {
        setMarked((m) => ({ ...m, [getKey(currentQ)]: !m[getKey(currentQ)] }))
    }
    const gotoQ = (idx) => {
        if (idx >= 0 && idx < totalQ) setCurrentQ(idx)
    }
    const goToSection = (idx) => {
        if (idx >= 0 && idx < sections.length) {
            setSectionIdx(idx)
            setCurrentQ(0)
            setTimeLeft(sections[idx].timeSec)
        }
    }

    const handleSubmit = () => {
        clearInterval(tickRef.current)
        navigate('/exam/result', {
            state: { type, stage, sections, questionsBySection, answers, marked },
        })
    }

    /* =========================================================
       Loading screen (first section only)
       ========================================================= */
    if (loading) {
        const firstSection = sections[0]
        const firstLoaded = questionsBySection[firstSection.id]?.length || 0
        const pct = Math.min(100, Math.round((firstLoaded / firstSection.questions) * 100))

        return (
            <div className="min-h-screen w-full flex items-center justify-center pt-[76px] px-4">
                <div className="w-full max-w-md flex flex-col gap-5">

                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl grid place-items-center bg-gradient-to-br from-violet-500/25 to-pink-500/25 border border-violet-400/50 shadow-[0_0_40px_rgba(139,92,246,0.4)]">
                            <Loader2 size={28} className="animate-spin text-violet-200" strokeWidth={2.4} />
                        </div>
                        <h2 className="text-[18px] font-black tracking-tight text-slate-100 mb-1">
                            Starting Your Exam
                        </h2>
                        <p className="text-[12px] text-slate-400 font-semibold">
                            Loading {firstSection.name} — exam starts in a moment
                        </p>
                    </div>

                    <div className="text-center">
                        <div className="text-[clamp(40px,12vw,64px)] font-black tabular-nums bg-gradient-to-br from-violet-300 via-pink-300 to-blue-300 bg-clip-text text-transparent leading-none">
                            {pct}%
                        </div>
                        <div className="text-[11px] text-slate-500 font-bold mt-1 tracking-wide">
                            {loadedCount} of {totalCount} questions ready
                        </div>
                    </div>

                    <div className="relative w-full h-3 rounded-full bg-slate-800/70 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-pink-500 to-blue-400 transition-[width] duration-300"
                            style={{ width: `${pct}%` }}
                        />
                    </div>

                    <div className="rounded-xl bg-slate-900/60 border border-slate-500/20 p-3 flex flex-col gap-2">
                        {sections.map((sec, i) => {
                            const qs = questionsBySection[sec.id] || []
                            const done = qs.length >= sec.questions
                            const isCurrent = i === 0
                            const Icon = ICONS[sec.icon] || BookOpen
                            return (
                                <div key={sec.id} className="flex items-center gap-2.5">
                                    <div className={`w-7 h-7 rounded-md grid place-items-center shrink-0 ${done ? 'bg-green-500/20 border border-green-500/50'
                                        : isCurrent ? 'bg-violet-500/20 border border-violet-400/50'
                                            : 'bg-slate-800/60 border border-slate-500/20'
                                        }`}>
                                        {done ? (
                                            <Check size={13} className="text-green-400" strokeWidth={3} />
                                        ) : isCurrent ? (
                                            <Loader2 size={12} className="animate-spin text-violet-300" strokeWidth={3} />
                                        ) : (
                                            <span className="text-[9px] font-black text-slate-500">{i + 1}</span>
                                        )}
                                    </div>
                                    <Icon size={12} className="text-slate-500 shrink-0" strokeWidth={2.8} />
                                    <span className="text-[12px] font-bold text-slate-300 flex-1 truncate">
                                        {sec.name}
                                    </span>
                                    <span className={`text-[11px] font-black tabular-nums ${done ? 'text-green-400' : isCurrent ? 'text-violet-300' : 'text-slate-500'
                                        }`}>
                                        {qs.length}/{sec.questions}
                                    </span>
                                </div>
                            )
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate('/exam')}
                        className="text-[11px] font-black tracking-wider uppercase text-slate-500 hover:text-slate-300"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        )
    }

    if (loadError) {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center pt-[76px] px-4">
                <div className="flex flex-col items-center gap-3 max-w-sm rounded-2xl bg-red-500/5 border border-red-500/30 p-6">
                    <AlertCircle size={28} className="text-red-400" strokeWidth={2.4} />
                    <div className="text-[13px] text-red-300 font-bold text-center">{loadError}</div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 text-[11px] font-black text-white bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    const mins = Math.floor(timeLeft / 60)
    const secs = timeLeft % 60
    const danger = timeLeft <= 60
    const warn = timeLeft <= 300
    const SectionIcon = ICONS[currentSection.icon] || BookOpen

    return (
        <div className="min-h-screen w-full flex flex-col pt-[60px] pb-2">

            {/* ===== Top bar ===== */}
            <div className="sticky top-[56px] z-30 bg-slate-950/95 backdrop-blur-xl border-b border-violet-500/25 px-2 py-2">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1 overflow-x-auto">
                        {sections.map((sec, i) => {
                            const active = i === sectionIdx
                            const done = i < sectionIdx
                            const locked = i > sectionIdx
                            const ready = !!sectionsReady[sec.id]
                            const Icon = ICONS[sec.icon] || BookOpen
                            return (
                                <button
                                    key={sec.id}
                                    type="button"
                                    onClick={() => goToSection(i)}
                                    disabled={done || locked || !ready}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black tracking-wide whitespace-nowrap transition-all ${active
                                        ? 'bg-gradient-to-br from-violet-500 to-pink-500 text-white'
                                        : done
                                            ? 'bg-green-500/15 border border-green-500/40 text-green-300'
                                            : locked
                                                ? 'bg-slate-800/40 border border-slate-500/15 text-slate-600'
                                                : 'bg-slate-800/60 border border-slate-500/20 text-slate-400'
                                        }`}
                                >
                                    <Icon size={11} strokeWidth={2.8} />
                                    <span className="hidden sm:inline">{sec.name.split(' ')[0]}</span>
                                    <span className="sm:hidden">{sec.name.split(' ')[0].slice(0, 3)}</span>
                                    {done && <Check size={10} strokeWidth={3} />}
                                    {!done && !ready && i !== sectionIdx && (
                                        <Loader2 size={9} className="animate-spin" strokeWidth={3} />
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border tabular-nums shrink-0 ${danger ? 'bg-red-500/15 border-red-500/50' :
                        warn ? 'bg-amber-500/15 border-amber-500/50' : 'bg-slate-900/70 border-slate-500/25'
                        }`}>
                        <Clock size={14} className={danger ? 'text-red-400' : warn ? 'text-amber-400' : 'text-green-400'} strokeWidth={2.8} />
                        <span className={`text-[14px] font-black tabular-nums ${danger ? 'text-red-400' : warn ? 'text-amber-400' : 'text-green-400'
                            }`}>
                            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowSubmitModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wide uppercase text-white bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[0_4px_14px_rgba(16,185,129,0.35)] active:scale-95 shrink-0"
                    >
                        <Send size={11} strokeWidth={3} />
                        <span className="hidden sm:inline">Submit</span>
                    </button>
                </div>
            </div>

            {/* ===== Main ===== */}
            <div className="flex-1 max-w-6xl w-full mx-auto px-3 py-3 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-3">
                <div className="flex flex-col gap-2.5 min-h-[400px]">
                    <div className="flex items-center justify-between gap-2 px-1">
                        <div className="flex items-center gap-2">
                            <SectionIcon size={14} className="text-violet-300" strokeWidth={2.8} />
                            <span className="text-[11px] font-black tracking-wide text-slate-300 uppercase">
                                Q {currentQ + 1} / {currentSection.questions}
                            </span>
                            <span className="text-[10px] text-slate-500">·</span>
                            <span className="text-[10px] font-black text-pink-300 uppercase tracking-wider">+1 · −0.25</span>
                        </div>
                        <button
                            type="button"
                            onClick={toggleMark}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${isMarked(currentQ)
                                ? 'bg-violet-500/25 border border-violet-400/60 text-violet-200'
                                : 'bg-slate-800/60 border border-slate-500/20 text-slate-400 hover:text-slate-100'
                                }`}
                        >
                            <Bookmark size={11} strokeWidth={2.8} fill={isMarked(currentQ) ? '#c4b5fd' : 'none'} />
                            <span>Mark</span>
                        </button>
                    </div>

                    {!currentReady && currentQuestions.length === 0 ? (
                        <div className="rounded-xl bg-slate-900/80 border border-violet-500/25 p-8 flex flex-col items-center justify-center gap-3 min-h-[280px]">
                            <Loader2 size={26} className="animate-spin text-violet-300" strokeWidth={2.6} />
                            <div className="text-center">
                                <div className="text-[14px] font-black text-slate-200 mb-1">
                                    Loading {currentSection.name}…
                                </div>
                                <div className="text-[11px] text-slate-500">Please wait a moment</div>
                            </div>
                        </div>
                    ) : currentQuestions[currentQ] ? (
                        <div className="rounded-xl bg-slate-900/80 border border-slate-500/25 p-4 flex-1">
                            <p className="text-[14.5px] font-bold text-slate-100 leading-relaxed mb-4">
                                {currentQuestions[currentQ].question}
                            </p>

                            <div className="flex flex-col gap-2">
                                {currentQuestions[currentQ].options.map((opt, i) => {
                                    const selected = answers[getKey(currentQ)] === opt
                                    return (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => selectAnswer(opt)}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${selected
                                                ? 'bg-violet-500/20 border-violet-400/60 text-violet-100'
                                                : 'bg-slate-950/60 border-slate-500/20 text-slate-300 hover:border-slate-400/40'
                                                }`}
                                        >
                                            <span className={`w-6 h-6 rounded-md grid place-items-center shrink-0 text-[11px] font-black ${selected
                                                ? 'bg-violet-500/40 border border-violet-400/60 text-violet-100'
                                                : 'bg-slate-800/70 border border-slate-500/25 text-slate-400'
                                                }`}>
                                                {String.fromCharCode(65 + i)}
                                            </span>
                                            <span className="flex-1 text-[13px] font-bold">{opt}</span>
                                            {selected && <Check size={13} className="text-violet-300" strokeWidth={3} />}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl bg-slate-900/60 border border-slate-500/20 p-8 text-center">
                            <span className="text-[12px] text-slate-500">Question not available.</span>
                        </div>
                    )}

                    {/* ===== Bottom action bar ===== */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        {/* Left: navigation cluster */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => gotoQ(currentQ - 1)}
                                disabled={currentQ === 0}
                                className="flex items-center gap-1 px-3 py-2 rounded-lg text-[11px] font-black uppercase bg-slate-800/60 border border-slate-500/20 text-slate-300 disabled:opacity-40 active:scale-95 transition-all"
                            >
                                <ChevronLeft size={12} strokeWidth={3} /> Prev
                            </button>

                            <button
                                type="button"
                                onClick={clearAnswer}
                                disabled={!isAnswered(currentQ)}
                                className="px-3 py-2 rounded-lg text-[11px] font-black uppercase bg-slate-800/60 border border-slate-500/20 text-slate-300 disabled:opacity-40 active:scale-95 transition-all"
                            >
                                Clear
                            </button>

                            <button
                                type="button"
                                onClick={() => gotoQ(currentQ + 1)}
                                disabled={currentQ >= totalQ - 1}
                                className="flex items-center gap-1 px-3 py-2 rounded-lg text-[11px] font-black uppercase bg-slate-800/60 border border-slate-500/20 text-slate-300 disabled:opacity-40 active:scale-95 transition-all"
                            >
                                Skip <SkipForward size={12} strokeWidth={2.8} />
                            </button>
                        </div>

                        {/* Right: primary action */}
                        <div className="flex items-center gap-2 ml-auto">
                            {currentQ === totalQ - 1 && sectionIdx === sections.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={() => setShowSubmitModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-black uppercase text-white bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[0_4px_14px_rgba(16,185,129,0.4)] active:scale-95 transition-all"
                                >
                                    <Send size={12} strokeWidth={3} /> Submit Exam
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (currentQ < totalQ - 1) gotoQ(currentQ + 1)
                                        else if (sectionIdx < sections.length - 1) goToSection(sectionIdx + 1)
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-black uppercase text-white bg-gradient-to-br from-violet-500 to-pink-500 shadow-[0_4px_14px_rgba(139,92,246,0.4)] active:scale-95 transition-all"
                                >
                                    {currentQ === totalQ - 1 ? (
                                        <>Next Section <ChevronRight size={12} strokeWidth={3} /></>
                                    ) : (
                                        <>Next <ChevronRight size={12} strokeWidth={3} /></>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ===== Palette ===== */}
                <aside className="lg:sticky lg:top-[120px] lg:self-start">
                    <div className="rounded-xl bg-slate-900/70 border border-slate-500/20 p-3">
                        <div className="grid grid-cols-2 gap-1.5 mb-3">
                            <LegendDot color="bg-green-500" label="Answered" />
                            <LegendDot color="bg-red-500" label="Not Answered" />
                            <LegendDot color="bg-slate-600" label="Not Visited" />
                            <LegendDot color="bg-violet-500" label="Marked" />
                        </div>

                        <div className="text-[9px] font-black tracking-wider uppercase text-slate-500 mb-2">
                            Question Palette
                        </div>

                        {currentQuestions.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-6">
                                <Loader2 size={18} className="animate-spin text-violet-300" strokeWidth={2.6} />
                                <span className="text-[10px] font-bold text-slate-500">
                                    Loading palette…
                                </span>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-6 gap-1.5">
                                    {currentQuestions.map((_, i) => {
                                        const answered = isAnswered(i)
                                        const markedQ = isMarked(i)
                                        const visitedQ = isVisited(i)
                                        const isCurrent = i === currentQ

                                        let cls = 'bg-slate-700 text-slate-300'
                                        if (markedQ) cls = 'bg-violet-500 text-white'
                                        else if (answered) cls = 'bg-green-500 text-white'
                                        else if (visitedQ) cls = 'bg-red-500 text-white'

                                        return (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => gotoQ(i)}
                                                className={`aspect-square rounded-md text-[10px] font-black transition-all ${cls} ${isCurrent ? 'ring-2 ring-white' : ''
                                                    }`}
                                            >
                                                {i + 1}
                                            </button>
                                        )
                                    })}
                                </div>

                                {/* Loading more indicator if section not finished */}
                                {!currentReady && (
                                    <div className="mt-3 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-violet-500/10 border border-violet-500/25">
                                        <Loader2 size={10} className="animate-spin text-violet-300" strokeWidth={3} />
                                        <span className="text-[9px] font-black uppercase tracking-wider text-violet-300">
                                            Loading more…
                                        </span>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="mt-4 pt-3 border-t border-slate-500/15 flex flex-col gap-1.5">
                            <PaletteStat label="Answered" count={currentQuestions.filter((_, i) => isAnswered(i)).length} color="text-green-400" />
                            <PaletteStat label="Not Answered" count={currentQuestions.filter((_, i) => !isAnswered(i) && isVisited(i)).length} color="text-red-400" />
                            <PaletteStat label="Marked" count={currentQuestions.filter((_, i) => isMarked(i)).length} color="text-violet-400" />
                        </div>
                    </div>
                </aside>
            </div>

            {/* ===== Submit modal ===== */}
            {showSubmitModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-5 bg-slate-950/80 backdrop-blur-md">
                    <div className="w-full max-w-[380px] bg-gradient-to-b from-slate-900 to-slate-950 border border-pink-500/40 rounded-2xl p-5 shadow-2xl">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl grid place-items-center bg-amber-500/20 border border-amber-400/50 shrink-0">
                                <AlertTriangle size={18} className="text-amber-300" strokeWidth={2.6} />
                            </div>
                            <div>
                                <div className="text-base font-black text-slate-100">Submit Exam?</div>
                                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                    Once submitted, you cannot return
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg bg-slate-950/60 border border-slate-500/20 p-3 mb-4">
                            <div className="text-[10px] font-black tracking-wider uppercase text-slate-500 mb-2">
                                Section Summary
                            </div>
                            <div className="flex flex-col gap-1.5">
                                {sections.map((sec) => {
                                    const qs = questionsBySection[sec.id] || []
                                    const attempted = sec.id === currentSection.id
                                        ? qs.filter((_, i) => isAnswered(i)).length
                                        : qs.filter((q, i) => `${sec.id}-${i}` in answers).length
                                    return (
                                        <div key={sec.id} className="flex items-center justify-between text-[11px]">
                                            <span className="text-slate-400 font-bold">{sec.name}</span>
                                            <span className="text-slate-200 font-black tabular-nums">
                                                {attempted}/{qs.length || sec.questions}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                            <button
                                type="button"
                                onClick={() => setShowSubmitModal(false)}
                                className="py-2.5 text-[11px] font-black uppercase text-slate-300 bg-slate-800/60 border border-slate-500/25 rounded-xl"
                            >
                                Continue
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="py-2.5 text-[11px] font-black uppercase text-white bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-[0_6px_18px_rgba(16,185,129,0.4)]"
                            >
                                Submit Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const LegendDot = ({ color, label }) => (
    <div className="flex items-center gap-1.5">
        <span className={`w-3 h-3 rounded-sm ${color}`} />
        <span className="text-[9px] font-black tracking-wide text-slate-400 uppercase">
            {label}
        </span>
    </div>
)

const PaletteStat = ({ label, count, color }) => (
    <div className="flex items-center justify-between text-[10px] font-black">
        <span className="text-slate-400 uppercase tracking-wider">{label}</span>
        <span className={`tabular-nums ${color}`}>{count}</span>
    </div>
)

export default ExamRunner