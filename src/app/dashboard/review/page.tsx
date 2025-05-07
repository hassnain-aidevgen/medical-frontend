"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import axios from "axios"
import { BarChart3, Calendar, Clock, RefreshCw, Settings, Trophy, BookOpen, Filter } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { toast, Toaster } from "react-hot-toast"
import FlashcardChallengeMode from "./challenge-mode-session"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import VisualSummariesComponent from "./infographic-suggestions"

export default function ReviewDashboard() {
  interface Review {
    _id: string
    title: string
    type: "daily" | "other"
    scheduledFor: string
    stage: number
    isTestReview: boolean
    flashcardIds?: string[]
    description?: string
    completed?: boolean
  }

  interface DashboardStats {
    completionRate: number
    totalReviews: number
    completedReviews: number
    upcomingReviews: Review[]
  }

  const [stats, setStats] = useState<DashboardStats>({
    completionRate: 0,
    totalReviews: 0,
    completedReviews: 0,
    upcomingReviews: [],
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showChallengeMode, setShowChallengeMode] = useState(false)
  const [user1Id, setUser1Id] = useState<string>("")
  const [latestSessions, setLatestSessions] = useState<Review[]>([])
  const [otherSessions, setOtherSessions] = useState<Review[]>([])
  const [timeFrame, setTimeFrame] = useState<string>("all")

  // Modified fetchDashboardData function to include timeFrame
  const fetchDashboardData = useCallback(async () => {
    try {
      const userId = localStorage.getItem("Medical_User_Id")
      setUser1Id(userId || "")

      if (!loading) setRefreshing(true)
      else setLoading(true)

      // Get all review sessions, including test-specific ones
      const sessionsResponse = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/reviews/sessions?userId=${userId}`)

      // Process review sessions data
      const allReviews = sessionsResponse.data.map(
        (session: {
          _id: any
          title: string | string[]
          type: any
          scheduledFor: any
          stage: any
          flashcardIds: any
          description: any
          completed: any
        }) => ({
          _id: session._id,
          title: session.title,
          type: session.type,
          scheduledFor: session.scheduledFor,
          stage: session.stage,
          flashcardIds: session.flashcardIds,
          description: session.description,
          completed: session.completed,
          isTestReview: session.title.includes("Test Review"),
        }),
      )

      // Sort sessions by scheduled date (most recent first)
      const sortedReviews = allReviews.sort(
        (a: { scheduledFor: string | number | Date }, b: { scheduledFor: string | number | Date }) => {
          const dateA = new Date(a.scheduledFor).getTime()
          const dateB = new Date(b.scheduledFor).getTime()
          return dateA - dateB // Ascending order - soonest first
        },
      )

      // Get other review metrics with timeFrame
      const reviewLaterResponse = await axios.get(
        `https://medical-backend-loj4.onrender.com/api/reviews/review-later-count?userId=${userId}&timeFrame=${timeFrame}`,
      )

      const completedResponse = await axios.get(
        `https://medical-backend-loj4.onrender.com/api/reviews/completed-count?userId=${userId}&timeFrame=${timeFrame}`,
      )

      // Extract values
      const completedReviews = completedResponse.data.completedReviews || 0
      const reviewLaterCount = reviewLaterResponse.data.reviewLaterCount || 0

      // Calculate total reviews
      const totalReviews = completedReviews + reviewLaterCount

      // Calculate completion rate
      const completionRate = totalReviews > 0 ? Math.round((completedReviews / totalReviews) * 100) : 0

      // Filter upcoming sessions based on completion status
      const upcomingSessions = sortedReviews.filter((r: { completed: any }) => !r.completed)

      setLatestSessions(upcomingSessions)
      setOtherSessions([])

      setStats({
        completionRate,
        totalReviews,
        completedReviews,
        upcomingReviews: sortedReviews,
      })

      setLoading(false)
      setRefreshing(false)
    } catch (error) {
      toast.error("Failed to load dashboard data")
      console.log(error)
      setLoading(false)
      setRefreshing(false)
    }
  }, [loading, timeFrame])

  useEffect(() => {
    fetchDashboardData()

    const handleFocus = () => {
      fetchDashboardData()
    }

    window.addEventListener("focus", handleFocus)

    return () => {
      window.removeEventListener("focus", handleFocus)
    }
  }, [fetchDashboardData])

  const handleTimeFrameChange = (value: string) => {
    setTimeFrame(value)
    // Fetch data will be triggered by the useEffect when timeFrame changes
  }

  const startChallengeMode = () => {
    setShowChallengeMode(true)
  }

  const redirectToSession = (sessionId: string) => {
    window.location.href = `/dashboard/review/session/${sessionId}`
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (showChallengeMode) {
    return <FlashcardChallengeMode />
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Review Dashboard</h1>
          <div className="flex gap-2">
            <Button onClick={startChallengeMode} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700">
              <Trophy className="h-4 w-4 text-yellow-100" />
              Start Challenge Mode
            </Button>
          </div>
        </div>

        {/* Time frame filter */}
        <div className="flex justify-end mb-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by: </span>
            <Select value={timeFrame} onValueChange={handleTimeFrameChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completionRate}%</div>
              <Progress value={stats.completionRate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {timeFrame !== "all"
                  ? `Filtered by: ${
                      timeFrame === "today"
                        ? "Today"
                        : timeFrame === "week"
                          ? "This Week"
                          : timeFrame === "month"
                            ? "This Month"
                            : "This Year"
                    }`
                  : "All time"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReviews}</div>
              <p className="text-xs text-muted-foreground">{stats.completedReviews} completed</p>
              <p className="text-xs text-muted-foreground mt-1">
                {timeFrame !== "all" &&
                  `Filtered by: ${
                    timeFrame === "today"
                      ? "Today"
                      : timeFrame === "week"
                        ? "This Week"
                        : timeFrame === "month"
                          ? "This Month"
                          : "This Year"
                  }`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.upcomingReviews && stats.upcomingReviews[0]
                  ? new Date(stats.upcomingReviews[0].scheduledFor).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "No upcoming reviews"}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.upcomingReviews && stats.upcomingReviews[0]
                  ? new Date(stats.upcomingReviews[0].scheduledFor).toLocaleDateString()
                  : "Schedule a review session"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Review Settings</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm">Intervals: 24h, 7d, 30d</div>
              <p className="text-xs text-muted-foreground">Based on Ebbinghaus curve</p>
            </CardContent>
          </Card>
        </div>

        {/* Latest Review Sessions Section */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">All Review Sessions</h2>
            <Button size="sm" onClick={fetchDashboardData} disabled={refreshing} className="flex items-center gap-1">
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {latestSessions.length === 0 ? (
            <Card className="bg-muted p-8 text-center">
              <CardContent>
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Review Sessions</h3>
                <p className="text-sm text-muted-foreground mt-2">You don&apos;t have any scheduled review sessions yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
              {latestSessions.map((session, index) => (
                <Card
                  key={session._id}
                  className={
                    session.isTestReview
                      ? "border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100"
                      : "border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100"
                  }
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-md">{session.title}</CardTitle>
                        <CardDescription>
                          Scheduled for {new Date(session.scheduledFor).toLocaleDateString()},{" "}
                          {new Date(session.scheduledFor).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </CardDescription>
                      </div>
                      <Badge className={session.isTestReview ? "bg-blue-500" : "bg-amber-500"}>
                        Session {index + 1}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">Stage {session.stage}</Badge>
                      <Badge variant="outline">{session.type}</Badge>
                      {session.isTestReview && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-600">
                          Test Review
                        </Badge>
                      )}
                    </div>
                    <p className="mt-4 text-sm">
                      {session.description || `${session.flashcardIds?.length || 0} flashcards to review.`}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => redirectToSession(session._id)}
                      className={`w-full ${
                        session.isTestReview ? "bg-blue-600 hover:bg-blue-700" : "bg-amber-600 hover:bg-amber-700"
                      }`}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Start Review
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Infographics Section - Direct display without tabs */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Infographics</CardTitle>
              <CardDescription>Visual learning aids for your most challenging topics</CardDescription>
            </CardHeader>
            <CardContent>
              <VisualSummariesComponent />
            </CardContent>
          </Card>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  )
}
