"use client"

import { Award, BarChart3, CheckCircle, Clock, RefreshCw } from "lucide-react"
import type React from "react"
import { useCallback, useEffect, useState } from "react"
import axios from "axios"
import toast from "react-hot-toast"

// Define proper types for the component props and data structures
interface Task {
  subject: string
  duration: number
  activity: string
}

interface Day {
  dayOfWeek: string
  tasks: Task[]
}

interface WeeklyPlan {
  weekNumber: number
  theme: string
  focusAreas: string[]
  days: Day[]
}

interface UserData {
  daysPerWeek: number
  name?: string
  email?: string
  preferences?: {
    studyTime?: string
    difficulty?: string
  }
}

interface TaskPerformance {
  weekNumber: number
  dayOfWeek: string
  subject: string
  activity: string
  status: "completed" | "incomplete" | "not-understood" | "skipped"
  taskId: string
  timestamp: number
}

interface PerformanceData {
  tasks: Record<string, TaskPerformance>
  lastUpdated: number
}

interface StudyProgressBarProps {
  weeklyPlans: WeeklyPlan[]
  userData: UserData
  planId?: string // Make planId optional to maintain compatibility
}

export const StudyProgressBar: React.FC<StudyProgressBarProps> = ({ weeklyPlans, userData, planId }) => {
  const [progress, setProgress] = useState<number>(0)
  const [completedTasks, setCompletedTasks] = useState<number>(0)
  const [totalTasks, setTotalTasks] = useState<number>(0)
  const [daysCompleted, setDaysCompleted] = useState<number>(0)
  const [totalDays, setTotalDays] = useState<number>(0)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [performanceData, setPerformanceData] = useState<PerformanceData>({ tasks: {}, lastUpdated: Date.now() })

  // Load performance data from database
  const loadPerformanceData = useCallback(async () => {
    try {
      if (planId) {
        const response = await fetch(`https://medical-backend-loj4.onrender.com/api/ai-planner/getTaskPerformance/${planId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Convert database format to component format
            const convertedData: PerformanceData = {
              tasks: result.taskPerformance || {},
              lastUpdated: Date.now()
            };
            setPerformanceData(convertedData);
          }
        }
      }
    } catch (error) {
      console.error("Error loading performance data:", error);
    }
  }, [planId]);

  // Wrap calculateProgress in useCallback to prevent it from being recreated on every render
  const calculateProgress = useCallback(() => {
    // Calculate total tasks and completed tasks
    let completed = 0
    let total = 0
    let completedDays = 0
    let totalDaysCount = 0

    // Track days that have at least one task
    const daysWithTasks = new Set<string>()
    const completedDaysSet = new Set<string>()

    // Count tasks from performance data
    if (performanceData && performanceData.tasks) {
      Object.values(performanceData.tasks).forEach((task: TaskPerformance) => {
        total++
        if (task.status === "completed") {
          completed++
        }

        // Track unique days
        const dayKey = `${task.weekNumber}-${task.dayOfWeek}`
        daysWithTasks.add(dayKey)

        // Check if all tasks for this day are completed
        const dayTasks = Object.values(performanceData.tasks).filter(
          (t: TaskPerformance) => t.weekNumber === task.weekNumber && t.dayOfWeek === task.dayOfWeek,
        )

        const allDayTasksCompleted = dayTasks.every((t: TaskPerformance) => t.status === "completed")
        if (allDayTasksCompleted) {
          completedDaysSet.add(dayKey)
        }
      })
    }

    // If no tasks in performance data yet, count from the study plan
    if (total === 0 && weeklyPlans) {
      weeklyPlans.forEach((week) => {
        if (week.days) {
          week.days.forEach((day: Day) => {
            if (day.tasks) {
              total += day.tasks.length

              // Track unique days
              const dayKey = `${week.weekNumber}-${day.dayOfWeek}`
              daysWithTasks.add(dayKey)
            }
          })
        }
      })
    }

    // Calculate days completed
    completedDays = completedDaysSet.size
    totalDaysCount = daysWithTasks.size

    // Calculate progress percentage
    let progressPercentage = 0
    if (total > 0) {
      progressPercentage = Math.round((completed / total) * 100)
    }

    setProgress(progressPercentage)
    setCompletedTasks(completed)
    setTotalTasks(total)
    setDaysCompleted(completedDays)
    setTotalDays(totalDaysCount)
  }, [weeklyPlans, performanceData])

  useEffect(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);

  useEffect(() => {
    calculateProgress()
  }, [calculateProgress])

  // Get color based on progress
  const getProgressColor = () => {
    if (progress < 30) return "bg-red-500"
    if (progress < 70) return "bg-amber-500"
    return "bg-green-500"
  }

  // Calculate estimated completion date
  const getEstimatedCompletionDate = () => {
    if (totalDays === 0 || daysCompleted === 0) return "Not available"

    const today = new Date()
    const daysLeft = totalDays - daysCompleted

    // Calculate days per week the user studies
    const daysPerWeek = userData.daysPerWeek || 5

    // Calculate weeks needed to complete remaining days
    const weeksNeeded = daysLeft / daysPerWeek

    // Add that many weeks to today
    const completionDate = new Date(today)
    completionDate.setDate(today.getDate() + weeksNeeded * 7)

    return completionDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // New function to refresh progress from calendar data
  const refreshFromCalendar = async () => {
    if (!planId) {
      toast.error("No plan ID available")
      return
    }

    setIsRefreshing(true)
    try {
      // Call the backend endpoint to refresh completion status
      const response = await axios.put(
        `https://medical-backend-loj4.onrender.com/api/ai-planner/refreshCompletionStatus/${planId}`
      )

      if (response.data.success) {
        // Reload performance data from database
        await loadPerformanceData()
        toast.success("Progress synced with calendar data")
      } else {
        toast.error(response.data.message || "Failed to update progress")
      }
    } catch (error) {
      console.error("Error refreshing completion status:", error)
      toast.error("Failed to sync progress with calendar data")
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <BarChart3 className="text-blue-500 mr-2" size={20} />
          <h3 className="font-semibold text-gray-800">Study Plan Progress</h3>
        </div>
        
        {/* Add refresh button when planId is available */}
        {planId && (
          <button
            onClick={refreshFromCalendar}
            disabled={isRefreshing}
            className="flex items-center px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={`mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Syncing..." : "Sync Progress"}
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Overall Progress</span>
          <span className="text-sm font-medium text-blue-600">{progress}% Complete</span>
        </div>
        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
          <div
            className={`h-3 ${getProgressColor()} transition-all duration-500 ease-out`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="text-blue-500 mr-2" size={18} />
            <div>
              <div className="text-sm text-gray-600">Tasks Completed</div>
              <div className="font-medium text-blue-700">
                {completedTasks} of {totalTasks}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center">
            <Clock className="text-blue-500 mr-2" size={18} />
            <div>
              <div className="text-sm text-gray-600">Days Completed</div>
              <div className="font-medium text-blue-700">
                {daysCompleted} of {totalDays}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center">
            <Award className="text-blue-500 mr-2" size={18} />
            <div>
              <div className="text-sm text-gray-600">Est. Completion</div>
              <div className="font-medium text-blue-700">{getEstimatedCompletionDate()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 italic">
        Progress is calculated based on completed tasks and study days. Click &quot;Sync Progress&quot; to update from calendar data.
      </div>
    </div>
  )
}