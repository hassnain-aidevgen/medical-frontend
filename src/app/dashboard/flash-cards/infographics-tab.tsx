"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import axios from "axios"
import { format } from "date-fns"
import { motion } from "framer-motion"
import { AlertTriangle, BarChart3, Book, Clock, History, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

// Define the types
interface WeakArea {
  category: string
  difficulty: string
  mastery: number
}

interface InfographicData {
  _id: string
  userId: string
  topWeakAreas: WeakArea[]
  summaryText: string
  updatedAt: string
  createdAt: string
}

interface InfographicsTabProps {
  userId: string
}

// const API_URL = "https://medical-backend-loj4.onrender.com/api"
const API_URL = "https://medical-backend-loj4.onrender.com/api" // Localhost for development

export default function InfographicsTab() {
  const [infographicData, setInfographicData] = useState<InfographicData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const userid = localStorage.getItem("Medical_User_Id")

  // Define difficulty colors
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200"
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "hard":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-blue-100 text-blue-800 border-blue-200"
    }
  }

  // Fetch infographic data
  const fetchInfographic = async () => {
    if (!userid) return

    setIsLoading(true)
    setError(null)

    try {
      const { data } = await axios.get(`${API_URL}/infographic?userId=${userid}`)
      console.log("Fetched Infographic:", data)
      setInfographicData(data.infographic)
    } catch (error) {
      console.error("Error fetching infographic:", error)
      if ((error as any)?.response?.status === 404) {
        // If no infographic exists yet, don't show error
        setError(null)
      } else {
        setError("Failed to load infographics data. Please try again later.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Generate new infographic
  const generateInfographic = async () => {
    if (!userid) return

    setIsGenerating(true)
    setError(null)

    try {
      const response = await axios.post(`${API_URL}/infographic`, { userid })
      console.log("Generated Infographic:", response.data)
      setInfographicData(response.data.infographic)
      toast.success("Infographic successfully generated!")

      // Refresh the data to show the latest infographic
      fetchInfographic()
    } catch (error) {
      console.error("Error generating infographic:", error)
      setError("Failed to generate new infographics. Please try again later.")
      toast.error("Failed to generate infographic. Please try again later.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Initial data load
  useEffect(() => {
    if (userid) {
      fetchInfographic()
    }
  }, [userid])

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Error Loading Infographics</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4 text-center">{error}</p>
        <Button onClick={fetchInfographic}>Try Again</Button>
      </div>
    )
  }

  // If no data and no error, prompt to generate
  if (!infographicData) {
    return (
      <Card className="bg-white dark:bg-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Flashcard Insights</CardTitle>
          <CardDescription>Generate an AI-powered analysis of your learning progress</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-16 w-16 text-amber-500 mb-6" />
          <h3 className="text-xl font-semibold mb-2">No Infographics Available</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6 text-center max-w-lg">
            Generate your first infographic to get AI-powered insights into your learning patterns, identify weak spots,
            and get personalized recommendations.
          </p>
          <Button onClick={generateInfographic} disabled={isGenerating} className="bg-amber-500 hover:bg-amber-600">
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <BarChart3 className="mr-2 h-4 w-4" />
                Generate Infographic
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Parse and format the data with validation
  let formattedDate = "Unknown date"
  let formattedCreated = "Unknown date"

  try {
    if (infographicData.updatedAt) {
      const lastUpdated = new Date(infographicData.updatedAt)
      if (!isNaN(lastUpdated.getTime())) {
        formattedDate = format(lastUpdated, "MMM d, yyyy 'at' h:mm a")
      }
    }

    if (infographicData.createdAt) {
      const createdAt = new Date(infographicData.createdAt)
      if (!isNaN(createdAt.getTime())) {
        formattedCreated = format(createdAt, "MMM d, yyyy")
      }
    }
  } catch (error) {
    console.error("Error formatting dates:", error)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div>
          <h2 className="text-xl font-semibold mb-1">Flashcard Insights</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">AI-powered analysis of your learning progress</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" onClick={fetchInfographic} disabled={isLoading}>
            <History className="mr-2 h-4 w-4" />
            View Latest
          </Button>
          <Button
            variant="default"
            className="bg-amber-500 hover:bg-amber-600"
            onClick={generateInfographic}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Generate New
          </Button>
        </div>
      </div>

      <Card className="bg-white dark:bg-slate-800 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Learning Focus Areas</CardTitle>
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              Last updated: {formattedDate}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-slate-700 dark:text-slate-300">Your Top Weak Areas</h3>
              {infographicData.topWeakAreas.map((area, index) => (
                <motion.div
                  key={`${area.category}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-slate-700 p-4 rounded-lg shadow-sm"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{area.category}</h4>
                    <Badge className={getDifficultyColor(area.difficulty)}>{area.difficulty}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Mastery</span>
                      <span className="font-medium">{area.mastery}%</span>
                    </div>
                    <Progress value={area.mastery} className="h-2 bg-slate-200 dark:bg-slate-600" />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-lg">
              <div className="flex items-start mb-4">
                <Book className="h-5 w-5 text-amber-600 dark:text-amber-500 mr-2 mt-1 flex-shrink-0" />
                <h3 className="font-medium text-amber-800 dark:text-amber-500">AI Recommended Focus</h3>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {infographicData.summaryText.split("\n").map((paragraph, i) => (
                  <p key={i} className="mb-2 text-slate-700 dark:text-slate-300">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-slate-200 dark:border-slate-700 pt-4 text-xs text-slate-500 dark:text-slate-400">
          Infographic first created on {formattedCreated}
        </CardFooter>
      </Card>
    </div>
  )
}
