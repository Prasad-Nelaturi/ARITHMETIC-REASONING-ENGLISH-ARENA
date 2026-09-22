import React, { useState, useEffect, useRef } from 'react'
import { Calculator, Brain, BookOpen, Crown, Check } from 'lucide-react'
import FloatingHearts from '../components/FloatingHearts.jsx'
import ScoreBoard from '../components/ScoreBoard.jsx'
import TimerBar from '../components/TimerBar.jsx'
import ArithmeticChallenge from '../components/challenges/ArithmeticChallenge.jsx'
import ReasoningChallenge from '../components/challenges/ReasoningChallenge.jsx'
import EnglishChallenge from '../components/challenges/EnglishChallenge.jsx'
import { questionBank } from '../utils/questionBank.js'
import { resetAIHistory } from '../utils/aiGenerator.js'

const TOTAL_ROUNDS = 3
const LEVEL_LABEL = { easy: 'EASY', medium: 'MEDIUM', extreme: 'EXTREME' }
const CATS = ['arithmetic', 'reasoning', 'english']

const GameScreen = ({
    player1Name, player2Name, mode = 'single', category = 'mixed',
    level = 'easy', timerDuration = 15, onFinish, onHome,
}) => {
    const [round, setRound] = useState(1)
    const [p1Score, setP1Score] = useState(0)
    const [p2Score, setP2Score] = useState(0)
    const [currentCat, setCurrentCat] = useState(
        category === 'mixed' ? CATS[Math.floor(Math.random() * 3)] : category
    )
    const [result, setResult] = useState(null)
    const [challengeKey, setChallengeKey] = useState(0)
    const [roundState, setRoundState] = useState('playing')
    const [roundSummary, setRoundSummary] = useState(null)
    const [questionKey, setQuestionKey] = useState(0)
    const [questionReady, setQuestionReady] = useState(false)
    const [timerPaused, setTimerPaused] = useState(true)

    const [roundHistory, setRoundHistory] = useState([])

    const [questionStats, setQuestionStats] = useState({
        total: 0,
        correctByP1: 0,
        correctByP2: 0,
        wrongByP1: 0,
        wrongByP2: 0,
        timeouts: 0,
        totalResponseMs: 0,
        responseCount: 0,
        currentStreakP1: 0,
        longestStreakP1: 0,
        currentStreakP2: 0,
        longestStreakP2: 0,
    })

    const [answerLog, setAnswerLog] = useState([])

    const questionStartRef = useRef(0)
    const currentQuestionRef = useRef(null)
    const skipRef = useRef(null)

    const isSingle = mode === 'single'

    useEffect(() => {
        questionBank.reset()
        resetAIHistory()
    }, [])

    const pickCategory = () => {
        if (category === 'mixed') {
            const others = CATS.filter((c) => c !== currentCat)
            setCurrentCat(others[Math.floor(Math.random() * others.length)])
        } else {
            setCurrentCat(category)
        }
        setResult(null)
        setRoundState('playing')
        setRoundSummary(null)
        setChallengeKey((k) => k + 1)
        setQuestionKey((k) => k + 1)
        setQuestionReady(false)
        setTimerPaused(true)
    }

    const handleWin = (player) => {
        if (player === 1) setP1Score((s) => s + 1)
        else setP2Score((s) => s + 1)
        setResult({
            winner: player,
            name: player === 1 ? player1Name : player2Name,
            color: player === 1 ? 'blue' : 'pink',
        })
        setTimeout(() => setResult(null), 500)
    }

    const recordAnswer = (player, correct, chosenAnswer) => {
        const responseMs = Date.now() - questionStartRef.current
        const q = currentQuestionRef.current

        if (q) {
            setAnswerLog((log) => [
                ...log,
                {
                    round,
                    category: currentCat,
                    topic: q.topic,
                    question: q.question,
                    correct: q.correct,
                    chosen: chosenAnswer ?? null,
                    player,
                    correctFlag: correct,
                    timeMs: responseMs,
                    status: correct ? 'correct' : 'wrong',
                },
            ])
        }

        setQuestionStats((s) => {
            const next = { ...s, total: s.total + 1 }
            if (correct) {
                next.totalResponseMs = s.totalResponseMs + responseMs
                next.responseCount = s.responseCount + 1
                if (player === 1) {
                    next.correctByP1 = s.correctByP1 + 1
                    next.currentStreakP1 = s.currentStreakP1 + 1
                    next.longestStreakP1 = Math.max(s.longestStreakP1, next.currentStreakP1)
                    next.currentStreakP2 = 0
                } else {
                    next.correctByP2 = s.correctByP2 + 1
                    next.currentStreakP2 = s.currentStreakP2 + 1
                    next.longestStreakP2 = Math.max(s.longestStreakP2, next.currentStreakP2)
                    next.currentStreakP1 = 0
                }
            } else {
                if (player === 1) {
                    next.wrongByP1 = s.wrongByP1 + 1
                    next.currentStreakP1 = 0
                } else {
                    next.wrongByP2 = s.wrongByP2 + 1
                    next.currentStreakP2 = 0
                }
            }
            return next
        })
    }

    const recordTimeout = () => {
        const q = currentQuestionRef.current
        if (q) {
            setAnswerLog((log) => [
                ...log,
                {
                    round,
                    category: currentCat,
                    topic: q.topic,
                    question: q.question,
                    correct: q.correct,
                    chosen: null,
                    player: null,
                    correctFlag: false,
                    timeMs: timerDuration * 1000,
                    status: 'skipped',
                },
            ])
        }

        setQuestionStats((s) => ({
            ...s,
            total: s.total + 1,
            timeouts: s.timeouts + 1,
            currentStreakP1: 0,
            currentStreakP2: 0,
        }))
    }

    const handleQuestionReady = (skipFn, currentQuestion) => {
        skipRef.current = skipFn || null
        questionStartRef.current = Date.now()
        currentQuestionRef.current = currentQuestion || null
        setQuestionReady(true)
        setTimerPaused(false)
        setQuestionKey((k) => k + 1)
    }

    const handleQuestionAnswered = () => {
        setTimerPaused(true)
    }

    const handleQuestionTimeout = () => {
        if (roundState !== 'playing') return
        setTimerPaused(true)
        recordTimeout()
        if (skipRef.current) skipRef.current()
    }

    const handleRoundEnd = (finalP1, finalP2, reason = 'complete') => {
        setRoundState('roundEnd')
        setTimerPaused(true)
        const p1 = finalP1 ?? p1Score
        const p2 = finalP2 ?? p2Score
        setRoundSummary({ p1, p2, reason })

        const roundEntry = { round, category: currentCat, p1, p2, reason, level }
        setRoundHistory((h) => [...h, roundEntry])

        setTimeout(() => {
            if (round >= TOTAL_ROUNDS) {
                onFinish(p1, p2, {
                    roundHistory: [...roundHistory, roundEntry],
                    questionStats,
                    answerLog,
                    level,
                    mode,
                    timerDuration,
                })
            } else {
                setRound((r) => r + 1)
                pickCategory()
            }
        }, 2200)
    }

    const isArithmetic = currentCat === 'arithmetic'
    const isReasoning = currentCat === 'reasoning'
    const isEnglish = currentCat === 'english'

    const bannerCls = isArithmetic
        ? 'bg-gradient-to-br from-violet-500/35 to-indigo-500/20 border-b border-violet-500/40'
        : isReasoning
            ? 'bg-gradient-to-br from-pink-500/35 to-pink-700/20 border-b border-pink-500/40'
            : 'bg-gradient-to-br from-blue-500/35 to-blue-700/20 border-b border-blue-500/40'

    const iconBoxCls = isArithmetic
        ? 'bg-violet-500/25 border border-violet-500/60'
        : isReasoning
            ? 'bg-pink-500/25 border border-pink-500/60'
            : 'bg-blue-500/25 border border-blue-500/60'

    const challengeProps = {
        p1Name: player1Name,
        p2Name: isSingle ? 'SOLO' : player2Name,
        mode,
        level,
        onP1Win: () => handleWin(1),
        onP2Win: () => handleWin(2),
        onQuestionReady: handleQuestionReady,
        onQuestionAnswered: handleQuestionAnswered,
        onAnswer: recordAnswer,
        onFinishRound: () => handleRoundEnd(p1Score, p2Score),
    }

    return (
        <div className="relative min-h-screen w-full flex justify-center items-start px-3.5 pb-3.5 pt-[76px] z-10">

            <FloatingHearts />

            <div className="w-full max-w-[620px] flex flex-col gap-2.5 pt-1">
                <ScoreBoard
                    p1Name={player1Name}
                    p2Name={isSingle ? 'SOLO' : player2Name}
                    p1Score={p1Score}
                    p2Score={p2Score}
                    round={round}
                    total={TOTAL_ROUNDS}
                    mode={mode}
                />

                <TimerBar
                    key={`timer-${questionKey}`}
                    duration={timerDuration}
                    running={roundState === 'playing' && questionReady && !timerPaused}
                    onExpire={handleQuestionTimeout}
                />

                <div
                    key={challengeKey}
                    className="bg-gradient-to-b from-slate-900/90 to-slate-950/85 backdrop-blur-xl rounded-[20px] overflow-hidden border border-violet-500/25 shadow-[0_20px_50px_rgba(0,0,0,0.55)] animate-slide-up"
                >
                    <div className={`flex items-center justify-between gap-2.5 px-4 py-3 ${bannerCls}`}>
                        <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-[10px] grid place-items-center ${iconBoxCls}`}>
                                {isArithmetic && <Calculator size={16} className="text-violet-200" strokeWidth={2.8} />}
                                {isReasoning && <Brain size={16} className="text-pink-200" strokeWidth={2.8} />}
                                {isEnglish && <BookOpen size={16} className="text-blue-200" strokeWidth={2.8} />}
                            </div>
                            <div>
                                <div className="text-[9px] font-extrabold tracking-[1.6px] text-slate-400 mb-px">
                                    {category === 'mixed' ? 'MIXED · CATEGORY' : 'CATEGORY'}
                                </div>
                                <div className="text-[15px] sm:text-base font-black tracking-wider text-slate-100">
                                    {isArithmetic ? 'ARITHMETIC' : isReasoning ? 'REASONING' : 'ENGLISH'}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                            <span className="text-[9px] font-extrabold tracking-[1.2px] px-2 py-1 rounded-lg text-violet-200 border border-violet-200/35 bg-slate-950/50">
                                {LEVEL_LABEL[level]}
                            </span>
                            <span className="text-[9px] font-extrabold tracking-[1.2px] px-2 py-1 rounded-lg text-amber-300 border border-amber-300/35 bg-slate-950/50">
                                {isSingle ? 'SOLO' : 'DUEL'}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 sm:p-5 min-h-[400px] flex items-center justify-center">
                        {roundState === 'playing' && (
                            <>
                                {isArithmetic && <ArithmeticChallenge key={`a-${challengeKey}`} {...challengeProps} />}
                                {isReasoning && <ReasoningChallenge key={`r-${challengeKey}`} {...challengeProps} />}
                                {isEnglish && <EnglishChallenge key={`e-${challengeKey}`} {...challengeProps} />}
                            </>
                        )}

                        {roundState === 'roundEnd' && roundSummary && (
                            <div className="flex flex-col items-center gap-3.5 p-5 animate-bounce-in">
                                <div className="animate-heartbeat">
                                    {roundSummary.reason === 'timeout' ? (
                                        <Crown size={40} className="text-amber-400" strokeWidth={2.4} />
                                    ) : (
                                        <Check size={40} className="text-green-500" strokeWidth={3} />
                                    )}
                                </div>
                                <div className="text-lg sm:text-xl font-black tracking-[2px] text-violet-300">
                                    {roundSummary.reason === 'timeout' ? "TIME'S UP" : 'ROUND COMPLETE'}
                                </div>
                                <div className="flex items-center gap-4 px-6 py-3.5 bg-slate-900/70 rounded-2xl border border-violet-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                    <div className="text-center min-w-[62px]">
                                        <div className="text-[10px] font-extrabold tracking-[0.6px] mb-1 text-blue-400 uppercase truncate max-w-[74px]">
                                            {player1Name}
                                        </div>
                                        <div className="text-[30px] font-black leading-none tabular-nums text-blue-400 [text-shadow:0_0_16px_currentColor]">
                                            {roundSummary.p1}
                                        </div>
                                    </div>
                                    {!isSingle && (
                                        <div className="text-[11px] font-black tracking-[1.5px] text-slate-500">VS</div>
                                    )}
                                    {!isSingle && (
                                        <div className="text-center min-w-[62px]">
                                            <div className="text-[10px] font-extrabold tracking-[0.6px] mb-1 text-pink-400 uppercase truncate max-w-[74px]">
                                                {player2Name}
                                            </div>
                                            <div className="text-[30px] font-black leading-none tabular-nums text-pink-400 [text-shadow:0_0_16px_currentColor]">
                                                {roundSummary.p2}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="text-[10px] tracking-[1.6px] text-slate-500 font-bold">
                                    {round >= TOTAL_ROUNDS ? 'CALCULATING RESULT…' : `STARTING ROUND ${round + 1}…`}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {result && (
                <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 p-5">
                    <div
                        className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-white border-2 animate-pop ${result.color === 'blue'
                            ? 'border-blue-500 bg-gradient-to-br from-blue-500 to-blue-500/80 shadow-[0_22px_55px_rgba(59,130,246,0.4)]'
                            : 'border-pink-500 bg-gradient-to-br from-pink-500 to-pink-500/80 shadow-[0_22px_55px_rgba(236,72,153,0.4)]'
                            }`}
                    >
                        <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_12px_#fff]" />
                        <div className="text-base font-black tracking-wide">
                            {result.winner === 1 ? player1Name : (isSingle ? 'SOLO' : player2Name)} +1
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default GameScreen