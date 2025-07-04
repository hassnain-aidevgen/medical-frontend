"use client"

import type React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import axios from "axios"
import { motion } from "framer-motion"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart2,
  BookOpen,
  Brain,
  CheckCircle2,
  Download,
  Info,
  MoreHorizontal,
  Share2,
  XCircle,
  Zap,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast, Toaster } from "react-hot-toast"
import { useRouter } from "next/navigation" // ✅ App Router version
import OverviewTab from "./components/overview-tab"
import PerformanceTab from "./components/performance-tab"
import TopicMasteryTab from "./components/topic-mastery-tab"
import RecommendationsTab from "./components/recommebdations-tab"
import ShareReportDialog from "./components/share-report-dialog"

// Types
import type { TestResult, StatsData, ComparativeAnalytics, UserPerformanceData, TopicMasteryMetrics } from "./types"

// Helper functions
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const getMasteryColor = (level: string): string => {
  switch (level) {
    case "Not Started":
      return "bg-gray-200 text-gray-700"
    case "Beginner":
      return "bg-red-100 text-red-700"
    case "Intermediate":
      return "bg-yellow-100 text-yellow-700"
    case "Advanced":
      return "bg-blue-100 text-blue-700"
    case "Expert":
      return "bg-green-100 text-green-700"
    default:
      return "bg-gray-200 text-gray-700"
  }
}

const getMasteryIcon = (level: string) => {
  switch (level) {
    case "Not Started":
      return <AlertTriangle className="h-4 w-4" />
    case "Beginner":
      return <XCircle className="h-4 w-4" />
    case "Intermediate":
      return <Info className="h-4 w-4" />
    case "Advanced":
      return <CheckCircle2 className="h-4 w-4" />
    case "Expert":
      return <Award className="h-4 w-4" />
    default:
      return <Info className="h-4 w-4" />
  }
}

// Custom components
interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: number | string
  subtitle?: string
  color?: "blue" | "green" | "purple" | "amber" | "red" | "indigo"
}

const StatCard = ({ icon, title, value, subtitle, color = "blue" }: StatCardProps) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    amber: "from-amber-500 to-amber-600",
    red: "from-red-500 to-red-600",
    indigo: "from-indigo-500 to-indigo-600",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-xl shadow-lg"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-90`}></div>
      <div className="relative p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs mt-1 opacity-80">{subtitle}</p>}
          </div>
          <div className="p-3 bg-white/20 rounded-lg">{icon}</div>
        </div>
      </div>
    </motion.div>
  )
}

interface MasteryBadgeProps {
  level: string
}

const MasteryBadge = ({ level }: MasteryBadgeProps) => {
  return (
    <Badge variant="outline" className={`${getMasteryColor(level)} flex items-center gap-1 px-2 py-1`}>
      {getMasteryIcon(level)}
      <span>{level}</span>
    </Badge>
  )
}

const LoadingCard = () => (
  <Card>
    <CardHeader className="pb-2">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <Skeleton className="h-[200px] w-full" />
      </div>
    </CardContent>
  </Card>
)

const LoadingStatCard = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-16 mt-2" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    </CardContent>
  </Card>
)

// Main component
export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [performanceData, setPerformanceData] = useState<TestResult[]>([])
  const [statsData, setStatsData] = useState<StatsData | null>(null)
  const [comparativeData, setComparativeData] = useState<ComparativeAnalytics | null>(null)
  const [userPerformanceData, setUserPerformanceData] = useState<UserPerformanceData | null>(null)
  const [userWeakSubjects, setUserWeakSubjects] = useState<
    {
      subjectName: string
      subsectionName: string
      accuracy: number
      totalQuestions: number
    }[]
  >([])
  const [topicMasteryData, setTopicMasteryData] = useState<TopicMasteryMetrics | null>(null)
  const [selectedExamType, setSelectedExamType] = useState("USMLE_STEP1")
  const [loading, setLoading] = useState({
    performance: true,
    stats: true,
    comparative: true,
    topicMastery: true,
  })
  const [error, setError] = useState<{
    performance: string | null
    stats: string | null
    comparative: string | null
    topicMastery: string | null
  }>({
    performance: null,
    stats: null,
    comparative: null,
    topicMastery: null,
  })

  const [chartType, setChartType] = useState("bar")
  const [selectedSystem, setSelectedSystem] = useState("all")
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [shareEmail, setShareEmail] = useState("")
  const [shareNote, setShareNote] = useState("")
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)

  const dashboardRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Add state for managing the view mode for tests and questions
  // Add state for managing the view mode for tests and questions
  const [viewAllTests, setViewAllTests] = useState(false)
  const [viewAllQuestions, setViewAllQuestions] = useState(false)
  const [selectedTestIndex, setSelectedTestIndex] = useState<number | null>(null)
  const [targetExam] = useState<string | null>(null)
  const fetchWeakSubjects = async (userId: string) => {
    try {
      // Fetch performance data from your new endpoint
      const response = await axios.get(`https://medical-backend-3eek.onrender.com/api/performanceTracking/get-performance/${userId}`)

      if (response.data.success && response.data.data) {
        setUserPerformanceData(response.data.data)

        // Process the data to extract weak subjects and subsections
        const weakSubjectsData = []
        const subjects = response.data.data.subjects || []

        // Process each subject
        for (const subject of subjects) {
          let totalCorrect = 0
          let totalIncorrect = 0
          let totalQuestions = 0

          // Calculate subject-level totals from subsections
          subject.subsections.forEach(
            (subsection: {
              performance: { correctCount: number; incorrectCount: number; totalCount: number }
              subsectionName: string
            }) => {
              totalCorrect += subsection.performance.correctCount
              totalIncorrect += subsection.performance.incorrectCount
              totalQuestions += subsection.performance.totalCount
            },
          )

          // Calculate accuracy percentage
          const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0

          // Add subject to weak subjects list if accuracy is below 50% and has at least 3 attempts
          if (accuracy < 50 && totalQuestions >= 3) {
            weakSubjectsData.push({
              subjectName: subject.subjectName,
              subsectionName: "",
              accuracy: accuracy,
              totalQuestions: totalQuestions,
            })
          }

          // Add individual weak subsections (topics)
          subject.subsections.forEach(
            (subsection: {
              performance: { correctCount: number; incorrectCount: number; totalCount: number }
              subsectionName: string
            }) => {
              if (subsection.performance.totalCount >= 2) {
                const subsectionAccuracy =
                  subsection.performance.totalCount > 0
                    ? (subsection.performance.correctCount / subsection.performance.totalCount) * 100
                    : 0

                if (subsectionAccuracy < 50) {
                  weakSubjectsData.push({
                    subjectName: subject.subjectName,
                    subsectionName: subsection.subsectionName,
                    accuracy: subsectionAccuracy,
                    totalQuestions: subsection.performance.totalCount,
                  })
                }
              }
            },
          )
        }

        // Sort by accuracy (ascending)
        weakSubjectsData.sort((a, b) => a.accuracy - b.accuracy)
        setUserWeakSubjects(weakSubjectsData)
      }
    } catch (error) {
      console.error("Error fetching weak subjects:", error)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem("Medical_User_Id")

      if (!userId) {
        setLoading({
          performance: false,
          stats: false,
          comparative: false,
          topicMastery: false,
        })
        return
      }

      // Fetch performance data
      try {
        const performanceResponse = await axios.get(
          "https://medical-backend-3eek.onrender.com/api/performanceTracking/performance2",
          { params: { userId } }
        )
        if (performanceResponse.data.success) {
          setPerformanceData(performanceResponse.data.results)
        } else {
          console.error("Failed to load performance data")
          setError((prev) => ({ ...prev, performance: "Could not load performance data" }))
        }
      } catch (err) {
        console.error("Error fetching performance data:", err)
        setError((prev) => ({ ...prev, performance: "Could not load performance data" }))
      } finally {
        setLoading((prev) => ({ ...prev, performance: false }))
      }

      // Fetch stats data
      try {
        const statsResponse = await axios.get<StatsData>(
          `https://medical-backend-3eek.onrender.com/api/performanceTracking/user/${userId}/stats`
        )
        setStatsData(statsResponse.data)
      } catch (err) {
        console.error("Error fetching stats data:", err)
        setError((prev) => ({ ...prev, stats: "Could not load stats data" }))
      } finally {
        setLoading((prev) => ({ ...prev, stats: false }))
      }

      // Generate local comparative data from test data if API fails
      let localComparativeData: ComparativeAnalytics | null = null;

      // Fetch comparative data with proper error handling and fallback
      try {
        const comparativeResponse = await axios.get<ComparativeAnalytics>(
          `https://medical-backend-3eek.onrender.com/api/performanceTracking/comparative/${userId}`
        )
        setComparativeData(comparativeResponse.data)
      } catch (err) {
        console.error("Error fetching comparative data:", err)

        // Check if we already have performance data to create a local fallback
        if (performanceData.length > 0) {
          try {
            // Create basic comparative data from existing performance data
            localComparativeData = createLocalComparativeData(performanceData);
            setComparativeData(localComparativeData);
            setError((prev) => ({ ...prev, comparative: "Using locally calculated data" }))
          } catch (localErr) {
            console.error("Error creating local comparative data:", localErr);
            setComparativeData(createEmptyComparativeData());
            setError((prev) => ({ ...prev, comparative: "Could not load comparative data" }))
          }
        } else {
          // Use empty data structure
          setComparativeData(createEmptyComparativeData());
          setError((prev) => ({ ...prev, comparative: "Could not load comparative data" }))
        }
      } finally {
        setLoading((prev) => ({ ...prev, comparative: false }))
      }

      // Fetch topic mastery data
      try {
        const topicMasteryResponse = await axios.get<TopicMasteryMetrics>(
          `https://medical-backend-3eek.onrender.com/api/performanceTracking/topic-mastery-v2/${userId}`
        )
        setTopicMasteryData(topicMasteryResponse.data)
      } catch (err) {
        console.error("Error fetching topic mastery data:", err)
        setError((prev) => ({ ...prev, topicMastery: "Could not load topic mastery data" }))
      } finally {
        setLoading((prev) => ({ ...prev, topicMastery: false }))
      }

      // Fetch weak subjects
      try {
        await fetchWeakSubjects(userId)
      } catch (err) {
        console.error("Error fetching weak subjects:", err)
      }

      setShareUrl("")
    }

    fetchData()
  }, [])

  const createLocalComparativeData = (tests: TestResult[]): ComparativeAnalytics => {
    if (!tests.length) return createEmptyComparativeData();

    // Group questions by subject and calculate performance
    const subjectMap: Record<string, { name: string, correct: number, total: number }> = {};
    const topicMap: Record<string, { name: string, correct: number, total: number }> = {};

    // Process all questions from all tests
    tests.forEach(test => {
      test.questions.forEach(q => {
        // Handle subject data
        const subjectName = q.subjectName || "Unknown Subject";
        if (!subjectMap[subjectName]) {
          subjectMap[subjectName] = { name: subjectName, correct: 0, total: 0 };
        }
        subjectMap[subjectName].total++;
        if (q.userAnswer === q.correctAnswer) {
          subjectMap[subjectName].correct++;
        }

        // Handle topic data
        const topicName = q.topic || "Unknown Topic";
        if (!topicMap[topicName]) {
          topicMap[topicName] = { name: topicName, correct: 0, total: 0 };
        }
        topicMap[topicName].total++;
        if (q.userAnswer === q.correctAnswer) {
          topicMap[topicName].correct++;
        }
      });
    });

    // Calculate percentages
    const subjectPerformance = Object.values(subjectMap).map(subject => ({
      name: subject.name,
      correct: subject.correct,
      total: subject.total,
      percentage: Math.round((subject.correct / subject.total) * 100)
    }));

    const topicPerformance = Object.values(topicMap).map(topic => ({
      name: topic.name,
      correct: topic.correct,
      total: topic.total,
      percentage: Math.round((topic.correct / topic.total) * 100)
    }));

    // Calculate overall metrics
    const totalQuestions = tests.reduce((sum, test) => sum + test.questions.length, 0);
    const totalCorrect = tests.reduce((sum, test) => sum + test.score, 0);
    const overallAccuracy = Math.round((totalCorrect / totalQuestions) * 100) || 0;

    // Calculate average time per question
    const totalTime = tests.reduce((sum, test) => sum + test.totalTime, 0);
    const avgTimePerQuestion = Math.round(totalTime / totalQuestions) || 0;

    // Calculate improvement if multiple tests
    let improvement = null;
    if (tests.length > 1) {
      const firstTest = tests[tests.length - 1]; // Oldest test
      const latestTest = tests[0]; // Newest test

      improvement = {
        percentage: latestTest.percentage - firstTest.percentage,
        scoreChange: latestTest.score - firstTest.score,
        timeEfficiency: firstTest.totalTime - latestTest.totalTime
      };
    }

    return {
      userPerformance: {
        subjectPerformance,
        subsectionPerformance: [], // We don't have subsection data in this fallback
        topicPerformance,
        overallPercentile: 50, // Default to 50th percentile without comparative data
        averageTimePerQuestion: avgTimePerQuestion,
        totalTestsTaken: tests.length
      },
      globalPerformance: {
        average: {
          score: totalCorrect,
          percentage: overallAccuracy,
          totalTests: tests.length
        }
      },
      improvement
    };
  };
  const createEmptyComparativeData = (): ComparativeAnalytics => {
    return {
      userPerformance: {
        subjectPerformance: [],
        subsectionPerformance: [],
        topicPerformance: [],
        overallPercentile: 0,
        averageTimePerQuestion: 0,
        totalTestsTaken: 0
      },
      globalPerformance: {
        average: {
          score: 0,
          percentage: 0,
          totalTests: 0
        }
      },
      improvement: null
    };
  };
  const generatePDF = async () => {
    if (!dashboardRef.current) return

    setIsGeneratingPDF(true)
    const toastId = toast.loading("Please wait while we prepare your report...")

    try {
      // Create a new jsPDF instance
      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()

      // Add title
      pdf.setFontSize(20)
      pdf.setTextColor(44, 62, 80)
      pdf.text("Analytics Dashboard Report", pageWidth / 2, 20, { align: "center" })

      // Add date
      pdf.setFontSize(12)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: "center" })

      // Add user info
      pdf.setFontSize(14)
      pdf.setTextColor(44, 62, 80)
      pdf.text("User Performance Summary", 20, 45)

      // Add stats
      pdf.setFontSize(12)
      pdf.setTextColor(80, 80, 80)
      pdf.text(`Total Tests Taken: ${statsData?.totalTestsTaken || 0}`, 20, 55)
      pdf.text(`Total Questions: ${statsData?.totalQuestionsAttempted || 0}`, 20, 62)
      pdf.text(`Correct Answers: ${statsData?.totalQuestionsCorrect || 0}`, 20, 69)
      pdf.text(`Total Study Hours: ${statsData?.totalStudyHours?.toFixed(1) || 0}`, 20, 76)

      // Add performance data
      if (performanceData.length > 0) {
        pdf.setFontSize(14)
        pdf.setTextColor(44, 62, 80)
        pdf.text("Recent Performance", 20, 90)

        pdf.setFontSize(12)
        pdf.setTextColor(80, 80, 80)

        let yPos = 100
        performanceData.slice(0, 5).forEach((test, index) => {
          pdf.text(`Test ${index + 1}: ${test.percentage}% (${test.score}/${test.questions.length})`, 20, yPos)
          pdf.text(`Date: ${formatDate(test.createdAt)}`, 120, yPos)
          yPos += 7
        })
      }

      // Add mastery data
      if (topicMasteryData) {
        pdf.setFontSize(14)
        pdf.setTextColor(44, 62, 80)
        pdf.text("Topic Mastery", 20, 140)

        pdf.setFontSize(12)
        pdf.setTextColor(80, 80, 80)

        let yPos = 150
        topicMasteryData.strongestTopics.slice(0, 3).forEach((topic, index) => {
          pdf.text(`Strongest Topic ${index + 1}: ${topic.name} (${topic.masteryScore}%)`, 20, yPos)
          yPos += 7
        })

        yPos += 5
        topicMasteryData.weakestTopics.slice(0, 3).forEach((topic, index) => {
          pdf.text(`Weakest Topic ${index + 1}: ${topic.name} (${topic.masteryScore}%)`, 20, yPos)
          yPos += 7
        })
      }

      // Add recommendations
      if (topicMasteryData?.recommendations) {
        pdf.addPage()

        pdf.setFontSize(16)
        pdf.setTextColor(44, 62, 80)
        pdf.text("Study Recommendations", pageWidth / 2, 20, { align: "center" })

        pdf.setFontSize(12)
        pdf.setTextColor(80, 80, 80)

        let yPos = 40
        topicMasteryData.recommendations.slice(0, 5).forEach((rec, index) => {
          pdf.text(`${index + 1}. ${rec.topic} (${rec.masteryLevel})`, 20, yPos)

          // Split recommendation text to fit page width
          const recText = rec.recommendation
          const textWidth = pageWidth - 40 // 20mm margins on each side
          const splitText = pdf.splitTextToSize(recText, textWidth)

          pdf.text(splitText, 25, yPos + 7)
          yPos += 20
        })
      }

      // Add charts
      try {
        // Capture charts as images
        if (dashboardRef.current) {
          const chartElements = dashboardRef.current.querySelectorAll(".recharts-wrapper")

          if (chartElements.length > 0) {
            pdf.addPage()
            pdf.setFontSize(16)
            pdf.setTextColor(44, 62, 80)
            pdf.text("Performance Charts", pageWidth / 2, 20, { align: "center" })

            let yPos = 40

            // Only process up to 2 charts to keep PDF size reasonable
            for (let i = 0; i < Math.min(chartElements.length, 2); i++) {
              const chart = chartElements[i]
              const canvas = await html2canvas(chart as HTMLElement)
              const imgData = canvas.toDataURL("image/png")

              // Calculate dimensions to fit on page
              const imgWidth = Math.min(pageWidth - 40, 160)
              const ratio = canvas.height / canvas.width
              const imgHeight = imgWidth * ratio

              if (yPos + imgHeight > 270) {
                // Check if we need a new page
                pdf.addPage()
                yPos = 20
              }

              pdf.addImage(imgData, "PNG", 20, yPos, imgWidth, imgHeight)
              yPos += imgHeight + 20
            }
          }
        }
      } catch (chartErr) {
        console.error("Error capturing charts:", chartErr)
      }

      // Add footer
      const totalPages = pdf.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(10)
        pdf.setTextColor(150, 150, 150)
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, 285, { align: "center" })
        pdf.text("Medical Study Analytics Dashboard", 20, 285)
      }

      // Save the PDF
      pdf.save(`medical-analytics-report-${new Date().toISOString().slice(0, 10)}.pdf`)

      toast.success("Your analytics report has been downloaded.", { id: toastId })
    } catch (err) {
      console.error("Error generating PDF:", err)
      toast.error("There was a problem creating your report. Please try again.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Function to handle sharing the report
  const handleShareReport = async (method: "email" | "copy" | "social") => {
    try {
      switch (method) {
        case "email":
          if (!shareEmail) {
            toast.error("Please enter an email address to share the report.")
            return
          }

          // In a real app, you would send this to your backend
          // For demo purposes, we'll just show a success message
          toast.success(`Report has been shared with ${shareEmail}`)
          setShareEmail("")
          setShareNote("")
          setIsShareDialogOpen(false)
          break

        case "copy":
          await navigator.clipboard.writeText(shareUrl)
          toast.success("Report link has been copied to clipboard")
          break

        case "social":
          // This would open a social sharing dialog in a real app
          window.open(
            `https://twitter.com/intent/tweet?text=Check out my medical study analytics report&url=${encodeURIComponent(shareUrl)}`,
            "_blank",
          )
          break
      }
    } catch (err) {
      console.error("Error sharing report:", err)
      toast.error("There was a problem sharing your report. Please try again.")
    }
  }

  // Prepare chart data
  const accuracyChartData = performanceData.map((test, index) => ({
    name: `Test ${index + 1}`,
    accuracy: test.percentage,
    date: formatDate(test.createdAt),
  }))

  const subjectPerformanceData =
    comparativeData?.userPerformance.subjectPerformance.map((subject) => ({
      name: subject.name,
      accuracy: subject.percentage,
      questions: subject.total,
    })) || []

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

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#8dd1e1"]

  // Loading state
  const isLoading = Object.values(loading).some((status) => status)

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <LoadingStatCard key={i} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingCard />
          <LoadingCard />
        </div>

        <LoadingCard />
      </div>
    )
  }

  const shouldShowEmptyState =
    error.performance && performanceData.length === 0 && !statsData && !loading.performance && !loading.stats

  if (shouldShowEmptyState) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-lg text-center">
          <h2 className="text-xl font-medium text-blue-800 dark:text-blue-400 mb-4">
            Welcome to Your Analytics Dashboard
          </h2>
          <div className="flex justify-center mb-4">
            <BookOpen className="h-16 w-16 text-blue-500" />
          </div>
          <p className="text-blue-700 dark:text-blue-300 mb-4 max-w-2xl mx-auto">
            It looks like you haven&apos;t taken any tests yet. Start taking tests to see your performance analytics,
            track your progress, and get personalized recommendations.
          </p>
          <Button variant="default" className="mt-2" onClick={() => (window.location.href = "/dashboard/create-test")}>
            Take Your First Test
          </Button>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 bg-background" ref={dashboardRef}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Track your performance and identify areas for improvement</p>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsShareDialogOpen(true)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  <span>Share Report</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={generatePDF} disabled={isGeneratingPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  <span>{isGeneratingPDF ? "Generating..." : "Download PDF"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 h-auto">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <BarChart2 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Activity className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger
              value="mastery"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Brain className="h-4 w-4 mr-2" />
              Topic Mastery
            </TabsTrigger>
            <TabsTrigger
              value="recommendations"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Zap className="h-4 w-4 mr-2" />
              Recommendations
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <OverviewTab
              statsData={statsData}
              performanceData={performanceData}
              comparativeData={comparativeData}
              topicMasteryData={topicMasteryData}
              loading={loading}
              error={error}
              viewAllTests={viewAllTests}
              setViewAllTests={setViewAllTests}
              viewAllQuestions={viewAllQuestions}
              setViewAllQuestions={setViewAllQuestions}
              selectedTestIndex={selectedTestIndex}
              setSelectedTestIndex={setSelectedTestIndex}
              formatDate={formatDate}
              formatTime={formatTime}
              targetExam={targetExam}
            />
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-8">
            <PerformanceTab
              performanceData={performanceData}
              comparativeData={comparativeData}
              statsData={statsData}
              formatTime={formatTime}
            />
          </TabsContent>

          {/* Topic Mastery Tab */}
          <TabsContent value="mastery" className="space-y-8">
            <TopicMasteryTab
              topicMasteryData={topicMasteryData}
              loading={loading}
              targetExam={targetExam}
              formatTime={formatTime}
            />
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-8">
            <RecommendationsTab
              userWeakSubjects={userWeakSubjects}
              topicMasteryData={topicMasteryData}
              loading={loading}
            />
          </TabsContent>
        </Tabs>

        <ShareReportDialog
          isOpen={isShareDialogOpen}
          setIsOpen={setIsShareDialogOpen}
          shareUrl={shareUrl}
          shareEmail={shareEmail}
          setShareEmail={setShareEmail}
          shareNote={shareNote}
          setShareNote={setShareNote}
          handleShareReport={handleShareReport}
        />

        <Toaster position="top-right" />
      </div>
    </TooltipProvider>
  )
}
