'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface HkiChartProps {
  data: {
    year: number;
    count: number;
  }[];
}

export function HkiChart({ data }: HkiChartProps) {
  return (
    <ChartContainer config={{}} className="h-[250px] w-full">
      <BarChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
        <XAxis 
          dataKey="year" 
          tickLine={false} 
          axisLine={false} 
          tickMargin={8} 
          className="text-xs text-muted-foreground"
        />
        <YAxis 
          tickLine={false} 
          axisLine={false} 
          tickMargin={8} 
          width={30}
          className="text-xs text-muted-foreground"
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />} 
        />
        <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}