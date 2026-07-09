"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface StudentSKSChartProps {
  earned: number
  required: number
  percentage: number
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number }>
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{payload[0].name}</p>
      <p className="text-muted-foreground">{payload[0].value} SKS</p>
    </div>
  )
}

export function StudentSKSChart({ earned, required, percentage }: StudentSKSChartProps) {
  const remaining = required - earned
  const data = [
    { name: "SKS Lulus", value: earned },
    { name: "SKS Tersisa", value: remaining > 0 ? remaining : 0 },
  ]

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={44}
              outerRadius={64}
              startAngle={90}
              endAngle={-270}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill="hsl(var(--primary))" />
              <Cell fill="hsl(var(--muted))" />
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold leading-none">{percentage}%</span>
          <span className="text-xs text-muted-foreground mt-1">Selesai</span>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ background: "hsl(var(--primary))" }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">SKS Lulus</p>
            <p className="text-base font-bold leading-tight">{earned} <span className="text-xs font-normal text-muted-foreground">SKS</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0 bg-muted border border-border" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">SKS Tersisa</p>
            <p className="text-base font-bold leading-tight">{remaining > 0 ? remaining : 0} <span className="text-xs font-normal text-muted-foreground">SKS</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0 bg-border" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Total Wajib</p>
            <p className="text-base font-bold leading-tight">{required} <span className="text-xs font-normal text-muted-foreground">SKS</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
