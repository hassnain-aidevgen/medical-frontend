"use client"

import axios from "axios"
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Flame,
  ListChecks,
  PlayCircle,
  RefreshCw,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"

// Add this style to the component
const highlightStyle = `
  @keyframes highlight-pulse {
    0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
    100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
  }
  
  .highlight-animation {
    animation: highlight-pulse 1s ease-in-out 2;
  }
`

// Define interfaces
interface CalendarTest {
  _id?: string
  subjectName: string
  testTopic: string
  date: string
  color: string
  completed?: boolean
}

interface Question {
  _id: string
  questionText: string
  subject: string
  difficulty: string
}

interface MockExam {
  _id: string
  title: string
  duration: number
  questionCount: number
}

interface TodayItem {
  id: string
  type: "test" | "review" | "question" | "simulation"
  title: string
  subject: string
  description?: string
  color: string
  completed?: boolean
  data?: CalendarTest | Question | MockExam | null // Original data object
}

interface TodayDashboardProps {
  tests?: CalendarTest[]
  onTestComplete?: (testId: string, completed: boolean) => void
  onRefresh?: () => void
}

const TodayDashboard = ({ tests = [], onTestComplete, onRefresh }: TodayDashboardProps) => {
  const [userId, setUserId] = useState<string>("")
  const [selectedExam, setSelectedExam] = useState<string>("")
  const [todayItems, setTodayItems] = useState<TodayItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    tests: 0,
    reviews: 0,
    questions: 0,
    simulations: 0,
  })

  // Fetch user ID and selected exam from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("Medical_User_Id")
      const storedExam = localStorage.getItem("selectedExam")

      setUserId(storedUserId || "")
      setSelectedExam(storedExam || "")
    }
  }, [])

  // Get today's date at midnight for comparison
  const getTodayDate = useCallback(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  }, [])

  // Add this function after the getTodayDate function to generate mock tests when none are provided
  const generateMockTests = useCallback((): CalendarTest[] => {
    // Only generate mock tests if no real tests are provided
    if (tests.length > 0) return []

    console.log("Generating mock tests since none were provided")

    // Get today's date in ISO format for the mock tests
    const today = new Date()
    const todayISO = today.toISOString().split("T")[0]

    // Generate 2 mock tests for today
    return [
      {
        _id: `mock-test-${Date.now()}-1`,
        subjectName: "Cardiology",
        testTopic: "Heart Anatomy Test",
        date: todayISO,
        color: "#3B82F6", // Blue
        completed: false,
      },
      {
        _id: `mock-test-${Date.now()}-2`,
        subjectName: "Neurology",
        testTopic: "Brain Function Review",
        date: todayISO,
        color: "#FACC15", // Yellow
        completed: false,
      },
    ]
  }, [tests])

  // Format date for display
  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    })
  }, [])

  // Fetch recommended questions for today
  const fetchTodayQuestions = useCallback(async (): Promise<TodayItem[]> => {
    if (!userId || !selectedExam) return []

    try {
      // Try to fetch from API
      try {
        const response = await axios.get(`https://medical-backend-3eek.onrender.com/api/test/daily-challenge`, {
          params: {
            userId,
            exam: selectedExam,
            count: 3, // Limit to 3 questions for today
          },
        })

        if (response.data && Array.isArray(response.data)) {
          return response.data.map((question: Question) => ({
            id: question._id,
            type: "question",
            title: `${question.difficulty} Question`,
            subject: question.subject,
            description: question.questionText.substring(0, 60) + "...",
            color: "#10B981", // Green
            data: question,
          }))
        }
      } catch (error) {
        console.log("API error, using mock data:", error)
      }

      // Generate mock data if API fails
      return [
        {
          id: `question-${Date.now()}-1`,
          type: "question",
          title: "Daily Practice Question",
          subject: selectedExam === "MCAT" ? "Biology" : "Anatomy",
          description: "Practice question based on your recent study topics...",
          color: "#10B981", // Green
          data: null,
        },
      ]
    } catch (error) {
      console.error("Error fetching today's questions:", error)
      return []
    }
  }, [userId, selectedExam])

  // Fetch mock exams scheduled for today
  const fetchTodaySimulations = useCallback(async (): Promise<TodayItem[]> => {
    if (!userId || !selectedExam) return []

    try {
      // Try to fetch from API
      try {
        const response = await axios.get(`https://medical-backend-3eek.onrender.com/api/test/daily-challenge`, {
          params: {
            userId,
            exam: selectedExam,
            date: new Date().toISOString().split("T")[0],
          },
        })

        if (response.data && Array.isArray(response.data)) {
          return response.data.map((exam: MockExam) => ({
            id: exam._id,
            type: "simulation",
            title: exam.title,
            subject: selectedExam,
            description: `${exam.questionCount} questions · ${exam.duration} minutes`,
            color: "#3B82F6", // Blue
            data: exam,
          }))
        }
      } catch (error) {
        console.log("API error, using mock data:", error)
      }

      // If no simulations are scheduled or API fails, return empty array
      // Only generate mock data if exam is selected
      if (selectedExam) {
        return [
          {
            id: `simulation-${Date.now()}`,
            type: "simulation",
            title: `${selectedExam} Practice Simulation`,
            subject: selectedExam,
            description: "8 questions · 10 minutes",
            color: "#3B82F6", // Blue
            data: null,
          },
        ]
      }

      return []
    } catch (error) {
      console.error("Error fetching today's simulations:", error)
      return []
    }
  }, [userId, selectedExam])

  // Process calendar tests to find today's items
  const processTodayTests = useCallback(
    (tests: CalendarTest[]): TodayItem[] => {
      const today = getTodayDate()

      // Debug: Log the tests array and today's date
      console.log("Processing tests:", tests)
      console.log("Today's date:", today.toISOString())

      // Filter tests for today
      const todayTests = tests.filter((test) => {
        if (!test.date) {
          console.log("Test missing date:", test)
          return false
        }

        const testDate = new Date(test.date)
        testDate.setHours(0, 0, 0, 0)

        // Debug: Log each test date for comparison
        console.log(
          `Test date: ${test.date}, ISO: ${testDate.toISOString()}, Match: ${testDate.getTime() === today.getTime()}`,
        )

        return testDate.getTime() === today.getTime()
      })

      console.log("Today's tests after filtering:", todayTests)

      // Map filtered tests to TodayItem format
      return todayTests.map((test) => {
        const isReview = test.testTopic.includes("Review")
        const item: TodayItem = {
          id: test._id || `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: isReview ? "review" : "test" as "review" | "test",
          title: test.testTopic,
          subject: test.subjectName,
          color: isReview ? "#FACC15" : test.color,
          completed: test.completed,
          data: test,
        }

        // Debug: Log each processed item
        console.log("Processed test item:", item)

        return item
      })
    },
    [getTodayDate],
  )

  // Modify the loadTodayItems function to use mock tests when needed
  const loadTodayItems = useCallback(async () => {
    setIsLoading(true)

    try {
      // Debug: Log the tests prop
      console.log("Tests prop received:", tests)

      // Generate mock tests if none are provided
      const mockTests = generateMockTests()
      const allTests = [...tests, ...mockTests]

      console.log("Tests after adding mocks:", allTests)

      // Process tests from props + mocks
      const todayTests = processTodayTests(allTests)

      // Debug: Log the processed today's tests
      console.log("Today's tests after processing:", todayTests)

      // Fetch questions and simulations
      const [questions, simulations] = await Promise.all([fetchTodayQuestions(), fetchTodaySimulations()])

      // Combine all items
      const allItems = [...todayTests, ...questions, ...simulations]

      // Debug: Log all items
      console.log("All today's items:", allItems)

      // Update stats
      const completed = allItems.filter((item) => item.completed).length

      // Count tests and reviews
      const testCount = todayTests.filter((item) => item.type === "test").length
      const reviewCount = todayTests.filter((item) => item.type === "review").length

      // Debug: Log the counts
      console.log("Test count:", testCount)
      console.log("Review count:", reviewCount)
      console.log("Total tests from props + mocks:", todayTests.length)

      // Update stats with the correct counts
      const newStats = {
        total: allItems.length,
        completed,
        tests: testCount,
        reviews: reviewCount,
        questions: questions.length,
        simulations: simulations.length,
      }

      console.log("Setting stats:", newStats)
      setStats(newStats)

      setTodayItems(allItems)
    } catch (error) {
      console.error("Error loading today's items:", error)
      toast.error("Failed to load today's activities")
    } finally {
      setIsLoading(false)
    }
  }, [tests, generateMockTests, processTodayTests, fetchTodayQuestions, fetchTodaySimulations])

  // Load items when dependencies change
  useEffect(() => {
    loadTodayItems()
  }, [userId, selectedExam, tests, loadTodayItems])

  // Handle completing a test
  const handleCompleteTest = async (item: TodayItem) => {
    if (item.type !== "test" && item.type !== "review") return
    if (!item.data?._id) return

    try {
      const newCompletedState = !item.completed

      // Call the parent handler if provided
      if (onTestComplete) {
        onTestComplete(item.data._id, newCompletedState)
      } else {
        // Otherwise handle it internally
        await axios.patch(`https://medical-backend-3eek.onrender.com/api/test/calender/completion/${item.data._id}`, {
          completed: newCompletedState,
        })

        // Update local state
        setTodayItems((prevItems) =>
          prevItems.map((prevItem) =>
            prevItem.id === item.id ? { ...prevItem, completed: newCompletedState } : prevItem,
          ),
        )

        // Update stats
        setStats((prev) => ({
          ...prev,
          completed: newCompletedState ? prev.completed + 1 : prev.completed - 1,
        }))

        toast.success(`Marked as ${newCompletedState ? "completed" : "incomplete"}`)
      }
    } catch (error) {
      console.error("Error updating completion status:", error)
      toast.error("Failed to update status")
    }
  }

  // Handle starting a question or simulation
  const handleStartItem = (item: TodayItem) => {
    if (item.type === "question" || item.type === "simulation") {
      // Store the simulation request in localStorage
      localStorage.setItem("startSimulation", "true")
      localStorage.setItem("simulationType", item.type)
      localStorage.setItem("simulationSubject", item.subject)
      localStorage.setItem("simulationTitle", item.title)

      // Make sure the selected exam is set
      if (selectedExam) {
        localStorage.setItem("selectedExam", selectedExam)
      }

      // Scroll to the ExamSimulation component
      const simulationElement = document.getElementById("exam-simulation")
      if (simulationElement) {
        simulationElement.scrollIntoView({ behavior: "smooth" })

        // Flash the simulation component to draw attention
        simulationElement.classList.add("highlight-animation")
        setTimeout(() => {
          simulationElement.classList.remove("highlight-animation")
        }, 2000)

        toast.success(`Starting ${item.type === "question" ? "practice question" : "simulation"} for ${item.subject}`)
      } else {
        toast.error("Simulation component not found. Please scroll down to the Exam Simulation section.")
      }
    }
  }

  // Handle refresh button click
  const handleRefresh = () => {
    loadTodayItems()
    if (onRefresh) {
      onRefresh()
    }
    toast.success("Today's activities refreshed")
  }

  // Get icon based on item type
  const getItemIcon = (type: string) => {
    switch (type) {
      case "test":
        return <FileText className="text-blue-500" size={20} />
      case "review":
        return <RefreshCw className="text-yellow-500" size={20} />
      case "question":
        return <BookOpen className="text-green-500" size={20} />
      case "simulation":
        return <PlayCircle className="text-blue-500" size={20} />
      default:
        return <Calendar className="text-gray-500" size={20} />
    }
  }

  // Get action button based on item type
  const getActionButton = (item: TodayItem) => {
    if (item.type === "test" || item.type === "review") {
      return (
        <button
          onClick={() => handleCompleteTest(item)}
          className={`${
            item.completed ? "bg-gray-500" : "bg-green-500"
          } text-white py-1 px-3 rounded hover:opacity-90 transition-colors text-sm`}
        >
          {item.completed ? "Mark Incomplete" : "Complete"}
        </button>
      )
    } else {
      return (
        <button
          onClick={() => handleStartItem(item)}
          className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600 transition-colors text-sm"
        >
          Start
        </button>
      )
    }
  }

  // Add a debug section to show raw data
  // const renderDebugInfo = () => {
  //   if (process.env.NODE_ENV !== "production") {
  //     return (
  //       <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-40">
  //         <h4 className="font-bold mb-2">Debug Info:</h4>
  //         <div>Tests prop length: {tests.length}</div>
  //         <div>Today&apos;s items: {todayItems.length}</div>
  //         <div>Stats: {JSON.stringify(stats)}</div>
  //         <div>Today&apos;s date: {getTodayDate().toISOString()}</div>
  //         <div className="mt-2">Tests:</div>
  //         <pre>{JSON.stringify(tests.slice(0, 2), null, 2)}</pre>
  //       </div>
  //     )
  //   }
  //   return null
  // }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <style>{highlightStyle}</style>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Flame className="mr-2 text-orange-500" size={24} />
          <h2 className="text-xl font-semibold">Today&apos;s Activities</h2>
        </div>
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-3">{formatDate(new Date())}</span>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-xs text-gray-600">Total Activities</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-xs text-gray-600">Completed</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.tests}</div>
          <div className="text-xs text-gray-600">Tests</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.reviews}</div>
          <div className="text-xs text-gray-600">Reviews</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.questions + stats.simulations}</div>
          <div className="text-xs text-gray-600">Practice</div>
        </div>
      </div>

      {/* Debug info section */}
      {/* {renderDebugInfo()} */}

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-pulse text-blue-500">Loading today&apos;s activities...</div>
        </div>
      ) : todayItems.length > 0 ? (
        <div>
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Today&apos;s Progress</span>
              <span className="text-sm text-gray-500">
                {stats.completed}/{stats.total} completed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            {/* Tests Section */}
            {todayItems.filter((item) => item.type === "test").length > 0 && (
              <div>
                <h3 className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <FileText size={16} className="mr-1 text-blue-500" />
                  Tests
                </h3>
                <div className="space-y-2">
                  {todayItems
                    .filter((item) => item.type === "test")
                    .map((item) => (
                      <div
                        key={item.id}
                        className={`border-l-4 rounded-md p-3 bg-white shadow-sm ${
                          item.completed ? "border-gray-300 bg-gray-50" : "border-blue-500"
                        }`}
                        style={{ borderLeftColor: item.color }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start">
                            {getItemIcon(item.type)}
                            <div className="ml-2">
                              <div className="font-medium">
                                {item.subject}: {item.title}
                                {item.completed && (
                                  <CheckCircle size={14} className="inline-block ml-1 text-green-500" />
                                )}
                              </div>
                              {item.description && <div className="text-sm text-gray-500">{item.description}</div>}
                            </div>
                          </div>
                          {getActionButton(item)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            {todayItems.filter((item) => item.type === "review").length > 0 && (
              <div>
                <h3 className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <RefreshCw size={16} className="mr-1 text-yellow-500" />
                  Review Sessions
                </h3>
                <div className="space-y-2">
                  {todayItems
                    .filter((item) => item.type === "review")
                    .map((item) => (
                      <div
                        key={item.id}
                        className={`border-l-4 rounded-md p-3 bg-white shadow-sm ${
                          item.completed ? "border-gray-300 bg-gray-50" : "border-yellow-500"
                        }`}
                        style={{ borderLeftColor: item.color }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start">
                            {getItemIcon(item.type)}
                            <div className="ml-2">
                              <div className="font-medium">
                                {item.subject}: {item.title}
                                {item.completed && (
                                  <CheckCircle size={14} className="inline-block ml-1 text-green-500" />
                                )}
                              </div>
                              {item.description && <div className="text-sm text-gray-500">{item.description}</div>}
                            </div>
                          </div>
                          {getActionButton(item)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Practice Section (Questions & Simulations) */}
            {todayItems.filter((item) => item.type === "question" || item.type === "simulation").length > 0 && (
              <div>
                <h3 className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <BookOpen size={16} className="mr-1 text-green-500" />
                  Practice
                </h3>
                <div className="space-y-2">
                  {todayItems
                    .filter((item) => item.type === "question" || item.type === "simulation")
                    .map((item) => (
                      <div
                        key={item.id}
                        className="border-l-4 rounded-md p-3 bg-white shadow-sm"
                        style={{ borderLeftColor: item.color }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start">
                            {getItemIcon(item.type)}
                            <div className="ml-2">
                              <div className="font-medium">
                                {item.subject}: {item.title}
                              </div>
                              {item.description && <div className="text-sm text-gray-500">{item.description}</div>}
                            </div>
                          </div>
                          {getActionButton(item)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Clock className="mx-auto text-gray-400 mb-2" size={40} />
          <h3 className="text-lg font-medium text-gray-700">No Activities for Today</h3>
          <p className="text-gray-500 mt-1">
            {selectedExam
              ? "You don't have any tests or activities scheduled for today."
              : "Select an exam in the Exam Interface to see recommended activities."}
          </p>
          {selectedExam && (
            <button
              onClick={handleRefresh}
              className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
            >
              <ListChecks className="inline-block mr-1" size={18} />
              Generate Recommendations
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default TodayDashboard
