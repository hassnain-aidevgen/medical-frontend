"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import axios from "axios"
import { PiRankingDuotone } from "react-icons/pi"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type TimeFrame = "weekly" | "monthly" | "all-time"

interface LeaderboardRankProps {
  userId: string | null
}

export default function LeaderboardRank({ userId }: LeaderboardRankProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TimeFrame>("all-time")
  const [userRanks, setUserRanks] = useState<Record<TimeFrame, number | null>>({
    weekly: null,
    monthly: null,
    "all-time": null
  })
  const [isLoading, setIsLoading] = useState<Record<TimeFrame, boolean>>({
    weekly: false,
    monthly: false,
    "all-time": true
  })

  useEffect(() => {
    if (!userId) return

    // Fetch the initial all-time rank
    fetchUserRank("all-time")
  }, [userId])

  // When tab changes, fetch data if needed
  useEffect(() => {
    if (!userId) return
    
    if (userRanks[activeTab] === null && !isLoading[activeTab]) {
      fetchUserRank(activeTab)
    }
  }, [activeTab, userId, userRanks, isLoading])

  const fetchUserRank = async (timeFrame: TimeFrame) => {
    if (!userId) return

    setIsLoading(prev => ({ ...prev, [timeFrame]: true }))
    
    try {
      const response = await axios.get(
        `https://medical-backend-3eek.onrender.com/api/test/leaderboard/player/${userId}?timeFrame=${timeFrame}`
      )

      if (response.data && response.data.success) {
        setUserRanks(prev => ({
          ...prev,
          [timeFrame]: response.data.data.rank || null
        }))
      }
    } catch (error) {
      console.error(`Error fetching ${timeFrame} rank:`, error)
    } finally {
      setIsLoading(prev => ({ ...prev, [timeFrame]: false }))
    }
  }

  const navigateToLeaderboard = () => {
    router.push(`/dashboard/leaderboard?tab=${activeTab}`)
  }

  const getTimeFrameLabel = (timeFrame: TimeFrame) => {
    switch (timeFrame) {
      case "weekly": return "Weekly"
      case "monthly": return "Monthly" 
      case "all-time": return "All-Time"
    }
  }

  return (
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
        
        {isLoading[activeTab] ? (
          <div className="text-2xl font-bold">Loading...</div>
        ) : (
          <>
            <div className="text-2xl font-bold">#{userRanks[activeTab] || "—"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {getTimeFrameLabel(activeTab)} ranking
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}