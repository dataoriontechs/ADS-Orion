"use client";

import { Cell, Pie, PieChart as RechartsPieChart } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface PieChartProps {
  data: any[];
  config: ChartConfig;
  nameKey: string;
  dataKey: string;
}

export function PieChart({ data, config, nameKey, dataKey }: PieChartProps) {
  return (
    <ChartContainer config={config} className="h-full w-full">
      <RechartsPieChart>
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          outerRadius={80}
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || `hsl(var(--primary))`} />
          ))}
        </Pie>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
      </RechartsPieChart>
    </ChartContainer>
  );
}
