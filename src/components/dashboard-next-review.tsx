"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"
import { useEffect, useState } from "react"
import axios from "axios"

interface Review {
  _id: string
  title: string
  type: "daily" | "other"
  scheduledFor: string
  stage: number
}

export default function DashboardNextReview() {
  const [nextReview, setNextReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNextReview = async () => {
      try {
        setLoading(true)
        setError(null)

        const userId = localStorage.getItem("Medical_User_Id")
        if (!userId) {
          setError("User ID not found")
          setLoading(false)
          return
        }

        const response = await axios.get(
          `https://medical-backend-loj4.onrender.com/api/reviews/dashboard?userId=${userId}`,
        )

        if (response.data && response.data.upcomingReviews && response.data.upcomingReviews.length > 0) {
          setNextReview(response.data.upcomingReviews[0])
        }

        setLoading(false)
      } catch (error) {
        console.error("Failed to fetch next review:", error)
        setError("Failed to load next review")
        setLoading(false)
      }
    }

    fetchNextReview()
  }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Pending Next Review</CardTitle>
        <Clock className="h-6 w-6 text-blue-500" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-2xl font-bold">Loading...</div>
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : nextReview ? (
          <>
            <div className="text-2xl font-bold">
              {new Date(nextReview.scheduledFor).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <p className="text-xs text-muted-foreground">{new Date(nextReview.scheduledFor).toLocaleDateString()}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{nextReview.title || "Review session"}</p>
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">No upcoming reviews</div>
            <p className="text-xs text-muted-foreground">Schedule a review session</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
