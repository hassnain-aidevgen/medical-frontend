"use client"
import AdaptiveStudyTracker from "@/components/adaptive-study-tracker"
import CustomStudyScheduleGenerator from "@/components/custom-study-schedule-generator"
import ExamReadinessDashboard from "@/components/exam-readiness-dashboard"
import StudyPatternAnalyzer from "@/components/study-pattern-analyzer"
import SubjectPrioritization from "@/components/subject-prioritization"
import TopicDistributionAnalysis from "@/components/topic-distribution-analysis"
import axios from "axios"
import { BarChart3, BookOpen, Calendar, Clock, TrendingUp } from "lucide-react"
import type React from "react"
import { useCallback, useEffect, useState } from "react"
import toast, { Toaster } from "react-hot-toast"

// Define proper type for tests
interface Test {
  id: string
  name: string
  score: number
  date: string
  subjectName: string
  testTopic: string
  color: string
}

interface ExamInterfaceProps {
  tests: Test[]
  // New props to replace localStorage
  selectedExam?: string
  examDate?: string
  onExamChange?: (exam: string) => void
  onExamDateChange?: (date: string) => void
}

const ExamInterface = ({
  tests,
  selectedExam: propSelectedExam,
  examDate: propExamDate,
  onExamChange,
  onExamDateChange,
}: ExamInterfaceProps) => {
  const [userId, setUserId] = useState<string>("")
  // Exam selection state - use props if provided, otherwise use local state
  const [selectedExam, setSelectedExam] = useState<string>(propSelectedExam || "")
  // New states for exam date and countdown - use props if provided, otherwise use local state
  const [examDate, setExamDate] = useState<string>(propExamDate || "")
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)
  const availableExams = ["USMLE Step 1", "NEET", "PLAB", "MCAT", "NCLEX", "COMLEX"]
  interface Question {
    _id: string
    question?: string // ✅ Ensure this exists
    questionText: string
    options: string[]
    correctAnswer: string
    subject: string
    subsection: string
    difficulty: string
    explanation?: string
  }
  const [recommendedQuestions, setRecommendedQuestions] = useState<Question[]>([])
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)
  interface HighYieldTopic {
    topicName: string
    weightage: number
    questions: Question[]
  }

  interface HighYieldData {
    topics: HighYieldTopic[]
  }

  const [highYieldData, setHighYieldData] = useState<HighYieldData | null>(null)
  const [isLoadingHighYieldData, setIsLoadingHighYieldData] = useState(false)
  const [showHighYieldData, setShowHighYieldData] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("overview")

  // Update local state when props change
  useEffect(() => {
    if (propSelectedExam !== undefined) {
      setSelectedExam(propSelectedExam)
    }
  }, [propSelectedExam])

  useEffect(() => {
    if (propExamDate !== undefined) {
      setExamDate(propExamDate)
    }
  }, [propExamDate])

  // Calculate days remaining until exam - using useCallback to memoize
  const calculateDaysRemaining = useCallback(() => {
    if (!examDate) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const targetDate = new Date(examDate)
    targetDate.setHours(0, 0, 0, 0)

    const timeDiff = targetDate.getTime() - today.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))

    return daysDiff >= 0 ? daysDiff : null
  }, [examDate]) // Include examDate in the dependency array

  // Effect for countdown timer
  useEffect(() => {
    // Initial calculation
    setDaysRemaining(calculateDaysRemaining())

    // Set up interval for real-time updates
    const intervalId = setInterval(() => {
      setDaysRemaining(calculateDaysRemaining())
    }, 60000) // Update every minute

    return () => clearInterval(intervalId)
  }, [calculateDaysRemaining]) // Added calculateDaysRemaining to the dependency array

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedData = localStorage.getItem("Medical_User_Id")
      setUserId(storedData || "")

      // Only load from localStorage if props are not provided
      if (propSelectedExam === undefined) {
        const savedExam = localStorage.getItem("selectedExam")
        if (savedExam) {
          setSelectedExam(savedExam)
        }
      }

      if (propExamDate === undefined) {
        const savedExamDate = localStorage.getItem("examDate")
        if (savedExamDate) {
          setExamDate(savedExamDate)
        }
      }
    }
  }, [propSelectedExam, propExamDate])

  // Get exam-specific subjects mapping
  const getExamSubjects = useCallback((exam: string) => {
    // This mapping would ideally come from your backend
    // For now, we'll use a simple mapping for demonstration
    const examSubjectsMap: Record<string, string[]> = {
      "USMLE Step 1": ["Anatomy", "Physiology", "Biochemistry", "Pharmacology", "Pathology"],
      NEET: ["Physics", "Chemistry", "Biology", "Zoology", "Botany"],
      PLAB: ["Clinical Medicine", "Surgery", "Obstetrics", "Gynecology", "Psychiatry"],
      MCAT: ["Biology", "Chemistry", "Physics", "Psychology"],
      NCLEX: ["Fundamentals", "Medical-Surgical", "Pharmacology", "Maternal Newborn", "Pediatrics"],
      COMLEX: ["Osteopathic Principles", "Anatomy", "Microbiology", "Pathology", "Pharmacology"],
    }

    return examSubjectsMap[exam] || []
  }, [])

  // Get related subjects for an exam
  const getRelatedSubjects = useCallback((exam: string) => {
    // This would also ideally come from your backend
    // For demonstration, we'll use a simple mapping
    const relatedSubjectsMap: Record<string, string[]> = {
      "USMLE Step 1": ["Microbiology", "Immunology", "Neuroscience", "Behavioral Science"],
      NEET: ["Organic Chemistry", "Inorganic Chemistry", "Human Physiology", "Genetics"],
      PLAB: ["Emergency Medicine", "Pediatrics", "Dermatology", "Public Health"],
      MCAT: ["Biochemistry", "Organic Chemistry", "Sociology", "Statistics"],
      NCLEX: ["Critical Care", "Community Health", "Leadership", "Mental Health"],
      COMLEX: ["OMT", "Clinical Applications", "Ethics", "Biostatistics"],
    }

    return relatedSubjectsMap[exam] || []
  }, [])

  // Function to generate mock questions for fallback
  const generateMockQuestions = useCallback(
    (exam: string, count: number): Question[] => {
      const examSubjects = getExamSubjects(exam)
      const relatedSubjects = getRelatedSubjects(exam)
      // const allSubjects = [...examSubjects, ...relatedSubjects];

      const mockQuestions: Question[] = []

      for (let i = 0; i < count; i++) {
        const isExamSpecific = i < Math.floor(count * 0.8)
        const subjects = isExamSpecific ? examSubjects : relatedSubjects
        const subject = subjects[Math.floor(Math.random() * subjects.length)] || "General"

        mockQuestions.push({
          _id: `mock-${exam}-${i}`,
          questionText: `Sample ${isExamSpecific ? "exam-specific" : "related subject"} question about ${subject} for ${exam} preparation.`,
          options: [
            "Sample answer option A",
            "Sample answer option B",
            "Sample answer option C",
            "Sample answer option D",
          ],
          correctAnswer: "Sample answer option A",
          subject: subject,
          subsection: `${subject} Fundamentals`,
          difficulty: ["Easy", "Medium", "Hard"][Math.floor(Math.random() * 3)],
        })
      }

      return mockQuestions
    },
    [getExamSubjects, getRelatedSubjects],
  )

  // Function to generate mock high-yield data
  const generateMockHighYieldData = useCallback(
    (exam: string): HighYieldData => {
      const examSpecificSubjects = getExamSubjects(exam)
      const topics: HighYieldTopic[] = []

      // Create weightage distribution that adds up to 100
      let remainingWeight = 100
      for (let i = 0; i < examSpecificSubjects.length; i++) {
        const subject = examSpecificSubjects[i]

        // For the last subject, use the remaining weight
        const isLastSubject = i === examSpecificSubjects.length - 1

        // Generate a random weightage between 10 and 30, or the remaining weight for the last subject
        const weightage = isLastSubject
          ? remainingWeight
          : Math.min(Math.floor(Math.random() * 20) + 10, remainingWeight - 5)

        remainingWeight -= weightage

        // Generate 1-3 sample questions for this topic
        const questionCount = Math.floor(Math.random() * 3) + 1
        const questions = generateMockQuestions(exam, questionCount).map((q) => ({
          ...q,
          subject: subject,
        }))

        topics.push({
          topicName: subject,
          weightage: weightage,
          questions: questions,
        })
      }

      // Sort topics by weightage (descending)
      topics.sort((a, b) => b.weightage - a.weightage)

      return { topics }
    },
    [getExamSubjects, generateMockQuestions],
  )

  // Function to fetch recommended questions using the 80/20 rule
  const fetchRecommendedQuestions = useCallback(async () => {
    if (!selectedExam || !userId) {
      return
    }

    setIsLoadingQuestions(true)

    try {
      // Calculate number of questions for 80/20 split
      const totalQuestions = 10 // Total questions to show
      const examSpecificCount = Math.floor(totalQuestions * 0.8) // 80%
      const relatedSubjectsCount = totalQuestions - examSpecificCount // 20%

      // Get subject lists for the selected exam
      const examSubjects = getExamSubjects(selectedExam)
      const relatedSubjects = getRelatedSubjects(selectedExam)

      console.log("Fetching exam subjects:", examSubjects)
      console.log("Fetching related subjects:", relatedSubjects)

      // Add fallback mechanism - if API fails, use local mock data
      let combinedQuestions = []

      try {
        // First try with the API
        // Fetch exam-specific questions (80%)
        const examSpecificResponse = await axios.get(
          "https://medical-backend-loj4.onrender.com/api/test/take-test/questions-fixed",
          {
            params: {
              subjects: examSubjects.join(","),
              count: examSpecificCount,
            },
          },
        )

        // Fetch related subjects questions (20%)
        const relatedSubjectsResponse = await axios.get(
          "https://medical-backend-loj4.onrender.com/api/test/take-test/questions-fixed",
          {
            params: {
              subjects: relatedSubjects.join(","),
              count: relatedSubjectsCount,
            },
          },
        )

        // Combine both sets of questions
        combinedQuestions = [...examSpecificResponse.data, ...relatedSubjectsResponse.data]
      } catch (apiError) {
        console.error("API Error:", apiError)
        // If API fails, use mock data
        combinedQuestions = generateMockQuestions(selectedExam, totalQuestions)
        toast("Using sample questions due to API connectivity issues.")
      }

      // Shuffle the array to mix exam-specific and related questions
      const shuffledQuestions = combinedQuestions.sort(() => Math.random() - 0.5)

      setRecommendedQuestions(shuffledQuestions)
    } catch (error) {
      console.error("Error fetching recommended questions:", error)
      toast.error("Failed to load recommended questions. Please try again later.")

      // Fallback to mock data if overall process fails
      const mockQuestions = generateMockQuestions(selectedExam, 10)
      setRecommendedQuestions(mockQuestions)
      toast("Showing sample questions due to technical issues.")
    } finally {
      setIsLoadingQuestions(false)
    }
  }, [selectedExam, userId, getExamSubjects, getRelatedSubjects, generateMockQuestions])

  // Function to fetch high-yield data
  const fetchHighYieldData = useCallback(async () => {
    if (!selectedExam || !userId) {
      return
    }

    setIsLoadingHighYieldData(true)

    try {
      // Try to fetch from the backend
      try {
        const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/questions/high-yield`, {
          params: {
            exam: selectedExam,
            userId: userId,
          },
        })

        setHighYieldData(response.data)
      } catch (apiError) {
        console.error("API Error for high-yield data:", apiError)
        // If API fails, use mock data
        const mockData = generateMockHighYieldData(selectedExam)
        setHighYieldData(mockData)
        toast("Using sample high-yield data due to API connectivity issues.")
      }
    } catch (error) {
      console.error("Error fetching high-yield data:", error)
      toast.error("Failed to load high-yield recommendations. Please try again later.")

      // Fallback to mock data
      const mockData = generateMockHighYieldData(selectedExam)
      setHighYieldData(mockData)
    } finally {
      setIsLoadingHighYieldData(false)
    }
  }, [selectedExam, userId, generateMockHighYieldData])

  // Effect to fetch recommended questions when exam changes
  useEffect(() => {
    if (selectedExam) {
      fetchRecommendedQuestions()
      fetchHighYieldData()
    }
  }, [selectedExam, fetchRecommendedQuestions, fetchHighYieldData]) // Added missing dependencies

  // Handle exam selection change
  const handleExamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newExam = e.target.value
    setSelectedExam(newExam)

    // Call the prop callback if provided
    if (onExamChange) {
      onExamChange(newExam)
    }

    // Save to localStorage as fallback
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedExam", newExam)
    }
  }

  // Handle exam date change
  const handleExamDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    setExamDate(newDate)

    // Call the prop callback if provided
    if (onExamDateChange) {
      onExamDateChange(newDate)
    }

    // Save to localStorage as fallback
    if (typeof window !== "undefined") {
      localStorage.setItem("examDate", newDate)
    }
  }

  return (
    <div className="container mx-auto py-4">
      <Toaster position="top-right" />

      {/* Exam Selection and Countdown Section - Redesigned */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">Target Exam Selection</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exam Selection - Left Column */}
          <div className="bg-blue-50 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BookOpen className="mr-2 text-blue-600" size={20} />
              Select Your Exam
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="examSelect" className="block text-sm font-medium text-gray-700 mb-1">
                  Target Exam:
                </label>
                <select
                  id="examSelect"
                  value={selectedExam}
                  onChange={handleExamChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Select an Exam --</option>
                  {availableExams.map((exam) => (
                    <option key={exam} value={exam}>
                      {exam}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="examDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Exam Date:
                </label>
                <input
                  type="date"
                  id="examDate"
                  value={examDate}
                  onChange={handleExamDateChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                />
              </div>
            </div>
          </div>

          {/* Countdown Timer - Middle Column */}
          <div className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-5 text-white">
            {selectedExam && examDate && daysRemaining !== null ? (
              <div className="text-center">
                <div className="text-6xl font-bold">{daysRemaining}</div>
                <div className="mt-2 text-xl">{daysRemaining === 1 ? "day" : "days"} remaining</div>
                <div className="mt-1 text-sm opacity-80">until {selectedExam}</div>
                <div className="mt-3 text-xs bg-white/20 rounded-full px-3 py-1 inline-block">
                  {new Date(examDate).toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Clock size={48} className="mx-auto mb-3 opacity-80" />
                <p className="text-lg">
                  {selectedExam ? "Set your exam date to see countdown" : "Select an exam and set a date"}
                </p>
              </div>
            )}
          </div>

          {/* Exam Info - Right Column */}
          <div className="bg-gray-50 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Calendar className="mr-2 text-blue-600" size={20} />
              Exam Information
            </h3>

            {selectedExam ? (
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-700">Selected Exam:</h4>
                  <p className="text-blue-700 font-semibold">{selectedExam}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700">Core Subjects:</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {getExamSubjects(selectedExam).map((subject) => (
                      <span key={subject} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>

                {examDate && (
                  <div>
                    <h4 className="font-medium text-gray-700">Scheduled For:</h4>
                    <p>{new Date(examDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>Select an exam to see details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation for Content Sections */}
      <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
        <div className="flex overflow-x-auto border-b scrollbar-hide">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
              activeTab === "overview"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            Overview & Questions
          </button>
          <button
            onClick={() => setActiveTab("highYield")}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
              activeTab === "highYield"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            High-Yield Topics
          </button>
          <button
            onClick={() => setActiveTab("analysis")}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
              activeTab === "analysis"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            Topic Analysis
          </button>
          <button
            onClick={() => setActiveTab("readiness")}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
              activeTab === "readiness"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            Exam Readiness
          </button>
          <button
            onClick={() => setActiveTab("planning")}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
              activeTab === "planning"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            Study Planning
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview & Questions Tab */}
          {activeTab === "overview" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Recommended Practice Questions</h2>
                <button
                  onClick={() => {
                    setShowQuestions(!showQuestions)
                    if (!showQuestions && recommendedQuestions.length === 0) {
                      fetchRecommendedQuestions()
                    }
                  }}
                  className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors flex items-center"
                >
                  <BookOpen size={20} className="mr-2" />
                  {showQuestions ? "Hide Questions" : "Show Questions"}
                </button>
              </div>

              {showQuestions && (
                <div>
                  {isLoadingQuestions ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-pulse text-blue-500">Loading recommended questions...</div>
                    </div>
                  ) : recommendedQuestions.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 mb-4">
                        Based on your target exam ({selectedExam}), we&apos;ve curated a set of practice questions. 80%
                        are from core exam topics, and 20% from related subjects to strengthen your knowledge.
                      </p>
                      {recommendedQuestions.map((question, index) => (
                        <div key={question._id} className="border rounded-lg p-4 hover:bg-blue-50 transition-colors">
                          <div className="flex justify-between">
                            <h3 className="font-medium mb-2">Question {index + 1}</h3>
                          </div>
                          <p className="mb-3">
                            {" "}
                            {question.question || question.questionText || "No question available"}
                          </p>
                          {question.options && (
                            <ul className="space-y-2">
                              {question.options.map((option, optIndex) => (
                                <li key={optIndex} className="flex items-start">
                                  <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full border mr-2">
                                    {String.fromCharCode(65 + optIndex)}
                                  </div>
                                  <span>{option}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p>No recommended questions available for {selectedExam}.</p>
                      <button
                        onClick={fetchRecommendedQuestions}
                        className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
                      >
                        Refresh Questions
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* High-Yield Topics Tab */}
          {activeTab === "highYield" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <TrendingUp size={24} className="text-blue-600 mr-2" />
                  <h2 className="text-xl font-semibold">High-Yield Topics for {selectedExam || "Your Exam"}</h2>
                </div>
                <button
                  onClick={() => {
                    setShowHighYieldData(!showHighYieldData)
                    if (!showHighYieldData && (!highYieldData || highYieldData.topics.length === 0)) {
                      fetchHighYieldData()
                    }
                  }}
                  className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors flex items-center"
                >
                  <BarChart3 size={20} className="mr-2" />
                  {showHighYieldData ? "Hide Topics" : "Show High-Yield Topics"}
                </button>
              </div>

              {showHighYieldData && (
                <div>
                  {isLoadingHighYieldData ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-pulse text-blue-500">Loading high-yield content...</div>
                    </div>
                  ) : highYieldData && highYieldData.topics.length > 0 ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-4">
                        Based on historical exam data, these topics are weighted higher for {selectedExam}. Focus your
                        study time on these high-yield areas for maximum efficiency.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left column - Topic Weightage Chart */}
                        <div className="space-y-4">
                          <h3 className="font-medium text-gray-800">Topic Weightage</h3>
                          {highYieldData.topics.map((topic) => (
                            <div
                              key={topic.topicName}
                              className="border rounded-lg p-3 hover:bg-blue-50 transition-colors"
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium">{topic.topicName}</span>
                                <span className="text-blue-600 font-bold">{topic.weightage}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="bg-blue-600 h-2.5 rounded-full"
                                  style={{ width: `${topic.weightage}%` }}
                                ></div>
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                {topic.questions.length} {topic.questions.length === 1 ? "question" : "questions"}{" "}
                                available
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Right column - Sample Questions */}
                        <div>
                          <h3 className="font-medium text-gray-800 mb-4">Questions from High-Yield Topics</h3>
                          {highYieldData.topics.slice(0, 3).map(
                            (topic) =>
                              topic.questions.length > 0 && (
                                <div
                                  key={`sample-${topic.topicName}`}
                                  className="mb-4 border-l-4 border-blue-500 pl-3 py-1"
                                >
                                  <div className="font-medium text-blue-700">{topic.topicName}</div>
                                  <p className="my-2">
                                    {topic.questions[0].question || topic.questions[0].questionText}
                                  </p>
                                  <div className="text-xs text-blue-600 mt-1 cursor-pointer hover:underline">
                                    View more {topic.topicName} questions →
                                  </div>
                                </div>
                              ),
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p>No high-yield data available for {selectedExam || "this exam"}.</p>
                      <button
                        onClick={fetchHighYieldData}
                        className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
                      >
                        Refresh Data
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Topic Analysis Tab */}
          {activeTab === "analysis" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Topic Distribution Analysis</h2>
              <TopicDistributionAnalysis selectedExam={selectedExam} tests={tests} />
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Study Pattern Analysis</h2>
                <StudyPatternAnalyzer selectedExam={selectedExam} tests={tests} />
              </div>
            </div>
          )}

          {/* Exam Readiness Tab */}
          {activeTab === "readiness" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Exam Readiness Dashboard</h2>
              <ExamReadinessDashboard selectedExam={selectedExam} userId={userId} examDate={examDate} />
            </div>
          )}

          {/* Study Planning Tab */}
          {activeTab === "planning" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Subject Prioritization</h2>
                <SubjectPrioritization selectedExam={selectedExam} userId={userId} examDate={examDate} />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-4">Custom Study Schedule Generator</h2>
                <CustomStudyScheduleGenerator selectedExam={selectedExam} examDate={examDate} userId={userId} />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-4">Adaptive Study Tracker</h2>
                <AdaptiveStudyTracker selectedExam={selectedExam} examDate={examDate} userId={userId} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExamInterface
