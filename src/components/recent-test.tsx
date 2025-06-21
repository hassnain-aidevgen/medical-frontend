"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import axios from "axios"
import { Book, ChevronDown, ChevronUp, Clock, Tag, FileQuestion } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface RecentTest {
  _id: string
  score: number
  totalTime: number
  percentage: number
  questions: Array<{
    questionId: string,
    questionText: string,
    correctAnswer: string,
    userAnswer: string,
    timeSpent: number
  }>
  createdAt: string
  isAIGenerated?: boolean
  aiTopic?: string
}

export default function RecentTest() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [recentTest, setRecentTest] = useState<RecentTest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("Medical_User_Id")
      setUserId(storedUserId)
    }
  }, [])

  useEffect(() => {
    const fetchRecentTest = async () => {
      if (!userId) return

      setIsLoading(true)
      setError(null) // Reset error state
      try {
        // Use localhost for testing, change to production URL for deployment
        const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/recent-test/${userId}`)
        
        if (response.data && response.data.success) {
          setRecentTest(response.data.data)
        } else {
          console.error("Invalid recent test data format:", response.data)
          setError("No recent test data available")
          setRecentTest(null)
        }
      } catch (error) {
        console.error("Error fetching recent test:", error)
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setError("No recent test found")
        } else {
          setError("Failed to fetch recent test data")
        }
        setRecentTest(null)
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchRecentTest()
    } else {
      setIsLoading(false)
      setError("User not found")
    }
  }, [userId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const toggleDetails = () => {
    setShowDetails(!showDetails)
  }

  // Don't render anything if loading and no userId
  if (isLoading && !userId) {
    return null
  }

  return (
    <Card className="overflow-hidden w-full mb-4">
      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Book className="h-5 w-5" />
            Most Recent Test
          </CardTitle>
          {recentTest && (
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-1" />
              {formatDate(recentTest.createdAt)}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : error || !recentTest ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-gray-100 rounded-full p-4 mb-4">
              <FileQuestion className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Tests</h3>
            <p className="text-gray-500 mb-4 max-w-sm">
              You haven't taken any tests yet. Start with your first test to see your progress here.
            </p>
            <Button 
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={() => {
                // Add navigation to test page or trigger test start
                router.push("/dashboard/create-test")
              }}
            >
              Take Your First Test
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">
                  {recentTest.isAIGenerated 
                    ? <div className="flex items-center"><Tag className="h-4 w-4 mr-1" /> {recentTest.aiTopic}</div>
                    : `Test with ${recentTest.questions.length} questions`}
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {recentTest.score}/{recentTest.questions.length}
                </div>
              </div>
              <div className="bg-gray-100 rounded-full p-3">
                <div className="text-xl font-bold text-green-600">{Math.round(recentTest.percentage)}%</div>
              </div>
            </div>
            
            <Progress 
              value={recentTest.percentage} 
              className="h-2"
            />
            
            <div className="flex justify-between text-sm pt-2">
              <div className="flex items-center">
                <span>Time: {formatTime(recentTest.totalTime)}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleDetails} 
                className="flex items-center text-blue-600 hover:text-blue-800 p-0 h-auto"
              >
                {showDetails ? (
                  <>
                    <span className="mr-1">Hide Details</span>
                    <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <span className="mr-1">View Details</span>
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            {/* Detailed view */}
            {showDetails && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="font-medium mb-3">Questions Overview</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {recentTest.questions.map((question, index) => {
                    const isCorrect = question.userAnswer === question.correctAnswer;
                    return (
                      <div key={index} className="p-3 rounded-md bg-gray-50">
                        <div className="flex justify-between mb-1">
                          <div className="text-sm font-medium">Question {index + 1}</div>
                          <div className={`text-xs px-2 py-0.5 rounded-full ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </div>
                        </div>
                        <div className="text-sm mb-2 line-clamp-2">{question.questionText}</div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <div>Your answer: <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>{question.userAnswer || 'No answer'}</span></div>
                          <div>Time: {question.timeSpent}s</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}