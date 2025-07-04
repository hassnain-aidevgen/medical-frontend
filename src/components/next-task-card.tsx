"use client"

import axios from "axios"
import { BookOpen, ChevronLeft, ChevronRight, Clock, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation" // Import useRouter

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"

// Define type for the API response
interface StudyPlanResponse {
  success: boolean
  message?: string
  studyPlan: StudyPlan | null
}

// Define type for the study plan data
interface StudyPlan {
  _id: string
  plan: {
    title: string
    weeklyPlans: WeeklyPlan[]
  }
  completionStatus: {
    overallProgress: number
    weeklyProgress: WeeklyProgress[]
  }
}

interface WeeklyPlan {
  weekNumber: number
  theme: string
  days: DayPlan[]
}

interface DayPlan {
  dayOfWeek: string
  date: string
  tasks: Task[]
  status: string
  completedTasks: number
  totalTasks: number
}

interface Task {
  subject: string
  duration: number
  activity: string
}

interface WeeklyProgress {
  weekNumber: number
  completed: boolean
  completedTasks: number
  totalTasks: number
}

export default function NextTaskCard({ userId, onNavigate }: { userId: string | null; onNavigate?: () => void }) {
  const router = useRouter() // Initialize router
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentWeek, setCurrentWeek] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<StudyPlanResponse | null>(null)

  useEffect(() => {
    const fetchActivePlan = async () => {
      if (!userId) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await axios.get<StudyPlanResponse>(
          `https://medical-backend-3eek.onrender.com/api/ai-planner/activePlan?userId=${userId}`,
        )
        setData(response.data)
      } catch (err: any) {
        console.error("Error fetching active plan:", err)

        if (err.response && err.response.status === 404) {
          setData({
            success: true,
            message: "No active study plan found. Create your study plan first.",
            studyPlan: null,
          })
        } else {
          setError("Failed to load study plan. Please try again later.")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivePlan()
  }, [userId])

  const studyPlan = data?.studyPlan
  const noActiveMessage = !studyPlan && data?.success ? data.message : null
  const errorMessage = error || (!data?.success && data?.message ? data.message : null)

  // Navigate to AI plan page
  const navigateToAIPlan = () => {
    router.push('/dashboard/study-planner') // Adjust the path as needed
  }

  // Format duration to hours and minutes
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}m` : ""}`
    }

    return `${mins}m`
  }

  // Get current week data
  const currentWeekData = studyPlan?.plan.weeklyPlans.find(w => w.weekNumber === currentWeek)
  const currentWeekProgress = studyPlan?.completionStatus.weeklyProgress.find(p => p.weekNumber === currentWeek)
  const totalWeeks = studyPlan?.plan.weeklyPlans.length || 0

  const handleOpenDialog = () => {
    setCurrentWeek(1) // Reset to first week when opening
    setDialogOpen(true)
  }

  return (
    <>
      <Card className="overflow-hidden border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Your Active AI Plan</CardTitle>
          <TrendingUp className="h-5 w-5 text-green-500" />
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : errorMessage ? (
            <div className="text-sm text-red-500">{errorMessage}</div>
          ) : noActiveMessage ? (
            <div className="text-sm">
              <span className="font-medium">📚 {noActiveMessage} </span>
              <span 
                className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium underline"
                onClick={navigateToAIPlan}
              >
                here
              </span>
            </div>
          ) : studyPlan ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm font-bold">{studyPlan.completionStatus.overallProgress}%</span>
                </div>
                <Progress 
                  value={studyPlan.completionStatus.overallProgress} 
                  className="h-2"
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 flex items-center justify-center text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                onClick={handleOpenDialog}
              >
                View Details
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No study plan available</div>
          )}
        </CardContent>
      </Card>

      {studyPlan && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Week {currentWeek}: {currentWeekData?.theme}</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {currentWeekProgress?.completedTasks || 0}/{currentWeekProgress?.totalTasks || 0} tasks
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Week Navigation */}
              {totalWeeks > 1 && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentWeek(prev => Math.max(1, prev - 1))}
                    disabled={currentWeek === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous Week
                  </Button>
                  
                  <span className="text-sm text-muted-foreground">
                    Week {currentWeek} of {totalWeeks}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentWeek(prev => Math.min(totalWeeks, prev + 1))}
                    disabled={currentWeek === totalWeeks}
                  >
                    Next Week
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}

              {/* Week Progress */}
              {currentWeekProgress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Week Progress</span>
                    <span className="font-bold">
                      {Math.round((currentWeekProgress.completedTasks / currentWeekProgress.totalTasks) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(currentWeekProgress.completedTasks / currentWeekProgress.totalTasks) * 100} 
                    className="h-3" 
                  />
                </div>
              )}

              {/* Daily Tasks */}
              <div className="space-y-4">
                <h4 className="font-medium">Daily Tasks</h4>
                {currentWeekData?.days.map((day, dayIdx) => (
                  <div key={dayIdx} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium">{day.dayOfWeek}</h5>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{day.date}</span>
                        <Badge variant={day.status === 'completed' ? 'default' : 'secondary'}>
                          {day.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {day.tasks.map((task, taskIdx) => (
                        <div key={taskIdx} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h6 className="font-medium text-sm">{task.subject}</h6>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{formatDuration(task.duration)}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{task.activity}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="sm:justify-between">
              <DialogClose asChild>
                <Button variant="outline" size="sm">
                  Close
                </Button>
              </DialogClose>
              <Button size="sm" onClick={onNavigate}>
                Manage Study Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}