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
  Cell,
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
  payload?: Array<{ name: string; value: number; color: string; payload: TargetChartPoint }>
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  const isActual = payload[0]?.payload?.is_actual ?? false
  return (
    <div className="rounded-xl border bg-card shadow-lg px-3 py-2.5 text-xs min-w-[160px]">
      <div className="flex items-center gap-2 mb-2">
        <p className="font-semibold text-foreground">{label}</p>
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${isActual ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-muted text-muted-foreground'}`}>
          {isActual ? 'Data Nyata' : 'Prediksi'}
        </span>
      </div>
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
      {!isActual && (
        <p className="text-muted-foreground/70 text-[10px] mt-1.5 border-t pt-1.5">Nilai perkiraan berdasarkan target</p>
      )}
    </div>
  )
}

export function StudentTargetChart({ data, targetIPK, minGpa = 2.0 }: StudentTargetChartProps) {
  const actualData = data.filter(d => d.is_actual)
  const projectedData = data.filter(d => !d.is_actual)

  return (
    <div className="space-y-3">
      {/* Legend yang lebih jelas */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-4 rounded-sm bg-blue-500/70" />
          <span>IPS Aktual — nilai nyata dari {actualData.length} semester lalu</span>
        </div>
        {projectedData.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-4 rounded-sm bg-muted border border-dashed border-muted-foreground/40" />
            <span>IPS Proyeksi — prediksi {projectedData.length} semester ke depan</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-primary" />
          <span>IPK Kumulatif — nilai rata-rata keseluruhan</span>
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

          {/* Garis IPK minimum */}
          <ReferenceLine
            y={minGpa}
            stroke="hsl(var(--destructive) / 0.6)"
            strokeDasharray="4 3"
            label={{
              value: `IPK Min ${minGpa.toFixed(2)}`,
              fontSize: 10,
              fill: 'hsl(var(--destructive))',
              position: 'insideTopRight',
            }}
          />

          {/* Garis target IPK */}
          {targetIPK && (
            <ReferenceLine
              y={targetIPK}
              stroke="hsl(var(--primary) / 0.6)"
              strokeDasharray="5 4"
              label={{
                value: `Target IPK ${targetIPK.toFixed(2)}`,
                fontSize: 10,
                fill: 'hsl(var(--primary))',
                position: 'insideBottomRight',
              }}
            />
          )}

          {/* Bar IPS — beda warna aktual vs proyeksi */}
          <Bar dataKey="ips" radius={[4, 4, 0, 0]} barSize={28}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.is_actual ? 'hsl(217 91% 60% / 0.7)' : 'hsl(var(--muted))'}
                stroke={entry.is_actual ? 'hsl(217 91% 60%)' : 'hsl(var(--muted-foreground) / 0.3)'}
                strokeDasharray={entry.is_actual ? '0' : '4 2'}
              />
            ))}
            <LabelList
              dataKey="ips"
              position="top"
              style={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              formatter={((v: unknown) => typeof v === 'number' && v > 0 ? v.toFixed(2) : '') as (value: unknown) => string}
            />
          </Bar>

          {/* Line IPK kumulatif */}
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
                />
              )
            }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
            connectNulls
          >
            <LabelList
              dataKey="ipk"
              position="top"
              style={{ fontSize: 9, fill: 'hsl(var(--primary))' }}
              formatter={((v: unknown) => typeof v === 'number' && v > 0 ? v.toFixed(2) : '') as (value: unknown) => string}
            />
          </Line>
        </ComposedChart>
      </ResponsiveContainer>

      {projectedData.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          📊 Bar biru = nilai nyata · Bar abu = prediksi · Garis = IPK kumulatif
        </p>
      )}
    </div>
  )
}
