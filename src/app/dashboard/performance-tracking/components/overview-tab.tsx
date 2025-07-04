"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Activity, BarChart2, BookOpen, ChevronRight, Clock, Lightbulb, Target, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

import { StatCard } from "./stat-card"
import HistoryTimeline from "../history-timeline"
import StreakTracker from "../streak-tracker"
import FlashcardSuggestions from "../flashcard-suggestions"
import ExamAlignment from "../exam-alignment"
import ExamCoverageReport from "@/app/dashboard/performance-tracking/components/ExamCoverageReport"

import type { StatsData, TestResult, ComparativeAnalytics, TopicMasteryMetrics } from "../types"

interface OverviewTabProps {
  statsData: StatsData | null
  performanceData: TestResult[]
  comparativeData: ComparativeAnalytics | null
  topicMasteryData: TopicMasteryMetrics | null
  loading: {
    performance: boolean
    stats: boolean
    comparative: boolean
    topicMastery: boolean
  }
  error?: {
    performance: string | null
    stats: string | null
    comparative: string | null
    topicMastery: string | null
  }
  viewAllTests: boolean
  setViewAllTests: (value: boolean) => void
  viewAllQuestions: boolean
  setViewAllQuestions: (value: boolean) => void
  selectedTestIndex: number | null
  setSelectedTestIndex: (value: number | null) => void
  formatDate: (dateString: string) => string
  formatTime: (seconds: number) => string
  targetExam: string | null
}

