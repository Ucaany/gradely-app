"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { ACADEMIC_STATUS_CONFIG } from "@/lib/utils/academic"
import type { AcademicStatus } from "@/types"

const STATUS_COLORS: Record<AcademicStatus, string> = {
  ahead: "#22c55e",
  on_track: "#3b82f6",
  need_attention: "#eab308",
  recovery_mode: "#f97316",
  critical: "#ef4444",
}

interface StatusChartProps {
  counts: Record<AcademicStatus, number>
  total: number
}

export function LecturerStatusChart({ counts, total }: StatusChartProps) {
  const data = (Object.entries(counts) as [AcademicStatus, number][])
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      status,
      label: ACADEMIC_STATUS_CONFIG[status].label,
      count,
      color: STATUS_COLORS[status],
    }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
        Data akan muncul setelah mahasiswa menginput nilai
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="count"
          nameKey="label"
        >
          {data.map((entry) => (
            <Cell key={entry.status} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
            color: "hsl(var(--foreground))",
          }}
          formatter={(value, name) => {
            const num = typeof value === "number" ? value : 0
            return [
              `${num} mahasiswa (${total > 0 ? Math.round((num / total) * 100) : 0}%)`,
              name as string,
            ]
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
          formatter={(value) => value}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
