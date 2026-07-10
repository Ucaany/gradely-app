"use client"

import { useEffect, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ChartDataPoint {
  semester: string
  ipk: number
  ips: number
}

export function DashboardChart() {
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchChartData() {
      try {
        const res = await fetch('/api/admin/chart-data', { credentials: 'include' })
        const result = await res.json()
        if (result.success && result.data?.length > 0) {
          setData(result.data)
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchChartData()
  }, [])

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Rata-rata IPK & IPS Mahasiswa</CardTitle>
        <CardDescription>
          {isLoading ? 'Memuat data...' : data.length === 0 ? 'Belum ada data nilai mahasiswa' : 'Tren nilai akademik per semester (data real)'}
        </CardDescription>
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
            <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIPK" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorIPS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="semester" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 4.0]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(var(--foreground))",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Area type="monotone" dataKey="ipk" name="IPK" stroke="hsl(var(--primary))" fill="url(#colorIPK)" strokeWidth={2} />
              <Area type="monotone" dataKey="ips" name="IPS" stroke="hsl(var(--chart-2))" fill="url(#colorIPS)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
