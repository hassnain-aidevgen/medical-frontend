"use client"

import { useCallback, useEffect, useState } from "react"

// Add these type definitions after the imports
interface Task {
  subject: string
  duration: number
  activity: string
  isReview?: boolean
}

interface Day {
  dayOfWeek: string
  tasks: Task[]
}

interface WeeklyGoal {
  subject: string
  description: string
}

interface Week {
  weekNumber: number
  theme: string
  focusAreas: string[]
  weeklyGoals: WeeklyGoal[]
  days: Day[]
}

export interface StudyPlan {
  plan: {
    weeklyPlans: Week[]
  }
}

// Define the task status type
type TaskStatus = "completed" | "incomplete" | "not-understood" | "skipped"

// Define the task performance data structure
interface TaskPerformance {
  subject: string
  activity: string
  weekNumber: number
  dayOfWeek: string
  taskId: string
  timestamp: number
  status: TaskStatus
}

export const usePerformanceAdapter = (
  studyPlan: StudyPlan | null,
  userData: { daysPerWeek?: number; weakSubjects?: string[] },
  onPlanUpdate: (plan: StudyPlan) => void,
) => {
  const [currentWeekNumber, setCurrentWeekNumber] = useState<number | null>(null)
  const [currentDayOfWeek, setCurrentDayOfWeek] = useState<string | null>(null)
  const [tasksForToday, setTasksForToday] = useState<Task[]>([])
  const [weeklyCompletionRate, setWeeklyCompletionRate] = useState(0)
  const [weeklyGoalCompletion, setWeeklyGoalCompletion] = useState<{ [key: string]: boolean }>({})
  const [taskStatuses, setTaskStatuses] = useState<{ [key: string]: TaskStatus }>({})
  const [needsReplanning, setNeedsReplanning] = useState(false)

  // Function to calculate the current week number
  const getWeekNumber = useCallback(() => {
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 0)
    const diff = now.getTime() - startOfYear.getTime()
    const oneDay = 1000 * 60 * 60 * 24
    const dayOfYear = Math.floor(diff / oneDay)
    return Math.ceil(dayOfYear / 7)
  }, [])

  // Function to get the current day of the week
  const getDayOfWeek = useCallback(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return days[new Date().getDay()]
  }, [])

  useEffect(() => {
    // Initialize current week number and day of the week
    setCurrentWeekNumber(getWeekNumber())
    setCurrentDayOfWeek(getDayOfWeek())
  }, [getWeekNumber, getDayOfWeek])

  useEffect(() => {
    if (studyPlan && currentWeekNumber && currentDayOfWeek) {
      const week = studyPlan.plan.weeklyPlans.find((w: Week) => w.weekNumber === currentWeekNumber)

      if (week) {
        week.days.forEach((day: Day) => {
          day.tasks.forEach((task: Task) => {
            // Initialize completion status for each task
            setWeeklyGoalCompletion((prevCompletion) => ({
              ...prevCompletion,
              [`${task.subject}-${task.activity}`]: false,
            }))
          })
        })

        const today = week.days.find((day) => day.dayOfWeek === currentDayOfWeek)
        setTasksForToday(today ? today.tasks : [])
      } else {
        setTasksForToday([])
      }
    } else {
      setTasksForToday([])
    }
  }, [studyPlan, currentWeekNumber, currentDayOfWeek])

  // Function to update task completion status
  const updateTaskCompletion = (subject: string, activity: string, isComplete: boolean) => {
    setWeeklyGoalCompletion((prevCompletion) => ({
      ...prevCompletion,
      [`${subject}-${activity}`]: isComplete,
    }))
  }

  // Function to calculate weekly completion rate
  useEffect(() => {
    if (studyPlan) {
      const totalTasks = Object.keys(weeklyGoalCompletion).length
      const completedTasks = Object.values(weeklyGoalCompletion).filter((status) => status).length
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
      setWeeklyCompletionRate(completionRate)
    }
  }, [weeklyGoalCompletion, studyPlan])

  // Function to advance to the next week
  const advanceToNextWeek = () => {
    if (studyPlan && currentWeekNumber) {
      const updatedPlan = { ...studyPlan }

      // Find the highest week number in the existing plan
      const highestWeekNumber = updatedPlan.plan.weeklyPlans.reduce((max, week) => Math.max(max, week.weekNumber), 0)

      // Determine the next week number
      const nextWeekNumber = highestWeekNumber + 1

      // Create a new week based on the theme of the current week
      const currentWeek = updatedPlan.plan.weeklyPlans.find((week) => week.weekNumber === currentWeekNumber)

      if (currentWeek) {
        const newWeek: Week = {
          weekNumber: nextWeekNumber,
          theme: currentWeek.theme, // Copy the theme from the current week
          focusAreas: currentWeek.focusAreas, // Copy focus areas
          weeklyGoals: currentWeek.weeklyGoals, // Copy weekly goals
          days: [], // Initialize days as an empty array
        }

        // Add days to the new week based on user's preferred days per week
        for (let i = 0; i < (userData?.daysPerWeek || 7); i++) {
          const dayOfWeek = getDayOfWeekForIndex(i) // Implement this function to get day of week
          newWeek.days.push({
            dayOfWeek: dayOfWeek,
            tasks: [], // Initialize tasks as an empty array
          })
        }

        updatedPlan.plan.weeklyPlans.push(newWeek)

        // Sort the weekly plans by week number
        updatedPlan.plan.weeklyPlans.sort((a, b) => a.weekNumber - b.weekNumber)

        onPlanUpdate(updatedPlan)
        setCurrentWeekNumber(nextWeekNumber)
      }
    }
  }

  // Function to get the day of the week for a given index
  const getDayOfWeekForIndex = (index: number): string => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return days[index % 7]
  }

  // Function to get future weeks
  const getFutureWeeks = () => {
    if (studyPlan && currentWeekNumber) {
      const updatedPlan = { ...studyPlan }

      const futureWeeks = updatedPlan.plan.weeklyPlans
        .filter((week: Week) => week.weekNumber > currentWeekNumber)
        .sort((a: Week, b: Week) => a.weekNumber - b.weekNumber)

      return futureWeeks
    }
    return []
  }

  // Add the missing functions needed by study-plan-results.tsx

  // Function to handle task status change
  const handleTaskStatusChange = (taskId: string | number, status: TaskStatus) => {
    // Parse the taskId to get the task details
    // Assuming taskId format is "week-day-subject-activity"
    const parts = String(taskId).split("-")
    if (parts.length >= 4) {
      const weekNumber = Number.parseInt(parts[0])
      const dayOfWeek = parts[1]
      const subject = parts[2]
      const activity = parts.slice(3).join("-") // In case activity has hyphens

      // Update the task status
      setTaskStatuses((prev) => ({
        ...prev,
        [taskId]: status,
      }))

      // Save to localStorage for persistence
      const storedData = localStorage.getItem("studyPlanPerformance")
      const performanceData = storedData ? JSON.parse(storedData) : { tasks: {}, lastUpdated: Date.now() }

      performanceData.tasks[taskId] = {
        subject,
        activity,
        weekNumber,
        dayOfWeek,
        taskId,
        timestamp: Date.now(),
        status,
      }

      localStorage.setItem("studyPlanPerformance", JSON.stringify(performanceData))

      // Update completion status if completed
      if (status === "completed") {
        updateTaskCompletion(subject, activity, true)
      } else {
        updateTaskCompletion(subject, activity, false)
      }

      // Check if replanning is needed
      if (status === "not-understood" || status === "skipped") {
        setNeedsReplanning(true)
      }
    }
  }

  // Function to get task status
  const getTaskStatus = (weekNumber: number, dayOfWeek: string, subject: string, activity: string): TaskStatus => {
    const taskId = `${weekNumber}-${dayOfWeek}-${subject}-${activity}`

    // Check in our state first
    if (taskStatuses[taskId]) {
      return taskStatuses[taskId]
    }

    // Check in localStorage
    const storedData = localStorage.getItem("studyPlanPerformance")
    if (storedData) {
      const performanceData = JSON.parse(storedData)
      if (performanceData.tasks && performanceData.tasks[taskId]) {
        return performanceData.tasks[taskId].status
      }
    }

    // Default to incomplete
    return "incomplete"
  }

  // Function to apply replanning
  const applyReplanning = () => {
    if (!studyPlan || !currentWeekNumber) return

    const updatedPlan = { ...studyPlan }
    const tasksToReplan: TaskPerformance[] = []

    // Get all tasks that need replanning
    const storedData = localStorage.getItem("studyPlanPerformance")
    if (storedData) {
      const performanceData = JSON.parse(storedData)

      // Find all tasks marked as not-understood or skipped
      Object.values(performanceData.tasks).forEach((task: unknown) => {
        const taskData = task as TaskPerformance
        if (taskData.status === "not-understood" || taskData.status === "skipped") {
          tasksToReplan.push(taskData)
        }
      })
    }

    // Get future weeks
    const futureWeeks = getFutureWeeks()

    if (futureWeeks.length > 0 && tasksToReplan.length > 0) {
      // Distribute tasks to replan across future weeks
      tasksToReplan.forEach((task, index) => {
        const targetWeekIndex = index % futureWeeks.length
        const targetWeek = futureWeeks[targetWeekIndex]

        // Find a suitable day to add the task
        if (targetWeek.days && targetWeek.days.length > 0) {
          const targetDayIndex = index % targetWeek.days.length
          const targetDay = targetWeek.days[targetDayIndex]

          // Create a new task based on the one that needs replanning
          const newTask: Task = {
            subject: task.subject,
            activity: `Review: ${task.activity}`,
            duration: 30, // Default duration for review
            isReview: true,
          }

          // Add the task to the target day
          targetDay.tasks.push(newTask)
        }
      })

      // Update the plan
      onPlanUpdate(updatedPlan)

      // Reset the needs replanning flag
      setNeedsReplanning(false)

      // Clear the not-understood and skipped tasks from localStorage
      const performanceData = JSON.parse(storedData!)
      Object.keys(performanceData.tasks).forEach((taskId) => {
        const task = performanceData.tasks[taskId]
        if (task.status === "not-understood" || task.status === "skipped") {
          task.status = "incomplete" // Reset status
        }
      })
      localStorage.setItem("studyPlanPerformance", JSON.stringify(performanceData))
    }
  }

  return {
    currentWeekNumber,
    currentDayOfWeek,
    tasksForToday,
    weeklyCompletionRate,
    weeklyGoalCompletion,
    updateTaskCompletion,
    advanceToNextWeek,
    getFutureWeeks,
    // Add the missing functions to the return object
    handleTaskStatusChange,
    getTaskStatus,
    needsReplanning,
    applyReplanning,
  }
}
