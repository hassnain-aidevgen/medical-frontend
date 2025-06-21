"use client"

import axios from "axios"
import { BarChart2, BookOpen, CheckCircle, Clock, Dna, Pause, PieChart, Play, Settings, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { PiRankingDuotone } from "react-icons/pi"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart as RPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import MentorshipsWidget from "@/components/upcoming-mentorships"
import { OngoingCourses } from "@/components/ongoing-courses"
import ChallengeButton from "@/components/challenge-button"
import DailyChallengeButton from "@/components/daily-challenge-button"
import DashboardNextReview from "@/components/dashboard-next-review"
import DashboardToday from "@/components/dashboard-today"
import { FlashcardChallengeButton } from "@/components/flashcard-challenge-button"
import { MotivationalMessage } from "@/components/motivational-toasts"
import RecentTest from "@/components/recent-test"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import WeeklyPerformance from "@/components/weekly-performance"
import NextTaskCard from "@/components/next-task-card"
import { FileQuestion } from "lucide-react"

// Timer state type definitions (same as in standalone Pomodoro component)
type TimerMode = "work" | "shortBreak" | "longBreak"

// Keys for localStorage (same as in standalone Pomodoro component)
const TIMER_STATE_KEY = "pomodoroTimerState"
const SETTINGS_KEY = "pomodoroSettings"

// Interface for saved timer state (same as in standalone Pomodoro component)
interface SavedTimerState {
  startTimestamp: number
  totalDuration: number
  mode: TimerMode
  isActive: boolean
  cycles: number
}

// Default timer settings (same as in standalone Pomodoro component)
const DEFAULT_SETTINGS = {
  work: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 4,
}

const featureCards = [
  { name: "Create Test", icon: BookOpen, href: "/dashboard/create-test", color: "bg-blue-500" },
  { name: "Flash Cards", icon: Users, href: "/dashboard/flash-cards", color: "bg-green-500" },
  { name: "Leaderboard", icon: PiRankingDuotone, href: "/dashboard/leaderboard", color: "bg-yellow-500" },
  { name: "Performance", icon: BarChart2, href: "/dashboard/performance-tracking", color: "bg-purple-500" },
  { name: "Smart Study", icon: BookOpen, href: "/dashboard/smart-study", color: "bg-pink-500" },
  { name: "Weekly Goals", icon: Settings, href: "/dashboard/custom-weekly-goals", color: "bg-indigo-500" },
  { name: "Error Notebook", icon: Users, href: "/dashboard/digital-error-notebook", color: "bg-red-500" },
  { name: "Pomodoro", icon: Clock, href: "/dashboard/pomodoro-timer", color: "bg-orange-500" },
  { name: "Questions", icon: FileQuestion, href: "/dashboard/questions", color: "bg-teal-500" },
]

interface Goal {
  _id: string
  subject: string
  description: string
  targetHours: number
  completedHours: number
  dueDate: string
  isCompleted: boolean
  level: number
}

interface Flashcard {
  _id: string
  question: string
  answer: string
  hint?: string
  category: string
  subsection?: string
  userId: string
  difficulty: "easy" | "medium" | "hard"
  tags: string[]
  lastReviewed?: Date
  reviewCount: number
  mastery: number
  createdAt: Date
  updatedAt: Date
}

interface ExamTypeStat {
  totalQuestions: number
  correctAnswers: number
  exam_type: string
  averageTimeSpent: number
  accuracy: number
}

type TimeFrame = "weekly" | "monthly" | "all-time"

// Colors for the charts
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

export default function DashboardPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Leaderboard states
  const [activeTab, setActiveTab] = useState<TimeFrame>("all-time")
  const [userRanks, setUserRanks] = useState<Record<TimeFrame, number | null>>({
    weekly: null,
    monthly: null,
    "all-time": null,
  })
  const [rankLoading, setRankLoading] = useState<Record<TimeFrame, boolean>>({
    weekly: false,
    monthly: false,
    "all-time": false,
  })

  // Weekly goals states
  const [goals, setGoals] = useState<Goal[]>([])
  const [goalsLoading, setGoalsLoading] = useState(true)

  // Enhanced Pomodoro timer states
  const [time, setTime] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [mode, setMode] = useState<TimerMode>("work")
  const [cycles, setCycles] = useState(0)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const audioContextRef = useRef<AudioContext | null>(null)
  const tickIntervalRef = useRef<number | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Add a new state for daily questions stats
  const [dailyStats, setDailyStats] = useState({ completedQuestions: 0, totalQuestions: 0 })
  const [dailyStatsLoading, setDailyStatsLoading] = useState(true)

  // Replace the existing flashcards state with proper typing
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [flashcardsLoading, setFlashcardsLoading] = useState(true)

  // Add new state for exam type stats
  const [examTypeStats, setExamTypeStats] = useState<ExamTypeStat[]>([])
  const [examTypeStatsLoading, setExamTypeStatsLoading] = useState(true)
  const [activeExamStatsTab, setActiveExamStatsTab] = useState<"accuracy" | "questions" | "time">("accuracy")
  
  interface RecommendedCourse {
    _id: string
    title: string
    description: string
    thumbnail?: string
    examType: string
    level: string
  }

  const [recommendedCourses, setRecommendedCourses] = useState<RecommendedCourse[]>([])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("Medical_User_Id")
      console.log("Dashboard - User ID from localStorage:", storedUserId)
      setUserId(storedUserId)
    }
  }, [])

  // POMODORO TIMER RELATED CODE - BEGIN
  // Load timer settings from localStorage on initial mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY)
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (e) {
        console.error("Error loading saved settings:", e)
      }
    }
  }, [])
  
  // Load timer state from localStorage on initial mount
  useEffect(() => {
    const savedTimerState = localStorage.getItem(TIMER_STATE_KEY)
    if (savedTimerState) {
      try {
        const parsedState = JSON.parse(savedTimerState) as SavedTimerState
        
        // Calculate elapsed time
        const now = Date.now()
        const elapsedSeconds = Math.floor((now - parsedState.startTimestamp) / 1000)
        const remainingTime = Math.max(0, parsedState.totalDuration - elapsedSeconds)
        
        // Set the timer state
        setMode(parsedState.mode)
        setCycles(parsedState.cycles)
        setTime(remainingTime)
        
        // Only resume if the timer was active and hasn't completed
        if (parsedState.isActive && remainingTime > 0) {
          setIsActive(true)
        } else if (remainingTime === 0) {
          // If timer completed while away, reset to next mode
          handleTimerComplete()
        }
      } catch (e) {
        console.error("Error loading saved timer state:", e)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Save timer state to localStorage when active
  useEffect(() => {
    if (isActive) {
      const timerState: SavedTimerState = {
        startTimestamp: Date.now() - ((settings[mode] * 60) - time) * 1000,
        totalDuration: settings[mode] * 60,
        mode,
        isActive,
        cycles
      }
      localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(timerState))
    }
  }, [isActive, time, mode, cycles, settings])

  const playTick = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )()
    }

    const audioContext = audioContextRef.current
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime)
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.03, audioContext.currentTime + 0.01)
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.05)

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.05)
  }, [])

  const startTickingSound = useCallback(() => {
    if (tickIntervalRef.current) return

    tickIntervalRef.current = window.setInterval(() => {
      playTick()
    }, 1000)
  }, [playTick])

  const stopTickingSound = useCallback(() => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current)
      tickIntervalRef.current = null
    }
  }, [])

  const handleTimerComplete = useCallback(() => {
    // Play notification sound
    try {
      new Audio("/notification.mp3").play()
    } catch (e) {
      console.error("Error playing notification sound:", e)
    }
    
    // Stop the timer
    setIsActive(false)
    
    // Remove from localStorage
    localStorage.removeItem(TIMER_STATE_KEY)
    
    // Keep the timer at 00:00 without auto-transitioning to the next mode
    // The user will need to manually select the next mode or restart
  }, [])

  // Update timer every second and handle completion
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }

    if (isActive && time > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime - 1)
      }, 1000)
      startTickingSound()
    } else if (time === 0) {
      handleTimerComplete()
      stopTickingSound()
    } else {
      stopTickingSound()
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
      stopTickingSound()
    }
  }, [isActive, time, handleTimerComplete, startTickingSound, stopTickingSound])

  const toggleTimer = () => {
    const newActiveState = !isActive
    setIsActive(newActiveState)
    
    if (newActiveState) {
      // Save timer state when starting
      const timerState: SavedTimerState = {
        startTimestamp: Date.now() - ((settings[mode] * 60) - time) * 1000,
        totalDuration: settings[mode] * 60,
        mode,
        isActive: true,
        cycles
      }
      localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(timerState))
    } else {
      // Remove from localStorage when pausing
      localStorage.removeItem(TIMER_STATE_KEY)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const navigateToPomodoro = () => {
    router.push("/dashboard/pomodoro-timer")
  }
  // POMODORO TIMER RELATED CODE - END

  useEffect(() => {
    const fetchExamTypeStats = async () => {
      if (!userId) return

      setExamTypeStatsLoading(true)
      try {
        const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/exam-type-stats/${userId}`)

        if (response.data && response.data.success && Array.isArray(response.data.examTypeStats)) {
          setExamTypeStats(response.data.examTypeStats)
        } else {
          console.error("Invalid exam type stats format:", response.data)
        }
      } catch (error) {
        console.error("Error fetching exam type stats:", error)
      } finally {
        setExamTypeStatsLoading(false)
      }
    }

    if (userId) {
      fetchExamTypeStats()
    }
  }, [userId])
  
  useEffect(() => {
    const fetchRecommendedCourses = async () => {
      if (!userId || examTypeStatsLoading || examTypeStats.length === 0) return

      // Find exam types with accuracy below 75%
      const lowAccuracyExams = examTypeStats.filter((stat) => stat.accuracy < 75).map((stat) => stat.exam_type)

      // Only fetch if there are low accuracy exams
      if (lowAccuracyExams.length > 0) {
        try {
          const response = await axios.get(
            `https://medical-backend-loj4.onrender.com/api/courses/recommended-courses/${userId}?examTypes=${lowAccuracyExams.join(",")}`,
          )

          if (response.data && response.data.success) {
            setRecommendedCourses(response.data.recommendedCourses)
          }
        } catch (error) {
          console.error("Error fetching recommended courses:", error)
        }
      }
    }

    fetchRecommendedCourses()
  }, [userId, examTypeStats, examTypeStatsLoading])

  useEffect(() => {
    const fetchStreakData = async () => {
      if (!userId) return

      setIsLoading(true)
      try {
        const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/streak/${userId}`)

        if (response.data && typeof response.data.currentStreak === "number") {
          setCurrentStreak(response.data.currentStreak || 0)
        } else {
          console.error("Invalid streak data format:", response.data)
          setError("Invalid data format received from server")
        }
      } catch (error) {
        console.error("Error fetching streak data:", error)
        setError("Failed to fetch streak data")
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchStreakData()
    }
  }, [userId])

  // Fetch leaderboard rank data for the current time frame
  useEffect(() => {
    const fetchUserRank = async () => {
      if (!userId || rankLoading[activeTab]) return

      setRankLoading((prev) => ({ ...prev, [activeTab]: true }))

      try {
        const response = await axios.get(
          `https://medical-backend-loj4.onrender.com/api/test/leaderboard/player/${userId}?timeFrame=${activeTab}`,
        )

        if (response.data && response.data.success) {
          setUserRanks((prev) => ({
            ...prev,
            [activeTab]: response.data.data.rank || null,
          }))
        }
      } catch (error) {
        console.error(`Error fetching ${activeTab} rank:`, error)
      } finally {
        setRankLoading((prev) => ({ ...prev, [activeTab]: false }))
      }
    }

    fetchUserRank()
  }, [userId, activeTab])

  // Fetch weekly goals data
  useEffect(() => {
    const fetchGoalsData = async () => {
      if (!userId) return

      setGoalsLoading(true)
      try {
        const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/quest?userId=${userId}`)
        if (response.data && response.data.data) {
          setGoals(response.data.data)
        }
      } catch (error) {
        console.error("Error fetching goals data:", error)
      } finally {
        setGoalsLoading(false)
      }
    }

    if (userId) {
      fetchGoalsData()
    }
  }, [userId])

  // Add a new useEffect to fetch daily questions stats
  useEffect(() => {
    const fetchDailyStats = async () => {
      if (!userId) return

      setDailyStatsLoading(true)
      try {
        const response = await axios.get(
          `https://medical-backend-loj4.onrender.com/api/test/daily-question-stats?userId=${userId}`,
        )
        console.log("DailyQuestionStat: ", response.data)
        if (response.data) {
          // Limit totalQuestions to 10
          const totalQuestions = Math.min(response.data.totalQuestions || 0, 10)
          // Ensure completedQuestions doesn't exceed the totalQuestions limit
          const completedQuestions = Math.min(response.data.completedQuestions || 0, totalQuestions)

          setDailyStats({
            completedQuestions,
            totalQuestions,
          })
        }
      } catch (error) {
        console.error("Error fetching daily questions stats:", error)
      } finally {
        setDailyStatsLoading(false)
      }
    }

    if (userId) {
      fetchDailyStats()
    }
  }, [userId])

  // Update the fetchFlashcards function to filter for cards with reviewCount > 0
  useEffect(() => {
    const fetchFlashcards = async () => {
      if (!userId) return

      setFlashcardsLoading(true)
      try {
        // Change this URL to your actual API endpoint and add filter for reviewCount > 0
        const response = await axios.get<Flashcard[]>(
          `https://medical-backend-loj4.onrender.com/api/v2/flashcards?userId=${userId}&numFlashcards=10`,
        )

        if (response.data) {
          // Filter flashcards to only include those with reviewCount > 0
          const reviewFlashcards = response.data.filter((card) => card.reviewCount > 0)
          setFlashcards(reviewFlashcards)
        }
      } catch (error) {
        console.error("Error fetching flashcards:", error)
      } finally {
        setFlashcardsLoading(false)
      }
    }

    if (userId) {
      fetchFlashcards()
    }
  }, [userId])

  const navigateToLeaderboard = () => {
    router.push(`/dashboard/leaderboard?tab=${activeTab}`)
  }

  const navigateToWeeklyGoals = () => {
    router.push("/dashboard/study-planner")
  }

  // Add a navigation function for flashcards after the navigateToWeeklyGoals function
  const navigateToFlashcards = () => {
    router.push("/dashboard/flash-cards")
  }

  // Calculate weekly goals progress
  const totalQuests = goals.length
  const completedQuests = goals.filter((goal) => goal.isCompleted).length
  const goalProgressPercentage = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0

  // Format exam type names for better display
  const formatExamType = (examType: string) => {
    return examType.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  // Prepare data for the pie chart
  const pieChartData = examTypeStats.map((stat, index) => ({
    name: formatExamType(stat.exam_type),
    value: stat.accuracy,
    color: COLORS[index % COLORS.length],
  }))

  // Prepare data for the bar charts
  const questionsBarData = examTypeStats.map((stat, index) => ({
    name: formatExamType(stat.exam_type),
    total: stat.totalQuestions,
    correct: stat.correctAnswers,
    color: COLORS[index % COLORS.length],
  }))

  const timeBarData = examTypeStats.map((stat) => ({
    name: formatExamType(stat.exam_type),
    time: Number(stat.averageTimeSpent.toFixed(2)),
  }))

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 bg-background">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight mb-4 sm:mb-0">Welcome back, Student!</h2>
        <div className="flex space-x-2">
          <ChallengeButton />
          <DailyChallengeButton />
          <FlashcardChallengeButton />
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="overflow-hidden border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Study Streak</CardTitle>
            <Dna className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-2xl font-bold">Loading...</div>
            ) : error ? (
              <div className="text-sm text-red-500">Error loading streak</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{currentStreak} Day(s)</div>
                <p className="text-xs text-muted-foreground">
                  {currentStreak > 0 ? "Keep it up!" : "Start your streak today!"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <NextTaskCard userId={userId} onNavigate={navigateToWeeklyGoals} />

        <Card className="overflow-hidden border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Questions</CardTitle>
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {dailyStatsLoading ? (
              <div className="text-2xl font-bold">Loading...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {dailyStats.completedQuestions}/{dailyStats.totalQuestions}
                </div>
                <Progress
                  value={
                    dailyStats.totalQuestions > 0
                      ? (dailyStats.completedQuestions / dailyStats.totalQuestions) * 100
                      : 0
                  }
                  className="h-2 mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {dailyStats.totalQuestions === 0
                    ? "No questions for today yet"
                    : dailyStats.completedQuestions === dailyStats.totalQuestions
                      ? "All questions completed!"
                      : `${dailyStats.totalQuestions - dailyStats.completedQuestions} questions remaining`}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer group overflow-hidden border-l-4 border-l-orange-500"
          onClick={navigateToPomodoro}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pomodoro Timer</CardTitle>
            <Clock className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{formatTime(time)}</div>
              <button
                className="p-1.5 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleTimer()
                }}
              >
                {isActive ? <Pause size={16} /> : <Play size={16} />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {isActive 
                ? `${mode === "work" ? "Working" : mode === "shortBreak" ? "Short Break" : "Long Break"}`
                : "Click to start"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with 2:1 Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Dashboard Component */}
          <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm border">
            <DashboardToday />
          </div>
          {/* Add OngoingCourses here */}
          <div className="mb-6">
            <OngoingCourses />
          </div>
          <div className="col-span-1">
            <MentorshipsWidget />
          </div>

          {/* Weekly Performance Component */}
          <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm border">
            <WeeklyPerformance />
          </div>

          {/* Recent Test Component */}
          <div>
            <RecentTest />
          </div>

          {/* Study Plan */}
          {/* <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm border">
            <DashboardStudyPlan />
          </div> */}
        </div>

        {/* Right Side (1/3 width) */}
        <div className="space-y-6">
          {/* Next Review Component */}

          {/* Leaderboard Car
        <div className="space-y-6">
          {/* Next Review Component */}

          {/* Leaderboard Card */}
          <Card className="h-[210px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 flex-shrink-0">
              <CardTitle className="text-sm font-medium">Leaderboard Rank</CardTitle>
              <PiRankingDuotone className="h-6 w-6 text-yellow-500" />
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden">
              <ScrollArea className="h-full w-full pr-4">
                {rankLoading["all-time"] ? (
                  <div className="text-2xl font-bold">Loading...</div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-3xl font-bold mb-2">#{userRanks["all-time"] || "—"}</div>
                    <p className="text-sm text-muted-foreground mb-4">All-Time Ranking</p>
                    <Button variant="outline" size="sm" onClick={navigateToLeaderboard} className="w-full">
                      Detailed Rankings
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
          <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm border max-h-[400px] overflow-y-auto">
            <DashboardNextReview />
          </div>

          {/* Flashcards Preview */}
          {flashcards.length > 0 && (
            <Card className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2 flex-shrink-0">
                <CardTitle className="text-md font-medium">Flashcards For Review</CardTitle>
                <BookOpen className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent className="flex-grow overflow-hidden">
                <ScrollArea className="h-[200px] w-full pr-4">
                  {flashcardsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-sm">Loading flashcards...</div>
                    </div>
                  ) : flashcards.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-sm text-muted-foreground">No flashcards marked for review</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {flashcards.slice(0, 5).map((card) => (
                        <div
                          key={card._id}
                          className="p-3 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={navigateToFlashcards}
                        >
                          <div className="font-medium line-clamp-1">{card.question}</div>
                          <div className="flex justify-between items-center mt-1">
                            <div className="text-xs text-muted-foreground">
                              {card.category} • {card.difficulty}
                            </div>
                            <div className="text-xs bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full">
                              {card.reviewCount} {card.reviewCount === 1 ? "review" : "reviews"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <Button variant="outline" size="sm" onClick={navigateToFlashcards} className="w-full mt-3">
                  View All Review Cards
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Access key features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {featureCards.map((feature) => (
                  <Button
                    key={feature.name}
                    variant="outline"
                    className="h-20 w-full flex flex-col items-center justify-center text-center p-2 hover:bg-muted/50 transition-all hover:scale-105"
                    asChild
                  >
                    <a href={feature.href}>
                      <div className={`${feature.color} rounded-full p-2 mb-1.5`}>
                        <feature.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-xs font-medium">{feature.name}</span>
                    </a>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Exam Type Stats Section */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Target Exam Panel</CardTitle>
                <CardDescription>Performance metrics across different exam types</CardDescription>
              </div>
              <PieChart className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              {examTypeStatsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-lg">Loading exam statistics...</div>
                </div>
              ) : examTypeStats.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-lg text-muted-foreground">No exam data available yet</div>
                </div>
              ) : (
                <div>
                  <Tabs
                    defaultValue="accuracy"
                    className="w-full"
                    onValueChange={(value) => setActiveExamStatsTab(value as any)}
                  >
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                      <TabsTrigger value="accuracy">Accuracy</TabsTrigger>
                      <TabsTrigger value="questions">Questions</TabsTrigger>
                      <TabsTrigger value="time">Time Spent</TabsTrigger>
                    </TabsList>

                    <TabsContent value="accuracy" className="mt-0">
                      <div className="flex flex-col">
                        <div className="h-[250px] w-full mb-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <RPieChart>
                              <Pie
                                data={pieChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value.toFixed(2)}%`}
                              >
                                {pieChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
                              <Legend />
                            </RPieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold mb-2">Accuracy Breakdown</h3>
                          {examTypeStats.map((stat, index) => (
                            <div key={stat.exam_type} className="space-y-1">
                              <div className="flex justify-between">
                                <span className="font-medium">{formatExamType(stat.exam_type)}</span>
                                <span className="font-semibold">{stat.accuracy.toFixed(2)}%</span>
                              </div>
                              <Progress
                                value={stat.accuracy}
                                className="h-2"
                                style={
                                  {
                                    backgroundColor: "rgba(0,0,0,0.1)",
                                    "--tw-progress-fill": COLORS[index % COLORS.length],
                                  } as any
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="questions" className="mt-0">
                      <div className="flex flex-col">
                        <div className="h-[250px] w-full mb-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={questionsBarData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="total" name="Total Questions" fill="#8884d8" />
                              <Bar dataKey="correct" name="Correct Answers" fill="#82ca9d" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {examTypeStats.map((stat) => (
                            <Card key={stat.exam_type} className="bg-muted/40">
                              <CardContent className="p-4">
                                <h4 className="font-semibold">{formatExamType(stat.exam_type)}</h4>
                                <div className="mt-2 space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span>Total Questions:</span>
                                    <span className="font-medium">{stat.totalQuestions}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Correct Answers:</span>
                                    <span className="font-medium">{stat.correctAnswers}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Accuracy:</span>
                                    <span className="font-medium">{stat.accuracy.toFixed(2)}%</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="time" className="mt-0">
                      <div className="h-[250px] mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={timeBarData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => `${value} min`} />
                            <Legend />
                            <Bar dataKey="time" name="Average Time (minutes)" fill="#ff8042" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2">Time Analysis</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Average time spent per question across different exam types
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4">
                          {examTypeStats.map((stat, index) => (
                            <div
                              key={stat.exam_type}
                              className="p-2 rounded-lg flex flex-col items-center justify-center text-center"
                              style={{ backgroundColor: `${COLORS[index % COLORS.length]}20` }}
                            >
                              <Clock className="h-5 w-5 mb-2" style={{ color: COLORS[index % COLORS.length] }} />
                              <div className="text-sm font-medium">{formatExamType(stat.exam_type)}</div>
                              <div className="text-xl font-bold mt-1">{stat.averageTimeSpent.toFixed(2)} min</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </CardContent>
          </Card>
          {recommendedCourses.length > 0 && (
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Recommended Courses</CardTitle>
                  <CardDescription>Based on your exam performance</CardDescription>
                </div>
                <BookOpen className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendedCourses.map((course) => (
                    <div
                      key={course._id}
                      className="flex gap-4 p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/courses/${course._id}`)}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{course.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{course.description}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full">
                            {course.examType.replace("_", " ")}
                          </span>
                          <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 px-2 py-0.5 rounded-full">
                            {course.level}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <MotivationalMessage />
    </div>
  )
}