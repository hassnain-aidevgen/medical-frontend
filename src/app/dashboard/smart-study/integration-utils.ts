// integration-utils.ts
// This file contains utility functions to sync task status between Smart Study Calendar and AI Planner
// import { forceProgressUpdate } from './study-progress-bar';
import { forceProgressUpdate } from "../study-planner/components/study-progress-bar"

// Define the interface for task performance data
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

/**
 * Updates the AI Planner's progress data when a task is completed in the Smart Study Calendar
 * @param testId - The ID of the test/task in the calendar
 * @param subject - The subject of the task
 * @param topic - The topic/activity of the task
 * @param completed - Whether the task is completed or not
 * @param planId - The ID of the AI plan this task belongs to (if applicable)
 * @param dayOfWeek - The day of the week for this task
 */
export function updateAIPlannerProgress(
  testId: string,
  subject: string,
  topic: string,
  completed: boolean,
  planId?: string,
  dayOfWeek?: string,
): void {
  console.log("=== UPDATING AI PLANNER PROGRESS ===")
  console.log("Test ID:", testId)
  console.log("Subject:", subject)
  console.log("Topic:", topic)
  console.log("Completed:", completed)
  console.log("Plan ID:", planId)
  console.log("Day of Week:", dayOfWeek)

  // Only proceed if this is an AI Planner task (has planId)
  if (!planId) {
    console.log("Not an AI Planner task (no planId), skipping progress update")
    return
  }

  try {
    // Get current performance data from localStorage
    const storedData = localStorage.getItem("studyPlanPerformance")
    console.log("Raw localStorage data:", storedData)

    const performanceData: PerformanceData = storedData
      ? JSON.parse(storedData)
      : { tasks: {}, lastUpdated: Date.now() }

    console.log("Parsed performance data:", performanceData)
    console.log("Current tasks in performance data:", Object.keys(performanceData.tasks).length)

    // Extract week number from the topic if possible
    let weekNumber = 1
    const weekMatch = topic.match(/Week\s+(\d+):/i)
    if (weekMatch && weekMatch[1]) {
      weekNumber = Number.parseInt(weekMatch[1], 10)
      console.log("Extracted week number from topic:", weekNumber)
    } else {
      console.log("Could not extract week number from topic, using default:", weekNumber)
    }

    // Clean up the topic by removing the week prefix if present
    const cleanTopic = topic.replace(/Week\s+\d+:\s*/i, "")
    console.log("Cleaned topic:", cleanTopic)

    // Generate multiple possible taskId formats to ensure we find a match
    const possibleTaskIds = [
      // Format used in AI Planner
      `${weekNumber}-${dayOfWeek || "unknown"}-${subject}-${cleanTopic}`,
      // Alternative format with lowercase
      `${weekNumber}-${(dayOfWeek || "unknown").toLowerCase()}-${subject}-${cleanTopic}`,
      // Simple format
      `${subject}-${cleanTopic}`,
      // Using the test ID directly
      testId,
    ]

    console.log("Generated possible task IDs:", possibleTaskIds)

    // Check if any of these IDs already exist in the performance data
    let existingTaskId = null
    for (const id of possibleTaskIds) {
      if (performanceData.tasks[id]) {
        existingTaskId = id
        console.log("Found existing task with ID:", existingTaskId)
        break
      }
    }

    // If we found an existing task, update it
    if (existingTaskId) {
      console.log(`Updating existing task with ID: ${existingTaskId}`)
      console.log("Previous status:", performanceData.tasks[existingTaskId].status)
      performanceData.tasks[existingTaskId].status = completed ? "completed" : "incomplete"
      performanceData.tasks[existingTaskId].timestamp = Date.now()
      console.log("New status:", performanceData.tasks[existingTaskId].status)
    } else {
      // Otherwise create a new task entry
      const taskId = possibleTaskIds[0] // Use the first format as default
      console.log(`Creating new task with ID: ${taskId}`)
      performanceData.tasks[taskId] = {
        weekNumber,
        dayOfWeek: dayOfWeek || "unknown",
        subject,
        activity: cleanTopic,
        status: completed ? "completed" : "incomplete",
        taskId,
        timestamp: Date.now(),
      }
      console.log("New task created:", performanceData.tasks[taskId])
    }

    // Update the lastUpdated timestamp
    performanceData.lastUpdated = Date.now()
    console.log("Updated lastUpdated timestamp:", performanceData.lastUpdated)

    // Save back to localStorage
    localStorage.setItem("studyPlanPerformance", JSON.stringify(performanceData))
    
    console.log("Saved updated performance data to localStorage")

    // Also save to plan-specific storage
    const currentPlanId = localStorage.getItem("currentPlanId");
if (currentPlanId) {
  const planProgressKey = `studyPlanPerformance_${currentPlanId}`;
  localStorage.setItem(planProgressKey, JSON.stringify(performanceData));
  console.log("Also saved progress data to plan-specific storage:", planProgressKey);
}

    // Check if the data was actually saved
    const verifyData = localStorage.getItem("studyPlanPerformance")
    console.log("Verification - data in localStorage after save:", verifyData ? "Data exists" : "No data found")

    // Double-check what was actually saved
    const doubleCheck = localStorage.getItem("studyPlanPerformance")
    console.log("DOUBLE CHECK - Raw localStorage data after save:", doubleCheck)

    if (doubleCheck) {
      try {
        const parsedCheck = JSON.parse(doubleCheck)
        console.log("DOUBLE CHECK - Parsed data:", parsedCheck)
        console.log("DOUBLE CHECK - Tasks count:", Object.keys(parsedCheck.tasks || {}).length)

        // Log each task
        if (parsedCheck.tasks) {
          Object.entries(parsedCheck.tasks).forEach(([id, task]) => {
            console.log(`DOUBLE CHECK - Task ${id}:`, task)
          })
        }
      } catch (e) {
        console.error("DOUBLE CHECK - Error parsing data:", e)
      }
    }

    // Force a refresh of the progress bar if it's currently visible
    console.log("Dispatching studyPlanProgressUpdated event")
    const event = new CustomEvent("studyPlanProgressUpdated", {
      detail: { updatedAt: Date.now() },
    })
    window.dispatchEvent(event)

    // Also try to force update directly using the imported function
    try {
      forceProgressUpdate()
      console.log("Called forceProgressUpdate directly")
    } catch (e) {
      console.log("Could not call forceProgressUpdate directly:", e)
    }

    console.log("=== COMPLETED AI PLANNER PROGRESS UPDATE ===")
  } catch (error) {
    console.error("Error updating AI Planner progress:", error)
  }
}

