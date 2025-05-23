"use client"

import React, { useState } from "react";

import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  Award,
  BarChart3,
  Book,
  Bookmark,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  GraduationCap,
  HelpCircle,
  Layers,
  Lightbulb,
  ListTodo,
  Printer,
  X,
  XCircle,
  Check,
} from "lucide-react"
import { useEffect, useRef, useMemo } from "react"
// Add this import at the top
import { jsPDF } from "jspdf"

// Import our new components
import { MockExamBlock } from "./components/mock-exam-block"
import { usePerformanceAdapter } from "./components/performance-adapter"
import { ReplanAlert } from "./components/replan-alert"
import { StudyProgressBar } from "./components/study-progress-bar"
import { getExamNumber, shouldPlaceMockExam } from "./utils/mock-exam-utils"
import { generateTaskId } from "./utils/task-utils"
// Add this import at the top with the other component imports
import { ReviewScheduler } from "./components/review-scheduler"

import type { StudyPlanResponse, StudyPlanResultsProps } from "./types/study-plan-types"
import { adaptStudyPlanForPerformance } from "./utils/adapter-utils"
import toast from "react-hot-toast"

// Define type for task performance data
interface TaskPerformance {
  subject: string
  activity: string
  weekNumber: number
  dayOfWeek: string
  taskId: string
  timestamp: number
  status: "completed" | "incomplete"
}

// Simple Task Actions Component
const SimpleTaskActions: React.FC<{
  taskId: string
  subject: string
  activity: string
  weekNumber: number
  dayOfWeek: string
  date: string | number | Date
  onStatusChange: (
    taskId: string,
    subject: string,
    activity: string,
    weekNumber: number,
    dayOfWeek: string,
    status: "completed" | "incomplete"
  ) => void
  currentStatus: "completed" | "incomplete"
}> = ({
  taskId,
  subject,
  activity,
  weekNumber,
  dayOfWeek,
  date,
  onStatusChange,
  currentStatus,
}) => {
 const [isRescheduling, setIsRescheduling] = useState(false);

  // Check if task is overdue
  const isTaskOverdue = () => {
    if (!date || currentStatus === "completed") return false;
    
    const today = new Date();
    const taskDate = new Date(date);
    
    // Format both dates as YYYY-MM-DD for comparison
    const formatDate = (d: any) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return formatDate(taskDate) < formatDate(today);
  };

  const handleToggleComplete = () => {
    const newStatus = currentStatus === "completed" ? "incomplete" : "completed"
    onStatusChange(taskId, subject, activity, weekNumber, dayOfWeek, newStatus)
  }

   const handleReschedule = async () => {
    setIsRescheduling(true);
    
    try {
      const planId = localStorage.getItem("currentPlanId");
      const response = await fetch(`https://medical-backend-loj4.onrender.com/api/ai-planner/rescheduleTask/${planId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: taskId,
          currentWeekNumber: weekNumber,
          currentDayOfWeek: dayOfWeek
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        // Show success toast
        toast.success(`Task rescheduled to ${result.newDate}`);
        // Refresh the page to show updated plan
        window.location.reload();
      } else {
        toast.error('Failed to reschedule task');
      }
    } catch (error) {
      toast.error('Failed to reschedule task');
    } finally {
      setIsRescheduling(false);
    }
  };

   const overdue = isTaskOverdue();

  return (
    <div className="flex items-center justify-end mt-3">
      {overdue ? (
        <button
          onClick={handleReschedule}
          disabled={isRescheduling}
          className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
            isRescheduling
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-orange-100 text-orange-700 hover:bg-orange-200"
          }`}
        >
          {isRescheduling ? (
            <>
              <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mr-1.5"></div>
              Rescheduling...
            </>
          ) : (
            <>
              <Calendar size={16} className="mr-1.5" />
              Reschedule
            </>
          )}
        </button>
      ) : (
        <button
          onClick={handleToggleComplete}
          className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
            currentStatus === "completed"
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {currentStatus === "completed" ? (
            <>
              <CheckCircle size={16} className="mr-1.5" />
              Completed
            </>
          ) : (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 rounded mr-1.5"></div>
              Mark Complete
            </>
          )}
        </button>
      )}
    </div>
  )
}


