import React, { useState, useEffect } from 'react'
import { Link as RouterLink, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
    ArrowLeft, Lightbulb, CheckCircle2, XCircle, BookOpen,
    Sparkles, Target, RefreshCw, Eye, EyeOff, Loader2,
    AlertCircle, Brain, Wand2, Languages,
    Table, BarChart2, BarChart4, LineChart, PieChart, Layers, FileText, ArrowRight, BarChart3,
} from 'lucide-react'
import {
    getTopicById, LANGUAGES, getLanguageById, getSavedLanguage, saveLanguage,
} from '../data/arithmeticTopics.js'
import { generateTopicContent, generateTopicExplanation } from '../utils/aiGenerator.js'

const TopicDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    const topic = getTopicById(id)
    const urlLang = searchParams.get('lang') || getSavedLanguage()
    const [lang, setLang] = useState(urlLang)
    const language = getLanguageById(lang)

    // AI content
    const [content, setContent] = useState(null)
    const [loadError, setLoadError] = useState(null)
    const [retryKey, setRetryKey] = useState(0)

    // UI state
    const [showExampleSteps, setShowExampleSteps] = useState(false)
    const [selected, setSelected] = useState(null)
    const [explanation, setExplanation] = useState('')
    const [loadingExplanation, setLoadingExplanation] = useState(false)
    const [showExplanation, setShowExplanation] = useState(false)

    // Fetch AI lesson when topic or language changes
    useEffect(() => {
        if (!topic) return
        let mounted = true
        setContent(null)
        setLoadError(null)
        setSelected(null)
        setShowExampleSteps(false)
        setShowExplanation(false)
        setExplanation('')
        generateTopicContent(topic, language.aiName)
            .then((c) => { if (mounted) setContent(c) })
            .catch((err) => { if (mounted) setLoadError(err.message) })
        return () => { mounted = false }
    }, [topic, language.aiName, retryKey])

    const handleLangChange = (newLangId) => {
        setLang(newLangId)
        saveLanguage(newLangId)
        setSearchParams({ lang: newLangId })
    }

    if (!topic) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center px-4 pt-[76px]">
                <div className="text-center">
                    <div className="text-4xl mb-3">🔍</div>
                    <h2 className="text-xl font-black text-slate-200 mb-2">Topic not found</h2>
                    <Link
                        to="/arithmetic"
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-black tracking-wider text-white bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg"
                    >
                        <ArrowLeft size={12} strokeWidth={3} /> Back to topics
                    </Link>
                </div>
            </div>
        )
    }

