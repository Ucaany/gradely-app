"use client"

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  LabelList,
} from "recharts"

interface TargetChartPoint {
  semester: string
  ips?: number
  ipk?: number
  is_actual: boolean
}

interface StudentTargetChartProps {
  data: TargetChartPoint[]
  targetIPK?: number | null
  minGpa?: number
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  const isActual = payload.some(p => p.name === 'ips')
  return (
    <div className="rounded-xl border bg-card shadow-lg px-3 py-2.5 text-xs min-w-[160px]">
      <div className="flex items-center gap-2 mb-2">
        <p className="font-semibold text-foreground">{label}</p>
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${isActual ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
          {isActual ? 'Aktual' : 'Proyeksi'}
        </span>
      </div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground">
              {p.name === 'ips' ? 'IPS' : 'IPK'}
            </span>
          </div>
          <span className="font-semibold tabular-nums">{Number(p.value).toFixed(2)}</span>
        </div>
      ))}
    </div>
  )
}

export function StudentTargetChart({ data, targetIPK, minGpa = 2.0 }: StudentTargetChartProps) {
  const actualData = data.filter(d => d.is_actual)
  const projectedData = data.filter(d => !d.is_actual)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: 'hsl(var(--primary) / 0.3)' }} />
          <span>IPS Aktual ({actualData.length} semester)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-muted border border-border" />
          <span>IPS Proyeksi ({projectedData.length} semester)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-0.5 bg-primary" style={{ height: 12 }} />
          <span>IPK Kumulatif</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 20, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="semester"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 4.0]}
            ticks={[0, 1, 2, 3, 4]}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={minGpa}
            stroke="hsl(var(--destructive) / 0.5)"
            strokeDasharray="4 3"
            label={{
              value: `IPK Min ${minGpa.toFixed(2)}`,
              fontSize: 10,
              fill: 'hsl(var(--destructive))',
              position: 'insideTopRight',
            }}
          />
          {targetIPK && (
            <ReferenceLine
              y={targetIPK}
              stroke="hsl(var(--primary) / 0.5)"
              strokeDasharray="5 4"
              label={{
                value: `Target IPK ${targetIPK.toFixed(2)}`,
                fontSize: 10,
                fill: 'hsl(var(--primary))',
                position: 'insideBottomRight',
              }}
            />
          )}
          <Bar
            dataKey="ips"
            radius={[4, 4, 0, 0]}
            barSize={28}
            fill="hsl(var(--primary) / 0.25)"
            stroke="hsl(var(--primary) / 0.5)"
          >
            <LabelList
              dataKey="ips"
              position="top"
              style={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              formatter={((v: unknown) => typeof v === 'number' && v > 0 ? v.toFixed(2) : '') as (value: unknown) => string}
            />
          </Bar>
          <Line
            type="monotone"
            dataKey="ipk"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            dot={(props) => {
              const { cx, cy, payload } = props
              return (
                <circle
                  key={payload.semester}
                  cx={cx}
                  cy={cy}
                  r={payload.is_actual ? 4 : 3}
                  fill={payload.is_actual ? 'hsl(var(--primary))' : 'hsl(var(--background))'}
                  stroke="hsl(var(--primary))"
                  strokeWidth={payload.is_actual ? 0 : 2}
                  strokeDasharray={payload.is_actual ? '0' : '3 2'}
                />
              )
            }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
      {projectedData.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Proyeksi {projectedData.length} semester ke depan berdasarkan target yang ditetapkan
        </p>
      )}
    </div>
  )
}
