// plan-loader.ts
// This file contains functions to load plan data and update the progress bar

import { triggerProgressBarUpdate } from "./integration-utils"

/**
 * Loads a specific plan and its progress data
 * @param planId - The ID of the plan to load
 */
export function loadPlan(planId: string): void {
  console.log("=== LOADING PLAN ===")
  console.log("Plan ID:", planId)

  try {
    // First, try to load the plan's progress data from a plan-specific key
    const planProgressKey = `studyPlanPerformance_${planId}`
    const planProgressData = localStorage.getItem(planProgressKey)

    console.log("Looking for plan-specific progress data with key:", planProgressKey)
    console.log("Found plan-specific data:", planProgressData ? "Yes" : "No")

    if (planProgressData) {
      // If we have plan-specific progress data, use it
      console.log("Loading plan-specific progress data")
      localStorage.setItem("studyPlanPerformance", planProgressData)

      // Update the current plan ID in localStorage
      localStorage.setItem("currentPlanId", planId)

      // Trigger a progress bar update
      triggerProgressBarUpdate()
      console.log("Progress bar update triggered for plan:", planId)
    } else {
      // If no plan-specific data exists, initialize empty progress data
      console.log("No plan-specific progress data found, initializing empty data")
      const emptyProgressData = {
        tasks: {},
        lastUpdated: Date.now(),
      }

      localStorage.setItem("studyPlanPerformance", JSON.stringify(emptyProgressData))
      localStorage.setItem("currentPlanId", planId)

      // Trigger a progress bar update
      triggerProgressBarUpdate()
      console.log("Progress bar update triggered with empty data for plan:", planId)
    }

    console.log("=== PLAN LOADING COMPLETE ===")
  } catch (error) {
    console.error("Error loading plan:", error)
  }
}

/**
 * Saves the current progress data for the current plan
 * This should be called when switching away from a plan
 */
export function saveCurrentPlanProgress(): void {
  try {
    const currentPlanId = localStorage.getItem("currentPlanId")
    if (!currentPlanId) {
      console.log("No current plan ID found, nothing to save")
      return
    }

    const progressData = localStorage.getItem("studyPlanPerformance")
    if (progressData) {
      // Save the current progress data to a plan-specific key
      const planProgressKey = `studyPlanPerformance_${currentPlanId}`
      localStorage.setItem(planProgressKey, progressData)
      console.log("Saved current progress data for plan:", currentPlanId)
    }
  } catch (error) {
    console.error("Error saving current plan progress:", error)
  }
}
