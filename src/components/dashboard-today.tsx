"use client"

import { useEffect, useState } from "react"
import axios from "axios"
// import TodayDashboard from "./today-dashboard"
import TodayDashboard from "@/app/dashboard/smart-study/today-dashboard"

interface CalendarTest {
  _id?: string
  subjectName: string
  testTopic: string
  date: string
  color: string
  completed?: boolean
}

export default function DashboardToday() {
  const [userId, setUserId] = useState<string>("")
  const [tests, setTests] = useState<CalendarTest[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedData = localStorage.getItem("Medical_User_Id")
      setUserId(storedData || "")
    }
  }, [])

  useEffect(() => {
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
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchTests()
    }
  }, [userId])

  const handleTestComplete = async (testId: string, completed: boolean) => {
    if (!userId) return

    setIsLoading(true)
    try {
      const response = await axios.patch(
        `https://medical-backend-loj4.onrender.com/api/test/calender/completion/${testId}`,
        { completed },
      )
      if (response.data && response.data._id) {
        setTests(tests.map((test) => (test._id === testId ? { ...test, completed: response.data.completed } : test)))
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/calender/${userId}`)
      if (Array.isArray(response.data)) {
        setTests(response.data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {isLoading && <div className="text-center py-2">Fetching latest data...</div>}
      <TodayDashboard tests={tests} onTestComplete={handleTestComplete} onRefresh={handleRefresh} />
    </>
  )
}
