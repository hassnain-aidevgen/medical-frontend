"use client"

import axios from "axios"
import { Book, Brain, ChevronDown, ChevronUp, Clock, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import type React from "react"
import { useCallback, useEffect, useState } from "react"

interface Subject {
  _id: string
  name: string
  subsections: Subsection[]
  count: number
}

interface Subsection {
  _id: string
  name: string
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

const SystemCheckbox: React.FC<{
  subject: Subject
  selectedSubjects: string[]
  selectedItems: string[]
  onChange: (item: string) => void
}> = ({ subject, selectedSubjects, selectedItems, onChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const isSelected = selectedSubjects.includes(subject._id)

  if (!isSelected) return null

  return (
    <div className="mb-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <span className="text-sm font-medium text-gray-700">{subject.name}</span>
        {isOpen ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
      </div>
      {isOpen && subject.subsections.length > 0 && (
        <div className="pl-8 pr-3 pb-3 space-y-2">
          {subject.subsections.map((subsection) => (
            <label key={subsection._id} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedItems.includes(subsection._id)}
                onChange={() => onChange(subsection._id)}
                className="form-checkbox h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
              />
              <span className="ml-2 text-xs text-gray-600">{subsection.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CreateTest() {
  const router = useRouter()
  const [mode, setMode] = useState<"tutor" | "timer">("tutor")
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [selectedSystems, setSelectedSystems] = useState<string[]>([])
  const [totalQuestions, setTotalQuestions] = useState<number>(10)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [maxQuestions, setMaxQuestions] = useState(0)

  const API_BASE_URL = "https://medical-backend-loj4.onrender.com/api/test"

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data } = await axios.get(`${API_BASE_URL}/subjects`)
      console.log(data);
      setSubjects(data)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const newMaxQuestions = subjects
      .filter((subject) => selectedSubjects.includes(subject._id))
      .reduce((sum, subject) => sum + subject.count, 0)
    setMaxQuestions(newMaxQuestions)
    setTotalQuestions((prev) => Math.min(prev, newMaxQuestions))
  }, [selectedSubjects, subjects])

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId) ? prev.filter((s) => s !== subjectId) : [...prev, subjectId],
    )
    setSelectedSystems((prev) =>
      prev.filter((s) =>
        subjects.find(
          (subject) => selectedSubjects.includes(subject._id) && subject.subsections.some((sub) => sub._id === s),
        ),
      ),
    )
  }

  const handleSystemChange = (itemId: string) => {
    setSelectedSystems((prev) => (prev.includes(itemId) ? prev.filter((s) => s !== itemId) : [...prev, itemId]))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedSubjects.length === 0) {
      alert("Please select at least one subject.")
      return
    }
    const params = new URLSearchParams({
      mode: mode,
      subjects: selectedSubjects.join(","),
      systems: selectedSystems.join(","),
      count: totalQuestions.toString(),
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

            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-700">
                <Brain className="mr-2" size={24} />
                Systems
              </h2>
              <div className="space-y-2">
                {subjects.map((subject) => (
                  <SystemCheckbox
                    key={subject._id}
                    subject={subject}
                    selectedSubjects={selectedSubjects}
                    selectedItems={selectedSystems}
                    onChange={handleSystemChange}
                  />
                ))}
              </div>
            </div>

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
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="mt-2 text-sm text-gray-600">Maximum questions available: {maxQuestions}</p>
            </div>

            <button
              type="submit"
              disabled={isLoading || selectedSubjects.length === 0}
              className={`w-full py-3 px-6 rounded-lg text-lg font-semibold transition-colors duration-200 shadow-md ${isLoading || selectedSubjects.length === 0
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary-dark"
                }`}
            >
              {isLoading ? "Loading..." : "Generate Test"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