/**
 * Gets the current progress percentage from the AI Planner data
 * @returns The current progress percentage (0-100)
 */
export function getAIPlannerProgress(): number {
  try {
    const storedData = localStorage.getItem("studyPlanPerformance")
    if (!storedData) return 0

    const performanceData: PerformanceData = JSON.parse(storedData)

    // Count completed tasks
    let completed = 0
    const total = Object.keys(performanceData.tasks).length

    if (total === 0) return 0

    Object.values(performanceData.tasks).forEach((task) => {
      if (task.status === "completed") {
        completed++
      }
    })

    return Math.round((completed / total) * 100)
  } catch (error) {
    console.error("Error getting AI Planner progress:", error)
    return 0
  }
}

/**
 * Manually triggers a progress update in the StudyProgressBar component
 * This can be called from anywhere to force the progress bar to update
 */
export function triggerProgressBarUpdate(): void {
  console.log("Manually triggering progress bar update")

  try {
    // First try the direct function
    forceProgressUpdate()
  } catch (e) {
    // Fall back to dispatching the event
    console.log("Direct function call failed, dispatching event instead:", e)
    const event = new CustomEvent("studyPlanProgressUpdated", {
      detail: { updatedAt: Date.now() },
    })
    window.dispatchEvent(event)
  }
}
