import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Calculator, CheckCircle2, XCircle, Lightbulb, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { fetchQuestionSet } from '../../utils/questionService.js'

const QUESTIONS_PER_ROUND = 10

const ArithmeticChallenge = ({
    p1Name, p2Name, mode = 'double', level,
    onP1Win, onP2Win, onQuestionReady, onQuestionAnswered, onAnswer, onFinishRound,
}) => {
    const [questions, setQuestions] = useState(null)
    const [loadError, setLoadError] = useState(null)
    const [retryKey, setRetryKey] = useState(0)
    const [idx, setIdx] = useState(0)
    const [locked, setLocked] = useState(false)
    const [feedback, setFeedback] = useState(null)
    const [correctCount, setCorrectCount] = useState({ 1: 0, 2: 0 })
    const [wrongCount, setWrongCount] = useState({ 1: 0, 2: 0 })
    const isSingle = mode === 'single'
    const advanceLockRef = useRef(false)

    useEffect(() => {
        let mounted = true
        setQuestions(null)
        setLoadError(null)
        fetchQuestionSet('arithmetic', level, QUESTIONS_PER_ROUND)
            .then((qs) => { if (mounted) setQuestions(qs) })
            .catch((err) => { if (mounted) setLoadError(err.message) })
        return () => { mounted = false }
    }, [level, retryKey])

    useEffect(() => {
        if (!questions || idx >= questions.length) return
        advanceLockRef.current = false
        setLocked(false)
        setFeedback(null)
        onQuestionReady?.(() => skipQuestion(), questions[idx])
    }, [questions, idx])

    const skipQuestion = useCallback(() => {
        if (advanceLockRef.current) return
        advanceLockRef.current = true
        setFeedback(null)
        setLocked(true)
        if (idx + 1 >= (questions?.length || 0)) {
            onFinishRound?.(correctCount, wrongCount)
        } else {
            setIdx((v) => v + 1)
        }
    }, [idx, questions, correctCount, wrongCount, onFinishRound])

    if (loadError) {
        return (
            <div className="flex flex-col items-center gap-3 py-10 px-5">
                <AlertCircle size={32} className="text-red-400" strokeWidth={2.4} />
                <span className="text-sm text-red-300 font-bold text-center max-w-xs">{loadError}</span>
                <button
                    onClick={() => setRetryKey((k) => k + 1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black tracking-wider text-white bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg cursor-pointer"
                >
                    <RefreshCw size={13} strokeWidth={2.8} /> TRY AGAIN
                </button>
            </div>
        )
    }

    if (!questions) {
        return (
            <div className="flex flex-col items-center gap-3 py-10 px-5">
                <Loader2 size={28} className="animate-spin text-violet-300" strokeWidth={2.6} />
                <span className="text-xs text-slate-400 font-bold tracking-wide">AI is generating questions…</span>
            </div>
        )
    }

    const q = questions[idx]

    const handleAnswer = (player, value, e) => {
        e?.preventDefault?.()
        e?.stopPropagation?.()
        if (locked || advanceLockRef.current) return
        advanceLockRef.current = true
        setLocked(true)
        onQuestionAnswered?.()

        const correct = String(value) === String(q.correct)
        setFeedback({ player, correct, correctValue: q.correct })
        onAnswer?.(player, correct, value)

        if (correct) {
            setCorrectCount((c) => ({ ...c, [player]: c[player] + 1 }))
            onP1Win?.()
        } else {
            setWrongCount((w) => ({ ...w, [player]: w[player] + 1 }))
            if (!isSingle) onP2Win?.()
        }

        setTimeout(() => {
            if (idx + 1 >= questions.length) {
                onFinishRound?.(correctCount, wrongCount)
            } else {
                setIdx((v) => v + 1)
            }
        }, 900)
    }

    const renderGrid = (player) => {
        const isP1 = player === 1
        return (
            <div
                key={player}
                className={`flex flex-col gap-2 p-2.5 bg-slate-950/50 rounded-[14px] border ${isP1
                    ? 'border-blue-500/35 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.13),0_6px_24px_rgba(59,130,246,0.09)]'
                    : 'border-pink-500/35 shadow-[inset_0_0_0_1px_rgba(236,72,153,0.13),0_6px_24px_rgba(236,72,153,0.09)]'
                    } ${isSingle ? 'col-span-full' : ''}`}
            >
                <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${isP1 ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-pink-500 shadow-[0_0_8px_#ec4899]'
                                }`}
                        />
                        <span
                            className={`text-[11px] font-black tracking-wide truncate max-w-[70px] uppercase ${isP1 ? 'text-blue-500' : 'text-pink-500'
                                }`}
                        >
                            {isP1 ? p1Name : p2Name}
                        </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border border-green-400/20 bg-green-400/10 text-green-400 tabular-nums">
                            ✓ {correctCount[player]}
                        </span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border border-red-400/20 bg-red-400/10 text-red-400 tabular-nums">
                            ✗ {wrongCount[player]}
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                    {q.options.map((opt, i) => {
                        const isMine = feedback?.player === player
                        const isCorrect = String(opt) === String(q.correct)
                        const showCorrect = feedback && isCorrect
                        const showWrong = feedback && isMine && !isCorrect
                        const baseGrad = isP1
                            ? 'bg-gradient-to-br from-blue-500/90 to-blue-700'
                            : 'bg-gradient-to-br from-pink-500/90 to-pink-700'
                        return (
                            <button
                                key={i}
                                type="button"
                                onPointerDown={(e) => handleAnswer(player, opt, e)}
                                disabled={locked}
                                className={`px-1 py-3 text-[clamp(13px,3.5vw,17px)] font-black text-white rounded-[10px] cursor-pointer transition-all duration-150 touch-manipulation break-words leading-tight ${showCorrect
                                    ? 'bg-gradient-to-br from-green-500 to-green-700 shadow-[0_0_0_2px_#22c55e,0_0_24px_rgba(34,197,94,0.55)] scale-[1.03]'
                                    : showWrong
                                        ? 'bg-gradient-to-br from-red-500 to-red-700 shadow-[0_0_0_2px_#ef4444,0_0_24px_rgba(239,68,68,0.55)] scale-[1.03]'
                                        : `${baseGrad} ${locked && !isMine ? 'opacity-35' : ''}`
                                    }`}
                            >
                                {opt}
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center gap-3 w-full">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 flex-wrap justify-center">
                    {questions.map((_, i) => (
                        <span
                            key={i}
                            className={`w-[7px] h-[7px] rounded-full transition-all duration-250 ${i < idx
                                ? 'bg-gradient-to-br from-green-500 to-green-400'
                                : i === idx
                                    ? 'bg-gradient-to-br from-violet-500 to-pink-500 shadow-[0_0_10px_rgba(139,92,246,0.8)] scale-150'
                                    : 'bg-slate-500/20'
                                }`}
                        />
                    ))}
                </div>
                <span className="text-xs font-black text-slate-100 tabular-nums tracking-wide">
                    {idx + 1}<span className="text-slate-500 mx-px">/</span>{questions.length}
                </span>
            </div>

            <div className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-[1.4px] uppercase text-violet-300 bg-violet-500/15 border border-violet-500/35 px-2.5 py-1 rounded-full">
                <Calculator size={11} strokeWidth={3} />
                <span>{q.topic}</span>
            </div>

            <div className="text-[clamp(14px,3.9vw,17px)] font-extrabold text-slate-100 text-center leading-snug px-1.5 min-h-[46px] flex items-center justify-center tracking-tight">
                {q.question}
            </div>

            <div className={`grid gap-2.5 w-full ${isSingle ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                {renderGrid(1)}
                {!isSingle && renderGrid(2)}
            </div>

            {feedback ? (
                <div
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-xs font-extrabold text-center tracking-tight max-w-full animate-pop ${feedback.correct
                        ? 'bg-green-500/15 border border-green-500/40 text-green-400'
                        : 'bg-red-500/15 border border-red-500/40 text-red-300'
                        }`}
                >
                    {feedback.correct ? (
                        <>
                            <CheckCircle2 size={14} strokeWidth={3} />
                            <span>Correct! +1 for {p1Name}</span>
                        </>
                    ) : (
                        <>
                            <XCircle size={14} strokeWidth={3} />
                            <span>Wrong! Answer was {feedback.correctValue}</span>
                        </>
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-1 text-[10px] text-slate-500 italic tracking-tight">
                    <Lightbulb size={11} strokeWidth={2.4} />
                    <span>{isSingle ? 'Tap the correct answer' : 'First correct tap wins the point'}</span>
                </div>
            )}
        </div>
    )
}

export default ArithmeticChallenge