export default function OverviewTab({
  statsData,
  performanceData,
  comparativeData,
  topicMasteryData,
  loading,
  error,
  viewAllTests,
  setViewAllTests,
  viewAllQuestions,
  setViewAllQuestions,
  selectedTestIndex,
  setSelectedTestIndex,
  formatDate,
  formatTime,
  targetExam,
}: OverviewTabProps) {
  const [chartType, setChartType] = useState("bar")
  const router = useRouter()

  // Prepare chart data with error handling
  const accuracyChartData = performanceData.map((test, index) => ({
    name: `Test ${index + 1}`,
    accuracy: test.percentage,
    date: formatDate(test.createdAt),
  }))

  // Render the subject performance chart with proper error handling
  const renderSubjectPerformanceChart = () => {
    // Check if we have valid data
    if (!comparativeData || 
        !comparativeData.userPerformance || 
        !comparativeData.userPerformance.subjectPerformance ||
        !Array.isArray(comparativeData.userPerformance.subjectPerformance) ||
        comparativeData.userPerformance.subjectPerformance.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center">
          <p className="text-muted-foreground">No subject data available</p>
          {error?.comparative && (
            <p className="text-sm text-red-500 mt-2">{error.comparative}</p>
          )}
        </div>
      );
    }
    
    // Safe data processing
    const safeSubjectData = comparativeData.userPerformance.subjectPerformance
      .filter(subject => subject && typeof subject === 'object')
      .map(subject => ({
        name: subject.name || "Unknown Subject",
        accuracy: typeof subject.percentage === 'number' ? subject.percentage : 0,
        questions: typeof subject.total === 'number' ? subject.total : 0
      }));
    
    if (safeSubjectData.length === 0) {
      return (
        <div className="h-full flex items-center justify-center">
          <p className="text-muted-foreground">No valid subject data available</p>
        </div>
      );
    }
    
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={safeSubjectData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="accuracy"
            nameKey="name"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            animationDuration={1500}
          >
            {safeSubjectData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value}%`, "Accuracy"]} />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Safe best subject getter
  const getBestSubject = () => {
    if (!comparativeData?.userPerformance?.subjectPerformance?.length) return "N/A";
    
    try {
      const sortedSubjects = [...comparativeData.userPerformance.subjectPerformance]
        .sort((a, b) => (b?.percentage || 0) - (a?.percentage || 0));
      
      return sortedSubjects[0]?.name || "N/A";
    } catch (err) {
      console.error("Error getting best subject:", err);
      return "N/A";
    }
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#8dd1e1"]

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Target className="h-6 w-6 text-white" />}
          title="Total Questions"
          value={statsData?.totalQuestionsAttempted || 0}
          subtitle={`${statsData?.totalQuestionsCorrect || 0} correct / ${statsData?.totalQuestionsWrong || 0} wrong`}
          color="blue"
        />

        <StatCard
          icon={<Clock className="h-6 w-6 text-white" />}
          title="Total Study Hours"
          value={(performanceData.reduce((sum, item) => sum + item.totalTime, 0) / 3600).toFixed(3)}
          subtitle={`Avg ${statsData?.avgTimePerTest.toFixed(1) || 0} min/test`}
          color="green"
        />

        <StatCard
          icon={<TrendingUp className="h-6 w-6 text-white" />}
          title="Progress Rate"
          value={`${
            performanceData.length > 1
              ? (performanceData[performanceData.length - 1].percentage - performanceData[0].percentage).toFixed(3)
              : "0.0"
          }%`}
          subtitle={`${comparativeData?.userPerformance?.overallPercentile || 0}th percentile`}
          color="purple"
        />

        <StatCard
          icon={<BookOpen className="h-6 w-6 text-white" />}
          title="Tests Taken"
          value={statsData?.totalTestsTaken || 0}
          subtitle={`${topicMasteryData?.overallMastery?.topicsStarted || 0} topics explored`}
          color="amber"
        />
      </div>

      {/* Streak Tracker Component */}
      <StreakTracker
        userId={localStorage.getItem("Medical_User_Id") || ""}
        performanceData={performanceData}
        isLoading={loading.performance}
      />

      {/* History Timeline Component */}
      <HistoryTimeline performanceData={performanceData} isLoading={loading.performance} />

      {/* Exam Alignment Component */}
      <ExamAlignment
        topicMasteryData={topicMasteryData}
        targetExam={targetExam}
        isLoading={loading.topicMastery}
        className="mb-6"
      />

      {/* Exam Coverage Report Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card>
          <CardContent>
            <ExamCoverageReport />
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Performance Trend</CardTitle>
                  <CardDescription>Your accuracy over time</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={chartType === "bar" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartType("bar")}
                  >
                    <BarChart2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={chartType === "line" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartType("line")}
                  >
                    <Activity className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {performanceData.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No performance data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "bar" ? (
                      <BarChart data={accuracyChartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip
                          formatter={(value) => [`${value}%`, "Accuracy"]}
                          labelFormatter={(label) => `${label}`}
                        />
                        <Bar dataKey="accuracy" fill="var(--primary)" radius={[4, 4, 0, 0]} animationDuration={1500}>
                          {accuracyChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(${210 + index * 10}, 80%, 55%)`} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      <LineChart data={accuracyChartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip
                          formatter={(value) => [`${value}%`, "Accuracy"]}
                          labelFormatter={(label) => `${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="accuracy"
                          stroke="#555"
                          strokeWidth={3}
                          dot={{ r: 6, strokeWidth: 2 }}
                          activeDot={{ r: 8 }}
                          animationDuration={1500}
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 px-6 py-3">
              <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                <div>
                  Latest:{" "}
                  <span className="font-medium text-foreground">
                    {performanceData.length > 0 ? `${performanceData[performanceData.length - 1].percentage}%` : "N/A"}
                  </span>
                </div>
                <div>
                  Average:{" "}
                  <span className="font-medium text-foreground">
                    {performanceData.length > 0
                      ? `${(performanceData.reduce((sum, item) => sum + item.percentage, 0) / performanceData.length).toFixed(1)}%`
                      : "N/A"}
                  </span>
                </div>
              </div>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Subject Performance</CardTitle>
              <CardDescription>Your accuracy by subject area</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {loading.comparative ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">Loading subject data...</p>
                  </div>
                ) : (
                  renderSubjectPerformanceChart()
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 px-6 py-3">
              <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                <div>
                  Subjects: <span className="font-medium text-foreground">
                    {comparativeData?.userPerformance?.subjectPerformance?.length || 0}
                  </span>
                </div>
                <div>
                  Best Subject:{" "}
                  <span className="font-medium text-foreground">{getBestSubject()}</span>
                </div>
              </div>
            </CardFooter>
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Tests</CardTitle>
                <CardDescription>Your most recent test results</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setViewAllTests(!viewAllTests)}>
                {viewAllTests ? "Show Less" : "View All"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {performanceData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No tests taken yet. Start taking tests to see your results here!
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <Accordion type="single" collapsible className="w-full">
                  {(viewAllTests ? performanceData : performanceData.slice(0, 5)).map((test, index) => (
                    <AccordionItem value={`item-${index}`} key={index} className="border-b">
                      <AccordionTrigger className="py-4 hover:no-underline">
                        <div className="flex justify-between items-center w-full">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium">Test {performanceData.length - index}</p>
                              <p className="text-sm text-muted-foreground">{formatDate(test.createdAt)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-medium">{test.percentage}%</p>
                              <p className="text-sm text-muted-foreground">
                                Score: {test.score}/{test.questions.length}
                              </p>
                            </div>
                            <div
                              className={`w-2 h-10 rounded-full ${test.percentage >= 70 ? "bg-green-500" : test.percentage >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                            ></div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="mt-2 bg-muted/30 p-4 rounded-md">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-background p-3 rounded-md">
                              <p className="text-sm text-muted-foreground">Total Time</p>
                              <p className="font-medium">{formatTime(test.totalTime)}</p>
                            </div>
                            <div className="bg-background p-3 rounded-md">
                              <p className="text-sm text-muted-foreground">Avg. Time per Question</p>
                              <p className="font-medium">{formatTime(test.totalTime / test.questions.length)}</p>
                            </div>
                            <div className="bg-background p-3 rounded-md">
                              <p className="text-sm text-muted-foreground">Date Taken</p>
                              <p className="font-medium">{formatDate(test.createdAt)}</p>
                            </div>
                          </div>

                          <h3 className="font-semibold mt-4 mb-2">Questions:</h3>
                          <div className="space-y-3">
                            {(viewAllQuestions && selectedTestIndex === index
                              ? test.questions
                              : test.questions.slice(0, 3)
                            ).map((q, qIndex) => (
                              <div key={qIndex} className="border-b pb-3">
                                <p className="font-medium">
                                  Q{qIndex + 1}: {q.questionText}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                  <div
                                    className={`p-2 rounded-md ${q.userAnswer === q.correctAnswer ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"}`}
                                  >
                                    <p className="text-sm text-muted-foreground">Your Answer</p>
                                    <p
                                      className={`font-medium ${q.userAnswer === q.correctAnswer ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}
                                    >
                                      {q.userAnswer}
                                    </p>
                                  </div>
                                  <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/20">
                                    <p className="text-sm text-muted-foreground">Correct Answer</p>
                                    <p className="font-medium text-blue-700 dark:text-blue-400">{q.correctAnswer}</p>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                  Time Spent: {formatTime(q.timeSpent)}
                                </p>

                                {/* Add flashcard review link for wrong answers */}
                                {q.userAnswer !== q.correctAnswer && (
                                  <div className="mt-2 p-2 rounded-md bg-amber-100 dark:bg-amber-900/20 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                      <p className="text-sm text-amber-700 dark:text-amber-400">
                                        This question was already added to your flashcards
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900"
                                      onClick={() => {
                                        console.log("Navigating to flashcard review for questionId:", q.questionId)
                                        localStorage.setItem("flashcardTab", "reviews")
                                        localStorage.setItem("flashcardReviewId", q.questionText)
                                        router.push("/dashboard/flash-cards")
                                      }}
                                    >
                                      Review Flashcard
                                      <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                            {test.questions.length > 3 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2"
                                onClick={() => {
                                  setSelectedTestIndex(index)
                                  setViewAllQuestions(!viewAllQuestions)
                                }}
                              >
                                {viewAllQuestions && selectedTestIndex === index
                                  ? "Show Less"
                                  : `View all ${test.questions.length} questions`}{" "}
                                <ChevronRight className="ml-1 h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <FlashcardSuggestions />
      </motion.div>
    </>
  )
}