// ============ DATA INTERPRETATION — simple subtopic list ============
if (topic.id === 'data-interpretation') {
  const SUB_INFO = {
    table:        { Icon: Table,     desc: 'Rows and columns of numbers',        color: 'violet' },
    'bar-simple': { Icon: BarChart2, desc: 'Bars showing one value per category', color: 'blue' },
    'bar-grouped':{ Icon: BarChart4, desc: 'Two or more series side by side',     color: 'pink' },
    line:         { Icon: LineChart, desc: 'Trend over time',                     color: 'emerald' },
    pie:          { Icon: PieChart,  desc: 'Percentages of a whole',              color: 'amber' },
    mixed:        { Icon: Layers,    desc: 'Bars and lines combined',             color: 'rose' },
    caselet:      { Icon: FileText,  desc: 'Text-only data — no chart',           color: 'cyan' },
  }

  const COLOR = {
    violet:  { box: 'bg-violet-500/15 border-violet-400/40',  icon: 'text-violet-300',  hover: 'hover:bg-violet-500/25' },
    blue:    { box: 'bg-blue-500/15 border-blue-400/40',      icon: 'text-blue-300',    hover: 'hover:bg-blue-500/25' },
    pink:    { box: 'bg-pink-500/15 border-pink-400/40',      icon: 'text-pink-300',    hover: 'hover:bg-pink-500/25' },
    emerald: { box: 'bg-emerald-500/15 border-emerald-400/40',icon: 'text-emerald-300', hover: 'hover:bg-emerald-500/25' },
    amber:   { box: 'bg-amber-500/15 border-amber-400/40',    icon: 'text-amber-300',   hover: 'hover:bg-amber-500/25' },
    rose:    { box: 'bg-rose-500/15 border-rose-400/40',      icon: 'text-rose-300',    hover: 'hover:bg-rose-500/25' },
    cyan:    { box: 'bg-cyan-500/15 border-cyan-400/40',      icon: 'text-cyan-300',    hover: 'hover:bg-cyan-500/25' },
  }

  return (
    <div className="min-h-screen w-full px-4 pb-10 pt-[76px]">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate('/arithmetic')}
          className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-500/20 hover:border-slate-400/40 text-[11px] font-bold text-slate-300 transition-all"
        >
          <ArrowLeft size={12} strokeWidth={2.8} />
          <span>All topics</span>
        </button>

        {/* Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 mb-1">
            {topic.title}
          </h1>
          <p className="text-[13px] text-slate-400">
            Pick a chart type to practice with AI-generated questions.
          </p>
        </div>

        {/* Subtopic list */}
        <div className="flex flex-col gap-2">
          {topic.subtopics.map((sub) => {
            const info = SUB_INFO[sub.id] || SUB_INFO.table
            const c = COLOR[info.color]
            const Icon = info.Icon
            return (
              <RouterLink
                key={sub.id}
                to={`/arithmetic/data-interpretation/${sub.id}`}
                className={`flex items-center gap-3.5 p-4 rounded-xl bg-slate-900/60 border border-slate-500/20 transition-all hover:border-slate-400/40 active:scale-[0.99] ${c.hover}`}
              >
                <div className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 border ${c.box}`}>
                  <Icon size={20} className={c.icon} strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-black text-slate-100">
                    {sub.label}
                  </div>
                  <div className="text-[12px] text-slate-400 mt-0.5">
                    {info.desc}
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-500 shrink-0" strokeWidth={2.8} />
              </RouterLink>
            )
          })}
        </div>
      </div>
    </div>
  )
}

    const correct = selected === content?.practice?.correct

    const handleSelect = async (opt) => {
        if (selected !== null) return
        setSelected(opt)
        setShowExplanation(false)
        setExplanation('')

        if (opt === content.practice.correct) return

        setLoadingExplanation(true)
        const exp = await generateTopicExplanation(
            topic,
            content.practice.question,
            content.practice.correct,
            opt,
            language.aiName
        )
        setExplanation(exp || 'The correct answer follows directly from the rule explained above.')
        setLoadingExplanation(false)
    }

    return (
        <div className="min-h-screen w-full px-3.5 sm:px-5 pb-10 pt-[76px]">
            <div className="max-w-3xl mx-auto flex flex-col gap-4">

                {/* Top row — back + language toggle */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <button
                        type="button"
                        onClick={() => navigate('/arithmetic')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-500/20 hover:border-slate-400/40 text-[10px] font-black tracking-[1.4px] uppercase text-slate-300 transition-all active:scale-95"
                    >
                        <ArrowLeft size={11} strokeWidth={3} />
                        <span>All topics</span>
                    </button>

                    {/* Language toggle */}
                    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-900/70 border border-violet-500/30 backdrop-blur-md">
                        <div className="flex items-center gap-1 px-2 text-[9px] font-black tracking-[1.2px] uppercase text-slate-500">
                            <Languages size={11} strokeWidth={2.8} />
                        </div>
                        {LANGUAGES.map((l) => {
                            const active = lang === l.id
                            return (
                                <button
                                    key={l.id}
                                    type="button"
                                    onClick={() => handleLangChange(l.id)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-[0.6px] transition-all touch-manipulation ${active
                                        ? 'bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-[0_4px_14px_rgba(139,92,246,0.45)]'
                                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                                        }`}
                                >
                                    {l.nativeLabel}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Title */}
                <div>
                    <div className="text-[10px] font-black tracking-[1.8px] uppercase text-violet-300 mb-1">
                        {topic.subtitle}
                    </div>
                    <h1 className="text-[clamp(22px,5.5vw,30px)] font-black tracking-[1.2px] bg-gradient-to-br from-violet-300 via-pink-300 to-blue-300 bg-clip-text text-transparent leading-tight">
                        {topic.title}
                    </h1>
                </div>

                {/* Syllabus chips */}
                <div className="flex flex-wrap gap-1.5">
                    {topic.syllabus.map((s, i) => (
                        <span
                            key={i}
                            className="px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-500/20 text-[9px] font-black tracking-[1px] uppercase text-slate-400"
                        >
                            {s}
                        </span>
                    ))}
                </div>

                {/* Loading */}
                {!content && !loadError && (
                    <div className="flex flex-col items-center gap-3 py-14">
                        <div className="w-12 h-12 rounded-2xl grid place-items-center bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-violet-400/40 shadow-[0_0_30px_rgba(139,92,246,0.35)]">
                            <Wand2 size={22} className="text-violet-300 animate-pulse" strokeWidth={2.4} />
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <Loader2 size={14} className="animate-spin text-pink-300" strokeWidth={2.8} />
                                <span className="text-sm font-black text-slate-200">
                                    AI is preparing your lesson in {language.nativeLabel}…
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-semibold">
                                Definition · Examples · Practice question
                            </p>
                        </div>
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
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black tracking-wider text-white bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg cursor-pointer"
                        >
                            <RefreshCw size={13} strokeWidth={2.8} /> Try again
                        </button>
                    </div>
                )}

                {/* Lesson body */}
                {content && (
                    <>
                        {/* Definition */}
                        <section className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/85 backdrop-blur-xl border border-violet-500/25 p-4 sm:p-5">
                            <div className="flex items-center gap-2 mb-2.5">
                                <BookOpen size={14} className="text-violet-300" strokeWidth={2.6} />
                                <span className="text-[10px] font-black tracking-[1.6px] uppercase text-slate-400">
                                    What is it?
                                </span>
                            </div>
                            <p className="text-[13px] sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                                {content.definition}
                            </p>
                        </section>

                        {/* Key points */}
                        <section className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/85 backdrop-blur-xl border border-pink-500/25 p-4 sm:p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles size={14} className="text-pink-300" strokeWidth={2.6} />
                                <span className="text-[10px] font-black tracking-[1.6px] uppercase text-slate-400">
                                    Key Points
                                </span>
                            </div>
                            <ul className="flex flex-col gap-2">
                                {content.keyPoints.map((point, i) => (
                                    <li key={i} className="flex items-start gap-2.5">
                                        <div className="w-5 h-5 rounded-md grid place-items-center shrink-0 bg-pink-500/15 border border-pink-500/40 mt-0.5">
                                            <span className="text-[9px] font-black text-pink-300">{i + 1}</span>
                                        </div>
                                        <span className="text-[12.5px] text-slate-300 leading-relaxed">{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* Example */}
                        <section className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/85 backdrop-blur-xl border border-blue-500/30 p-4 sm:p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Target size={14} className="text-blue-300" strokeWidth={2.6} />
                                <span className="text-[10px] font-black tracking-[1.6px] uppercase text-slate-400">
                                    Worked Example
                                </span>
                            </div>

                            <p className="text-[13.5px] font-bold text-slate-100 leading-relaxed mb-3">
                                {content.example.question}
                            </p>

                            <div className="grid grid-cols-2 gap-2 mb-3">
                                {content.example.options.map((opt) => {
                                    const isCorrect = opt === content.example.correct
                                    return (
                                        <div
                                            key={opt}
                                            className={`px-3 py-2 rounded-lg border text-[12px] font-bold text-center ${isCorrect
                                                ? 'bg-green-500/15 border-green-500/50 text-green-300'
                                                : 'bg-slate-950/60 border-slate-500/20 text-slate-400'
                                                }`}
                                        >
                                            {opt}
                                            {isCorrect && <span className="ml-1.5 text-green-400">✓</span>}
                                        </div>
                                    )
                                })}
                            </div>

                            {content.example.steps?.length > 0 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setShowExampleSteps((v) => !v)}
                                        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black tracking-[1.4px] uppercase text-blue-200 bg-blue-500/15 border border-blue-500/40 rounded-lg cursor-pointer transition-all hover:bg-blue-500/25 active:scale-[0.98]"
                                    >
                                        {showExampleSteps ? <EyeOff size={12} strokeWidth={3} /> : <Lightbulb size={12} strokeWidth={3} />}
                                        <span>{showExampleSteps ? 'Hide' : 'Show'} step-by-step solution</span>
                                    </button>

                                    {showExampleSteps && (
                                        <div className="mt-3 p-3 rounded-lg bg-slate-950/70 border border-blue-500/25">
                                            <ol className="flex flex-col gap-2.5">
                                                {content.example.steps.map((step, i) => (
                                                    <li key={i} className="flex items-start gap-2.5">
                                                        <div className="w-5 h-5 rounded-md grid place-items-center shrink-0 bg-blue-500/20 border border-blue-500/50 mt-0.5">
                                                            <span className="text-[9px] font-black text-blue-300">{i + 1}</span>
                                                        </div>
                                                        <span className="text-[12.5px] text-slate-300 leading-relaxed">{step}</span>
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>

                        {/* Practice */}
                        <section className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/85 backdrop-blur-xl border border-emerald-500/30 p-4 sm:p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Brain size={14} className="text-emerald-300" strokeWidth={2.6} />
                                <span className="text-[10px] font-black tracking-[1.6px] uppercase text-slate-400">
                                    Try It Yourself
                                </span>
                            </div>

                            <p className="text-[13.5px] font-bold text-slate-100 leading-relaxed mb-3">
                                {content.practice.question}
                            </p>

                            <div className="grid grid-cols-2 gap-2 mb-3">
                                {content.practice.options.map((opt) => {
                                    const isSelected = selected === opt
                                    const isCorrect = opt === content.practice.correct
                                    const answered = selected !== null

                                    let cls = 'bg-slate-950/60 border-slate-500/20 text-slate-300 hover:border-slate-400/40'
                                    if (answered) {
                                        if (isCorrect) cls = 'bg-green-500/20 border-green-500/60 text-green-200'
                                        else if (isSelected) cls = 'bg-red-500/20 border-red-500/60 text-red-200'
                                        else cls = 'bg-slate-950/60 border-slate-500/20 text-slate-500 opacity-60'
                                    }

                                    return (
                                        <button
                                            key={opt}
                                            type="button"
                                            disabled={answered}
                                            onClick={() => handleSelect(opt)}
                                            className={`px-3 py-2.5 rounded-lg border text-[12px] font-bold transition-all ${cls} ${!answered ? 'cursor-pointer active:scale-[0.97]' : 'cursor-default'
                                                }`}
                                        >
                                            {opt}
                                            {answered && isCorrect && <CheckCircle2 size={12} className="inline ml-1.5" strokeWidth={3} />}
                                            {answered && isSelected && !isCorrect && <XCircle size={12} className="inline ml-1.5" strokeWidth={3} />}
                                        </button>
                                    )
                                })}
                            </div>

                            {selected !== null && (
                                <div className="flex flex-col gap-2.5">
                                    <div
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-black tracking-wide ${correct
                                            ? 'bg-green-500/15 border border-green-500/40 text-green-300'
                                            : 'bg-red-500/15 border border-red-500/40 text-red-300'
                                            }`}
                                    >
                                        {correct ? (
                                            <>
                                                <CheckCircle2 size={14} strokeWidth={3} />
                                                <span>Correct! Well done.</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle size={14} strokeWidth={3} />
                                                <span>Not quite — see the explanation below.</span>
                                            </>
                                        )}
                                    </div>

                                    {!correct && (
                                        loadingExplanation ? (
                                            <div className="flex items-center justify-center gap-2 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                                <Loader2 size={13} className="animate-spin text-amber-300" strokeWidth={2.8} />
                                                <span className="text-[11px] font-black text-amber-300 tracking-wide">
                                                    AI is writing an explanation…
                                                </span>
                                            </div>
                                        ) : !showExplanation ? (
                                            <button
                                                type="button"
                                                onClick={() => setShowExplanation(true)}
                                                className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black tracking-[1.4px] uppercase text-amber-200 bg-amber-500/15 border border-amber-500/40 rounded-lg cursor-pointer transition-all hover:bg-amber-500/25 active:scale-[0.98]"
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
                                                <p className="text-[12px] text-slate-300 leading-relaxed">
                                                    {explanation}
                                                </p>
                                            </div>
                                        )
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => { setSelected(null); setShowExplanation(false); setExplanation('') }}
                                        className="self-center flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-500/20 hover:border-slate-400/40 text-[10px] font-black tracking-[1.4px] uppercase text-slate-300 transition-all active:scale-95"
                                    >
                                        <RefreshCw size={11} strokeWidth={2.8} />
                                        <span>Try again</span>
                                    </button>
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>
        </div>
    )
}

export default TopicDetail