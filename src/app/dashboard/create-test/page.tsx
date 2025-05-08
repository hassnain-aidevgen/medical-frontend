"use client"

import AITestSuggestions from "@/components/AITestSuggestions"
import ExamSimulation from "@/components/exam-simulation"
import SyllabusCoverageIndicator from "@/components/syllabus-coverage-indicator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import axios from "axios"
import { Book, BookOpen, Brain, Clock, Lightbulb } from "lucide-react"
import { useRouter } from "next/navigation"
import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { toast, Toaster } from "react-hot-toast"
import EstimatedTime from "@/components/EstimatedTime"
interface Subject {
  _id: string
  name: string
  count: number
  subsections: Subsection[]
}

interface Subsection {
  _id: string
  name: string
  count: number
}

interface Question {
  _id: string
  subject: {
    _id: string
    name: string
  }
  subsection: {
    _id: string
    name: string
  }
  system: string
  exam_type: "USMLE_STEP1" | "USMLE_STEP2" | "USMLE_STEP3"
  difficulty: "easy" | "medium" | "hard"
  question_type: "case_based" | "single_best_answer" | "extended_matching"
  year: number
}

interface Recommendation {
  questionText: string
  correctAnswer: string
  topic: string
  _id?: string // Adding _id for API integration
}

// Add these new interfaces at the top with the other interfaces
interface ValidationState {
  isValid: boolean
  message: string | null
}

interface FormValidation {
  subjects: ValidationState
  subsections: ValidationState
  questionCount: ValidationState
  overall: ValidationState
}

interface FilteredResponse {
  count: number
  questions: Question[]
}

// Add this interface with the other interfaces
interface TestResult {
  _id: string // Add this line to include the _id property
  userId: string
  questions: {
    questionId?: string // Some of your data doesn't have questionId
    questionText: string
    userAnswer: string
    correctAnswer: string
    timeSpent: number
  }[]
  score: number
  totalTime: number
  percentage: number
  createdAt: string
  updatedAt: string
}

const SubjectCheckbox: React.FC<{
  subject: Subject
  isSelected: boolean
  onChange: (subject: string) => void
}> = ({ subject, isSelected, onChange }) => (
  <label className="flex items-center p-3 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200">
    <input
      type="checkbox"
      checked={isSelected}
      onChange={() => onChange(subject._id)}
      className="form-checkbox h-5 w-5 text-primary rounded border-gray-300 focus:ring-primary"
    />
    <span className="ml-2 text-sm font-medium text-gray-700">{subject.name}</span>
    <span className="ml-auto text-xs text-gray-500">({subject.count})</span>
  </label>
)

const SubsectionCheckbox: React.FC<{
  subsection: Subsection
  isSelected: boolean
  onChange: (subsection: string) => void
}> = ({ subsection, isSelected, onChange }) => (
  <label className="flex items-center p-3 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200">
    <input
      type="checkbox"
      checked={isSelected}
      onChange={() => onChange(subsection._id)}
      className="form-checkbox h-5 w-5 text-primary rounded border-gray-300 focus:ring-primary"
    />
    <span className="ml-2 text-sm font-medium text-gray-700">{subsection.name}</span>
    <span className="ml-auto text-xs text-gray-500">({subsection.count})</span>
  </label>
)

