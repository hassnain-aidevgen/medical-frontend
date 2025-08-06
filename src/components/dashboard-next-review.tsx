"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from 'lucide-react'
import { useEffect, useState } from "react"
import axios from "axios"

interface Review {
  _id: string
  title: string
  type: "daily" | "other"
  scheduledFor: string
  stage: number
  flashcardIds: any
  description: any
  completed: any
  isTestReview: boolean
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
          `https://medical-backend-3eek.onrender.com/api/test/reviews/sessions?userId=${userId}`,
        )

        const allReviews = response.data.map(
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

        // Filter upcoming sessions based on completion status
        const upcomingSessions = sortedReviews.filter((r: { completed: any }) => !r.completed)

        if (upcomingSessions.length > 0) {
          setNextReview(upcomingSessions[0])
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