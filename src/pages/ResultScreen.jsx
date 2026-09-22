import React, { useEffect, useState, useMemo } from 'react'
import {
    Crown, Heart, Trophy, Medal, Users, Target,
    Clock, Zap, Flame, Brain, TrendingUp, Award, BarChart3, Check, X,
    Star, Sparkles, Rocket, Shield, BookOpen,
} from 'lucide-react'
import FloatingHearts from '../components/FloatingHearts.jsx'

const RANK_TITLES = [
    {
        min: 145,
        title: 'LEGEND',
        subtitle: 'Top 1% mind',
        Icon: Crown,
        glow: 'shadow-[0_0_30px_rgba(251,191,36,0.55)]',
        border: 'border-amber-400/60',
        bg: 'bg-gradient-to-br from-amber-500/25 via-pink-500/20 to-violet-500/25',
        iconColor: 'text-amber-300',
        titleGrad: 'from-amber-200 via-pink-200 to-violet-200',
        badge: 'bg-amber-500/20 border-amber-400/50 text-amber-300',
    },
    {
        min: 130,
        title: 'GRANDMASTER',
        subtitle: 'Elite performer',
        Icon: Brain,
        glow: 'shadow-[0_0_28px_rgba(236,72,153,0.5)]',
        border: 'border-pink-400/60',
        bg: 'bg-gradient-to-br from-pink-500/25 via-violet-500/20 to-blue-500/25',
        iconColor: 'text-pink-300',
        titleGrad: 'from-pink-200 via-violet-200 to-blue-200',
        badge: 'bg-pink-500/20 border-pink-400/50 text-pink-300',
    },
    {
        min: 115,
        title: 'MASTERMIND',
        subtitle: 'Sharp & strategic',
        Icon: Zap,
        glow: 'shadow-[0_0_24px_rgba(139,92,246,0.5)]',
        border: 'border-violet-400/60',
        bg: 'bg-gradient-to-br from-violet-500/25 via-indigo-500/20 to-blue-500/25',
        iconColor: 'text-violet-300',
        titleGrad: 'from-violet-200 via-indigo-200 to-blue-200',
        badge: 'bg-violet-500/20 border-violet-400/50 text-violet-300',
    },
    {
        min: 100,
        title: 'SHARP MIND',
        subtitle: 'Above average',
        Icon: Sparkles,
        glow: 'shadow-[0_0_20px_rgba(96,165,250,0.45)]',
        border: 'border-blue-400/50',
        bg: 'bg-gradient-to-br from-blue-500/20 via-cyan-500/15 to-teal-500/20',
        iconColor: 'text-blue-300',
        titleGrad: 'from-blue-200 via-cyan-200 to-teal-200',
        badge: 'bg-blue-500/20 border-blue-400/50 text-blue-300',
    },
    {
        min: 85,
        title: 'RISING STAR',
        subtitle: 'On the way up',
        Icon: Star,
        glow: 'shadow-[0_0_18px_rgba(34,211,238,0.4)]',
        border: 'border-cyan-400/50',
        bg: 'bg-gradient-to-br from-cyan-500/20 via-teal-500/15 to-emerald-500/20',
        iconColor: 'text-cyan-300',
        titleGrad: 'from-cyan-200 via-teal-200 to-emerald-200',
        badge: 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300',
    },
    {
        min: 70,
        title: 'STEADY MIND',
        subtitle: 'Reliable performer',
        Icon: Shield,
        glow: 'shadow-[0_0_16px_rgba(34,197,94,0.4)]',
        border: 'border-emerald-400/50',
        bg: 'bg-gradient-to-br from-emerald-500/20 via-green-500/15 to-teal-500/20',
        iconColor: 'text-emerald-300',
        titleGrad: 'from-emerald-200 via-green-200 to-teal-200',
        badge: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300',
    },
    {
        min: 0,
        title: 'KEEP PRACTICING',
        subtitle: 'Progress in motion',
        Icon: Rocket,
        glow: 'shadow-[0_0_14px_rgba(148,163,184,0.35)]',
        border: 'border-slate-400/40',
        bg: 'bg-gradient-to-br from-slate-500/15 to-slate-700/10',
        iconColor: 'text-slate-300',
        titleGrad: 'from-slate-200 to-slate-300',
        badge: 'bg-slate-500/20 border-slate-400/50 text-slate-300',
    },
]

