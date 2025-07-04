"use client"

import { useEffect, useState } from "react"
import { generateMockBadges } from "./badge-utils"
import LeaderboardLayout from "./leaderboard-layout"
import type { Badge, LeaderboardEntry } from "./types"

export default function LeaderboardPage() {
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null)
  const [leaderboardData, setLeaderboardData] = useState<{
    weekly: LeaderboardEntry[]
    monthly: LeaderboardEntry[]
    "all-time": LeaderboardEntry[]
  }>({
    weekly: [],
    monthly: [],
    "all-time": [],
  })
  const [userBadges, setUserBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const userId = localStorage.getItem("Medical_User_Id")
    if (userId) {
      setLoggedInUserId(userId)
    }

    // Fetch leaderboard data
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true)

        // Fetch all-time leaderboard
        const allTimeRes = await fetch(
          `https://medical-backend-3eek.onrender.com/api/test/leaderboard2?timeFrame=all-time`,
        )

        if (allTimeRes.ok) {
          const allTimeData = await allTimeRes.json()
          if (allTimeData.success) {
            setLeaderboardData((prev) => ({
              ...prev,
              "all-time": allTimeData.data.leaderboard,
            }))

            // Generate mock badges based on user's score if logged in
            if (userId) {
              const userEntry = allTimeData.data.leaderboard.find((entry: LeaderboardEntry) => entry.userId === userId)
              if (userEntry) {
                const badges = generateMockBadges(userId, userEntry.score)
                setUserBadges(badges)
              }
            }
          }
        }

        // Fetch weekly leaderboard
        const weeklyRes = await fetch(
          `https://medical-backend-3eek.onrender.com/api/test/leaderboard2?timeFrame=weekly`,
        )

        if (weeklyRes.ok) {
          const weeklyData = await weeklyRes.json()
          if (weeklyData.success) {
            setLeaderboardData((prev) => ({
              ...prev,
              weekly: weeklyData.data.leaderboard,
            }))
          }
        }

        // Fetch monthly leaderboard
        const monthlyRes = await fetch(
          `https://medical-backend-3eek.onrender.com/api/test/leaderboard2?timeFrame=monthly`,
        )

        if (monthlyRes.ok) {
          const monthlyData = await monthlyRes.json()
          if (monthlyData.success) {
            setLeaderboardData((prev) => ({
              ...prev,
              monthly: monthlyData.data.leaderboard,
            }))
          }
        }
      } catch (error) {
        console.error("Error fetching leaderboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboardData()
  }, [])

  if (loading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return <LeaderboardLayout loggedInUserId={loggedInUserId} leaderboardData={leaderboardData} userBadges={userBadges} />
}