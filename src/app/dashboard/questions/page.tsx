"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { Lightbulb, Clock, BookOpen, BarChart, Book, Brain } from "lucide-react"
import ExamSimulation from "@/components/exam-simulation"
import QuestionFeedback from "@/components/question-feedback"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { toast, Toaster } from "react-hot-toast"
import ChallengeButton from "@/components/challenge-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Recommendation {
  questionText: string
  correctAnswer: string
  topic: string
  _id?: string
}

interface TopicGroup {
  topic: string
  count: number
  questions: Recommendation[]
}

interface StatsData {
  totalTestsTaken: number
  totalQuestionsAttempted: number
  totalQuestionsCorrect: number
  totalQuestionsWrong: number
  avgTimePerTest: number
  totalStudyHours: number
}

export default function QuestionsPage() {
  const router = useRouter()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [topicGroups, setTopicGroups] = useState<TopicGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statsData, setStatsData] = useState<StatsData | null>(null)
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  const [performanceData, setPerformanceData] = useState<any[]>([])

  // States for recommended questions functionality
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [recommendedQuestionsToAdd, setRecommendedQuestionsToAdd] = useState<Recommendation[]>([])
  const [isCreatingRecommendedTest, setIsCreatingRecommendedTest] = useState(false)
  const [mode, setMode] = useState<"tutor" | "timer">("tutor")
  const [activeTab, setActiveTab] = useState("recommendations")

  const fetchRecommendations = useCallback(async () => {
    setIsLoadingRecommendations(true)
    try {
      const userId = localStorage.getItem("Medical_User_Id")
      if (!userId) {
        console.log("No user ID found in localStorage")
        setIsLoadingRecommendations(false)
        return
      }

      const { data } = await axios.get(`https://medical-backend-3eek.onrender.com/api/test/recommendations4/${userId}`)

      console.log("Recommendation data received:", data)

      setRecommendations(data.recommendations)

      if (data.recommendations && data.recommendations.length > 0) {
        setShowRecommendations(true)
      } else {
        setShowRecommendations(false)
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error)
      setShowRecommendations(false)
    } finally {
      setIsLoadingRecommendations(false)
    }
  }, [])

  useEffect(() => {
    const fetchRecommendationsData = async () => {
      setIsLoading(true)
      try {
        const userId = localStorage.getItem("Medical_User_Id")
        if (!userId) {
          console.log("No user ID found in localStorage")
          setIsLoading(false)
          return
        }

        const { data } = await axios.get(
          `https://medical-backend-3eek.onrender.com/api/test/recommendations4/${userId}`,
        )

        if (data.recommendations && data.recommendations.length > 0) {
          setRecommendations(data.recommendations)

          // Group recommendations by topic
          const groupedByTopic = data.recommendations.reduce(
            (acc: Record<string, Recommendation[]>, item: Recommendation) => {
              const topic = item.topic || "Unknown Topic"
              if (!acc[topic]) {
                acc[topic] = []
              }
              acc[topic].push(item)
              return acc
            },
            {},
          )

          // Convert to array of topic groups
          const topicGroupsArray = Object.entries(groupedByTopic).map(([topic, questions]) => ({
            topic,
            count: (questions as Recommendation[]).length,
            questions: questions as Recommendation[],
          }))

          // Sort by count (most questions first)
          topicGroupsArray.sort((a, b) => b.count - a.count)

          setTopicGroups(topicGroupsArray)
        }
      } catch (error) {
        console.error("Error fetching recommendations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const fetchStatsData = async () => {
      setIsStatsLoading(true)
      try {
        const userId = localStorage.getItem("Medical_User_Id")
        if (!userId) {
          console.log("No user ID found in localStorage")
          setIsStatsLoading(false)
          return
        }

        const response = await axios.get<StatsData>(
          `https://medical-backend-3eek.onrender.com/api/performanceTracking/user/${userId}/stats`,
        )
        setStatsData(response.data)
      } catch (error) {
        console.error("Error fetching stats data:", error)
      } finally {
        setIsStatsLoading(false)
      }
    }

    const fetchPerformanceData = async () => {
      try {
        const userId = localStorage.getItem("Medical_User_Id")
        if (!userId) {
          return
        }

        const performanceResponse = await axios.get("https://medical-backend-3eek.onrender.com/api/performanceTracking/performance2", {
          params: { userId },
        })

        if (performanceResponse.data.success) {
          setPerformanceData(performanceResponse.data.results)
        } else {
          console.error("Failed to load performance data")
        }
      } catch (error) {
        console.error("Error fetching performance data:", error)
      }
    }

    fetchRecommendationsData()
    fetchStatsData()
    fetchPerformanceData()
    fetchRecommendations()
  }, [fetchRecommendations])

  // Function to get a study resource suggestion based on topic
  const getStudyResourceSuggestion = (topic: string) => {
    const suggestions = [
      "Review the chapter on this topic in your textbook",
      "Watch video lectures on this subject",
      "Practice with flashcards focused on this area",
      "Join a study group discussion on this topic",
      "Complete practice questions in this subject area",
    ]

    const index = topic.length % suggestions.length
    return suggestions[index]
  }

  // Function to add a recommended question to the test
  const addRecommendedQuestion = (recommendation: Recommendation) => {
    setSelectedRecommendations((prev) => {
      if (prev.includes(recommendation.questionText)) {
        // Remove if already selected
        setRecommendedQuestionsToAdd((current) => current.filter((q) => q.questionText !== recommendation.questionText))
        return prev.filter((id) => id !== recommendation.questionText)
      } else {
        // Add with a unique ID to ensure it's processed correctly
        const enhancedRecommendation = {
          ...recommendation,
          uniqueId: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        }

        // Add if not already selected
        setRecommendedQuestionsToAdd((current) => [...current, enhancedRecommendation])
        return [...prev, recommendation.questionText]
      }
    })
  }

  // Function to create test with only recommended questions
  const handleCreateRecommendedTest = () => {
    if (recommendations.length === 0) {
      toast.error("No recommendations available")
      return
    }

    setIsCreatingRecommendedTest(true)

    try {
      // Create URL parameters for recommended questions test
      const params = new URLSearchParams({
        mode,
        isRecommendedTest: "true",
      })

      // Add the recommendations with a uniqueId to ensure they're processed correctly
      const recommendationsWithIds = recommendations.map((rec, index) => ({
        ...rec,
        uniqueId: `rec_${Date.now()}_${index}`, // Add a unique identifier
      }))

      // Add all recommendations to the test
      params.append("recommendedQuestions", JSON.stringify(recommendationsWithIds))

      // Force cache bust with timestamp
      params.append("t", Date.now().toString())

      // Navigate to the test page
      router.push(`/dashboard/take-test?${params.toString()}`)
    } catch (error) {
      console.error("Error creating recommended test:", error)
      toast.error("An error occurred. Please try again.")
      setIsCreatingRecommendedTest(false)
    }
  }

  // Function to create test with selected recommended questions
  const handleCreateSelectedTest = () => {
    if (recommendedQuestionsToAdd.length === 0) {
      toast.error("No questions selected")
      return
    }

    try {
      // Create URL parameters for selected recommended questions
      const params = new URLSearchParams({
        mode,
        isRecommendedTest: "true",
      })

      // Add the selected recommendations
      params.append("recommendedQuestions", JSON.stringify(recommendedQuestionsToAdd))

      // Force cache bust with timestamp
      params.append("t", Date.now().toString())

      // Navigate to the test page
      router.push(`/dashboard/take-test?${params.toString()}`)
    } catch (error) {
      console.error("Error creating test with selected recommendations:", error)
      toast.error("An error occurred. Please try again.")
    }
  }

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto pb-16">
        <Toaster position="top-right" />

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Study Hours Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="col-span-1"
          >
            <Card className="h-full overflow-hidden border-green-200 dark:border-green-800">
              <div className="h-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-90"></div>
                <div className="relative p-6 text-white h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Total Study Hours</h3>
                    <div className="p-3 bg-white/20 rounded-lg">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-4xl font-bold">
                      {isStatsLoading || performanceData.length === 0
                        ? "0"
                        : (performanceData.reduce((sum, item) => sum + item.totalTime, 0) / 3600).toFixed(3)}
                    </p>
                    <p className="text-sm mt-2 opacity-90">
                      Average {isStatsLoading ? "0" : statsData?.avgTimePerTest?.toFixed(1) || "0"} min/test
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Questions Answered Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="col-span-1"
          >
            <Card className="h-full overflow-hidden border-blue-200 dark:border-blue-800">
              <div className="h-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-90"></div>
                <div className="relative p-6 text-white h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Questions Completed</h3>
                    <div className="p-3 bg-white/20 rounded-lg">
                      <BarChart className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-4xl font-bold">
                      {isStatsLoading ? "0" : statsData?.totalQuestionsAttempted || "0"}
                    </p>
                    <p className="text-sm mt-2 opacity-90">
                      Accuracy:{" "}
                      {isStatsLoading
                        ? "0"
                        : Math.round(
                            ((statsData?.totalQuestionsCorrect || 0) / (statsData?.totalQuestionsAttempted || 1)) * 100,
                          )}
                      %
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Daily Challenge Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="col-span-1"
          >
            <Card className="h-full overflow-hidden border-purple-200 dark:border-purple-800">
              <div className="h-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-90"></div>
                <div className="relative p-6 text-white h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Daily Challenge</h3>
                    <div className="p-3 bg-white/20 rounded-lg">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm mb-4">Test your knowledge with 10 questions based on your performance</p>
                    <ChallengeButton />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
        
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Study Mode</CardTitle>
                <CardDescription>Choose how you want to practice questions</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="quick" className="w-full">
                  <TabsList className="grid grid-cols-2 mb-6">
                    <TabsTrigger value="quick">Quick Simulation</TabsTrigger>
                    <TabsTrigger value="isolated">Isolated Questions</TabsTrigger>
                  </TabsList>
                  <TabsContent value="quick" className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-2">Quick Exam Simulation</h3>
                      <p className="text-muted-foreground mb-4">
                        Practice with a simulated exam environment to test your knowledge under time pressure
                      </p>
                      <ExamSimulation />
                    </div>
                  </TabsContent>
                  <TabsContent value="isolated" className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-2">Isolated Question Mode</h3>
                      <p className="text-muted-foreground mb-4">
                        Focus on individual questions with detailed explanations and feedback
                      </p>
                      <ExamSimulation />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div> */}

       
          {showRecommendations && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="overflow-hidden border-amber-200 dark:border-amber-800">
                <CardHeader className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900">
                  <CardTitle className="flex items-center">
                    <Lightbulb className="mr-2 h-5 w-5 text-amber-500" />
                    Recommended Questions
                  </CardTitle>
                  <CardDescription>Focus on these questions to improve your knowledge in weak areas</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {isLoadingRecommendations ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent mb-4"></div>
                      <p>Loading recommendations...</p>
                    </div>
                  ) : recommendations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <BookOpen className="h-16 w-16 text-muted-foreground mb-6" />
                      <h3 className="text-xl font-medium mb-4">No recommendations yet</h3>
                      <p className="text-muted-foreground max-w-md mb-8">
                        Complete more tests to get personalized question recommendations based on your performance.
                      </p>
                      <Button size="lg" onClick={() => router.push("/dashboard/create-test")}>
                        Take a Test
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <p className="text-amber-800 dark:text-amber-300 font-medium">
                            {recommendations.length} recommended questions available
                          </p>
                          <p className="text-sm text-muted-foreground">Based on your recent performance analysis</p>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            onClick={() => setMode(mode === "tutor" ? "timer" : "tutor")}
                            variant="outline"
                            size="sm"
                          >
                            Mode: {mode === "tutor" ? "Tutor" : "Timer"}
                          </Button>
                          <Button
                            onClick={handleCreateRecommendedTest}
                            disabled={
                              isLoadingRecommendations || recommendations.length === 0 || isCreatingRecommendedTest
                            }
                            variant="default"
                            size="sm"
                          >
                            {isCreatingRecommendedTest ? "Creating..." : "Practice All Questions"}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 rounded-md">
                        {recommendations.map((recommendation, index) => (
                          <div
                            key={index}
                            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <p className="font-medium text-sm mb-2">{recommendation.questionText}</p>
                                <div className="flex items-center">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                                    {recommendation.topic}
                                  </span>
                                </div>
                              </div>
                              <Button
                                onClick={() => addRecommendedQuestion(recommendation)}
                                variant={
                                  selectedRecommendations.includes(recommendation.questionText)
                                    ? "secondary"
                                    : "outline"
                                }
                                size="sm"
                                className="shrink-0"
                              >
                                {selectedRecommendations.includes(recommendation.questionText) ? "Added ✓" : "Add"}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {selectedRecommendations.length > 0 && (
                        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex justify-between items-center">
                            <p className="text-green-800 dark:text-green-300 font-medium">
                              <span className="font-bold">{selectedRecommendations.length}</span> recommended{" "}
                              {selectedRecommendations.length === 1 ? "question" : "questions"} selected
                            </p>
                            <Button onClick={handleCreateSelectedTest} size="sm">
                              Practice Selected Questions
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Question Feedback Section - Moved to End */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="bg-blue-50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900">
                <CardTitle className="flex items-center">
                  <Book className="mr-2 h-5 w-5 text-blue-500" />
                  Performance Feedback
                </CardTitle>
                <CardDescription>Review your recent performance and get personalized feedback</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <QuestionFeedback />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
