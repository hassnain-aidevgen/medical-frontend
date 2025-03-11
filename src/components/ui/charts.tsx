"use client"
import { BarChartIcon, LineChartIcon, PieChartIcon } from "lucide-react"

interface ChartProps {
    data: any[]
    index: string
    categories: string[]
    colors?: string[]
    valueFormatter?: (value: number) => string
    className?: string
}

export function BarChart({ data, index, categories, colors = ["primary"], valueFormatter, className }: ChartProps) {
    // This is a mock component - in a real implementation, you would use a charting library
    return (
        <div className={`w-full h-full flex items-center justify-center ${className}`}>
            <div className="text-center">
                <BarChartIcon className="h-16 w-16 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">Bar Chart Visualization</p>
                <p className="text-xs text-muted-foreground/70">
                    {data.length} data points across {categories.length} categories
                </p>
            </div>
        </div>
    )
}

export function LineChart({ data, index, categories, colors = ["primary"], valueFormatter, className }: ChartProps) {
    // This is a mock component - in a real implementation, you would use a charting library
    return (
        <div className={`w-full h-full flex items-center justify-center ${className}`}>
            <div className="text-center">
                <LineChartIcon className="h-16 w-16 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">Line Chart Visualization</p>
                <p className="text-xs text-muted-foreground/70">
                    {data.length} data points across {categories.length} categories
                </p>
            </div>
        </div>
    )
}

export function PieChart({ data, index, categories, colors = ["primary"], valueFormatter, className }: ChartProps) {
    // This is a mock component - in a real implementation, you would use a charting library
    return (
        <div className={`w-full h-full flex items-center justify-center ${className}`}>
            <div className="text-center">
                <PieChartIcon className="h-16 w-16 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">Pie Chart Visualization</p>
                <p className="text-xs text-muted-foreground/70">{data.length} data points</p>
            </div>
        </div>
    )
}

export function DonutChart({ data, index, categories, colors = ["primary"], valueFormatter, className }: ChartProps) {
    // This is a mock component - in a real implementation, you would use a charting library
    return (
        <div className={`w-full h-full flex items-center justify-center ${className}`}>
            <div className="text-center">
                <div className="relative h-16 w-16 mx-auto">
                    <PieChartIcon className="h-16 w-16 text-muted-foreground/50" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-8 w-8 rounded-full bg-background"></div>
                    </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Donut Chart Visualization</p>
                <p className="text-xs text-muted-foreground/70">{data.length} data points</p>
            </div>
        </div>
    )
}

