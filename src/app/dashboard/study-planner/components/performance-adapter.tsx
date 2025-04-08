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

interface StudyPlan {
  plan: {
    weeklyPlans: Week[]
  }
}

export const usePerformanceAdapter = (
  studyPlan: StudyPlan | null,
  userData: { daysPerWeek?: number },
  onPlanUpdate: (plan: StudyPlan) => void,
) => {
  const [currentWeekNumber, setCurrentWeekNumber] = useState<number | null>(null)
  const [currentDayOfWeek, setCurrentDayOfWeek] = useState<string | null>(null)
  const [tasksForToday, setTasksForToday] = useState<Task[]>([])
  const [weeklyCompletionRate, setWeeklyCompletionRate] = useState(0)
  const [weeklyGoalCompletion, setWeeklyGoalCompletion] = useState<{ [key: string]: boolean }>({})

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

  return {
    currentWeekNumber,
    currentDayOfWeek,
    tasksForToday,
    weeklyCompletionRate,
    weeklyGoalCompletion,
    updateTaskCompletion,
    advanceToNextWeek,
    getFutureWeeks,
  }
}
