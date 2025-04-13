"use client"

import axios from "axios"
import { BarChart2, BookOpen, CheckCircle, Clock, Dna, Pause, Play, Settings, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { PiRankingDuotone } from "react-icons/pi"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import ChallengeButton from "@/components/challenge-button"
import DailyChallengeButton from "@/components/daily-challenge-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import WeeklyPerformance from "@/components/weekly-performance"
import RecentTest from "@/components/recent-test"
import DashboardStudyPlan from "@/components/DashboardStudyPlan"
import DashboardToday from "@/components/dashboard-today"
import DashboardNextReview from "@/components/dashboard-next-review"

const featureCards = [
  { name: "Create Test", icon: BookOpen, href: "/dashboard/create-test", color: "bg-blue-500" },
  { name: "Flash Cards", icon: Users, href: "/dashboard/flash-cards", color: "bg-green-500" },
  { name: "Leaderboard", icon: PiRankingDuotone, href: "/dashboard/leaderboard", color: "bg-yellow-500" },
  { name: "Performance", icon: BarChart2, href: "/dashboard/performance-tracking", color: "bg-purple-500" },
  { name: "Smart Study", icon: BookOpen, href: "/dashboard/smart-study", color: "bg-pink-500" },
  { name: "Weekly Goals", icon: Settings, href: "/dashboard/custom-weekly-goals", color: "bg-indigo-500" },
  { name: "Error Notebook", icon: Users, href: "/dashboard/digital-error-notebook", color: "bg-red-500" },
  { name: "Pomodoro", icon: Clock, href: "/dashboard/pomodoro-timer", color: "bg-orange-500" },
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

type TimeFrame = "weekly" | "monthly" | "all-time"

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

  // Pomodoro timer states
  const [time, setTime] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const tickIntervalRef = useRef<number | null>(null)

  // Add a new state for daily questions stats
  const [dailyStats, setDailyStats] = useState({ completedQuestions: 0, totalQuestions: 0 })
  const [dailyStatsLoading, setDailyStatsLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("Medical_User_Id")
      console.log("Dashboard - User ID from localStorage:", storedUserId)
      setUserId(storedUserId)
    }
  }, [])

  useEffect(() => {
    const fetchStreakData = async () => {
      if (!userId) return

      setIsLoading(true)
      try {
        // const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/streak/${userId}`)
        const response = await axios.get(`http://localhost:5000/api/test/streak/${userId}`)

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
        const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/quest?userId=${userId}`)
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
          setDailyStats({
            completedQuestions: response.data.completedQuestions || 0,
            totalQuestions: response.data.totalQuestions || 0,
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

  // Pomodoro timer functions
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

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime - 1)
      }, 1000)
      startTickingSound()
    } else if (time === 0) {
      setIsActive(false)
      stopTickingSound()
      try {
        new Audio("/notification.mp3").play()
      } catch (error) {
        console.error("Error playing notification sound:", error)
      }
    } else {
      stopTickingSound()
    }

    return () => {
      if (interval) clearInterval(interval)
      stopTickingSound()
    }
  }, [isActive, time, startTickingSound, stopTickingSound])

  const toggleTimer = () => {
    setIsActive(!isActive)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const navigateToPomodoro = () => {
    router.push("/dashboard/pomodoro-timer")
  }

  const navigateToLeaderboard = () => {
    router.push(`/dashboard/leaderboard?tab=${activeTab}`)
  }

  const navigateToWeeklyGoals = () => {
    router.push("/dashboard/custom-weekly-goals")
  }

  // Calculate weekly goals progress
  const totalQuests = goals.length
  const completedQuests = goals.filter((goal) => goal.isCompleted).length
  const goalProgressPercentage = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0

  const getTimeFrameLabel = (timeFrame: TimeFrame) => {
    switch (timeFrame) {
      case "weekly":
        return "Weekly"
      case "monthly":
        return "Monthly"
      case "all-time":
        return "All-Time"
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:pl-8 md:pr-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, Student!</h2>
        <div className="flex space-x-2">
          <ChallengeButton />
          <DailyChallengeButton />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Student&apos;s current Study Streak</CardTitle>
            <Dna className="h-6 w-6 text-blue-500" />
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
        <Card className="cursor-pointer" onClick={navigateToWeeklyGoals}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Weekly Goal Progress</CardTitle>
            <Settings className="h-6 w-6 text-green-500" />
          </CardHeader>
          <CardContent>
            {goalsLoading ? (
              <div className="text-2xl font-bold">Loading...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{goalProgressPercentage}%</div>
                <Progress value={goalProgressPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {completedQuests} of {totalQuests} quests completed
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Questions</CardTitle>
            <CheckCircle className="h-6 w-6 text-emerald-500" />
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
        <Card className="cursor-pointer group" onClick={navigateToPomodoro}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pomodoro Timer</CardTitle>
            <Clock className="h-6 w-6 text-orange-500" />
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
            <p className="text-xs text-muted-foreground">{isActive ? "Timer running" : "Click to start"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Dashboard Component */}
      <DashboardToday />

      {/* Weekly Performance Component */}
      <WeeklyPerformance />

      {/* Next Review Component */}
      <DashboardNextReview />

      <Card className="cursor-pointer lg:col-span-4" onClick={navigateToLeaderboard}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Leaderboard Rank</CardTitle>
          <PiRankingDuotone className="h-6 w-6 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TimeFrame)} className="w-full mb-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="all-time">All-Time</TabsTrigger>
            </TabsList>
          </Tabs>

          {rankLoading[activeTab] ? (
            <div className="text-2xl font-bold">Loading...</div>
          ) : (
            <>
              <div className="text-2xl font-bold">#{userRanks[activeTab] || "—"}</div>
              <p className="text-xs text-muted-foreground mt-1">{getTimeFrameLabel(activeTab)} ranking</p>
            </>
          )}
        </CardContent>
      </Card>

      <div className="my-4">
        <RecentTest />
        <DashboardStudyPlan />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="col-span-4 md:col-span-4">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Access key features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featureCards.map((feature) => (
                <Button
                  key={feature.name}
                  variant="outline"
                  className="h-24 w-full flex flex-col items-center justify-center text-center p-2"
                  asChild
                >
                  <a href={feature.href}>
                    <div className={`${feature.color} rounded-full p-3 mb-2`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-xs font-medium">{feature.name}</span>
                  </a>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