const LEVEL_BADGE = {
    easy: { label: 'EASY', cls: 'text-green-400 bg-green-500/15 border-green-500/40' },
    medium: { label: 'MEDIUM', cls: 'text-amber-400 bg-amber-500/15 border-amber-500/40' },
    extreme: { label: 'EXTREME', cls: 'text-red-400 bg-red-500/15 border-red-500/40' },
}

const LEVEL_MULT = { easy: 1.0, medium: 1.15, extreme: 1.35 }

const CATEGORY_META = {
    arithmetic: { label: 'Arithmetic', Icon: Target, color: 'text-violet-300', bg: 'bg-violet-500/15', border: 'border-violet-500/40' },
    reasoning: { label: 'Reasoning', Icon: Brain, color: 'text-pink-300', bg: 'bg-pink-500/15', border: 'border-pink-500/40' },
    english: { label: 'English', Icon: Medal, color: 'text-blue-300', bg: 'bg-blue-500/15', border: 'border-blue-500/40' },
}

/* =========================================================
   METRICS CALCULATOR
   ========================================================= */
const computeMetrics = (stats, history, level, mode, timerDuration) => {
    const totalQuestions = stats.total || 1
    const totalCorrect = stats.correctByP1 + (mode === 'double' ? stats.correctByP2 : 0)
    const accuracy = totalCorrect / totalQuestions
    const accuracyPct = Math.round(accuracy * 100)

    const avgResponseSec =
        stats.responseCount > 0
            ? stats.totalResponseMs / stats.responseCount / 1000
            : timerDuration

    const speedRatio = Math.max(0, Math.min(1, 1 - avgResponseSec / timerDuration))
    const levelMult = LEVEL_MULT[level] || 1
    const baseIQ = accuracy * 100 * levelMult
    const longestStreak = Math.max(stats.longestStreakP1, stats.longestStreakP2)
    const speedBonus = speedRatio * 30
    const streakBonus = Math.min(15, longestStreak * 2)
    const timeoutPenalty = stats.timeouts * 1.5

    const iq = Math.max(40, Math.min(180, Math.round(baseIQ + speedBonus + streakBonus - timeoutPenalty)))

    const speedRating =
        speedRatio > 0.75 ? { label: 'Lightning', color: 'text-green-400', Icon: Zap }
            : speedRatio > 0.5 ? { label: 'Sharp', color: 'text-amber-400', Icon: Zap }
                : speedRatio > 0.25 ? { label: 'Steady', color: 'text-blue-400', Icon: Clock }
                    : { label: 'Deliberate', color: 'text-slate-400', Icon: Clock }

    const rank = RANK_TITLES.find((r) => iq >= r.min) || RANK_TITLES[RANK_TITLES.length - 1]

    return {
        iq, accuracyPct, avgResponseSec, speedRatio, speedRating,
        longestStreak, rank, levelMult,
    }
}

/* =========================================================
   RESULT SCREEN
   ========================================================= */
