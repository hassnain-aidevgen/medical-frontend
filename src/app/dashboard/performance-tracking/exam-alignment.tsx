"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle2, FileText, GraduationCap, Info, Loader2, Target } from "lucide-react"
import { useEffect, useState } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"

// Define a constant for client-side check to prevent hydration issues
const isClient = typeof window !== "undefined"

interface TopicMasteryMetrics {
  topics: any[]
  systems: any[]
  subtopics: any[]
  weakestTopics: any[]
  strongestTopics: any[]
  overallMastery: {
    averageScore: number
    topicsStarted: number
    topicsAtExpert: number
    topicsNeedingWork: number
  }
}

interface UserExamData {
  examType: string
  totalTests: number
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  averageScore: number
  highestScore: number
  lastTestDate: string
}

interface ExamAlignmentProps {
  topicMasteryData: TopicMasteryMetrics | null
  targetExam?: string | null
  isLoading?: boolean
  className?: string
}

// Map API exam types to display names
const examTypeMap: { [key: string]: string } = {
  USMLE_STEP1: "USMLE Step 1",
  USMLE_STEP2: "USMLE Step 2 CK",
  USMLE_STEP3: "USMLE Step 3",
  NEET: "NEET",
  PLAB: "PLAB 1",
  MCAT: "MCAT",
  NCLEX: "NCLEX",
  COMLEX: "COMLEX",
  ENARE: "ENARE",
  MCCQE: "MCCQE Part I",
  General: "All Target Exams",
}

