"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import axios from "axios"
import { Calendar, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

interface ReschedulePlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planId: string | null
  onSuccess: () => void
}

const ReschedulePlanDialog: React.FC<ReschedulePlanDialogProps> = ({ open, onOpenChange, planId, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [examDate, setExamDate] = useState("")
  const [planDetails, setPlanDetails] = useState<{
    targetExam?: string
    name?: string
  } | null>(null)

  // Fetch plan details when dialog opens
  useEffect(() => {
    if (open && planId) {
      fetchPlanDetails(planId)
    }
  }, [open, planId])

  const fetchPlanDetails = async (planId: string) => {
    try {
      const response = await axios.get(
        `https://medical-backend-loj4.onrender.com/api/ai-planner/getStudyPlan/${planId}`,
      )

      if (response.data.success && response.data.data) {
        setPlanDetails({
          targetExam: response.data.data.targetExam,
          name: response.data.data.name,
        })

        // Set a default exam date 3 months from now
        const defaultDate = new Date()
        defaultDate.setMonth(defaultDate.getMonth() + 3)
        setExamDate(defaultDate.toISOString().split("T")[0])
      }
    } catch (error) {
      console.error("Error fetching plan details:", error)
      toast.error("Failed to load plan details")
    }
  }

  const handleReschedulePlan = async () => {
    if (!planId) {
      toast.error("No plan ID provided")
      return
    }

    if (!examDate) {
      toast.error("Please select an exam date")
      return
    }

    // Validate exam date is in the future
    const selectedDate = new Date(examDate)
    if (selectedDate <= new Date()) {
      toast.error("Exam date must be in the future")
      return
    }
    // ADD THESE SAFEGUARDS HERE
  localStorage.setItem("isNewPlanGeneration", "true")

  // Clear any existing performance data
  const emptyProgressData = {
    tasks: {},
    lastUpdated: Date.now(),
  }
  localStorage.setItem("studyPlanPerformance", JSON.stringify(emptyProgressData))
  
  // Also clear ALL plan-specific data
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    // Check if this is a plan-specific performance data key
    if (key && key.startsWith("studyPlanPerformance_")) {
      // Clear this plan's data
      localStorage.setItem(key, JSON.stringify(emptyProgressData))
    }
  }
  // END OF ADDED SAFEGUARDS

    setIsLoading(true)

    try {
      // Get the original plan data
      const planResponse = await axios.get(
        `https://medical-backend-loj4.onrender.com/api/ai-planner/getStudyPlan/${planId}`,
      )

      if (!planResponse.data.success || !planResponse.data.data) {
        throw new Error("Failed to fetch original plan data")
      }

      const originalPlan = planResponse.data.data
      const userId = localStorage.getItem("Medical_User_Id")

      // Prepare data for submission
      const submissionData = {
        name: originalPlan.name,
        email: originalPlan.email,
        currentLevel: originalPlan.currentLevel,
        targetExam: originalPlan.targetExam,
        examDate: examDate, // Use the new exam date
        strongSubjects: originalPlan.strongSubjects || ["Anatomy"],
        weakSubjects: originalPlan.weakSubjects || [],
        availableHours: originalPlan.availableHours || 2,
        daysPerWeek: originalPlan.daysPerWeek || 5,
        preferredTimeOfDay: originalPlan.preferredTimeOfDay || "morning",
        preferredLearningStyle: originalPlan.preferredLearningStyle || "visual",
        targetScore: originalPlan.targetScore || "",
        specificGoals: originalPlan.specificGoals || "",
        additionalInfo: `Rescheduled from plan ${planId}. ${originalPlan.additionalInfo || ""}`,
        previousScores: originalPlan.previousScores || "",
      }

      // Generate new plan
      const response = await axios.post(
        `https://medical-backend-loj4.onrender.com/api/test/generatePlan?userId=${userId}`,
        submissionData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      if (response.status !== 200) {
        throw new Error(response.data.error || "Failed to generate plan")
      }

      // Save the new plan ID to localStorage
      if (response.data.data && response.data.data.planId) {
        localStorage.setItem("currentPlanId", response.data.data.planId)

        // Add plan tasks to calendar
        try {
          await addPlanTasksToCalendar(response.data.data)
        } catch (error) {
          console.error("Error adding tasks to calendar:", error)
        }
      }

      onSuccess()
      onOpenChange(false)
      toast.success("Plan rescheduled successfully!")
    } catch (error) {
      console.error("Error rescheduling plan:", error)
      toast.error("Failed to reschedule plan. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Function to add study plan tasks to the calendar (copied from planner-form.tsx)
  const addPlanTasksToCalendar = async (planData: any) => {
    console.log("=== CALENDAR INTEGRATION: Starting to add plan tasks to calendar ===")

    if (!planData || !planData.plan || !planData.plan.weeklyPlans) {
      console.error("CALENDAR INTEGRATION: Invalid plan data structure:", planData)
      return
    }

    const userId = localStorage.getItem("Medical_User_Id")
    if (!userId) {
      console.error("CALENDAR INTEGRATION: No user ID found in localStorage")
      return
    }

    try {
      let addedCount = 0
      let errorCount = 0

      // Process each week in the study plan
      for (const week of planData.plan.weeklyPlans) {
        if (!week.days) continue

        // Process each day in the week
        for (const day of week.days) {
          if (!day.tasks) continue

          // Get the day of week index (0 = Sunday, 1 = Monday, etc.)
          const dayIndex = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].findIndex(
            (d) => d.toLowerCase() === day.dayOfWeek.toLowerCase(),
          )

          if (dayIndex === -1) continue

          // Calculate the date for this day
          const today = new Date()
          const taskDate = new Date(today)
          const currentDay = today.getDay()

          // Calculate days to add to get to the target day this week
          let daysToAdd = (dayIndex - currentDay + 7) % 7

          // Add week offset (for future weeks)
          const weekIndex = planData.plan.weeklyPlans.indexOf(week)
          daysToAdd += weekIndex * 7

          taskDate.setDate(today.getDate() + daysToAdd)

          // Process each task for this day
          for (const task of day.tasks) {
            try {
              // Create the task data
              const taskData = {
                userId: userId,
                subjectName: task.subject,
                testTopic: `${week.theme}: ${task.activity}`,
                date: taskDate.toISOString(),
                color: getSubjectColor(task.subject),
                completed: false,
                planId: planData.planId || null,
                taskType: "study",
                duration: 60, // Default duration in minutes
                priority: "medium", // Default priority
                resources: [], // Default empty resources array
                weekNumber: weekIndex + 1, // Week number (1-based)
                dayOfWeek: day.dayOfWeek, // Day of week from the plan
                notes: task.details || "", // Use details as notes if available
                isReviewTask: false, // Default to false
                originalTaskId: null, // No original task ID for new tasks
                source: "ai-planner", // Mark as coming from AI planner
              }

              // Add the task to the calendar
              const response = await axios.post(
                "https://medical-backend-loj4.onrender.com/api/ai-planner/add_ai_plan_to_calender",
                taskData,
              )

              addedCount++
            } catch (error) {
              errorCount++
              console.error("CALENDAR INTEGRATION: Failed to add task to calendar:", error)
            }
          }
        }
      }

      console.log(`CALENDAR INTEGRATION: Finished adding tasks. Added: ${addedCount}, Errors: ${errorCount}`)
    } catch (error) {
      console.error("CALENDAR INTEGRATION: Error in overall calendar integration process:", error)
    }
  }

  // Helper function to get color based on subject
  const getSubjectColor = (subject: string): string => {
    // Map of subjects to colors
    const subjectColors: Record<string, string> = {
      Anatomy: "#3B82F6", // blue
      Physiology: "#10B981", // green
      Biochemistry: "#F59E0B", // amber
      Pharmacology: "#EC4899", // pink
      Pathology: "#8B5CF6", // purple
      Microbiology: "#F97316", // orange
      Immunology: "#06B6D4", // cyan
      "Behavioral Science": "#6366F1", // indigo
      Biostatistics: "#14B8A6", // teal
      Genetics: "#D946EF", // fuchsia
      Nutrition: "#84CC16", // lime
      "Cell Biology": "#0EA5E9", // sky
    }

    // Return the color for the subject, or a default color if not found
    return subjectColors[subject] || "#3B82F6"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Reschedule Study Plan
          </DialogTitle>
          <DialogDescription>
            {planDetails ? (
              <div className="mt-2">
                <p>
                  Reschedule your study plan for <strong>{planDetails.targetExam}</strong>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  This will create a new plan based on your original preferences but with updated dates.
                </p>
              </div>
            ) : (
              <p>Loading plan details...</p>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="examDate" className="text-sm font-medium">
              New Exam Date
            </label>
            <input
              id="examDate"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={new Date().toISOString().split("T")[0]}
              required
            />
            <p className="text-xs text-gray-500">
              Select your new target exam date. Your study plan will be adjusted accordingly.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleReschedulePlan}
            disabled={isLoading || !examDate}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rescheduling...
              </>
            ) : (
              "Reschedule Plan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ReschedulePlanDialog
