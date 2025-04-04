"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import axios from "axios"
import { Star } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface Mentor {
  _id: string
  name: string
  avatar: string
  title: string
  company: string
  expertise: string[]
  rating: number
  isActive: boolean
  reviews: Array<{
    userId: string
    comment: string
    rating: number
  }>
}

interface SuggestedMentorshipsProps {
  contextTag: string
  title?: string
  limit?: number
}

export function SuggestedMentorships({
  contextTag,
  title = "Suggested Mentors",
  limit = 3,
}: SuggestedMentorshipsProps) {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await axios.get("https://medical-backend-loj4.onrender.com/api/mentor")
        const mentorsData = response.data.data

        // Filter active mentors with matching expertise
        const filteredMentors = mentorsData
          .filter(
            (mentor: Mentor) =>
              mentor.isActive && mentor.expertise.some((exp) => exp.toLowerCase().includes(contextTag.toLowerCase())),
          )
          .slice(0, limit)

        setMentors(filteredMentors)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching suggested mentors:", error)
        setError("Failed to load suggested mentors")
        setLoading(false)
      }
    }

    fetchMentors()
  }, [contextTag, limit])

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          // Loading skeletons
          Array.from({ length: limit }).map((_, index) => (
            <div key={index} className="flex items-start space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-[150px]" />
              </div>
            </div>
          ))
        ) : mentors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No mentors found for this topic.</p>
        ) : (
          mentors.map((mentor) => (
            <div key={mentor._id} className="flex items-start space-x-4 pb-4 border-b last:border-0 last:pb-0">
              <Avatar className="h-10 w-10">
                <AvatarImage src={mentor.avatar || "/placeholder.svg"} alt={mentor.name} />
                <AvatarFallback>{mentor.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium leading-none">{mentor.name}</h4>
                <p className="text-xs text-muted-foreground mt-1 mb-1">{mentor.title}</p>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= mentor.rating ? "text-primary fill-primary" : "text-muted-foreground"
                      }`}
                    />
                  ))}
                  <span className="text-xs ml-1">{mentor.rating.toFixed(1)}</span>
                </div>
              </div>
              <Link href={`/dashboard/mentor/${mentor._id}`}>
                <Button size="sm" variant="outline">
                  View Profile
                </Button>
              </Link>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

