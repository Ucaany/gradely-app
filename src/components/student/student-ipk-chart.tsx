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

interface ChartPoint {
  semester: string
  ips: number
  ipk: number
}

interface StudentIPKChartProps {
  data: ChartPoint[]
  minGpa?: number
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border bg-card shadow-lg px-3 py-2.5 text-xs min-w-[160px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground">
              {p.name === 'ips' ? 'IPS Semester Ini' : 'IPK Kumulatif'}
            </span>
          </div>
          <span className="font-semibold tabular-nums">{Number(p.value).toFixed(2)}</span>
        </div>
      ))}
    </div>
  )
}

export function StudentIPKChart({ data, minGpa = 2.0 }: StudentIPKChartProps) {
  return (
    <div className="space-y-3">
      {/* Legend yang jelas */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-4 rounded-sm bg-primary/30 border border-primary/50" />
          <span>IPS — nilai rata-rata per semester</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-primary" />
          <span>IPK — akumulasi seluruh semester</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
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
              value: `Min ${minGpa.toFixed(2)}`,
              fontSize: 10,
              fill: 'hsl(var(--destructive))',
              position: 'insideTopRight',
            }}
          />
          <Bar
            dataKey="ips"
            name="ips"
            fill="hsl(var(--primary) / 0.2)"
            stroke="hsl(var(--primary) / 0.5)"
            radius={[4, 4, 0, 0]}
            barSize={32}
          >
            <LabelList
              dataKey="ips"
              position="top"
              style={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              formatter={((v: unknown) => typeof v === 'number' && v > 0 ? v.toFixed(2) : '') as (value: unknown) => string}
            />
          </Bar>
          <Line
            type="monotone"
            dataKey="ipk"
            name="ipk"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
          >
            <LabelList
              dataKey="ipk"
              position="top"
              style={{ fontSize: 10, fill: 'hsl(var(--primary))' }}
              formatter={((v: unknown) => typeof v === 'number' && v > 0 ? v.toFixed(2) : '') as (value: unknown) => string}
            />
          </Line>
        </ComposedChart>
      </ResponsiveContainer>

      <p className="text-xs text-muted-foreground text-center">
        Bar = IPS tiap semester · Garis = IPK kumulatif yang terus bertambah
      </p>
    </div>
  )
}
