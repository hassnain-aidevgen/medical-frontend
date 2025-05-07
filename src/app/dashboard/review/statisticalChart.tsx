"use client"

import React from "react"
import { BarChart, LineChart, PieChart } from "lucide-react"
import {
  ResponsiveContainer,
  PieChart as PieChartComponent,
  Pie,
  Cell,
  BarChart as BarChartComponent,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart as LineChartComponent,
  Line
} from "recharts"

interface ChartProps {
  data: {
    type: "pie" | "bar" | "line";
    data: any[];
  };
  height?: number;
  title?: string;
}

export function StatisticalChart({ data, height = 250, title }: ChartProps) {
  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-muted rounded-md p-4">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">No data available to display chart</p>
        </div>
      </div>
    )
  }

  const renderChart = () => {
    switch (data.type) {
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChartComponent>
              <Pie
                data={data.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || getDefaultColors(index)} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, "Value"]} />
              <Legend />
            </PieChartComponent>
          </ResponsiveContainer>
        )

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChartComponent
              data={data.data}
              margin={{
                top: 5,
                right: 20,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Value">
                {data.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || getDefaultColors(index)} />
                ))}
              </Bar>
            </BarChartComponent>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChartComponent
              data={data.data}
              margin={{
                top: 5,
                right: 20,
                left: 20,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 1]} tickFormatter={(tick) => `${(tick * 100).toFixed(0)}%`} />
              <Tooltip formatter={(value) => (typeof value === "number" ? [`${(value * 100).toFixed(0)}%`, "Score"] : ["N/A", "Score"])} />
              <Legend />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#60a5fa"
                activeDot={{ r: 8 }}
                name="Performance Score"
              />
            </LineChartComponent>
          </ResponsiveContainer>
        )

      default:
        return (
          <div className="flex items-center justify-center h-full w-full bg-muted rounded-md p-4">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Unsupported chart type</p>
            </div>
          </div>
        )
    }
  }

  const getDefaultColors = (index: number) => {
    const colors = ["#60a5fa", "#f87171", "#4ade80", "#facc15", "#c084fc", "#f97316", "#ec4899"]
    return colors[index % colors.length]
  }

  const getChartIcon = () => {
    switch (data.type) {
      case "pie":
        return <PieChart className="h-4 w-4 mr-2" />
      case "line":
        return <LineChart className="h-4 w-4 mr-2" />
      case "bar":
        return <BarChart className="h-4 w-4 mr-2" />
      default:
        return null
    }
  }

  return (
    <div className="w-full">
      {title && (
        <div className="flex items-center mb-2">
          {getChartIcon()}
          <h4 className="text-sm font-medium">{title}</h4>
        </div>
      )}
      <div className="w-full h-full bg-card rounded-md overflow-hidden">
        {renderChart()}
      </div>
    </div>
  )
}

export default StatisticalChart