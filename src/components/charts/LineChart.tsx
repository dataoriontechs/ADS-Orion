"use client";

import { Line, LineChart as RechartsLineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface LineChartProps {
  data: any[];
  config: ChartConfig;
  dataKey: string;
  categoryKey: string;
}

export function LineChart({ data, config, dataKey, categoryKey }: LineChartProps) {
  return (
    <ChartContainer config={config} className="h-full w-full">
      <RechartsLineChart data={data}>
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
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke="var(--color-primary)"
          strokeWidth={3}
          dot={{ r: 4, fill: "var(--color-primary)", strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
      </RechartsLineChart>
    </ChartContainer>
  );
}
