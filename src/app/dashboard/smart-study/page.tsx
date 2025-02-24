"use client"

import type React from "react"

import axios from "axios"
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import toast, { Toaster } from "react-hot-toast"

const SmartStudyCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [userId, setUserId] = useState<string>("")
  interface Test {
    _id?: string
    subjectName: string
    testTopic: string
    date: string
    color: string
  }

  const [tests, setTests] = useState<Test[]>([])
  const [newTest, setNewTest] = useState<Test>({ subjectName: "", testTopic: "", date: "", color: "#3B82F6" })
  const [isLoading, setIsLoading] = useState(false)


  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedData = localStorage.getItem("Medical_User_Id")
      setUserId(storedData || "")
    }
  }, [])


  useEffect(() => {
    if (userId) {
      fetchTests()
    } else {
      toast.error("User ID not found. Please log in.")
    }
  }, [userId])

  const fetchTests = async () => {
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

  const validateNewTest = (test: Test): boolean => {
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

  // const handleColorChange = async (id: string, color: string) => {
  //   if (!userId) {
  //     toast.error("User ID not found. Please log in.")
  //     return
  //   }
  //   setIsLoading(true)
  //   try {
  //     const response = await axios.patch(`https://medical-backend-loj4.onrender.com/api/test/calender/color/${id}`, { color })
  //     if (response.data && response.data._id) {
  //       setTests(tests.map((test) => (test._id === id ? { ...test, color: response.data.color } : test)))
  //       toast.success("Color updated successfully")
  //     } else {
  //       throw new Error("Invalid response from server")
  //     }
  //   } catch (error) {
  //     console.error(error)
  //     toast.error("Failed to update color. Please try again.")
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

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
          className={`p-2 text-center cursor-pointer hover:bg-blue-100 transition-colors ${isSelected ? "bg-blue-500 text-white" : ""
            }`}
          onClick={() => setSelectedDate(date)}
        >
          {day}
          {testsOnThisDay.length > 0 && (
            <div className="flex flex-wrap justify-center mt-1 gap-1">
              {testsOnThisDay.map((test, index) => (
                <div
                  key={index}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: test.color }}
                  title={`${test.subjectName}: ${test.testTopic}`}
                ></div>
              ))}
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

      {/* New Test Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add Upcoming Test</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            name="subjectName"
            value={newTest.subjectName}
            onChange={handleInputChange}
            placeholder="Subject Name"
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            maxLength={50}
          />
          <input
            type="text"
            name="testTopic"
            value={newTest.testTopic}
            onChange={handleInputChange}
            placeholder="Test Topic"
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            maxLength={100}
          />
          <input
            type="date"
            name="date"
            value={newTest.date}
            onChange={handleInputChange}
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            min={new Date().toISOString().split("T")[0]}
          />
          <input
            type="color"
            name="color"
            value={newTest.color}
            onChange={handleInputChange}
            className="w-full h-10 p-1 border rounded"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
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
            <h2 className="text-xl font-semibold mb-4">Selected Date: {selectedDate.toDateString()}</h2>
            {selectedDateTests.length > 0 ? (
              <ul className="space-y-2">
                {selectedDateTests.map((test) => (
                  <li key={test._id} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: test.color }}></div>
                      <div>
                        <strong>{test.subjectName}</strong>: {test.testTopic}
                      </div>
                    </div>
                    <button
                      onClick={() => test._id && handleDeleteTest(test._id)}
                      className="text-red-500 hover:text-red-700"
                      disabled={isLoading}
                    >
                      <Trash2 size={20} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No tests scheduled for this date.</p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Upcoming Tests</h2>
            {isLoading ? (
              <p>Loading tests...</p>
            ) : tests.length > 0 ? (
              <ul className="space-y-2">
                {tests.map((test) => (
                  <li key={test._id} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: test.color }}></div>
                      <div>
                        <strong>{test.subjectName}</strong>: {test.testTopic}
                        <br />
                        <small>{new Date(test.date).toLocaleDateString()}</small>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={() => test._id && handleDeleteTest(test._id)}
                        className="text-red-500 hover:text-red-700"
                        disabled={isLoading}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No upcoming tests.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SmartStudyCalendar

