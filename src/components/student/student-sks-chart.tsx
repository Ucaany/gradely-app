"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface StudentSKSChartProps {
  sksEarned: number
  sksRequired: number
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border bg-card shadow-lg px-3 py-2 text-xs min-w-[120px]">
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-3 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.payload.fill }} />
            <span className="text-muted-foreground">{p.name}</span>
          </div>
          <span className="font-semibold tabular-nums">{p.value} SKS</span>
        </div>
      ))}
    </div>
  )
}

export function StudentSKSChart({ sksEarned, sksRequired }: StudentSKSChartProps) {
  const sksRemaining = Math.max(0, sksRequired - sksEarned)
  const percentage = sksRequired > 0 ? Math.min(100, Math.round((sksEarned / sksRequired) * 100)) : 0

  const data = [
    { name: "Sudah Ditempuh", value: sksEarned, fill: "hsl(var(--primary))" },
    { name: "Sisa", value: sksRemaining, fill: "hsl(var(--muted))" },
  ]

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-6 px-8">
      {/* Donut Chart - Kiri */}
      <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={36}
              outerRadius={52}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Label tengah */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-lg font-bold tabular-nums leading-none">{percentage}%</span>
        </div>
      </div>

      {/* Informasi Teks - Kanan */}
      <div className="flex flex-col justify-center gap-3">
        <div>
          <p className="text-2xl font-bold tabular-nums leading-none">
            {sksEarned}
            <span className="text-sm font-normal text-muted-foreground ml-1">/ {sksRequired} SKS</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">SKS ditempuh dari total kelulusan</p>
        </div>
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-primary shrink-0" />
            <span className="text-muted-foreground">Ditempuh: <span className="font-semibold text-foreground">{sksEarned}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/30 shrink-0" />
            <span className="text-muted-foreground">Sisa: <span className="font-semibold text-foreground">{sksRemaining}</span></span>
          </div>
        </div>
      </div>
    </div>
  )
}
