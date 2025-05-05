"use client"

import axios from "axios"
import { BookOpen, Calendar, ChevronRight, Clock } from "lucide-react"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"

// Define type for the API response
interface NextTaskResponse {
  success: boolean
  message?: string
  nextTask: NextTask | null
}

// Define type for the next task data
interface NextTask {
  weekNumber: number
  dayOfWeek: string
  subject: string
  focusAreas: string[]
  activity: string
  durationMinutes: number
  resources: {
    name: string
    type: string
    description: string
  }[]
  isToday: boolean
}

export default function NextTaskCard({ userId, onNavigate }: { userId: string | null; onNavigate?: () => void }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<NextTaskResponse | null>(null)

  useEffect(() => {
    const fetchNextTask = async () => {
      if (!userId) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await axios.get<NextTaskResponse>(
          `https://medical-backend-loj4.onrender.com/api/ai-planner/nextTask?userId=${userId}`,
        )
        setData(response.data)
      } catch (err: any) {
        console.error("Error fetching next task:", err)

        // Check if this is a 404 (no tasks found) vs other errors
        if (err.response && err.response.status === 404) {
          setData({
            success: true,
            message: "No tasks available yet. Create your study plan first.",
            nextTask: null,
          })
        } else {
          setError("Failed to load task. Please try again later.")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchNextTask()
  }, [userId])

  const taskData = data?.nextTask
  const completedMessage = !taskData && data?.success ? data.message : null
  const errorMessage = error || (!data?.success && data?.message ? data.message : null)

  // Format duration to hours and minutes
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}m` : ""}`
    }

    return `${mins}m`
  }

  return (
    <>
      <Card className="overflow-hidden border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Next Study Task</CardTitle>
          <BookOpen className="h-5 w-5 text-green-500" />
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : errorMessage ? (
            <div className="text-sm text-red-500">{errorMessage}</div>
          ) : completedMessage ? (
            <div className="text-sm">
              <span className="font-medium">🎉 {completedMessage}</span>
            </div>
          ) : taskData ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">{taskData.subject}</h3>
                {taskData.isToday && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Today
                  </Badge>
                )}
              </div>

              {/* <p className="text-sm text-muted-foreground line-clamp-2">{taskData.activity}</p> */}

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDuration(taskData.durationMinutes)}</span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 flex items-center justify-center text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                onClick={() => setDialogOpen(true)}
              >
                View Details
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No tasks available</div>
          )}
        </CardContent>
      </Card>

      {taskData && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{taskData.subject}</span>
                {taskData.isToday && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Today
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-base font-medium pt-2">{taskData.activity}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Week {taskData.weekNumber} • {taskData.dayOfWeek}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDuration(taskData.durationMinutes)}</span>
                </div>
              </div>

              {taskData.focusAreas && taskData.focusAreas.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Focus Areas:</h4>
                  <div className="flex flex-wrap gap-1">
                    {taskData.focusAreas.map((area, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {taskData.resources && taskData.resources.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-3 border-b">
                    <h4 className="text-sm font-medium text-gray-800">Resources</h4>
                  </div>
                  <div className="p-3 space-y-3">
                    {taskData.resources.map((resource, idx) => (
                      <div key={idx} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                        <div className="font-medium text-sm">{resource.name}</div>
                        {resource.type && (
                          <div className="text-xs text-muted-foreground mt-0.5">Type: {resource.type}</div>
                        )}
                        {resource.description && (
                          <div className="text-xs text-muted-foreground mt-1">{resource.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="sm:justify-between">
              <DialogClose asChild>
                <Button variant="outline" size="sm">
                  Close
                </Button>
              </DialogClose>
              <Button size="sm" onClick={onNavigate}>
                View Study Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