const StudyPlanResults: React.FC<StudyPlanResultsProps> = ({ plan, userData, onReset }) => {
  const [activeTab, setActiveTab] = useState<"overview" | "weekly" | "resources">("overview")
  const [activeWeek, setActiveWeek] = useState<number>(1)
  const [showTip, setShowTip] = useState<boolean>(false)
  const [studyPlan, setStudyPlan] = useState<StudyPlanResponse>(plan)

  const studyPlanData = studyPlan.plan
  const metadata = studyPlan.metadata

  // Initialize our performance adapter with the adapted plan
  const adaptedPlan = useMemo(() => adaptStudyPlanForPerformance(studyPlan), [studyPlan]);

  const {
    handleTaskStatusChange,
    getTaskStatus,
  } = usePerformanceAdapter(
    adaptedPlan,
    userData,
    (updatedPlan) => {
      setStudyPlan(updatedPlan as unknown as StudyPlanResponse);
    }
  );

  const formatDateWithDay = (dateString: string | number | Date, dayOfWeek: any) => {
    if (!dateString) return dayOfWeek;

    const date = new Date(dateString);
    const options = { month: 'short' as const, day: 'numeric' as const };
    const formattedDate = date.toLocaleDateString('en-US', options);

    return `${dayOfWeek}, ${formattedDate}`;
  };

  useEffect(() => {
    // Show a tip when the results first load
    setShowTip(true)
    const tipTimer = setTimeout(() => {
      setShowTip(false)
    }, 8000)

    return () => clearTimeout(tipTimer)
  }, [])

  const weeklyPlans = studyPlanData.weeklyPlans || []
  const totalWeeks = weeklyPlans.length

  const handleNextWeek = (): void => {
    if (activeWeek < totalWeeks) {
      setActiveWeek(activeWeek + 1)
    }
  }

  const handlePrevWeek = (): void => {
    if (activeWeek > 1) {
      setActiveWeek(activeWeek - 1)
    }
  }

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "Not specified"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getProgressColor = (weekNumber: number): string => {
    const ratio = weekNumber / totalWeeks
    if (ratio < 0.33) return "bg-green-500"
    if (ratio < 0.66) return "bg-blue-500"
    return "bg-purple-500"
  }

  const getResourceIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "book":
        return <Book className="text-blue-500" size={18} />
      case "video":
        return <FileText className="text-green-500" size={18} />
      case "question bank":
        return <ListTodo className="text-amber-500" size={18} />
      default:
        return <Bookmark className="text-gray-500" size={18} />
    }
  }

  // Add these functions inside the StudyPlanResults component
  const contentRef = useRef<HTMLDivElement>(null)

  // Replace the PDF generation function to avoid using autoTable
  const generatePDF = () => {
    const doc = new jsPDF()

    // Add title
    doc.setFontSize(20)
    doc.setTextColor(0, 0, 255)
    doc.text("Personalized Study Plan", 105, 15, { align: "center" })

    // Add user info
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text(`Prepared for: ${userData.name}`, 14, 30)
    doc.text(`Exam: ${studyPlanData.examInfo?.exam || userData.targetExam}`, 14, 37)
    doc.text(`Target Date: ${formatDate(studyPlanData.examInfo?.targetDate || userData.examDate)}`, 14, 44)

    // Add overview
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 150)
    doc.text("Overview", 14, 55)

    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    const overview = doc.splitTextToSize(studyPlanData.overview, 180)
    doc.text(overview, 14, 62)

    // Add study schedule
    let yPos = 62 + overview.length * 5

    doc.setFontSize(16)
    doc.setTextColor(0, 0, 150)
    doc.text("Study Schedule", 14, yPos)

    yPos += 7
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(`Hours per day: ${userData.availableHours}`, 14, yPos)
    yPos += 7
    doc.text(`Days per week: ${userData.daysPerWeek}`, 14, yPos)
    yPos += 7
    doc.text(`Weekly study time: ${userData.availableHours * userData.daysPerWeek} hours`, 14, yPos)

    // Add weekly plans
    yPos += 15
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 150)
    doc.text("Weekly Plans", 14, yPos)
    yPos += 10

    // Create a simple table for weekly plans without autoTable
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)

    // Table headers
    doc.setFillColor(0, 0, 255)
    doc.setTextColor(255, 255, 255)
    doc.rect(14, yPos, 20, 10, "F")
    doc.rect(34, yPos, 60, 10, "F")
    doc.rect(94, yPos, 100, 10, "F")

    doc.text("Week", 16, yPos + 6)
    doc.text("Theme", 36, yPos + 6)
    doc.text("Focus Areas", 96, yPos + 6)

    yPos += 10
    doc.setTextColor(0, 0, 0)

    // Table rows
    weeklyPlans.forEach((week) => {
      const rowHeight = 10

      // Draw cell borders
      doc.rect(14, yPos, 20, rowHeight)
      doc.rect(34, yPos, 60, rowHeight)
      doc.rect(94, yPos, 100, rowHeight)

      // Add cell content
      doc.text(`Week ${week.weekNumber}`, 16, yPos + 6)

      // Handle theme text that might be too long
      const theme = doc.splitTextToSize(week.theme, 55)
      doc.text(theme, 36, yPos + 6)

      // Handle focus areas
      const focusAreas = week.focusAreas ? week.focusAreas.join(", ") : ""
      const focusAreasText = doc.splitTextToSize(focusAreas, 95)
      doc.text(focusAreasText, 96, yPos + 6)

      yPos += rowHeight

      // If we're near the bottom of the page, add a new page
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
      }
    })

    // Add study tips on a new page
    doc.addPage()
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 150)
    doc.text("Study Tips", 14, 15)

    if (studyPlanData.studyTips && studyPlanData.studyTips.length > 0) {
      let tipYPos = 25
      studyPlanData.studyTips.forEach((tip, index) => {
        if (tipYPos > 270) {
          doc.addPage()
          tipYPos = 15
        }

        doc.setFontSize(12)
        doc.setTextColor(0, 0, 100)
        doc.text(`${index + 1}. ${tip.title}`, 14, tipYPos)

        tipYPos += 7
        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0)
        const tipDesc = doc.splitTextToSize(tip.description, 180)
        doc.text(tipDesc, 14, tipYPos)

        tipYPos += tipDesc.length * 5 + 5
      })
    }

    // Add resources on a new page
    doc.addPage()
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 150)
    doc.text("Recommended Resources", 14, 15)

    let resourceYPos = 25

    // Add books
    if (studyPlanData.resources?.books && studyPlanData.resources.books.length > 0) {
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 100)
      doc.text("Books", 14, resourceYPos)

      resourceYPos += 10
      studyPlanData.resources.books.forEach((book, index) => {
        if (resourceYPos > 270) {
          doc.addPage()
          resourceYPos = 15
        }

        doc.setFontSize(11)
        doc.setTextColor(0, 0, 0)
        doc.text(`${index + 1}. ${book.title} by ${book.author}`, 14, resourceYPos)

        resourceYPos += 7
        doc.setFontSize(9)
        const bookDesc = doc.splitTextToSize(book.description, 180)
        doc.text(bookDesc, 14, resourceYPos)

        resourceYPos += bookDesc.length * 5 + 5
      })
    }

    // Save the PDF
    doc.save(`Study_Plan_${userData.name.replace(/\s+/g, "_")}.pdf`)
  }

  const handlePrint = () => {
    window.print()
  }

  // Add this CSS to the component
  useEffect(() => {
    // Add print styles
    const style = document.createElement("style")
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #printable-content, #printable-content * {
          visibility: visible;
        }
        #printable-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const renderOverview = () => (
    <div className="space-y-6">

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
        <h2 className="text-2xl font-bold text-blue-800 mb-3">{studyPlanData.title}</h2>
        <p className="text-blue-700">{studyPlanData.overview}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center mb-2">
            <Calendar className="text-blue-500 mr-2" size={20} />
            <h3 className="font-semibold text-gray-800">Exam Information</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Exam:</span>
              <span className="font-medium">{studyPlanData.examInfo?.exam || userData.targetExam}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Target Date:</span>
              <span className="font-medium">{formatDate(studyPlanData.examInfo?.targetDate || userData.examDate)}</span>
            </div>
            {(studyPlanData.examInfo?.targetScore || userData.targetScore) && (
              <div className="flex justify-between">
                <span className="text-gray-600">Target Score:</span>
                <span className="font-medium">{studyPlanData.examInfo?.targetScore || userData.targetScore}</span>
              </div>
            )}
            {studyPlanData.examInfo?.lastStudyDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Last Study Day:</span>
                <span className="font-medium">{formatDate(studyPlanData.examInfo.lastStudyDate)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-gray-600">Study Duration:</span>
              <span className="font-medium">{metadata.duration}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center mb-2">
            <Clock className="text-blue-500 mr-2" size={20} />
            <h3 className="font-semibold text-gray-800">Study Schedule</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Hours per day:</span>
              <span className="font-medium">{userData.availableHours} hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Days per week:</span>
              <span className="font-medium">{userData.daysPerWeek} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Weekly study time:</span>
              <span className="font-medium">{userData.availableHours * userData.daysPerWeek} hours</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center mb-2">
            <GraduationCap className="text-blue-500 mr-2" size={20} />
            <h3 className="font-semibold text-gray-800">Learning Profile</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Knowledge level:</span>
              <span className="font-medium capitalize">{userData.currentLevel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Learning style:</span>
              <span className="font-medium capitalize">{userData.preferredLearningStyle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Strong subjects:</span>
              <span className="font-medium">{userData.strongSubjects.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Weak subjects:</span>
              <span className="font-medium">{userData.weakSubjects.length}</span>
            </div>
          </div>
        </div>
      </div>

   {plan && plan.plan && plan.plan.weeklyPlans && (
  <StudyProgressBar
    key={`progress-${studyPlan.completionStatus?.overallProgress || 0}-${Date.now()}`}
    weeklyPlans={studyPlan.plan.weeklyPlans}
    userData={userData}
    planId={studyPlan.planId || ""}
    completionStatus={studyPlan.completionStatus} // Pass the actual completion status
  />
)}

      <div className="bg-white p-4 rounded-lg border shadow-sm mt-6">
        <div className="flex items-center mb-4">
          <Calendar className="text-blue-500 mr-2" size={20} />
          <h3 className="font-semibold text-gray-800">Weekly Overview</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {weeklyPlans.slice(0, 4).map((week, index) => (
            <div
              key={index}
              onClick={() => {
                setActiveWeek(week.weekNumber)
                setActiveTab("weekly")
              }}
              className="cursor-pointer bg-white p-3 rounded-md border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-700">Week {week.weekNumber}</span>
                <div className={`w-2 h-2 rounded-full ${getProgressColor(week.weekNumber)}`}></div>
              </div>
              <h4 className="text-sm font-medium text-blue-700 mb-1 line-clamp-1">{week.theme}</h4>
              <div className="flex flex-wrap gap-1 mt-2">
                {week.focusAreas?.slice(0, 3).map((area, i) => (
                  <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                    {area}
                  </span>
                ))}
                {week.focusAreas && week.focusAreas.length > 3 && (
                  <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">
                    +{week.focusAreas.length - 3} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center mb-4">
          <Lightbulb className="text-blue-500 mr-2" size={20} />
          <h3 className="font-semibold text-gray-800">Study Tips</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {studyPlanData.studyTips?.slice(0, 6).map((tip, index) => (
            <div key={index} className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-start">
                <Lightbulb className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                <div>
                  <div className="font-medium text-blue-700 mb-1">{tip.title}</div>
                  <div className="text-sm text-blue-600">{tip.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderWeeklyPlan = () => {
    const currentWeek = weeklyPlans.find((week) => week.weekNumber === activeWeek) || weeklyPlans[0]

    if (!currentWeek) return <div>No weekly plan data available</div>

    return (
      <div className="space-y-6">

        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevWeek}
            disabled={activeWeek === 1}
            className={`p-2 rounded-full ${activeWeek === 1 ? "text-gray-300 cursor-not-allowed" : "text-blue-600 hover:bg-blue-50"}`}
          >
            <ChevronLeft size={20} />
          </button>

          <div className="text-center">
            <h2 className="text-xl font-bold text-blue-800">Week {currentWeek.weekNumber}</h2>
            <p className="text-blue-600">{currentWeek.theme}</p>
          </div>

          <button
            onClick={handleNextWeek}
            disabled={activeWeek === totalWeeks}
            className={`p-2 rounded-full ${activeWeek === totalWeeks ? "text-gray-300 cursor-not-allowed" : "text-blue-600 hover:bg-blue-50"}`}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Add the ReviewScheduler component at the top of the weekly plan */}
        <ReviewScheduler currentWeekNumber={activeWeek} focusAreas={currentWeek.focusAreas} />

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center mb-3">
            <Award className="text-blue-500 mr-2" size={20} />
            <h3 className="font-semibold text-gray-800">Weekly Goals</h3>
          </div>
          <div className="space-y-3">
            {currentWeek.weeklyGoals?.map((goal, index) => (
              <div key={index} className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="font-medium text-blue-700">{goal.subject}</div>
                <div className="text-sm text-blue-600">{goal.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center mb-3">
            <Layers className="text-blue-500 mr-2" size={20} />
            <h3 className="font-semibold text-gray-800">Focus Areas</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentWeek.focusAreas?.map((area, index) => (
              <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {area}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <Calendar className="text-blue-500 mr-2" size={20} />
            Daily Schedule
          </h3>

          {currentWeek.days?.map((day, dayIndex) => (
            <div key={dayIndex} className="bg-white p-4 rounded-lg border shadow-sm">
              <h4 className="font-medium text-blue-700 mb-3">
                {formatDateWithDay(day.date, day.dayOfWeek)}
              </h4>

              <div className="space-y-4">
                {day.tasks?.map((task, taskIndex) => {
                  const taskId = task._id;
                  const status = getTaskStatus(task._id, task.subject, task.activity) as "completed" | "incomplete"

                  return (
                    <div
                      key={taskIndex}
                      className={`p-3 rounded-lg ${task.isReview
                        ? "bg-amber-50 border border-amber-100"
                        : status === "completed"
                          ? "bg-green-50 border border-green-100"
                          : "bg-gray-50"
                        }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium text-gray-800 flex items-center">
                          {task.isReview && (
                            <span className="inline-block bg-amber-200 text-amber-800 text-xs px-2 py-0.5 rounded mr-2">
                              Review
                            </span>
                          )}
                          {task.subject}
                        </div>
                        <div className="text-sm text-gray-500">{task.duration} min</div>
                      </div>
                      <div className="text-sm text-gray-700 mb-3">{task.activity}</div>

                      {task.resources && task.resources.length > 0 && (
                        <div className="space-y-2 mt-2">
                          <div className="text-xs font-medium text-gray-500">Resources:</div>
                          {task.resources.map((resource, resourceIndex) => (
                            <div key={resourceIndex} className="flex items-start">
                              {getResourceIcon(resource.type)}
                              <div className="ml-2">
                                <div className="text-sm font-medium text-gray-700">{resource.name}</div>
                                <div className="text-xs text-gray-500">{resource.description}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add simplified task action buttons */}
                      <SimpleTaskActions
                        taskId={taskId}
                        subject={task.subject}
                        activity={task.activity}
                        weekNumber={currentWeek.weekNumber}
                        dayOfWeek={day.dayOfWeek}
                        date={day.date}
                        onStatusChange={handleTaskStatusChangeWrapper}
                        currentStatus={status}
                      />
                    </div>
                  )
                })}

                {/* Add mock exam if this day should have one */}
                {shouldPlaceMockExam(
                  currentWeek.weekNumber,
                  day.dayOfWeek,
                  currentWeek.days?.map((d) => d.dayOfWeek) || [],
                ) && (
                    <MockExamBlock
                      weekNumber={currentWeek.weekNumber}
                      weekTheme={currentWeek.theme}
                      focusAreas={currentWeek.focusAreas || []}
                      dayOfWeek={day.dayOfWeek}
                      examNumber={getExamNumber(currentWeek.weekNumber)}
                    />
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderResources = () => (
    <div className="space-y-6">

      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center mb-4">
          <Book className="text-blue-500 mr-2" size={20} />
          <h3 className="font-semibold text-gray-800">Recommended Books</h3>
        </div>
        <div className="space-y-4">
          {studyPlanData.resources?.books?.map((book, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
            >
              <div className="flex items-start">
                <Book className="text-blue-500 mr-3 mt-1 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-medium text-gray-800">{book.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                  <p className="text-sm text-gray-700">{book.description}</p>

                  {book.relevantTopics && book.relevantTopics.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {book.relevantTopics.map((topic, i) => (
                        <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center mb-4">
          <FileText className="text-blue-500 mr-2" size={20} />
          <h3 className="font-semibold text-gray-800">Video Resources</h3>
        </div>
        <div className="space-y-4">
          {studyPlanData.resources?.videos?.map((video, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg hover:border-green-200 hover:bg-green-50/30 transition-colors"
            >
              <div className="flex items-start">
                <FileText className="text-green-500 mr-3 mt-1 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-medium text-gray-800">{video.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{video.platform}</p>
                  <p className="text-sm text-gray-700">{video.description}</p>

                  {video.relevantTopics && video.relevantTopics.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {video.relevantTopics.map((topic, i) => (
                        <span key={i} className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center mb-4">
          <ListTodo className="text-blue-500 mr-2" size={20} />
          <h3 className="font-semibold text-gray-800">Question Banks</h3>
        </div>
        <div className="space-y-4">
          {studyPlanData.resources?.questionBanks?.map((qbank, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg hover:border-amber-200 hover:bg-amber-50/30 transition-colors"
            >
              <div className="flex items-start">
                <ListTodo className="text-amber-500 mr-3 mt-1 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-medium text-gray-800">{qbank.title}</h4>
                  <p className="text-sm text-gray-700">{qbank.description}</p>

                  {qbank.relevantTopics && qbank.relevantTopics.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {qbank.relevantTopics.map((topic, i) => (
                        <span key={i} className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // Add this wrapper function inside the StudyPlanResults component, before the return statement
  const handleTaskStatusChangeWrapper = (
    taskId: string,
    subject: string,
    activity: string,
    weekNumber: number,
    dayOfWeek: string,
    status: "completed" | "incomplete",
  ) => {
    // We only need to pass taskId and status to the actual handler
    handleTaskStatusChange(taskId, status)
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-md relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full opacity-70 -z-10"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-50 rounded-tr-full opacity-70 -z-10"></div>

      {/* Study tip toast notification */}
      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-4 right-4 bg-blue-600 text-white p-3 rounded-lg shadow-lg max-w-xs z-10"
          >
            <div className="flex items-start">
              <Lightbulb className="mr-2 flex-shrink-0 mt-0.5" size={16} />
              <div>
                <div className="font-medium text-sm mb-1">Study Tip</div>
                <div className="text-xs">
                  Mark tasks as completed to track your progress through the study plan.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mb-6">
        <div>
          <button onClick={onReset} className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
            <ArrowLeft size={16} className="mr-1" />
            <span>Back to Form</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">Your Personalized Study Plan</h1>
        </div>

        {/* Replace the button group in the header with this */}
        <div className="flex space-x-2">
          <button
            onClick={generatePDF}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex items-center"
            title="Download PDF"
          >
            <Download size={18} className="mr-1" />
            <span className="text-sm hidden sm:inline">Download</span>
          </button>
          <button
            onClick={handlePrint}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex items-center"
            title="Print"
          >
            <Printer size={18} className="mr-1" />
            <span className="text-sm hidden sm:inline">Print</span>
          </button>
          <button
            onClick={() => {
              // Clear saved plan
              localStorage.removeItem("studyPlan")
              localStorage.removeItem("currentPlanId")
              localStorage.removeItem("studyPlanPerformance")
              onReset()
            }}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors flex items-center"
            title="Create New Plan"
          >
            <X size={18} className="mr-1" />
            <span className="text-sm hidden sm:inline">New Plan</span>
          </button>
        </div>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${activeTab === "overview"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-blue-600"
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("weekly")}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${activeTab === "weekly" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-blue-600"
              }`}
          >
            Weekly Plan
          </button>
          <button
            onClick={() => setActiveTab("resources")}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${activeTab === "resources"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-blue-600"
              }`}
          >
            Resources
          </button>
        </div>
      </div>

      {/* Add id to the main content div for printing */}
      {/* Modify the main content div to include the ref and id */}
      <div id="printable-content" ref={contentRef} className="mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "overview" && renderOverview()}
            {activeTab === "weekly" && renderWeeklyPlan()}
            {activeTab === "resources" && renderResources()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default StudyPlanResults