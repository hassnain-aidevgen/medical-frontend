"use client"

import { Award, BarChart3, CheckCircle, Clock, RefreshCw } from "lucide-react"
import type React from "react"
import { useCallback, useEffect, useState } from "react"

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
}

// Add this at the module level (outside the component)
let forceUpdateCallback: (() => void) | null = null

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

export const StudyProgressBar: React.FC<StudyProgressBarProps> = ({ weeklyPlans, userData }) => {
  const [progress, setProgress] = useState<number>(0)
  const [completedTasks, setCompletedTasks] = useState<number>(0)
  const [totalTasks, setTotalTasks] = useState<number>(0)
  const [daysCompleted, setDaysCompleted] = useState<number>(0)
  const [totalDays, setTotalDays] = useState<number>(0)
  // Add a state to force recalculation when localStorage changes
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())

  // Add a function to force refresh from localStorage
  const forceRefreshFromLocalStorage = useCallback(() => {
    console.log("Force refreshing progress bar from localStorage")

    // Get the current plan ID
    const currentPlanId = localStorage.getItem("currentPlanId")
    console.log("Current plan ID:", currentPlanId)

    if (currentPlanId) {
      // Check if we have plan-specific data
      const planKey = `studyPlanPerformance_${currentPlanId}`
      const planData = localStorage.getItem(planKey)

      if (planData) {
        console.log("Found plan-specific data, using it")
        // Use the plan-specific data
        localStorage.setItem("studyPlanPerformance", planData)
      }
    }

    // Force recalculation by updating lastUpdate
    setLastUpdate(Date.now())
  }, [])

  // Register the callback when the component mounts
  // Register the callback when the component mounts
// Register the callback when the component mounts
useEffect(() => {
  // Register the callback for direct updates
  forceUpdateCallback = () => {
    console.log("Force update callback triggered")
    setLastUpdate(Date.now())
  }

  // Check if this is a new plan generation
  const isNewPlanGeneration = localStorage.getItem("isNewPlanGeneration") === "true"
  
  if (isNewPlanGeneration) {
    console.log("New plan generation detected - ensuring progress starts at 0%")
    localStorage.setItem("studyPlanPerformance", JSON.stringify({
      tasks: {},
      lastUpdated: Date.now()
    }))
    localStorage.removeItem("isNewPlanGeneration")
  } else {
    // Load plan-specific data on initial mount (only for existing plans)
    console.log("Component mounted - checking for plan-specific data")
    const currentPlanId = localStorage.getItem("currentPlanId")
    if (currentPlanId) {
      console.log("Found currentPlanId:", currentPlanId)
      const planKey = `studyPlanPerformance_${currentPlanId}`
      const planData = localStorage.getItem(planKey)
      
      if (planData) {
        console.log("Found plan-specific data on initial mount, loading it")
        localStorage.setItem("studyPlanPerformance", planData)
      }
    }
  }

  // Clean up when component unmounts
  return () => {
    forceUpdateCallback = null
  }
}, [])

  // Add listener for plan changes
  useEffect(() => {
    // Listen for plan changes
    const handlePlanChange = (event: CustomEvent) => {
      console.log("Plan change detected:", event.detail)
      forceRefreshFromLocalStorage()
    }

    window.addEventListener("planChanged", handlePlanChange as EventListener)

    return () => {
      window.removeEventListener("planChanged", handlePlanChange as EventListener)
    }
  }, [forceRefreshFromLocalStorage])

  // Wrap calculateProgress in useCallback to prevent it from being recreated on every render
  const calculateProgress = useCallback(() => {
    console.log("=== CALCULATING PROGRESS ===")
    console.log("Current time:", new Date().toISOString())

    // Check if this is a new plan by looking for a specific flag in localStorage
    // Check if this is a new plan by looking for a specific flag in localStorage
const isNewPlan = !localStorage.getItem("studyPlanPerformance") || localStorage.getItem("isNewPlanGeneration") === "true"
    console.log("Is new plan:", isNewPlan)

    // If this is a new plan, force everything to 0
    if (isNewPlan) {
      console.log("New plan detected - setting progress to 0%")
      localStorage.removeItem("isNewPlanGeneration");
      setProgress(0)
      setCompletedTasks(0)

      const totalTaskCount = weeklyPlans.reduce((acc, week) => {
        if (week.days) {
          week.days.forEach((day) => {
            if (day.tasks) {
              acc += day.tasks.length
            }
          })
        }
        return acc
      }, 0)

      console.log("Total tasks from weekly plans:", totalTaskCount)
      setTotalTasks(totalTaskCount)

      setDaysCompleted(0)

      const totalDaysCount = weeklyPlans.reduce((acc, week) => {
        if (week.days) {
          acc += week.days.length
        }
        return acc
      }, 0)

      console.log("Total days from weekly plans:", totalDaysCount)
      setTotalDays(totalDaysCount)

      console.log("Progress set to 0% for new plan")
      // Clear the flag after using it

      return
    }

    // Get performance data from localStorage
    const storedData = localStorage.getItem("studyPlanPerformance")
    console.log("Raw localStorage data:", storedData)

    const performanceData: PerformanceData = storedData
      ? JSON.parse(storedData)
      : { tasks: {}, lastUpdated: Date.now() }

    console.log("Parsed performance data:", performanceData)
    console.log("Number of tasks in performance data:", Object.keys(performanceData.tasks).length)

    // Log all tasks for debugging
    if (performanceData && performanceData.tasks) {
      console.log("All tasks in performance data:")
      Object.entries(performanceData.tasks).forEach(([id, task]) => {
        console.log(`Task ${id}:`, task)
      })
    }

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
        if (task.status === "completed" || task.status === "not-understood" || task.status === "skipped") {
          console.log(`Task marked as ${task.status}: ${task.subject} - ${task.activity}`)
          completed++
        }

        // Track unique days
        const dayKey = `${task.weekNumber}-${task.dayOfWeek}`
        daysWithTasks.add(dayKey)

        // Check if all tasks for this day are completed
        const dayTasks = Object.values(performanceData.tasks).filter(
          (t: TaskPerformance) => t.weekNumber === task.weekNumber && t.dayOfWeek === task.dayOfWeek,
        )

        // Update day completion check to include not-understood and skipped
        const allDayTasksCompleted = dayTasks.every(
          (t: TaskPerformance) => t.status === "completed" || t.status === "not-understood" || t.status === "skipped",
        )

        if (allDayTasksCompleted) {
          completedDaysSet.add(dayKey)
          console.log(`Day marked as completed: ${dayKey}`)
        }
      })
    }

    // If no tasks in localStorage yet, count from the study plan
    if (total === 0 && weeklyPlans) {
      console.log("No tasks in localStorage, counting from weekly plans")
      // For a new plan, explicitly set completed tasks and days to 0
      completed = 0
      completedDays = 0

      weeklyPlans.forEach((week) => {
        if (week.days) {
          week.days.forEach((day: Day) => {
            if (day.tasks) {
              total += day.tasks.length
              console.log(`Adding ${day.tasks.length} tasks from ${day.dayOfWeek} in week ${week.weekNumber}`)

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

    console.log(`Days completed: ${completedDays}/${totalDaysCount}`)

    // Calculate progress percentage
    let progressPercentage = 0
    if (total > 0) {
      progressPercentage = Math.round((completed / total) * 100)
      console.log(`Raw progress calculation: ${completed}/${total} = ${(completed / total) * 100}%`)

      // Safety check: if no tasks are completed but we have tasks, ensure progress is 0
      if (completed === 0) {
        progressPercentage = 0
        console.log("No completed tasks, setting progress to 0%")
      }
    }

    // Final safety check - if this is a newly generated plan, force progress to 0
    if (completed === 0 || Object.keys(performanceData.tasks).length === 0) {
      progressPercentage = 0
      console.log("No completed tasks or empty performance data, setting progress to 0%")
    }

    console.log(
      `Final progress calculation: ${completed}/${total} tasks, ${completedDays}/${totalDaysCount} days, ${progressPercentage}%`,
    )

    setProgress(progressPercentage)
    setCompletedTasks(completed)
    setTotalTasks(total)
    setDaysCompleted(completedDays)
    setTotalDays(totalDaysCount)

    console.log("=== COMPLETED PROGRESS CALCULATION ===")
  }, [weeklyPlans]) // Remove lastUpdate from here as it creates a circular dependency

  // Add this right after the calculateProgress function in study-progress-bar.tsx
  useEffect(() => {
    // This will run once when the component mounts
    console.log("DIRECT CHECK OF LOCALSTORAGE:")

    // Get all keys in localStorage
    const allKeys = []
    for (let i = 0; i < localStorage.length; i++) {
      allKeys.push(localStorage.key(i))
    }
    console.log("All localStorage keys:", allKeys)

    // Check the exact content of studyPlanPerformance
    const rawData = localStorage.getItem("studyPlanPerformance")
    console.log("Raw studyPlanPerformance data:", rawData)

    if (rawData) {
      try {
        const parsedData = JSON.parse(rawData)
        console.log("Parsed studyPlanPerformance:", parsedData)
        console.log("Tasks in performance data:", Object.keys(parsedData.tasks || {}).length)

        // Log each task
        if (parsedData.tasks) {
          Object.entries(parsedData.tasks).forEach(([id, task]) => {
            console.log(`Task ${id}:`, task)
          })
        }
      } catch (e) {
        console.error("Error parsing studyPlanPerformance:", e)
      }
    }

    // Check for plan-specific data
    const currentPlanId = localStorage.getItem("currentPlanId")
    if (currentPlanId) {
      const planKey = `studyPlanPerformance_${currentPlanId}`
      const planData = localStorage.getItem(planKey)
      console.log(`Plan-specific data for ${currentPlanId}:`, planData ? "Found" : "Not found")
    }
  }, [])

  // In the useEffect:
  useEffect(() => {
    console.log("=== STUDY PROGRESS BAR MOUNTED OR UPDATED ===")
    console.log("lastUpdate value:", lastUpdate)

    // Initial calculation
    console.log("Running initial progress calculation")
    calculateProgress()

    // Set up event listener for custom event
    const handleProgressUpdate = (event: Event) => {
      console.log("Received studyPlanProgressUpdated event:", event)
      console.log("Triggering progress recalculation")
      setLastUpdate(Date.now())
    }

    console.log("Adding event listener for studyPlanProgressUpdated")
    window.addEventListener("studyPlanProgressUpdated", handleProgressUpdate)

    // Set up interval to check localStorage every 5 seconds
    console.log("Setting up polling interval for localStorage changes")
    const intervalId = setInterval(() => {
      console.log("Checking for localStorage changes...")
      const storedData = localStorage.getItem("studyPlanPerformance")
      if (storedData) {
        try {
          const data = JSON.parse(storedData)
          console.log("Current lastUpdate:", lastUpdate)
          console.log("localStorage lastUpdated:", data.lastUpdated)

          if (data.lastUpdated > lastUpdate) {
            console.log("Detected localStorage change, updating progress")
            setLastUpdate(data.lastUpdated)
          } else {
            console.log("No changes detected in localStorage")
          }
        } catch (e) {
          console.error("Error parsing localStorage data:", e)
        }
      } else {
        console.log("No studyPlanPerformance data in localStorage")
      }
    }, 5000)

    return () => {
      console.log("Cleaning up StudyProgressBar event listeners and intervals")
      window.removeEventListener("studyPlanProgressUpdated", handleProgressUpdate)
      clearInterval(intervalId)
    }
  }, [calculateProgress, lastUpdate]) // Added lastUpdate to the dependency array

  // Add a separate effect to run calculateProgress when lastUpdate changes
  useEffect(() => {
    console.log("lastUpdate changed, recalculating progress...")
    calculateProgress()
  }, [lastUpdate, calculateProgress])

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

            // Check localStorage directly
            const rawData = localStorage.getItem("studyPlanPerformance")
            console.log("Manual refresh - Raw localStorage data:", rawData)

            if (rawData) {
              try {
                const parsedData = JSON.parse(rawData)
                console.log("Manual refresh - Parsed data:", parsedData)
                console.log("Manual refresh - Tasks count:", Object.keys(parsedData.tasks || {}).length)
              } catch (e) {
                console.error("Manual refresh - Error parsing data:", e)
              }
            }

            // Force refresh from localStorage
            forceRefreshFromLocalStorage()
          }}
          className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50"
          title="Refresh progress"
        >
          <RefreshCw size={16} />
        </button>
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
        Progress is calculated based on completed tasks and study days.
      </div>
    </div>
  )
}

export default StudyProgressBar
