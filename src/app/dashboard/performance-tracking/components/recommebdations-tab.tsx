"use client"

import { motion } from "framer-motion"
import { AlertTriangle, BookOpen, CheckCircle2, TrendingUp, Zap } from "lucide-react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

import { MasteryBadge } from "./mastery-badge"
import NextTaskCTA from "../next-task-cta"

import type { TopicMasteryMetrics } from "../types"

interface RecommendationsTabProps {
  userWeakSubjects: {
    subjectName: string
    subsectionName: string
    accuracy: number
    totalQuestions: number
  }[]
  topicMasteryData: TopicMasteryMetrics | null
  loading: {
    performance: boolean
    stats: boolean
    comparative: boolean
    topicMastery: boolean
  }
}

export default function RecommendationsTab({ userWeakSubjects, topicMasteryData, loading }: RecommendationsTabProps) {
  const router = useRouter()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="lg:col-span-3"
      >
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Personalized Study Recommendations
            </CardTitle>
            <CardDescription>Based on your performance data, we recommend focusing on these areas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userWeakSubjects.length > 0 ? (
                userWeakSubjects.slice(0, 6).map((subject, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{subject.subjectName}</h3>
                          {subject.subsectionName && (
                            <Badge
                              variant="outline"
                              className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs"
                            >
                              Topic
                            </Badge>
                          )}
                        </div>
                        {subject.subsectionName && (
                          <p className="text-sm font-medium text-muted-foreground mt-1">{subject.subsectionName}</p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          {subject.accuracy < 30
                            ? "Needs significant improvement. Focus on fundamentals."
                            : subject.accuracy < 50
                              ? "Requires more practice and review of core concepts."
                              : "Continue practicing to strengthen your knowledge."}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Current Mastery</span>
                        <span>{subject.accuracy.toFixed(1)}%</span>
                      </div>
                      <Progress
                        value={subject.accuracy}
                        className={`h-2 ${
                          subject.accuracy >= 70
                            ? "bg-green-500"
                            : subject.accuracy >= 50
                              ? "bg-yellow-500"
                              : subject.accuracy >= 30
                                ? "bg-orange-500"
                                : "bg-red-500"
                        }`}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Based on {subject.totalQuestions} questions</p>
                    </div>
                    <Button
                      onClick={() => router.push("/dashboard/courses")}
                      variant="ghost"
                      size="sm"
                      className="w-full mt-3"
                    >
                      Study This Topic
                    </Button>
                  </motion.div>
                ))
              ) : loading.performance || loading.stats ? (
                // Show skeleton loaders while loading
                Array(6)
                  .fill(0)
                  .map((_, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-5/6" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between mb-1">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-8" />
                        </div>
                        <Skeleton className="h-2 w-full" />
                      </div>
                      <div className="mt-3">
                        <Skeleton className="h-8 w-full rounded-md" />
                      </div>
                    </div>
                  ))
              ) : (
                // No weak subjects found
                <div className="col-span-full flex flex-col items-center justify-center py-6">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">No weak areas identified yet</h3>
                  <p className="text-sm text-muted-foreground text-center mt-1">
                    Take more tests to help us identify areas where you need improvement.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 lg:col-span-3">
        <NextTaskCTA
          weakestTopics={topicMasteryData?.weakestTopics || []}
          variant="card"
          onStartStudy={(topicName) => {
            toast.success(`Starting study session for: ${topicName}`)
            // In a real app, this would navigate to the study page for this topic
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-medium text-lg">Your Progress</h3>
              <p className="text-sm text-muted-foreground mb-3">
                You&apos;ve made significant progress in these areas:
              </p>
              <div className="space-y-2">
                {topicMasteryData?.strongestTopics.slice(0, 2).map((topic, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{topic.name}</span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Mastery</span>
                        <span>{topic.masteryScore}%</span>
                      </div>
                      <Progress value={topic.masteryScore} className="bg-green-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Improvement Areas
            </CardTitle>
            <CardDescription>Topics where you&apos;ve shown the most improvement</CardDescription>
          </CardHeader>
          <CardContent>
            {topicMasteryData?.topics
              .filter((topic) => topic.attempts > 3)
              .sort((a, b) => b.masteryScore - a.masteryScore)
              .slice(0, 5)
              .map((topic, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium">{topic.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {topic.correct} correct of {topic.attempts} attempts
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  >
                    {topic.masteryScore}%
                  </Badge>
                </motion.div>
              ))}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Focus Areas
            </CardTitle>
            <CardDescription>Topics that need immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            {topicMasteryData?.weakestTopics
              .filter((topic) => topic.masteryScore < 50)
              .map((topic, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-medium">{topic.name}</p>
                      <MasteryBadge level={topic.masteryLevel} />
                    </div>
                  </div>
                </motion.div>
              ))}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="lg:col-span-3"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Recommended Study Plan
            </CardTitle>
            <CardDescription>A personalized study plan based on your performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-medium text-lg mb-2">This Week&apos;s Focus</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topicMasteryData?.weakestTopics.slice(0, 3).map((topic, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                      className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-muted"
                    >
                      <h4 className="font-medium">{topic.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Focus on building fundamentals and practice questions
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <MasteryBadge level={topic.masteryLevel} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted"></div>
                <div className="space-y-6 pl-10">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="absolute -left-1 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-medium">1</span>
                      </div>
                      <h3 className="font-medium">Short-term Goals (1-2 weeks)</h3>
                    </div>
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                      <li>
                        Focus on your weakest topics: {topicMasteryData?.weakestTopics[0]?.name || "N/A"} and{" "}
                        {topicMasteryData?.weakestTopics[1]?.name || "N/A"}
                      </li>
                      <li>Complete at least 3 practice tests with focused review of incorrect answers</li>
                      <li>Aim to improve your average accuracy by 5%</li>
                    </ul>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="absolute -left-1 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-medium">2</span>
                      </div>
                      <h3 className="font-medium">Mid-term Goals (1 month)</h3>
                    </div>
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                      <li>Achieve at least Intermediate mastery in all started topics</li>
                      <li>Improve time efficiency by 15% on question answering</li>
                      <li>Complete all active quests in your curriculum</li>
                    </ul>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="absolute -left-1 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-medium">3</span>
                      </div>
                      <h3 className="font-medium">Long-term Goals (3 months)</h3>
                    </div>
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                      <li>Achieve Advanced or Expert mastery in at least 50% of topics</li>
                      <li>Reach the 80th percentile in overall performance</li>
                      <li>Complete comprehensive review of all subject areas</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
