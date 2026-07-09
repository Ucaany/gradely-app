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
    <div className="rounded-xl border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold mb-1">{payload[0].name}</p>
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
        <ResponsiveContainer width={150} height={150}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={68}
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
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ background: "hsl(var(--primary))" }} />
            <p className="text-xs text-muted-foreground">SKS Lulus</p>
          </div>
          <p className="text-xl font-bold leading-none pl-4">{earned} <span className="text-xs font-normal text-muted-foreground">SKS</span></p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0 bg-muted border border-border" />
            <p className="text-xs text-muted-foreground">SKS Tersisa</p>
          </div>
          <p className="text-xl font-bold leading-none pl-4">{remaining > 0 ? remaining : 0} <span className="text-xs font-normal text-muted-foreground">SKS</span></p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0 bg-border" />
            <p className="text-xs text-muted-foreground">Total Wajib</p>
          </div>
          <p className="text-xl font-bold leading-none pl-4">{required} <span className="text-xs font-normal text-muted-foreground">SKS</span></p>
        </div>
      </div>
    </div>
  )
}
