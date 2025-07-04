"use client"

import { Award, BarChart3, CheckCircle, Clock, RefreshCw } from "lucide-react"
import type React from "react"
import { useCallback, useEffect, useState } from "react"
import axios from "axios"
import toast from "react-hot-toast"

// Define proper types for the component props and data structures
interface Task {
  subject: string
  duration: number
  activity: string
  status?: string // Add status field
  _id?: string
}

interface Day {
  dayOfWeek: string
  tasks: Task[]
  status?: string
  completedTasks?: number
  totalTasks?: number
}

interface WeeklyPlan {
  weekNumber: number
  theme: string
  focusAreas: string[]
  days: Day[]
}

interface WeeklyProgress {
  weekNumber: number
  completed: boolean
  completedTasks: number
  totalTasks: number
}

interface CompletionStatus {
  weeklyProgress: WeeklyProgress[]
  overallProgress: number
}

interface UserData {
  daysPerWeek: number
  name?: string
  email?: string
  preferences?: {
    studyTime?: string
    difficulty?: string
  }
}

interface StudyProgressBarProps {
  weeklyPlans: WeeklyPlan[]
  userData: UserData
  planId?: string
  completionStatus?: CompletionStatus // Add completion status prop
}

export const StudyProgressBar: React.FC<StudyProgressBarProps> = ({ 
  weeklyPlans, 
  userData, 
  planId, 
  completionStatus 
}) => {
  const [progress, setProgress] = useState<number>(0)
  const [completedTasks, setCompletedTasks] = useState<number>(0)
  const [totalTasks, setTotalTasks] = useState<number>(0)
  const [daysCompleted, setDaysCompleted] = useState<number>(0)
  const [totalDays, setTotalDays] = useState<number>(0)
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress[]>([])
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  // Calculate progress from completion status
  const calculateProgressFromCompletionStatus = useCallback(() => {
    if (completionStatus) {
      console.log("Using completion status from backend:", completionStatus);
      
      // Use the backend calculated progress
      setProgress(completionStatus.overallProgress || 0);
      
      // Calculate totals from weekly progress
      const totalTasksCount = completionStatus.weeklyProgress.reduce((sum, week) => sum + week.totalTasks, 0);
      const completedTasksCount = completionStatus.weeklyProgress.reduce((sum, week) => sum + week.completedTasks, 0);
      
      setTotalTasks(totalTasksCount);
      setCompletedTasks(completedTasksCount);
      setWeeklyProgress(completionStatus.weeklyProgress);
      
      // Calculate completed days from the actual plan structure
      let completedDaysCount = 0;
      let totalDaysCount = 0;
      
      weeklyPlans.forEach(week => {
        if (week.days) {
          week.days.forEach(day => {
            totalDaysCount++;
            // Check if day is completed based on tasks
            if (day.status === 'completed' || 
                (day.completedTasks && day.totalTasks && day.completedTasks === day.totalTasks)) {
              completedDaysCount++;
            }
          });
        }
      });
      
      setDaysCompleted(completedDaysCount);
      setTotalDays(totalDaysCount);
      
    } else {
      // Fallback to manual calculation if no completion status
      calculateProgressManually();
    }
  }, [completionStatus, weeklyPlans]);

  // Fallback manual calculation
  const calculateProgressManually = useCallback(() => {
    let completed = 0;
    let total = 0;
    let completedDays = 0;
    let totalDaysCount = 0;

    weeklyPlans.forEach((week) => {
      if (week.days) {
        week.days.forEach((day: Day) => {
          totalDaysCount++;
          
          if (day.tasks) {
            total += day.tasks.length;
            
            // Count completed tasks in this day
            const dayCompletedTasks = day.tasks.filter(task => task.status === 'completed').length;
            completed += dayCompletedTasks;
            
            // Check if day is completed
            if (dayCompletedTasks === day.tasks.length && day.tasks.length > 0) {
              completedDays++;
            }
          }
        });
      }
    });

    const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    setProgress(progressPercentage);
    setCompletedTasks(completed);
    setTotalTasks(total);
    setDaysCompleted(completedDays);
    setTotalDays(totalDaysCount);
  }, [weeklyPlans]);

  // Update progress when completion status changes
  useEffect(() => {
    calculateProgressFromCompletionStatus();
  }, [calculateProgressFromCompletionStatus]);

  // Get color based on progress
  const getProgressColor = () => {
    if (progress < 30) return "bg-red-500"
    if (progress < 70) return "bg-amber-500"
    return "bg-green-500"
  }

  // Calculate estimated completion date
  const getEstimatedCompletionDate = () => {
    if (totalDays === 0 || daysCompleted === 0) return "Not available"

    const today = new Date()
    const daysLeft = totalDays - daysCompleted

    if (daysLeft <= 0) return "Completed!"

    // Calculate days per week the user studies
    const daysPerWeek = userData.daysPerWeek || 5

    // Calculate weeks needed to complete remaining days
    const weeksNeeded = daysLeft / daysPerWeek

    // Add that many weeks to today
    const completionDate = new Date(today)
    completionDate.setDate(today.getDate() + weeksNeeded * 7)

    return completionDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Refresh progress from backend
  const refreshFromBackend = async () => {
    if (!planId) {
      toast.error("No plan ID available")
      return
    }

    setIsRefreshing(true)
    try {
      // Get fresh data from backend
      const response = await axios.get(`https://medical-backend-3eek.onrender.com/api/ai-planner/getStudyPlan/${planId}`);
      
      if (response.data.success) {
        // The parent component should handle this update
        toast.success("Progress refreshed successfully")
        // Force recalculation
        calculateProgressFromCompletionStatus();
      } else {
        toast.error("Failed to refresh progress")
      }
    } catch (error) {
      console.error("Error refreshing progress:", error)
      toast.error("Failed to refresh progress")
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <BarChart3 className="text-blue-500 mr-2" size={20} />
          <h3 className="font-semibold text-gray-800">Study Plan Progress</h3>
        </div>
        
        {/* Add refresh button when planId is available */}
        {planId && (
          <button
            onClick={refreshFromBackend}
            disabled={isRefreshing}
            className="flex items-center px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={`mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Overall Progress</span>
          <span className="text-sm font-medium text-blue-600">{progress}% Complete</span>
        </div>
        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
          <div
            className={`h-3 ${getProgressColor()} transition-all duration-500 ease-out`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Weekly Progress Breakdown */}
      {weeklyProgress.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Weekly Breakdown</h4>
          <div className="space-y-2">
            {weeklyProgress.map((week) => (
              <div key={week.weekNumber} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Week {week.weekNumber}</span>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">
                    {week.completedTasks}/{week.totalTasks}
                  </span>
                  <div className="w-16 bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-2 ${week.completed ? 'bg-green-500' : 'bg-blue-500'} transition-all duration-300`}
                      style={{ 
                        width: `${week.totalTasks > 0 ? (week.completedTasks / week.totalTasks) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="text-blue-500 mr-2" size={18} />
            <div>
              <div className="text-sm text-gray-600">Tasks Completed</div>
              <div className="font-medium text-blue-700">
                {completedTasks} of {totalTasks}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center">
            <Clock className="text-blue-500 mr-2" size={18} />
            <div>
              <div className="text-sm text-gray-600">Days Completed</div>
              <div className="font-medium text-blue-700">
                {daysCompleted} of {totalDays}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center">
            <Award className="text-blue-500 mr-2" size={18} />
            <div>
              <div className="text-sm text-gray-600">Est. Completion</div>
              <div className="font-medium text-blue-700">{getEstimatedCompletionDate()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 italic">
        Progress is calculated based on completed tasks. Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  )
}