"use client"

import AITestSuggestions from "@/components/AITestSuggestions"
import ExamSimulation from "@/components/exam-simulation"
import SyllabusCoverageIndicator from "@/components/syllabus-coverage-indicator"
import RecommendedQuestions from "./RecommendedQuestions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import axios from "axios"
import { Book, BookOpen, Brain, Clock } from "lucide-react"
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
  _id?: string
}

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

interface TestResult {
  _id: string
  userId: string
  questions: {
    questionId?: string
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

  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "ALL_DIFFICULTY_LEVELS">(
    "ALL_DIFFICULTY_LEVELS",
  )
  const [questionType, setQuestionType] = useState<
    "case_based" | "single_best_answer" | "extended_matching" | "ALL_QUESTION_TYPES"
  >("ALL_QUESTION_TYPES")
  const [year, setYear] = useState<string>("ALL_YEARS")
  const [error, setError] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState<string>("10")

  const [validation, setValidation] = useState<FormValidation>({
    subjects: { isValid: true, message: null },
    subsections: { isValid: true, message: null },
    questionCount: { isValid: true, message: null },
    overall: { isValid: true, message: null },
  })

  // States for recommended questions functionality
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([])
  const [recommendedQuestionsToAdd, setRecommendedQuestionsToAdd] = useState<Recommendation[]>([])

  const [examTypes, setExamTypes] = useState<string[]>([])
  const [examType, setExamType] = useState("ALL_USMLE_TYPES")
  const [loading, setLoading] = useState(true)
  const [performanceData, setPerformanceData] = useState<TestResult[]>([])

  const availableSubsections = subjects.reduce((acc: Subsection[], subject: Subject) => {
    if (selectedSubjects.includes(subject._id)) {
      return [...acc, ...subject.subsections]
    }
    return acc
  }, [])

  // Use environment variable or fallback to a relative path for API
  const API_BASE_URL = "https://medical-backend-3eek.onrender.com/api/test/create-test"
  const API_BASE_URL_LOCAL = "https://medical-backend-3eek.onrender.com/api/test/create-test"

  // New fetchData using local API
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      console.log("⭐ Attempting to fetch from:", `${API_BASE_URL_LOCAL}/subjects2`)
      const { data } = await axios.get(`${API_BASE_URL_LOCAL}/subjects2`)
      console.log("✅ Data received:", data)

      if (data && Array.isArray(data)) {
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

  const handleFilterChange = <T extends string>(value: T, setter: React.Dispatch<React.SetStateAction<T>>) => {
    setter(value)
    setError(null)
  }

  useEffect(() => {
    setSelectedExam(examType)
    const today = new Date()
    const formattedDate = today.toISOString().split("T")[0]
    setExamDate(formattedDate)
  }, [examType])

  useEffect(() => {
    const fetchExamTypes = async () => {
      try {
        const response = await axios.get("https://medical-backend-3eek.onrender.com/api/exam-type/exam-types")
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

      setMaxQuestions(data.count)

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
    const savedExam = localStorage.getItem("selectedExam")
    const savedDate = localStorage.getItem("examDate")

    if (savedExam) {
      setSelectedExam(savedExam)
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

  useEffect(() => {
    if (selectedSubjects.length > 0 && selectedSubsections.length > 0) {
      const debounceTimer = setTimeout(() => {
        fetchFilteredQuestions()
      }, 300)

      return () => clearTimeout(debounceTimer)
    } else {
      setMaxQuestions(0)
    }
  }, [selectedSubjects, selectedSubsections, examType, difficulty, questionType, year, fetchFilteredQuestions])

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
          "https://medical-backend-3eek.onrender.com/api/test/performance2",
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

  // Handler functions for recommended questions
  const handleRecommendationAdd = (recommendation: Recommendation) => {
    setSelectedRecommendations((prev) => [...prev, recommendation.questionText])

    const enhancedRecommendation = {
      ...recommendation,
      uniqueId: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    }

    setRecommendedQuestionsToAdd((current) => [...current, enhancedRecommendation])
  }

  const handleRecommendationRemove = (questionText: string) => {
    setSelectedRecommendations((prev) => prev.filter((id) => id !== questionText))
    setRecommendedQuestionsToAdd((current) => current.filter((q) => q.questionText !== questionText))
  }

  const validateForm = useCallback(() => {
    const newValidation: FormValidation = {
      subjects: { isValid: true, message: null },
      subsections: { isValid: true, message: null },
      questionCount: { isValid: true, message: null },
      overall: { isValid: false, message: "Please select subjects and subsections" },
    }

    const hasRecommendedQuestions = recommendedQuestionsToAdd.length > 0

    if (!hasRecommendedQuestions) {
      if (selectedSubjects.length === 0) {
        newValidation.subjects = {
          isValid: false,
          message: "Please select at least one subject",
        }
      }

      if (selectedSubsections.length === 0) {
        newValidation.subsections = {
          isValid: false,
          message: "Please select at least one subsection",
        }
      }
    }

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

    if (hasRecommendedQuestions) {
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
          selectedSubjects.length > 0 &&
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

  useEffect(() => {
    validateForm()
  }, [selectedSubjects, selectedSubsections, validateForm])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error(validation.overall.message || "Please correct the errors in the form")
      return
    }

    if (maxQuestions === 0 && recommendedQuestionsToAdd.length === 0) {
      toast.error("No questions available with the current selection")
      return
    }

    if (totalQuestions <= 0 && recommendedQuestionsToAdd.length === 0) {
      toast.error("Please select at least one question")
      return
    }

    try {
      const params = new URLSearchParams({
        mode,
        subjects: selectedSubjects.join(","),
        subsections: selectedSubsections.join(","),
        count: totalQuestions.toString(),
        exam_type: examType,
        difficulty: difficulty,
        question_type: questionType,
        year: year,
        targetExam: selectedExam || "",
        examDate: examDate || "",
      })

      if (recommendedQuestionsToAdd.length > 0) {
        params.append("hasRecommended", "true")
        params.append("recommendedQuestions", JSON.stringify(recommendedQuestionsToAdd))
      }

      params.append("t", Date.now().toString())

      router.push(`/dashboard/take-test?${params.toString()}`)
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error("An error occurred. Please try again.")
    }
  }

  useEffect(() => {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value

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

    const numericValue = Number.parseInt(rawValue, 10)

    if (numericValue < 1) {
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

  useEffect(() => {
    if (maxQuestions > 0) {
      if (totalQuestions > maxQuestions) {
        setTotalQuestions(maxQuestions)
        setInputValue(maxQuestions.toString())
      }
    }
  }, [maxQuestions, totalQuestions])

  const handleSelectAllSubjects = () => {
    if (selectedSubjects.length === subjects.length) {
      // Deselect all subjects and their subsections
      setSelectedSubjects([])
      setSelectedSubsections([])
    } else {
      // Select all subjects
      const allSubjectIds = subjects.map(subject => subject._id)
      setSelectedSubjects(allSubjectIds)
    }
    setError(null)
  }

  // Function to select/deselect all subsections for a specific subject
  const handleSelectAllSubsections = (subjectId: string) => {
    const subject = subjects.find(s => s._id === subjectId)
    if (!subject) return

    const subsectionIds = subject.subsections.map(ss => ss._id)

    // Check if all subsections of this subject are already selected
    const allSelected = subsectionIds.every(id => selectedSubsections.includes(id))

    if (allSelected) {
      // Deselect all subsections of this subject
      setSelectedSubsections(prev => prev.filter(id => !subsectionIds.includes(id)))
    } else {
      // Add all subsections of this subject
      // First ensure the subject itself is selected
      if (!selectedSubjects.includes(subjectId)) {
        setSelectedSubjects(prev => [...prev, subjectId])
      }

      // Then add all subsections not already selected
      setSelectedSubsections(prev => {
        const newIds = subsectionIds.filter(id => !prev.includes(id))
        return [...prev, ...newIds]
      })
    }

    setError(null)
  }

  return (
    <div className="h-screen mb-10">
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
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors duration-200 ${mode === "tutor" ? "bg-primary text-white shadow-md" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  onClick={() => setMode("tutor")}
                >
                  Tutor Mode
                </button>
                <button
                  type="button"
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors duration-200 ${mode === "timer" ? "bg-primary text-white shadow-md" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  onClick={() => setMode("timer")}
                >
                  Timer Mode
                </button>
              </div>
            </div>

            {/* Use the new RecommendedQuestions component */}
            <RecommendedQuestions
              mode={mode}
              selectedExam={selectedExam}
              examDate={examDate}
              onRecommendationAdd={handleRecommendationAdd}
              onRecommendationRemove={handleRecommendationRemove}
              selectedRecommendations={selectedRecommendations}
              recommendedQuestionsToAdd={recommendedQuestionsToAdd}
            />

            {/* Subjects section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold flex items-center text-gray-700">
                  <Book className="mr-2" size={24} />
                  Subjects
                </h2>
                <button
                  type="button"
                  onClick={handleSelectAllSubjects}
                  className="px-4 py-2 bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg text-sm font-medium hover:shadow-md transition-all duration-200 flex items-center gap-1"
                >
                  {selectedSubjects.length === subjects.length ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Deselect All Subjects
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                      Select All Subjects
                    </>
                  )}
                </button>
              </div>
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
                <div className="space-y-6">
                  {subjects
                    .filter((subject) => selectedSubjects.includes(subject._id))
                    .map((subject) => (
                      <div key={subject._id} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-lg font-semibold">{subject.name}</h3>
                          <button
                            type="button"
                            onClick={() => handleSelectAllSubsections(subject._id)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1"
                          >
                            {subject.subsections.every(ss => selectedSubsections.includes(ss._id)) ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Deselect All
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                </svg>
                                Select All
                              </>
                            )}
                          </button>
                        </div>
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

                  const numericValue = Number.parseInt(inputValue, 10)

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
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:outline-none transition-colors duration-200 ${maxQuestions === 0
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
                selectedSubsections.length === 0
              }
              className={`w-full py-3 px-6 rounded-lg text-lg font-semibold transition-colors duration-200 shadow-md ${isLoading ||
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
          <AITestSuggestions mode={mode} />
        </div>

        <div className="mb-8">
          <ExamSimulation />
        </div>

        <div className="mt-8 pb-60">
          <RecentTests performanceData={performanceData} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}