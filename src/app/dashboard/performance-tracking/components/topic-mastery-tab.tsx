"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { AlertTriangle, Award, Brain, BookOpen } from "lucide-react"
import toast from "react-hot-toast"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { StatCard } from "./stat-card"
import { MasteryBadge } from "./mastery-badge"
import NextTaskCTA from "../next-task-cta"
import ExamAlignment from "../exam-alignment"

import type { TopicMasteryMetrics } from "../types"

interface TopicMasteryTabProps {
  topicMasteryData: TopicMasteryMetrics | null
  loading: {
    performance: boolean
    stats: boolean
    comparative: boolean
    topicMastery: boolean
  }
  targetExam: string | null
  formatTime: (seconds: number) => string
}

export default function TopicMasteryTab({ topicMasteryData, loading, targetExam, formatTime }: TopicMasteryTabProps) {
  const [selectedSystem, setSelectedSystem] = useState("all")

  const topicMasteryChartData =
    topicMasteryData?.topics
      .map((topic) => ({
        name: topic.name,
        score: topic.masteryScore,
        level: topic.masteryLevel,
        attempts: topic.attempts,
      }))
      .filter((topic) => topic.attempts > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) || []

  const systemMasteryData =
    topicMasteryData?.systems.map((system) => ({
      subject: system.name,
      score: system.masteryScore,
      fullMark: 100,
    })) || []

  const filteredTopics =
    selectedSystem === "all"
      ? topicMasteryData?.topics || []
      : (topicMasteryData?.topics || []).filter((topic) =>
          topicMasteryData?.subtopics.some(
            (subtopic) =>
              subtopic.parentTopic === topic.name && subtopic.name.toLowerCase().includes(selectedSystem.toLowerCase()),
          ),
        )

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Brain className="h-6 w-6 text-white" />}
          title="Overall Mastery"
          value={`${topicMasteryData?.overallMastery.averageScore || 0}%`}
          subtitle="Average across all topics"
          color="indigo"
        />

        <StatCard
          icon={<Award className="h-6 w-6 text-white" />}
          title="Expert Topics"
          value={topicMasteryData?.overallMastery.topicsAtExpert || 0}
          subtitle={`of ${topicMasteryData?.topics.length || 0} total topics`}
          color="green"
        />

        <StatCard
          icon={<AlertTriangle className="h-6 w-6 text-white" />}
          title="Topics Needing Work"
          value={topicMasteryData?.overallMastery.topicsNeedingWork || 0}
          subtitle="Below 50% mastery"
          color="red"
        />

        <StatCard
          icon={<BookOpen className="h-6 w-6 text-white" />}
          title="Topics Started"
          value={topicMasteryData?.overallMastery.topicsStarted || 0}
          subtitle={`${(((topicMasteryData?.overallMastery.topicsStarted || 0) / (topicMasteryData?.topics.length || 1)) * 100).toFixed(0)}% of curriculum`}
          color="blue"
        />
      </div>

      {/* Next Task CTA Component */}
      <NextTaskCTA
        weakestTopics={topicMasteryData?.weakestTopics || []}
        className="mb-6"
        onStartStudy={(topicName) => {
          toast.success(`Starting study session for: ${topicName}`)
          // In a real app, this would navigate to the study page for this topic
        }}
      />

      {/* Exam Alignment Component */}
      <ExamAlignment
        topicMasteryData={topicMasteryData}
        targetExam={targetExam}
        isLoading={loading.topicMastery}
        className="mb-6"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Top Topics by Mastery</CardTitle>
                  <CardDescription>Your strongest subject areas</CardDescription>
                </div>
                <Select defaultValue="all" onValueChange={setSelectedSystem}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by system" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Systems</SelectItem>
                    {topicMasteryData?.systems.map((system, index) => (
                      <SelectItem key={index} value={system.name.toLowerCase()}>
                        {system.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicMasteryChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={(value) => [`${value}`, "Mastery Score"]}
                      labelFormatter={(label) => `Topic: ${label}`}
                    />
                    <Bar dataKey="score" fill="var(--primary)" radius={[4, 4, 0, 0]} animationDuration={1500}>
                      {topicMasteryChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.level === "Expert"
                              ? "#10b981"
                              : entry.level === "Advanced"
                                ? "#3b82f6"
                                : entry.level === "Intermediate"
                                  ? "#f59e0b"
                                  : entry.level === "Beginner"
                                    ? "#ef4444"
                                    : "#6b7280"
                          }
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
              <CardTitle>System Mastery</CardTitle>
              <CardDescription>Your mastery across body systems</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius={90} data={systemMasteryData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Mastery Score"
                      dataKey="score"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                      animationDuration={1500}
                    />
                    <Tooltip />
                  </RadarChart>
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
            <CardTitle>Topic Mastery Details</CardTitle>
            <CardDescription>Detailed breakdown of your topic mastery</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {filteredTopics
                  .filter((topic) => topic.attempts > 0)
                  .map((topic, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      className="bg-muted/30 p-4 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{topic.name}</h3>
                            {topic.isQuestPriority && (
                              <div className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded">
                                Quest Priority
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <MasteryBadge level={topic.masteryLevel} />
                            <span className="text-sm text-muted-foreground">
                              {topic.attempts} attempts • {formatTime(topic.averageTime)} avg. time
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold">{topic.masteryScore}%</span>
                        </div>
                      </div>
                      <Progress
                        value={topic.masteryScore}
                        className={
                          topic.masteryLevel === "Expert"
                            ? "bg-green-500"
                            : topic.masteryLevel === "Advanced"
                              ? "bg-blue-500"
                              : topic.masteryLevel === "Intermediate"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                        }
                      />
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>Correct: {topic.correct}</span>
                        <span>Incorrect: {topic.incorrect}</span>
                        <span>
                          Last attempt:{" "}
                          {topic.lastAttemptDate ? new Date(topic.lastAttemptDate).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                    </motion.div>
                  ))}

                {filteredTopics.filter((topic) => topic.attempts > 0).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No topic data available for the selected filter.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}
