"use client"

import { motion } from "framer-motion"
import { Award, Clock, Target, TrendingUp } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

import { StatCard } from "./stat-card"
import type { TestResult, StatsData, ComparativeAnalytics } from "../types"

interface PerformanceTabProps {
  performanceData: TestResult[]
  comparativeData: ComparativeAnalytics | null
  statsData: StatsData | null
  formatTime: (seconds: number) => string
}

export default function PerformanceTab({
  performanceData,
  comparativeData,
  statsData,
  formatTime,
}: PerformanceTabProps) {
  // Prepare chart data
  const subjectPerformanceData =
    comparativeData?.userPerformance.subjectPerformance.map((subject) => ({
      name: subject.name,
      accuracy: subject.percentage,
      questions: subject.total,
    })) || []

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Award className="h-6 w-6 text-white" />}
          title="Percentile Rank"
          value={`${comparativeData?.userPerformance.overallPercentile || 0}%`}
          subtitle="Compared to all users"
          color="indigo"
        />

        <StatCard
          icon={<Clock className="h-6 w-6 text-white" />}
          title="Avg. Time per Question"
          value={formatTime(comparativeData?.userPerformance.averageTimePerQuestion || 0)}
          subtitle="Global avg: 45s"
          color="green"
        />

        <StatCard
          icon={<TrendingUp className="h-6 w-6 text-white" />}
          title="Improvement"
          value={`${comparativeData?.improvement?.percentage || 0}%`}
          subtitle="Since first test"
          color="blue"
        />

        <StatCard
          icon={<Target className="h-6 w-6 text-white" />}
          title="Accuracy"
          value={`${
            performanceData.length > 0
              ? (performanceData.reduce((sum, item) => sum + item.percentage, 0) / performanceData.length).toFixed(1)
              : "0"
          }%`}
          subtitle={`Global avg: ${comparativeData?.globalPerformance.average.percentage || 0}%`}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Subject Performance</CardTitle>
              <CardDescription>Your performance across different subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={subjectPerformanceData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value) => [`${value}%`, "Accuracy"]} />
                    <Bar dataKey="accuracy" fill="var(--primary)" radius={[0, 4, 4, 0]} animationDuration={1500}>
                      {subjectPerformanceData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.accuracy >= 70 ? "#10b981" : entry.accuracy >= 50 ? "#f59e0b" : "#ef4444"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Time Efficiency</CardTitle>
              <CardDescription>Time spent vs. accuracy by test</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={performanceData.map((test, index) => ({
                      name: `Test ${index + 1}`,
                      accuracy: test.percentage,
                      time: test.totalTime / 60, // Convert to minutes
                      date: new Date(test.createdAt).toLocaleDateString(),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="accuracy"
                      name="Accuracy (%)"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="time"
                      name="Time (min)"
                      stroke="#82ca9d"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Subsection Performance</CardTitle>
            <CardDescription>Detailed performance by subsection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comparativeData?.userPerformance.subsectionPerformance.map((subsection, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-muted/30 p-4 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{subsection.name}</h3>
                      <p className="text-sm text-muted-foreground">{subsection.subject}</p>
                    </div>
                    <Badge
                      variant={
                        subsection.percentage >= 70
                          ? "default"
                          : subsection.percentage >= 50
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {subsection.percentage}%
                    </Badge>
                  </div>
                  <Progress
                    value={subsection.percentage}
                    className={`h-2 ${
                      subsection.percentage >= 70
                        ? "bg-green-500"
                        : subsection.percentage >= 50
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>Correct: {subsection.correct}</span>
                    <span>Total: {subsection.total}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}