export default function ExamAlignment({
  // topicMasteryData,
  // targetExam = null,
  isLoading = false,
  className = "",
}: ExamAlignmentProps) {
  const [userExamData, setUserExamData] = useState<UserExamData[]>([])
  const [selectedExamType, setSelectedExamType] = useState<string | null>(null)
  const [currentExamData, setCurrentExamData] = useState<UserExamData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchAttempted, setFetchAttempted] = useState<boolean>(false)

  // Fetch user exam data from API
  useEffect(() => {
    // Only run on client and only once
    if (!isClient || fetchAttempted) return

    const fetchUserExamData = async () => {
      setLoading(true)
      setError(null)
      setFetchAttempted(true)

      try {
        const userId = localStorage.getItem("Medical_User_Id")
        if (!userId) {
          console.error("No user ID found")
          setLoading(false)
          return
        }

        // Use localhost since the route is not yet deployed
        const baseUrl = "https://medical-backend-loj4.onrender.com"

        try {
          // Use the native fetch API to avoid NextAuth issues
          const response = await fetch(`${baseUrl}/api/test/user-exam-stats/${userId}`, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            // Don't send credentials/cookies to avoid NextAuth conflicts
            credentials: "omit",
          })

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
          }

          const data = await response.json()

          if (data && Array.isArray(data)) {
            setUserExamData(data)

            // Set default selected exam type if available
            if (data.length > 0) {
              const defaultExamType = data[0].examType
              setSelectedExamType(defaultExamType)
              setCurrentExamData(data[0])
            }
          }
        } catch (error) {
          console.error("Error fetching user exam data:", error)
          setError("Failed to load exam data. Please check your connection to the backend server.")
        }
      } catch (error) {
        console.error("Error in fetchUserExamData:", error)
        setError("Failed to load exam data")
      } finally {
        setLoading(false)
      }
    }

    fetchUserExamData()
  }, [fetchAttempted])

  // Update current exam data when selection changes
  useEffect(() => {
    if (!isClient || !selectedExamType || userExamData.length === 0) return

    const examData = userExamData.find((data) => data.examType === selectedExamType)
    if (examData) {
      setCurrentExamData(examData)
    }
  }, [selectedExamType, userExamData])

  // Format date safely to prevent hydration errors
  const formatDate = (dateString: string) => {
    if (!isClient) return "Loading..." // Return placeholder during SSR

    try {
      // Use a consistent date format that won't change based on locale
      const date = new Date(dateString)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    } catch {
      return "Invalid date"
    }
  }

  // Get status based on score
  const getScoreStatus = (score: number) => {
    if (score >= 90) return "excellent"
    if (score >= 75) return "good"
    if (score >= 60) return "needs-work"
    return "critical"
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-green-600 dark:text-green-400"
      case "good":
        return "text-blue-600 dark:text-blue-400"
      case "needs-work":
        return "text-yellow-600 dark:text-yellow-400"
      case "critical":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-muted-foreground"
    }
  }

  // Get status background color
  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-100 dark:bg-green-900/20"
      case "good":
        return "bg-blue-100 dark:bg-blue-900/20"
      case "needs-work":
        return "bg-yellow-100 dark:bg-yellow-900/20"
      case "critical":
        return "bg-red-100 dark:bg-red-900/20"
      default:
        return "bg-muted"
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return <CheckCircle2 className="h-4 w-4" />
      case "good":
        return <CheckCircle2 className="h-4 w-4" />
      case "needs-work":
        return <AlertTriangle className="h-4 w-4" />
      case "critical":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  // Get status message based on score
  const getStatusMessage = (score: number) => {
    const status = getScoreStatus(score)
    switch (status) {
      case "excellent":
        return "Your performance is excellent! Keep up the good work."
      case "good":
        return "You're doing well. Continue focusing on your studies."
      case "needs-work":
        return "You need more focused preparation in several key areas."
      case "critical":
        return "Significant improvement needed. Consider a structured study plan."
      default:
        return "Start preparing for your target exam by focusing on high-yield topics."
    }
  }

  // Prepare data for the pie chart
  const getPieData = (score: number) => [
    { name: "Score", value: score, fill: "#3b82f6" },
    { name: "Gap", value: 100 - score, fill: "#e5e7eb" },
  ]

  if (isLoading || loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Exam Performance</CardTitle>
          <CardDescription>Loading your exam data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Exam Performance</CardTitle>
          <CardDescription>There was a problem loading your data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px] text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-500 mb-2">{error}</p>
            <Button
              onClick={() => {
                setFetchAttempted(false)
                setError(null)
              }}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (userExamData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Exam Performance</CardTitle>
          <CardDescription>Track your performance on medical exams</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px] text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No exam data available</p>
            <p className="text-sm text-muted-foreground max-w-md">
              Complete more tests to see your exam performance statistics
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Exam Performance
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-sm">
                      <p>
                        This shows your performance on different medical exams. Higher scores indicate better
                        preparation.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>Track your performance on medical exams</CardDescription>
            </div>
            <Select value={selectedExamType || undefined} onValueChange={setSelectedExamType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select exam" />
              </SelectTrigger>
              <SelectContent>
                {userExamData.map((exam) => (
                  <SelectItem key={exam.examType} value={exam.examType}>
                    {examTypeMap[exam.examType] || exam.examType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {currentExamData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Score Overview */}
              <div className="md:col-span-1">
                <div className="bg-muted/30 p-4 rounded-lg h-full">
                  <h3 className="text-sm font-medium mb-4">Score Overview</h3>

                  <div className="flex justify-center mb-4">
                    <div className="relative w-32 h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getPieData(currentExamData.averageScore)}
                            cx="50%"
                            cy="50%"
                            innerRadius={36}
                            outerRadius={48}
                            paddingAngle={0}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {getPieData(currentExamData.averageScore).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-2xl font-bold">{Math.round(currentExamData.averageScore)}%</span>
                        <span className="text-xs text-muted-foreground">Average</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-lg ${getStatusBgColor(getScoreStatus(currentExamData.averageScore))} mb-4`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={getStatusColor(getScoreStatus(currentExamData.averageScore))}>
                        {getStatusIcon(getScoreStatus(currentExamData.averageScore))}
                      </span>
                      <span
                        className={`text-sm font-medium ${getStatusColor(getScoreStatus(currentExamData.averageScore))}`}
                      >
                        {getScoreStatus(currentExamData.averageScore) === "excellent"
                          ? "Excellent"
                          : getScoreStatus(currentExamData.averageScore) === "good"
                            ? "Good Progress"
                            : getScoreStatus(currentExamData.averageScore) === "needs-work"
                              ? "Needs Work"
                              : "Needs Significant Work"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{getStatusMessage(currentExamData.averageScore)}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {examTypeMap[currentExamData.examType] || currentExamData.examType}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your performance statistics for{" "}
                      {examTypeMap[currentExamData.examType] || currentExamData.examType}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="md:col-span-2">
                <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 h-full">
                  <h3 className="text-sm font-medium mb-4">Detailed Statistics</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <h4 className="text-xs text-muted-foreground mb-1">Total Tests Taken</h4>
                      <p className="text-xl font-bold">{currentExamData.totalTests}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <h4 className="text-xs text-muted-foreground mb-1">Total Questions</h4>
                      <p className="text-xl font-bold">{currentExamData.totalQuestions}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <h4 className="text-xs text-muted-foreground mb-1">Correct Answers</h4>
                      <p className="text-xl font-bold">{currentExamData.correctAnswers}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <h4 className="text-xs text-muted-foreground mb-1">Incorrect Answers</h4>
                      <p className="text-xl font-bold">{currentExamData.incorrectAnswers}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-sm font-medium">Average Score</h4>
                        <span className="text-sm font-medium">{currentExamData.averageScore}%</span>
                      </div>
                      <Progress
                        value={currentExamData.averageScore}
                        className={
                          getScoreStatus(currentExamData.averageScore) === "excellent"
                            ? "bg-green-500"
                            : getScoreStatus(currentExamData.averageScore) === "good"
                              ? "bg-blue-500"
                              : getScoreStatus(currentExamData.averageScore) === "needs-work"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                        }
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-sm font-medium">Highest Score</h4>
                        <span className="text-sm font-medium">{currentExamData.highestScore}%</span>
                      </div>
                      <Progress
                        value={currentExamData.highestScore}
                        className={
                          getScoreStatus(currentExamData.highestScore) === "excellent"
                            ? "bg-green-500"
                            : getScoreStatus(currentExamData.highestScore) === "good"
                              ? "bg-blue-500"
                              : getScoreStatus(currentExamData.highestScore) === "needs-work"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                        }
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-sm font-medium">Accuracy Rate</h4>
                        <span className="text-sm font-medium">
                          {currentExamData.totalQuestions > 0
                            ? Math.round((currentExamData.correctAnswers / currentExamData.totalQuestions) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          currentExamData.totalQuestions > 0
                            ? Math.round((currentExamData.correctAnswers / currentExamData.totalQuestions) * 100)
                            : 0
                        }
                        className={
                          getScoreStatus(
                            currentExamData.totalQuestions > 0
                              ? Math.round((currentExamData.correctAnswers / currentExamData.totalQuestions) * 100)
                              : 0,
                          ) === "excellent"
                            ? "bg-green-500"
                            : getScoreStatus(
                                  currentExamData.totalQuestions > 0
                                    ? Math.round(
                                        (currentExamData.correctAnswers / currentExamData.totalQuestions) * 100,
                                      )
                                    : 0,
                                ) === "good"
                              ? "bg-blue-500"
                              : getScoreStatus(
                                    currentExamData.totalQuestions > 0
                                      ? Math.round(
                                          (currentExamData.correctAnswers / currentExamData.totalQuestions) * 100,
                                        )
                                      : 0,
                                  ) === "needs-work"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                        }
                      />
                    </div>
                  </div>

                  {currentExamData.lastTestDate && (
                    <div className="mt-4 pt-4 border-t border-muted">
                      <p className="text-sm text-muted-foreground">
                        Last test taken: <span className="font-medium">{formatDate(currentExamData.lastTestDate)}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-center">
              <p className="text-muted-foreground">Select an exam to view your performance</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
