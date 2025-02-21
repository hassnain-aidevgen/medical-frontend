"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Settings, BarChart, Plus } from "lucide-react"

const SmartStudyCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  interface Test {
    subjectName: string;
    testTopic: string;
    date: string;
  }

  const [tests, setTests] = useState<Test[]>([])
  const [newTest, setNewTest] = useState<Test>({ subjectName: "", testTopic: "", date: "" })

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setTests([...tests, newTest])
    setNewTest({ subjectName: "", testTopic: "", date: "" })
  }

  const renderCalendarDays = () => {
    const days = []
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      const isSelected = date.toDateString() === selectedDate.toDateString()
      const hasStudySession = Math.random() > 0.5 // Simulating study sessions
      const testOnThisDay = tests.find((test) => new Date(test.date).toDateString() === date.toDateString())

      days.push(
        <div
          key={day}
          className={`p-2 text-center cursor-pointer hover:bg-blue-100 transition-colors ${
            isSelected ? "bg-blue-500 text-white" : ""
          } ${testOnThisDay ? "bg-yellow-300" : ""}`}
          onClick={() => setSelectedDate(date)}
        >
          {day}
          {hasStudySession && <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-1"></div>}
          {testOnThisDay && (
          <div className="text-xs mt-1 font-semibold" title={`${testOnThisDay.subjectName}: ${testOnThisDay.testTopic}`}>
            {testOnThisDay.subjectName}
            <div className="text-[10px] font-normal text-gray-700">
              {testOnThisDay.testTopic.length > 10
                ? testOnThisDay.testTopic.substring(0, 10) + "..."
                : testOnThisDay.testTopic}
            </div>
          </div>
        )}
        </div>,
      )
    }
    return days
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Smart Study Calendar</h1>

      {/* New Test Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add Upcoming Test</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            name="subjectName"
            value={newTest.subjectName}
            onChange={handleInputChange}
            placeholder="Subject Name"
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            name="testTopic"
            value={newTest.testTopic}
            onChange={handleInputChange}
            placeholder="Test Topic"
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="date"
            name="date"
            value={newTest.date}
            onChange={handleInputChange}
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
          >
            <Plus size={20} className="mr-2" />
            Add Test
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-lg shadow-md p-6">
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
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Study Streak</span>
                <span className="font-bold">7 days</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Completed Tasks</span>
                <span className="font-bold">24/30</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Average Focus Time</span>
                <span className="font-bold">45 minutes</span>
              </div>
            </div>
            <button className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors flex items-center justify-center">
              <BarChart size={20} className="mr-2" />
              View Detailed Analytics
            </button>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Customize Calendar</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="subject" className="block mb-1">
                  Add Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter subject name"
                />
              </div>
              <div>
                <label htmlFor="color" className="block mb-1">
                  Subject Color
                </label>
                <input type="color" id="color" className="w-full h-10 p-1 border rounded" />
              </div>
              <button className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors flex items-center justify-center">
                <Settings size={20} className="mr-2" />
                Update Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SmartStudyCalendar

