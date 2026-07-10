"use client"

import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"

interface StatusDataItem {
  status: string
  label: string
  count: number
  color: string
}

export function StudentStatusChart() {
  const [data, setData] = useState<StatusDataItem[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/student-status', { credentials: 'include' })
        const result = await res.json()
        if (result.success && result.data?.length > 0) {
          setData(result.data.filter((d: StatusDataItem) => d.count > 0))
          setTotal(result.total ?? 0)
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Status Akademik Mahasiswa</CardTitle>
            <CardDescription>
              {isLoading ? 'Memuat data...' : total === 0 ? 'Belum ada data mahasiswa aktif' : `Distribusi dari ${total} mahasiswa aktif`}
            </CardDescription>
          </div>
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[220px]">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
            Data akan muncul setelah mahasiswa menginput nilai
          </div>
        ) : (
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
                  const num = typeof value === 'number' ? value : 0
                  return [`${num} mahasiswa (${total > 0 ? Math.round((num / total) * 100) : 0}%)`, name as string]
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                formatter={(value) => value}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
