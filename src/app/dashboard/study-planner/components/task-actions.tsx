"use client"

import { CheckCircle, HelpCircle, XCircle } from "lucide-react";
import type React from "react";
// import type { TaskStatus } from "./performance-adapter"

type TaskStatus =
  | "completed"
  | "incomplete"
  | "not-understood"
  | "skipped";


interface TaskActionsProps {
  taskId: string
  subject: string
  activity: string
  weekNumber: number
  dayOfWeek: string
  date: string
  onStatusChange: (
    taskId: string,
    subject: string,
    activity: string,
    weekNumber: number,
    dayOfWeek: string,
    status: TaskStatus,
  ) => void
  currentStatus: TaskStatus
}

export const TaskActions: React.FC<TaskActionsProps> = ({
  taskId,
  subject,
  activity,
  weekNumber,
  dayOfWeek,
  onStatusChange,
  currentStatus = "incomplete",
}) => {
  return (
    <div className="flex justify-end gap-2 mt-3">
      <button
        onClick={() => onStatusChange(taskId, subject, activity, weekNumber, dayOfWeek, "completed")}
        className={`p-1.5 rounded-full transition-colors ${currentStatus === "completed"
          ? "bg-green-500 text-white"
          : "bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-600"
          }`}
        title="Mark as completed"
      >
        <CheckCircle size={16} />
      </button>
      <button
        onClick={() => onStatusChange(taskId, subject, activity, weekNumber, dayOfWeek, "not-understood")}
        className={`p-1.5 rounded-full transition-colors ${currentStatus === "not-understood"
          ? "bg-amber-500 text-white"
          : "bg-gray-100 text-gray-500 hover:bg-amber-100 hover:text-amber-600"
          }`}
        title="Mark as not understood"
      >
        <HelpCircle size={16} />
      </button>
      <button
        onClick={() => onStatusChange(taskId, subject, activity, weekNumber, dayOfWeek, "skipped")}
        className={`p-1.5 rounded-full transition-colors ${currentStatus === "skipped"
          ? "bg-red-500 text-white"
          : "bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600"
          }`}
        title="Mark as skipped"
      >
        <XCircle size={16} />
      </button>
    </div>
  )
}
