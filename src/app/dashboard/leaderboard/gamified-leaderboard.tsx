"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, Crown, Medal, Share2, Star, Timer, Trophy, User } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

interface LeaderboardEntry {
  _id: string
  userId: string
  name: string
  score: number
  totalTime: number
  rank?: number
}

interface UserStats {
  rank: number
  player: LeaderboardEntry
  nearbyPlayers: LeaderboardEntry[]
}

export default function GamifiedLeaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<{
    weekly: LeaderboardEntry[]
    monthly: LeaderboardEntry[]
    "all-time": LeaderboardEntry[]
  }>({
    weekly: [],
    monthly: [],
    "all-time": [],
  })

  const [userStatsData, setUserStatsData] = useState<{
    weekly: UserStats | null
    monthly: UserStats | null
    "all-time": UserStats | null
  }>({
    weekly: null,
    monthly: null,
    "all-time": null,
  })

  const [loading, setLoading] = useState<{
    weekly: boolean
    monthly: boolean
    "all-time": boolean
  }>({
    weekly: true,
    monthly: true,
    "all-time": true,
  })

  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"weekly" | "monthly" | "all-time">("all-time")
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  const fetchLeaderboardData = useCallback(
    async (timeFrame: "weekly" | "monthly" | "all-time") => {
      try {
        setLoading((prev) => ({ ...prev, [timeFrame]: true }))

        const userId = localStorage.getItem("Medical_User_Id")
        if (userId && !loggedInUserId) {
          setLoggedInUserId(userId)
        }

        // Fetch leaderboard data
        const leaderboardRes = await fetch(
          `https://medical-backend-loj4.onrender.com/api/test/leaderboard?timeFrame=${timeFrame}`,
        )

        if (!leaderboardRes.ok) {
          throw new Error(`Failed to fetch leaderboard data: ${leaderboardRes.status}`)
        }

        const leaderboardData = await leaderboardRes.json()

        if (leaderboardData.success) {
          setLeaderboardData((prev) => ({
            ...prev,
            [timeFrame]: leaderboardData.data.leaderboard,
          }))
        }

        // Fetch user stats if user is logged in
        if (userId) {
          const userStatsRes = await fetch(
            `https://medical-backend-loj4.onrender.com/api/test/leaderboard/player/${userId}?timeFrame=${timeFrame}`,
          )

          if (userStatsRes.ok) {
            const userStatsData = await userStatsRes.json()

            if (userStatsData.success) {
              setUserStatsData((prev) => ({
                ...prev,
                [timeFrame]: userStatsData.data,
              }))
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching ${timeFrame} data:`, error)
      } finally {
        setLoading((prev) => ({ ...prev, [timeFrame]: false }))
      }
    },
    [loggedInUserId],
  )

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      // Load all-time data first
      await fetchLeaderboardData("all-time")
      setInitialLoadComplete(true)
    }

    loadInitialData()
  }, [fetchLeaderboardData])

  // Load data for the active tab when it changes
  useEffect(() => {
    if (initialLoadComplete && activeTab !== "all-time") {
      fetchLeaderboardData(activeTab)
    }
  }, [activeTab, fetchLeaderboardData, initialLoadComplete])

  const formatTime = (totalTime: number) => {
    const minutes = Math.floor(totalTime / 60)
    const seconds = totalTime % 60
    return `${minutes}m ${seconds}s`
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return null
    }
  }

  const getRowStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/10 to-transparent dark:from-yellow-950/50 dark:to-transparent"
      case 2:
        return "bg-gradient-to-r from-gray-300/10 to-transparent dark:from-gray-800/50 dark:to-transparent"
      case 3:
        return "bg-gradient-to-r from-amber-500/10 to-transparent dark:from-amber-950/50 dark:to-transparent"
      default:
        return ""
    }
  }

  const getTimeFrameLabel = () => {
    switch (activeTab) {
      case "weekly":
        return "This Week"
      case "monthly":
        return "This Month"
      case "all-time":
        return "All Time"
      default:
        return "All Time"
    }
  }

  const shareProgress = () => {
    const currentUserStats = userStatsData[activeTab]
    const rank = currentUserStats?.rank || "N/A"
    const score = currentUserStats?.player?.score || 0
    const text = `I'm currently ranked #${rank} with a score of ${score} in the Medical Quiz ${getTimeFrameLabel()} leaderboard! Can you beat my score?`
    const url = window.location.href

    if (navigator.share) {
      navigator
        .share({
          title: "My Medical Quiz Progress",
          text: text,
          url: url,
        })
        .catch((error) => console.log("Error sharing:", error))
    } else {
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
      window.open(shareUrl, "_blank")
    }
  }

  // Get current data based on active tab
  const currentLeaderboard = leaderboardData[activeTab] || []
  const currentUserStats = userStatsData[activeTab]
  const isCurrentTabLoading = loading[activeTab]

  if (!initialLoadComplete) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-7xl mx-auto p-4">
      {/* User Stats Card - Always displayed regardless of test status */}
      <Card className="w-full md:w-96 p-6 order-first md:order-last">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold">Your Stats</h3>
            <p className="text-sm text-muted-foreground">Current ranking and nearby players</p>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">{currentUserStats?.player?.name || "Not Available"}</p>
                <p className="text-sm text-muted-foreground">
                  {currentUserStats ? `Rank #${currentUserStats.rank}` : "Take a test to get ranked!"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-background">
                <p className="text-sm text-muted-foreground mb-1">Score</p>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="text-lg font-bold">{currentUserStats?.player?.score || 0}</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-background">
                <p className="text-sm text-muted-foreground mb-1">Time</p>
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-bold">
                    {currentUserStats?.player?.totalTime ? formatTime(currentUserStats.player.totalTime) : "0m 0s"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Sharing Buttons */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-medium">Share Your Progress</h4>
            <Button onClick={shareProgress} className="w-full flex items-center justify-center gap-2">
              <Share2 className="h-4 w-4" />
              Share My Progress
            </Button>
            <div className="flex flex-col gap-2 justify-between">
              <button
                onClick={() =>
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I scored ${currentUserStats?.player?.score || 0} points on the Medical Quiz! Can you beat my score?`)}&url=${encodeURIComponent(window.location.href)}`,
                    "_blank",
                  )
                }
                className="flex-1 flex items-center justify-center gap-2 p-2 rounded-md bg-[#1DA1F2] text-white hover:bg-[#1a91da] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
                Twitter
              </button>
              <button
                onClick={() =>
                  window.open(
                    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
                    "_blank",
                  )
                }
                className="flex-1 flex items-center justify-center gap-2 p-2 rounded-md bg-[#1877F2] text-white hover:bg-[#166fe5] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
                Facebook
              </button>
              <button
                onClick={() =>
                  window.open(
                    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
                    "_blank",
                  )
                }
                className="flex-1 flex items-center justify-center gap-2 p-2 rounded-md bg-[#0A66C2] text-white hover:bg-[#0958a7] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
                LinkedIn
              </button>
            </div>
          </div>

          {currentUserStats && currentUserStats.nearbyPlayers && currentUserStats.nearbyPlayers.length > 0 ? (
            <div>
              <h4 className="text-sm font-medium mb-3">Nearby Players</h4>
              <div className="space-y-2">
                {currentUserStats.nearbyPlayers.map((player) => (
                  <div
                    key={player._id}
                    className={`p-2 rounded-lg ${player.userId === loggedInUserId ? "bg-primary/10 dark:bg-primary/20" : "hover:bg-muted/50"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">#{player.rank}</span>
                        <span className="text-sm">{player.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-3 w-3 text-primary" />
                        <span className="text-sm font-medium">{player.score}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <p className="text-sm text-muted-foreground">
                {isCurrentTabLoading
                  ? "Loading nearby players..."
                  : "Take a test to see how you compare with other players!"}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Main Leaderboard */}
      <Card className="flex-1 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold">Contenders</h2>
            <p className="text-sm text-muted-foreground">See whos leading the pack</p>
          </div>
        </div>

        <Tabs
          defaultValue="all-time"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "weekly" | "monthly" | "all-time")}
        >
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="all-time">All Time</TabsTrigger>
          </TabsList>

          <div className="relative">
            {isCurrentTabLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-md">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            )}

            <ScrollArea className="h-[600px] w-full rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <TableRow>
                    <TableHead className="w-20">Rank</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentLeaderboard.length > 0 ? (
                    currentLeaderboard.map((entry, index) => (
                      <TableRow
                        key={entry._id}
                        className={`${getRowStyle(index + 1)} ${entry.userId === loggedInUserId ? "border-l-2 border-primary" : ""}`}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getRankIcon(index + 1)}
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {index < 3 && <Crown className="h-4 w-4 text-primary" />}
                            {entry.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Star className="h-4 w-4 text-primary" />
                            {entry.score}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Timer className="h-4 w-4 text-muted-foreground" />
                            {formatTime(entry.totalTime)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <p className="text-muted-foreground">
                          {isCurrentTabLoading
                            ? "Loading leaderboard data..."
                            : "No data available for this time period"}
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </Tabs>
      </Card>
    </div>
  )
}

