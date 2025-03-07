"use client"

import { useEffect, useState } from "react"
import axios from "axios"

interface StreakData {
  date: string
  count: number
}

export default function WeeklyStreak() {
  const [userId, setUserId] = useState<string | null>(null)
  const [streakData, setStreakData] = useState<StreakData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("Medical_User_Id")
      setUserId(storedUserId)
    }
  }, [])

  useEffect(() => {
    const fetchStreakData = async () => {
      if (!userId) return

      setIsLoading(true)
      try {
        const response = await axios.get(`http://localhost:5000/api/test/streak/${userId}`)
        console.log("Streak data response:", response.data)

        if (response.data && Array.isArray(response.data.streakData)) {
          setStreakData(response.data.streakData)
          setCurrentStreak(response.data.currentStreak || 0)
        } else {
          console.error("Invalid streak data format:", response.data)
          setError("Invalid data format received from server")
        }
      } catch (error) {
        console.error("Error fetching streak data:", error)
        setError("Failed to fetch streak data")
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchStreakData()
    }
  }, [userId])

  // Get the last 7 days
  const getLast7Days = () => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push({
        date: date.toISOString().split("T")[0],
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
      })
    }
    return days
  }

  const last7Days = getLast7Days()

  // Map streak data to the last 7 days
  const mappedData = last7Days.map((day) => {
    const found = streakData.find((item) => item.date === day.date)
    return {
      ...day,
      count: found ? found.count : 0,
    }
  })

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Weekly Question Streak Of Current User</h2>
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Weekly Question Streak</h2>

      {isLoading ? (
        <p>Loading streak data...</p>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-lg">
              Current streak: <span className="font-bold text-blue-600">{currentStreak} days</span>
            </p>
          </div>

          <div className="flex justify-between items-end h-32 mt-4">
            {mappedData.map((day, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="text-xs mb-1">{day.count > 0 ? day.count : ""}</div>
                <div
                  className={`w-8 ${day.count > 0 ? "bg-blue-500" : "bg-gray-200"} rounded-t-md`}
                  style={{
                    height: day.count > 0 ? `${Math.min(100, day.count * 20)}%` : "10%",
                    minHeight: "4px",
                  }}
                ></div>
                <div className="text-xs mt-2">{day.dayName}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

