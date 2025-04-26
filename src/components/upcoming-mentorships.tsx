"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { CalendarClock, Video, History, RefreshCw, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Define types for our API response
interface Mentor {
  _id: string
  name: string
  avatar?: string
}

interface Mentorship {
  _id: string
  title: string
  duration: string
}

interface MentorshipSession {
  _id: string
  mentorshipId: string
  mentorship?: Mentorship
  mentorId: string
  mentor?: Mentor
  date: string
  time: string
  meetingLink?: string
  status?: string
}

export default function MentorshipsWidget() {
  const [sessions, setSessions] = useState<MentorshipSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  const fetchMentorshipSessions = async () => {
    try {
      setLoading(true)
      const userId = localStorage.getItem("Medical_User_Id") || "67add3cce1f30e04deae372a"

      const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/bookings/user?userId=${userId}`)

      if (response.data.success) {
        console.log("API Response:", response.data)
        setSessions(response.data.data || [])
      } else {
        setError("Failed to load mentorship sessions")
      }
    } catch (error: any) {
      console.error("Error fetching mentorship sessions:", error)
      setError(`Error: ${error.response?.data?.message || error.message || "Failed to connect to server"}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMentorshipSessions()
  }, [])

  // Loading state
  if (loading && sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mentorships</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[100px] w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Mentorships</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchMentorshipSessions}
          disabled={loading}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          <span className="sr-only md:not-sr-only md:inline-block">Refresh</span>
        </Button>
      </CardHeader>
      <CardContent>
        {/* Error state */}
        {error && (
          <div className="mb-4 p-3 border border-destructive/50 rounded-md bg-destructive/10 text-sm">
            {error}
            <div className="mt-2">
              <Button size="sm" variant="outline" onClick={fetchMentorshipSessions} disabled={loading}>
                Try Again
              </Button>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="all" className="flex-1">
              All Sessions
              {sessions.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {sessions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CalendarClock className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No mentorship sessions found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session._id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">
                          {session.mentorship?.title || "Mentorship Session"}
                        </h3>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <CalendarClock className="h-3 w-3 mr-1" />
                          {session.date} at {session.time}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {session.mentorship?.duration || "30 min"}
                      </Badge>
                    </div>

                    <div className="flex items-center mb-3">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage 
                          src={(session.mentor && session.mentor.avatar) || "/placeholder.svg"} 
                          alt={(session.mentor && session.mentor.name) || "Mentor"} 
                        />
                        <AvatarFallback>
                          {session.mentor && session.mentor.name 
                            ? session.mentor.name.charAt(0) 
                            : "M"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-xs">{session.mentor?.name || "Mentor"}</div>
                    </div>

                    {session.meetingLink ? (
                      <Button size="sm" className="w-full" asChild>
                        <a href={session.meetingLink} target="_blank" rel="noopener noreferrer">
                          <Video className="mr-2 h-3 w-3" />
                          Join Meeting
                        </a>
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="w-full" asChild>
                        <Link href="/dashboard/mentor">
                          <Users className="mr-2 h-3 w-3" />
                          View More Mentors
                        </Link>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}