"use client";

import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface BarChartProps {
  data: any[];
  config: ChartConfig;
  dataKey: string;
  categoryKey: string;
}

export function BarChart({ data, config, dataKey, categoryKey }: BarChartProps) {
  return (
    <ChartContainer config={config} className="h-full w-full">
      <RechartsBarChart data={data}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/20" />
        <XAxis
          dataKey={categoryKey}
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          className="text-[10px] uppercase font-bold text-muted-foreground"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          className="text-[10px] font-bold text-muted-foreground"
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} fill="var(--color-primary)" />
      </RechartsBarChart>
    </ChartContainer>
  );
}
