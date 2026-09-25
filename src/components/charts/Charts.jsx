import React from 'react'

/* =========================================================
   Simple Bar Chart
   ========================================================= */
export const BarChart = ({ labels, series, unit, title, grouped = false }) => {
    const values = grouped ? series.flatMap((s) => s.values) : (series[0]?.values || [])
    const max = Math.max(...values, 1)
    const chartH = 180
    const barW = grouped ? 18 : 36
    const gap = 16

    const colors = ['#a78bfa', '#ec4899', '#60a5fa', '#34d399']
    const palette = series.map((_, i) => colors[i % colors.length])

    return (
        <div className="rounded-2xl bg-slate-950/50 border border-slate-500/20 p-4">
            {title && (
                <div className="text-[11px] font-black tracking-wide text-slate-300 mb-3 text-center">
                    {title}
                    {unit && <span className="text-slate-500"> · {unit}</span>}
                </div>
            )}
            <svg viewBox={`0 0 ${labels.length * (barW * series.length + gap * 2)} ${chartH + 40}`} className="w-full h-auto">
                {/* Y axis grid */}
                {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                    <line key={f}
                        x1="0" x2="100%" y1={20 + chartH * (1 - f)} y2={20 + chartH * (1 - f)}
                        stroke="rgba(148,163,184,0.15)" strokeWidth="1" strokeDasharray="3 3" />
                ))}
                {/* Bars */}
                {labels.map((label, i) => {
                    const xBase = i * (barW * series.length + gap * 2) + gap
                    return series.map((s, si) => {
                        const v = s.values[i] || 0
                        const h = (v / max) * chartH
                        const x = xBase + si * barW
                        const y = 20 + chartH - h
                        return (
                            <g key={`${i}-${si}`}>
                                <rect x={x} y={y} width={barW - 4} height={h} rx="3"
                                    fill={palette[si]} opacity="0.85" />
                                <text x={x + (barW - 4) / 2} y={y - 4} textAnchor="middle"
                                    fontSize="9" fontWeight="700" fill="#cbd5e1">
                                    {v}
                                </text>
                            </g>
                        )
                    })
                })}
                {/* X labels */}
                {labels.map((label, i) => (
                    <text key={i}
                        x={i * (barW * series.length + gap * 2) + gap + (barW * series.length) / 2}
                        y={20 + chartH + 16}
                        textAnchor="middle" fontSize="10" fontWeight="600" fill="#94a3b8">
                        {label}
                    </text>
                ))}
            </svg>
            {/* Legend */}
            {series.length > 1 && (
                <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
                    {series.map((s, i) => (
                        <div key={s.name} className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm" style={{ background: palette[i] }} />
                            <span className="text-[10px] font-bold text-slate-400">{s.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

/* =========================================================
   Line Chart
   ========================================================= */
export const LineChart = ({ labels, series, unit, title }) => {
    const values = series.flatMap((s) => s.values)
    const max = Math.max(...values, 1)
    const chartH = 180
    const chartW = 340
    const stepX = labels.length > 1 ? (chartW - 40) / (labels.length - 1) : chartW

    const colors = ['#a78bfa', '#ec4899', '#60a5fa', '#34d399']

    return (
        <div className="rounded-2xl bg-slate-950/50 border border-slate-500/20 p-4">
            {title && (
                <div className="text-[11px] font-black tracking-wide text-slate-300 mb-3 text-center">
                    {title}
                    {unit && <span className="text-slate-500"> · {unit}</span>}
                </div>
            )}
            <svg viewBox={`0 0 ${chartW + 40} ${chartH + 40}`} className="w-full h-auto">
                {/* Grid */}
                {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                    <line key={f}
                        x1="20" x2={chartW + 20} y1={20 + chartH * (1 - f)} y2={20 + chartH * (1 - f)}
                        stroke="rgba(148,163,184,0.15)" strokeWidth="1" strokeDasharray="3 3" />
                ))}
                {/* Lines */}
                {series.map((s, si) => {
                    const color = colors[si % colors.length]
                    const points = s.values.map((v, i) => ({
                        x: 20 + i * stepX,
                        y: 20 + chartH - (v / max) * chartH,
                        v,
                    }))
                    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
                    return (
                        <g key={si}>
                            <path d={path} fill="none" stroke={color} strokeWidth="2.5"
                                strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
                            {points.map((p, i) => (
                                <g key={i}>
                                    <circle cx={p.x} cy={p.y} r="3.5" fill="#0f172a" stroke={color} strokeWidth="2" />
                                    <text x={p.x} y={p.y - 8} textAnchor="middle"
                                        fontSize="9" fontWeight="700" fill="#cbd5e1">
                                        {p.v}
                                    </text>
                                </g>
                            ))}
                        </g>
                    )
                })}
                {/* X labels */}
                {labels.map((label, i) => (
                    <text key={i}
                        x={20 + i * stepX} y={20 + chartH + 16}
                        textAnchor="middle" fontSize="10" fontWeight="600" fill="#94a3b8">
                        {label}
                    </text>
                ))}
            </svg>
            {series.length > 1 && (
                <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
                    {series.map((s, i) => (
                        <div key={s.name} className="flex items-center gap-1.5">
                            <span className="w-3 h-1 rounded-full" style={{ background: colors[i % colors.length] }} />
                            <span className="text-[10px] font-bold text-slate-400">{s.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

/* =========================================================
   Pie Chart
   ========================================================= */
export const PieChart = ({ labels, series, unit, title }) => {
    const values = series[0]?.values || []
    const total = values.reduce((a, b) => a + b, 0) || 1
    const colors = ['#a78bfa', '#ec4899', '#60a5fa', '#34d399', '#fbbf24', '#f87171']
    const cx = 110, cy = 110, r = 80

    let acc = 0
    const arcs = values.map((v, i) => {
        const startAngle = (acc / total) * 2 * Math.PI - Math.PI / 2
        acc += v
        const endAngle = (acc / total) * 2 * Math.PI - Math.PI / 2
        const x1 = cx + r * Math.cos(startAngle)
        const y1 = cy + r * Math.sin(startAngle)
        const x2 = cx + r * Math.cos(endAngle)
        const y2 = cy + r * Math.sin(endAngle)
        const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
        const pct = ((v / total) * 100).toFixed(1)
        const midAngle = (startAngle + endAngle) / 2
        const lx = cx + r * 0.65 * Math.cos(midAngle)
        const ly = cy + r * 0.65 * Math.sin(midAngle)
        return { d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`, color: colors[i % colors.length], pct, v, label: labels[i], lx, ly }
    })

    return (
        <div className="rounded-2xl bg-slate-950/50 border border-slate-500/20 p-4">
            {title && (
                <div className="text-[11px] font-black tracking-wide text-slate-300 mb-3 text-center">
                    {title}
                    {unit && <span className="text-slate-500"> · {unit}</span>}
                </div>
            )}
            <svg viewBox="0 0 400 240" className="w-full h-auto">
                {arcs.map((a, i) => (
                    <g key={i}>
                        <path d={a.d} fill={a.color} opacity="0.85" stroke="#0f172a" strokeWidth="1.5" />
                        <text x={a.lx} y={a.ly} textAnchor="middle" fontSize="10" fontWeight="800" fill="#0f172a">
                            {a.pct}%
                        </text>
                    </g>
                ))}
                {/* Legend on right */}
                {arcs.map((a, i) => (
                    <g key={i} transform={`translate(240, ${30 + i * 28})`}>
                        <rect width="12" height="12" rx="2" fill={a.color} />
                        <text x="18" y="10" fontSize="11" fontWeight="700" fill="#cbd5e1">
                            {a.label} · {a.v}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    )
}

/* =========================================================
   Table
   ========================================================= */
export const DataTable = ({ rows, title, unit }) => {
    if (!Array.isArray(rows) || rows.length === 0) return null
    const header = rows[0]
    const body = rows.slice(1)

    return (
        <div className="rounded-2xl bg-slate-950/50 border border-slate-500/20 p-4">
            {title && (
                <div className="text-[11px] font-black tracking-wide text-slate-300 mb-3 text-center">
                    {title}
                    {unit && <span className="text-slate-500"> · {unit}</span>}
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse">
                    <thead>
                        <tr className="bg-violet-500/15">
                            {header.map((h, i) => (
                                <th key={i} className="px-2.5 py-2 text-left font-black text-slate-200 border border-slate-500/20 whitespace-nowrap">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {body.map((row, ri) => (
                            <tr key={ri} className={ri % 2 === 0 ? 'bg-slate-900/40' : ''}>
                                {row.map((cell, ci) => (
                                    <td key={ci} className="px-2.5 py-2 font-bold text-slate-300 border border-slate-500/15 whitespace-nowrap tabular-nums">
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

/* =========================================================
   Dispatcher
   ========================================================= */
export const ChartRenderer = ({ chartType, data, unit, title }) => {
    if (!data) return null

    if (chartType === 'table') {
        return <DataTable rows={data.rows} title={title} unit={unit} />
    }
    if (chartType === 'bar-simple') {
        return <BarChart labels={data.labels} series={data.series} title={title} unit={unit} />
    }
    if (chartType === 'bar-grouped' || chartType === 'mixed') {
        return <BarChart labels={data.labels} series={data.series} title={title} unit={unit} grouped={data.series?.length > 1} />
    }
    if (chartType === 'line') {
        return <LineChart labels={data.labels} series={data.series} title={title} unit={unit} />
    }
    if (chartType === 'pie') {
        return <PieChart labels={data.labels} series={data.series} title={title} unit={unit} />
    }
    if (chartType === 'caselet') {
        return (
            <div className="rounded-2xl bg-slate-950/50 border border-slate-500/20 p-4">
                {title && (
                    <div className="text-[11px] font-black tracking-wide text-slate-300 mb-3 text-center">
                        {title}
                    </div>
                )}
                <p className="text-[12.5px] text-slate-300 leading-relaxed whitespace-pre-line">
                    {data.text}
                </p>
            </div>
        )
    }
    return null
}