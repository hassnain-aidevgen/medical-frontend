"use client"

import { Award, BarChart3, CheckCircle, Clock, RefreshCw } from "lucide-react"
import type React from "react"
import { useCallback, useEffect, useState } from "react"
import axios from "axios"

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

interface ProgressApiResponse {
  success: boolean
  data: {
    planId: string
    overallProgress: number
    completedTasks: number
    totalTasks: number
    daysCompleted: number
    totalDays: number
    weeklyProgress: any[]
  }
}

interface StudyProgressBarProps {
  weeklyPlans: WeeklyPlan[]
  userData: UserData
  planId?: string // Optional prop for specific plan ID
}

// Keep this at the module level (outside the component)
let forceUpdateCallback: (() => void) | null = null

// Keep this exported function intact
export function forceProgressUpdate() {
  console.log("Forcing progress update via direct function call")

  // First try to use the callback if it's registered
  if (forceUpdateCallback) {
    console.log("Using registered callback to update progress")
    forceUpdateCallback()
    return
  }

  // Fallback to dispatching an event
  console.log("No callback registered, dispatching event instead")
  const event = new CustomEvent("studyPlanProgressUpdated", {
    detail: { updatedAt: Date.now() },
  })
  window.dispatchEvent(event)
}

export const StudyProgressBar: React.FC<StudyProgressBarProps> = ({ 
  weeklyPlans, 
  userData,
  planId: propPlanId // Renamed to avoid shadowing
}) => {
  const [progress, setProgress] = useState<number>(0)
  const [completedTasks, setCompletedTasks] = useState<number>(0)
  const [totalTasks, setTotalTasks] = useState<number>(0)
  const [daysCompleted, setDaysCompleted] = useState<number>(0)
  const [totalDays, setTotalDays] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())
  const [apiError, setApiError] = useState<string | null>(null)
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(propPlanId || null)

  // Function to fetch progress data from the API
  const fetchProgressFromAPI = useCallback(async () => {
    console.log("=== FETCHING PROGRESS DATA FROM API ===")
    setIsLoading(true)
    setApiError(null)

    try {
      // Use cache-busting parameter
      const cacheBuster = new Date().getTime()
      
      // Determine which endpoint to use based on whether we have a specific plan ID
      let url: string
      
      if (propPlanId) {
        console.log("Using provided plan ID:", propPlanId)
        url = `http://localhost:5000/api/test/study-progress/${propPlanId}?_=${cacheBuster}`
      } else {
        console.log("Fetching active study plan progress")
        url = `http://localhost:5000/api/test/current-study-progress?_=${cacheBuster}`
      }

      console.log("Fetching from URL:", url)

      // Fetch progress data from the API
      const response = await axios.get<ProgressApiResponse>(url)

      console.log("API RESPONSE FULL DATA:", JSON.stringify(response.data, null, 2))

      if (response.data.success) {
        const data = response.data.data

        console.log("Progress data received:", {
          planId: data.planId,
          overallProgress: data.overallProgress,
          completedTasks: data.completedTasks,
          totalTasks: data.totalTasks,
          daysCompleted: data.daysCompleted,
          totalDays: data.totalDays,
          weeklyProgressLength: data.weeklyProgress?.length || 0,
        })

        // Save the plan ID for reference
        if (data.planId && !propPlanId) {
          setCurrentPlanId(data.planId)
          // Optionally store in localStorage if needed elsewhere in the app
          localStorage.setItem("currentPlanId", data.planId)
        }

        // Update state with data from the API
        setProgress(data.overallProgress || 0)
        setCompletedTasks(data.completedTasks || 0)
        setTotalTasks(data.totalTasks || 0)
        setDaysCompleted(data.daysCompleted || 0)
        setTotalDays(data.totalDays || 0)

        console.log("Progress data updated from API")
      } else {
        console.error("API returned error:", response.data)
        setApiError("API returned an error")
      }
    } catch (error: any) {
      console.error("Error fetching progress data:", error)
      setApiError(error.response?.data?.message || "Failed to fetch progress data")
    } finally {
      setIsLoading(false)
    }
  }, [propPlanId])

  // Register the callback when the component mounts
  useEffect(() => {
    console.log("Component mounted - registering force update callback")

    // Register the callback for direct updates
    forceUpdateCallback = () => {
      console.log("Force update callback triggered")
      setLastUpdate(Date.now())
    }

    // Initial data fetch
    fetchProgressFromAPI()

    // Clean up when component unmounts
    return () => {
      console.log("Component unmounting - clearing callback")
      forceUpdateCallback = null
    }
  }, [fetchProgressFromAPI])

  // Keep the event listener for progress updates
  useEffect(() => {
    console.log("Setting up event listener for progress updates")

    const handleProgressUpdate = () => {
      console.log("Progress update event received")
      fetchProgressFromAPI()
    }

    window.addEventListener("studyPlanProgressUpdated", handleProgressUpdate)

    return () => {
      console.log("Removing event listener for progress updates")
      window.removeEventListener("studyPlanProgressUpdated", handleProgressUpdate)
    }
  }, [fetchProgressFromAPI])

  // Effect to run fetchProgressFromAPI when lastUpdate changes
  useEffect(() => {
    if (lastUpdate) {
      console.log("lastUpdate changed, fetching fresh data...")
      fetchProgressFromAPI()
    }
  }, [lastUpdate, fetchProgressFromAPI])

  // Get color based on progress
  const getProgressColor = () => {
    if (progress < 30) return "bg-red-500"
    if (progress < 70) return "bg-amber-500"
    return "bg-green-500"
  }

  // Calculate estimated completion date
  const getEstimatedCompletionDate = () => {
    if (totalDays === 0 || daysCompleted === 0) {
      // For a new plan, provide an estimate based on the total days and user's study schedule
      const today = new Date()
      const daysPerWeek = userData.daysPerWeek || 5
      const totalWeeks = Math.ceil(totalDays / daysPerWeek)
      const completionDate = new Date(today)
      completionDate.setDate(today.getDate() + totalWeeks * 7)

      return completionDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }

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

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <BarChart3 className="text-blue-500 mr-2" size={20} />
          <h3 className="font-semibold text-gray-800">Study Plan Progress</h3>
        </div>
        <button
          onClick={() => {
            console.log("Manual refresh clicked")
            // Only set loading state
            setIsLoading(true)
            fetchProgressFromAPI()
          }}
          className={`text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 transition-all duration-300 ${isLoading ? "bg-blue-50" : ""}`}
          title="Refresh progress"
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {apiError && <div className="mb-4 p-2 bg-red-50 text-red-600 rounded-md text-sm">{apiError}</div>}

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
        Progress is calculated based on completed tasks and study days.
      </div>
    </div>
  )
}

export default StudyProgressBar