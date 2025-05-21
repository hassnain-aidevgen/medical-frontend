"use client"

import { AlertCircle, BookOpen, CheckCircle, Clock } from "lucide-react"
import type React from "react"
import { useCallback, useEffect, useState } from "react"

interface ReviewItem {
  subject: string
  activity: string
  weekNumber: number
  dayOfWeek: string
  taskId: string
  timestamp: number
}

// Define a proper type for the task in performance data
interface TaskPerformance {
  subject: string
  activity: string
  weekNumber: number
  dayOfWeek: string
  taskId: string
  timestamp: number
  status: "completed" | "incomplete" | "not-understood" | "skipped"
}

interface PerformanceData {
  tasks: Record<string, TaskPerformance>
  lastUpdated: number
}

interface ReviewSchedulerProps {
  currentWeekNumber: number
  focusAreas?: string[]
}

export const ReviewScheduler: React.FC<ReviewSchedulerProps> = ({ currentWeekNumber, focusAreas = [] }) => {
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceData>({ tasks: {}, lastUpdated: Date.now() })

  // Load performance data from database
  const loadPerformanceData = useCallback(async () => {
    try {
      const planId = localStorage.getItem("currentPlanId");
      if (planId) {
        const response = await fetch(`https://medical-backend-loj4.onrender.com/api/ai-planner/getTaskPerformance/${planId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setPerformanceData({ tasks: result.taskPerformance || {}, lastUpdated: Date.now() });
          }
        }
      }
    } catch (error) {
      console.error("Error loading performance data:", error);
    }
  }, []);

  // Load review items based on performance data
  const loadReviewItems = useCallback(() => {
    if (!performanceData.tasks || Object.keys(performanceData.tasks).length === 0) return;

    // Find items from the previous week that need review
    // (marked as "not-understood" or "skipped")
    const previousWeekNumber = currentWeekNumber - 1;

    if (previousWeekNumber < 1) return;

    const itemsToReview: ReviewItem[] = [];

    Object.values(performanceData.tasks).forEach((task: TaskPerformance) => {
      if (task.weekNumber === previousWeekNumber && (task.status === "not-understood" || task.status === "skipped")) {
        itemsToReview.push({
          subject: task.subject,
          activity: task.activity,
          weekNumber: task.weekNumber,
          dayOfWeek: task.dayOfWeek,
          taskId: task.taskId,
          timestamp: task.timestamp,
        });
      }
    });

    // Sort by subject to group related topics
    itemsToReview.sort((a, b) => a.subject.localeCompare(b.subject));

    // Filter by focus areas if provided and not empty
    if (focusAreas.length > 0) {
      const filteredItems = itemsToReview.filter((item) => focusAreas.includes(item.subject));
      setReviewItems(filteredItems);
    } else {
      setReviewItems(itemsToReview);
    }
  }, [currentWeekNumber, focusAreas, performanceData]);

  useEffect(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);

  useEffect(() => {
    loadReviewItems();
  }, [loadReviewItems]);

  // If there are no review items, don't render anything
  if (reviewItems.length === 0) {
    return null
  }

  // Group review items by subject
  const groupedBySubject: Record<string, ReviewItem[]> = {}

  reviewItems.forEach((item) => {
    if (!groupedBySubject[item.subject]) {
      groupedBySubject[item.subject] = []
    }
    groupedBySubject[item.subject].push(item)
  })

  // Calculate estimated review time (10 minutes per item, max 60 minutes)
  const estimatedTime = Math.min(reviewItems.length * 10, 60)

  const handleCompleteReview = async () => {
    try {
      const planId = localStorage.getItem("currentPlanId");
      if (!planId) return;

      // Update all review items to completed status
      for (const item of reviewItems) {
        const response = await fetch(`https://medical-backend-loj4.onrender.com/api/ai-planner/updateTaskStatus/${planId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            taskId: item.taskId,
            status: "completed",
            weekNumber: item.weekNumber,
            dayOfWeek: item.dayOfWeek,
            subject: item.subject,
            activity: item.activity
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update task status");
        }
      }

      // Clear the review items and reload performance data
      setReviewItems([]);
      await loadPerformanceData();
    } catch (error) {
      console.error("Error completing review:", error);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <BookOpen className="text-blue-600 mr-2" size={20} />
          <h3 className="font-semibold text-blue-800">Weekly Review Session</h3>
        </div>
        <span className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full">Automated</span>
      </div>

      <p className="text-blue-700 text-sm mb-4">
        Based on your previous week&apos;s performance, we&apos;ve scheduled a review session for these topics:
      </p>

      <div className="space-y-3 mb-4">
        {Object.entries(groupedBySubject).map(([subject, items]) => (
          <div key={subject} className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="font-medium text-blue-800 mb-2">{subject}</div>
            <ul className="space-y-2">
              {items.map((item, index) => (
                <li key={index} className="flex items-start text-sm">
                  <AlertCircle size={16} className="text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{item.activity}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center text-blue-700">
          <Clock className="mr-1" size={16} />
          <span>Estimated time: {estimatedTime} minutes</span>
        </div>

        <button
          className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          onClick={handleCompleteReview}
        >
          <CheckCircle size={16} className="mr-1" />
          Complete Review
        </button>
      </div>
    </div>
  )
}