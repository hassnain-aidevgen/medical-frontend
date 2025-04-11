"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import axios from "axios"
import { Calendar } from "lucide-react"
import { useEffect, useState } from "react"

interface PerformanceDay {
  date: string
  dayName: string
  hasActivity: boolean
  isToday: boolean
}

export default function WeeklyPerformance() {
  const [userId, setUserId] = useState<string | null>(null)
  const [performanceDays, setPerformanceDays] = useState<PerformanceDay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("Medical_User_Id")
      setUserId(storedUserId)
    }
  }, [])

  useEffect(() => {
    const fetchPerformanceData = async () => {
      if (!userId) return

      setIsLoading(true)
      try {
        // Use localhost for testing, change to production URL for deployment
        const response = await axios.get(`http://localhost:5000/api/test/streak/${userId}`)
        
        if (response.data && Array.isArray(response.data.streakData)) {
          const activityData: { date: string; count: number }[] = response.data.streakData
          const last7Days = getLastWeekDays()
          
          // Map activity data to days
          const mappedDays = last7Days.map(day => {
            const found = activityData.find((item: { date: string; count: number }) => item.date === day.date)
            return {
              ...day,
              hasActivity: found ? found.count > 0 : false
            }
          })
          
          setPerformanceDays(mappedDays)
        } else {
          console.error("Invalid performance data format:", response.data)
          setError("Invalid data format received from server")
        }
      } catch (error) {
        console.error("Error fetching performance data:", error)
        setError("Failed to fetch performance data")
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchPerformanceData()
    }
  }, [userId])

  // Get the last 7 days
  const getLastWeekDays = () => {
    const days = []
    const today = new Date()
    
    // Start with 6 days ago and go up to today
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(today.getDate() - i)
      days.push({
        date: date.toISOString().split("T")[0],
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        isToday: i === 0,
        hasActivity: false // Default value, will be updated with real data
      })
    }
    return days
  }

  // Get month name for the current month
  const getCurrentMonth = () => {
    return new Date().toLocaleDateString("en-US", { month: "long" });
  }

  return (
    <Card className="overflow-hidden w-full">
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Calendar className="h-5 w-5" />
            Weekly Performance
          </CardTitle>
          <span className="text-sm font-medium">{getCurrentMonth()}</span>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="text-sm text-red-500 p-4 text-center">{error}</div>
        ) : (
          <div className="flex justify-between items-center py-4 w-full">
            {performanceDays.map((day, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className={`
                    w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-2
                    transition-all duration-300 ease-in-out
                    ${day.hasActivity 
                      ? "bg-gradient-to-br from-green-400 to-green-600 text-white shadow-sm" 
                      : "bg-blue-50 text-blue-700 border border-blue-200"}
                    ${day.isToday 
                      ? "ring-2 ring-indigo-500" 
                      : ""}
                  `}
                >
                  <span className={`text-sm sm:text-base font-semibold ${!day.hasActivity ? "text-blue-700" : ""}`}>
                    {day.dayName.charAt(0)}
                  </span>
                </div>
                <span className={`text-xs sm:text-sm ${day.isToday ? "font-bold text-indigo-600" : "text-gray-700"}`}>
                  {day.dayName}
                </span>
                <span className="text-xs text-gray-500">
                  {day.date.split("-")[2]}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-between items-center mt-2 pt-3 border-t border-gray-200 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-400 to-green-600"></div>
            <span className="text-gray-700 font-medium">Test Activity</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-50 border border-blue-200"></div>
            <span className="text-gray-700 font-medium">No Activity</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}