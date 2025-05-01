"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { Lightbulb, Clock } from "lucide-react"
// import DailyChallengeButton from "@/components/daily-challenge-button"
import ExamSimulation from "@/components/exam-simulation"
import QuestionFeedback from "@/components/question-feedback" // Import the new component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { toast, Toaster } from "react-hot-toast"
import ChallengeButton from "@/components/challenge-button"
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
  const [activeTab, setActiveTab] = useState<"topics" | "daily">("topics")
  const [statsData, setStatsData] = useState<StatsData | null>(null)
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  const [performanceData, setPerformanceData] = useState<any[]>([])

  // New states for recommended questions functionality
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [recommendedQuestionsToAdd, setRecommendedQuestionsToAdd] = useState<Recommendation[]>([])
  const [isCreatingRecommendedTest, setIsCreatingRecommendedTest] = useState(false)
  const [mode, setMode] = useState<"tutor" | "timer">("tutor")

  const fetchRecommendations = useCallback(async () => {
    setIsLoadingRecommendations(true)
    try {
      const userId = localStorage.getItem("Medical_User_Id")
      if (!userId) {
        console.log("No user ID found in localStorage")
        setIsLoadingRecommendations(false)
        return
      }

      const { data } = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/recommendations3/${userId}`)

      console.log("Recommendation data received:", data) // For debugging

      setRecommendations(data.recommendations)

      // If we got recommendations, show the section
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
          `https://medical-backend-loj4.onrender.com/api/test/recommendations3/${userId}`,
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
          `https://medical-backend-loj4.onrender.com/api/test/user/${userId}/stats`,
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

        const performanceResponse = await axios.get("https://medical-backend-loj4.onrender.com/api/test/performance2", {
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
    // This is a placeholder - in a real app, you would have a mapping of topics to actual resources
    const suggestions = [
      "Review the chapter on this topic in your textbook",
      "Watch video lectures on this subject",
      "Practice with flashcards focused on this area",
      "Join a study group discussion on this topic",
      "Complete practice questions in this subject area",
    ]

    // Use the topic string to generate a consistent but seemingly random suggestion
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

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <Toaster position="top-right" />
        <Tabs defaultValue="topics" className="w-full" onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="topics">Topic Recommendations</TabsTrigger>
            <TabsTrigger value="daily">Daily Challenge</TabsTrigger>
          </TabsList>

          <TabsContent value="topics" className="mt-0">
            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Topic Recommendations</h2>
              {/* <p className="text-muted-foreground mb-8">
                Based on your recent test performance, we recommend focusing on these topics to improve your knowledge.
              </p> */}

              {/* Topic recommendations content commented out as requested */}
              {/*
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <p>Loading recommendations...</p>
                </div>
              ) : topicGroups.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-2">No recommendations yet</h3>
                    <p className="text-muted-foreground text-center max-w-md mb-6">
                      Complete more tests to get personalized topic recommendations based on your performance.
                    </p>
                    <Button onClick={() => (window.location.href = "/dashboard/create-test")}>Take a Test</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {topicGroups.map((group, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className="bg-muted/50">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="flex items-center">
                              <BookMarked className="mr-2 h-5 w-5 text-primary" />
                              {group.topic}
                            </CardTitle>
                            <CardDescription>
                              You missed {group.count} {group.count === 1 ? "question" : "questions"} in this topic
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="bg-primary/10">
                            Priority {index + 1}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                            <h4 className="font-medium flex items-center text-amber-800 dark:text-amber-300 mb-2">
                              <Lightbulb className="h-4 w-4 mr-2" />
                              Study Recommendation
                            </h4>
                            <p className="text-sm text-amber-700 dark:text-amber-400">
                              {getStudyResourceSuggestion(group.topic)}
                            </p>
                          </div>

                          <h4 className="font-medium">Sample Questions You Missed:</h4>
                          <ul className="space-y-3">
                            {group.questions.slice(0, 2).map((question, qIndex) => (
                              <li key={qIndex} className="bg-muted/50 p-3 rounded-lg">
                                <p className="font-medium text-sm">{question.questionText}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Correct answer: {question.correctAnswer}
                                </p>
                              </li>
                            ))}
                          </ul>

                          <div className="flex justify-between items-center pt-2">
                            <Button variant="outline" size="sm" className="text-xs">
                              View Study Materials
                            </Button>
                            <Button size="sm" className="text-xs">
                              Practice This Topic <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              */}
            </div>

            {/* Recommended Questions Section */}
            {showRecommendations && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lightbulb className="mr-2 h-5 w-5 text-amber-500" />
                      Recommended Questions
                    </CardTitle>
                    <CardDescription>
                      Based on your previous tests, we recommend focusing on these questions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-amber-800 dark:text-amber-300">
                          Practice these questions to improve your knowledge in weak areas:
                        </p>
                        <Button
                          onClick={handleCreateRecommendedTest}
                          disabled={
                            isLoadingRecommendations || recommendations.length === 0 || isCreatingRecommendedTest
                          }
                          variant="default"
                          className={`px-4 py-2 text-sm ${
                            isLoadingRecommendations || recommendations.length === 0 || isCreatingRecommendedTest
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {isCreatingRecommendedTest ? (
                            "Creating..."
                          ) : (
                            <>
                              <span className="hidden sm:inline">Create Test from All Recommendations</span>
                              <span className="sm:hidden">Create from All</span>
                            </>
                          )}
                        </Button>
                      </div>

                      {isLoadingRecommendations ? (
                        <div className="text-center py-4">Loading recommendations...</div>
                      ) : recommendations.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          No recommendations available yet. Complete more tests to get personalized suggestions.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {recommendations.map((recommendation, index) => (
                            <div
                              key={index}
                              className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{recommendation.questionText}</p>
                                  <p className="text-sm text-muted-foreground mt-1">Topic: {recommendation.topic}</p>
                                </div>
                                <Button
                                  onClick={() => addRecommendedQuestion(recommendation)}
                                  variant={
                                    selectedRecommendations.includes(recommendation.questionText)
                                      ? "secondary"
                                      : "outline"
                                  }
                                  size="sm"
                                  className="ml-2"
                                >
                                  {selectedRecommendations.includes(recommendation.questionText)
                                    ? "Added ✓"
                                    : "Add to Test"}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedRecommendations.length > 0 && (
                        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-sm text-green-800 dark:text-green-300">
                            <span className="font-medium">{selectedRecommendations.length}</span> recommended{" "}
                            {selectedRecommendations.length === 1 ? "question" : "questions"} will be added to your test
                          </p>
                          <div className="mt-2 flex justify-end">
                            <Button
                              onClick={() => {
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
                              }}
                              size="sm"
                            >
                              Start Test with Selected Questions
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Question Feedback Section - NEW COMPONENT */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-8"
            >
              <QuestionFeedback />
            </motion.div>

            {/* Total Study Hours Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <Card className="overflow-hidden">
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-90"></div>
                  <div className="relative p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium opacity-80">Total Study Hours</p>
                        <p className="text-3xl font-bold mt-1">
                          {isStatsLoading || performanceData.length === 0
                            ? "Loading..."
                            : (performanceData.reduce((sum, item) => sum + item.totalTime, 0) / 3600).toFixed(3)}
                        </p>
                        <p className="text-xs mt-1 opacity-80">
                          Avg {isStatsLoading ? "..." : statsData?.avgTimePerTest?.toFixed(1) || "0"} min/test
                        </p>
                      </div>
                      <div className="p-3 bg-white/20 rounded-lg">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Quick Test Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Quick Test</h2>
              <ExamSimulation />
            </div>
          </TabsContent>

          <TabsContent value="daily" className="mt-0">
            <div className="flex flex-col items-center justify-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-6 text-center">Daily Challenge</h2>
              <p className="text-muted-foreground text-center mb-8">
                Auto-generate 10 questions based on performance and weaknesses.
              </p>
              {/* <DailyChallengeButton /> */}
              <ChallengeButton />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
