"use client"

import axios from "axios"
import { Undo2, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

// Update the Test interface to include source and additional information
interface Test {
  _id: string
  date: Date | string
  subjectName: string
  testTopic: string
  completed: boolean
  userId: string
  color: string
  planId?: string
  taskType?: "study" | "review" | "practice" | "assessment"
  duration?: number
  priority?: "high" | "medium" | "low"
  resources?: Array<{
    name: string
    type?: string
    description: string
  }>
  weekNumber?: number
  dayOfWeek?: string
  notes?: string
  isReviewTask?: boolean
  originalTaskId?: string
  source?: "ai-planner" | "manual" // Add source field to track where the task came from
}

// Define the interface for weekly plan tasks
interface PlanTask {
  id: string
  title: string
  subject: string
  topic: string
  date: string
  duration: number
  priority: "high" | "medium" | "low"
  resources?: Array<{
    name: string
    type?: string
    description: string
  }>
  weekNumber?: number
  dayOfWeek?: string
}

interface PlannerSyncSchedulerProps {
  userId: string
  onTestsAdded?: (tests: Test[]) => void
  onSyncComplete?: () => void
  onRefresh?: () => void
  // New props to replace localStorage
  lastSyncTime: string | null
  lastSyncedTests: Test[]
  onSyncTimeChange: (time: string) => void
  onLastSyncedTestsChange: (tests: Test[]) => void
  weeklyStudyPlan?: PlanTask[] // Optional prop for study plan data
}

// Define interfaces for the study plan structure
interface StudyPlanWeeklyGoal {
  subject: string
  description: string
}

interface StudyPlanResource {
  name: string
  type?: string
  description: string
}

interface StudyPlanTask {
  subject: string
  duration: number
  activity: string
  resources?: StudyPlanResource[]
}

interface StudyPlanDay {
  dayOfWeek: string
  focusAreas: string[]
  tasks: StudyPlanTask[]
}

interface StudyPlanWeek {
  weekNumber: number
  theme: string
  focusAreas: string[]
  weeklyGoals: StudyPlanWeeklyGoal[]
  days: StudyPlanDay[]
}

interface StudyPlan {
  _id: string
  plan: {
    title: string
    weeklyPlans: StudyPlanWeek[]
  }
  isActive: boolean
}

const PlannerSyncScheduler = ({
  userId,
  onTestsAdded,
  onSyncComplete,
  onRefresh,
  lastSyncTime,
  lastSyncedTests,
  onSyncTimeChange,
  onLastSyncedTestsChange,
  weeklyStudyPlan,
}: PlannerSyncSchedulerProps) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isUndoing, setIsUndoing] = useState(isProcessing)
  const [showUndoButton, setShowUndoButton] = useState(false)
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null)
  const [noActivePlanError, setNoActivePlanError] = useState(false)

  // Update showUndoButton based on lastSyncedTests
  useEffect(() => {
    setShowUndoButton(lastSyncedTests.length > 0)
  }, [lastSyncedTests])

  // Fetch active plan on component mount
  useEffect(() => {
    if (userId) {
      fetchActivePlan()
    }
  }, [userId])

  // Helper function to ensure date is a string
  const formatDateToString = (date: Date | string): string => {
    if (date instanceof Date) {
      return date.toISOString()
    } else if (typeof date === "string") {
      return date
    }
    // Fallback to current date if invalid
    return new Date().toISOString()
  }

  // Fetch the active study plan
  const fetchActivePlan = async () => {
    try {
      const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/ai-planner/getActivePlan/${userId}`)

      if (response.data.success && response.data.data) {
        setActivePlan(response.data.data)
        setNoActivePlanError(false)
      } else {
        setActivePlan(null)
        setNoActivePlanError(true)
      }
    } catch (error) {
      console.error("Error fetching active plan:", error)
      setActivePlan(null)
      setNoActivePlanError(true)
    }
  }

  // Update the addTestToCalendar function to include enhanced information
  const addTestToCalendar = async (test: Test): Promise<Test | null> => {
    if (!userId) {
      toast.error("User ID not found. Please log in.")
      return null
    }

    try {
      const response = await axios.post("https://medical-backend-loj4.onrender.com/api/ai-planner/add_ai_plan_to_calender", {
        userId: test.userId,
        subjectName: test.subjectName,
        testTopic: test.testTopic,
        date: formatDateToString(test.date),
        color: test.color,
        completed: test.completed,
        planId: test.planId || activePlan?._id,
        taskType: test.taskType || "study",
        duration: test.duration || 60,
        priority: test.priority || "medium",
        resources: test.resources || [],
        weekNumber: test.weekNumber || 1,
        dayOfWeek: test.dayOfWeek || getDayOfWeek(test.date),
        notes: test.notes || "",
        isReviewTask: test.isReviewTask || false,
        originalTaskId: test.originalTaskId || null,
        source: "ai-planner", // Mark this task as coming from the AI planner
      })

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.data
    } catch (error) {
      console.error("Failed to add test:", error)
      return null
    }
  }

  // Helper function to get day of week from date
  const getDayOfWeek = (date: Date | string): string => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const dateObj = typeof date === "string" ? new Date(date) : date
    return days[dateObj.getDay()]
  }

  // Function to delete a test from the calendar - updated to use axios
  const deleteTestFromCalendar = async (testId: string): Promise<boolean> => {
    if (!userId) {
      toast.error("User ID not found. Please log in.")
      return false
    }

    try {
      const response = await axios.delete(`https://medical-backend-loj4.onrender.com/api/ai-planner/calender/${testId}`)

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return true
    } catch (error) {
      console.error("Failed to delete test:", error)
      return false
    }
  }

  // Function to delete all tasks associated with a plan
  const deleteTasksByPlanId = async (planId: string): Promise<number> => {
    if (!userId) {
      toast.error("User ID not found. Please log in.")
      return 0
    }

    try {
      const response = await axios.delete(`https://medical-backend-loj4.onrender.com/api/ai-planner/calender/byPlan/${planId}`)

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.data.deletedCount || 0
    } catch (error) {
      console.error("Failed to delete tasks by plan ID:", error)
      return 0
    }
  }

  // Update the createReviewTasks function to include enhanced information
  const createReviewTasks = (test: Test): Test[] => {
    const reviewTasks: Test[] = []
    const testDate = test.date instanceof Date ? test.date : new Date(test.date)

    // Create review intervals (24 hours, 7 days, 30 days)
    const intervals = [
      { days: 1, label: "24h Review", priority: "high" },
      { days: 7, label: "7d Review", priority: "medium" },
      { days: 30, label: "30d Review", priority: "low" },
    ]

    intervals.forEach((interval) => {
      const reviewDate = new Date(testDate)
      reviewDate.setDate(reviewDate.getDate() + interval.days)

      // Skip if review date is in the past
      if (reviewDate < new Date(new Date().setHours(0, 0, 0, 0))) {
        return
      }

      reviewTasks.push({
        _id: `review-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        subjectName: test.subjectName,
        testTopic: `${test.testTopic} - ${interval.label}`,
        date: reviewDate,
        color: "#EF4444", // Red color for review tasks
        completed: false,
        userId: test.userId,
        planId: test.planId || activePlan?._id,
        taskType: "review",
        duration: test.duration ? Math.round(test.duration / 2) : 30, // Half the original duration
        priority: interval.priority as "high" | "medium" | "low",
        resources: test.resources,
        weekNumber: test.weekNumber,
        dayOfWeek: getDayOfWeek(reviewDate),
        notes: `Spaced repetition review of ${test.testTopic}`,
        isReviewTask: true,
        originalTaskId: test._id,
        source: "ai-planner",
      })
    })

    return reviewTasks
  }

  // Updated fetchWeeklyPlan to use the active plan
  const fetchWeeklyPlan = async (): Promise<PlanTask[]> => {
    // First check if we have an active plan
    if (!activePlan) {
      // Try to fetch the active plan
      try {
        const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/ai-planner/getActivePlan/${userId}`)

        if (response.data.success && response.data.data) {
          setActivePlan(response.data.data)
          return extractTasksFromPlan(response.data.data)
        } else {
          setNoActivePlanError(true)
          return []
        }
      } catch (error) {
        console.error("Error fetching active plan:", error)
        setNoActivePlanError(true)
        return []
      }
    }

    // If we already have the active plan, extract tasks from it
    return extractTasksFromPlan(activePlan)
  }

  // Helper function to extract tasks from a study plan
  const extractTasksFromPlan = (studyPlan: StudyPlan): PlanTask[] => {
    const tasks: PlanTask[] = []

    // Check if the study plan has weeklyPlans
    if (studyPlan.plan?.weeklyPlans) {
      // Iterate through each week
      studyPlan.plan.weeklyPlans.forEach((week: StudyPlanWeek) => {
        // Iterate through each day in the week
        if (week.days) {
          week.days.forEach((day: StudyPlanDay) => {
            // Iterate through each task in the day
            if (day.tasks) {
              day.tasks.forEach((task: StudyPlanTask) => {
                // Create a date string for the task based on the day of week
                const today = new Date()
                const dayIndex = [
                  "sunday",
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                ].findIndex((d) => d.toLowerCase() === day.dayOfWeek.toLowerCase())

                // Calculate the date for this day of the week
                const taskDate = new Date(today)
                const currentDay = today.getDay()
                const daysToAdd = (dayIndex - currentDay + 7) % 7
                taskDate.setDate(today.getDate() + daysToAdd)

                // Convert the task to our PlanTask format with enhanced information
                tasks.push({
                  id: `task-${Math.random().toString(36).substring(2, 9)}`,
                  title: task.activity,
                  subject: task.subject,
                  topic: task.activity,
                  date: taskDate.toISOString().split("T")[0],
                  duration: task.duration,
                  priority: determinePriority(task.subject),
                  resources: task.resources,
                  weekNumber: week.weekNumber,
                  dayOfWeek: day.dayOfWeek,
                })
              })
            }
          })
        }
      })
    }

    return tasks
  }

  // Add a helper function to determine priority based on subject
  const determinePriority = (subject: string): "high" | "medium" | "low" => {
    // This is a placeholder logic - you can customize based on your needs
    // For example, you might want to check if the subject is in the user's weak subjects
    const weakSubjects = ["Anatomy", "Pharmacology", "Pathology"] // Example weak subjects
    const mediumSubjects = ["Physiology", "Biochemistry"] // Example medium subjects

    if (weakSubjects.some((s) => subject.toLowerCase().includes(s.toLowerCase()))) {
      return "high"
    } else if (mediumSubjects.some((s) => subject.toLowerCase().includes(s.toLowerCase()))) {
      return "medium"
    } else {
      return "low"
    }
  }

  // Update the convertPlanTasksToTests function to include enhanced information
  const convertPlanTasksToTests = (tasks: PlanTask[], userId: string): Test[] => {
    return tasks.map((task) => ({
      _id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      subjectName: task.subject,
      testTopic: task.title,
      date: new Date(task.date),
      color: getPriorityColor(task.priority),
      completed: false,
      userId: userId,
      planId: activePlan?._id,
      taskType: "study",
      duration: task.duration,
      priority: task.priority,
      resources: task.resources,
      weekNumber: task.weekNumber,
      dayOfWeek: task.dayOfWeek,
      notes: `${task.subject} study session: ${task.title}`,
      isReviewTask: false,
      source: "ai-planner",
    }))
  }

  // Helper function to get color based on priority
  const getPriorityColor = (priority: "high" | "medium" | "low"): string => {
    switch (priority) {
      case "high":
        return "#EF4444" // Red for high priority
      case "medium":
        return "#F59E0B" // Amber for medium priority
      case "low":
        return "#3B82F6" // Blue for low priority
      default:
        return "#3B82F6" // Default blue
    }
  }

  // Function to undo the last sync - updated to use props instead of localStorage
  const undoLastSync = async () => {
    if (lastSyncedTests.length === 0 || !activePlan?._id) {
      toast.error("No tests to undo or no active plan")
      return
    }

    setIsUndoing(true)
    toast.loading("Undoing last sync...")

    try {
      // Delete all tasks related to the active plan ID
      const deletedCount = await deleteTasksByPlanId(activePlan._id)
      // Clear the last synced tests using the prop callback
      onLastSyncedTestsChange([])
      setShowUndoButton(false)

      // Refresh the calendar data
      if (onRefresh) {
        onRefresh()
      }

      toast.dismiss()
      toast.success(`Removed ${deletedCount} tasks from your calendar`)
    } catch (error) {
      console.error("Error during undo:", error)
      toast.dismiss()
      toast.error("Failed to undo changes. Please try again.")
    } finally {
      setIsUndoing(false)
    }
  }

  // Main function to sync planner and add review tasks - updated to check for active plan
  const syncPlannerAndAddReviews = async () => {
    if (!userId) {
      toast.error("User ID not found. Please log in.")
      return
    }

    // Check if there's an active plan
    if (!activePlan) {
      await fetchActivePlan()

      if (!activePlan) {
        toast.error("No active study plan found. Please activate a plan first.")
        setNoActivePlanError(true)
        return
      }
    }

    setIsProcessing(true)
    setNoActivePlanError(false)
    toast.loading("Syncing planner and scheduling reviews...")

    try {
      console.log("Fetch weekly plan")
      // 1. Fetch weekly plan
      const planTasks = await fetchWeeklyPlan()

      if (planTasks.length === 0) {
        toast.dismiss()
        toast.error("No tasks found in the active plan")
        setIsProcessing(false)
        return
      }

      console.log("Convert plan tasks to calendar tests")
      // 2. Convert plan tasks to calendar tests
      const planTests = convertPlanTasksToTests(planTasks, userId)

      console.log("Add plan tests to calendar")
      // 3. Add plan tests to calendar
      const addedTests: Test[] = []
      const reviewTasks: Test[] = []

      for (const test of planTests) {
        const addedTest = await addTestToCalendar(test)
        if (addedTest) {
          addedTests.push(addedTest)

          // 4. Create review tasks for each added test
          const reviews = createReviewTasks(addedTest)
          reviewTasks.push(...reviews)
        }
      }

      // 5. Add review tasks to calendar
      const addedReviews: Test[] = []
      for (const review of reviewTasks) {
        const addedReview = await addTestToCalendar(review)
        if (addedReview) {
          addedReviews.push(addedReview)
        }
      }

      // 6. Update last sync time using the prop callback
      const now = new Date().toISOString()
      onSyncTimeChange(now)

      // 7. Save the added tests for potential undo using the prop callback
      const allAddedTests = [...addedTests, ...addedReviews]
      onLastSyncedTestsChange(allAddedTests)
      setShowUndoButton(true)

      // 8. Notify parent component with properly formatted dates
      if (onTestsAdded) {
        // Make sure all tests have properly formatted dates before passing to parent
        const formattedTests = allAddedTests.map((test) => ({
          ...test,
          // Ensure date is a Date object
          date: test.date instanceof Date ? test.date : new Date(test.date),
        }))
        onTestsAdded(formattedTests)
      }

      if (onSyncComplete) {
        onSyncComplete()
      }

      // 9. Refresh the calendar data
      if (onRefresh) {
        onRefresh()
      }

      toast.dismiss()
      toast.success(`Synced ${addedTests.length} plan items and scheduled ${addedReviews.length} review sessions`)
    } catch (error) {
      console.error("Error during sync:", error)
      toast.dismiss()
      toast.error("Failed to sync planner. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Function to handle plan deactivation - remove all tasks from calendar
  const handlePlanDeactivated = async (planId: string) => {
    if (!planId) return

    try {
      toast.loading("Removing plan tasks from calendar...")
      const deletedCount = await deleteTasksByPlanId(planId)
      toast.dismiss()

      if (deletedCount > 0) {
        toast.success(`Removed ${deletedCount} tasks from your calendar`)

        // Refresh the calendar data
        if (onRefresh) {
          onRefresh()
        }

        // Clear the last synced tests if they were from this plan
        if (lastSyncedTests.some((test) => test.planId === planId)) {
          onLastSyncedTestsChange([])
          setShowUndoButton(false)
        }
      }
    } catch (error) {
      console.error("Error removing plan tasks:", error)
      toast.dismiss()
      toast.error("Failed to remove plan tasks from calendar")
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">AI Planner Sync & Review Scheduler</h2>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-gray-600 mb-2">
            Sync your AI study plan with the calendar and automatically schedule spaced repetition review sessions.
          </p>
          {lastSyncTime && (
            <p className="text-sm text-gray-500">Last synced: {new Date(lastSyncTime).toLocaleString()}</p>
          )}
          {activePlan && (
            <p className="text-sm text-green-600 font-medium mt-1">
              Active plan: {activePlan.plan.title || "Unnamed Plan"}
            </p>
          )}
          {noActivePlanError && (
            <div className="flex items-center text-amber-600 text-sm mt-1">
              <AlertCircle size={14} className="mr-1.5" />
              No active plan found. Please activate a plan first.
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {showUndoButton && (
            <button
              onClick={undoLastSync}
              disabled={isUndoing || isProcessing}
              className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center"
            >
              <Undo2 size={16} className="mr-1" />
              {isUndoing ? "Undoing..." : "Undo Last Sync"}
            </button>
          )}
          <button
            onClick={syncPlannerAndAddReviews}
            disabled={isProcessing || isUndoing || noActivePlanError}
            className={`${
              noActivePlanError ? "bg-gray-400" : "bg-red-500 hover:bg-red-600"
            } text-white py-2 px-4 rounded transition-colors disabled:opacity-50`}
          >
            {isProcessing ? "Processing..." : "Sync Plan & Schedule Reviews"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlannerSyncScheduler
