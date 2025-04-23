"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import {
  Brain,
  Zap,
  Loader2,
  AlertCircle,
  X,
  Edit3,
  Target,
  Book,
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import toast from "react-hot-toast"

import type {
  FormData,
  FormErrors,
  TopicMasteryData,
  UserPerformanceData,
  StudyPlanResponse,
} from "./types/study-plan-types"
import StudyPlanResults from "./study-plan-results"
import StepIndicator from "./components/step-indicator"
import PersonalDetailsStep from "./components/steps/personal-details-step"
import ExamDetailsStep from "./components/steps/exam-details-step"
import SubjectAssessmentStep from "./components/steps/subject-assessment-step"
import StudyPreferencesStep from "./components/steps/study-preferences-step"
import GoalsStep from "./components/steps/goals-step"
import StudyTip from "./components/study-tip"
import GeneratingPlan from "./components/generating-plan"
import SuccessMessage from "./components/success-message"
import ExistingPlanNotice from "./components/existing-plan-notice"

import UserPlansList from "./components/user-plans-list"

// Define the StudyPlan interface for the list
interface StudyPlanListItem {
  _id: string
  name?: string
  targetExam: string
  createdAt: string
  lastAccessed: string
  userId: string
}

const PlannerForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [showSuccess, setShowSuccess] = useState<boolean>(false)
  const [animateDirection, setAnimateDirection] = useState<"left" | "right">("right")
  const [showTip, setShowTip] = useState<boolean>(false)
  const [currentTip, setCurrentTip] = useState<string>("")
  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [studyPlan, setStudyPlan] = useState<StudyPlanResponse | null>(null)
  const [generationProgress, setGenerationProgress] = useState<number>(0)
  const [generationStage, setGenerationStage] = useState<string>("")
  const [hasExistingPlan, setHasExistingPlan] = useState<boolean>(false)
  const [weakTopics, setWeakTopics] = useState<TopicMasteryData[]>([])
  const [isLoadingPerformanceData, setIsLoadingPerformanceData] = useState<boolean>(false)
  const [userPlans, setUserPlans] = useState<StudyPlanListItem[]>([])
  const [showPlansList, setShowPlansList] = useState<boolean>(false)
  const [isLoadingPlans, setIsLoadingPlans] = useState<boolean>(false)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const studyTips = [
    "Spaced repetition is more effective than cramming",
    "Teaching concepts to others improves your own understanding",
    "Taking short breaks every 25-30 minutes can improve focus",
    "Mixing different subjects in one study session can improve retention",
    "Sleep is crucial for memory consolidation",
  ]

  const [formData, setFormData] = useState<FormData>({
    // Personal details
    name: "",
    email: "",
    currentLevel: "beginner",

    // Exam details
    targetExam: "USMLE Step 1",
    examDate: "",

    // Subject preferences
    strongSubjects: [],
    weakSubjects: [],

    // Study preferences
    availableHours: 2,
    daysPerWeek: 5,
    preferredTimeOfDay: "morning",
    preferredLearningStyle: "visual",

    // Goals and objectives
    targetScore: "",
    specificGoals: "",

    // Additional information
    additionalInfo: "",
    previousScores: "",

    // Performance data integration
    usePerformanceData: false,
    weakTopics: [],
  })

  // Fetch performance data when component mounts
  useEffect(() => {
    const showRandomTip = () => {
      const randomTip = studyTips[Math.floor(Math.random() * studyTips.length)]
      setCurrentTip(randomTip)
      setShowTip(true)

      const tipTimer = setTimeout(() => {
        setShowTip(false)
      }, 8000)

      return () => clearTimeout(tipTimer)
    }

    showRandomTip()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Remove studyTips dependency since it's a constant

  useEffect(() => {
    fetchPerformanceData()
  }, [])

   // Check for existing plans and fetch them
  useEffect(() => {
    const userId = localStorage.getItem("Medical_User_Id")
    if(!userId) return
    fetchUserPlans()
  }, [])

  // Load user data from localStorage
  useEffect(() => {
    const name = localStorage.getItem("name")
    const email = localStorage.getItem("email")

    if (name) {
      setFormData((prev) => ({
        ...prev,
        name: name,
      }))
    }

    if (email) {
      setFormData((prev) => ({
        ...prev,
        email: email,
      }))
    }
  }, [])

  // Update form data when weak topics change
  useEffect(() => {
    if (formData.usePerformanceData && weakTopics.length > 0) {
      const topicNames = weakTopics.map((topic) => topic.name)
      setFormData((prev) => ({
        ...prev,
        weakTopics: topicNames,
      }))
    }
  }, [formData.usePerformanceData, weakTopics])

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  // Fetch all study plans for the current user
  const fetchUserPlans = async () => {
    const userId = localStorage.getItem("Medical_User_Id")
    if (!userId) {
      setHasExistingPlan(false)
      setUserPlans([])
      return
    }

    setIsLoadingPlans(true)

    try {
      const response = await axios.get(`http://localhost:5000/api/ai-planner/getUserStudyPlans/${userId}`)
      console.log("API response:", response.data)
      if (response.data.success && response.data.data && response.data.data.length > 0){
        setUserPlans(response.data.data)
        setHasExistingPlan(true)
      } else {
         // Even if the API returns success but no data, set hasExistingPlan to false
         setUserPlans([])
         setHasExistingPlan(false)
      }
    } catch (error) {
      console.error("Error fetching user plans:", error)
      setApiError("Failed to load your study plans. Please try again.")
      // Check if there's a plan in localStorage as fallback
      // const savedPlan = localStorage.getItem("studyPlan")
      // if (savedPlan) {
      //   setHasExistingPlan(true)
      // }
    } finally {
      setIsLoadingPlans(false)
    }
  }


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Fix for performance data toggle issues
  // Modify the handleTogglePerformanceData function to be more robust
  const handleTogglePerformanceData = () => {
    // Create a more stable toggle function that doesn't cause unnecessary re-renders
    setFormData((prev) => {
      const newValue = !prev.usePerformanceData

      // If turning on performance data and we have weak topics, update them
      if (newValue && weakTopics.length > 0) {
        return {
          ...prev,
          usePerformanceData: newValue,
          weakTopics: weakTopics.map((topic) => topic.name),
        }
      }

      // Otherwise just toggle the flag
      return {
        ...prev,
        usePerformanceData: newValue,
      }
    })
  }

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {}

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = "Name is required"
        if (!formData.email.trim()) {
          newErrors.email = "Email is required"
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = "Email is invalid"
        }
        break

      case 2:
        if (!formData.targetExam) newErrors.targetExam = "Target exam is required"
        if (formData.examDate) {
          const examDate = new Date(formData.examDate)
          const today = new Date()
          if (examDate < today) {
            newErrors.examDate = "Exam date cannot be in the past"
          }
        }
        break

      case 3:
        // If not using performance data, require manual subject selection
        if (!formData.usePerformanceData) {
          if (formData.strongSubjects.length === 0) {
            newErrors.strongSubjects = "Select at least one strong subject"
          }
          if (formData.weakSubjects.length === 0) {
            newErrors.weakSubjects = "Select at least one weak subject"
          }
        } else {
          // Even when using performance data, we need at least one strong subject
          if (formData.strongSubjects.length === 0) {
            setFormData((prev) => ({
              ...prev,
              strongSubjects: ["Anatomy"], // Default to Anatomy if no strong subjects selected
            }))
          }
        }
        break

      case 4:
        // These fields have default values, so no validation needed
        break

      case 5:
        // Optional fields, no validation needed
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = (): void => {
    if (validateStep(currentStep)) {
      setAnimateDirection("right")
      // Add a small delay to prevent animation glitches
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1)
      }, 50)

      // Removed the random tip on next step to prevent excessive tips
    }
  }

  const prevStep = (): void => {
    setAnimateDirection("left")
    setCurrentStep((prev) => prev - 1)
  }

  const fetchPerformanceData = async () => {
    const userId = localStorage.getItem("Medical_User_Id")
    if (!userId) return

    setIsLoadingPerformanceData(true)

    try {
      // First try to get data from our new endpoint
      const performanceData = await fetchUserPerformanceData()

      if (!performanceData || !performanceData.subjects || performanceData.subjects.length === 0) {
        // Fall back to the legacy endpoint if no data from new one
        const legacyResponse = await axios.get(
          `https://medical-backend-loj4.onrender.com/api/test/topic-mastery-v2/${userId}`,
        )
        if (legacyResponse.data && legacyResponse.data.weakestTopics) {
          setWeakTopics(legacyResponse.data.weakestTopics)
        }
        return
      }

      // Process the performance data to identify strong and weak subjects
      const processedTopics: TopicMasteryData[] = []
      const strongSubjectsArray: string[] = []
      const weakSubjectsArray: string[] = []

      // Process subjects
      performanceData.subjects.forEach((subject) => {
        let totalCorrect = 0
        let totalIncorrect = 0
        let totalQuestions = 0

        // Calculate subject-level totals
        subject.subsections.forEach((subsection) => {
          totalCorrect += subsection.performance.correctCount
          totalIncorrect += subsection.performance.incorrectCount
          totalQuestions += subsection.performance.totalCount
        })

        // Only consider subjects with at least 3 questions
        if (totalQuestions >= 3) {
          const accuracyPercent = (totalCorrect / totalQuestions) * 100

          // Determine mastery level
          let masteryLevel = "Intermediate"
          if (accuracyPercent >= 70) {
            masteryLevel = "Advanced"
            strongSubjectsArray.push(subject.subjectName)
          } else if (accuracyPercent < 50) {
            masteryLevel = "Beginner"
            weakSubjectsArray.push(subject.subjectName)
          }

          // Add to processed topics list
          processedTopics.push({
            name: subject.subjectName,
            masteryScore: accuracyPercent,
            masteryLevel: masteryLevel,
            isQuestPriority: accuracyPercent < 50,
          })

          // Add subsections as topics
          subject.subsections.forEach((subsection) => {
            if (subsection.performance.totalCount >= 2) {
              const subsectionAccuracy = (subsection.performance.correctCount / subsection.performance.totalCount) * 100
              let subsectionMasteryLevel = "Intermediate"

              if (subsectionAccuracy < 50) {
                subsectionMasteryLevel = "Beginner"
                // Add weak subsections to weak topics
                processedTopics.push({
                  name: `${subject.subjectName}: ${subsection.subsectionName}`,
                  masteryScore: subsectionAccuracy,
                  masteryLevel: subsectionMasteryLevel,
                  isQuestPriority: true,
                })
              }
            }
          })
        }
      })

      // Sort by mastery score (ascending, so weakest first)
      processedTopics.sort((a, b) => a.masteryScore - b.masteryScore)

      // Update state
      setWeakTopics(processedTopics.filter((topic) => topic.masteryLevel === "Beginner"))

      // Update form data with strong and weak subjects
      setFormData((prev) => ({
        ...prev,
        strongSubjects: strongSubjectsArray,
        weakSubjects: weakSubjectsArray,
        weakTopics: processedTopics.filter((topic) => topic.masteryLevel === "Beginner").map((topic) => topic.name),
      }))
    } catch (error) {
      console.error("Error fetching performance data:", error)
    } finally {
      setIsLoadingPerformanceData(false)
    }
  }

  // Function to fetch performance data from our new API endpoint
  const fetchUserPerformanceData = async () => {
    const userId = localStorage.getItem("Medical_User_Id")
    if (!userId) return null

    try {
      const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/get-performance/${userId}`)

      if (response.data.success) {
        return response.data.data as UserPerformanceData
      } else {
        console.error("Failed to fetch performance data:", response.data.message)
        return null
      }
    } catch (error) {
      console.error("Error fetching performance data:", error)
      return null
    }
  }

  const loadExistingPlan = async (planId?: string) => {
    try {
      // If a specific plan ID is provided, load that plan
      if (planId) {
        try {
          const response = await axios.get(`http://localhost:5000/api/ai-planner/getStudyPlan/${planId}`)

          if (response.data.success && response.data.data) {
            setStudyPlan(response.data.data)

            // If you need user data
            const savedUserData = localStorage.getItem("userData")
            const parsedUserData = savedUserData ? JSON.parse(savedUserData) : formData
            setFormData(parsedUserData)

            // Store the current plan ID
            localStorage.setItem("currentPlanId", planId)
            return
          }
        } catch (error) {
          console.error("Error fetching specific plan:", error)
          toast.error("Failed to load the selected plan. Please try again.")
          // Continue to fallback methods
        }
      }
        setShowPlansList(true)
    } catch (error) {
      console.error("Error loading saved plan:", error)
      toast.error("Failed to load your saved plan. Please try again.")
    }
  }

  // Function to add study plan tasks to the calendar
  const addPlanTasksToCalendar = async (planData: StudyPlanResponse) => {
    if (!planData || !planData.plan || !planData.plan.weeklyPlans) return

    const userId = localStorage.getItem("Medical_User_Id")
    if (!userId) return

    try {
      let addedCount = 0

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
              // Add the task to the calendar
              await axios.post("https://medical-backend-loj4.onrender.com/api/test/calender", {
                subjectName: task.subject,
                testTopic: `${week.theme}: ${task.activity}`,
                date: taskDate.toISOString(),
                color: getSubjectColor(task.subject),
                completed: false,
                userId,
              })
              addedCount++
            } catch (error) {
              console.error("Failed to add task to calendar:", error)
            }
          }
        }
      }

      if (addedCount > 0) {
        toast.success(`Added ${addedCount} study plan tasks to your calendar`)
      }
    } catch (error) {
      console.error("Error adding plan tasks to calendar:", error)
      toast.error("Failed to add some tasks to calendar")
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

  // Modify the simulateProgress function to match the 2-2.5 minute timeframe
  const simulateProgress = () => {
    setGenerationProgress(0)
    setGenerationStage("Analyzing your preferences...")

    const stages = [
      "Analyzing your preferences...",
      "Identifying optimal study patterns...",
      "Creating personalized schedule...",
      "Selecting recommended resources...",
      "Optimizing for your learning style...",
      "Finalizing your study plan...",
    ]

    let currentStage = 0

    // Slow down the progress to match 2-2.5 minutes (150 seconds)
    // We'll update roughly every 2 seconds, with 75 total updates
    const totalTime = 150000 // 2.5 minutes in milliseconds
    const updateInterval = 2000 // 2 seconds
    const incrementPerUpdate = 100 / (totalTime / updateInterval)

    progressIntervalRef.current = setInterval(() => {
      setGenerationProgress((prev) => {
        const newProgress = prev + incrementPerUpdate

        // Change stage at certain progress points
        if (newProgress > (currentStage + 1) * 16 && currentStage < stages.length - 1) {
          currentStage++
          setGenerationStage(stages[currentStage])

          // Show a random tip when changing stages
          const randomTip = studyTips[Math.floor(Math.random() * studyTips.length)]
          setCurrentTip(randomTip)
          setShowTip(true)

          setTimeout(() => {
            setShowTip(false)
          }, 5000)
        }

        if (newProgress >= 98) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
          }
          return 99
        }

        return newProgress
      })
    }, updateInterval)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()

    // Validate final step
    if (!validateStep(currentStep)) {
      return
    }

    setIsSubmitting(true)
    setApiError(null)

    // Start progress simulation
    simulateProgress()

    // Prepare data for submission that's compatible with the existing API
    const submissionData = {
      name: formData.name,
      email: formData.email,
      currentLevel: formData.currentLevel,
      targetExam: formData.targetExam,
      examDate: formData.examDate,
      // Ensure strongSubjects is never empty, use default if empty
      strongSubjects: formData.strongSubjects.length > 0 ? formData.strongSubjects : ["Anatomy"], // Default to Anatomy if no strong subjects selected
      weakSubjects: formData.usePerformanceData ? formData.weakTopics : formData.weakSubjects,
      availableHours: formData.availableHours,
      daysPerWeek: formData.daysPerWeek,
      preferredTimeOfDay: formData.preferredTimeOfDay,
      preferredLearningStyle: formData.preferredLearningStyle,
      targetScore: formData.targetScore,
      specificGoals: formData.specificGoals,
      additionalInfo:
        formData.additionalInfo + (formData.usePerformanceData ? "\n[Using performance data for weak topics]" : ""),
      previousScores: formData.previousScores,
    }

    // Save user data to localStorage
    localStorage.setItem("userData", JSON.stringify(formData)) // Save the full data for our UI
    const userId = localStorage.getItem("Medical_User_Id")

    // Log the request for debugging
    console.log(
      "Sending request to:",
      `https://medical-backend-loj4.onrender.com/api/test/generatePlan?userId=${userId}`,
    )
    console.log("Request data:", submissionData)

    try {
      const response = await axios.post(
        `https://medical-backend-loj4.onrender.com/api/test/generatePlan?userId=${userId}`,
        submissionData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      const result = response.data

      if (response.status !== 200) {
        throw new Error(result.error || "Failed to generate plan")
      }

      // Set progress to 100% when done
      setGenerationProgress(100)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }

      // Store the study plan data
      const planData = result.data as StudyPlanResponse
      setStudyPlan(planData)

      // Add study plan tasks to calendar
      await addPlanTasksToCalendar(planData)

      // Save only the plan ID to localStorage
      if (result.data && result.data.planId) {
        localStorage.setItem("currentPlanId", result.data.planId)
      }

       // Refresh the user plans list
       fetchUserPlans()

      // Show success message
      setShowSuccess(true)
    } catch (error) {
      console.error("Error generating plan:", error)

      // Add more detailed error logging
      if (axios.isAxiosError(error)) {
        console.error("API Error Response:", error.response?.data)
        console.error("API Error Status:", error.response?.status)
        setApiError(`Error ${error.response?.status}: ${error.response?.data?.message || error.message}`)
      } else {
        setApiError((error as Error).message || "Failed to generate study plan. Please try again.")
      }

      // Clear progress interval on error
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Animation variants for page transitions
  const pageVariants = {
    initial: (direction: "left" | "right") => ({
      x: direction === "right" ? 300 : -300,
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    },
    exit: (direction: "left" | "right") => ({
      x: direction === "right" ? -300 : 300,
      opacity: 0,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    }),
  }

  // Step titles and icons for the progress bar
  const stepInfo = [
    { title: "Personal", icon: <Edit3 size={16} /> },
    { title: "Exam", icon: <Target size={16} /> },
    { title: "Subjects", icon: <Book size={16} /> },
    { title: "Schedule", icon: <Clock size={16} /> },
    { title: "Goals", icon: <Award size={16} /> },
  ]

    // Handle plan selection from the list
    const handleSelectPlan = async (planId: string) => {
      await loadExistingPlan(planId)
      setShowPlansList(false)
    }

  // If we have a study plan, show the results component
  if (studyPlan) {
    return <StudyPlanResults plan={studyPlan} userData={formData} onReset={() => setStudyPlan(null)} />
  }

  if (isSubmitting) {
    return (
      <GeneratingPlan progress={generationProgress} stage={generationStage} currentTip={currentTip} showTip={showTip} />
    )
  }

  // Success message after form submission
  if (showSuccess) {
    return <SuccessMessage onViewPlan={() => setStudyPlan(studyPlan)} />
  }

  // Render the form
  return (
    <div className="bg-white p-6 rounded-lg shadow-md relative overflow-hidden">
      {hasExistingPlan && !studyPlan && (
         <ExistingPlanNotice onViewPlans={() => setShowPlansList(true)} hasPlans={hasExistingPlan} />
      )}

      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full opacity-70 -z-10"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-50 rounded-tr-full opacity-70 -z-10"></div>

      {/* Study tip toast notification */}
      <AnimatePresence>{showTip && <StudyTip tip={currentTip} />}</AnimatePresence>

        {/* Plans list modal */}
        {showPlansList && (
        <UserPlansList
          plans={userPlans}
          onSelectPlan={handleSelectPlan}
          onClose={() => setShowPlansList(false)}
          onPlanDeleted={fetchUserPlans}
          isLoading={isLoadingPlans}
        />
      )}

      {/* API Error message */}
      <AnimatePresence>
        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-4 left-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-10"
          >
            <div className="flex items-start justify-between">
              <div className="flex">
                <AlertCircle className="mr-2 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <div className="font-medium text-sm">Error</div>
                  <div className="text-xs">{apiError}</div>
                </div>
              </div>
              <button onClick={() => setApiError(null)} className="text-white hover:text-red-100">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Brain className="mr-2 text-blue-600" size={24} />
          AI-Powered Study Planner
        </h1>
        <p className="text-gray-600">
          Answer a few questions to get a personalized study plan tailored to your needs, goals, and schedule.
        </p>
      </div>

      {/* Progress indicator */}
      <StepIndicator
        currentStep={currentStep}
        stepInfo={stepInfo}
        setCurrentStep={setCurrentStep}
        setAnimateDirection={setAnimateDirection}
      />

      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait" initial={false} custom={animateDirection}>
          {currentStep === 1 && (
            <PersonalDetailsStep
              formData={formData}
              setFormData={setFormData}
              handleInputChange={handleInputChange}
              errors={errors}
              pageVariants={pageVariants}
              animateDirection={animateDirection}
            />
          )}

          {currentStep === 2 && (
            <ExamDetailsStep
              formData={formData}
              handleInputChange={handleInputChange}
              errors={errors}
              pageVariants={pageVariants}
              animateDirection={animateDirection}
            />
          )}

          {currentStep === 3 && (
            <SubjectAssessmentStep
              formData={formData}
              setFormData={setFormData}
              handleTogglePerformanceData={handleTogglePerformanceData}
              weakTopics={weakTopics}
              isLoadingPerformanceData={isLoadingPerformanceData}
              errors={errors}
              setErrors={setErrors}
              pageVariants={pageVariants}
              animateDirection={animateDirection}
            />
          )}

          {currentStep === 4 && (
            <StudyPreferencesStep
              formData={formData}
              handleInputChange={handleInputChange}
              setFormData={setFormData}
              pageVariants={pageVariants}
              animateDirection={animateDirection}
            />
          )}

          {currentStep === 5 && (
            <GoalsStep
              formData={formData}
              handleInputChange={handleInputChange}
              pageVariants={pageVariants}
              animateDirection={animateDirection}
            />
          )}
        </AnimatePresence>

        <div className="mt-8 flex justify-between">
          {currentStep > 1 ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={prevStep}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors flex items-center"
            >
              <ChevronLeft className="mr-1" size={18} />
              Previous
            </motion.button>
          ) : (
            <div></div> // Empty div to maintain flex spacing
          )}

          {currentStep < 5 ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={nextStep}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              Next
              <ChevronRight className="ml-1" size={18} />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "#047857" }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              onClick={(e) => {
                if (isSubmitting) {
                  e.preventDefault()
                }
              }}
              disabled={isSubmitting}
              className={`px-4 py-2 ${
                isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
              } text-white rounded-md transition-colors flex items-center shadow-md`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={18} />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Zap className="mr-2" size={18} />
                  Generate Study Plan
                </>
              )}
            </motion.button>
          )}
        </div>
      </form>
    </div>
  )
}

export default PlannerForm
