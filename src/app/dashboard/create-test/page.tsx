"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import axios from "axios"
import { Book, Brain, Clock, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import type React from "react"
import { useCallback, useEffect, useState } from "react"

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
  subject: string
  subsection: string
  system: string
  exam_type: "USMLE_STEP1" | "USMLE_STEP2" | "USMLE_STEP3"
  difficulty: "easy" | "medium" | "hard"
  question_type: "case_based" | "single_best_answer" | "extended_matching"
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
  const [questions, setQuestions] = useState<Question[]>([])
  const [examType, setExamType] = useState<"USMLE_STEP1" | "USMLE_STEP2" | "USMLE_STEP3">("USMLE_STEP1")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [questionType, setQuestionType] = useState<"case_based" | "single_best_answer" | "extended_matching">(
    "single_best_answer",
  )
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = "https://medical-backend-loj4.onrender.com/api/test/create-test"

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
  }, [])

  const fetchFilteredQuestions = useCallback(async () => {
    if (selectedSubjects.length === 0 || selectedSubsections.length === 0) {
      setQuestions([])
      setMaxQuestions(0)
      console.log(questions);
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

      setQuestions(data.questions)
      setMaxQuestions(data.count)

      // Adjust totalQuestions if it exceeds the new maximum
      setTotalQuestions((prev) => Math.min(prev, data.count || 1))

      if (data.count === 0) {
        setError("No questions available with the selected filters. Try adjusting your criteria.")
      }
    } catch (error) {
      console.error("Error fetching filtered questions:", error)
      setError("Failed to load questions. Please try again.")
      setQuestions([])
      setMaxQuestions(0)
      setTotalQuestions(1)
    } finally {
      setIsFilterLoading(false)
    }
  }, [selectedSubjects, selectedSubsections, examType, difficulty, questionType])

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
    }
  }, [selectedSubjects, selectedSubsections, fetchFilteredQuestions])

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId) ? prev.filter((s) => s !== subjectId) : [...prev, subjectId],
    )
    setSelectedSubsections([])
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
    if (selectedSubjects.length > 0 && selectedSubsections.length > 0) {
      setTotalQuestions(1)
      fetchFilteredQuestions()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedSubjects.length === 0 || selectedSubsections.length === 0) {
      setError("Please select at least one subject and one subsection.")
      return
    }
    if (maxQuestions === 0) {
      setError("No questions available with the current selection.")
      return
    }
    const params = new URLSearchParams({
      mode,
      subjects: selectedSubjects.join(","),
      subsections: selectedSubsections.join(","),
      count: totalQuestions.toString(),
      exam_type: examType,
      difficulty: difficulty,
      question_type: questionType,
    })
    router.push(`/dashboard/take-test?${params.toString()}`)
  }

  return (
    <div className="max-h-[85dvh] overflow-y-auto overflow-x-hidden bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8 rounded-md border border-slate-200">
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
            </div>

            {/* Subsections section */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-700">
                <Brain className="mr-2" size={24} />
                Subsections
              </h2>
              <div className="space-y-2">
                {subjects
                  .filter((subject) => selectedSubjects.includes(subject._id))
                  .map((subject) => (
                    <div key={subject._id}>
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
            </div>

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
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-700">
                <FileText className="mr-2" size={24} />
                Total Questions
              </h2>
              <input
                type="number"
                min="1"
                max={maxQuestions}
                value={totalQuestions}
                onChange={(e) => {
                  const value = Math.min(Number(e.target.value), maxQuestions)
                  setTotalQuestions(value)
                  if (e.target.value.startsWith("0")) {
                    e.target.value = value.toString()
                  }
                }}
                disabled={isFilterLoading}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">Maximum questions available: {maxQuestions}</p>
                {error && <p className="text-sm text-red-500">{error}</p>}
                {isFilterLoading && <p className="text-sm text-blue-500">Updating available questions...</p>}
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={
                isLoading ||
                isFilterLoading ||
                selectedSubjects.length === 0 ||
                selectedSubsections.length === 0 ||
                maxQuestions === 0
              }
              className={`w-full py-3 px-6 rounded-lg text-lg font-semibold transition-colors duration-200 shadow-md ${isLoading ||
                isFilterLoading ||
                selectedSubjects.length === 0 ||
                selectedSubsections.length === 0 ||
                maxQuestions === 0
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

