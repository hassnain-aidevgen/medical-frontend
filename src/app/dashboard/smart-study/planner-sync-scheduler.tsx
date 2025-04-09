"use client"

import axios from "axios"
import { Undo2 } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

// Update the interface to match the Test interface in page.tsx
interface Test {
  _id: string
  date: Date | string
  subjectName: string
  testTopic: string
  completed: boolean
  userId: string
  color: string
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
}

interface PlannerSyncSchedulerProps {
  userId: string
  onTestsAdded?: (tests: Test[]) => void
  onSyncComplete?: () => void
  onRefresh?: () => void
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

const PlannerSyncScheduler = ({ userId, onTestsAdded, onSyncComplete, onRefresh }: PlannerSyncSchedulerProps) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [lastSyncedTests, setLastSyncedTests] = useState<Test[]>([])
  const [isUndoing, setIsUndoing] = useState(false)
  const [showUndoButton, setShowUndoButton] = useState(false)

  // Load last sync time and tests from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedSyncTime = localStorage.getItem("lastPlannerSyncTime")
      if (storedSyncTime) {
        setLastSyncTime(storedSyncTime)
      }

      const storedTests = localStorage.getItem("lastSyncedTests")
      if (storedTests) {
        try {
          const tests = JSON.parse(storedTests)
          setLastSyncedTests(tests)
          setShowUndoButton(true)
        } catch (e) {
          console.error("Error parsing stored tests:", e)
        }
      }
    }
  }, [])

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

  // Update the addTestToCalendar function to use the correct API endpoint
  const addTestToCalendar = async (test: Test): Promise<Test | null> => {
    if (!userId) {
      toast.error("User ID not found. Please log in.")
      return null
    }

    try {
      const response = await axios.post("http://localhost:5000/api/test/calender", {
        userId: test.userId,
        subjectName: test.subjectName,
        testTopic: test.testTopic,
        date: formatDateToString(test.date),
        color: test.color,
        completed: test.completed,
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

  // Function to delete a test from the calendar - updated to use axios
  const deleteTestFromCalendar = async (testId: string): Promise<boolean> => {
    if (!userId) {
      toast.error("User ID not found. Please log in.")
      return false
    }

    try {
      const response = await axios.delete(`http://localhost:5000/api/test/calender/${testId}`)

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return true
    } catch (error) {
      console.error("Failed to delete test:", error)
      return false
    }
  }

  // Update the createReviewTasks function to return Test objects
  const createReviewTasks = (test: Test): Test[] => {
    const reviewTasks: Test[] = []
    const testDate = test.date instanceof Date ? test.date : new Date(test.date)

    // Create review intervals (24 hours, 7 days, 30 days)
    const intervals = [
      { days: 1, label: "24h Review" },
      { days: 7, label: "7d Review" },
      { days: 30, label: "30d Review" },
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
      })
    })

    return reviewTasks
  }

  // Replace the fetchWeeklyPlan function with this updated version:
  const fetchWeeklyPlan = async (): Promise<PlanTask[]> => {
    // First try to get from localStorage
    if (typeof window !== "undefined") {
      const storedPlan = localStorage.getItem("weeklyStudyPlan")
      if (storedPlan) {
        try {
          return JSON.parse(storedPlan)
        } catch (e) {
          console.error("Error parsing stored plan:", e)
        }
      }
    }

    // If not in localStorage, try to fetch from backend
    if (userId) {
      try {
        const response = await axios.get(`http://localhost:5000/api/test/study-plan/${userId}`)
        if (response.data?.studyPlan) {
          console.log("Study plan data:", response.data.studyPlan)

          // Extract tasks from the study plan structure
          const tasks: PlanTask[] = []

          // Check if the study plan has weeklyPlans
          if (response.data.studyPlan.plan?.weeklyPlans) {
            // Iterate through each week
            response.data.studyPlan.plan.weeklyPlans.forEach((week: StudyPlanWeek) => {
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

                      // Convert the task to our PlanTask format
                      tasks.push({
                        id: `task-${Math.random().toString(36).substring(2, 9)}`,
                        title: task.activity,
                        subject: task.subject,
                        topic: task.activity,
                        date: taskDate.toISOString().split("T")[0],
                        duration: task.duration,
                        priority: determinePriority(task.subject),
                      })
                    })
                  }
                })
              }
            })
          }

          return tasks
        }
      } catch (error) {
        console.error("Failed to fetch weekly plan:", error)
      }
    }

    return [] // Return empty array if no plan found
  }

  // Add a helper function to determine priority based on subject
  const determinePriority = (subject: string): "high" | "medium" | "low" => {
    // This is a placeholder logic - you can customize based on your needs
    // For example, you might want to check if the subject is in the user's weak subjects
    const weakSubjects = ["Anatomy", "Pharmacology"] // Example weak subjects
    const mediumSubjects = ["Physiology", "Pathology"] // Example medium subjects

    if (weakSubjects.some((s) => subject.toLowerCase().includes(s.toLowerCase()))) {
      return "high"
    } else if (mediumSubjects.some((s) => subject.toLowerCase().includes(s.toLowerCase()))) {
      return "medium"
    } else {
      return "low"
    }
  }

  // Update the convertPlanTasksToTests function to return Test objects with red color
  const convertPlanTasksToTests = (tasks: PlanTask[], userId: string): Test[] => {
    return tasks.map((task) => ({
      _id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      subjectName: task.subject,
      testTopic: task.title,
      date: new Date(task.date),
      color: "#EF4444", // Red color for all tasks
      completed: false,
      userId: userId,
    }))
  }

  // Function to undo the last sync
  const undoLastSync = async () => {
    if (lastSyncedTests.length === 0) {
      toast.error("No tests to undo")
      return
    }

    setIsUndoing(true)
    toast.loading("Undoing last sync...")

    try {
      let deletedCount = 0
      for (const test of lastSyncedTests) {
        if (test._id) {
          const success = await deleteTestFromCalendar(test._id)
          if (success) {
            deletedCount++
          }
        }
      }

      // Clear the last synced tests
      setLastSyncedTests([])
      localStorage.removeItem("lastSyncedTests")
      setShowUndoButton(false)

      // Refresh the calendar data
      if (onRefresh) {
        onRefresh()
      }

      toast.dismiss()
      toast.success(`Removed ${deletedCount} tests from your calendar`)
    } catch (error) {
      console.error("Error during undo:", error)
      toast.dismiss()
      toast.error("Failed to undo changes. Please try again.")
    } finally {
      setIsUndoing(false)
    }
  }

  // Main function to sync planner and add review tasks
  const syncPlannerAndAddReviews = async () => {
    if (!userId) {
      toast.error("User ID not found. Please log in.")
      return
    }

    setIsProcessing(true)
    toast.loading("Syncing planner and scheduling reviews...")

    try {
      console.log("Fetch weekly plan")
      // 1. Fetch weekly plan
      const planTasks = await fetchWeeklyPlan()

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

      // 6. Update last sync time
      const now = new Date().toISOString()
      setLastSyncTime(now)
      if (typeof window !== "undefined") {
        localStorage.setItem("lastPlannerSyncTime", now)
      }

      // 7. Save the added tests for potential undo
      const allAddedTests = [...addedTests, ...addedReviews]
      setLastSyncedTests(allAddedTests)
      localStorage.setItem("lastSyncedTests", JSON.stringify(allAddedTests))
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
            disabled={isProcessing || isUndoing}
            className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : "Sync Plan & Schedule Reviews"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlannerSyncScheduler