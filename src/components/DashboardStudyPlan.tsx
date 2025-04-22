"use client"

import { useEffect, useState } from "react"
import { Book, Calendar, Lightbulb, Loader2, ChevronRight, BookMarked, BookOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
// import StudyPlanResults from "./study-plan-results-updated" // Import the StudyPlanResults component
import StudyPlanResults from "@/app/dashboard/study-planner/study-plan-results"

interface StudyPlan {
  plan: {
    title: string
    overview: string
    examInfo?: {
      exam: string
      targetDate: string
      targetScore?: string
    }
    weeklyPlans: {
      weekNumber: number
      theme: string
      focusAreas?: string[]
      weeklyGoals?: Array<{
        subject: string
        description: string
      }>
      days?: Array<{
        dayOfWeek: string
        tasks?: Array<{
          title: string
          description: string
          completed: boolean
        }>
      }>
    }[]
    studyTips?: Array<{
      title: string
      description: string
    }>
    resources?: {
      books?: Array<{
        title: string
        author: string
        publicationYear?: number
        link?: string
      }>
      videos?: Array<{
        title: string
        url: string
        duration?: string
      }>
      questionBanks?: Array<{
        title: string
        questionsCount: number
        link?: string
      }>
    }
  }
  metadata: {
    duration: string
  }
}

interface UserData {
  name: string
  email: string
  currentLevel: string
  targetExam: string
  examDate: string
  strongSubjects: string[]
  weakSubjects: string[]
  availableHours: number
  daysPerWeek: number
  preferredTimeOfDay: string
  preferredLearningStyle: string
  targetScore: string
  specificGoals: string
  additionalInfo: string
  previousScores: string
}

export default function DashboardStudyPlan() {
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasExistingPlan, setHasExistingPlan] = useState(false)
  const [showFullPlan, setShowFullPlan] = useState(false) // New state to control view
  const router = useRouter()

  useEffect(() => {
    // Attempt to load the saved study plan from localStorage
    try {
      const savedPlan = localStorage.getItem("studyPlan")
      const savedUserData = localStorage.getItem("userData")

      if (savedPlan) {
        const parsedPlan = JSON.parse(savedPlan)
        setStudyPlan(parsedPlan)
        setHasExistingPlan(true)
      }

      if (savedUserData) {
        const parsedUserData = JSON.parse(savedUserData)
        setUserData(parsedUserData)
      }
    } catch (error) {
      console.error("Error loading saved study plan:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadExistingPlan = () => {
    // Instead of navigating, we'll show the full plan in this component
    setShowFullPlan(true)
  }

  const resetView = () => {
    setShowFullPlan(false)
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

  const calculateDaysRemaining = (dateString: string): number => {
    if (!dateString) return 0
    const targetDate = new Date(dateString)
    const today = new Date()
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const daysRemaining = userData?.examDate ? calculateDaysRemaining(userData.examDate) : 0

  const getProgressColor = (days: number): string => {
    if (days < 30) return "bg-red-500"
    if (days < 90) return "bg-amber-500"
    return "bg-green-500"
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-500">Loading your study plan...</p>
        </CardContent>
      </Card>
    )
  }

  // If we should show the full plan, render the StudyPlanResults component
  if (showFullPlan && studyPlan && userData) {
    // Use type assertion to convert studyPlan to StudyPlanResponse
    return <StudyPlanResults 
      plan={studyPlan as any} 
      userData={userData} 
      onReset={resetView} 
    />
  }

  if (!studyPlan || !userData) {
    return (
      <Card className="w-full">
        <CardContent className="py-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Study Plan Found</h3>
            <p className="text-gray-500 mb-6">You haven&apos;t created a personalized study plan yet.</p>
            <button
              onClick={() => router.push("/dashboard/study-planner")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Study Plan
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Extract needed data from the study plan
  const { plan } = studyPlan
  const weeklyPlans = plan.weeklyPlans || []
  const currentWeek = weeklyPlans[0] // Show first week by default

  return (
    <Card className="w-full overflow-hidden">
      {hasExistingPlan && (
        <div className="mb-0 p-4 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BookMarked className="text-blue-600 mr-2" size={20} />
              <div>
                <h3 className="font-medium text-blue-800">You have a saved study plan</h3>
                <p className="text-sm text-blue-600">You can continue with your previous plan or create a new one.</p>
              </div>
            </div>
            <button
              onClick={loadExistingPlan}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <BookOpen className="mr-2" size={16} />
              Load Saved Plan
            </button>
          </div>
        </div>
      )}

      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Book className="h-5 w-5 mr-2" />
            Personalized Study Plan
          </CardTitle>
          <span className="text-xs sm:text-sm bg-white/20 px-2 py-0.5 rounded">
            {plan.examInfo?.exam || userData.targetExam}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Exam Timeline */}
          {userData.examDate && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">Exam Date: {formatDate(userData.examDate)}</span>
                </div>
                <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  {daysRemaining} days left
                </span>
              </div>
              <Progress
                value={(daysRemaining / 180) * 100}
                className={`h-1.5 mt-2 ${getProgressColor(daysRemaining)}`}
              />
            </div>
          )}

          {/* Current Week Overview */}
          {currentWeek && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-3 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-800">
                    Week {currentWeek.weekNumber}: {currentWeek.theme}
                  </h3>
                  <button
                    onClick={loadExistingPlan}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    View Details
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </button>
                </div>
              </div>

              <div className="p-3">
                <div className="flex flex-wrap gap-1 mb-3">
                  {currentWeek.focusAreas?.slice(0, 3).map((area, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {area}
                    </span>
                  ))}
                  {currentWeek.focusAreas && currentWeek.focusAreas.length > 3 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      +{currentWeek.focusAreas.length - 3} more
                    </span>
                  )}
                </div>

                {/* Quick Goals Summary */}
                {currentWeek.weeklyGoals && currentWeek.weeklyGoals.length > 0 && (
                  <div className="space-y-1 mb-2">
                    <h4 className="text-xs font-medium text-gray-500">Weekly Goals:</h4>
                    {currentWeek.weeklyGoals.slice(0, 2).map((goal, index) => (
                      <div key={index} className="flex items-start">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 mr-2"></div>
                        <p className="text-xs text-gray-700">
                          {goal.subject}: {goal.description}
                        </p>
                      </div>
                    ))}
                    {currentWeek.weeklyGoals.length > 2 && (
                      <p className="text-xs text-gray-500">...and {currentWeek.weeklyGoals.length - 2} more goals</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Study Tip */}
          {plan.studyTips && plan.studyTips.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-start">
                <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-medium text-amber-800 mb-0.5">{plan.studyTips[0].title}</h4>
                  <p className="text-xs text-amber-700 line-clamp-2">{plan.studyTips[0].description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2">
            <button
              onClick={() => router.push("/dashboard/study-planner")}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Create New AI Study Plan
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