const ResultScreen = ({
    player1Name, player2Name, player1Score, player2Score,
    mode = 'double', level = 'easy', onReset, onHome,
    roundHistory = [],
    questionStats = null,
    timerDuration = 15,
}) => {
    const [showConfetti, setShowConfetti] = useState(true)
    useEffect(() => {
        const t = setTimeout(() => setShowConfetti(false), 3500)
        return () => clearTimeout(t)
    }, [])

    const isSingle = mode === 'single'
    const total = 50
    const winner = isSingle ? 1 : player1Score > player2Score ? 1 : player2Score > player1Score ? 2 : 0

    const title = isSingle
        ? `${player1Name.toUpperCase()} SCORED ${player1Score}`
        : winner === 0 ? 'DRAW'
            : winner === 1 ? `${player1Name.toUpperCase()} WINS`
                : `${player2Name.toUpperCase()} WINS`

    const subtitle = isSingle
        ? `${Math.round((player1Score / total) * 100)}% accuracy`
        : winner === 0 ? 'Perfectly matched'
            : winner === 1 ? 'Player 1 takes the crown'
                : 'Player 2 takes the crown'

    const levelInfo = LEVEL_BADGE[level] || LEVEL_BADGE.easy

    const metrics = useMemo(() => {
        if (!questionStats) return null
        return computeMetrics(questionStats, roundHistory, level, mode, timerDuration)
    }, [questionStats, roundHistory, level, mode, timerDuration])

    const [tab, setTab] = useState('summary')

    return (
        <div className="relative min-h-screen w-full flex items-start justify-center px-3.5 pb-6 pt-[76px] z-10">
            <FloatingHearts />
            {showConfetti && <Confetti />}

            <div className="w-full max-w-md flex flex-col items-center gap-3 text-center animate-slide-up">

                {/* Champion ring */}
                <div className="w-20 h-20 rounded-[24px] grid place-items-center bg-gradient-to-br from-amber-400/15 to-pink-500/15 border border-amber-400/45 shadow-[0_0_50px_rgba(251,191,36,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] animate-heartbeat">
                    {isSingle ? <Target size={38} className="text-green-500" strokeWidth={2.2} />
                        : winner === 0 ? <Users size={38} className="text-violet-400" strokeWidth={2} />
                            : <Crown size={38} className="text-amber-400" strokeWidth={2.2} />}
                </div>

                <div className="flex items-center gap-1.5 mt-0.5">
                    <Trophy size={11} className="text-slate-500" strokeWidth={2.6} />
                    <span className="text-[10px] font-extrabold tracking-[2.4px] text-slate-500">PUZZLE RESULT</span>
                </div>

                <h1 className="text-[clamp(20px,5.5vw,26px)] font-black tracking-[1.4px] bg-gradient-to-br from-pink-400 via-violet-500 to-blue-400 bg-clip-text text-transparent leading-tight px-2.5">
                    {title}
                </h1>
                <p className="text-[11px] text-slate-400 font-semibold tracking-wide">
                    {subtitle}
                </p>

                <div className={`inline-flex items-center gap-1.5 text-[10px] font-black tracking-[1.4px] px-3 py-1.5 rounded-full border ${levelInfo.cls}`}>
                    <Medal size={11} strokeWidth={2.8} />
                    <span>{levelInfo.label} · {isSingle ? 'SOLO' : 'DUEL'}</span>
                </div>

                {/* ===== RANK BANNER ===== */}
                {metrics && (() => {
                    const r = metrics.rank
                    const RankIcon = r.Icon
                    return (
                        <div className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl ${r.bg} border ${r.border} ${r.glow} backdrop-blur-md`}>
                            <div className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 bg-slate-950/50 border ${r.border}`}>
                                <RankIcon size={22} strokeWidth={2.4} className={r.iconColor} />
                            </div>

                            <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <Award size={10} className={r.iconColor} strokeWidth={3} />
                                    <span className="text-[8px] font-black tracking-[2px] text-slate-400 uppercase">
                                        RANK ACHIEVED
                                    </span>
                                </div>
                                <div className={`text-base sm:text-lg font-black tracking-[2px] leading-none bg-gradient-to-r ${r.titleGrad} bg-clip-text text-transparent`}>
                                    {r.title}
                                </div>
                            </div>

                            <div className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg border ${r.badge}`}>
                                <TrendingUp size={10} strokeWidth={3} />
                                <span className="text-[9px] font-black tracking-wider uppercase">
                                    {r.subtitle}
                                </span>
                            </div>
                        </div>
                    )
                })()}

                {/* Tabs */}
                <div className="w-full grid grid-cols-3 gap-1.5 mt-1">
                    {[
                        { id: 'summary', label: 'Summary', Icon: BarChart3 },
                        { id: 'rounds', label: 'Rounds', Icon: TrendingUp },
                        { id: 'stats', label: 'Stats', Icon: Brain },
                    ].map((t) => {
                        const active = tab === t.id
                        const Icon = t.Icon
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setTab(t.id)}
                                className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[10px] font-black tracking-wider transition-all ${active
                                    ? 'bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-[0_4px_14px_rgba(139,92,246,0.45)]'
                                    : 'bg-slate-800/50 border border-slate-500/15 text-slate-400 hover:border-slate-400/30'
                                    }`}
                            >
                                <Icon size={12} strokeWidth={2.8} />
                                <span>{t.label}</span>
                            </button>
                        )
                    })}
                </div>

                {/* ============= SUMMARY TAB ============= */}
                {tab === 'summary' && (
                    <>
                        <div className="w-full bg-gradient-to-b from-slate-900/90 to-slate-950/85 backdrop-blur-xl rounded-2xl p-4 border border-violet-500/30 shadow-[0_18px_44px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]">
                            {isSingle ? (
                                <div className="flex flex-col items-center gap-1">
                                    <div className="text-xs font-extrabold tracking-wide text-blue-400 uppercase">{player1Name}</div>
                                    <div className="text-[clamp(32px,9vw,42px)] font-black leading-none tabular-nums text-blue-400 [text-shadow:0_0_20px_currentColor]">
                                        {player1Score}
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-bold">out of {total}</div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0 flex flex-col gap-1 items-start">
                                        <div className="text-[11px] font-extrabold text-blue-400 tracking-wide truncate max-w-full uppercase">{player1Name}</div>
                                        <div className="text-[clamp(30px,8.5vw,40px)] font-black leading-none tabular-nums text-blue-400 [text-shadow:0_0_20px_currentColor]">
                                            {player1Score}
                                        </div>
                                        {winner === 1 && <Crown size={16} className="text-amber-400" strokeWidth={2.6} />}
                                    </div>
                                    <div className="flex items-center justify-center px-1.5">
                                        <span className="text-[10px] font-black tracking-[2px] text-slate-500 px-2 py-1 border border-slate-400/20 rounded-lg">VS</span>
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col gap-1 items-end">
                                        <div className="text-[11px] font-extrabold text-pink-400 tracking-wide truncate max-w-full uppercase">{player2Name}</div>
                                        <div className="text-[clamp(30px,8.5vw,40px)] font-black leading-none tabular-nums text-pink-400 [text-shadow:0_0_20px_currentColor]">
                                            {player2Score}
                                        </div>
                                        {winner === 2 && <Crown size={16} className="text-amber-400" strokeWidth={2.6} />}
                                    </div>
                                </div>
                            )}
                        </div>

                        {metrics && (
                            <div className="w-full grid grid-cols-3 gap-2">
                                <MetricCard
                                    Icon={Brain}
                                    label="IQ SCORE"
                                    value={metrics.iq}
                                    color="text-violet-300"
                                    bg="bg-violet-500/15"
                                    border="border-violet-500/40"
                                />
                                <MetricCard
                                    Icon={metrics.speedRating.Icon}
                                    label="SPEED"
                                    value={metrics.speedRating.label}
                                    color={metrics.speedRating.color}
                                    bg="bg-green-500/15"
                                    border="border-green-500/40"
                                    small
                                />
                                <MetricCard
                                    Icon={Flame}
                                    label="STREAK"
                                    value={`${metrics.longestStreak}x`}
                                    color="text-pink-300"
                                    bg="bg-pink-500/15"
                                    border="border-pink-500/40"
                                />
                            </div>
                        )}
                    </>
                )}

                {/* ============= ROUNDS TAB ============= */}
                {tab === 'rounds' && (
                    <div className="w-full bg-gradient-to-b from-slate-900/90 to-slate-950/85 backdrop-blur-xl rounded-2xl p-4 border border-violet-500/30 shadow-[0_18px_44px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp size={14} className="text-violet-400" strokeWidth={2.8} />
                            <span className="text-[10px] font-black tracking-[1.6px] text-slate-400">ROUND-BY-ROUND</span>
                        </div>

                        <div className="flex flex-col gap-2">
                            {roundHistory.map((r, i) => {
                                const meta = CATEGORY_META[r.category] || CATEGORY_META.arithmetic
                                const CatIcon = meta.Icon
                                const p1Win = r.p1 > r.p2
                                const p2Win = r.p2 > r.p1
                                return (
                                    <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/50 border border-slate-500/15">
                                        <div className={`w-7 h-7 rounded-lg grid place-items-center shrink-0 ${meta.bg} ${meta.border} border`}>
                                            <CatIcon size={13} className={meta.color} strokeWidth={2.6} />
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <div className="text-[10px] font-black tracking-wider text-slate-300 uppercase">
                                                ROUND {r.round} · {meta.label}
                                            </div>
                                            <div className="text-[9px] text-slate-500 font-bold tracking-wide">
                                                {r.reason === 'timeout' ? 'Time expired' : 'Complete'}
                                            </div>
                                        </div>
                                        {isSingle ? (
                                            <div className="flex items-center gap-1 shrink-0">
                                                <span className="text-sm font-black text-blue-400 tabular-nums">{r.p1}</span>
                                                <span className="text-[10px] text-slate-500 font-bold">/10</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className={`text-sm font-black tabular-nums ${p1Win ? 'text-blue-400' : 'text-slate-500'}`}>{r.p1}</span>
                                                {p1Win && <Check size={11} className="text-green-400" strokeWidth={3} />}
                                                {p2Win && <Check size={11} className="text-green-400" strokeWidth={3} />}
                                                <span className={`text-sm font-black tabular-nums ${p2Win ? 'text-pink-400' : 'text-slate-500'}`}>{r.p2}</span>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* ============= STATS TAB ============= */}
                {tab === 'stats' && questionStats && metrics && (
                    <div className="w-full bg-gradient-to-b from-slate-900/90 to-slate-950/85 backdrop-blur-xl rounded-2xl p-4 border border-violet-500/30 shadow-[0_18px_44px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center gap-2 mb-3">
                            <Brain size={14} className="text-pink-400" strokeWidth={2.8} />
                            <span className="text-[10px] font-black tracking-[1.6px] text-slate-400">DETAILED STATS</span>
                        </div>

                        <div className="flex flex-col gap-2">
                            <StatRow label="Questions Attempted" value={questionStats.total} icon={BarChart3} />
                            <StatRow label="Accuracy" value={`${metrics.accuracyPct}%`} icon={Target} />
                            <StatRow label="Avg Response Time" value={`${metrics.avgResponseSec.toFixed(1)}s`} icon={Clock} />
                            <StatRow label="Timeouts" value={questionStats.timeouts} icon={Clock} />
                            <StatRow label="Best Streak" value={`${metrics.longestStreak} in a row`} icon={Flame} />
                            <StatRow label="Speed Rating" value={metrics.speedRating.label} icon={metrics.speedRating.Icon} />
                            {!isSingle && (
                                <>
                                    <div className="h-px my-1 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
                                    <StatRow label={`${player1Name} correct`} value={questionStats.correctByP1} icon={Check} color="text-blue-400" />
                                    <StatRow label={`${player2Name} correct`} value={questionStats.correctByP2} icon={Check} color="text-pink-400" />
                                </>
                            )}
                        </div>
                    </div>
                )}

                <button
                    onClick={onReset}
                    className="flex items-center justify-center gap-1.5 mt-1 px-8 py-3.5 text-[13px] font-black tracking-[1.6px] text-white bg-gradient-to-br from-pink-500 to-violet-600 border border-pink-500/80 rounded-[14px] cursor-pointer shadow-[0_12px_32px_rgba(236,72,153,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] active:scale-[0.98] touch-manipulation"
                >
                    <Heart size={15} strokeWidth={2.8} fill="#fff" />
                    <span>PLAY AGAIN</span>
                </button>
            </div>
        </div>
    )
}

/* =========================================================
   HELPER COMPONENTS
   ========================================================= */
const MetricCard = ({ Icon, label, value, color, bg, border, small }) => (
    <div className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl border ${bg} ${border}`}>
        <Icon size={14} className={color} strokeWidth={2.8} />
        <div className="text-[8px] font-black tracking-[1.2px] text-slate-500 uppercase">{label}</div>
        <div className={`${small ? 'text-xs' : 'text-lg'} font-black tabular-nums ${color} leading-none`}>
            {value}
        </div>
    </div>
)

const StatRow = ({ label, value, icon: Icon, color = 'text-slate-200' }) => (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-950/40 border border-slate-500/10">
        <div className="flex items-center gap-2">
            <Icon size={12} className="text-slate-500" strokeWidth={2.6} />
            <span className="text-[11px] font-bold tracking-wide text-slate-400">{label}</span>
        </div>
        <span className={`text-[12px] font-black tabular-nums tracking-wide ${color}`}>{value}</span>
    </div>
)

const Confetti = () => {
    const items = Array.from({ length: 40 })
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
            {items.map((_, i) => {
                const left = Math.random() * 100
                const delay = Math.random() * 1.5
                const duration = 2.5 + Math.random() * 2
                const emoji = ['🎉', '🎊', '💕', '❤️', '✨'][Math.floor(Math.random() * 5)]
                return (
                    <span
                        key={i}
                        className="absolute -top-[30px] text-lg"
                        style={{
                            left: `${left}%`,
                            animation: `confettiFall ${duration}s linear ${delay}s forwards`,
                        }}
                    >
                        {emoji}
                    </span>
                )
            })}
        </div>
    )
}

export default ResultScreen