const RecentTests: React.FC<{ performanceData: TestResult[]; isLoading: boolean }> = ({
  performanceData,
  isLoading,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-700">
          <BookOpen className="mr-2" size={24} />
          Tests History
        </h2>

        {isLoading ? (
          <div className="text-center py-4">Loading recent tests...</div>
        ) : !performanceData || performanceData.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No recent tests available.</div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto pr-2">
            <div className="space-y-3">
              {performanceData.slice(0, 5).map((test, index) => {
                const totalQuestions = test.questions.length
                const correctAnswers = test.score || 0
                const percentageScore = test.percentage || 0

                const formattedDate = new Date(test.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })

                const scoreColor =
                  percentageScore >= 70 ? "bg-green-500" : percentageScore >= 50 ? "bg-yellow-500" : "bg-red-500"

                return (
                  <div
                    key={test._id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Test {performanceData.length - index}</p>
                          <p className="text-sm text-muted-foreground">{formattedDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{percentageScore.toFixed(2)}%</p>
                          <p className="text-sm text-muted-foreground">
                            Score: {correctAnswers}/{totalQuestions}
                          </p>
                        </div>
                        <div className={`w-2 h-10 rounded-full ${scoreColor}`}></div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CreateTest() {
  const router = useRouter()
  const [mode, setMode] = useState<"tutor" | "timer">("tutor")
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [selectedSubsections, setSelectedSubsections] = useState<string[]>([])
  const [totalQuestions, setTotalQuestions] = useState<number>(10)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFilterLoading, setIsFilterLoading] = useState(false)
  const [maxQuestions, setMaxQuestions] = useState(0)
  const [selectedExam, setSelectedExam] = useState<string>("")
  const [examDate, setExamDate] = useState<string>("")

  // const [questions, setQuestions] = useState<Question[]>([])
  // Update the state declarations to include the new "All" options
  // Replace the existing state declarations for examType, difficulty, and questionType with:

  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "ALL_DIFFICULTY_LEVELS">(
    "ALL_DIFFICULTY_LEVELS",
  )
  const [questionType, setQuestionType] = useState<
    "case_based" | "single_best_answer" | "extended_matching" | "ALL_QUESTION_TYPES"
  >("ALL_QUESTION_TYPES")
  const [year, setYear] = useState<string>("ALL_YEARS")
  const [error, setError] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState<string>("10")
  // Replace the existing useState for inputError and inputStatus with this more comprehensive validation state
  const [validation, setValidation] = useState<FormValidation>({
    subjects: { isValid: true, message: null },
    subsections: { isValid: true, message: null },
    questionCount: { isValid: true, message: null },
    overall: { isValid: true, message: null },
  })

  // Replace the existing recommendations state with this enhanced version that tracks selected recommendations
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [examTypes, setExamTypes] = useState<string[]>([])
  const [examType, setExamType] = useState("ALL_USMLE_TYPES")
  const [loading, setLoading] = useState(true)

  // Add this new state to track if recommendations are being added to the test
  const [recommendedQuestionsToAdd, setRecommendedQuestionsToAdd] = useState<Recommendation[]>([])
  const [isCreatingRecommendedTest, setIsCreatingRecommendedTest] = useState(false)
  // Add this state declaration with the other state declarations
  const [performanceData, setPerformanceData] = useState<TestResult[]>([])

  const availableSubsections = subjects.reduce((acc: Subsection[], subject: Subject) => {
    if (selectedSubjects.includes(subject._id)) {
      return [...acc, ...subject.subsections]
    }
    return acc
  }, [])

  // Use environment variable or fallback to a relative path for API
  const API_BASE_URL = "https://medical-backend-loj4.onrender.com/api/test/create-test"
  const API_BASE_URL_LOCAL = "https://medical-backend-loj4.onrender.com/api/test/create-test"

  // Update this function in your create-test page
  const fetchRecommendations = useCallback(async () => {
    setIsLoadingRecommendations(true)
    try {
      const userId = localStorage.getItem("Medical_User_Id")
      if (!userId) {
        console.log("No user ID found in localStorage")
        return
      }
      // old route:
      // const { data } = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/recommendations3/${userId}`)
      const { data } = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/recommendations4/${userId}`);


      console.log("Recommendation data received:", data) // For debugging

      setRecommendations(data.recommendations)

      // If we got recommendations, show the section
      if (data.recommendations && data.recommendations.length > 0) {
        setShowRecommendations(true)
      } else {
        setShowRecommendations(false)
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error)
      setShowRecommendations(false)
    } finally {
      setIsLoadingRecommendations(false)
    }
  }, [])

  // New fetchData using local API
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      console.log("⭐ Attempting to fetch from:", `${API_BASE_URL_LOCAL}/subjects2`)
      const { data } = await axios.get(`${API_BASE_URL_LOCAL}/subjects2`)
      console.log("✅ Data received:", data)

      if (data && Array.isArray(data)) {
        // Log the first subject and first subsection to verify counts
        if (data.length > 0) {
          console.log("First subject:", data[0].name, "count:", data[0].count)
          if (data[0].subsections && data[0].subsections.length > 0) {
            console.log("First subsection:", data[0].subsections[0].name, "count:", data[0].subsections[0].count)
          }
        }
        setSubjects(data)
      } else {
        console.error("Invalid data format received:", data)
        setError("Invalid data format received from API")
      }
    } catch (error) {
      console.error("Error fetching subjects:", error)
      // If local server fails, try production API
      try {
        console.log("⚠️ Local API failed, trying production API:", `${API_BASE_URL}/subjects`)
        const { data } = await axios.get(`${API_BASE_URL}/subjects`)
        setSubjects(data)
      } catch (prodError) {
        console.error("Production API also failed:", prodError)
        setError("Failed to load subjects. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [API_BASE_URL, API_BASE_URL_LOCAL])

  // Modify the handleFilterChange function to NOT update selectedExam when examType changes
  // This will keep the exam type selection for filtering separate from the target exam label
  const handleFilterChange = <T extends string>(value: T, setter: React.Dispatch<React.SetStateAction<T>>) => {
    setter(value)
    setError(null)

    // Remove the code that was setting selectedExam and examDate here
  }

  // Add a new useEffect to set the selectedExam and examDate when the form is submitted
  // This will ensure the target exam label is set without affecting question filtering
  useEffect(() => {
    // Set the selected exam based on the current examType
    // This is just for labeling purposes and doesn't affect filtering
    setSelectedExam(examType)

    // Set current date in the format YYYY-MM-DD
    const today = new Date()
    const formattedDate = today.toISOString().split("T")[0]
    setExamDate(formattedDate)
  }, [examType])

  useEffect(() => {
    const fetchExamTypes = async () => {
      try {
        const response = await axios.get("https://medical-backend-loj4.onrender.com/api/exam-type/exam-types") // adjust if needed
        if (response.data.success) {
          setExamTypes(response.data.examTypes)
        }
      } catch (err) {
        console.error("Failed to fetch exam types:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchExamTypes()
  }, [])

  // Fix the fetchFilteredQuestions function to ensure it's not using selectedExam for filtering
  // Replace the existing fetchFilteredQuestions function with this updated version:
  const fetchFilteredQuestions = useCallback(async () => {
    if (selectedSubjects.length === 0 || selectedSubsections.length === 0) {
      setMaxQuestions(0)
      return
    }

    setIsFilterLoading(true)
    setError(null)

    try {
      const { data } = await axios.get<FilteredResponse>(`${API_BASE_URL}/filtered-questions`, {
        params: {
          subjects: selectedSubjects.join(","),
          subsections: selectedSubsections.join(","),
          exam_type: examType,
          difficulty: difficulty,
          question_type: questionType,
          year: year,
        },
      })

      console.log("API Response:", data)

      // Set the maximum questions available
      setMaxQuestions(data.count)

      // Adjust totalQuestions and inputValue if they exceed the new maximum
      if (data.count > 0) {
        if (totalQuestions > data.count) {
          setTotalQuestions(data.count)
          setInputValue(data.count.toString())
        }
      } else {
        setTotalQuestions(0)
        setInputValue("0")
      }

      if (data.count === 0) {
        setError("No questions available with the selected filters. Try adjusting your criteria.")
      }
    } catch (error) {
      console.error("Error fetching filtered questions:", error)
      setError("Failed to load questions. Please try again.")
      setMaxQuestions(0)
      setTotalQuestions(0)
      setInputValue("0")
    } finally {
      setIsFilterLoading(false)
    }
  }, [API_BASE_URL, selectedSubjects, selectedSubsections, examType, difficulty, questionType, year, totalQuestions])

  useEffect(() => {
    // Load saved exam settings from localStorage
    const savedExam = localStorage.getItem("selectedExam")
    const savedDate = localStorage.getItem("examDate")

    if (savedExam) {
      setSelectedExam(savedExam)
      // Also update the examType filter to match the saved exam
      setExamType(
        savedExam as
          | "USMLE_STEP1"
          | "USMLE_STEP2"
          | "USMLE_STEP3"
          | "ALL_USMLE_TYPES"
          | "NEET"
          | "PLAB"
          | "MCAT"
          | "NCLEX"
          | "COMLEX",
      )
    }

    if (savedDate) {
      setExamDate(savedDate)
    }

    fetchData()
  }, [fetchData])

  // Fetch questions whenever filters change
  useEffect(() => {
    if (selectedSubjects.length > 0 && selectedSubsections.length > 0) {
      const debounceTimer = setTimeout(() => {
        fetchFilteredQuestions()
      }, 300) // Add small delay to prevent rapid API calls

      return () => clearTimeout(debounceTimer)
    } else {
      // Reset questions and max when no filters are selected
      // setQuestions([])
      setMaxQuestions(0)
    }
  }, [selectedSubjects, selectedSubsections, examType, difficulty, questionType, year, fetchFilteredQuestions])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  // Add this code to fetch performance data in the useEffect where you fetch other data
  // Find a suitable useEffect or add this to an existing one:
  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        const userId = localStorage.getItem("Medical_User_Id")
        if (!userId) return

        interface PerformanceResponse {
          success: boolean
          results: TestResult[]
        }

        const performanceResponse = await axios.get<PerformanceResponse>(
          "https://medical-backend-loj4.onrender.com/api/test/performance2",
          {
            params: { userId },
          },
        )
        if (performanceResponse.data.success) {
          setPerformanceData(performanceResponse.data.results)
        } else {
          console.error("Failed to load performance data.")
        }
      } catch (error) {
        console.error("Error fetching performance data:", error)
      }
    }

    fetchPerformanceData()
  }, [])

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjects((prev) => {
      const newSelectedSubjects = prev.includes(subjectId) ? prev.filter((s) => s !== subjectId) : [...prev, subjectId]

      // If we're removing a subject, also remove its subsections
      if (prev.includes(subjectId)) {
        const subjectToRemove = subjects.find((s) => s._id === subjectId)
        if (subjectToRemove) {
          const subsectionIdsToRemove = subjectToRemove.subsections.map((ss) => ss._id)
          setSelectedSubsections((prev) => prev.filter((ssId) => !subsectionIdsToRemove.includes(ssId)))
        }
      }

      return newSelectedSubjects
    })

    setError(null)
  }

  const handleSubsectionChange = (subsectionId: string) => {
    setSelectedSubsections((prev) =>
      prev.includes(subsectionId) ? prev.filter((s) => s !== subsectionId) : [...prev, subsectionId],
    )
    setError(null)
  }

  // Modify the handleFilterChange function to update selectedExam when examType changes
  const addRecommendedQuestion = (recommendation: Recommendation) => {
    setSelectedRecommendations((prev) => {
      if (prev.includes(recommendation.questionText)) {
        // Remove if already selected
        setRecommendedQuestionsToAdd((current) => current.filter((q) => q.questionText !== recommendation.questionText))
        return prev.filter((id) => id !== recommendation.questionText)
      } else {
        // Add with a unique ID to ensure it's processed correctly
        const enhancedRecommendation = {
          ...recommendation,
          uniqueId: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        }

        // Add if not already selected
        setRecommendedQuestionsToAdd((current) => [...current, enhancedRecommendation])
        return [...prev, recommendation.questionText]
      }
    })
  }
  // Add this new validateForm function
  // Update the validateForm function to ensure the button is disabled by default
  const validateForm = useCallback(() => {
    const newValidation: FormValidation = {
      subjects: { isValid: true, message: null },
      subsections: { isValid: true, message: null },
      questionCount: { isValid: true, message: null },
      overall: { isValid: false, message: "Please select subjects and subsections" }, // Default to invalid
    }

    // If we have recommended questions to add, we can bypass some validations
    const hasRecommendedQuestions = recommendedQuestionsToAdd.length > 0

    // Only validate subjects and subsections if no recommended questions
    if (!hasRecommendedQuestions) {
      // Validate subjects
      if (selectedSubjects.length === 0) {
        newValidation.subjects = {
          isValid: false,
          message: "Please select at least one subject",
        }
      }

      // Validate subsections
      if (selectedSubsections.length === 0) {
        newValidation.subsections = {
          isValid: false,
          message: "Please select at least one subsection",
        }
      }
    }

    // Validate question count - only if we're not using recommended questions
    if (!hasRecommendedQuestions) {
      const numericValue = Number.parseInt(inputValue, 10)
      if (isNaN(numericValue) || numericValue < 1) {
        newValidation.questionCount = {
          isValid: false,
          message: "Please enter a valid number of questions (minimum 1)",
        }
      } else if (maxQuestions > 0 && numericValue > maxQuestions) {
        newValidation.questionCount = {
          isValid: false,
          message: `Maximum ${maxQuestions} questions available`,
        }
      }
    }

    // Set overall validation status
    if (hasRecommendedQuestions) {
      // If we have recommended questions, the form is valid
      newValidation.overall = {
        isValid: true,
        message: null,
      }
    } else {
      newValidation.overall = {
        isValid:
          newValidation.subjects.isValid &&
          newValidation.subsections.isValid &&
          newValidation.questionCount.isValid &&
          selectedSubjects.length > 0 && // Explicitly check for selections
          selectedSubsections.length > 0,
        message: newValidation.subjects.isValid
          ? newValidation.subsections.isValid
            ? newValidation.questionCount.message
            : newValidation.subsections.message
          : newValidation.subjects.message,
      }
    }

    setValidation(newValidation)
    return newValidation.overall.isValid
  }, [selectedSubjects, selectedSubsections, inputValue, maxQuestions, recommendedQuestionsToAdd.length])

  // Add a useEffect to run validation whenever selections change
  useEffect(() => {
    validateForm()
  }, [selectedSubjects, selectedSubsections, validateForm])

  // Replace the handleSubmit function with this enhanced version
  // Updated handleSubmit function to properly handle added recommendations
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Run validation
    if (!validateForm()) {
      // Show toast with error message
      toast.error(validation.overall.message || "Please correct the errors in the form")
      return
    }

    // Additional validation for question count
    if (maxQuestions === 0 && recommendedQuestionsToAdd.length === 0) {
      toast.error("No questions available with the current selection")
      return
    }

    if (totalQuestions <= 0 && recommendedQuestionsToAdd.length === 0) {
      toast.error("Please select at least one question")
      return
    }

    try {
      // Create URL parameters
      const params = new URLSearchParams({
        mode,
        subjects: selectedSubjects.join(","),
        subsections: selectedSubsections.join(","),
        count: totalQuestions.toString(),
        exam_type: examType,
        difficulty: difficulty,
        question_type: questionType,
        year: year,
        // Add these new parameters to pass target exam info
        targetExam: selectedExam || "",
        examDate: examDate || "",
      })

      // If we have recommended questions to add, append them
      if (recommendedQuestionsToAdd.length > 0) {
        // Add a flag to indicate we have recommended questions
        params.append("hasRecommended", "true")

        // Add the recommended questions to the URL
        params.append("recommendedQuestions", JSON.stringify(recommendedQuestionsToAdd))
      }

      // Force cache bust with timestamp
      params.append("t", Date.now().toString())

      router.push(`/dashboard/take-test?${params.toString()}`)
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error("An error occurred. Please try again.")
    }
  }

  // Function to generate contextually appropriate options based on the correct answer
  const generateContextualOptions = (correctAnswer: string, topic: string) => {
    // Make sure we have a valid answer to work with
    if (!correctAnswer || correctAnswer.trim() === "") {
      return ["Option A", "Option B", "Option C", correctAnswer]
    }

    // Generate variations based on the correct answer
    const options = []

    // Always include the correct answer
    options.push(correctAnswer)

    // Generate 3 additional options that are contextually related to the correct answer
    // These will be different depending on the type of answer

    // For numerical answers (like dosages)
    if (/\d+/.test(correctAnswer)) {
      const numMatch = correctAnswer.match(/\d+/)
      if (numMatch) {
        const num = Number.parseInt(numMatch[0])
        const unit = correctAnswer.replace(numMatch[0], "").trim()

        // Add variations with different numbers
        options.push(`${Math.floor(num * 0.5)}${unit}`)
        options.push(`${Math.floor(num * 2)}${unit}`)
        options.push(`${Math.floor(num * 1.5)}${unit}`)
      }
    }
    // For multiple choice answers with common medical terms
    else {
      // Create variations based on the answer
      const words = correctAnswer.split(" ")

      // If it's a single word answer
      if (words.length === 1) {
        // Add similar but different terms
        if (topic.toLowerCase().includes("diagnosis")) {
          options.push(`Acute ${correctAnswer}`)
          options.push(`Chronic ${correctAnswer}`)
          options.push(`Recurrent ${correctAnswer}`)
        } else if (topic.toLowerCase().includes("treatment")) {
          options.push(`Modified ${correctAnswer}`)
          options.push(`Alternative ${correctAnswer}`)
          options.push(`Experimental ${correctAnswer}`)
        } else {
          // Generic variations
          options.push(`${correctAnswer} Type I`)
          options.push(`${correctAnswer} Type II`)
          options.push(`Atypical ${correctAnswer}`)
        }
      }
      // For multi-word answers
      else {
        // Create variations by modifying parts of the answer
        if (words.length >= 3) {
          // Replace first word
          const variation1 = [...words]
          variation1[0] =
            variation1[0] === "Primary"
              ? "Secondary"
              : variation1[0] === "Acute"
                ? "Chronic"
                : variation1[0] === "Benign"
                  ? "Malignant"
                  : "Atypical"
          options.push(variation1.join(" "))

          // Replace last word
          const variation2 = [...words]
          variation2[variation2.length - 1] =
            variation2[variation2.length - 1] === "Syndrome"
              ? "Disease"
              : variation2[variation2.length - 1] === "Deficiency"
                ? "Excess"
                : "Disorder"
          options.push(variation2.join(" "))

          // Combine modifications
          const variation3 = [...words]
          variation3[0] = variation3[0] === "Primary" ? "Secondary" : variation3[0] === "Acute" ? "Chronic" : "Atypical"
          variation3[variation3.length - 1] = "Variant"
          options.push(variation3.join(" "))
        } else {
          // For two-word answers
          options.push(`${words[0]} Variant`)
          options.push(`Atypical ${words.join(" ")}`)
          options.push(`${words.join(" ")} Complex`)
        }
      }
    }

    // If we still don't have enough options, add generic ones
    while (options.length < 4) {
      if (topic.toLowerCase().includes("anatomy")) {
        options.push(`Proximal ${correctAnswer}`)
        options.push(`Distal ${correctAnswer}`)
        options.push(`Lateral ${correctAnswer}`)
      } else if (topic.toLowerCase().includes("pharmacology")) {
        options.push(`${correctAnswer} Analog`)
        options.push(`${correctAnswer} Derivative`)
        options.push(`${correctAnswer} Antagonist`)
      } else {
        options.push(`${correctAnswer} (Type A)`)
        options.push(`${correctAnswer} (Type B)`)
        options.push(`${correctAnswer} (Variant)`)
      }
    }

    // Shuffle the options and ensure the correct answer is included
    const shuffledOptions = options.slice(0, 4).sort(() => Math.random() - 0.5)

    // Make sure the correct answer is in the options
    if (!shuffledOptions.includes(correctAnswer)) {
      shuffledOptions[0] = correctAnswer
    }

    return shuffledOptions
  }

  // Add new function to create test with only recommended questions
  // Updated function for "Create Test from All Recommendations" button
  const handleCreateRecommendedTest = async () => {
    if (recommendations.length === 0) {
      toast.error("No recommendations available")
      return
    }

    setIsCreatingRecommendedTest(true)

    try {
      // Create a unique test ID with a recommended_ prefix
      const testId = `recommended_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

      // Fetch the full question details for each recommendation to get the actual options
      const enhancedRecommendations = await Promise.all(
        recommendations.map(async (rec, index) => {
          try {
            // Try to fetch the question by topic or text to get all options
            const searchTerm = rec.topic || rec.questionText
            const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/questions/search`, {
              params: { query: searchTerm, limit: 5 },
            })

            // Check if we got any results
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
              // Find the best matching question
              const matchingQuestion =
                response.data.find(
                  (q) => q.question === rec.questionText || (q.answer === rec.correctAnswer && q.topic === rec.topic),
                ) || response.data[0]

              console.log(`Found matching question for "${rec.questionText.substring(0, 30)}..."`, matchingQuestion)

              // If the question has options, use them
              if (
                matchingQuestion.options &&
                Array.isArray(matchingQuestion.options) &&
                matchingQuestion.options.length >= 3
              ) {
                console.log(`DEBUG - Using actual options for question:`, matchingQuestion.options)

                // Make sure the correct answer is in the options
                const options = [...matchingQuestion.options]
                if (!options.includes(rec.correctAnswer)) {
                  options[0] = rec.correctAnswer
                }

                // Ensure we have exactly 4 options for consistency
                while (options.length < 4) {
                  options.push(generateContextualOptions(rec.correctAnswer, rec.topic || "")[0])
                }

                // Limit to 4 options if we have more
                const finalOptions = options.slice(0, 4)

                console.log(`DEBUG - Final options for "${rec.questionText.substring(0, 30)}...":`, finalOptions)

                return {
                  ...rec,
                  uniqueId: `rec_${Date.now()}_${index}`,
                  options: finalOptions,
                  answer: rec.correctAnswer,
                  explanation: matchingQuestion.explanation || `This is a recommended question about ${rec.topic}.`,
                  question: rec.questionText,
                  subject: matchingQuestion.subject || "Recommended",
                  subsection: matchingQuestion.subsection || "Recommended Questions",
                  difficulty: matchingQuestion.difficulty || "medium",
                  question_type: matchingQuestion.question_type || "single_best_answer",
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching question details for "${rec.questionText.substring(0, 30)}...":`, error)
          }

          // If we couldn't find a matching question or get options, create contextually appropriate options
          console.log(
            `DEBUG - No matching question found for "${rec.questionText.substring(0, 30)}...", generating contextual options`,
          )

          // Generate contextually appropriate options based on the correct answer and topic
          const options = generateContextualOptions(rec.correctAnswer, rec.topic || "")
          console.log(`DEBUG - Generated contextual options:`, options)
          console.log(`DEBUG - Is correct answer in generated options: ${options.includes(rec.correctAnswer)}`)

          // Ensure we have exactly 4 options
          const finalOptions = options.slice(0, 4)

          return {
            ...rec,
            uniqueId: `rec_${Date.now()}_${index}`,
            options: finalOptions,
            answer: rec.correctAnswer,
            explanation: `This is a recommended question about ${rec.topic}.`,
            question: rec.questionText,
            subject: "Recommended",
            subsection: "Recommended Questions",
            difficulty: "medium",
            question_type: "single_best_answer",
          }
        }),
      )

      console.log("Enhanced recommendations with options:", enhancedRecommendations)

      // Store the questions in localStorage with recommended naming
      localStorage.setItem("recommendedQuestions", JSON.stringify(enhancedRecommendations))
      localStorage.setItem("currentRecommendedTestId", testId)

      // Also store in the standard feedback keys for backward compatibility
      // This ensures the take-test page can still find the questions
      localStorage.setItem("feedbackQuestions", JSON.stringify(enhancedRecommendations))
      localStorage.setItem("currentFeedbackTestId", testId)

      // Create URL parameters for recommended questions test
      const params = new URLSearchParams({
        mode,
        isRecommendedTest: "true",
        id: testId, // Add a test ID to identify this as a recommended test
        testType: "recommendations", // Add this to distinguish from feedback tests
        targetExam: selectedExam || "",
        examDate: examDate || "",
      })

      // Force cache bust with timestamp
      params.append("t", Date.now().toString())

      // Navigate to the test page
      router.push(`/dashboard/take-test?${params.toString()}`)
    } catch (error) {
      console.error("Error creating recommended test:", error)
      toast.error("An error occurred. Please try again.")
      setIsCreatingRecommendedTest(false)
    }
  }

  // Add this effect to validate the form on input changes
  useEffect(() => {
    // Don't show validation errors while user is typing
    if (inputValue !== "" && !/^\d+$/.test(inputValue)) {
      setValidation((prev) => ({
        ...prev,
        questionCount: {
          isValid: false,
          message: "Please enter numbers only",
        },
      }))
    }
  }, [inputValue])

  // Replace the onChange handler for the input field
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value

    // Allow empty input temporarily for better UX
    if (rawValue === "") {
      setInputValue("")
      setValidation((prev) => ({
        ...prev,
        questionCount: {
          isValid: false,
          message: "Please enter a number",
        },
      }))
      return
    }

    // Check if input is a valid number
    if (!/^\d+$/.test(rawValue)) {
      setInputValue(rawValue)
      setValidation((prev) => ({
        ...prev,
        questionCount: {
          isValid: false,
          message: "Please enter numbers only",
        },
      }))
      return
    }

    // Convert to number for validation
    const numericValue = Number.parseInt(rawValue, 10)

    // Enforce minimum and maximum values
    if (numericValue < 1) {
      // For minimum value, update both the display and the actual value
      setInputValue("1")
      setTotalQuestions(1)
      setValidation((prev) => ({
        ...prev,
        questionCount: {
          isValid: true,
          message: null,
        },
      }))
    } else if (maxQuestions > 0 && numericValue > maxQuestions) {
      // For maximum value, update both the display and the actual value
      setInputValue(maxQuestions.toString())
      setTotalQuestions(maxQuestions)
      setValidation((prev) => ({
        ...prev,
        questionCount: {
          isValid: true,
          message: null,
        },
      }))
    } else {
      // For valid values, update normally
      setInputValue(rawValue)
      setTotalQuestions(numericValue)
      setValidation((prev) => ({
        ...prev,
        questionCount: {
          isValid: true,
          message: null,
        },
      }))
    }
  }

  // Add this useEffect to update the input value when maxQuestions changes
  useEffect(() => {
    if (maxQuestions > 0) {
      // If current value exceeds max, adjust it
      if (totalQuestions > maxQuestions) {
        setTotalQuestions(maxQuestions)
        setInputValue(maxQuestions.toString())
      }
    }
  }, [maxQuestions, totalQuestions])

  return (
    // <div className="max-h-[85dvh] overflow-y-auto overflow-x-hidden bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8 rounded-md border border-slate-200">
    <div className="">
      <Toaster position="top-right" />
      <div className="max-w-full lg:max-w-6xl mx-auto">
        <h1 className=" text-2xl md:text-3xl font-bold mb-8  text-gray-800">Create Your Test</h1>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-700">
                <Clock className="mr-2" size={24} />
                Test Mode
              </h2>
              <div className="flex space-x-4">
                <button
                  type="button"
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    mode === "tutor" ? "bg-primary text-white shadow-md" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => setMode("tutor")}
                >
                  Tutor Mode
                </button>
                <button
                  type="button"
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    mode === "timer" ? "bg-primary text-white shadow-md" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => setMode("timer")}
                >
                  Timer Mode
                </button>
              </div>
            </div>

            {/* Recommended Questions section with "Create Test from Recommendations" button */}
            {showRecommendations && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-700">
                  <Lightbulb className="mr-2" size={24} />
                  Recommended Questions
                </h2>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-amber-800">
                      Based on your previous tests, we recommend focusing on these topics:
                    </p>
                    <button
                      type="button"
                      onClick={handleCreateRecommendedTest}
                      disabled={isLoadingRecommendations || recommendations.length === 0 || isCreatingRecommendedTest}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 shadow ${
                        isLoadingRecommendations || recommendations.length === 0 || isCreatingRecommendedTest
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-amber-500 text-white hover:bg-amber-600"
                      }`}
                    >
                      {isCreatingRecommendedTest ? (
                        "Creating..."
                      ) : (
                        <>
                          <span className="hidden sm:inline">Create Test from All Recommendations</span>
                          <span className="sm:hidden">Create from All</span>
                        </>
                      )}
                    </button>
                  </div>

                  {isLoadingRecommendations ? (
                    <div className="text-center py-4">Loading recommendations...</div>
                  ) : recommendations.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No recommendations available yet. Complete more tests to get personalized suggestions.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recommendations.map((recommendation, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-800">{recommendation.questionText}</p>
                              <p className="text-sm text-gray-500 mt-1">Topic: {recommendation.topic}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => addRecommendedQuestion(recommendation)}
                              className={`ml-2 px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                selectedRecommendations.includes(recommendation.questionText)
                                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                                  : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                              }`}
                            >
                              {selectedRecommendations.includes(recommendation.questionText)
                                ? "Added ✓"
                                : "Add to Test"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedRecommendations.length > 0 && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800">
                        <span className="font-medium">{selectedRecommendations.length}</span> recommended{" "}
                        {selectedRecommendations.length === 1 ? "question" : "questions"} will be added to your test
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Subjects section */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-700">
                <Book className="mr-2" size={24} />
                Subjects
              </h2>
              {isLoading ? (
                <div className="text-center py-4">Loading subjects...</div>
              ) : subjects.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No subjects available</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {subjects.map((subject) => (
                    <SubjectCheckbox
                      key={subject._id}
                      subject={subject}
                      isSelected={selectedSubjects.includes(subject._id)}
                      onChange={handleSubjectChange}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Subsections section */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-700">
                <Brain className="mr-2" size={24} />
                Subsections
              </h2>
              {selectedSubjects.length === 0 ? (
                <div className="text-center py-4 text-gray-500">Please select at least one subject first</div>
              ) : availableSubsections.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No subsections available for selected subjects</div>
              ) : (
                <div className="space-y-4">
                  {subjects
                    .filter((subject) => selectedSubjects.includes(subject._id))
                    .map((subject) => (
                      <div key={subject._id} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <h3 className="text-lg font-semibold mb-2">{subject.name}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {subject.subsections.map((subsection) => (
                            <SubsectionCheckbox
                              key={subsection._id}
                              subsection={subsection}
                              isSelected={selectedSubsections.includes(subsection._id)}
                              onChange={handleSubsectionChange}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Filters section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">Exam Type</h2>
                <Select
                  value={examType}
                  onValueChange={(value: typeof examType) => handleFilterChange(value, setExamType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    {!loading && (
                      <>
                        <SelectItem value="ALL_USMLE_TYPES">All USMLE Types</SelectItem>
                        {examTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-2">Difficulty</h2>
                <Select
                  value={difficulty}
                  onValueChange={(value: typeof difficulty) => handleFilterChange(value, setDifficulty)}
                  disabled={isFilterLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_DIFFICULTY_LEVELS">All Difficulty Levels</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-2">Question Type</h2>
                <Select
                  value={questionType}
                  onValueChange={(value: typeof questionType) => handleFilterChange(value, setQuestionType)}
                  disabled={isFilterLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select question type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_QUESTION_TYPES">All Question Types</SelectItem>
                    <SelectItem value="case_based">Case Based</SelectItem>
                    <SelectItem value="single_best_answer">Single Best Answer</SelectItem>
                    <SelectItem value="extended_matching">Extended Matching</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-2">Year</h2>
                <Select
                  value={year}
                  onValueChange={(value: string) => handleFilterChange(value, setYear)}
                  disabled={isFilterLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_YEARS">All Years</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2021">2021</SelectItem>
                    <SelectItem value="2020">2020</SelectItem>
                    <SelectItem value="2019">2019</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Add Syllabus Coverage Indicator */}
            <div>
              <SyllabusCoverageIndicator
                subjects={subjects}
                selectedSubjects={selectedSubjects}
                selectedSubsections={selectedSubsections}
                examType={examType}
              />
            </div>

            {/* Total Questions section */}
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={() => {
                  // On blur, normalize the input value
                  if (inputValue === "") {
                    const defaultValue = Math.min(10, maxQuestions || 1)
                    setInputValue(defaultValue.toString())
                    setTotalQuestions(defaultValue)
                    setValidation((prev) => ({
                      ...prev,
                      questionCount: {
                        isValid: true,
                        message: null,
                      },
                    }))
                    return
                  }

                  // Remove leading zeros on blur
                  const numericValue = Number.parseInt(inputValue, 10)

                  // Ensure value is within bounds
                  let normalizedValue = numericValue
                  if (numericValue < 1) {
                    normalizedValue = 1
                  } else if (maxQuestions > 0 && numericValue > maxQuestions) {
                    normalizedValue = maxQuestions
                  }

                  setInputValue(normalizedValue.toString())
                  setTotalQuestions(normalizedValue)
                  setValidation((prev) => ({
                    ...prev,
                    questionCount: {
                      isValid: true,
                      message: null,
                    },
                  }))
                }}
                disabled={isFilterLoading || maxQuestions === 0}
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:outline-none transition-colors duration-200 ${
                  maxQuestions === 0
                    ? "bg-gray-100 text-gray-400 border-gray-200"
                    : validation.questionCount.isValid
                      ? "border-green-400 focus:border-green-500 focus:ring-green-200"
                      : "border-red-400 focus:border-red-500 focus:ring-red-200"
                }`}
                placeholder="Enter number of questions"
                aria-label="Total number of questions"
                aria-describedby="questions-hint"
              />
              {!validation.questionCount.isValid && validation.questionCount.message && (
                <p className="mt-1 text-sm text-red-500" id="questions-error">
                  {validation.questionCount.message}
                </p>
              )}
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600" id="questions-hint">
                  {maxQuestions > 0
                    ? `Maximum questions available: ${maxQuestions}`
                    : "No questions available with current selection"}
                </p>
                {/* Add EstimatedTime component here */}
                {validation.questionCount.isValid && totalQuestions > 0 && (
                  <EstimatedTime questionCount={totalQuestions} mode={mode} difficulty={difficulty} />
                )}
                {error && error.includes("No questions available") && (
                  <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h3 className="text-sm font-semibold text-amber-800 mb-2">
                      No questions found with your current filters
                    </h3>
                    <p className="text-sm text-amber-700 mb-3">Try these adjustments to find more questions:</p>
                    <ul className="list-disc pl-5 text-sm text-amber-700 space-y-1">
                      <li>
                        Expand your year range to <strong>All Years</strong> instead of a specific year
                      </li>
                      <li>
                        Select <strong>All Difficulty Levels</strong> instead of just one
                      </li>
                      <li>
                        Include <strong>All Question Types</strong> for more variety
                      </li>
                      <li>Select additional subjects or subsections to broaden your search</li>
                      {selectedSubjects.length === 1 && selectedSubsections.length <= 2 && (
                        <li>You&apos;ve selected very few topics - try adding more subjects and subsections</li>
                      )}
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {year !== "ALL_YEARS" && (
                        <button
                          type="button"
                          onClick={() => setYear("ALL_YEARS")}
                          className="text-xs px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-full transition-colors"
                        >
                          Use All Years
                        </button>
                      )}
                      {difficulty !== "ALL_DIFFICULTY_LEVELS" && (
                        <button
                          type="button"
                          onClick={() => setDifficulty("ALL_DIFFICULTY_LEVELS")}
                          className="text-xs px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-full transition-colors"
                        >
                          Use All Difficulty Levels
                        </button>
                      )}
                      {questionType !== "ALL_QUESTION_TYPES" && (
                        <button
                          type="button"
                          onClick={() => setQuestionType("ALL_QUESTION_TYPES")}
                          className="text-xs px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-full transition-colors"
                        >
                          Use All Question Types
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {error && !error.includes("No questions available") && <p className="text-sm text-red-500">{error}</p>}
                {isFilterLoading && <p className="text-sm text-blue-500">Updating available questions...</p>}
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={
                isLoading ||
                isFilterLoading ||
                (!validation.overall.isValid && recommendedQuestionsToAdd.length === 0) ||
                selectedSubjects.length === 0 ||
                selectedSubsections.length === 0 // Explicitly check for selections
              }
              className={`w-full py-3 px-6 rounded-lg text-lg font-semibold transition-colors duration-200 shadow-md ${
                isLoading ||
                isFilterLoading ||
                (!validation.overall.isValid && recommendedQuestionsToAdd.length === 0) ||
                (selectedSubjects.length === 0 || selectedSubsections.length === 0)
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-primary text-white hover:bg-primary-dark"
              }`}
            >
              {isLoading || isFilterLoading
                ? "Loading..."
                : selectedSubjects.length === 0 || selectedSubsections.length === 0
                  ? "Select Subjects and Subsections"
                  : "Generate Test"}
            </button>
          </form>
        </div>

        <div className="mb-8 mt-8">
          <AITestSuggestions
            // API_BASE_URL={API_BASE_URL}
            mode={mode}
          />
        </div>
        {/* Add ExamSimulation component at the top for quick tests */}
        <div className="mb-8">
          <ExamSimulation />
        </div>

        <div className="mt-8">
          <RecentTests performanceData={performanceData} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
