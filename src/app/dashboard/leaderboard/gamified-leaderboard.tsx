"use client"

import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Award, Crown, Medal, Star, Timer, Trophy, User } from "lucide-react"
import { useEffect, useState } from "react"

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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem("Medical_User_Id")
      if (userId) {
        setLoggedInUserId(userId)
      }
      try {
        setLoading(true)
        const [leaderboardRes, userStatsRes] = await Promise.all([
          fetch("https://medical-backend-loj4.onrender.com/api/test/leaderboard"),
          fetch(`https://medical-backend-loj4.onrender.com/api/test/leaderboard/player/${userId}`),
        ])

        const leaderboardData = await leaderboardRes.json()
        const userStatsData = await userStatsRes.json()

        console.log(leaderboardData)
        console.log(userStatsData)

        if (leaderboardData.success) {
          setLeaderboard(leaderboardData.data.leaderboard)
        }
        if (userStatsData.success) {
          setUserStats(userStatsData.data)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-7xl mx-auto p-4">
      {/* User Stats - Now appears first */}
      {userStats && (
        <Card className="w-full md:w-80 p-6 order-first md:order-last">
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
                  <p className="font-medium">{userStats.player.name}</p>
                  <p className="text-sm text-muted-foreground">Rank #{userStats.rank}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-background">
                  <p className="text-sm text-muted-foreground mb-1">Score</p>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    <span className="text-lg font-bold">{userStats.player.score}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-background">
                  <p className="text-sm text-muted-foreground mb-1">Time</p>
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    <span className="text-lg font-bold">{formatTime(userStats.player.totalTime)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">Nearby Players</h4>
              <div className="space-y-2">
                {userStats.nearbyPlayers.map((player) => (
                  <div
                    key={player._id}
                    className={`p-2 rounded-lg ${
                      player.userId === loggedInUserId ? "bg-primary/10 dark:bg-primary/20" : "hover:bg-muted/50"
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
          </div>
        </Card>
      )}

      {/* Main Leaderboard */}
      <Card className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Contenders</h2>
          {/* <p className="text-sm text-muted-foreground">Top players worldwide</p> */}
        </div>

        <div className="relative">
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
                {leaderboard.map((entry, index) => (
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
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </Card>
    </div>
  )
}

