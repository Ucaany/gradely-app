"use client"

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

const data = [
  { semester: "Sem 1", ipk: 3.2, ips: 3.4 },
  { semester: "Sem 2", ipk: 3.3, ips: 3.5 },
  { semester: "Sem 3", ipk: 3.25, ips: 3.1 },
  { semester: "Sem 4", ipk: 3.4, ips: 3.6 },
  { semester: "Sem 5", ipk: 3.45, ips: 3.5 },
  { semester: "Sem 6", ipk: 3.5, ips: 3.55 },
  { semester: "Sem 7", ipk: 3.55, ips: 3.7 },
]

export function DashboardChart() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Rata-rata IPK & IPS Mahasiswa</CardTitle>
        <CardDescription>Tren nilai akademik per semester (data ilustrasi)</CardDescription>
      </CardHeader>
      <CardContent>
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
            <XAxis
              dataKey="semester"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[2.5, 4.0]}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
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
            <Area
              type="monotone"
              dataKey="ipk"
              name="IPK"
              stroke="hsl(var(--primary))"
              fill="url(#colorIPK)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="ips"
              name="IPS"
              stroke="hsl(var(--chart-2))"
              fill="url(#colorIPS)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
