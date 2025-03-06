"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import axios from "axios"
import { Book, Brain, Clock, Lightbulb } from "lucide-react"
import { useRouter } from "next/navigation"
import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { toast, Toaster } from "react-hot-toast"

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
}

interface Recommendation {
  questionText: string
  correctAnswer: string
  topic: string
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
  // const [questions, setQuestions] = useState<Question[]>([])
  const [examType, setExamType] = useState<"USMLE_STEP1" | "USMLE_STEP2" | "USMLE_STEP3">("USMLE_STEP1")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [questionType, setQuestionType] = useState<"case_based" | "single_best_answer" | "extended_matching">(
    "single_best_answer",
  )
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
  const [selectedRecommendations] = useState<string[]>([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  const [showRecommendations, setShowRecommendations] = useState(false)

  // Add this new state to track if recommendations are being added to the test
  const [recommendedQuestionsToAdd] = useState<Recommendation[]>([])
  const availableSubsections = subjects.reduce((acc: Subsection[], subject: Subject) => {
    if (selectedSubjects.includes(subject._id)) {
      return [...acc, ...subject.subsections]
    }
    return acc
  }, [])

  // Use environment variable or fallback to a relative path for API
  const API_BASE_URL = "https://medical-backend-loj4.onrender.com/api/test/create-test"

  // Replace the fetchRecommendations function with this enhanced version
  const fetchRecommendations = useCallback(async () => {
    setIsLoadingRecommendations(true)
    try {
      const userId = localStorage.getItem("Medical_User_Id")
      if (!userId) {
        console.log("No user ID found in localStorage")
        return
      }

      const { data } = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/recommendations/${userId}`)
      setRecommendations(data.recommendations)

      // If we got recommendations, show the section
      if (data.recommendations && data.recommendations.length > 0) {
        setShowRecommendations(true)
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error)
    } finally {
      setIsLoadingRecommendations(false)
    }
  }, [])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data } = await axios.get(`${API_BASE_URL}/subjects`)
      setSubjects(data)
    } catch (error) {
      console.error("Error fetching subjects:", error)
      setError("Failed to load subjects. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [API_BASE_URL])

  // Replace the fetchFilteredQuestions callback with this updated version
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
  }, [API_BASE_URL, selectedSubjects, selectedSubsections, examType, difficulty, questionType, totalQuestions])

  useEffect(() => {
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
  }, [selectedSubjects, selectedSubsections, examType, difficulty, questionType, fetchFilteredQuestions])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  // Replace the addRecommendedQuestion function with this enhanced version
  // const addRecommendedQuestion = (recommendation: Recommendation) => {
  //   // Check if already selected
  //   if (selectedRecommendations.includes(recommendation.questionText)) {
  //     // Remove from selected
  //     setSelectedRecommendations((prev) => prev.filter((text) => text !== recommendation.questionText))
  //     setRecommendedQuestionsToAdd((prev) => prev.filter((rec) => rec.questionText !== recommendation.questionText))

  //     // Show feedback
  //     toast.success("Recommendation removed from your test")
  //   } else {
  //     // Add to selected
  //     setSelectedRecommendations((prev) => [...prev, recommendation.questionText])
  //     setRecommendedQuestionsToAdd((prev) => [...prev, recommendation])

  //     // Show feedback
  //     toast.success("Recommendation added to your test!")
  //   }
  // }

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

  const handleFilterChange = <T extends string>(value: T, setter: React.Dispatch<React.SetStateAction<T>>) => {
    setter(value)
    setError(null)
  }

  // Add this new validateForm function
  const validateForm = useCallback(() => {
    const newValidation: FormValidation = {
      subjects: { isValid: true, message: null },
      subsections: { isValid: true, message: null },
      questionCount: { isValid: true, message: null },
      overall: { isValid: true, message: null },
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
          newValidation.subjects.isValid && newValidation.subsections.isValid && newValidation.questionCount.isValid,
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

  // Replace the handleSubmit function with this enhanced version
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

    // Create URL parameters
    const params = new URLSearchParams({
      mode,
      subjects: selectedSubjects.join(","),
      subsections: selectedSubsections.join(","),
      count: totalQuestions.toString(),
      exam_type: examType,
      difficulty: difficulty,
      question_type: questionType,
    })

    // Add recommended questions if any
    if (recommendedQuestionsToAdd.length > 0) {
      params.append("recommendedQuestions", JSON.stringify(recommendedQuestionsToAdd))
    }

    router.push(`/dashboard/take-test?${params.toString()}`)
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
    <div className="max-h-[85dvh] overflow-y-auto overflow-x-hidden bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8 rounded-md border border-slate-200">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Create Your Test</h1>
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

            {/* Replace the Recommended Questions section with this enhanced version */}
            {showRecommendations && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-700">
                  <Lightbulb className="mr-2" size={24} />
                  Recommended Questions
                </h2>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <p className="text-sm text-amber-800 mb-4">
                    Based on your previous tests, we recommend focusing on these topics:
                  </p>

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
                            {/* <button
                              type="button"
                              onClick={() => addRecommendedQuestion(recommendation)}
                              className={`ml-2 px-3 py-1 text-xs font-medium rounded-full transition-colors ${selectedRecommendations.includes(recommendation.questionText)
                                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                                  : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                }`}
                            >
                              {selectedRecommendations.includes(recommendation.questionText)
                                ? "Added ✓"
                                : "Add to Test"}
                            </button> */}
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

            {/* Filters section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">Exam Type</h2>
                <Select
                  value={examType}
                  onValueChange={(value: typeof examType) => handleFilterChange(value, setExamType)}
                  disabled={isFilterLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USMLE_STEP1">USMLE STEP 1</SelectItem>
                    <SelectItem value="USMLE_STEP2">USMLE STEP 2</SelectItem>
                    <SelectItem value="USMLE_STEP3">USMLE STEP 3</SelectItem>
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
                    <SelectItem value="case_based">Case Based</SelectItem>
                    <SelectItem value="single_best_answer">Single Best Answer</SelectItem>
                    <SelectItem value="extended_matching">Extended Matching</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                {error && <p className="text-sm text-red-500">{error}</p>}
                {isFilterLoading && <p className="text-sm text-blue-500">Updating available questions...</p>}
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={
                isLoading || isFilterLoading || (!validation.overall.isValid && recommendedQuestionsToAdd.length === 0)
              }
              className={`w-full py-3 px-6 rounded-lg text-lg font-semibold transition-colors duration-200 shadow-md ${isLoading || isFilterLoading || (!validation.overall.isValid && recommendedQuestionsToAdd.length === 0)
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary-dark"
                }`}
            >
              {isLoading || isFilterLoading ? "Loading..." : "Generate Test"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
