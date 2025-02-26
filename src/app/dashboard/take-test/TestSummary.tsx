"use client"

import type React from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import axios from "axios"
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js"
import { AlertCircle, CheckCircle, Clock, Share2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Doughnut } from "react-chartjs-2"
import toast, { Toaster } from "react-hot-toast"

ChartJS.register(ArcElement, Tooltip, Legend)

type TestSummaryProps = {
  questions: {
    _id: string
    question: string
    answer: string
    explanation?: string
  }[]
  selectedAnswers: { [key: number]: string }
  questionTimes: { [key: number]: number }
  score: number
  totalTime: number
}

const TestSummary: React.FC<TestSummaryProps> = ({ questions, selectedAnswers, questionTimes, score, totalTime }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showIncorrectOnly, setShowIncorrectOnly] = useState(false)
  const router = useRouter()

  const percentage = (score / questions.length) * 100
  const incorrectCount = questions.length - score

  const chartData = {
    labels: ["Correct", "Incorrect"],
    datasets: [
      {
        data: [score, incorrectCount],
        backgroundColor: ["#4ade80", "#f87171"],
        hoverBackgroundColor: ["#22c55e", "#ef4444"],
      },
    ],
  }

  const handleSubmitResults = async () => {
    setLoading(true)
    setError(null)
    console.log(questions);
    console.log(selectedAnswers);

    const testData = {
      userId: localStorage.getItem("Medical_User_Id"), // Ensure this is set when user logs in
      questions: questions.map((q, index) => ({
        questionId: q._id,
        questionText: q.question,
        correctAnswer: q.answer,
        userAnswer: selectedAnswers[index] || "",
        timeSpent: questionTimes[index] || 0,
      })),
      score,
      totalTime,
      percentage,
    }

    console.log(testData);

    try {
      const response = await axios.post("https://medical-backend-loj4.onrender.com/api/test/take-test/submit-test", testData, {
        headers: { "Content-Type": "application/json" },
      })

      if (response.status !== 201) {
        throw new Error("Failed to submit test results")
      }

      toast.success("Test Saved Successfully! 🎉")

      setTimeout(() => {
        router.push("/dashboard")
      }, 4500)
    } catch (err) {
      console.error("Error submitting test results:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold mb-8">Test Results</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Score Overview</CardTitle>
            <CardDescription>Your performance at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <p className="text-5xl font-bold text-primary">
                {score}/{questions.length}
              </p>
              <p className="text-xl">{percentage.toFixed(2)}%</p>
            </div>
            <div className="w-48 h-48 mx-auto">
              <Doughnut data={chartData} />
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Total time: {Math.floor(totalTime / 60)} minutes {totalTime % 60} seconds
            </p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>What would you like to do next?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={handleSubmitResults} disabled={loading} className="w-full">
                <CheckCircle className="mr-2" />
                {loading ? "Submitting..." : "Save Results"}
              </Button>
              <Button onClick={() => router.push("/dashboard")} variant="outline" className="w-full">
                <Share2 className="mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <div className="flex items-center space-x-2">
          <Switch id="show-incorrect" checked={showIncorrectOnly} onCheckedChange={setShowIncorrectOnly} />
          <Label htmlFor="show-incorrect">Show incorrect answers only</Label>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => {
          const userAnswer = selectedAnswers[index] || ""
          const isCorrect = userAnswer === question.answer
          const timeSpent = questionTimes[index] || 0

          if (showIncorrectOnly && isCorrect) return null

          return (
            <Card key={question._id}>
              <CardHeader>
                <CardTitle>Question {index + 1}</CardTitle>
                <CardDescription>{question.question}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="mb-2">
                      Your answer:{" "}
                      <span className={isCorrect ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                        {userAnswer || "No answer"}
                      </span>
                    </p>
                    <p className="mb-2">
                      Correct answer: <span className="text-green-600 font-semibold">{question.answer}</span>
                    </p>
                  </div>
                  <div>
                    <p className="flex items-center">
                      <Clock className="mr-2" size={18} />
                      Time spent: {timeSpent} seconds
                    </p>
                    <p className="flex items-center mt-2">
                      {isCorrect ? (
                        <CheckCircle className="mr-2 text-green-500" size={18} />
                      ) : (
                        <AlertCircle className="mr-2 text-red-500" size={18} />
                      )}
                      {isCorrect ? "Correct" : "Incorrect"}
                    </p>
                  </div>
                </div>

                {!isCorrect && question.explanation && (
                  <div className="mt-4 p-4 bg-amber-50 rounded">
                    <h4 className="font-semibold mb-2">Explanation:</h4>
                    <p>{question.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default TestSummary

