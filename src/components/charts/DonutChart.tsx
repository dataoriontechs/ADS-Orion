"use client";

import { Cell, Pie, PieChart as RechartsPieChart } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface DonutChartProps {
  data: any[];
  config: ChartConfig;
  nameKey: string;
  dataKey: string;
}

export function DonutChart({ data, config, nameKey, dataKey }: DonutChartProps) {
  return (
    <ChartContainer config={config} className="h-full w-full">
      <RechartsPieChart>
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          stroke="none"
          paddingAngle={5}
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
