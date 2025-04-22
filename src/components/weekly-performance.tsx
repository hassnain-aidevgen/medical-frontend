"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import axios from "axios"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"

interface PerformanceDay {
  date: string
  dayName: string
  status: "complete" | "incomplete" | "missed" // Status types
  isToday: boolean
  count: number
}

export default function PerformanceCalendar() {
  const [userId, setUserId] = useState<string | null>(null)
  const [performanceDays, setPerformanceDays] = useState<PerformanceDay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState("week") // "week" or "month"
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // For month selection in month view
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  
  // Get user ID from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("Medical_User_Id")
      setUserId(storedUserId)
    }
  }, [])

  // Fetch performance data when userId, view, or date changes
  useEffect(() => {
    if (!userId) return
    fetchPerformanceData()
  }, [userId, view, selectedMonth, selectedYear])

  // Function to fetch performance data
  const fetchPerformanceData = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      // Use localhost for testing, change to production URL for deployment
      const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/streak/${userId}`)
      
      if (response.data && Array.isArray(response.data.streakData)) {
        const activityData = response.data.streakData
        
        const daysToDisplay = view === "week" 
          ? getWeekDays(currentDate)
          : getMonthDays(selectedYear, selectedMonth)
        
        // Map activity data to days
        const mappedDays = daysToDisplay.map(day => {
          const found = activityData.find((item: { date: string }) => item.date === day.date)
          
          // Determine status
          let status: "complete" | "incomplete" | "missed" = "missed"
          if (found) {
            status = found.count > 0 ? "complete" : "incomplete"
          }
          
          return {
            ...day,
            status,
            count: found ? found.count : 0
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

  // Get week days (from Monday to Sunday of current week)
  const getWeekDays = (date: Date) => {
    const days = []
    const currentDate = new Date(date)
    const today = new Date()
    
    // Get start of the week (Monday)
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
    startOfWeek.setDate(diff)
    
    // Create array for the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      
      days.push({
        date: date.toISOString().split("T")[0],
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        isToday: date.toDateString() === today.toDateString(),
        status: "missed" as "complete" | "incomplete" | "missed"
      })
    }
    
    return days
  }

  // Get all days in a month
  const getMonthDays = (year: number, month: number) => {
    const days = []
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const today = new Date()
    
    // Get days in month
    for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
      days.push({
        date: new Date(date).toISOString().split("T")[0],
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        isToday: date.toDateString() === today.toDateString(),
        status: "missed" as "complete" | "incomplete" | "missed"
      })
    }
    
    return days
  }

  // Navigate to previous week/month
  const goToPrevious = () => {
    if (view === "week") {
      const prevWeek = new Date(currentDate)
      prevWeek.setDate(currentDate.getDate() - 7)
      setCurrentDate(prevWeek)
    } else {
      let newMonth = selectedMonth - 1
      let newYear = selectedYear
      
      if (newMonth < 0) {
        newMonth = 11
        newYear--
      }
      
      setSelectedMonth(newMonth)
      setSelectedYear(newYear)
    }
  }

  // Navigate to next week/month
  const goToNext = () => {
    if (view === "week") {
      const nextWeek = new Date(currentDate)
      nextWeek.setDate(currentDate.getDate() + 7)
      setCurrentDate(nextWeek)
    } else {
      let newMonth = selectedMonth + 1
      let newYear = selectedYear
      
      if (newMonth > 11) {
        newMonth = 0
        newYear++
      }
      
      setSelectedMonth(newMonth)
      setSelectedYear(newYear)
    }
  }

  // Get the date range for display
  const getDateRangeDisplay = () => {
    if (view === "week") {
      const startDate = new Date(performanceDays[0]?.date || currentDate)
      const endDate = new Date(performanceDays[6]?.date || currentDate)
      
      return `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    } else {
      return new Date(selectedYear, selectedMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    }
  }

  // Get months for select dropdown
  const getMonthOptions = () => {
    const months = []
    for (let i = 0; i < 12; i++) {
      months.push({
        value: i.toString(),
        label: new Date(2023, i).toLocaleDateString("en-US", { month: "long" })
      })
    }
    return months
  }

  // Get years for select dropdown (current year and previous 2 years)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear()
    return [
      { value: (currentYear - 2).toString(), label: (currentYear - 2).toString() },
      { value: (currentYear - 1).toString(), label: (currentYear - 1).toString() },
      { value: currentYear.toString(), label: currentYear.toString() }
    ]
  }

  // Status color mapping
  const getStatusColor = (status: "complete" | "incomplete" | "missed") => {
    switch (status) {
      case "complete": return "bg-gradient-to-br from-green-400 to-green-600 text-white"
      case "incomplete": return "bg-gradient-to-br from-red-400 to-red-600 text-white"
      case "missed": return "bg-gray-200 text-gray-700"
    }
  }

  return (
    <Card className="overflow-hidden w-full">
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Calendar className="h-5 w-5" />
            Visual Calendar
          </CardTitle>
          <Tabs value={view} onValueChange={setView} className="ml-auto">
            <TabsList className="bg-indigo-600">
              <TabsTrigger value="week" className="data-[state=active]:bg-white">Week</TabsTrigger>
              <TabsTrigger value="month" className="data-[state=active]:bg-white">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={goToPrevious} 
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>
          
          {view === "week" ? (
            <div className="text-sm font-medium">{getDateRangeDisplay()}</div>
          ) : (
            <div className="flex gap-2">
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {getMonthOptions().map(month => (
                    <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {getYearOptions().map(year => (
                    <SelectItem key={year.value} value={year.value}>{year.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <button 
            onClick={goToNext} 
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="text-sm text-red-500 p-4 text-center">{error}</div>
        ) : (
          <div className={`grid ${view === "week" ? "grid-cols-7" : "grid-cols-7"} gap-2`}>
            {/* Render days of week as headers in month view */}
            {view === "month" && ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
              <div key={day} className="text-center font-medium text-sm py-1">
                {day}
              </div>
            ))}
            
            {/* Empty cells for month view to align first day with correct weekday */}
            {view === "month" && Array.from({length: new Date(selectedYear, selectedMonth, 1).getDay() || 7}).map((_, index) => (
              <div key={`empty-${index}`} className="h-12"></div>
            ))}
            
            {/* Render days */}
            {performanceDays.map((day, index) => (
              <div 
                key={day.date} 
                className={`
                  flex flex-col items-center justify-center p-1
                  ${view === "week" ? "py-3" : "py-2"}
                `}
              >
                <div
                  className={`
                    ${view === "week" ? "w-12 h-12" : "w-10 h-10"} sm:w-14 sm:h-14 rounded-full 
                    flex flex-col items-center justify-center 
                    ${getStatusColor(day.status)}
                    ${day.isToday ? "ring-2 ring-indigo-500" : ""}
                    transition-all duration-300 ease-in-out
                  `}
                >
                  <span className="text-sm sm:text-base font-semibold">
                    {view === "week" ? day.dayName.charAt(0) : day.date.split("-")[2]}
                  </span>
                  {day.count > 0 && (
                    <span className="text-xs font-medium mt-0.5">
                      {day.count}
                    </span>
                  )}
                </div>
                {view === "week" && (
                  <>
                    <span className={`text-xs sm:text-sm mt-1 ${day.isToday ? "font-bold text-indigo-600" : "text-gray-700"}`}>
                      {day.dayName}
                    </span>
                    <span className="text-xs text-gray-500 mt-0.5">
                      {day.date.split("-")[2]}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 pt-4 border-t border-gray-200 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-400 to-green-600"></div>
            <span className="text-gray-700 font-medium">Complete Test</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-400 to-red-600"></div>
            <span className="text-gray-700 font-medium">Incomplete</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <span className="text-gray-700 font-medium">No Activity</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}