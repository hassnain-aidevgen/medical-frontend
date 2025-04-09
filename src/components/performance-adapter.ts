"use client";

import { useEffect, useState } from "react";

// Define the types expected by the performance adapter
export interface Task {
  subject: string;
  duration: number;
  activity: string;
  resources?: Resource[];
  isReview?: boolean;
}

export interface Resource {
  name: string;
  type?: string;
  description: string;
}

export interface Day {
  dayOfWeek: string;
  focusAreas: string[]; // Note: This is required, not optional
  tasks: Task[];
}

export interface Week {
  weekNumber: number;
  theme: string;
  focusAreas: string[]; // Note: This is required, not optional
  weeklyGoals: WeeklyGoal[]; // Changed from optional to required
  days: Day[]; // Changed from optional to required
}

export interface WeeklyGoal {
  subject: string;
  description: string;
}

export interface StudyPlan {
  plan: {
    title: string;
    overview: string;
    examInfo?: {
      exam: string;
      targetDate?: string;
      targetScore?: string;
    };
    weeklyPlans: Week[];
    resources?: {
      books?: {
        title: string;
        author: string;
        description: string;
        relevantTopics?: string[];
      }[];
      videos?: {
        title: string;
        platform: string;
        description: string;
        relevantTopics?: string[];
      }[];
      questionBanks?: {
        title: string;
        description: string;
        relevantTopics?: string[];
      }[];
    };
    studyTips?: {
      title: string;
      description: string;
    }[];
  };
  metadata: {
    generatedAt: string;
    model: string;
    examName: string;
    duration: string;
  };
}

export interface UserData {
  name: string;
  email: string;
  currentLevel: string;
  targetExam: string;
  examDate: string;
  strongSubjects: string[];
  weakSubjects: string[];
  availableHours: number;
  daysPerWeek: number;
  preferredTimeOfDay: string;
  preferredLearningStyle: string;
  targetScore: string;
  specificGoals: string;
  additionalInfo: string;
  previousScores: string;
}

export type TaskStatus =
  | "completed"
  | "incomplete"
  | "not-understood"
  | "skipped";

export interface TaskPerformance {
  subject: string;
  activity: string;
  weekNumber: number;
  dayOfWeek: string;
  taskId: string;
  timestamp: number;
  status: TaskStatus;
}

export function usePerformanceAdapter(
  studyPlan: StudyPlan,
  userData: UserData,
  onPlanUpdate: (updatedPlan: StudyPlan) => void
) {
  const [performanceData, setPerformanceData] = useState<{
    tasks: Record<string, TaskPerformance>;
    lastUpdated: number;
  }>({ tasks: {}, lastUpdated: Date.now() });
  const [needsReplanning, setNeedsReplanning] = useState(false);

  // Load performance data from localStorage on mount
  useEffect(() => {
    const storedData = localStorage.getItem("studyPlanPerformance");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setPerformanceData(parsedData);

        // Check if we need replanning
        const tasksArray = Object.values(parsedData.tasks) as TaskPerformance[];
        const needsReplan = tasksArray.some(
          (task) =>
            task.status === "not-understood" || task.status === "skipped"
        );
        setNeedsReplanning(needsReplan);
      } catch (error) {
        console.error("Error parsing performance data:", error);
      }
    }
  }, []);

  // Save performance data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      "studyPlanPerformance",
      JSON.stringify(performanceData)
    );
  }, [performanceData]);

  // Function to handle task status changes
  const handleTaskStatusChange = (taskId: string, status: TaskStatus) => {
    // Extract task information from the taskId
    // Format: weekNumber-dayOfWeek-subject-activity
    const parts = taskId.split("-");
    if (parts.length < 4) {
      console.error("Invalid taskId format:", taskId);
      return;
    }

    const weekNumber = parseInt(parts[0], 10);
    const dayOfWeek = parts[1];
    // The subject and activity might contain hyphens, so we need to reconstruct them
    const subject = parts.slice(2, -1).join("-");
    const activity = parts[parts.length - 1];

    setPerformanceData((prev) => {
      const newTasks = {
        ...prev.tasks,
        [taskId]: {
          subject,
          activity,
          weekNumber,
          dayOfWeek,
          taskId,
          timestamp: Date.now(),
          status,
        },
      };

      // Check if we need replanning
      const needsReplan = Object.values(newTasks).some(
        (task) => task.status === "not-understood" || task.status === "skipped"
      );
      setNeedsReplanning(needsReplan);

      return {
        tasks: newTasks,
        lastUpdated: Date.now(),
      };
    });
  };

  // Function to get the status of a task
  const getTaskStatus = (
    weekNumber: number,
    dayOfWeek: string,
    subject: string,
    activity: string
  ): TaskStatus => {
    // Generate a consistent task ID
    const taskId = `${weekNumber}-${dayOfWeek}-${subject}-${activity}`
      .replace(/\s+/g, "-")
      .toLowerCase();

    // Return the status if it exists, otherwise "incomplete"
    return performanceData.tasks[taskId]?.status || "incomplete";
  };

  // Function to apply replanning
  const applyReplanning = () => {
    // Clone the study plan
    const updatedPlan = JSON.parse(JSON.stringify(studyPlan)) as StudyPlan;

    // Get tasks that need to be redistributed
    const tasksToRedistribute = Object.values(performanceData.tasks).filter(
      (task) => task.status === "not-understood" || task.status === "skipped"
    );

    if (tasksToRedistribute.length === 0) {
      setNeedsReplanning(false);
      return;
    }

    // Simple algorithm to redistribute tasks to future weeks
    tasksToRedistribute.forEach((task) => {
      const { weekNumber, subject, activity } = task;

      // Find a future week to add this task as a review
      const futureWeek = updatedPlan.plan.weeklyPlans.find(
        (week) =>
          week.weekNumber > weekNumber && week.weekNumber <= weekNumber + 2
      );

      if (futureWeek && futureWeek.days && futureWeek.days.length > 0) {
        // Add to the first day of the future week
        const targetDay = futureWeek.days[0];

        // Add as a review task
        targetDay.tasks.push({
          subject,
          activity: `Review: ${activity}`,
          duration: 30, // Default review duration
          isReview: true,
        });
      }
    });

    // Mark tasks as redistributed by changing their status to "incomplete"
    const updatedTasks = { ...performanceData.tasks };
    tasksToRedistribute.forEach((task) => {
      updatedTasks[task.taskId] = {
        ...task,
        status: "incomplete",
      };
    });

    // Update performance data
    setPerformanceData({
      tasks: updatedTasks,
      lastUpdated: Date.now(),
    });

    // Reset replanning flag
    setNeedsReplanning(false);

    // Call the callback with the updated plan
    onPlanUpdate(updatedPlan);
  };

  return {
    handleTaskStatusChange,
    getTaskStatus,
    needsReplanning,
    applyReplanning,
  };
}
