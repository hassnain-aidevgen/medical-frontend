"use client"

import { useCallback, useEffect, useState } from "react"

// Add these type definitions after the imports
interface Task {
  _id: string
  status: any
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
  taskPerformance: any
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

  // Load task performance from database
  const loadTaskPerformanceFromDB = useCallback(async () => {
    try {
      const planId = localStorage.getItem("currentPlanId");
      if (planId) {
        const response = await fetch(`https://medical-backend-3eek.onrender.com/api/ai-planner/getTaskPerformance/${planId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.taskPerformance) {
            // Convert database performance to our state format
            const dbStatuses: { [key: string]: TaskStatus } = {};
            
            Object.entries(result.taskPerformance).forEach(([taskId, taskData]: [string, any]) => {
              dbStatuses[taskId] = taskData.status;
            });
            
            setTaskStatuses(dbStatuses);
          }
        }
      }
    } catch (error) {
      console.error("Error loading task performance:", error);
    }
  }, []);

  useEffect(() => {
    // Initialize current week number and day of the week
    setCurrentWeekNumber(getWeekNumber())
    setCurrentDayOfWeek(getDayOfWeek())
    
    // Load task performance from database
    loadTaskPerformanceFromDB();
  }, [getWeekNumber, getDayOfWeek, loadTaskPerformanceFromDB])

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

  // Function to handle task status change
 // Update handleTaskStatusChange in performance-adapter.tsx
// Update handleTaskStatusChange in performance-adapter.tsx
const handleTaskStatusChange = async (taskId: string | number, status: TaskStatus) => {
  console.log("Frontend: Updating task status", { taskId, status });
  
  // Update local state immediately for instant feedback
  setTaskStatuses((prev) => ({
    ...prev,
    [taskId]: status,
  }));

  // Save to database
  try {
    const planId = localStorage.getItem("currentPlanId");
    if (planId) {
      const response = await fetch(`https://medical-backend-3eek.onrender.com/api/ai-planner/updateTaskStatus/${planId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: taskId,
          status
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Backend error:", errorData);
        throw new Error(`Failed to update task status: ${errorData.message}`);
      }

      const result = await response.json();
      console.log("Backend response:", result);

      // IMPORTANT: Update the study plan with the latest data from backend
      if (result.updatedPlan && studyPlan) {
        console.log("Updating study plan with backend data");
        const updatedStudyPlan = { 
          ...studyPlan,
          plan: result.updatedPlan,
          completionStatus: result.completionStatus,
          taskPerformance: result.taskPerformance
        };
        onPlanUpdate(updatedStudyPlan);
      }

      // Update local task statuses with the backend data
      if (result.taskPerformance) {
        const newStatuses: { [key: string]: TaskStatus } = {};
        Object.entries(result.taskPerformance).forEach(([taskId, taskData]: [string, any]) => {
          newStatuses[taskId] = taskData.status;
        });
        setTaskStatuses(prev => ({ ...prev, ...newStatuses }));
      }

      // Force a re-render by updating the current week
      if (currentWeekNumber) {
        setCurrentWeekNumber(currentWeekNumber);
      }
    }
  } catch (error) {
    console.error("Error updating task status:", error);
    // Revert local state on error
    setTaskStatuses((prev) => ({
      ...prev,
      [taskId]: "incomplete" as TaskStatus,
    }));
  }
};

  // Function to get task status
// Update getTaskStatus in performance-adapter.tsx
const getTaskStatus = (taskId: string, subject?: string, activity?: string): TaskStatus => {
  // First, check if the task has a status in the actual plan structure
  if (studyPlan && studyPlan.plan && studyPlan.plan.weeklyPlans) {
    for (const week of studyPlan.plan.weeklyPlans) {
      for (const day of week.days) {
        const task = day.tasks?.find(t => t._id === taskId);
        if (task && task.status) {
          console.log("Found task status in plan:", task.status, "for task:", taskId);
          return task.status;
        }
      }
    }
  }

  // Then check in our local state
  if (taskStatuses[taskId]) {
    console.log("Found task status in local state:", taskStatuses[taskId], "for task:", taskId);
    return taskStatuses[taskId];
  }

  // Finally check taskPerformance if available
  if (studyPlan && studyPlan.taskPerformance && studyPlan.taskPerformance[taskId]) {
    console.log("Found task status in taskPerformance:", studyPlan.taskPerformance[taskId].status, "for task:", taskId);
    return studyPlan.taskPerformance[taskId].status;
  }

  // Default to incomplete
  console.log("No status found, defaulting to incomplete for task:", taskId);
  return "incomplete";
};


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
  }
}