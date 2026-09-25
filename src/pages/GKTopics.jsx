import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Landmark, TrendingUp, Building2, Newspaper, BarChart3,
  BookOpen, Sparkles, Award,
} from 'lucide-react'
import { GK_TOPICS } from '../data/gkTopics.js'

const ICONS = { Landmark, TrendingUp, Building2, Newspaper, BarChart3 }

const COLORS = {
  blue:    { icon: 'text-blue-300',    border: 'border-blue-400/40',    box: 'bg-blue-500/15',    accent: 'bg-blue-400'    },
  violet:  { icon: 'text-violet-300',  border: 'border-violet-400/40',  box: 'bg-violet-500/15',  accent: 'bg-violet-400'  },
  emerald: { icon: 'text-emerald-300', border: 'border-emerald-400/40', box: 'bg-emerald-500/15', accent: 'bg-emerald-400' },
  amber:   { icon: 'text-amber-300',   border: 'border-amber-400/40',   box: 'bg-amber-500/15',   accent: 'bg-amber-400'   },
  rose:    { icon: 'text-rose-300',    border: 'border-rose-400/40',    box: 'bg-rose-500/15',    accent: 'bg-rose-400'    },
}

const GKTopics = () => {
  return (
    <div className="relative min-h-screen w-full px-4 pb-10 pt-[76px] z-10">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-96 h-96 rounded-full bg-violet-500/10 blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-pink-500/10 blur-[120px]" />
      </div>

      <div className="relative max-w-2xl mx-auto flex flex-col gap-5">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 rounded-full bg-slate-900/70 border border-violet-500/30">
            <Award size={11} className="text-violet-300" strokeWidth={2.8} />
            <span className="text-[9px] font-black tracking-[1.8px] uppercase text-violet-200">
              Bank Exam GK
            </span>
          </div>
          <h1 className="text-[clamp(22px,6vw,30px)] font-black tracking-tight bg-gradient-to-r from-violet-300 via-pink-300 to-blue-300 bg-clip-text text-transparent mb-1">
            General Knowledge
          </h1>
          <p className="text-[12px] text-slate-400 font-semibold">
            AI-generated GK practice for bank exams
          </p>
        </div>

        {/* Topic cards */}
        <div className="flex flex-col gap-2.5">
          {GK_TOPICS.map((topic, idx) => {
            const Icon = ICONS[topic.icon] || Landmark
            const c = COLORS[topic.color] || COLORS.blue
            return (
              <Link
                key={topic.id}
                to={`/gk/${topic.id}`}
                className={`group relative overflow-hidden flex items-center gap-3.5 p-4 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-950/70 border ${c.border} backdrop-blur-md transition-all hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.99]`}
              >
                {/* Left accent strip */}
                <div className={`absolute top-0 left-0 w-1 h-full ${c.accent} opacity-60 group-hover:opacity-100 transition-opacity`} />

                <div className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 ${c.box} border ${c.border}`}>
                  <Icon size={20} className={c.icon} strokeWidth={2.4} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-black tracking-wide text-slate-100 mb-0.5">
                    {topic.title}
                  </div>
                  <div className={`text-[10px] font-black tracking-[1.2px] uppercase ${c.icon} mb-0.5`}>
                    {topic.subtitle}
                  </div>
                  <p className="text-[11.5px] text-slate-400 leading-snug">
                    {topic.shortDesc}
                  </p>
                </div>

                <ArrowRight size={16} className="text-slate-500 shrink-0 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.8} />
              </Link>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/60 border border-slate-500/20 backdrop-blur-sm">
            <Sparkles size={11} className="text-violet-300" strokeWidth={2.8} />
            <span className="text-[10px] font-black tracking-[1.4px] uppercase text-slate-400">
              Fresh questions every attempt
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GKTopics