import type { StudyPlan } from "../components/performance-adapter";
import type {
  StudyPlanResponse,
  StudyPlanWeek,
} from "../types/study-plan-types";

// This function adapts the StudyPlanResponse to the format expected by the performance adapter
export function adaptStudyPlanForPerformance(
  studyPlan: StudyPlanResponse
): StudyPlan {
  // Create a deep copy to avoid mutating the original
  const adaptedPlan = JSON.parse(JSON.stringify(studyPlan));

  // Ensure all weeklyPlans have days array (not undefined)
  adaptedPlan.plan.weeklyPlans = adaptedPlan.plan.weeklyPlans.map(
    (week: Partial<StudyPlanWeek>) => ({
      ...week,
      // Ensure days is always an array, never undefined
      days: week.days || [],
      // Ensure focusAreas is always an array, never undefined
      focusAreas: week.focusAreas || [],
      // Ensure weeklyGoals is always an array, never undefined
      weeklyGoals: week.weeklyGoals || [],
    })
  );

  return adaptedPlan as StudyPlan;
}
