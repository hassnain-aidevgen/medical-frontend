"use client";

import { useEffect, useState, useRef } from "react";

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
  focusAreas: string[];
  tasks: Task[];
}

export interface Week {
  weekNumber: number;
  theme: string;
  focusAreas: string[];
  weeklyGoals: WeeklyGoal[];
  days: Day[];
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

export type TaskStatus = "completed" | "incomplete" | "not-understood" | "skipped";

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
  const hasLoadedData = useRef(false);

  // ✅ Load once
  useEffect(() => {
    if (hasLoadedData.current) return;
  
    const storedData = localStorage.getItem("studyPlanPerformance");
    let parsedData;
  
    try {
      parsedData = storedData ? JSON.parse(storedData) : null;
    } catch (error) {
      console.error("Failed to parse localStorage data", error);
      parsedData = null;
    }
  
    if (parsedData && typeof parsedData === "object" && parsedData.tasks) {
      setPerformanceData(parsedData);
      
      const tasksArray = Object.values(parsedData.tasks) as TaskPerformance[];
      const needsReplan = tasksArray.some(
        (task) => task.status === "not-understood" || task.status === "skipped"
      );
      setNeedsReplanning(needsReplan);
    }
  
    hasLoadedData.current = true;
  }, []);
  

  // ✅ Save only after mount
  useEffect(() => {
    if (hasLoadedData.current) {
      try {
        localStorage.setItem("studyPlanPerformance", JSON.stringify(performanceData));
      } catch (err) {
        console.error("Error saving performance data to localStorage:", err);
      }
    }
  }, [performanceData.lastUpdated]);

  const handleTaskStatusChange = (taskId: string, status: TaskStatus) => {
    const parts = taskId.split("-");
    if (parts.length < 4) return;

    const weekNumber = parseInt(parts[0], 10);
    const dayOfWeek = parts[1];
    const subject = parts.slice(2, -1).join("-");
    const activity = parts[parts.length - 1];

    const updatedTask: TaskPerformance = {
      subject,
      activity,
      weekNumber,
      dayOfWeek,
      taskId,
      timestamp: Date.now(),
      status,
    };

    setPerformanceData((prev) => {
      const updatedTasks = {
        ...prev.tasks,
        [taskId]: updatedTask,
      };

      const needsReplan = Object.values(updatedTasks).some(
        (task) => task.status === "not-understood" || task.status === "skipped"
      );

      setNeedsReplanning(needsReplan);

      return {
        tasks: updatedTasks,
        lastUpdated: Date.now(),
      };
    });
  };

  const getTaskStatus = (
    weekNumber: number,
    dayOfWeek: string,
    subject: string,
    activity: string
  ): TaskStatus => {
    const taskId = `${weekNumber}-${dayOfWeek}-${subject}-${activity}`.replace(/\s+/g, "-").toLowerCase();
    return performanceData.tasks[taskId]?.status || "incomplete";
  };
  const lastUpdateRef = useRef<string>(JSON.stringify(studyPlan.plan.weeklyPlans));

const applyReplanning = () => {
  if (!studyPlan?.plan?.weeklyPlans) return;

  const updatedPlan = structuredClone(studyPlan);

  const tasksToRedistribute = Object.values(performanceData.tasks).filter(
    (task) => task.status === "not-understood" || task.status === "skipped"
  );

  if (tasksToRedistribute.length === 0) {
    setNeedsReplanning(false);
    return;
  }

  tasksToRedistribute.forEach((task) => {
    const futureWeek = updatedPlan.plan.weeklyPlans.find(
      (week) => week.weekNumber > task.weekNumber && week.weekNumber <= task.weekNumber + 2
    );

    if (futureWeek?.days?.length) {
      futureWeek.days[0].tasks.push({
        subject: task.subject,
        activity: `Review: ${task.activity}`,
        duration: 30,
        isReview: true,
      });
    }
  });

  const updatedTasks = { ...performanceData.tasks };
  tasksToRedistribute.forEach((task) => {
    updatedTasks[task.taskId] = {
      ...task,
      status: "incomplete",
    };
  });

  setPerformanceData({
    tasks: updatedTasks,
    lastUpdated: Date.now(),
  });

  setNeedsReplanning(false);

  // ✅ Compare with the last update to prevent recursive loop
  const updatedPlanString = JSON.stringify(updatedPlan.plan.weeklyPlans);
  if (updatedPlanString !== lastUpdateRef.current) {
    lastUpdateRef.current = updatedPlanString;
    onPlanUpdate(updatedPlan);
  }
};

  
  

  return {
    handleTaskStatusChange,
    getTaskStatus,
    needsReplanning,
    applyReplanning,
  };
}

