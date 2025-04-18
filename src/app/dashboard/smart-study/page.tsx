"use client"

import type React from "react"

import WeeklyStreak from "@/components/weekly-streak"
import axios from "axios"
import { Calendar, ChevronLeft, ChevronRight, Clock, FileText, Plus, RefreshCw, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import toast, { Toaster } from "react-hot-toast"
import ExamInterface from "./examInterface"
import PerformanceVisualizer from "./performance-visualizer"
import PlannerSyncScheduler from "./planner-sync-scheduler"
import PriorityIndicator from "./priority-indicator"
import TodayDashboard from "./today-dashboard"

// Define the interface for your calendar tests
interface CalendarTest {
  _id?: string
  subjectName: string
  testTopic: string
  date: string
  color: string
  completed?: boolean
}

// Define the interface that matches ExamInterface's expected Test type
interface ExamTest {
  id: string
  name: string
  score: number
  date: string
  subjectName: string
  testTopic: string
  color: string
}

// Define the interface for weekly plan tasks
interface PlanTask {
  id: string
  title: string
  subject: string
  topic: string
  date: string
  duration: number
  priority: "high" | "medium" | "low"
}

// Define the interface for synced tests
interface SyncedTest {
  _id: string
  date: Date | string
  subjectName: string
  testTopic: string
  completed: boolean
  userId: string
  color: string
}

const SmartStudyCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [userId, setUserId] = useState<string>("")
  const [tests, setTests] = useState<CalendarTest[]>([])
  const [newTest, setNewTest] = useState<CalendarTest>({
    subjectName: "",
    testTopic: "",
    date: "",
    color: "#3B82F6",
    completed: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isUndoing, setIsUndoing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [lastSyncedTests, setLastSyncedTests] = useState<SyncedTest[]>([])
  const [weeklyStudyPlan, setWeeklyStudyPlan] = useState<PlanTask[]>([])
  const [showUndoButton, setShowUndoButton] = useState(false)
  const [activeTab, setActiveTab] = useState("calendar") // calendar, performance, today

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedData = localStorage.getItem("Medical_User_Id")
      setUserId(storedData || "")

      // Load last sync time and tests from localStorage
      const storedSyncTime = localStorage.getItem("lastPlannerSyncTime")
      if (storedSyncTime) {
        setLastSyncTime(storedSyncTime)
      }

      const storedTests = localStorage.getItem("lastSyncedTests")
      if (storedTests) {
        try {
          const tests = JSON.parse(storedTests)
          setLastSyncedTests(tests)
          setShowUndoButton(true)
        } catch (e) {
          console.error("Error parsing stored tests:", e)
        }
      }

      // Load weekly study plan from localStorage
      const storedPlan = localStorage.getItem("weeklyStudyPlan")
      if (storedPlan) {
        try {
          setWeeklyStudyPlan(JSON.parse(storedPlan))
        } catch (e) {
          console.error("Error parsing stored plan:", e)
        }
      }
    }
  }, [])

  // Update localStorage when state changes
  useEffect(() => {
    if (lastSyncTime) {
      localStorage.setItem("lastPlannerSyncTime", lastSyncTime)
    }
  }, [lastSyncTime])

  useEffect(() => {
    if (lastSyncedTests.length > 0) {
      localStorage.setItem("lastSyncedTests", JSON.stringify(lastSyncedTests))
    }
  }, [lastSyncedTests])

  useEffect(() => {
    if (weeklyStudyPlan.length > 0) {
      localStorage.setItem("weeklyStudyPlan", JSON.stringify(weeklyStudyPlan))
    }
  }, [weeklyStudyPlan])

  const fetchTests = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/calender/${userId}`)
      if (Array.isArray(response.data)) {
        setTests(response.data)
      } else {
        throw new Error("Invalid data received from server")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to fetch tests. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    console.log(userId)
    if (userId) {
      fetchTests()
    }
  }, [userId, fetchTests])

  // Convert your calendar tests to ExamInterface's expected format
  const getExamTests = (): ExamTest[] => {
    return tests.map((test) => ({
      id: test._id || `temp-${Date.now()}`,
      name: test.subjectName,
      subjectName: test.subjectName,
      testTopic: test.testTopic,
      color: test.color,
      date: test.date,
      score: 0, // Default score value, replace with actual value if available
    }))
  }

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTest({ ...newTest, [e.target.name]: e.target.value })
  }

  const validateNewTest = (test: CalendarTest): boolean => {
    if (test.subjectName.trim() === "") {
      toast.error("Subject name cannot be empty")
      return false
    }
    if (test.testTopic.trim() === "") {
      toast.error("Test topic cannot be empty")
      return false
    }
    if (test.date === "") {
      toast.error("Date must be selected")
      return false
    }
    const selectedDate = new Date(test.date)
    if (selectedDate < new Date(new Date().setHours(0, 0, 0, 0))) {
      toast.error("Cannot add tests for past dates")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!userId) {
      toast.error("User ID not found. Please log in.")
      return
    }
    if (!validateNewTest(newTest)) return

    setIsLoading(true)
    try {
      const response = await axios.post("https://medical-backend-loj4.onrender.com/api/test/calender", {
        ...newTest,
        userId,
      })
      if (response.data && response.data._id) {
        setTests([...tests, response.data])
        setNewTest({ subjectName: "", testTopic: "", date: "", color: "#3B82F6" })
        toast.success("Test added successfully")
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to add test. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTest = async (id: string) => {
    if (!userId) {
      toast.error("User ID not found. Please log in.")
      return
    }
    setIsLoading(true)
    try {
      await axios.delete(`https://medical-backend-loj4.onrender.com/api/test/calender/${id}`)
      setTests(tests.filter((test) => test._id !== id))
      toast.success("Test deleted successfully")
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete test. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleCompletion = async (id: string, completed: boolean) => {
    if (!userId) {
      toast.error("User ID not found. Please log in.")
      return
    }
    setIsLoading(true)
    try {
      const response = await axios.patch(
        `https://medical-backend-loj4.onrender.com/api/test/calender/completion/${id}`,
        { completed },
      )
      if (response.data && response.data._id) {
        setTests(tests.map((test) => (test._id === id ? { ...test, completed: response.data.completed } : test)))
        toast.success(`Test marked as ${completed ? "completed" : "incomplete"}`)
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to update test status. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handler for when tests are added from the PlannerSyncScheduler
  const handleTestsAdded = (newTests: SyncedTest[]) => {
    // Refresh the tests list
    fetchTests()
  }

  // Handler for sync time change
  const handleSyncTimeChange = (time: string) => {
    setLastSyncTime(time)
  }

  // Handler for last synced tests change
  const handleLastSyncedTestsChange = (tests: SyncedTest[]) => {
    setLastSyncedTests(tests)
  }

  // Handler for weekly study plan change
  const handleWeeklyStudyPlanChange = (plan: PlanTask[]) => {
    setWeeklyStudyPlan(plan)
  }

  const renderCalendarDays = () => {
    const days = []
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      const isSelected = date.toDateString() === selectedDate.toDateString()
      const testsOnThisDay = tests.filter((test) => new Date(test.date).toDateString() === date.toDateString())

      days.push(
        <div
          key={day}
          className={`p-2 text-center cursor-pointer hover:bg-blue-100 transition-colors ${
            isSelected ? "bg-blue-500 text-white" : ""
          }`}
          onClick={() => setSelectedDate(date)}
        >
          {day}
          {testsOnThisDay.length > 0 && (
            <div className="flex flex-wrap justify-center mt-1 gap-1">
              {testsOnThisDay.map((test, index) => {
                // Determine color based on status
                let dotColor = test.color
                const testDate = new Date(test.date)
                const today = new Date()
                today.setHours(0, 0, 0, 0)

                // If test has a completion status, use status-based colors
                if (test.completed === true) {
                  dotColor = "#22c55e" // green for complete
                } else if (test.completed === false && testDate < today) {
                  dotColor = "#9ca3af" // gray for missed (past date and not completed)
                } else if (test.completed === false) {
                  dotColor = "#ef4444" // red for incomplete
                }

                return (
                  <div
                    key={index}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: dotColor }}
                    title={`${test.subjectName}: ${test.testTopic} - ${
                      test.completed ? "Complete" : testDate < today ? "Missed" : "Incomplete"
                    }`}
                  />
                )
              })}
            </div>
          )}
        </div>,
      )
    }
    return days
  }

  const selectedDateTests = tests.filter((test) => new Date(test.date).toDateString() === selectedDate.toDateString())

  return (
    <div className="container mx-auto p-4">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold mb-6">Smart Study Calendar</h1>

      {/* Color Legend */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-[#22c55e] mr-2"></div>
          <span>Complete</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-[#ef4444] mr-2"></div>
          <span>Incomplete</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-[#9ca3af] mr-2"></div>
          <span>Missed</span>
        </div>
      </div>

      {/* Today Dashboard - Daily Snapshot */}
      <TodayDashboard tests={tests} onTestComplete={handleToggleCompletion} onRefresh={fetchTests} />

      {/* Weekly Streak Component */}
      <WeeklyStreak />

      {/* Unified Calendar Interface */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        {/* Tab Navigation */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`px-4 py-3 font-medium flex items-center ${
              activeTab === "calendar" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600"
            }`}
          >
            <Calendar size={18} className="mr-2" />
            Calendar
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`px-4 py-3 font-medium flex items-center ${
              activeTab === "add" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600"
            }`}
          >
            <Plus size={18} className="mr-2" />
            Add Test
          </button>
          <button
            onClick={() => setActiveTab("sync")}
            className={`px-4 py-3 font-medium flex items-center ${
              activeTab === "sync" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600"
            }`}
          >
            <RefreshCw size={18} className="mr-2" />
            AI Sync
          </button>
          <button
            onClick={() => setActiveTab("performance")}
            className={`px-4 py-3 font-medium flex items-center ${
              activeTab === "performance" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600"
            }`}
          >
            <FileText size={18} className="mr-2" />
            Performance
          </button>
        </div>

        <div className="p-6">
          {/* Calendar Tab */}
          {activeTab === "calendar" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Calendar - takes 2 columns on desktop */}
              <div className="col-span-1 md:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
                  </h2>
                  <div className="flex space-x-2">
                    <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-200">
                      <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-200">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center font-semibold">
                      {day}
                    </div>
                  ))}
                  {renderCalendarDays()}
                </div>
              </div>

              {/* Right sidebar */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h2 className="text-lg font-semibold mb-4">Selected Date: {selectedDate.toDateString()}</h2>
                  {selectedDateTests.length > 0 ? (
                    <ul className="space-y-3">
                      {selectedDateTests.map((test) => (
                        <li key={test._id} className="flex flex-col space-y-2 border-b pb-3">
                          <div className="flex items-center">
                            <div
                              className="w-4 h-4 rounded-full mr-2"
                              style={{
                                backgroundColor: test.completed
                                  ? "#22c55e" // green for complete
                                  : new Date(test.date) < new Date(new Date().setHours(0, 0, 0, 0))
                                    ? "#9ca3af" // gray for missed
                                    : "#ef4444", // red for incomplete
                              }}
                            ></div>
                            <div className="flex-1">
                              <strong>{test.subjectName}</strong>
                              <p>{test.testTopic}</p>
                              <PriorityIndicator subjectName={test.subjectName} />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-6">
                            <button
                              onClick={() => test._id && handleDeleteTest(test._id)}
                              className="text-red-500 hover:text-red-700"
                              disabled={isLoading}
                            >
                              <Trash2 size={18} />
                            </button>
                            <button
                              onClick={() => test._id && handleToggleCompletion(test._id, !test.completed)}
                              className={`${
                                test.completed ? "bg-gray-500" : "bg-green-500"
                              } text-white py-1 px-3 rounded hover:opacity-90 transition-colors text-sm`}
                              disabled={isLoading}
                            >
                              {test.completed ? "Mark Incomplete" : "Complete"}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-4">
                      <Clock className="mx-auto text-gray-400 mb-2" size={32} />
                      <p>No tests scheduled for this date.</p>
                      <button
                        onClick={() => setActiveTab("add")}
                        className="mt-3 text-blue-500 hover:text-blue-700 text-sm font-medium"
                      >
                        Add a test
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h2 className="text-lg font-semibold mb-4">Upcoming Tests</h2>
                  {isLoading ? (
                    <p>Loading tests...</p>
                  ) : tests.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto">
                      <ul className="space-y-2">
                        {tests
                          .filter((test) => new Date(test.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .slice(0, 5)
                          .map((test) => (
                            <li
                              key={test._id}
                              className="flex justify-between items-center p-2 hover:bg-gray-100 rounded"
                            >
                              <div className="flex items-center">
                                <div
                                  className="w-4 h-4 rounded-full mr-2"
                                  style={{
                                    backgroundColor: test.completed
                                      ? "#22c55e" // green for complete
                                      : new Date(test.date) < new Date(new Date().setHours(0, 0, 0, 0))
                                        ? "#9ca3af" // gray for missed
                                        : "#ef4444", // red for incomplete
                                  }}
                                ></div>
                                <div>
                                  <strong>{test.subjectName}</strong>: {test.testTopic}
                                  <br />
                                  <small>{new Date(test.date).toLocaleDateString()}</small>
                                </div>
                              </div>
                              <button
                                onClick={() => test._id && handleDeleteTest(test._id)}
                                className="text-red-500 hover:text-red-700"
                                disabled={isLoading}
                              >
                                <Trash2 size={16} />
                              </button>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ) : (
                    <p>No upcoming tests.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Add Test Tab */}
          {activeTab === "add" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Add Upcoming Test</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="subjectName" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject Name
                    </label>
                    <input
                      type="text"
                      id="subjectName"
                      name="subjectName"
                      value={newTest.subjectName}
                      onChange={handleInputChange}
                      placeholder="e.g., Anatomy, Physics"
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <label htmlFor="testTopic" className="block text-sm font-medium text-gray-700 mb-1">
                      Test Topic
                    </label>
                    <input
                      type="text"
                      id="testTopic"
                      name="testTopic"
                      value={newTest.testTopic}
                      onChange={handleInputChange}
                      placeholder="e.g., Midterm, Chapter 5"
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      maxLength={100}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                      Test Date
                    </label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={newTest.date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div>
                    <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                      Color Label
                    </label>
                    <div className="flex items-center">
                      <input
                        type="color"
                        id="color"
                        name="color"
                        value={newTest.color}
                        onChange={handleInputChange}
                        className="h-10 w-10 p-1 border rounded mr-2"
                      />
                      <span className="text-sm text-gray-500">Choose a color for this test</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-500 text-white py-2 px-6 rounded-md hover:bg-blue-600 transition-colors flex items-center"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Adding..."
                    ) : (
                      <>
                        <Plus size={20} className="mr-2" />
                        Add Test
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* AI Sync Tab */}
          {activeTab === "sync" && (
            <div>
              <PlannerSyncScheduler
                userId={userId}
                onTestsAdded={handleTestsAdded}
                onRefresh={fetchTests}
                lastSyncTime={lastSyncTime}
                lastSyncedTests={lastSyncedTests}
                onSyncTimeChange={handleSyncTimeChange}
                onLastSyncedTestsChange={handleLastSyncedTestsChange}
                weeklyStudyPlan={weeklyStudyPlan}
              />

              <div className="border-t pt-4">
                <h3 className="font-medium text-lg mb-3">How It Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-blue-500 font-bold text-xl mb-2">1</div>
                    <h4 className="font-medium mb-2">Sync Study Plan</h4>
                    <p className="text-sm text-gray-600">
                      Your AI-generated study plan is synced to your calendar as scheduled tasks.
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-blue-500 font-bold text-xl mb-2">2</div>
                    <h4 className="font-medium mb-2">Generate Review Sessions</h4>
                    <p className="text-sm text-gray-600">
                      The system automatically creates spaced repetition review sessions at optimal intervals.
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-blue-500 font-bold text-xl mb-2">3</div>
                    <h4 className="font-medium mb-2">Track Progress</h4>
                    <p className="text-sm text-gray-600">
                      Mark tasks as complete to track your progress and improve your study effectiveness.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === "performance" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Performance Visualization</h2>
              <PerformanceVisualizer
                tests={tests.map((test) => ({
                  _id: test._id || "",
                  subjectName: test.subjectName,
                  testTopic: test.testTopic,
                  date: test.date,
                  color: test.color,
                  completed: test.completed || false,
                  userId: userId,
                }))}
              />
            </div>
          )}
        </div>
      </div>

      <div id="exam-simulation">
        <ExamInterface tests={getExamTests()} />
      </div>
    </div>
  )
}

export default SmartStudyCalendar
