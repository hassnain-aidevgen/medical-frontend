"use client"

import { Cell, Pie, PieChart, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"

interface RechartsComponentsProps {
  pieData: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  chartData: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  overallAlignment: number;
}

export default function RechartsComponents({ pieData, chartData, overallAlignment }: RechartsComponentsProps) {
  return (
    <>
      <div className="flex justify-center mb-4">
        <div className="relative w-32 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={48}
                paddingAngle={0}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-2xl font-bold">{Math.round(overallAlignment)}%</span>
            <span className="text-xs text-muted-foreground">Score</span>
          </div>
        </div>
      </div>
      
      <div className="h-[200px] mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart 
            cx="50%" 
            cy="50%" 
            innerRadius="20%" 
            outerRadius="90%" 
            barSize={10} 
            data={chartData}
            startAngle={180}
            endAngle={-180}
          >
            <RadialBar
              background
              dataKey="value"
              label={{ position: 'insideStart', fill: '#888', fontSize: 10 }}
            />
            <RechartsTooltip
              formatter={(value) => [`${Math.round(value as number)}%`, "Score"]}
              labelFormatter={(label) => `${label}`}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}